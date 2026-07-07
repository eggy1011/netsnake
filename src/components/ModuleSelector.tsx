import type { CoursePack, ProgressMap } from "../types/questions";
import type { StudyMode } from "../types/game";
import { weakTopicsFor } from "../questions/questionProgress";

type Props = {
  course: CoursePack;
  progress: ProgressMap;
  moduleIds: string[] | null; // null = entire course
  studyMode: StudyMode;
  onChange: (moduleIds: string[] | null, studyMode: StudyMode) => void;
};

export default function ModuleSelector({
  course,
  progress,
  moduleIds,
  studyMode,
  onChange,
}: Props) {
  const weakCount = weakTopicsFor(course.id, progress).size;
  const hasIncorrect = course.modules.some((m) =>
    m.questionIds.some((id) => {
      const p = progress[id];
      return p && p.attempts > 0 && p.correctAttempts < p.attempts;
    })
  );

  const toggleModule = (id: string) => {
    const current = moduleIds ?? [];
    const next = current.includes(id)
      ? current.filter((m) => m !== id)
      : [...current, id];
    onChange(next.length === 0 ? null : next, "all");
  };

  return (
    <div>
      {/* study-mode presets */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Preset
          active={studyMode === "all" && moduleIds === null}
          onClick={() => onChange(null, "all")}
          title="Entire course"
          subtitle="All modules, adaptive order"
        />
        <Preset
          active={studyMode === "weak"}
          onClick={() => onChange(null, "weak")}
          disabled={weakCount === 0}
          title="Weak topics only"
          subtitle={weakCount > 0 ? `${weakCount} topic(s) need work` : "No weak topics yet"}
        />
        <Preset
          active={studyMode === "incorrect"}
          onClick={() => onChange(null, "incorrect")}
          disabled={!hasIncorrect}
          title="Previously incorrect"
          subtitle={hasIncorrect ? "Retry missed questions" : "Nothing missed yet"}
        />
      </div>

      {/* individual modules */}
      <div className="text-xs uppercase tracking-widest text-slate-500">
        …or pick specific modules
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {course.modules.map((m) => {
          const attempted = m.questionIds.filter(
            (id) => (progress[id]?.attempts ?? 0) > 0
          ).length;
          const active = (moduleIds ?? []).includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggleModule(m.id)}
              className={`rounded-lg border p-3 text-left text-sm transition ${
                active
                  ? "border-cyan-400 bg-cyan-950/40"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
              }`}
            >
              <div className="font-bold text-slate-200">{m.title}</div>
              <div className="text-xs text-slate-500">{m.description}</div>
              <div className="mt-1 text-[10px] text-slate-600">
                {attempted}/{m.questionIds.length} attempted ·{" "}
                {m.topics.slice(0, 3).join(", ")}
                {m.topics.length > 3 ? "…" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Preset({
  active,
  disabled,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border p-3 text-left transition ${
        active
          ? "border-green-400 bg-green-950/40"
          : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <div className="text-sm font-bold text-slate-200">{title}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </button>
  );
}
