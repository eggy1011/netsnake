import type {
  AnswerEvaluation,
  AnswerVerdict,
  LearningQuestion,
} from "../types/questions";

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is",
  "are", "it", "its", "that", "this", "with", "by", "as", "at", "be",
  "i", "would", "we", "you", "they", "their", "your", "so", "then",
  "them", "was", "were", "will", "can", "could", "should", "do", "does",
]);

/** Lowercase, strip punctuation (keeping dots/slashes for IPs), squeeze spaces. */
export function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s./-]/g, " ")
    // Keep dots inside IP-like tokens (192.168.1.1) but strip sentence
    // punctuation so "an IP." tokenizes as "ip".
    .replace(/\.(?!\d)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalizeAnswer(text)
    .split(" ")
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

/** Tolerant token match: exact, singular/plural stem, or 1 typo for longer words. */
function tokenMatches(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4) {
    if (a.startsWith(b) || b.startsWith(a)) {
      return Math.abs(a.length - b.length) <= 3;
    }
    if (a.length >= 5 && b.length >= 5 && Math.abs(a.length - b.length) <= 1) {
      return editDistanceAtMostOne(a, b);
    }
  }
  return false;
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  if (l.length - s.length > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < s.length && j < l.length) {
    if (s[i] === l[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (s.length === l.length) { i++; j++; } else { j++; }
  }
  return edits + (l.length - j) + (s.length - i) <= 1;
}

/** Is a concept phrase present in the answer? Multi-word concepts match if
 *  enough of their significant words appear; single words must appear.
 *  `threshold` is raised for contradiction detection so generic shared
 *  tokens (e.g. "ip addresses") can't spuriously flag a wrong claim. */
export function conceptMatched(
  concept: string,
  answerTokens: string[],
  threshold = 0.5
): boolean {
  const conceptTokens = tokens(concept);
  if (conceptTokens.length === 0) {
    return normalizeAnswer(concept).length > 0;
  }
  const hits = conceptTokens.filter((ct) =>
    answerTokens.some((at) => tokenMatches(at, ct))
  ).length;
  if (conceptTokens.length === 1) return hits === 1;
  return hits / conceptTokens.length >= threshold;
}

function phraseHit(phrases: string[], player: string): boolean {
  for (const phrase of phrases) {
    const p = normalizeAnswer(phrase);
    if (p.length === 0) continue;
    if (player === p || player.includes(p)) return true;
    if (p.length >= 3 && player.length >= 3 && p.includes(player)) return true;
    const pTokens = tokens(p);
    if (pTokens.length > 0) {
      const playerTokens = tokens(player);
      const hits = pTokens.filter((t) =>
        playerTokens.some((pt) => tokenMatches(pt, t))
      ).length;
      if (hits / pTokens.length >= 0.7) return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Rubric grading                                                      */
/* ------------------------------------------------------------------ */

/** Energy per verdict (before per-question caps): excellent 50, correct 40,
 *  partial 20, incorrect-but-attempted 5. */
export const VERDICT_ENERGY: Record<AnswerVerdict, number> = {
  excellent: 50,
  correct: 40,
  partially_correct: 20,
  incorrect: 5,
};

export type LocalEvaluationResult = {
  evaluation: AnswerEvaluation;
  /** True when the local rubric is confident enough to skip AI grading. */
  confident: boolean;
};

/**
 * Rubric evaluation:
 *  - required concepts (plus synonyms) drive the score
 *  - accepted phrases guarantee at least "correct"
 *  - contradictory concepts pull the verdict down (confident wrongness ≠ credit)
 *  - grammar/spelling slips tolerated; exact wording never required
 */
export function evaluateLocallyDetailed(
  question: LearningQuestion,
  playerAnswer: string
): LocalEvaluationResult {
  const player = normalizeAnswer(playerAnswer);
  const answerTokens = tokens(player);

  const correctConcepts: string[] = [];
  const missingConcepts: string[] = [];
  for (const c of question.requiredConcepts) {
    (conceptMatched(c, answerTokens) ? correctConcepts : missingConcepts).push(c);
  }
  const optionalMatched = question.optionalConcepts.filter((c) =>
    conceptMatched(c, answerTokens)
  );
  const incorrectClaims = (question.contradictoryConcepts ?? []).filter((c) =>
    conceptMatched(c, answerTokens, 0.75)
  );

  const synonymHit =
    question.acceptedSynonyms.length > 0 &&
    question.acceptedSynonyms.some((s) => conceptMatched(s, answerTokens));

  const reqTotal = question.requiredConcepts.length;
  let reqRatio =
    reqTotal === 0
      ? answerTokens.length > 0
        ? 1
        : 0
      : correctConcepts.length / reqTotal;
  // A matched synonym can stand in for one missed required concept.
  if (synonymHit && reqTotal > 0 && reqRatio < 1) {
    reqRatio = Math.min(1, reqRatio + 1 / reqTotal);
  }

  const accepted =
    player.length > 0 &&
    (phraseHit(question.acceptedAnswers, player) ||
      phraseHit([question.idealAnswer], player));

  let verdict: AnswerVerdict;
  if (player.length === 0) {
    verdict = "incorrect";
  } else if (incorrectClaims.length > 0) {
    // Contradictions cap the verdict: partial credit only if correct concepts are also present.
    verdict =
      reqRatio >= 0.6 || accepted ? "partially_correct" : "incorrect";
  } else if (reqRatio === 1 && (optionalMatched.length > 0 || accepted)) {
    verdict = "excellent";
  } else if (reqRatio >= 0.6 || accepted) {
    verdict = "correct";
  } else if (reqRatio >= 0.3 || optionalMatched.length >= 2) {
    verdict = "partially_correct";
  } else if (optionalMatched.length === 1 && reqTotal > 0) {
    verdict = "partially_correct";
  } else {
    verdict = "incorrect";
  }

  const score = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        reqRatio * 75 +
          optionalMatched.length * 7 +
          (accepted ? 25 : 0) -
          incorrectClaims.length * 30
      )
    )
  );

  const energyReward = Math.min(VERDICT_ENERGY[verdict], question.energyReward);

  const feedback =
    verdict === "excellent"
      ? "Excellent — you covered the key concepts."
      : incorrectClaims.length > 0
        ? `Careful: "${incorrectClaims[0]}" contradicts the correct answer.`
        : missingConcepts.length > 0
          ? `Worth mentioning: ${missingConcepts.join(", ")}.`
          : verdict === "incorrect" && question.commonMistakes.length > 0
            ? `Common pitfall: ${question.commonMistakes[0]}`
            : "Compare your answer with the model answer below.";

  const evaluation: AnswerEvaluation = {
    score,
    verdict,
    correctConcepts: [...correctConcepts, ...optionalMatched],
    missingConcepts,
    incorrectClaims,
    feedback,
    improvedAnswer: question.improvedAnswer,
    energyReward,
    evaluatedBy: "local",
  };

  /* Confidence: clearly right or clearly wrong → no need to ask the AI. */
  const clearlyCorrect =
    verdict === "excellent" || (verdict === "correct" && score >= 80);
  const clearlyIncorrect =
    verdict === "incorrect" &&
    correctConcepts.length === 0 &&
    optionalMatched.length === 0 &&
    !accepted;
  const confident = clearlyCorrect || clearlyIncorrect || player.length === 0;

  return { evaluation, confident };
}

export function evaluateLocally(
  question: LearningQuestion,
  playerAnswer: string
): AnswerEvaluation {
  return evaluateLocallyDetailed(question, playerAnswer).evaluation;
}
