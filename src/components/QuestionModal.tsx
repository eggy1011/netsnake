import { useEffect, useRef, useState } from "react";
import type { ActiveQuestion } from "../types/game";
import { resolveSources } from "../courses/sourceRegistry";

type Props = {
  activeQuestion: ActiveQuestion | null; // null while loading
  onSubmit: (answer: string) => void | Promise<void>;
  onContinue: () => void;
};

const TRIGGER_BANNER: Record<string, { text: string; cls: string }> = {
  energy: {
    text: "Your snake is out of energy.\nAnswer a networking question to continue.",
    cls: "border-red-500/60 bg-red-950/50 text-red-300",
  },
  voluntary: {
    text: "Voluntary refill — answer to top up your energy.",
    cls: "border-cyan-500/60 bg-cyan-950/50 text-cyan-300",
  },
  food: {
    text: "You ate a question packet! Good answers earn a 1.5× energy bonus.",
    cls: "border-purple-500/60 bg-purple-950/50 text-purple-300",
  },
};

const VERDICT_STYLE = {
  excellent: {
    label: "★ Excellent!",
    cls: "border-green-400/70 bg-green-950/60 text-green-300",
  },
  correct: {
    label: "✔ Correct!",
    cls: "border-green-500/60 bg-green-950/50 text-green-400",
  },
  partially_correct: {
    label: "◐ Partially correct",
    cls: "border-amber-500/60 bg-amber-950/50 text-amber-400",
  },
  incorrect: {
    label: "✘ Incorrect",
    cls: "border-red-500/60 bg-red-950/50 text-red-400",
  },
} as const;

export default function QuestionModal({ activeQuestion, onSubmit, onContinue }: Props) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const question = activeQuestion?.question ?? null;
  const evaluation = activeQuestion?.evaluation ?? null;
  const isScenario = question?.difficulty === "scenario";
  const sources = question ? resolveSources(question.sourceIds).slice(0, 3) : [];

  useEffect(() => {
    setAnswer("");
    setSubmitting(false);
    inputRef.current?.focus();
  }, [question?.id]);

  useEffect(() => {
    if (evaluation) setSubmitting(false);
  }, [evaluation]);

  const submit = async () => {
    if (submitting || !question) return;
    setSubmitting(true);
    await onSubmit(answer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-modal-in neon-border max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl border border-cyan-700/50 bg-slate-950 p-6">
        {!activeQuestion || !question ? (
          <p className="animate-pulse text-center text-cyan-300">
            Fetching question…
          </p>
        ) : (
          <>
            <div
              className={`mb-4 whitespace-pre-line rounded-md border px-3 py-2 text-sm ${TRIGGER_BANNER[activeQuestion.trigger].cls}`}
            >
              {TRIGGER_BANNER[activeQuestion.trigger].text}
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-cyan-300">
                {question.topic}
              </span>
              <span
                className={`rounded px-2 py-0.5 ${
                  isScenario
                    ? "bg-purple-950 text-purple-300"
                    : question.difficulty === "applied"
                      ? "bg-amber-950 text-amber-400"
                      : "bg-green-950 text-green-400"
                }`}
              >
                {isScenario ? "customer scenario" : question.difficulty}
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-400">
                up to +{question.energyReward}⚡
              </span>
            </div>

            <h2 className="neon-text mb-4 whitespace-pre-line text-lg font-bold text-slate-100">
              {question.question}
            </h2>

            {!evaluation ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <textarea
                  ref={inputRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  placeholder={
                    isScenario
                      ? "Think like an SE — what would you say or ask?"
                      : "Answer in your own words — exact wording isn't required."
                  }
                  rows={isScenario ? 3 : 2}
                  autoComplete="off"
                  disabled={submitting}
                  className="mb-4 w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-500 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md border border-cyan-500 bg-cyan-600/20 px-4 py-2 font-bold text-cyan-300 transition hover:bg-cyan-600/40 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? "Checking your answer…" : "Submit Answer"}
                </button>
              </form>
            ) : (
              <div>
                <div
                  className={`mb-3 rounded-md border px-3 py-2 font-bold ${VERDICT_STYLE[evaluation.verdict].cls}`}
                >
                  {VERDICT_STYLE[evaluation.verdict].label}
                  <span className="ml-2 text-cyan-300">
                    +{evaluation.energyReward} ⚡
                  </span>
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    score {evaluation.score}/100
                    {evaluation.evaluatedBy === "ai" && " · AI-graded"}
                    {evaluation.evaluatedBy === "cache" && " · cached"}
                  </span>
                </div>

                {evaluation.notice && (
                  <p className="mb-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-400">
                    ℹ {evaluation.notice}
                  </p>
                )}

                {evaluation.correctConcepts.length > 0 && (
                  <p className="mb-1 text-xs text-green-400">
                    ✓ You covered: {evaluation.correctConcepts.join(", ")}
                  </p>
                )}
                {evaluation.missingConcepts.length > 0 && (
                  <p className="mb-1 text-xs text-amber-400">
                    △ Missing: {evaluation.missingConcepts.join(", ")}
                  </p>
                )}
                {evaluation.incorrectClaims.length > 0 && (
                  <p className="mb-2 text-xs text-red-400">
                    ✗ Incorrect: {evaluation.incorrectClaims.join(", ")}
                  </p>
                )}

                <p className="mb-2 text-sm text-slate-300">{evaluation.feedback}</p>
                <p className="mb-2 text-sm text-slate-400">{question.explanation}</p>
                <div className="mb-3 rounded-md border border-slate-800 bg-slate-900/60 p-2.5">
                  <p className="text-xs uppercase tracking-widest text-green-500">
                    Strong answer
                  </p>
                  <p className="text-sm text-slate-300">{evaluation.improvedAnswer}</p>
                </div>

                {sources.length > 0 && (
                  <div className="mb-4 rounded-md border border-slate-800 bg-slate-900/40 p-2.5">
                    <p className="mb-1 text-xs uppercase tracking-widest text-cyan-500">
                      Learn more
                    </p>
                    {sources.map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-xs text-cyan-400 underline-offset-2 hover:underline"
                      >
                        {s.organisation}: {s.title}
                      </a>
                    ))}
                  </div>
                )}

                <button
                  onClick={onContinue}
                  autoFocus
                  className="w-full rounded-md border border-green-500 bg-green-600/20 px-4 py-2 font-bold text-green-300 transition hover:bg-green-600/40"
                >
                  Continue ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
