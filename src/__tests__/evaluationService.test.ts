import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AI_UNAVAILABLE_NOTICE,
  GeminiAnswerEvaluationProvider,
  HybridEvaluationService,
} from "../questions/evaluationService";
import { EvaluationCache } from "../questions/evaluationCache";
import { QUESTIONS_BY_ID } from "../courses/courseRegistry";
import type { AnswerEvaluation } from "../types/questions";

/* Mock AI evaluations — the real Gemini API is NEVER called from tests. */

const seQuestion = QUESTIONS_BY_ID.get("se-dis-1")!; // AI-preferred type
const factQuestion = QUESTIONS_BY_ID.get("nb-pro-6")!; // simple definition

const AI_RESULT: AnswerEvaluation = {
  score: 90,
  verdict: "correct",
  correctConcepts: ["scope"],
  missingConcepts: [],
  incorrectClaims: [],
  feedback: "Good clarification-first approach.",
  improvedAnswer: "Ask who is affected and when it started.",
  energyReward: 40,
  evaluatedBy: "ai",
};

/** In-memory store so tests never touch real localStorage. */
function memCache(): EvaluationCache {
  const mem = new Map<string, string>();
  return new EvaluationCache({
    get: (k) => mem.get(k) ?? null,
    set: (k, v) => void mem.set(k, v),
  });
}

function okAiProvider() {
  return { evaluateAnswer: vi.fn().mockResolvedValue(AI_RESULT) };
}

/** An ambiguous SE answer: some signal, not clearly right or wrong. */
const AMBIGUOUS = "maybe check which applications are involved";

describe("hybrid evaluation service", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("uses the local evaluator for simple factual questions (no AI call)", async () => {
    const ai = okAiProvider();
    const svc = new HybridEvaluationService(ai, memCache());
    const r = await svc.evaluateAnswer(factQuestion, "translates domain names into ip addresses");
    expect(r.evaluatedBy).toBe("local");
    expect(ai.evaluateAnswer).not.toHaveBeenCalled();
  });

  it("skips AI when the local rubric is confident, even on AI-preferred types", async () => {
    const ai = okAiProvider();
    const svc = new HybridEvaluationService(ai, memCache());
    // Empty answer → clearly incorrect → local handles it.
    const r = await svc.evaluateAnswer(seQuestion, "");
    expect(r.evaluatedBy).toBe("local");
    expect(ai.evaluateAnswer).not.toHaveBeenCalled();
  });

  it("asks the AI for ambiguous answers on AI-preferred question types", async () => {
    const ai = okAiProvider();
    const svc = new HybridEvaluationService(ai, memCache());
    const r = await svc.evaluateAnswer(seQuestion, AMBIGUOUS);
    expect(ai.evaluateAnswer).toHaveBeenCalledOnce();
    expect(r.evaluatedBy).toBe("ai");
    expect(svc.getStats().aiEvaluations).toBe(1);
  });

  it("falls back to the local rubric with a notice when AI fails", async () => {
    const ai = { evaluateAnswer: vi.fn().mockRejectedValue(new Error("rate_limited")) };
    const svc = new HybridEvaluationService(ai, memCache());
    const r = await svc.evaluateAnswer(seQuestion, AMBIGUOUS);
    expect(r.evaluatedBy).toBe("local");
    expect(r.notice).toBe(AI_UNAVAILABLE_NOTICE);
    expect(svc.getStats().failedApiCalls).toBe(1);
    // The game continues: a usable evaluation was still produced.
    expect(r.energyReward).toBeGreaterThanOrEqual(5);
  });

  it("works fully offline / with no AI provider configured", async () => {
    const svc = new HybridEvaluationService(null, memCache());
    const r = await svc.evaluateAnswer(seQuestion, AMBIGUOUS);
    expect(r.evaluatedBy).toBe("local");
  });

  it("reuses cached results for identical answers (no repeat AI charge)", async () => {
    const ai = okAiProvider();
    const svc = new HybridEvaluationService(ai, memCache());
    const first = await svc.evaluateAnswer(seQuestion, AMBIGUOUS);
    expect(first.evaluatedBy).toBe("ai");
    const second = await svc.evaluateAnswer(seQuestion, AMBIGUOUS);
    expect(second.evaluatedBy).toBe("cache");
    // Nearly identical (case/punctuation differences) also hits the cache.
    const third = await svc.evaluateAnswer(seQuestion, AMBIGUOUS.toUpperCase() + "!!");
    expect(third.evaluatedBy).toBe("cache");
    expect(ai.evaluateAnswer).toHaveBeenCalledOnce();
    expect(svc.getStats().cachedEvaluations).toBe(2);
  });

  it("prevents duplicate submissions while an evaluation is in flight", async () => {
    let resolveAi!: (v: AnswerEvaluation) => void;
    const ai = {
      evaluateAnswer: vi.fn().mockReturnValue(
        new Promise<AnswerEvaluation>((res) => (resolveAi = res))
      ),
    };
    const svc = new HybridEvaluationService(ai, memCache());
    const p1 = svc.evaluateAnswer(seQuestion, AMBIGUOUS);
    expect(svc.isPending(seQuestion.id)).toBe(true);
    await expect(svc.evaluateAnswer(seQuestion, AMBIGUOUS)).rejects.toThrow(
      "evaluation_already_in_progress"
    );
    resolveAi(AI_RESULT);
    await p1;
    expect(svc.isPending(seQuestion.id)).toBe(false);
  });
});

