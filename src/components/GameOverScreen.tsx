import { useState } from "react";
import type { GameState } from "../types/game";
import { CHALLENGE_TIERS } from "../types/game";
import { getCourse } from "../courses/courseRegistry";

type Props = {
  state: GameState;
  highScore: number;
  onPlayAgain: () => void;
  onHome: () => void;
  onFullReview: () => void;
};

export default function GameOverScreen({
  state,
  highScore,
  onPlayAgain,
  onHome,
  onFullReview,
}: Props) {
  const [reviewing, setReviewing] = useState(false);
  const { runStats, answeredQuestions } = state;
  const accuracy =
    runStats.questionsAnswered > 0
      ? Math.round((runStats.correctAnswers / runStats.questionsAnswered) * 100)
      : 0;
  const isNewHigh = state.score >= highScore && state.score > 0;
  const course = getCourse(state.settings.courseId);
  const topTier =
    CHALLENGE_TIERS.find((t) => t.tier === runStats.highestTier) ??
    CHALLENGE_TIERS[0];

  return (
    <div className="circuit-bg flex min-h-screen items-center justify-center p-4">
      <div className="animate-modal-in neon-border w-full max-w-xl rounded-xl border border-pink-800/50 bg-slate-950/90 p-8">
        {!reviewing ? (
          <>
            <h1 className="neon-text mb-1 text-center text-4xl font-bold text-pink-400">
              {state.endedByTimer ? "TIME'S UP" : "GAME OVER"}
            </h1>
            <p className="mb-2 text-center text-xs text-slate-500">
              {course?.icon} {course?.title}
            </p>
            {isNewHigh && (
              <p className="neon-text mb-4 text-center text-lg font-bold text-yellow-300">
                ★ NEW HIGH SCORE! ★
              </p>
            )}

            <div className="mb-8 mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="Final score" value={state.score} accent="text-cyan-300" />
              <Stat label="High score" value={highScore} accent="text-pink-400" />
              <Stat label="Snake length" value={state.snake.length} accent="text-green-400" />
              <Stat label="Questions" value={runStats.questionsAnswered} accent="text-purple-300" />
              <Stat label="Correct" value={runStats.correctAnswers} accent="text-green-400" />
              <Stat label="Accuracy" value={`${accuracy}%`} accent="text-yellow-300" />
              <Stat label="Top game speed" value={topTier.label} accent="text-cyan-300" />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={onPlayAgain}
                className="flex-1 rounded-lg border border-green-500 bg-green-600/20 px-4 py-3 font-bold text-green-300 transition hover:bg-green-600/40"
              >
                ▶ Play Again
              </button>
              <button
                onClick={() => setReviewing(true)}
                disabled={answeredQuestions.length === 0}
                className="flex-1 rounded-lg border border-purple-500 bg-purple-600/20 px-4 py-3 font-bold text-purple-300 transition hover:bg-purple-600/40 disabled:opacity-40"
              >
                ? This Run's Questions
              </button>
              <button
                onClick={onHome}
                className="flex-1 rounded-lg border border-cyan-500 bg-cyan-600/20 px-4 py-3 font-bold text-cyan-300 transition hover:bg-cyan-600/40"
              >
                ⌂ Home
              </button>
            </div>
            <button
              onClick={onFullReview}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              📚 Full course progress & review
            </button>
          </>
        ) : (
          <>
            <h2 className="neon-text mb-4 text-center text-2xl font-bold text-purple-300">
              This Run's Questions
            </h2>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {answeredQuestions.map((entry, i) => (
                <div
                  key={i}
                  className={`rounded-md border p-3 text-sm ${
                    entry.evaluation.verdict === "excellent" ||
                    entry.evaluation.verdict === "correct"
                      ? "border-green-800 bg-green-950/40"
                      : entry.evaluation.verdict === "partially_correct"
                        ? "border-amber-800 bg-amber-950/40"
                        : "border-red-800 bg-red-950/40"
                  }`}
                >
                  <p className="mb-1 font-bold text-slate-200">
                    {entry.question.question}
                  </p>
                  <p className="text-slate-400">
                    Your answer:{" "}
                    <span className="text-slate-200">
                      {entry.playerAnswer || "(blank)"}
                    </span>
                  </p>
                  {entry.evaluation.missingConcepts.length > 0 && (
                    <p className="text-xs text-amber-400">
                      Missing: {entry.evaluation.missingConcepts.join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-300">
                    <span className="text-green-500">Improved:</span>{" "}
                    {entry.question.improvedAnswer}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setReviewing(false)}
              className="mt-4 w-full rounded-lg border border-cyan-500 bg-cyan-600/20 px-4 py-2 font-bold text-cyan-300 transition hover:bg-cyan-600/40"
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
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
    <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className={`neon-text truncate text-xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}
