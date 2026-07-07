import { useEffect, useState } from "react";
import {
  evaluationService,
  type EvaluationStats,
} from "../questions/evaluationService";

/**
 * Development-only evaluation stats. Hidden in production unless explicitly
 * enabled with:  localStorage.setItem("netsnake:devpanel", "1")
 */
export default function DevStatsPanel() {
  const [stats, setStats] = useState<EvaluationStats | null>(null);
  const [open, setOpen] = useState(false);

  const enabled =
    import.meta.env.DEV ||
    (() => {
      try {
        return window.localStorage.getItem("netsnake:devpanel") === "1";
      } catch {
        return false;
      }
    })();

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setStats(evaluationService.getStats()), 1000);
    return () => clearInterval(t);
  }, [enabled]);

  if (!enabled || !stats) return null;

  return (
    <div className="fixed bottom-2 right-2 z-40 font-mono text-[10px]">
      {open ? (
        <div className="rounded-md border border-slate-700 bg-slate-950/95 p-2 text-slate-300 shadow-lg">
          <div className="mb-1 flex items-center justify-between gap-4">
            <span className="font-bold text-cyan-400">EVAL STATS</span>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
              ✕
            </button>
          </div>
          <table>
            <tbody>
              <Row label="AI evaluations" value={stats.aiEvaluations} />
              <Row label="Local evaluations" value={stats.localEvaluations} />
              <Row label="Cached evaluations" value={stats.cachedEvaluations} />
              <Row label="Failed API calls" value={stats.failedApiCalls} />
              <Row label="Est. free-tier calls" value={stats.estimatedFreeTierCalls} />
              <Row label="Last evaluator" value={stats.lastEvaluator ?? "—"} />
              <Row label="AI model" value={stats.model ?? "not configured"} />
            </tbody>
          </table>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded border border-slate-700 bg-slate-950/90 px-2 py-1 text-slate-500 hover:text-cyan-400"
        >
          ⚙ eval
        </button>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <tr>
      <td className="pr-3 text-slate-500">{label}</td>
      <td className="text-right text-slate-200">{value}</td>
    </tr>
  );
}
