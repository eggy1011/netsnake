import { ALL_QUESTIONS, COURSE_PACKS } from "../courses/courseRegistry";
import { SOURCES } from "../courses/sourceRegistry";

type Props = {
  onPlay: () => void;
  onBrowseCourses: () => void;
};

/** Marketing-style landing page: what the tool is, who it's for, and why. */
export default function LandingPage({ onPlay, onBrowseCourses }: Props) {
  return (
    <div className="circuit-bg min-h-screen">
      {/* ------------------------------ Hero ------------------------------ */}
      <header className="mx-auto max-w-5xl px-4 pb-16 pt-14 text-center sm:pt-20">
        <div className="mb-4 flex justify-center gap-1.5" aria-hidden>
          {["🟩", "🟩", "🟩", "🟢"].map((seg, i) => (
            <span
              key={i}
              className="animate-pulse text-2xl"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {seg}
            </span>
          ))}
          <span className="text-2xl">🍎</span>
        </div>
        <h1 className="neon-text mb-4 text-5xl font-bold tracking-tight text-cyan-300 sm:text-6xl">
          NET<span className="text-green-400">SNAKE</span>
        </h1>
        <p className="mx-auto mb-3 max-w-2xl text-lg text-slate-300">
          Learn networking by keeping a snake alive.
        </p>
        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-slate-400">
          Your snake burns energy with every move. The only way to refuel is to
          answer real networking questions — from IP addressing to customer-facing
          Solution Engineer scenarios — graded on <em>meaning</em>, not exact
          wording. Flashcards you can't put down.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onPlay}
            className="neon-border rounded-lg border border-green-500 bg-green-600/20 px-8 py-3 text-lg font-bold text-green-300 transition hover:bg-green-600/40"
          >
            ▶ Start Learning
          </button>
          <button
            onClick={onBrowseCourses}
            className="rounded-lg border border-cyan-700 bg-slate-900/60 px-6 py-3 text-sm font-bold text-cyan-300 transition hover:bg-cyan-950"
          >
            Browse the Course Library
          </button>
        </div>

        {/* stats strip */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <HeroStat value={String(ALL_QUESTIONS.length)} label="original questions" />
          <HeroStat value={String(COURSE_PACKS.length)} label="course packs" />
          <HeroStat value={String(SOURCES.length)} label="verified sources" />
          <HeroStat value="AI + rubric" label="hybrid grading" />
        </div>
      </header>

      {/* -------------------------- Problem/solution ---------------------- */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-pink-900/50 bg-slate-950/70 p-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-pink-400">
              The problem
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Networking fundamentals are learned by repetition, but flashcard
              apps are joyless and quiz sites demand exact wording. Studying for
              network and Solution Engineer roles also means practising{" "}
              <em>communication</em> — discovery questions, trade-offs, objection
              handling — which multiple-choice quizzes can't grade at all.
            </p>
          </div>
          <div className="rounded-xl border border-green-900/50 bg-slate-950/70 p-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-green-400">
              The solution
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              NetSnake wraps spaced-repetition study in an arcade loop that
              creates genuine urgency: answer or the run ends. Free-text answers
              are graded semantically — a local concept rubric handles factual
              questions instantly, and an optional AI evaluator grades open-ended
              scenario answers. Every question links to an authoritative source.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------- How it works ----------------------- */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="neon-text mb-6 text-center text-2xl font-bold text-cyan-300">
          How it works
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Step
            n="1"
            title="Pick what to study"
            body="Choose a course pack — networking foundations, hardware, troubleshooting, security, cloud, or Solution Engineer scenarios — then narrow to specific modules, weak topics, or previously missed questions."
          />
          <Step
            n="2"
            title="Play Snake"
            body="Classic controls, neon looks. Eating grows your snake and score, but every move drains the energy bar. The game speeds up as you score — that's challenge intensity, kept fully separate from question difficulty."
          />
          <Step
            n="3"
            title="Answer to survive"
            body="At zero energy the game pauses and a question appears. Answer in your own words; grading rewards meaning. Missed questions return via spaced review, and weak topics surface more often."
          />
        </div>
      </section>

      {/* ------------------------------ Features -------------------------- */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="neon-text mb-6 text-center text-2xl font-bold text-cyan-300">
          Built like a product, not a demo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon="🧠"
            title="Semantic answer grading"
            body="A concept-rubric evaluator with synonym and typo tolerance grades factual answers locally. Ambiguous, open-ended answers escalate to an LLM evaluator — with caching, rate-limit handling, and a guaranteed local fallback."
          />
          <Feature
            icon="🔐"
            title="Security-conscious AI integration"
            body="The API key lives only on a small backend. Learner answers are treated as untrusted content with a protected system prompt, and all AI responses are schema-validated before use."
          />
          <Feature
            icon="📚"
            title="Verified sources on every question"
            body="A central registry of IETF RFCs, NIST/CISA guidance, and official vendor docs — every URL verified, every module citing at least two sources, every question at least one."
          />
          <Feature
            icon="🔁"
            title="Spaced repetition & mastery tracking"
            body="Per-question mastery scores, review scheduling that brings missed questions back sooner, weak-topic detection, and per-module accuracy analytics — all persisted locally."
          />
          <Feature
            icon="🤝"
            title="Solution Engineer practice"
            body="80 original customer scenarios: discovery, diagnosis, recommendations, business value, and objection handling — the communication skills technical interviews actually probe."
          />
          <Feature
            icon="⚡"
            title="Works offline, free to run"
            body="No account, no database, no required API key. Progress lives in your browser; the AI layer is optional and falls back gracefully when unavailable."
          />
        </div>
      </section>

      {/* ------------------------------ Tech strip ------------------------ */}
      <section className="mx-auto max-w-5xl px-4 pb-16 text-center">
        <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
          Tech stack
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            "React 18", "TypeScript (strict)", "Vite", "Tailwind CSS 4",
            "HTML Canvas", "Express", "Zod", "Gemini API", "Vitest",
          ].map((t) => (
            <span
              key={t}
              className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ------------------------------- CTA ------------------------------ */}
      <section className="mx-auto max-w-5xl px-4 pb-16 text-center">
        <button
          onClick={onPlay}
          className="neon-border rounded-lg border border-green-500 bg-green-600/20 px-10 py-4 text-xl font-bold text-green-300 transition hover:bg-green-600/40"
        >
          ▶ Play NetSnake
        </button>
        <p className="mt-3 text-xs text-slate-600">
          Runs entirely in your browser · no sign-up
        </p>
      </section>

      <footer className="border-t border-slate-900 px-4 py-6 text-center">
        <p className="mx-auto max-w-2xl text-[11px] leading-relaxed text-slate-600">
          This application provides independently created supplementary
          practice. It is not an official assessment and is not endorsed by the
          source organisations listed. Sources are attributed on each course's
          Sources screen.
        </p>
      </footer>
    </div>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-3">
      <div className="neon-text text-xl font-bold text-green-400">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="neon-border mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500 font-bold text-cyan-300">
        {n}
      </div>
      <h3 className="mb-1.5 font-bold text-slate-100">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-slate-600">
      <div className="mb-2 text-2xl">{icon}</div>
      <h3 className="mb-1.5 text-sm font-bold text-slate-100">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}
