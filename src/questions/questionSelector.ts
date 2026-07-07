import type { LearningQuestion, ProgressMap } from "../types/questions";
import {
  getCourse,
  MIXED_ASE_ID,
  MIXED_ASE_WEIGHTS,
  questionsForCourse,
} from "../courses/courseRegistry";
import { isDueForReview, weakTopicsFor } from "./questionProgress";
import type { StudyMode } from "../types/game";

export type SelectorOptions = {
  courseId: string;
  /** null = entire course; for the mixed course these are source-area ids. */
  moduleIds: string[] | null;
  studyMode: StudyMode;
  progress: ProgressMap;
  /** Question ids already served this session (non-repeat until exhausted). */
  servedIds: Set<string>;
  /** Most recently answered ids (never repeat immediately). */
  recentIds: string[];
  /** Injectable RNG for deterministic tests. */
  rng?: () => number;
  now?: Date;
};

/* ------------------------------------------------------------------ */
/* Pool construction                                                   */
/* ------------------------------------------------------------------ */

export function buildPool(opts: SelectorOptions): LearningQuestion[] {
  const { courseId, moduleIds, studyMode, progress } = opts;
  let pool = questionsForCourse(courseId, moduleIds);

  if (studyMode === "weak") {
    const weak = weakTopicsFor(courseId, progress);
    const weakPool = pool.filter((q) => weak.has(q.topic));
    if (weakPool.length > 0) pool = weakPool;
    // No weak topics yet → fall back to the whole selection.
  } else if (studyMode === "incorrect") {
    const missed = pool.filter((q) => {
      const p = progress[q.id];
      return p && p.attempts > 0 && p.correctAttempts < p.attempts;
    });
    if (missed.length > 0) pool = missed;
  }
  return pool;
}

/* ------------------------------------------------------------------ */
/* Weighted selection                                                  */
/* ------------------------------------------------------------------ */

function questionWeight(
  q: LearningQuestion,
  opts: SelectorOptions,
  weakTopics: Set<string>,
  attemptedInCourse: number,
  now: Date
): number {
  const p = opts.progress[q.id];
  let w = 1;

  // Spaced review: due questions come back sooner.
  if (isDueForReview(p, now)) w *= 4;

  // Weak topics appear more frequently.
  if (weakTopics.has(q.topic)) w *= 2.5;

  // Low mastery (attempted but shaky) gets a boost; mastered questions fade.
  if (p && p.attempts > 0) {
    if (p.mastery < 0.5) w *= 1.5;
    else if (p.mastery > 0.85) w *= 0.4;
  }

  // New learners see foundation questions first.
  if (attemptedInCourse < 8) {
    if (q.difficulty === "foundation") w *= 3;
    else if (q.difficulty === "scenario") w *= 0.4;
  }

  // Scenario questions appear more often in the SE course.
  if (
    q.courseId === "solution-engineer-scenarios" &&
    q.difficulty === "scenario"
  ) {
    w *= 1.5;
  }

  return w;
}

function weightedPick(
  pool: LearningQuestion[],
  opts: SelectorOptions,
  now: Date
): LearningQuestion {
  const rng = opts.rng ?? Math.random;
  const weakTopics = weakTopicsFor(opts.courseId, opts.progress);
  const attemptedInCourse = questionsForCourse(opts.courseId, null).filter(
    (q) => (opts.progress[q.id]?.attempts ?? 0) > 0
  ).length;

  const weights = pool.map((q) =>
    questionWeight(q, opts, weakTopics, attemptedInCourse, now)
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** For the mixed course: pick a source area by configured weight first. */
function mixedSourcePool(opts: SelectorOptions, base: LearningQuestion[]): LearningQuestion[] {
  const rng = opts.rng ?? Math.random;
  const entries = Object.entries(MIXED_ASE_WEIGHTS).filter(([srcCourse]) =>
    base.some((q) => q.courseId === srcCourse)
  );
  if (entries.length === 0) return base;
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let r = rng() * total;
  for (const [srcCourse, w] of entries) {
    r -= w;
    if (r <= 0) {
      const subset = base.filter((q) => q.courseId === srcCourse);
      if (subset.length > 0) return subset;
    }
  }
  return base;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Select the next question. Guarantees:
 *  - only questions from the selected course/modules/study-mode
 *  - no repeats until the pool is exhausted (then the served set resets)
 *  - recently answered questions are excluded while alternatives exist
 *  - due-for-review, weak-topic, and foundation-first weighting applied
 */
export function selectQuestion(opts: SelectorOptions): LearningQuestion | null {
  const now = opts.now ?? new Date();
  if (!getCourse(opts.courseId)) return null;

  let pool = buildPool(opts);
  if (pool.length === 0) return null;

  // Non-repeat within session.
  let fresh = pool.filter((q) => !opts.servedIds.has(q.id));
  if (fresh.length === 0) {
    opts.servedIds.clear(); // pool exhausted — start over
    fresh = pool;
  }

  // Avoid immediate repeats of the last few questions when possible.
  const recent = new Set(opts.recentIds.slice(-5));
  const nonRecent = fresh.filter((q) => !recent.has(q.id));
  if (nonRecent.length > 0) fresh = nonRecent;

  // Mixed ASE: honour the configured area blend.
  if (opts.courseId === MIXED_ASE_ID) {
    const blended = mixedSourcePool(opts, fresh);
    if (blended.length > 0) fresh = blended;
  }

  const pick = weightedPick(fresh, opts, now);
  opts.servedIds.add(pick.id);
  return pick;
}
