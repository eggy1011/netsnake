import { useEffect, useRef } from "react";

/**
 * Fixed-step game loop built on requestAnimationFrame with an accumulator,
 * so the step interval can change smoothly as difficulty increases.
 */
export function useGameLoop(
  running: boolean,
  intervalMs: number,
  onStep: () => void
) {
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  const intervalRef = useRef(intervalMs);
  intervalRef.current = intervalMs;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const frame = (now: number) => {
      acc += now - last;
      last = now;
      // Catch up at most a few steps to avoid spiral-of-death after tab blur.
      let steps = 0;
      while (acc >= intervalRef.current && steps < 4) {
        stepRef.current();
        acc -= intervalRef.current;
        steps++;
      }
      if (steps === 4) acc = 0;
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}
