import { useMemo, useState } from "react";
import type { LearningQuestion, ProgressMap } from "../types/questions";
import type { AnsweredEntry } from "../types/game";
import { ALL_QUESTIONS, getCourse, moduleForQuestion } from "../courses/courseRegistry";
import { isDueForReview } from "../questions/questionProgress";

type Filter =
  | "all"
  | "incorrect"
  | "partial"
  | "due"
  | "networking"
  | "hardware"
  | "troubleshooting"
  | "security"
  | "se";

const COURSE_FILTERS: Record<string, Filter> = {
  "cisco-networking-basics": "networking",
  "packet-tracer-practice": "networking",
  "cloud-hybrid-networking": "networking",
  "hardware-fundamentals": "hardware",
  "ip-troubleshooting": "troubleshooting",
  "security-fundamentals": "security",
  "solution-engineer-scenarios": "se",
};

const FILTER_LABELS: [Filter, string][] = [
  ["all", "All"],
  ["incorrect", "Incorrect"],
  ["partial", "Partially correct"],
  ["due", "Due for review"],
  ["networking", "Networking"],
  ["hardware", "Hardware"],
  ["troubleshooting", "Troubleshooting"],
  ["security", "Security"],
  ["se", "SE scenarios"],
];

type Props = {
  progress: ProgressMap;
  /** Most recent answer per question from this session (freshest data). */
  sessionAnswers: AnsweredEntry[];
  onBack: () => void;
};

export default function QuestionReview({ progress, sessionAnswers, onBack }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const latestAnswer = useMemo(() => {
    const map = new Map<string, AnsweredEntry>();
    for (const a of sessionAnswers) map.set(a.question.id, a);
    return map;
  }, [sessionAnswers]);

  const attempted = useMemo(
    () => ALL_QUESTIONS.filter((q) => (progress[q.id]?.attempts ?? 0) > 0),
    [progress]
  );

  const visible = attempted.filter((q) => {
    const p = progress[q.id]!;
    switch (filter) {
      case "all":
        return true;
      case "incorrect":
        return p.correctAttempts < p.attempts && p.mastery < 0.45;
      case "partial":
        return p.mastery >= 0.3 && p.mastery < 0.7;
      case "due":
        return isDueForReview(p);
      default:
        return COURSE_FILTERS[q.courseId] === filter;
    }
  });

  return (
    <div className="neon-border flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-purple-800/50 bg-slate-950/95 p-6">
      <h2 className="neon-text mb-3 text-2xl font-bold text-purple-300">
        Question Review
      </h2>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTER_LABELS.map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              filter === f
                ? "border-purple-400 bg-purple-950/60 font-bold text-purple-200"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {attempted.length === 0
              ? "No questions attempted yet — play a round first!"
              : "Nothing matches this filter."}
          </p>
        ) : (
          visible.map((q) => (
            <ReviewCard
              key={q.id}
              question={q}
              progress={progress}
              latest={latestAnswer.get(q.id)}
            />
          ))
        )}
      </div>

      <button
        onClick={onBack}
        className="mt-4 rounded-lg border border-cyan-500 bg-cyan-600/20 px-4 py-2 font-bold text-cyan-300 transition hover:bg-cyan-600/40"
      >
        ← Back
      </button>
    </div>
  );
}

function ReviewCard({
  question,
  progress,
  latest,
}: {
  question: LearningQuestion;
  progress: ProgressMap;
  latest?: AnsweredEntry;
}) {
  const p = progress[question.id]!;
  const course = getCourse(question.courseId);
  const moduleId = moduleForQuestion(question.courseId, question.id);
  const module = course?.modules.find((m) => m.id === moduleId);
  const masteryPct = Math.round(p.mastery * 100);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm">
      <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">
          {course?.title ?? question.courseId}
        </span>
        {module && (
          <span className="rounded bg-slate-800 px-1.5 py-0.5">{module.title}</span>
        )}
        <span className="rounded bg-slate-800 px-1.5 py-0.5">{question.topic}</span>
        <span className="ml-auto">
          {p.attempts} attempt{p.attempts === 1 ? "" : "s"} · mastery{" "}
          <span
            className={
              masteryPct >= 70
                ? "text-green-400"
                : masteryPct >= 40
                  ? "text-amber-400"
                  : "text-red-400"
            }
          >
            {masteryPct}%
          </span>
        </span>
      </div>

      <p className="mb-1 font-bold text-slate-200">{question.question}</p>

      {latest && (
        <>
          <p className="text-slate-400">
            Your answer:{" "}
            <span className="text-slate-200">{latest.playerAnswer || "(blank)"}</span>
          </p>
          {latest.evaluation.correctConcepts.length > 0 && (
            <p className="text-xs text-green-400">
              ✓ Covered: {latest.evaluation.correctConcepts.join(", ")}
            </p>
          )}
          {latest.evaluation.missingConcepts.length > 0 && (
            <p className="text-xs text-amber-400">
              △ Missing: {latest.evaluation.missingConcepts.join(", ")}
            </p>
          )}
        </>
      )}

      <p className="mt-1 text-xs text-slate-400">{question.explanation}</p>
      <p className="mt-1 text-xs text-slate-300">
        <span className="text-green-500">Improved answer:</span>{" "}
        {question.improvedAnswer}
      </p>
    </div>
  );
}