describe("Gemini provider (backend client, mocked fetch)", () => {
  const wireResult = {
    score: 85,
    verdict: "correct",
    correctConcepts: ["dns"],
    missingConcepts: [],
    incorrectClaims: [],
    feedback: "Right area to investigate.",
    improvedAnswer: "Check DNS first.",
    energyReward: 40,
    evaluatedBy: "ai",
  };

  it("posts the rubric to the backend and validates the response", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(wireResult), { status: 200 })
    );
    const p = new GeminiAnswerEvaluationProvider("/api/evaluate-answer", 5000, fetchFn);
    const r = await p.evaluateAnswer(seQuestion, "check dns");
    expect(r.verdict).toBe("correct");
    expect(r.evaluatedBy).toBe("ai");
    const body = JSON.parse((fetchFn.mock.calls[0][1] as RequestInit).body as string);
    expect(body.questionId).toBe(seQuestion.id);
    expect(body.requiredConcepts).toEqual(seQuestion.requiredConcepts);
  });

  it("rejects invalid AI JSON payloads", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ score: "high", verdict: "amazing" }), { status: 200 })
    );
    const p = new GeminiAnswerEvaluationProvider("/api/evaluate-answer", 5000, fetchFn);
    await expect(p.evaluateAnswer(seQuestion, "x")).rejects.toThrow(
      "invalid_evaluation_payload"
    );
  });

  it("rejects out-of-range scores", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...wireResult, score: 250 }), { status: 200 })
    );
    const p = new GeminiAnswerEvaluationProvider("/api/evaluate-answer", 5000, fetchFn);
    await expect(p.evaluateAnswer(seQuestion, "x")).rejects.toThrow();
  });

  it("surfaces rate limits (HTTP 429) as errors for fallback handling", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("", { status: 429 }));
    const p = new GeminiAnswerEvaluationProvider("/api/evaluate-answer", 5000, fetchFn);
    await expect(p.evaluateAnswer(seQuestion, "x")).rejects.toThrow("rate_limited");
  });

  it("times out slow requests via AbortController", async () => {
    const fetchFn = vi.fn().mockImplementation(
      (_url: unknown, init?: RequestInit) =>
        new Promise((_res, rej) => {
          init?.signal?.addEventListener("abort", () =>
            rej(new DOMException("aborted", "AbortError"))
          );
        })
    );
    const p = new GeminiAnswerEvaluationProvider("/api/evaluate-answer", 30, fetchFn as typeof fetch);
    await expect(p.evaluateAnswer(seQuestion, "x")).rejects.toThrow();
  });

  it("never trusts the wire for energy — recomputes from verdict + cap", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...wireResult, energyReward: 9999 }), { status: 200 })
    );
    const p = new GeminiAnswerEvaluationProvider("/api/evaluate-answer", 5000, fetchFn);
    const r = await p.evaluateAnswer(seQuestion, "x");
    expect(r.energyReward).toBeLessThanOrEqual(seQuestion.energyReward);
    expect(r.energyReward).toBe(40); // "correct" verdict
  });
});
