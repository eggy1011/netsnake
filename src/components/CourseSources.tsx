import type { CoursePack } from "../types/questions";
import {
  resolveSources,
  SUPPLEMENTARY_DISCLAIMER,
} from "../courses/sourceRegistry";

type Props = {
  course: CoursePack;
  onBack: () => void;
};

const TYPE_LABEL: Record<string, string> = {
  standard: "Standard",
  government: "Government",
  official_documentation: "Official docs",
  official_course: "Official course",
  official_career_page: "Career / certification",
  architecture_framework: "Architecture framework",
};

/** Full source information per module — kept off the gameplay screen. */
export default function CourseSources({ course, onBack }: Props) {
  return (
    <div className="neon-border flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-cyan-800/50 bg-slate-950/95 p-6">
      <h2 className="neon-text mb-1 text-2xl font-bold text-cyan-300">
        {course.icon} {course.title} — Sources
      </h2>
      <p className="mb-4 text-xs text-slate-500">{SUPPLEMENTARY_DISCLAIMER}</p>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {course.modules.map((m) => {
          const sources = resolveSources(m.sourceIds);
          return (
            <div key={m.id}>
              <h3 className="mb-1.5 text-sm font-bold text-slate-200">
                {m.title}
              </h3>
              {sources.length === 0 ? (
                <p className="text-xs text-slate-600">No sources listed.</p>
              ) : (
                <div className="space-y-2">
                  {sources.map((s) => (
                    <div
                      key={`${m.id}-${s.id}`}
                      className="rounded-md border border-slate-800 bg-slate-900/50 p-2.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-cyan-400 underline-offset-2 hover:underline"
                        >
                          {s.title}
                        </a>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                          {TYPE_LABEL[s.sourceType]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-400">
                        {s.organisation}
                        {s.publishedAt && ` · published ${s.publishedAt}`}
                        {` · accessed ${s.accessedAt}`}
                      </p>
                      <p className="mt-0.5 text-slate-500">{s.authorityReason}</p>
                      <p className="mt-0.5 text-slate-600">
                        Supports: {s.topics.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
