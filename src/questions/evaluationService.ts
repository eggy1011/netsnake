import type {
  AnswerEvaluation,
  AnswerEvaluationProvider,
  AnswerVerdict,
  EvaluateAnswerRequest,
  LearningQuestion,
  QuestionType,
} from "../types/questions";
import { evaluateLocallyDetailed, VERDICT_ENERGY } from "./localEvaluator";
import { EvaluationCache } from "./evaluationCache";

/* ------------------------------------------------------------------ */
/* Which questions benefit from AI grading                             */
/* ------------------------------------------------------------------ */

/** Free-form reasoning/communication answers that keyword rubrics grade
 *  coarsely — the AI evaluator is preferred here (when it's available). */
export const AI_PREFERRED_TYPES = new Set<QuestionType>([
  "customer_discovery",
  "solution_recommendation",
  "business_value",
  "objection_handling",
  "architecture_reasoning",
  "demo_planning",
  "explain_simply",
  "troubleshooting",
]);

const VALID_VERDICTS: AnswerVerdict[] = [
  "incorrect",
  "partially_correct",
  "correct",
  "excellent",
];

export const AI_UNAVAILABLE_NOTICE =
  "AI feedback is temporarily unavailable. Your answer was checked using the local question rubric.";

/* ------------------------------------------------------------------ */
/* Usage stats (dev panel)                                             */
/* ------------------------------------------------------------------ */

export type EvaluationStats = {
  aiEvaluations: number;
  localEvaluations: number;
  cachedEvaluations: number;
  failedApiCalls: number;
  /** Rough free-tier usage: AI calls made this session. */
  estimatedFreeTierCalls: number;
  lastEvaluator: "local" | "ai" | "cache" | null;
  model: string | null;
};

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

export class LocalRubricEvaluationProvider implements AnswerEvaluationProvider {
  async evaluateAnswer(
    question: LearningQuestion,
    playerAnswer: string
  ): Promise<AnswerEvaluation> {
    return evaluateLocallyDetailed(question, playerAnswer).evaluation;
  }
}

/**
 * Calls OUR backend (`/api/evaluate-answer`), which holds the Gemini key.
 * The frontend never sees the API key. Throws on any failure — the hybrid
 * service catches and falls back to the local rubric.
 */
export class GeminiAnswerEvaluationProvider implements AnswerEvaluationProvider {
  constructor(
    private endpoint = "/api/evaluate-answer",
    private timeoutMs = 12_000,
    private fetchFn: typeof fetch = (...args) => fetch(...args)
  ) {}

