import type {
  AnswerEvaluation,
  CoursePack,
  LearningQuestion,
  ProgressMap,
  QuestionProgress,
} from "../types/questions";
import { questionsForCourse, QUESTIONS_BY_ID } from "../courses/courseRegistry";

export const PROGRESS_STORAGE_KEY = "netsnake:progress:v1";

/* ------------------------------------------------------------------ */
/* Recording attempts                                                  */
/* ------------------------------------------------------------------ */

const VERDICT_SCORE: Record<string, number> = {
  excellent: 1,
  correct: 0.85,
  partially_correct: 0.45,
  incorrect: 0,
};

/** Spaced-review intervals (ms) by verdict — worse answers return sooner. */
const REVIEW_INTERVAL_MS: Record<string, number> = {
  incorrect: 10 * 60 * 1000, // 10 minutes
  partially_correct: 2 * 60 * 60 * 1000, // 2 hours
  correct: 24 * 60 * 60 * 1000, // 1 day
  excellent: 3 * 24 * 60 * 60 * 1000, // 3 days
};

export function emptyProgress(questionId: string): QuestionProgress {
  return {
    questionId,
    attempts: 0,
    correctAttempts: 0,
    averageScore: 0,
    lastAttemptedAt: null,
    nextReviewAt: null,
    mastery: 0,
  };
}

export function recordAttempt(
  progress: ProgressMap,
  question: LearningQuestion,
  evaluation: AnswerEvaluation,
  now: Date = new Date()
): ProgressMap {
  const prev = progress[question.id] ?? emptyProgress(question.id);
  const s = VERDICT_SCORE[evaluation.verdict] ?? 0;
  const attempts = prev.attempts + 1;
  const next: QuestionProgress = {
    questionId: question.id,
    attempts,
    correctAttempts:
      prev.correctAttempts +
      (evaluation.verdict === "correct" || evaluation.verdict === "excellent" ? 1 : 0),
    averageScore: (prev.averageScore * prev.attempts + s) / attempts,
    lastAttemptedAt: now.toISOString(),
    nextReviewAt: new Date(
      now.getTime() + REVIEW_INTERVAL_MS[evaluation.verdict]
    ).toISOString(),
    // Exponential moving average, weighted toward recent performance.
    mastery: prev.attempts === 0 ? s : prev.mastery * 0.6 + s * 0.4,
  };
  return { ...progress, [question.id]: next };
}

export function isDueForReview(p: QuestionProgress | undefined, now: Date = new Date()): boolean {
  if (!p || !p.nextReviewAt) return false;
  return new Date(p.nextReviewAt).getTime() <= now.getTime();
}

/* ------------------------------------------------------------------ */
/* Aggregated course statistics                                        */
/* ------------------------------------------------------------------ */

export type TopicStat = {
  topic: string;
  attempts: number;
  mastery: number; // mean mastery of attempted questions in the topic
};

export type ModuleStat = {
  moduleId: string;
  title: string;
  total: number;
  attempted: number;
  accuracy: number; // correct attempts / attempts (0..1)
  averageMastery: number;
};

export type CourseStats = {
  courseId: string;
  totalQuestions: number;
  attemptedQuestions: number;
  completionPct: number;
  questionsAttempted: number; // total attempts incl. retries
  averageScore: number;
  moduleStats: ModuleStat[];
  strongTopics: string[];
  weakTopics: string[];
  dueForReview: number;
  commonMisconceptions: string[];
};

export function computeCourseStats(
  course: CoursePack,
  progress: ProgressMap,
  now: Date = new Date()
): CourseStats {
  const questions = questionsForCourse(course.id, null);
  const attempted = questions.filter((q) => (progress[q.id]?.attempts ?? 0) > 0);

  /* per-module */
  const moduleStats: ModuleStat[] = course.modules.map((m) => {
    const qs = m.questionIds
      .map((id) => QUESTIONS_BY_ID.get(id))
      .filter((q): q is LearningQuestion => !!q);
    const withAttempts = qs.filter((q) => (progress[q.id]?.attempts ?? 0) > 0);
    const attemptsSum = withAttempts.reduce(
      (a, q) => a + (progress[q.id]?.attempts ?? 0), 0);
    const correctSum = withAttempts.reduce(
      (a, q) => a + (progress[q.id]?.correctAttempts ?? 0), 0);
    const masterySum = withAttempts.reduce(
      (a, q) => a + (progress[q.id]?.mastery ?? 0), 0);
    return {
      moduleId: m.id,
      title: m.title,
      total: qs.length,
      attempted: withAttempts.length,
      accuracy: attemptsSum > 0 ? correctSum / attemptsSum : 0,
      averageMastery: withAttempts.length > 0 ? masterySum / withAttempts.length : 0,
    };
  });

  /* per-topic */
  const topicMap = new Map<string, { attempts: number; masterySum: number; n: number }>();
  for (const q of attempted) {
    const p = progress[q.id]!;
    const t = topicMap.get(q.topic) ?? { attempts: 0, masterySum: 0, n: 0 };
    t.attempts += p.attempts;
    t.masterySum += p.mastery;
    t.n += 1;
    topicMap.set(q.topic, t);
  }
  const topicStats: TopicStat[] = [...topicMap.entries()].map(([topic, t]) => ({
    topic,
    attempts: t.attempts,
    mastery: t.masterySum / t.n,
  }));

  const strongTopics = topicStats
    .filter((t) => t.mastery >= 0.75)
    .sort((a, b) => b.mastery - a.mastery)
    .map((t) => t.topic);
  const weakTopics = topicStats
    .filter((t) => t.mastery < 0.5)
    .sort((a, b) => a.mastery - b.mastery)
    .map((t) => t.topic);

  /* misconceptions: common mistakes of low-mastery attempted questions */
  const commonMisconceptions = attempted
    .filter((q) => (progress[q.id]?.mastery ?? 0) < 0.5)
    .flatMap((q) => q.commonMistakes)
    .slice(0, 5);

  const attemptsTotal = attempted.reduce(
    (a, q) => a + (progress[q.id]?.attempts ?? 0), 0);
  const scoreSum = attempted.reduce(
    (a, q) => a + (progress[q.id]?.averageScore ?? 0), 0);

  return {
    courseId: course.id,
    totalQuestions: questions.length,
    attemptedQuestions: attempted.length,
    completionPct:
      questions.length > 0
        ? Math.round((attempted.length / questions.length) * 100)
        : 0,
    questionsAttempted: attemptsTotal,
    averageScore: attempted.length > 0 ? scoreSum / attempted.length : 0,
    moduleStats,
    strongTopics,
    weakTopics,
    dueForReview: questions.filter((q) => isDueForReview(progress[q.id], now)).length,
    commonMisconceptions,
  };
}

/** Topics in a course with mastery below the weak threshold (attempted only). */
export function weakTopicsFor(
  courseId: string,
  progress: ProgressMap
): Set<string> {
  const questions = questionsForCourse(courseId, null);
  const byTopic = new Map<string, { masterySum: number; n: number }>();
  for (const q of questions) {
    const p = progress[q.id];
    if (!p || p.attempts === 0) continue;
    const t = byTopic.get(q.topic) ?? { masterySum: 0, n: 0 };
    t.masterySum += p.mastery;
    t.n += 1;
    byTopic.set(q.topic, t);
  }
  const weak = new Set<string>();
  for (const [topic, t] of byTopic) {
    if (t.masterySum / t.n < 0.5) weak.add(topic);
  }
  return weak;
}
