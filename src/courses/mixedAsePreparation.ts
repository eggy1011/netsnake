import type { CoursePack } from "../types/questions";
import { ciscoNetworkingBasics } from "./ciscoNetworkingBasics";
import { hardwareFundamentals } from "./hardwareFundamentals";
import { addressingTroubleshooting } from "./addressingTroubleshooting";
import { securityFundamentals } from "./securityFundamentals";
import { solutionEngineerScenarios } from "./solutionEngineerScenarios";

export const MIXED_ASE_ID = "mixed-ase-preparation";

/**
 * Configurable blend for Mixed Cisco ASE Preparation.
 * Values are selection weights (must sum to ~1). Adjust freely.
 */
export const MIXED_ASE_WEIGHTS: Record<string, number> = {
  [ciscoNetworkingBasics.pack.id]: 0.35, // networking foundations
  [hardwareFundamentals.pack.id]: 0.2, // hardware & devices
  [addressingTroubleshooting.pack.id]: 0.15, // troubleshooting
  [securityFundamentals.pack.id]: 0.1, // security
  [solutionEngineerScenarios.pack.id]: 0.2, // customer scenarios
};

const sources = [
  { built: ciscoNetworkingBasics, title: "Networking Foundations (35%)" },
  { built: hardwareFundamentals, title: "Hardware & Devices (20%)" },
  { built: addressingTroubleshooting, title: "Troubleshooting (15%)" },
  { built: securityFundamentals, title: "Security (10%)" },
  { built: solutionEngineerScenarios, title: "Customer Scenarios (20%)" },
];

/**
 * A virtual course that blends the other packs by weight. Its "modules" are
 * the source areas, so per-module accuracy still displays meaningfully.
 */
export const mixedAsePreparation: CoursePack = {
  id: MIXED_ASE_ID, // internal id kept stable for saved progress
  title: "Mixed Solution Engineer Preparation",
  description:
    "A weighted blend of everything an Associate Solution Engineer needs: fundamentals, hardware, troubleshooting, security, and customer scenarios.",
  icon: "🎯",
  disclaimer:
    "Supplementary practice combining all course packs. This is not an official Cisco assessment.",
  modules: sources.map(({ built, title }) => ({
    id: `mix-${built.pack.id}`,
    title,
    description: built.pack.description,
    topics: built.pack.modules.flatMap((m) => m.topics),
    questionIds: built.questions.map((q) => q.id),
    sourceIds: [...new Set(built.pack.modules.flatMap((m) => m.sourceIds))],
  })),
};
