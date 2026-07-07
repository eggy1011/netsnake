import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  DEFAULT_SETTINGS,
  GRID_SIZE,
  MAX_ENERGY,
  type Direction,
  type Food,
  type FloatingText,
  type GameSettings,
  type GameState,
  type PersistedStats,
  type Point,
  type QuestionTrigger,
} from "../types/game";
import type {
  AnswerEvaluation,
  LearningQuestion,
  ProgressMap,
} from "../types/questions";
import {
  hitsBody,
  hitsObstacle,
  hitsWall,
  samePoint,
} from "../utils/collisionDetection";
import { generateObstacles, spawnFood } from "../utils/foodGeneration";
import {
  energyCostPerMove,
  tierForScore,
  tickInterval,
} from "../utils/difficulty";
import { playSound, type SoundName } from "../utils/sound";
import { selectQuestion } from "../questions/questionSelector";
import { evaluationService } from "../questions/evaluationService";
import { recordAttempt } from "../questions/questionProgress";

/* ------------------------------------------------------------------ */
/* State & actions                                                     */
/* ------------------------------------------------------------------ */

type FullState = GameState & {
  questionRequest: QuestionTrigger | null;
  pendingSounds: SoundName[];
  pendingGrowth: number;
};

type Action =
  | { type: "START"; settings: GameSettings }
  | { type: "TICK"; deltaMs: number }
  | { type: "QUEUE_DIRECTION"; direction: Direction }
  | { type: "TOGGLE_PAUSE" }
  | { type: "REQUEST_QUESTION"; trigger: QuestionTrigger }
  | { type: "QUESTION_LOADED"; question: LearningQuestion }
  | { type: "SET_EVALUATION"; evaluation: AnswerEvaluation; playerAnswer: string }
  | { type: "CONTINUE_AFTER_QUESTION" }
  | { type: "CANCEL_QUESTION" }
  | { type: "GO_HOME" }
  | { type: "TOGGLE_SOUND" }
  | { type: "CLEAR_SOUNDS" };

const OPPOSITE: Record<Direction, Direction> = {
  up: "down", down: "up", left: "right", right: "left",
};

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let floatId = 1;

function float(text: string, position: Point, color: string, tick: number): FloatingText {
  return { id: floatId++, text, position, color, bornAtTick: tick };
}

