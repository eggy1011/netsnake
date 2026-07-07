/** Tiny WebAudio synth — retro beeps with no external assets. */

let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(freq: number, durationMs: number, type: OscillatorType = "square", gain = 0.04) {
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + durationMs / 1000);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + durationMs / 1000);
}

export type SoundName =
  | "eat"
  | "bonus"
  | "question"
  | "correct"
  | "partial"
  | "wrong"
  | "gameover"
  | "lowEnergy";

const SOUNDS: Record<SoundName, () => void> = {
  eat: () => beep(520, 80),
  bonus: () => {
    beep(660, 70);
    setTimeout(() => beep(880, 90), 70);
  },
  question: () => {
    beep(440, 90, "triangle");
    setTimeout(() => beep(587, 110, "triangle"), 90);
  },
  correct: () => {
    beep(523, 80);
    setTimeout(() => beep(659, 80), 80);
    setTimeout(() => beep(784, 140), 160);
  },
  partial: () => {
    beep(523, 90);
    setTimeout(() => beep(587, 120), 90);
  },
  wrong: () => {
    beep(220, 140, "sawtooth");
    setTimeout(() => beep(174, 200, "sawtooth"), 140);
  },
  gameover: () => {
    beep(392, 120, "sawtooth");
    setTimeout(() => beep(311, 140, "sawtooth"), 130);
    setTimeout(() => beep(233, 280, "sawtooth"), 280);
  },
  lowEnergy: () => beep(330, 60, "triangle", 0.03),
};

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  try {
    SOUNDS[name]();
  } catch {
    /* audio not available — ignore */
  }
}
