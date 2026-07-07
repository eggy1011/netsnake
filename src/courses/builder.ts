import type {
  ContentOrigin,
  CoursePack,
  LearningQuestion,
  QuestionDifficulty,
  QuestionType,
} from "../types/questions";
import { MODULE_SOURCES, TOPIC_SOURCES } from "./sourceRegistry";

/** Default max energy per difficulty: foundation 40, applied 50, scenario 60. */
export const DIFFICULTY_REWARD: Record<QuestionDifficulty, number> = {
  foundation: 40,
  applied: 50,
  scenario: 60,
};

/** Question types that present fictional customer/lab situations. Their
 *  narratives are original; only the technical concepts are source-backed. */
const SCENARIO_TYPES = new Set<QuestionType>([
  "customer_discovery",
  "solution_recommendation",
  "business_value",
  "objection_handling",
  "architecture_reasoning",
  "demo_planning",
]);

/** Compact authoring format — expanded into full LearningQuestions. */
export type QuestionSeed = {
  id: string;
  topic: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  question: string;
  accepted: string[];
  required: string[];
  optional?: string[];
  mistakes?: string[];
  /** Accepted synonym terms (merged into concept matching). */
  synonyms?: string[];
  /** Statements contradicting the correct answer. */
  contradicts?: string[];
  /** Concise ideal answer; defaults to `improved`. */
  ideal?: string;
  explanation: string;
  improved: string;
  /** Extra source ids beyond module/topic defaults. */
  sources?: string[];
  origin?: ContentOrigin;
  reward?: number;
};

export type ModuleSeed = {
  id: string;
  title: string;
  description: string;
  topics: string[];
  /** Overrides MODULE_SOURCES for this module if provided. */
  sourceIds?: string[];
  questions: QuestionSeed[];
};

export type CourseSeed = {
  id: string;
  title: string;
  provider?: string;
  description: string;
  sourceUrl?: string;
  icon: string;
  disclaimer?: string;
  modules: ModuleSeed[];
};

export type BuiltCourse = {
  pack: CoursePack;
  questions: LearningQuestion[];
};

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

export function defineCourse(seed: CourseSeed): BuiltCourse {
  const questions: LearningQuestion[] = [];
  const pack: CoursePack = {
    id: seed.id,
    title: seed.title,
    provider: seed.provider,
    description: seed.description,
    sourceUrl: seed.sourceUrl,
    icon: seed.icon,
    disclaimer: seed.disclaimer,
    modules: seed.modules.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      topics: m.topics,
      questionIds: m.questions.map((q) => q.id),
      sourceIds: unique(m.sourceIds ?? MODULE_SOURCES[m.id] ?? []),
    })),
  };

  for (const m of seed.modules) {
    const moduleSources = m.sourceIds ?? MODULE_SOURCES[m.id] ?? [];
    for (const q of m.questions) {
      const sourceIds = unique([
        ...(q.sources ?? []),
        ...(TOPIC_SOURCES[q.topic] ?? []),
        ...moduleSources,
      ]);
      const contentOrigin: ContentOrigin =
        q.origin ??
        (SCENARIO_TYPES.has(q.type) || q.difficulty === "scenario"
          ? "original_scenario"
          : "source_based_question");
      questions.push({
        id: q.id,
        courseId: seed.id,
        moduleId: m.id,
        topic: q.topic,
        type: q.type,
        question: q.question,
        idealAnswer: q.ideal ?? q.improved,
        acceptedAnswers: q.accepted,
        acceptedSynonyms: q.synonyms ?? [],
        requiredConcepts: q.required,
        optionalConcepts: q.optional ?? [],
        commonMistakes: q.mistakes ?? [],
        contradictoryConcepts: q.contradicts,
        explanation: q.explanation,
        improvedAnswer: q.improved,
        sourceIds,
        contentOrigin,
        difficulty: q.difficulty,
        energyReward: q.reward ?? DIFFICULTY_REWARD[q.difficulty],
      });
    }
  }
  return { pack, questions };
}
