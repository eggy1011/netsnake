type NavView = "landing" | "setup" | "progress" | "review";

type Props = {
  active: NavView;
  onNavigate: (view: NavView) => void;
};

const LINKS: { view: NavView; label: string }[] = [
  { view: "landing", label: "Home" },
  { view: "setup", label: "Play" },
  { view: "progress", label: "Progress" },
  { view: "review", label: "Review" },
];

/** Top navigation shown on all non-gameplay screens. */
export default function NavBar({ active, onNavigate }: Props) {
  return (
    <nav className="sticky top-0 z-40 border-b border-cyan-900/40 bg-[#05070f]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2.5">
        <button
          onClick={() => onNavigate("landing")}
          className="neon-text mr-4 text-lg font-bold tracking-tight text-cyan-300"
          aria-label="NetSnake home"
        >
          NET<span className="text-green-400">SNAKE</span>
          <span className="ml-1.5 align-middle text-sm">🐍</span>
        </button>
        {LINKS.map(({ view, label }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              active === view
                ? "bg-cyan-500/15 font-bold text-cyan-300"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
        <a
          href="https://github.com/eggy1011/netsnake"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto rounded-md px-3 py-1.5 text-sm text-slate-500 transition hover:text-slate-300"
          title="Source code on GitHub"
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  );
}
