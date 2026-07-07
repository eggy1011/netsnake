import { describe, expect, it } from "vitest";
import { migrateSettings } from "../utils/migration";
import { DEFAULT_SETTINGS, type GameSettings } from "../types/game";
import { EvaluationCache, hashKey } from "../questions/evaluationCache";
import type { AnswerEvaluation } from "../types/questions";

describe("localStorage settings migration", () => {
  it("migrates v1 level-based settings without losing sound preference", () => {
    const v1 = {
      startLevel: 3,
      category: "security",
      speed: "fast",
      drain: "normal",
      soundOn: false,
    } as unknown as GameSettings;
    const migrated = migrateSettings(v1);
    expect(migrated.courseId).toBe(DEFAULT_SETTINGS.courseId);
    expect(migrated.soundOn).toBe(false);
    expect(migrated.moduleIds).toBeNull();
    expect(migrated.studyMode).toBe("all");
  });

  it("preserves valid v2 course-based settings", () => {
    const v2: GameSettings = {
      ...DEFAULT_SETTINGS,
      courseId: "security-fundamentals",
      speed: "fast",
      durationMin: 10,
    };
    const migrated = migrateSettings(v2);
    expect(migrated.courseId).toBe("security-fundamentals");
    expect(migrated.speed).toBe("fast");
    expect(migrated.durationMin).toBe(10);
  });

  it("falls back to defaults for a deleted/unknown course id", () => {
    const migrated = migrateSettings({
      ...DEFAULT_SETTINGS,
      courseId: "course-that-no-longer-exists",
    });
    expect(migrated.courseId).toBe(DEFAULT_SETTINGS.courseId);
  });
});

describe("evaluation cache", () => {
  const evaluation: AnswerEvaluation = {
    score: 90,
    verdict: "correct",
    correctConcepts: ["dns"],
    missingConcepts: [],
    incorrectClaims: [],
    feedback: "Good.",
    improvedAnswer: "Check DNS.",
    energyReward: 40,
    evaluatedBy: "ai",
  };

  function memCache(max?: number) {
    const mem = new Map<string, string>();
    return new EvaluationCache(
      { get: (k) => mem.get(k) ?? null, set: (k, v) => void mem.set(k, v) },
      max
    );
  }

  it("hashes question id + normalised answer (case/punctuation-insensitive)", () => {
    expect(hashKey("q1", "Check DNS!!")).toBe(hashKey("q1", "check dns"));
    expect(hashKey("q1", "check dns")).not.toBe(hashKey("q2", "check dns"));
    expect(hashKey("q1", "check dns")).not.toBe(hashKey("q1", "check dhcp"));
  });

  it("returns cached entries marked evaluatedBy: cache", () => {
    const c = memCache();
    c.set("q1", "Check DNS", evaluation);
    const hit = c.get("q1", "check dns!");
    expect(hit?.verdict).toBe("correct");
    expect(hit?.evaluatedBy).toBe("cache");
    expect(c.get("q1", "different answer")).toBeNull();
  });

  it("strips transient notices before storing", () => {
    const c = memCache();
    c.set("q1", "a", { ...evaluation, notice: "AI down" });
    expect(c.get("q1", "a")?.notice).toBeUndefined();
  });

  it("evicts the oldest entries beyond the maximum size", () => {
    const c = memCache(3);
    c.set("q1", "a", evaluation);
    c.set("q2", "b", evaluation);
    c.set("q3", "c", evaluation);
    c.set("q4", "d", evaluation); // evicts q1 (oldest)
    expect(c.size).toBe(3);
    expect(c.get("q1", "a")).toBeNull();
    expect(c.get("q4", "d")).not.toBeNull();
  });
});
