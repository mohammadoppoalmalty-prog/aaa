/**
 * LUMA's scripted tree — the Guardian without the AI.
 *
 * Phase 1 ships this and only this, and it stays shipped forever: STANDARDS 3.6
 * lists "Guardian AI → 120-response scripted tree" as a degradation rung, so the
 * fallback is not a placeholder for the model, it is what runs when the model is
 * unavailable, rate-limited, or switched off. That makes it worth writing well.
 *
 * The matcher is a pure function of (question, stage). No network, no clock, no
 * randomness — so every answer is reproducible and the golden-question eval is a
 * unit test rather than a manual session.
 */

export interface LumaIntent {
  readonly id: string;
  /** Words that suggest this intent. Matching is on stems, not exact words. */
  readonly cues: readonly string[];
  /** Required cue groups — every group must contribute at least one match. */
  readonly requires?: readonly (readonly string[])[];
  /** The lowest stage at which LUMA will say this. */
  readonly stage: number;
  /**
   * Weight, default 1.
   *
   * Two intents can both honestly match a question — "I only have five minutes"
   * is both a question about length and a signal of impatience. When they
   * collide, the one that gets the visitor what they actually want has to win,
   * and impatience is the single most important signal in this project.
   */
  readonly priority?: number;
  readonly answer: string;
  /** Where the Codex says the same thing, at length. */
  readonly codex?: string;
}

export interface LumaReply {
  readonly intent: string;
  readonly text: string;
  readonly codex?: string | undefined;
  /** How confident the match was, 0–1. Below `MIN_CONFIDENCE` LUMA says so. */
  readonly confidence: number;
}

export const MIN_CONFIDENCE = 0.34;

/**
 * Cheap stemming: enough to match "projects" to "project", and no more.
 *
 * The rules are deliberately conservative, because over-stemming is the failure
 * that hurts. An earlier version stripped a trailing "es", which turned
 * "languages" into "languag" while the cue "language" stayed whole — so a
 * question about languages matched nothing at all and LUMA said it did not know.
 */
const stem = (word: string): string => {
  const cleaned = word.replace(/[^a-z0-9']/g, '').trim();
  if (cleaned.length > 4 && cleaned.endsWith('ing')) return cleaned.slice(0, -3);
  if (cleaned.length > 3 && cleaned.endsWith('ed')) return cleaned.slice(0, -2);
  if (cleaned.length > 3 && cleaned.endsWith('s') && !cleaned.endsWith('ss')) return cleaned.slice(0, -1);
  return cleaned;
};

const words = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/\s+/)
    .map(stem)
    .filter((w) => w.length > 1);

/**
 * Score an intent against a question.
 *
 * Deliberately simple and explainable: the fraction of the intent's cues that
 * appear, with a bonus for any required group being satisfied. A trained
 * classifier would score better on paper and be impossible to debug at 2 a.m.
 * when LUMA answers a recruiter's question about salary with a line about trees.
 */
function score(intent: LumaIntent, asked: readonly string[]): number {
  const set = new Set(asked);
  /* Cue stems are de-duplicated before counting. "work" and "worked" reduce to
     the same stem, and counting both would score a question twice for saying
     one word — which is how the work-history intent quietly outranked the one
     about failures on a question that was plainly about failures. */
  const stems = new Set(intent.cues.map(stem));
  const hits = [...stems].filter((cue) => set.has(cue)).length;
  if (hits === 0) return 0;

  if (intent.requires) {
    for (const group of intent.requires) {
      if (!group.some((cue) => set.has(stem(cue)))) return 0;
    }
  }

  /* Divided by a fixed three, not by the number of cues: dividing by the cue
     count punishes an intent for listing synonyms, so "how do I contact him"
     scored *lower* against an intent that knows eight ways to say contact than
     against one that knows two. Three cues is what a confident match looks
     like; anything past that is already certain. */
  const coverage = hits / 3;
  return Math.min(1, (coverage + (intent.requires ? 0.2 : 0)) * (intent.priority ?? 1));
}

export function ask(question: string, intents: readonly LumaIntent[], stage: number): LumaReply {
  const asked = words(question);
  let best: LumaIntent | null = null;
  let bestScore = 0;

  for (const intent of intents) {
    if (intent.stage > stage) continue;
    const value = score(intent, asked);
    if (value > bestScore) {
      best = intent;
      bestScore = value;
    }
  }

  if (!best || bestScore < MIN_CONFIDENCE) {
    return {
      intent: 'unknown',
      /* Saying "I don't know" in character costs nothing and keeps the fiction
         intact. Inventing an answer about someone's career does not. */
      text:
        'I do not hold that one. The Codex holds everything I do not — it is one key away, and it never asks you for anything.',
      codex: '/codex',
      confidence: bestScore,
    };
  }

  return { intent: best.id, text: best.answer, codex: best.codex, confidence: bestScore };
}

/** The stage LUMA has reached — GDD Part 5. Stages 3+ arrive with the AI. */
export const stageFromRestoration = (restoration: number): number => {
  if (restoration >= 0.6) return 2;
  if (restoration >= 0.15) return 1;
  return 0;
};
