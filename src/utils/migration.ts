import { DEFAULT_SETTINGS, type GameSettings } from "../types/game";
import { getCourse } from "../courses/courseRegistry";

/**
 * Migrate settings persisted by older versions:
 *  - v1 (level-based): had startLevel/category, no courseId → defaults
 *  - v2 (course-based): passes through, with defaults for any new fields
 * High scores, lifetime stats, and question progress live under separate,
 * unchanged localStorage keys and are never touched by migration.
 */
export function migrateSettings(loaded: GameSettings): GameSettings {
  const legacy = loaded as GameSettings & {
    startLevel?: number;
    category?: string;
  };
  if (!legacy.courseId || !getCourse(legacy.courseId)) {
    return { ...DEFAULT_SETTINGS, soundOn: legacy.soundOn ?? true };
  }
  return {
    ...DEFAULT_SETTINGS,
    ...loaded,
    moduleIds: legacy.moduleIds ?? null,
  };
}