function initialState(settings: GameSettings): FullState {
  const mid = Math.floor(GRID_SIZE / 2);
  const snake: Point[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  const tier = tierForScore(0);
  const obstacles = generateObstacles(tier.obstacleCount, snake);
  const foods: Food[] = [];
  const normal = spawnFood("normal", [...snake, ...obstacles], 0);
  if (normal) foods.push(normal);

  return {
    status: "playing",
    snake,
    direction: "right",
    directionQueue: [],
    foods,
    obstacles,
    score: 0,
    energy: MAX_ENERGY,
    intensity: tier.tier,
    tick: 0,
    playedMs: 0,
    endedByTimer: false,
    activeQuestion: null,
    floatingTexts: [],
    answeredQuestions: [],
    runStats: { questionsAnswered: 0, correctAnswers: 0, highestTier: tier.tier },
    settings,
    questionRequest: null,
    pendingSounds: [],
    pendingGrowth: 0,
  };
}

const START_SCREEN_STATE: FullState = {
  ...initialState(DEFAULT_SETTINGS),
  status: "start",
};

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

function reducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case "START":
      return initialState(action.settings);

    case "GO_HOME":
      return { ...START_SCREEN_STATE, settings: state.settings };

    case "TOGGLE_SOUND":
      return {
        ...state,
        settings: { ...state.settings, soundOn: !state.settings.soundOn },
      };

    case "CLEAR_SOUNDS":
      return state.pendingSounds.length ? { ...state, pendingSounds: [] } : state;

    case "QUEUE_DIRECTION": {
      if (state.status !== "playing") return state;
      const last =
        state.directionQueue[state.directionQueue.length - 1] ?? state.direction;
      if (action.direction === last || action.direction === OPPOSITE[last]) {
        return state;
      }
      return {
        ...state,
        directionQueue: [...state.directionQueue.slice(-1), action.direction],
      };
    }

    case "TOGGLE_PAUSE": {
      if (state.status === "playing") return { ...state, status: "paused" };
      if (state.status === "paused") return { ...state, status: "playing" };
      return state;
    }

    case "REQUEST_QUESTION": {
      if (state.status !== "playing") return state;
      return {
        ...state,
        status: "question",
        questionRequest: action.trigger,
        activeQuestion: null,
        pendingSounds: [...state.pendingSounds, "question"],
      };
    }

    case "QUESTION_LOADED": {
      if (state.status !== "question" || !state.questionRequest) return state;
      return {
        ...state,
        activeQuestion: {
          question: action.question,
          trigger: state.questionRequest,
          evaluation: null,
        },
        questionRequest: null,
      };
    }

    case "SET_EVALUATION": {
      const aq = state.activeQuestion;
      if (!aq || aq.evaluation) return state;
      // Question food grants a bonus multiplier on good answers.
      const multiplier =
        aq.trigger === "food" && action.evaluation.verdict !== "incorrect"
          ? 1.5
          : 1;
      // Energy must never exceed MAX.
      const granted = Math.max(
        0,
        Math.min(
          Math.round(action.evaluation.energyReward * multiplier),
          MAX_ENERGY - Math.floor(state.energy)
        )
      );
      const evaluation = { ...action.evaluation, energyReward: granted };
      const sound: SoundName =
        evaluation.verdict === "excellent" || evaluation.verdict === "correct"
          ? "correct"
          : evaluation.verdict === "partially_correct"
            ? "partial"
            : "wrong";
      return {
        ...state,
        activeQuestion: { ...aq, evaluation },
        answeredQuestions: [
          ...state.answeredQuestions,
          { question: aq.question, evaluation, playerAnswer: action.playerAnswer },
        ],
        runStats: {
          ...state.runStats,
          questionsAnswered: state.runStats.questionsAnswered + 1,
          correctAnswers:
            state.runStats.correctAnswers +
            (evaluation.verdict === "correct" || evaluation.verdict === "excellent"
              ? 1
              : 0),
        },
        pendingSounds: [...state.pendingSounds, sound],
      };
    }

    case "CONTINUE_AFTER_QUESTION": {
      const aq = state.activeQuestion;
      if (state.status !== "question" || !aq?.evaluation) return state;
      const head = state.snake[0];
      const gained = aq.evaluation.energyReward;
      return {
        ...state,
        status: "playing",
        activeQuestion: null,
        energy: Math.min(MAX_ENERGY, state.energy + gained),
        floatingTexts: [
          ...state.floatingTexts,
          float(`+${gained}⚡`, head, "#22d3ee", state.tick),
        ],
      };
    }

    case "CANCEL_QUESTION": {
      // No eligible question exists (e.g. "incorrect only" with a perfect
      // record). Refill some energy so an energy-trigger doesn't instantly
      // re-fire, and resume play.
      if (state.status !== "question") return state;
      return {
        ...state,
        status: "playing",
        activeQuestion: null,
        questionRequest: null,
        energy: Math.max(state.energy, 40),
      };
    }

    case "TICK":
      return tickReducer(state, action.deltaMs);

    default:
      return state;
  }
}

