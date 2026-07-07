import type { GameState } from "../types/game";
import { getCourse } from "../courses/courseRegistry";
import EnergyBar from "./EnergyBar";

type Props = {
  state: GameState;
  highScore: number;
  tierLabel: string;
  onPause: () => void;
  onAnswerQuestion: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
};

export default function GameHUD({
  state,
  highScore,
  tierLabel,
  onPause,
  onAnswerQuestion,
  onRestart,
  onToggleSound,
}: Props) {
  const paused = state.status === "paused";
  const course = getCourse(state.settings.courseId);
  const remainingMs =
    state.settings.durationMin > 0
      ? Math.max(0, state.settings.durationMin * 60_000 - state.playedMs)
      : null;

  return (
    <div className="flex w-full max-w-[624px] flex-col gap-3">
      {/* course banner */}
      <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs">
        <span className="truncate text-slate-400">
          Studying: <span className="text-cyan-300">{course?.icon} {course?.title}</span>
          {state.settings.studyMode === "weak" && (
            <span className="text-amber-400"> · weak topics</span>
          )}
          {state.settings.studyMode === "incorrect" && (
            <span className="text-amber-400"> · previously incorrect</span>
          )}
        </span>
        {remainingMs !== null && (
          <span
            className={`font-bold ${remainingMs < 60_000 ? "text-red-400" : "text-slate-300"}`}
          >
            ⏱ {formatMs(remainingMs)}
          </span>
        )}
      </div>

      {/* stats row */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <Stat label="Score" value={state.score} accent="text-cyan-300" />
        <Stat label="High" value={highScore} accent="text-pink-400" />
        <Stat label="Length" value={state.snake.length} accent="text-green-400" />
        <Stat label="Game speed" value={tierLabel} accent="text-yellow-300" />
      </div>

      <EnergyBar energy={state.energy} />

      {/* controls row */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAnswerQuestion}
          disabled={state.status !== "playing"}
          className="flex-1 rounded-md border border-purple-500/60 bg-purple-950/60 px-3 py-2 text-sm font-bold text-purple-300 transition hover:bg-purple-900/70 disabled:opacity-40"
        >
          ? Answer Question
        </button>
        <button
          onClick={onPause}
          disabled={state.status !== "playing" && !paused}
          className="rounded-md border border-cyan-500/60 bg-cyan-950/60 px-3 py-2 text-sm font-bold text-cyan-300 transition hover:bg-cyan-900/70 disabled:opacity-40"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button
          onClick={onToggleSound}
          className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          aria-label="Toggle sound"
        >
          {state.settings.soundOn ? "🔊" : "🔇"}
        </button>
        <button
          onClick={onRestart}
          className="rounded-md border border-red-500/50 bg-red-950/50 px-3 py-2 text-sm text-red-300 transition hover:bg-red-900/60"
        >
          ↻ Restart
        </button>
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className={`neon-text truncate text-lg font-bold ${accent}`}>{value}</div>
    </div>
  );
}
