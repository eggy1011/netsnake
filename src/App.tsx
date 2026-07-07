import { useEffect, useState } from "react";
import {
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  type Direction,
  type GameSettings,
  type PersistedStats,
} from "./types/game";
import type { ProgressMap } from "./types/questions";
import { getCourse } from "./courses/courseRegistry";
import { PROGRESS_STORAGE_KEY } from "./questions/questionProgress";
import { migrateSettings } from "./utils/migration";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSnakeGame } from "./hooks/useSnakeGame";
import { useGameLoop } from "./hooks/useGameLoop";
import { evaluationService } from "./questions/evaluationService";
import NavBar from "./components/NavBar";
import LandingPage from "./components/LandingPage";
import GameCanvas from "./components/GameCanvas";
import GameHUD from "./components/GameHUD";
import QuestionModal from "./components/QuestionModal";
import StartScreen from "./components/StartScreen";
import GameOverScreen from "./components/GameOverScreen";
import CourseProgress from "./components/CourseProgress";
import QuestionReview from "./components/QuestionReview";
import CourseSources from "./components/CourseSources";
import DevStatsPanel from "./components/DevStatsPanel";

/** Screens shown while no game is running. */
type Panel =
  | { view: "landing" }
  | { view: "setup" }
  | { view: "progress"; courseId: string }
  | { view: "review" }
  | { view: "sources"; courseId: string };

