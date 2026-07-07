import type { CoursePack, ProgressMap } from "../types/questions";
import { computeCourseStats } from "../questions/questionProgress";

type Props = {
  course: CoursePack;
  progress: ProgressMap;
  onReview: () => void;
  onBack: () => void;
};

export default function CourseProgress({ course, progress, onReview, onBack }: Props) {
  const stats = computeCourseStats(course, progress);

  return (
    <div className="neon-border w-full max-w-2xl rounded-xl border border-cyan-800/50 bg-slate-950/90 p-6">
      <h2 className="neon-text mb-1 text-2xl font-bold text-cyan-300">
        {course.icon} {course.title}
      </h2>
      <p className="mb-4 text-sm text-green-400">
        {stats.completionPct}% complete · {stats.attemptedQuestions}/
        {stats.totalQuestions} questions attempted
      </p>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Attempts" value={stats.questionsAttempted} />
        <Stat
          label="Avg answer quality"
          value={`${Math.round(stats.averageScore * 100)}%`}
        />
        <Stat label="Due for review" value={stats.dueForReview} />
      </div>

      {/* accuracy by module */}
      <h3 className="mb-2 text-xs uppercase tracking-widest text-slate-500">
        Accuracy by module
      </h3>
      <div className="mb-4 space-y-1.5">
        {stats.moduleStats.map((m) => (
          <div key={m.moduleId} className="flex items-center gap-2 text-sm">
            <span className="w-1/2 truncate text-slate-300">{m.title}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  m.attempted === 0
                    ? "bg-slate-700"
                    : m.accuracy >= 0.7
                      ? "bg-green-500"
                      : m.accuracy >= 0.4
                        ? "bg-amber-400"
                        : "bg-red-500"
                }`}
                style={{
                  width: m.attempted === 0 ? "0%" : `${Math.round(m.accuracy * 100)}%`,
                }}
              />
            </div>
            <span className="w-12 text-right text-xs text-slate-500">
              {m.attempted === 0 ? "—" : `${Math.round(m.accuracy * 100)}%`}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-xs uppercase tracking-widest text-green-500">
            Strong topics
          </h3>
          {stats.strongTopics.length === 0 ? (
            <p className="text-xs text-slate-600">Keep playing to build strengths.</p>
          ) : (
            <ul className="space-y-0.5 text-sm text-green-300">
              {stats.strongTopics.slice(0, 6).map((t) => (
                <li key={t}>✓ {t}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-1 text-xs uppercase tracking-widest text-amber-500">
            Needs review
          </h3>
          {stats.weakTopics.length === 0 ? (
            <p className="text-xs text-slate-600">No weak topics detected.</p>
          ) : (
            <ul className="space-y-0.5 text-sm text-amber-300">
              {stats.weakTopics.slice(0, 6).map((t) => (
                <li key={t}>△ {t}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {stats.commonMisconceptions.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-1 text-xs uppercase tracking-widest text-pink-500">
            Common misconceptions to watch
          </h3>
          <ul className="space-y-1 text-xs text-slate-400">
            {stats.commonMisconceptions.map((m, i) => (
              <li key={i}>• {m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onReview}
          className="flex-1 rounded-lg border border-purple-500 bg-purple-600/20 px-4 py-2 font-bold text-purple-300 transition hover:bg-purple-600/40"
        >
          Review questions
        </button>
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-cyan-500 bg-cyan-600/20 px-4 py-2 font-bold text-cyan-300 transition hover:bg-cyan-600/40"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-2">
      <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="neon-text text-lg font-bold text-cyan-300">{value}</div>
    </div>
  );
}
