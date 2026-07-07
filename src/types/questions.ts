/** Learning-domain types. Kept separate from game types so the question
 *  system can be swapped for an AI-backed implementation later. */

export type QuestionDifficulty = "foundation" | "applied" | "scenario";

export type QuestionType =
  | "definition"
  | "device_identification"
  | "comparison"
  | "packet_journey"
  | "troubleshooting"
  | "configuration_reasoning"
  | "customer_discovery"
  | "solution_recommendation"
  | "business_value"
  | "objection_handling"
  | "architecture_reasoning"
  | "demo_planning"
  | "explain_simply";

/** Whether the question paraphrases sourced material or is an original
 *  fictional scenario whose *technical concepts* are source-backed. */
export type ContentOrigin = "source_based_question" | "original_scenario";

export type LearningQuestion = {
  id: string;
  courseId: string;
  moduleId: string;
  topic: string;
  type: QuestionType;

  question: string;

  idealAnswer: string;
  acceptedAnswers: string[];
  acceptedSynonyms: string[];

  requiredConcepts: string[];
  optionalConcepts: string[];
  commonMistakes: string[];
  /** Statements that contradict the correct answer — matching one is graded down. */
  contradictoryConcepts?: string[];

  explanation: string;
  improvedAnswer: string;

  /** At least one id from the authoritative source registry. */
  sourceIds: string[];
  contentOrigin: ContentOrigin;

  /** Internal only — never shown as "L1/L2/L3" learning structure. */
  difficulty: QuestionDifficulty;
  energyReward: number;
};

/* ------------------------------------------------------------------ */
/* Authoritative sources                                               */
/* ------------------------------------------------------------------ */

export type AuthoritativeSource = {
  id: string;
  title: string;
  organisation: string;
  url: string;

  sourceType:
    | "standard"
    | "government"
    | "official_documentation"
    | "official_course"
    | "official_career_page"
    | "architecture_framework";

  topics: string[];
  accessedAt: string;
  publishedAt?: string;
  updatedAt?: string;

  authorityReason: string;
};

/* ------------------------------------------------------------------ */
/* Courses                                                             */
/* ------------------------------------------------------------------ */

export type CourseModule = {
  id: string;
  title: string;
  description: string;
  topics: string[];
  questionIds: string[];
  /** Source-registry ids backing this module's content. */
  sourceIds: string[];
};

export type CoursePack = {
  id: string;
  title: string;
  provider?: string;
  description: string;
  sourceUrl?: string;
  /** Emoji/short glyph used on course cards. */
  icon: string;
  /** Shown when the pack is inspired by an external resource. */
  disclaimer?: string;
  modules: CourseModule[];
};

/** Import schema for future externally-sourced courses (manual metadata,
 *  pasted objectives/notes — never scraped or copied assessments). */
export type CourseImport = {
  title: string;
  provider?: string;
  sourceUrl?: string;
  description?: string;
  modules: {
    title: string;
    learningObjectives: string[];
    notes?: string;
  }[];
};

/* ------------------------------------------------------------------ */
/* Evaluation                                                          */
/* ------------------------------------------------------------------ */

export type AnswerVerdict =
  | "incorrect"
  | "partially_correct"
  | "correct"
  | "excellent";

export type EvaluatedBy = "local" | "ai" | "cache";

export type AnswerEvaluation = {
  /** 0..100 */
  score: number;
  verdict: AnswerVerdict;

  correctConcepts: string[];
  missingConcepts: string[];
  incorrectClaims: string[];

  /** ≤ 3 short sentences. */
  feedback: string;
  improvedAnswer: string;

  energyReward: number;
  evaluatedBy: EvaluatedBy;

  /** Client-side notice, e.g. "AI feedback temporarily unavailable". */
  notice?: string;
};

/** Request body for POST /api/evaluate-answer. */
export type EvaluateAnswerRequest = {
  questionId: string;
  question: string;
  questionType: QuestionType;

  idealAnswer: string;
  acceptedAnswers: string[];
  requiredConcepts: string[];
  optionalConcepts: string[];
  commonMistakes: string[];

  playerAnswer: string;
};

/**
 * Pluggable grader. The MVP ships a local rubric provider plus a Gemini
 * provider that calls OUR backend (which holds the API key — never the
 * frontend). The local rubric is always the fallback so the game stays
 * playable offline, without a key, or when the free tier is exhausted.
 */
export interface AnswerEvaluationProvider {
  evaluateAnswer(
    question: LearningQuestion,
    playerAnswer: string
  ): Promise<AnswerEvaluation>;
}

/* ------------------------------------------------------------------ */
/* Per-question learning progress (persisted in localStorage)          */
/* ------------------------------------------------------------------ */

export type QuestionProgress = {
  questionId: string;
  attempts: number;
  correctAttempts: number;
  /** Rolling mean of rubric scores (0..1). */
  averageScore: number;
  lastAttemptedAt: string | null;
  nextReviewAt: string | null;
  /** 0..1 exponential moving average of answer quality. */
  mastery: number;
};

export type ProgressMap = Record<string, QuestionProgress>;