export default function App() {
  const [rawSettings, setSettings] = useLocalStorage<GameSettings>(
    "netsnake:settings",
    DEFAULT_SETTINGS
  );
  const settings = migrateSettings(rawSettings);
  const [stats, setStats] = useLocalStorage<PersistedStats>(
    "netsnake:stats",
    DEFAULT_STATS
  );
  const [progress, setProgress] = useLocalStorage<ProgressMap>(
    PROGRESS_STORAGE_KEY,
    {}
  );
  const [panel, setPanel] = useState<Panel>({ view: "landing" });

  const game = useSnakeGame(settings, setStats, progress, setProgress);
  const { state } = game;

  useGameLoop(state.status === "playing", game.stepMs, game.step);

  /* Ask the backend (if running) which AI model is active — dev panel info. */
  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((h: { aiConfigured?: boolean; model?: string | null } | null) => {
        evaluationService.setModel(h?.aiConfigured ? (h.model ?? null) : null);
      })
      .catch(() => evaluationService.setModel(null));
  }, []);

  /* Keep the persisted sound preference in sync with in-game toggles. */
  useEffect(() => {
    if (state.status !== "start" && state.settings.soundOn !== settings.soundOn) {
      setSettings((prev) => ({ ...prev, soundOn: state.settings.soundOn }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings.soundOn]);

  const handleStart = (s: GameSettings) => {
    setSettings(s);
    setPanel({ view: "setup" });
    game.start(s);
  };

  const navigate = (view: "landing" | "setup" | "progress" | "review") => {
    if (view === "progress") {
      setPanel({ view: "progress", courseId: settings.courseId });
    } else {
      setPanel({ view });
    }
  };

  /* ------------------- menu screens (no game running) ------------------ */
  if (state.status === "start") {
    const activeNav =
      panel.view === "sources" ? "setup" : (panel.view as "landing" | "setup" | "progress" | "review");

    return (
      <>
        <NavBar active={activeNav} onNavigate={navigate} />

        {panel.view === "landing" && (
          <LandingPage
            onPlay={() => setPanel({ view: "setup" })}
            onBrowseCourses={() => setPanel({ view: "setup" })}
          />
        )}

        {panel.view === "setup" && (
          <StartScreen
            settings={settings}
            progress={progress}
            highScore={stats.highScore}
            onStart={handleStart}
            onShowProgress={(courseId) => setPanel({ view: "progress", courseId })}
            onShowSources={(courseId) => setPanel({ view: "sources", courseId })}
          />
        )}

        {panel.view === "progress" && (
          <CenteredScreen>
            {getCourse(panel.courseId) && (
              <CourseProgress
                course={getCourse(panel.courseId)!}
                progress={progress}
                onReview={() => setPanel({ view: "review" })}
                onBack={() => setPanel({ view: "setup" })}
              />
            )}
          </CenteredScreen>
        )}

        {panel.view === "review" && (
          <CenteredScreen>
            <QuestionReview
              progress={progress}
              sessionAnswers={state.answeredQuestions}
              onBack={() => setPanel({ view: "setup" })}
            />
          </CenteredScreen>
        )}

        {panel.view === "sources" && (
          <CenteredScreen>
            {getCourse(panel.courseId) && (
              <CourseSources
                course={getCourse(panel.courseId)!}
                onBack={() => setPanel({ view: "setup" })}
              />
            )}
          </CenteredScreen>
        )}

        <DevStatsPanel />
      </>
    );
  }

  /* ----------------------------- game over ----------------------------- */
  if (state.status === "gameover") {
    if (panel.view === "progress" || panel.view === "review") {
      const course = getCourse(state.settings.courseId);
      return (
        <CenteredScreen>
          {panel.view === "progress" && course ? (
            <CourseProgress
              course={course}
              progress={progress}
              onReview={() => setPanel({ view: "review" })}
              onBack={() => setPanel({ view: "setup" })}
            />
          ) : (
            <QuestionReview
              progress={progress}
              sessionAnswers={state.answeredQuestions}
              onBack={() => setPanel({ view: "setup" })}
            />
          )}
        </CenteredScreen>
      );
    }
    return (
      <GameOverScreen
        state={state}
        highScore={Math.max(stats.highScore, state.score)}
        onPlayAgain={game.restart}
        onHome={game.goHome}
        onFullReview={() =>
          setPanel({ view: "progress", courseId: state.settings.courseId })
        }
      />
    );
  }

  /* ------------------------------ playing ------------------------------ */
  return (
    <div className="circuit-bg flex min-h-screen flex-col items-center gap-4 p-4 sm:justify-center">
      <GameHUD
        state={state}
        highScore={Math.max(stats.highScore, state.score)}
        tierLabel={game.tierLabel}
        onPause={game.togglePause}
        onAnswerQuestion={game.requestQuestion}
        onRestart={game.restart}
        onToggleSound={game.toggleSound}
      />

      <div className="relative w-full max-w-[624px]">
        <GameCanvas state={state} />
        {state.status === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-[2px]">
            <div className="text-center">
              <p className="neon-text text-3xl font-bold text-cyan-300">PAUSED</p>
              <p className="mt-2 text-sm text-slate-400">
                Press Space / P or the Resume button
              </p>
            </div>
          </div>
        )}
      </div>

      <TouchControls onDirection={game.queueDirection} />

      {state.status === "question" && (
        <QuestionModal
          activeQuestion={state.activeQuestion}
          onSubmit={(a) => game.submitAnswer(a)}
          onContinue={game.continueGame}
        />
      )}

      <DevStatsPanel />
    </div>
  );
}

function CenteredScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="circuit-bg flex min-h-screen items-center justify-center p-4">
      {children}
    </div>
  );
}

function TouchControls({ onDirection }: { onDirection: (d: Direction) => void }) {
  const btn =
    "flex h-14 w-14 items-center justify-center rounded-lg border border-cyan-800 bg-slate-900/80 text-xl text-cyan-300 active:bg-cyan-900/60 select-none";
  const press = (d: Direction) => (e: React.PointerEvent) => {
    e.preventDefault();
    onDirection(d);
  };
  return (
    <div className="grid grid-cols-3 gap-2 sm:hidden" aria-label="Touch controls">
      <div />
      <button className={btn} onPointerDown={press("up")}>▲</button>
      <div />
      <button className={btn} onPointerDown={press("left")}>◀</button>
      <button className={btn} onPointerDown={press("down")}>▼</button>
      <button className={btn} onPointerDown={press("right")}>▶</button>
    </div>
  );
}
