import { useEffect, useRef, useState } from "react";
import { MAX_ENERGY } from "../types/game";

type Props = { energy: number };

export default function EnergyBar({ energy }: Props) {
  const pct = Math.max(0, Math.min(100, (energy / MAX_ENERGY) * 100));
  const state = pct <= 10 ? "critical" : pct <= 30 ? "warning" : "normal";

  /* Flash animation when energy jumps up (refill). */
  const prev = useRef(energy);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (energy > prev.current + 4) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(t);
    }
    prev.current = energy;
  }, [energy]);
  prev.current = energy;

  const barColor =
    state === "critical"
      ? "bg-red-500"
      : state === "warning"
        ? "bg-amber-400"
        : "bg-cyan-400";

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-widest">
        <span className="text-cyan-300">⚡ Energy</span>
        <span
          className={
            state === "critical"
              ? "font-bold text-red-400"
              : state === "warning"
                ? "text-amber-300"
                : "text-slate-300"
          }
        >
          {Math.ceil(energy)} / {MAX_ENERGY}
        </span>
      </div>
      <div
        className={`h-4 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-900 ${
          state === "critical" ? "animate-pulse-glow" : ""
        }`}
        role="progressbar"
        aria-valuenow={Math.ceil(energy)}
        aria-valuemin={0}
        aria-valuemax={MAX_ENERGY}
      >
        <div
          className={`h-full rounded-full transition-all duration-200 ${barColor} ${
            flash ? "animate-energy-flash" : ""
          }`}
          style={{
            width: `${pct}%`,
            boxShadow: "0 0 10px currentColor",
          }}
        />
      </div>
      {state !== "normal" && (
        <p
          className={`mt-1 text-xs ${
            state === "critical" ? "text-red-400" : "text-amber-300"
          }`}
        >
          {state === "critical"
            ? "CRITICAL — answer a question soon!"
            : "Energy low — consider answering a question."}
        </p>
      )}
    </div>
  );
}
