import { useState } from "react";
import type {
  DrainSetting,
  DurationSetting,
  GameSettings,
  SpeedSetting,
  WallMode,
} from "../types/game";
import type { ProgressMap } from "../types/questions";
import { getCourse } from "../courses/courseRegistry";
import CourseLibrary from "./CourseLibrary";
import ModuleSelector from "./ModuleSelector";

type Props = {
  settings: GameSettings;
  progress: ProgressMap;
  highScore: number;
  onStart: (settings: GameSettings) => void;
  onShowProgress: (courseId: string) => void;
  onShowSources: (courseId: string) => void;
};

type Step = 1 | 2 | 3;

export default function StartScreen({
  settings,
  progress,
  highScore,
  onStart,
  onShowProgress,
  onShowSources,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<GameSettings>(settings);
  const course = getCourse(draft.courseId);

  return (
    <div className="circuit-bg flex min-h-screen items-start justify-center p-4 sm:items-center">
      <div className="neon-border w-full max-w-3xl rounded-xl border border-cyan-800/50 bg-slate-950/90 p-6 sm:p-8">
        <h1 className="neon-text mb-1 text-center text-4xl font-bold text-cyan-300">
          NET<span className="text-green-400">SNAKE</span>
        </h1>
        <p className="mb-2 text-center text-sm text-slate-400">
          Choose what to study, then keep your snake's energy alive by answering.
        </p>
        {highScore > 0 && (
          <p className="mb-4 text-center text-sm text-pink-400">
            High score: <span className="font-bold">{highScore}</span>
          </p>
        )}

        {/* step indicator */}
        <div className="mb-5 flex items-center justify-center gap-2 text-xs">
          {[
            [1, "Course"],
            [2, "Modules"],
            [3, "Gameplay"],
          ].map(([n, label]) => (
            <div key={n} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border font-bold ${
                  step === n
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : (step as number) > (n as number)
                      ? "border-green-500 bg-green-500/20 text-green-300"
                      : "border-slate-700 text-slate-500"
                }`}
              >
                {n}
              </span>
              <span
                className={step === n ? "text-cyan-300" : "text-slate-500"}
              >
                {label}
              </span>
              {n !== 3 && <span className="text-slate-700">—</span>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="mb-3 text-sm uppercase tracking-widest text-slate-400">
              Step 1 · Select a learning course
            </h2>
            <CourseLibrary
              progress={progress}
              selectedCourseId={draft.courseId}
              onSelect={(courseId) =>
                setDraft({ ...draft, courseId, moduleIds: null, studyMode: "all" })
              }
              onViewSources={onShowSources}
            />
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => onShowProgress(draft.courseId)}
                className="rounded-lg border border-purple-500/60 bg-purple-950/50 px-4 py-3 text-sm font-bold text-purple-300 transition hover:bg-purple-900/60"
              >
                📊 Progress & review
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-green-500 bg-green-600/20 px-4 py-3 font-bold text-green-300 transition hover:bg-green-600/40"
              >
                Next: choose modules →
              </button>
            </div>
          </>
        )}

        {step === 2 && course && (
          <>
            <h2 className="mb-3 text-sm uppercase tracking-widest text-slate-400">
              Step 2 · What to practise in {course.title}
            </h2>
            <ModuleSelector
              course={course}
              progress={progress}
              moduleIds={draft.moduleIds}
              studyMode={draft.studyMode}
              onChange={(moduleIds, studyMode) =>
                setDraft({ ...draft, moduleIds, studyMode })
              }
            />
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-300 transition hover:bg-slate-800"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-lg border border-green-500 bg-green-600/20 px-4 py-3 font-bold text-green-300 transition hover:bg-green-600/40"
              >
                Next: gameplay settings →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="mb-3 text-sm uppercase tracking-widest text-slate-400">
              Step 3 · Gameplay settings (separate from your course)
            </h2>
            <div className="space-y-4">
              <Field label="Snake speed">
                <div className="grid grid-cols-3 gap-2">
                  {(["relaxed", "standard", "fast"] as SpeedSetting[]).map((s) => (
                    <Choice key={s} active={draft.speed === s} onClick={() => setDraft({ ...draft, speed: s })}>
                      {s}
                    </Choice>
                  ))}
                </div>
              </Field>
              <Field label="Energy drain">
                <div className="grid grid-cols-2 gap-2">
                  {(["normal", "high"] as DrainSetting[]).map((d) => (
                    <Choice key={d} active={draft.drain === d} onClick={() => setDraft({ ...draft, drain: d })}>
                      {d}
                    </Choice>
                  ))}
                </div>
              </Field>
              <Field label="Game duration">
                <div className="grid grid-cols-4 gap-2">
                  {([0, 5, 10, 15] as DurationSetting[]).map((m) => (
                    <Choice key={m} active={draft.durationMin === m} onClick={() => setDraft({ ...draft, durationMin: m })}>
                      {m === 0 ? "Endless" : `${m} min`}
                    </Choice>
                  ))}
                </div>
              </Field>
              <Field label="Wall collision">
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["walls", "Solid walls (classic)"],
                    ["wrap", "Wrap around edges"],
                  ] as [WallMode, string][]).map(([w, label]) => (
                    <Choice key={w} active={draft.wallMode === w} onClick={() => setDraft({ ...draft, wallMode: w })}>
                      {label}
                    </Choice>
                  ))}
                </div>
              </Field>
              <Field label="Sound">
                <div className="grid grid-cols-2 gap-2">
                  <Choice active={draft.soundOn} onClick={() => setDraft({ ...draft, soundOn: true })}>
                    🔊 On
                  </Choice>
                  <Choice active={!draft.soundOn} onClick={() => setDraft({ ...draft, soundOn: false })}>
                    🔇 Off
                  </Choice>
                </div>
              </Field>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              The game speeds up as your score grows — that's challenge
              intensity, not your learning level. Studying{" "}
              <span className="text-cyan-400">{course?.title}</span>
              {draft.studyMode === "weak"
                ? " (weak topics)"
                : draft.studyMode === "incorrect"
                  ? " (previously incorrect)"
                  : draft.moduleIds
                    ? ` (${draft.moduleIds.length} module(s))`
                    : " (entire course)"}
              .
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-300 transition hover:bg-slate-800"
              >
                ← Back
              </button>
              <button
                onClick={() => onStart(draft)}
                className="neon-border flex-1 rounded-lg border border-green-500 bg-green-600/20 px-6 py-3 text-xl font-bold text-green-300 transition hover:bg-green-600/40"
              >
                ▶ START GAME
              </button>
            </div>
          </>
        )}

        <p className="mt-4 text-center text-xs text-slate-600">
          Move: Arrow keys / WASD · Pause: Space or P
        </p>
        <p className="mt-2 text-center text-[10px] leading-snug text-slate-700">
          This application provides independently created supplementary
          practice. It is not an official assessment and is not endorsed by the
          source organisations listed.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs uppercase tracking-widest text-slate-400">
        {label}
      </div>
      {children}
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-3 py-2 text-sm capitalize transition ${
        active
          ? "border-cyan-400 bg-cyan-500/20 font-bold text-cyan-200"
          : "border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-500"
      }`}
    >
      {children}
    </button>
  );
}
