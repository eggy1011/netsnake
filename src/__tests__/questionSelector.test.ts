import { describe, expect, it } from "vitest";
import { selectQuestion, type SelectorOptions } from "../questions/questionSelector";
import { questionsForCourse, getCourse, MIXED_ASE_ID } from "../courses/courseRegistry";
import type { ProgressMap } from "../types/questions";
import { emptyProgress } from "../questions/questionProgress";

function opts(partial: Partial<SelectorOptions> = {}): SelectorOptions {
  return {
    courseId: "cisco-networking-basics",
    moduleIds: null,
    studyMode: "all",
    progress: {},
    servedIds: new Set<string>(),
    recentIds: [],
    rng: Math.random,
    ...partial,
  };
}

describe("question selector", () => {
  it("only returns questions from the selected course", () => {
    const o = opts({ courseId: "security-fundamentals" });
    for (let i = 0; i < 20; i++) {
      const q = selectQuestion(o)!;
      expect(q.courseId).toBe("security-fundamentals");
    }
  });

  it("only returns questions from the selected modules", () => {
    const course = getCourse("hardware-fundamentals")!;
    const moduleId = course.modules[1].id;
    const o = opts({ courseId: course.id, moduleIds: [moduleId] });
    for (let i = 0; i < 15; i++) {
      const q = selectQuestion(o)!;
      expect(q.moduleId).toBe(moduleId);
    }
  });

  it("does not repeat a question until the pool is exhausted", () => {
    const course = getCourse("packet-tracer-practice")!;
    const moduleId = course.modules[0].id;
    const poolSize = course.modules[0].questionIds.length;
    const o = opts({ courseId: course.id, moduleIds: [moduleId] });

    const seen = new Set<string>();
    for (let i = 0; i < poolSize; i++) {
      const q = selectQuestion(o)!;
      expect(seen.has(q.id), `repeat of ${q.id} before exhaustion`).toBe(false);
      seen.add(q.id);
    }
    expect(seen.size).toBe(poolSize);
    // Next pick reuses the pool without crashing.
    expect(selectQuestion(o)).not.toBeNull();
  });

  it("avoids immediately repeating recently answered questions", () => {
    const course = getCourse("packet-tracer-practice")!;
    const moduleId = course.modules[0].id;
    const ids = course.modules[0].questionIds;
    const recent = ids.slice(0, 3);
    const o = opts({
      courseId: course.id,
      moduleIds: [moduleId],
      recentIds: recent,
    });
    // Recents are avoided as long as alternatives exist in the pool.
    const alternatives = ids.length - recent.length;
    for (let i = 0; i < alternatives; i++) {
      const q = selectQuestion(o)!;
      expect(recent.includes(q.id)).toBe(false);
    }
  });

  it("prefers foundation questions for a learner with no history", () => {
    const o = opts({ courseId: "cisco-networking-basics" });
    let foundation = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      o.servedIds.clear();
      const q = selectQuestion(o)!;
      if (q.difficulty === "foundation") foundation++;
    }
    const pool = questionsForCourse("cisco-networking-basics", null);
    const baseRate = pool.filter((q) => q.difficulty === "foundation").length / pool.length;
    // With the 3x boost, the observed rate should clearly beat the base rate.
    expect(foundation / N).toBeGreaterThan(baseRate);
  });

  it("weights weak topics more heavily", () => {
    // Mark every DNS question as attempted-and-failed → weak topic.
    const pool = questionsForCourse("cisco-networking-basics", null);
    const progress: ProgressMap = {};
    for (const q of pool) {
      if (q.topic === "DNS") {
        progress[q.id] = { ...emptyProgress(q.id), attempts: 2, mastery: 0.1 };
      } else {
        // Give everything else history so foundation-first doesn't dominate.
        progress[q.id] = { ...emptyProgress(q.id), attempts: 1, mastery: 0.7 };
      }
    }
    const o = opts({ progress });
    let dns = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      o.servedIds.clear();
      const q = selectQuestion(o)!;
      if (q.topic === "DNS") dns++;
    }
    const baseRate = pool.filter((q) => q.topic === "DNS").length / pool.length;
    expect(dns / N).toBeGreaterThan(baseRate * 1.5);
  });

  it("study mode 'incorrect' only serves previously missed questions", () => {
    const pool = questionsForCourse("security-fundamentals", null);
    const missedIds = new Set(pool.slice(0, 5).map((q) => q.id));
    const progress: ProgressMap = {};
    for (const q of pool.slice(0, 10)) {
      progress[q.id] = {
        ...emptyProgress(q.id),
        attempts: 1,
        correctAttempts: missedIds.has(q.id) ? 0 : 1,
        mastery: missedIds.has(q.id) ? 0.1 : 0.9,
      };
    }
    const o = opts({
      courseId: "security-fundamentals",
      studyMode: "incorrect",
      progress,
    });
    for (let i = 0; i < 15; i++) {
      const q = selectQuestion(o)!;
      expect(missedIds.has(q.id)).toBe(true);
    }
  });

  it("mixed ASE course draws from multiple source courses", () => {
    const o = opts({ courseId: MIXED_ASE_ID });
    const courses = new Set<string>();
    for (let i = 0; i < 120; i++) {
      o.servedIds.clear();
      courses.add(selectQuestion(o)!.courseId);
    }
    expect(courses.size).toBeGreaterThanOrEqual(4);
  });

  it("returns null for an unknown course", () => {
    expect(selectQuestion(opts({ courseId: "no-such-course" }))).toBeNull();
  });
});
