import { describe, expect, it } from "vitest";
import {
  computeCourseStats,
  emptyProgress,
  isDueForReview,
  recordAttempt,
  weakTopicsFor,
} from "../questions/questionProgress";
import { getCourse, questionsForCourse } from "../courses/courseRegistry";
import type { AnswerEvaluation, ProgressMap } from "../types/questions";

function evalWith(verdict: AnswerEvaluation["verdict"]): AnswerEvaluation {
  return {
    verdict,
    score: verdict === "correct" ? 80 : verdict === "incorrect" ? 0 : 50,
    energyReward: 20,
    feedback: "x",
    improvedAnswer: "x",
    correctConcepts: [],
    missingConcepts: [],
    incorrectClaims: [],
    evaluatedBy: "local",
  };
}

const COURSE = "cisco-networking-basics";
const q = questionsForCourse(COURSE, null)[0];

describe("question progress tracking", () => {
  it("records attempts, correctness, and mastery", () => {
    let p: ProgressMap = {};
    const now = new Date("2026-07-06T10:00:00Z");
    p = recordAttempt(p, q, evalWith("correct"), now);
    expect(p[q.id].attempts).toBe(1);
    expect(p[q.id].correctAttempts).toBe(1);
    expect(p[q.id].mastery).toBeGreaterThan(0.7);
    expect(p[q.id].lastAttemptedAt).toBe(now.toISOString());

    p = recordAttempt(p, q, evalWith("incorrect"), now);
    expect(p[q.id].attempts).toBe(2);
    expect(p[q.id].correctAttempts).toBe(1);
    expect(p[q.id].mastery).toBeLessThan(0.7); // EMA dropped
  });

  it("schedules incorrect answers for earlier review than correct ones", () => {
    const now = new Date("2026-07-06T10:00:00Z");
    const wrong = recordAttempt({}, q, evalWith("incorrect"), now)[q.id];
    const right = recordAttempt({}, q, evalWith("excellent"), now)[q.id];
    expect(new Date(wrong.nextReviewAt!).getTime()).toBeLessThan(
      new Date(right.nextReviewAt!).getTime()
    );
    // Incorrect comes due within the hour; excellent doesn't.
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    expect(isDueForReview(wrong, inOneHour)).toBe(true);
    expect(isDueForReview(right, inOneHour)).toBe(false);
  });

  it("identifies weak topics from low mastery", () => {
    const pool = questionsForCourse(COURSE, null);
    const dnsQ = pool.find((x) => x.topic === "DNS")!;
    let p: ProgressMap = {};
    p = recordAttempt(p, dnsQ, evalWith("incorrect"));
    p = recordAttempt(p, dnsQ, evalWith("incorrect"));
    const weak = weakTopicsFor(COURSE, p);
    expect(weak.has("DNS")).toBe(true);
  });

  it("computes course completion and module accuracy", () => {
    const course = getCourse(COURSE)!;
    const pool = questionsForCourse(COURSE, null);
    let p: ProgressMap = {};
    // Answer the first 6 questions correctly.
    for (const question of pool.slice(0, 6)) {
      p = recordAttempt(p, question, evalWith("correct"));
    }
    const stats = computeCourseStats(course, p);
    expect(stats.attemptedQuestions).toBe(6);
    expect(stats.completionPct).toBe(Math.round((6 / pool.length) * 100));
    expect(stats.questionsAttempted).toBe(6);
    const attemptedModules = stats.moduleStats.filter((m) => m.attempted > 0);
    expect(attemptedModules.length).toBeGreaterThan(0);
    for (const m of attemptedModules) {
      expect(m.accuracy).toBe(1);
    }
  });

  it("starts fresh questions with empty progress", () => {
    const p = emptyProgress("x");
    expect(p.attempts).toBe(0);
    expect(p.mastery).toBe(0);
    expect(p.nextReviewAt).toBeNull();
  });
});
