import { describe, expect, it } from "vitest";
import {
  ALL_QUESTIONS,
  COURSE_PACKS,
  getCourse,
  MIXED_ASE_ID,
  MIXED_ASE_WEIGHTS,
  questionsForCourse,
} from "../courses/courseRegistry";

describe("course registry integrity", () => {
  it("meets the minimum question counts per pack", () => {
    const expectMin: Record<string, number> = {
      "cisco-networking-basics": 60,
      "hardware-fundamentals": 60,
      "ip-troubleshooting": 60,
      "packet-tracer-practice": 40,
      "security-fundamentals": 50,
      "solution-engineer-scenarios": 80,
    };
    for (const [courseId, min] of Object.entries(expectMin)) {
      const count = questionsForCourse(courseId, null).length;
      expect(count, `${courseId} should have ≥ ${min} questions`).toBeGreaterThanOrEqual(min);
    }
  });

  it("has globally unique question ids", () => {
    const ids = new Set(ALL_QUESTIONS.map((q) => q.id));
    expect(ids.size).toBe(ALL_QUESTIONS.length);
  });

  it("gives every question the required teaching fields", () => {
    for (const q of ALL_QUESTIONS) {
      expect(q.explanation.length, q.id).toBeGreaterThan(10);
      expect(q.improvedAnswer.length, q.id).toBeGreaterThan(10);
      expect(q.acceptedAnswers.length, q.id).toBeGreaterThan(0);
      expect(q.energyReward, q.id).toBeGreaterThanOrEqual(40);
      expect(q.energyReward, q.id).toBeLessThanOrEqual(60);
      expect(q.courseId, q.id).toBeTruthy();
      expect(q.moduleId, q.id).toBeTruthy();
    }
  });

  it("caps energy rewards by difficulty (40/50/60)", () => {
    const caps = { foundation: 40, applied: 50, scenario: 60 };
    for (const q of ALL_QUESTIONS) {
      expect(q.energyReward, q.id).toBeLessThanOrEqual(caps[q.difficulty]);
    }
  });

  it("module questionIds all resolve to real questions", () => {
    const ids = new Set(ALL_QUESTIONS.map((q) => q.id));
    for (const pack of COURSE_PACKS) {
      for (const m of pack.modules) {
        for (const qid of m.questionIds) {
          expect(ids.has(qid), `${pack.id}/${m.id}/${qid}`).toBe(true);
        }
      }
    }
  });

  it("includes the mixed ASE pack with configurable weights summing to 1", () => {
    expect(getCourse(MIXED_ASE_ID)).toBeDefined();
    const total = Object.values(MIXED_ASE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("filters questions by selected modules", () => {
    const course = getCourse("cisco-networking-basics")!;
    const firstModule = course.modules[0];
    const qs = questionsForCourse(course.id, [firstModule.id]);
    expect(qs.length).toBe(firstModule.questionIds.length);
    expect(qs.every((q) => q.moduleId === firstModule.id)).toBe(true);
  });
});
