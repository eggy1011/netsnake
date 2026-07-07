import type { CoursePack, LearningQuestion } from "../types/questions";
import { ciscoNetworkingBasics } from "./ciscoNetworkingBasics";
import { hardwareFundamentals } from "./hardwareFundamentals";
import { addressingTroubleshooting } from "./addressingTroubleshooting";
import { packetTracerPractice } from "./packetTracerPractice";
import { securityFundamentals } from "./securityFundamentals";
import { cloudHybridNetworking } from "./cloudHybridNetworking";
import { solutionEngineerScenarios } from "./solutionEngineerScenarios";
import {
  mixedAsePreparation,
  MIXED_ASE_ID,
  MIXED_ASE_WEIGHTS,
} from "./mixedAsePreparation";

export { MIXED_ASE_ID, MIXED_ASE_WEIGHTS };

const BUILT = [
  ciscoNetworkingBasics,
  hardwareFundamentals,
  addressingTroubleshooting,
  packetTracerPractice,
  securityFundamentals,
  cloudHybridNetworking,
  solutionEngineerScenarios,
];

/** Every question across all packs. */
export const ALL_QUESTIONS: LearningQuestion[] = BUILT.flatMap(
  (b) => b.questions
);

export const QUESTIONS_BY_ID: Map<string, LearningQuestion> = new Map(
  ALL_QUESTIONS.map((q) => [q.id, q])
);

/** Course packs shown in the Course Library (mixed pack last). */
export const COURSE_PACKS: CoursePack[] = [
  ...BUILT.map((b) => b.pack),
  mixedAsePreparation,
];

export function getCourse(courseId: string): CoursePack | undefined {
  return COURSE_PACKS.find((c) => c.id === courseId);
}

/**
 * All questions belonging to a course (and optionally a subset of modules).
 * For the mixed course, module ids refer to source areas.
 */
export function questionsForCourse(
  courseId: string,
  moduleIds: string[] | null
): LearningQuestion[] {
  const course = getCourse(courseId);
  if (!course) return [];
  const modules =
    moduleIds === null || moduleIds.length === 0
      ? course.modules
      : course.modules.filter((m) => moduleIds.includes(m.id));
  const ids = new Set(modules.flatMap((m) => m.questionIds));
  return ALL_QUESTIONS.filter((q) => ids.has(q.id));
}

/** Which module of a given course a question belongs to (handles mixed). */
export function moduleForQuestion(
  courseId: string,
  questionId: string
): string | null {
  const course = getCourse(courseId);
  if (!course) return null;
  const mod = course.modules.find((m) => m.questionIds.includes(questionId));
  return mod?.id ?? null;
}