  async evaluateAnswer(
    question: LearningQuestion,
    playerAnswer: string
  ): Promise<AnswerEvaluation> {
    const body: EvaluateAnswerRequest = {
      questionId: question.id,
      question: question.question,
      questionType: question.type,
      idealAnswer: question.idealAnswer,
      acceptedAnswers: question.acceptedAnswers,
      requiredConcepts: question.requiredConcepts,
      optionalConcepts: question.optionalConcepts,
      commonMistakes: question.commonMistakes,
      playerAnswer,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchFn(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status === 429) throw new Error("rate_limited");
      if (!res.ok) throw new Error(`evaluator_http_${res.status}`);
      const data: unknown = await res.json();
      return this.validate(data, question);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Client-side sanity validation (backend also validates with Zod). */
  private validate(data: unknown, question: LearningQuestion): AnswerEvaluation {
    const d = data as Partial<AnswerEvaluation> | null;
    if (
      !d ||
      typeof d.score !== "number" ||
      d.score < 0 ||
      d.score > 100 ||
      !VALID_VERDICTS.includes(d.verdict as AnswerVerdict) ||
      typeof d.feedback !== "string" ||
      typeof d.improvedAnswer !== "string" ||
      !Array.isArray(d.correctConcepts) ||
      !Array.isArray(d.missingConcepts) ||
      !Array.isArray(d.incorrectClaims)
    ) {
      throw new Error("invalid_evaluation_payload");
    }
    const verdict = d.verdict as AnswerVerdict;
    // Never trust the wire for energy: recompute from verdict + question cap.
    const energyReward = Math.min(VERDICT_ENERGY[verdict], question.energyReward);
    return {
      score: Math.round(d.score),
      verdict,
      correctConcepts: d.correctConcepts.map(String),
      missingConcepts: d.missingConcepts.map(String),
      incorrectClaims: d.incorrectClaims.map(String),
      feedback: d.feedback,
      improvedAnswer: d.improvedAnswer || question.improvedAnswer,
      energyReward,
      evaluatedBy: "ai",
    };
  }
}

/* ------------------------------------------------------------------ */
/* Hybrid service                                                      */
/* ------------------------------------------------------------------ */

/**
 * Evaluation flow (saves free-tier quota):
 *   1. cache hit → reuse
 *   2. local rubric runs first
 *   3. clearly correct / clearly incorrect, or a simple factual type → local
 *   4. otherwise → AI provider; on ANY failure → local result + notice
 */
export class HybridEvaluationService implements AnswerEvaluationProvider {
  private stats: EvaluationStats = {
    aiEvaluations: 0,
    localEvaluations: 0,
    cachedEvaluations: 0,
    failedApiCalls: 0,
    estimatedFreeTierCalls: 0,
    lastEvaluator: null,
    model: null,
  };
  private pending = new Set<string>();

  constructor(
    private ai: AnswerEvaluationProvider | null = new GeminiAnswerEvaluationProvider(),
    private cache: EvaluationCache = new EvaluationCache()
  ) {}

  getStats(): EvaluationStats {
    return { ...this.stats };
  }

  setModel(model: string | null) {
    this.stats.model = model;
  }

  /** True while an evaluation for this question is in flight (prevents
   *  duplicate submissions). */
  isPending(questionId: string): boolean {
    return this.pending.has(questionId);
  }

  async evaluateAnswer(
    question: LearningQuestion,
    playerAnswer: string
  ): Promise<AnswerEvaluation> {
    if (this.pending.has(question.id)) {
      throw new Error("evaluation_already_in_progress");
    }
    this.pending.add(question.id);
    try {
      return await this.doEvaluate(question, playerAnswer);
    } finally {
      this.pending.delete(question.id);
    }
  }

  private async doEvaluate(
    question: LearningQuestion,
    playerAnswer: string
  ): Promise<AnswerEvaluation> {
    /* 1. cache */
    const cached = this.cache.get(question.id, playerAnswer);
    if (cached) {
      this.stats.cachedEvaluations++;
      this.stats.lastEvaluator = "cache";
      return cached;
    }

    /* 2. local rubric first */
    const { evaluation: localEval, confident } = evaluateLocallyDetailed(
      question,
      playerAnswer
    );

    /* 3. decide whether AI adds value */
    const wantAi =
      this.ai !== null && AI_PREFERRED_TYPES.has(question.type) && !confident;

    if (!wantAi) {
      this.stats.localEvaluations++;
      this.stats.lastEvaluator = "local";
      this.cache.set(question.id, playerAnswer, localEval);
      return localEval;
    }

    /* 4. AI with local fallback */
    try {
      const aiEval = await this.ai!.evaluateAnswer(question, playerAnswer);
      this.stats.aiEvaluations++;
      this.stats.estimatedFreeTierCalls++;
      this.stats.lastEvaluator = "ai";
      this.cache.set(question.id, playerAnswer, aiEval);
      return aiEval;
    } catch {
      this.stats.failedApiCalls++;
      this.stats.localEvaluations++;
      this.stats.lastEvaluator = "local";
      // Don't cache the fallback as authoritative for AI-preferred questions —
      // a later attempt should be allowed to try the AI again.
      return { ...localEval, notice: AI_UNAVAILABLE_NOTICE };
    }
  }
}

export const evaluationService = new HybridEvaluationService();
