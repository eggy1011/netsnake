import type { CoursePack } from "../types/questions";
import type { CourseStats } from "../questions/questionProgress";
import { resolveSources } from "../courses/sourceRegistry";

type Props = {
  course: CoursePack;
  stats: CourseStats;
  selected: boolean;
  onSelect: () => void;
  onViewSources: () => void;
};

export default function CourseCard({
  course,
  stats,
  selected,
  onSelect,
  onViewSources,
}: Props) {
  const allSourceIds = [...new Set(course.modules.flatMap((m) => m.sourceIds))];
  const organisations = [
    ...new Set(resolveSources(allSourceIds).map((s) => s.organisation)),
  ];

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`flex w-full cursor-pointer flex-col rounded-xl border p-4 text-left transition ${
        selected
          ? "neon-border border-cyan-400 bg-cyan-950/40"
          : "border-slate-800 bg-slate-950/70 hover:border-slate-600"
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-2xl">{course.icon}</span>
        <span className="font-bold text-slate-100">{course.title}</span>
      </div>
      <p className="mb-2 text-sm text-slate-400">{course.description}</p>

      {organisations.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-600">
            Sources:
          </span>
          {organisations.slice(0, 4).map((org) => (
            <span
              key={org}
              className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400"
            >
              {org}
            </span>
          ))}
          {organisations.length > 4 && (
            <span className="text-[10px] text-slate-600">
              +{organisations.length - 4}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewSources();
            }}
            className="ml-auto rounded border border-cyan-800 px-1.5 py-0.5 text-[10px] text-cyan-400 transition hover:bg-cyan-950"
          >
            View sources
          </button>
        </div>
      )}

      <div className="mt-auto flex items-center gap-3 text-xs">
        <span className="text-slate-500">
          {stats.totalQuestions} questions · {course.modules.length} modules
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${stats.completionPct}%` }}
          />
        </div>
        <span className="text-xs text-green-400">{stats.completionPct}%</span>
        {stats.dueForReview > 0 && (
          <span className="rounded bg-amber-950 px-1.5 py-0.5 text-[10px] text-amber-400">
            {stats.dueForReview} due
          </span>
        )}
      </div>
      {course.disclaimer && (
        <p className="mt-2 text-[10px] italic leading-tight text-slate-600">
          {course.disclaimer}
        </p>
      )}
    </div>
  );
}
