import type {
  AnswerEvaluation,
  LearningQuestion,
} from "./questions";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const GRID_SIZE = 24;
export const MAX_ENERGY = 100;
export const ENERGY_COST_PER_MOVE = 1;

/* ------------------------------------------------------------------ */
/* Core primitives                                                     */
/* ------------------------------------------------------------------ */

export type Point = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";

export type FoodType = "normal" | "bonus" | "question";

export type Food = {
  id: number;
  type: FoodType;
  position: Point;
  expiresAtTick?: number;
};

export type FloatingText = {
  id: number;
  text: string;
  position: Point;
  color: string;
  bornAtTick: number;
};

/* ------------------------------------------------------------------ */
/* Settings & persistence                                              */
/* ------------------------------------------------------------------ */

export type SpeedSetting = "relaxed" | "standard" | "fast";
export type DrainSetting = "normal" | "high";
export type WallMode = "walls" | "wrap";
/** Minutes; 0 = unlimited. */
export type DurationSetting = 0 | 5 | 10 | 15;

/** Which questions from the chosen course/modules are eligible. */
export type StudyMode = "all" | "weak" | "incorrect";

export type GameSettings = {
  /* Learning selection — independent from gameplay difficulty. */
  courseId: string;
  /** null = entire course. */
  moduleIds: string[] | null;
  studyMode: StudyMode;

  /* Gameplay settings (never described as learning levels). */
  speed: SpeedSetting;
  drain: DrainSetting;
  wallMode: WallMode;
  durationMin: DurationSetting;
  soundOn: boolean;
};

export const DEFAULT_SETTINGS: GameSettings = {
  courseId: "cisco-networking-basics",
  moduleIds: null,
  studyMode: "all",
  speed: "standard",
  drain: "normal",
  wallMode: "walls",
  durationMin: 0,
  soundOn: true,
};

export type PersistedStats = {
  highScore: number;
  questionsAnswered: number;
  correctAnswers: number;
  bestLength: number;
};

export const DEFAULT_STATS: PersistedStats = {
  highScore: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  bestLength: 3,
};

/* ------------------------------------------------------------------ */
/* Challenge intensity (pure gameplay — NOT learning levels)           */
/* ------------------------------------------------------------------ */

export type ChallengeTier = {
  tier: number;
  label: string;
  scoreThreshold: number;
  baseTickMs: number;
  drainMultiplier: number;
  bonusChance: number;
  questionFoodChance: number;
  obstacleCount: number;
};

/** As score rises the snake speeds up, drains faster, and obstacles
 *  appear. This is challenge intensity only; the questions asked are
 *  driven entirely by the selected course and the learner's history. */
export const CHALLENGE_TIERS: ChallengeTier[] = [
  { tier: 1, label: "Cruise",   scoreThreshold: 0,   baseTickMs: 170, drainMultiplier: 1,    bonusChance: 0.25, questionFoodChance: 0.15, obstacleCount: 0 },
  { tier: 2, label: "Brisk",    scoreThreshold: 120, baseTickMs: 140, drainMultiplier: 1.25, bonusChance: 0.2,  questionFoodChance: 0.15, obstacleCount: 0 },
  { tier: 3, label: "Rapid",    scoreThreshold: 280, baseTickMs: 115, drainMultiplier: 1.5,  bonusChance: 0.15, questionFoodChance: 0.18, obstacleCount: 6 },
  { tier: 4, label: "Overclock",scoreThreshold: 480, baseTickMs: 95,  drainMultiplier: 1.9,  bonusChance: 0.1,  questionFoodChance: 0.2,  obstacleCount: 10 },
];

export const SPEED_ADJUST_MS: Record<SpeedSetting, number> = {
  relaxed: 40,
  standard: 0,
  fast: -30,
};

export const DRAIN_ADJUST: Record<DrainSetting, number> = {
  normal: 1,
  high: 1.5,
};

/* ------------------------------------------------------------------ */
/* Game state                                                          */
/* ------------------------------------------------------------------ */

export type GameStatus = "start" | "playing" | "paused" | "question" | "gameover";

export type QuestionTrigger = "energy" | "voluntary" | "food";

export type ActiveQuestion = {
  question: LearningQuestion;
  trigger: QuestionTrigger;
  evaluation: AnswerEvaluation | null;
};

export type RunStats = {
  questionsAnswered: number;
  correctAnswers: number;
  highestTier: number;
};

export type AnsweredEntry = {
  question: LearningQuestion;
  evaluation: AnswerEvaluation;
  playerAnswer: string;
};

export type GameState = {
  status: GameStatus;
  snake: Point[];
  direction: Direction;
  directionQueue: Direction[];
  foods: Food[];
  obstacles: Point[];
  score: number;
  energy: number;
  /** Challenge intensity tier (gameplay only). */
  intensity: number;
  tick: number;
  /** Active play time in ms (excludes pauses/questions). */
  playedMs: number;
  /** Set when the run ended because the timer ran out. */
  endedByTimer: boolean;
  activeQuestion: ActiveQuestion | null;
  floatingTexts: FloatingText[];
  answeredQuestions: AnsweredEntry[];
  runStats: RunStats;
  settings: GameSettings;
};