function tickReducer(state: FullState, deltaMs: number): FullState {
  if (state.status !== "playing") return state;

  const sounds: SoundName[] = [];
  const tick = state.tick + 1;
  const playedMs = state.playedMs + deltaMs;

  // Optional game duration (gameplay setting, not a learning level).
  if (
    state.settings.durationMin > 0 &&
    playedMs >= state.settings.durationMin * 60_000
  ) {
    return {
      ...state,
      playedMs,
      status: "gameover",
      endedByTimer: true,
      pendingSounds: [...state.pendingSounds, "gameover"],
    };
  }

  let direction = state.direction;
  let directionQueue = state.directionQueue;
  if (directionQueue.length > 0) {
    direction = directionQueue[0];
    directionQueue = directionQueue.slice(1);
  }

  const head = state.snake[0];
  let newHead = { x: head.x + DELTA[direction].x, y: head.y + DELTA[direction].y };

  // Wall collision mode: solid walls end the run; wrap mode teleports.
  if (hitsWall(newHead)) {
    if (state.settings.wallMode === "wrap") {
      newHead = {
        x: (newHead.x + GRID_SIZE) % GRID_SIZE,
        y: (newHead.y + GRID_SIZE) % GRID_SIZE,
      };
    } else {
      return {
        ...state,
        playedMs,
        status: "gameover",
        pendingSounds: [...state.pendingSounds, "gameover"],
      };
    }
  }

  const growing = state.pendingGrowth > 0;
  const bodyToCheck = growing ? state.snake : state.snake.slice(0, -1);

  if (hitsBody(newHead, bodyToCheck) || hitsObstacle(newHead, state.obstacles)) {
    return {
      ...state,
      playedMs,
      status: "gameover",
      pendingSounds: [...state.pendingSounds, "gameover"],
    };
  }

  let snake = [newHead, ...state.snake];
  let pendingGrowth = state.pendingGrowth;
  if (pendingGrowth > 0) {
    pendingGrowth--;
  } else {
    snake = snake.slice(0, -1);
  }

  let score = state.score;
  let energy = state.energy;
  let foods = state.foods.filter(
    (f) => f.expiresAtTick === undefined || f.expiresAtTick > tick
  );
  let floatingTexts = state.floatingTexts.filter((t) => tick - t.bornAtTick < 10);
  let questionRequest: QuestionTrigger | null = null;

  const tier = tierForScore(score);

  /* --- Eating --- */
  const eaten = foods.find((f) => samePoint(f.position, newHead));
  if (eaten) {
    foods = foods.filter((f) => f.id !== eaten.id);
    pendingGrowth += 1;

    if (eaten.type === "normal") {
      score += 10;
      energy = Math.min(MAX_ENERGY, energy + 5);
      floatingTexts = [...floatingTexts, float("+10", newHead, "#4ade80", tick)];
      sounds.push("eat");
      const occupied = [
        ...snake,
        ...state.obstacles,
        ...foods.map((f) => f.position),
      ];
      if (Math.random() < tier.bonusChance) {
        const bonus = spawnFood("bonus", occupied, tick);
        if (bonus) foods = [...foods, bonus];
      } else if (
        Math.random() < tier.questionFoodChance &&
        !foods.some((f) => f.type === "question")
      ) {
        const qf = spawnFood("question", occupied, tick);
        if (qf) foods = [...foods, qf];
      }
    } else if (eaten.type === "bonus") {
      score += 30;
      energy = Math.min(MAX_ENERGY, energy + 15);
      floatingTexts = [...floatingTexts, float("+30★", newHead, "#facc15", tick)];
      sounds.push("bonus");
    } else {
      score += 20;
      floatingTexts = [...floatingTexts, float("+20?", newHead, "#c084fc", tick)];
      questionRequest = "food";
    }
  }

  /* --- Energy drain --- */
  const previousEnergy = energy;
  energy = Math.max(0, energy - energyCostPerMove(tier, state.settings));
  if (previousEnergy > 10 && energy <= 10 && energy > 0) sounds.push("lowEnergy");
  if (energy <= 0 && questionRequest === null) {
    questionRequest = "energy";
  }

  /* --- Challenge intensity ramps with score (gameplay only) --- */
  const newTier = tierForScore(score);
  let obstacles = state.obstacles;
  if (newTier.tier > state.intensity) {
    floatingTexts = [
      ...floatingTexts,
      float(`SPEED UP! ${newTier.label}`, newHead, "#f472b6", tick),
    ];
    if (newTier.obstacleCount > obstacles.length) {
      obstacles = [
        ...obstacles,
        ...generateObstacles(newTier.obstacleCount - obstacles.length, snake),
      ];
    }
  }

  /* --- Keep one normal food on the board --- */
  if (!foods.some((f) => f.type === "normal")) {
    const nf = spawnFood("normal", [
      ...snake,
      ...obstacles,
      ...foods.map((f) => f.position),
    ], tick);
    if (nf) foods = [...foods, nf];
  }

  const openingQuestion = questionRequest !== null;
  if (openingQuestion) sounds.push("question");

  return {
    ...state,
    status: openingQuestion ? "question" : "playing",
    snake,
    direction,
    directionQueue,
    foods,
    obstacles,
    score,
    energy,
    intensity: newTier.tier,
    tick,
    playedMs,
    floatingTexts,
    questionRequest,
    activeQuestion: null,
    pendingGrowth,
    runStats: {
      ...state.runStats,
      highestTier: Math.max(state.runStats.highestTier, newTier.tier),
    },
    pendingSounds: [...state.pendingSounds, ...sounds],
  };
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useSnakeGame(
  settings: GameSettings,
  updateStats: (update: (prev: PersistedStats) => PersistedStats) => void,
  progress: ProgressMap,
  updateProgress: (update: (prev: ProgressMap) => ProgressMap) => void
) {
  const [state, dispatch] = useReducer(reducer, START_SCREEN_STATE);

  /** Ids served this session — non-repeating until the pool is exhausted. */
  const servedIds = useRef<Set<string>>(new Set());
  const progressRef = useRef(progress);
  progressRef.current = progress;

  /* Fetch a question whenever one is requested. */
  useEffect(() => {
    if (state.status !== "question" || !state.questionRequest) return;
    const question = selectQuestion({
      courseId: state.settings.courseId,
      moduleIds: state.settings.moduleIds,
      studyMode: state.settings.studyMode,
      progress: progressRef.current,
      servedIds: servedIds.current,
      recentIds: state.answeredQuestions.map((a) => a.question.id),
    });
    if (question) {
      dispatch({ type: "QUESTION_LOADED", question });
    } else {
      // No questions match (e.g. "incorrect only" with a perfect record) —
      // resume play rather than deadlock.
      dispatch({ type: "CANCEL_QUESTION" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.questionRequest]);

  /* Play queued sounds. */
  useEffect(() => {
    if (state.pendingSounds.length === 0) return;
    state.pendingSounds.forEach((s) => playSound(s, state.settings.soundOn));
    dispatch({ type: "CLEAR_SOUNDS" });
  }, [state.pendingSounds, state.settings.soundOn]);

  /* Persist stats on game over. */
  useEffect(() => {
    if (state.status !== "gameover") return;
    const { score, snake, runStats } = state;
    updateStats((prev) => ({
      ...prev,
      highScore: Math.max(prev.highScore, score),
      bestLength: Math.max(prev.bestLength, snake.length),
      questionsAnswered: prev.questionsAnswered + runStats.questionsAnswered,
      correctAnswers: prev.correctAnswers + runStats.correctAnswers,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  /* Keyboard controls. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
        W: "up", S: "down", A: "left", D: "right",
      };
      const dir = map[e.key];
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (dir && !typing) {
        e.preventDefault();
        dispatch({ type: "QUEUE_DIRECTION", direction: dir });
      } else if ((e.key === " " || e.key === "p" || e.key === "P") && !typing) {
        e.preventDefault();
        dispatch({ type: "TOGGLE_PAUSE" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tier = tierForScore(state.score);
  const stepMs = tickInterval(tier, state.settings, state.snake.length);

  /* API */
  const start = useCallback((s: GameSettings) => {
    servedIds.current = new Set();
    dispatch({ type: "START", settings: s });
  }, []);
  const restart = useCallback(() => {
    servedIds.current = new Set();
    dispatch({ type: "START", settings });
  }, [settings]);
  const goHome = useCallback(() => dispatch({ type: "GO_HOME" }), []);
  const toggleSound = useCallback(() => dispatch({ type: "TOGGLE_SOUND" }), []);
  const togglePause = useCallback(() => dispatch({ type: "TOGGLE_PAUSE" }), []);
  const queueDirection = useCallback(
    (d: Direction) => dispatch({ type: "QUEUE_DIRECTION", direction: d }),
    []
  );
  const requestQuestion = useCallback(
    () => dispatch({ type: "REQUEST_QUESTION", trigger: "voluntary" }),
    []
  );
  const submitAnswer = useCallback(
    async (playerAnswer: string) => {
      const aq = state.activeQuestion;
      if (!aq || aq.evaluation) return;
      // Prevent duplicate submissions while an evaluation is in flight.
      if (evaluationService.isPending(aq.question.id)) return;
      try {
        const evaluation = await evaluationService.evaluateAnswer(
          aq.question,
          playerAnswer
        );
        dispatch({ type: "SET_EVALUATION", evaluation, playerAnswer });
        updateProgress((prev) => recordAttempt(prev, aq.question, evaluation));
      } catch {
        /* duplicate submission — the in-flight evaluation will resolve */
      }
    },
    [state.activeQuestion, updateProgress]
  );
  const continueGame = useCallback(
    () => dispatch({ type: "CONTINUE_AFTER_QUESTION" }),
    []
  );
  const step = useCallback(
    () => dispatch({ type: "TICK", deltaMs: stepMs }),
    [stepMs]
  );

  return {
    state,
    stepMs,
    tierLabel: tier.label,
    start,
    restart,
    goHome,
    toggleSound,
    togglePause,
    queueDirection,
    requestQuestion,
    submitAnswer,
    continueGame,
    step,
  };
}
