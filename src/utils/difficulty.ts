import {
  CHALLENGE_TIERS,
  DRAIN_ADJUST,
  ENERGY_COST_PER_MOVE,
  SPEED_ADJUST_MS,
  type ChallengeTier,
  type GameSettings,
} from "../types/game";

/** Challenge intensity tier for a given score — pure gameplay pacing,
 *  entirely independent of the selected learning course. */
export function tierForScore(score: number): ChallengeTier {
  let current = CHALLENGE_TIERS[0];
  for (const t of CHALLENGE_TIERS) {
    if (score >= t.scoreThreshold) current = t;
  }
  return current;
}

/** ms per snake step, combining tier pace, speed setting, and snake length. */
export function tickInterval(
  tier: ChallengeTier,
  settings: GameSettings,
  snakeLength: number
): number {
  const lengthBoost = Math.min(30, Math.floor(snakeLength / 5) * 4);
  return Math.max(
    55,
    tier.baseTickMs + SPEED_ADJUST_MS[settings.speed] - lengthBoost
  );
}

/** Energy consumed per move for the current tier + user drain setting. */
export function energyCostPerMove(
  tier: ChallengeTier,
  settings: GameSettings
): number {
  return ENERGY_COST_PER_MOVE * tier.drainMultiplier * DRAIN_ADJUST[settings.drain];
}
