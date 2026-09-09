import type { AreaId } from '../../areas/manifest';

/**
 * The puzzle framework.
 *
 * One rule shapes all of it: **a puzzle is a pure state machine.** `initial`,
 * `apply` and `validate` never touch the scene, the store, or the clock, so
 * every puzzle in the game can be solved, failed, skipped and regression-tested
 * in milliseconds — which is the only affordable way to be certain that none of
 * the sixteen can reach an unsolvable state.
 *
 * The scene binds inputs to `apply` and reads `validate`. Nothing else.
 */

export type PuzzleId = string;

export interface PuzzleReward {
  /** Memory ids granted on solve. */
  readonly memories?: readonly string[];
  /** Whether this puzzle holds one of the eight Core Fragments. */
  readonly fragment?: boolean;
}

export interface PuzzleDefinition<State, Input> {
  readonly id: PuzzleId;
  readonly area: AreaId;
  readonly title: string;
  /** One line, in LUMA's voice, shown when the puzzle is first approached. */
  readonly premise: string;
  /** Seeded so a bug report can carry a seed and reproduce the exact board. */
  initial(seed: number): State;
  apply(state: State, input: Input): State;
  validate(state: State): boolean;
  /**
   * Put the puzzle into a solved state.
   *
   * Required, not optional. A skipped puzzle grants its rewards *and* has to
   * show its result — the fountain erupts, the lanterns catch — because a skip
   * that leaves the world visibly broken reads as a bug rather than a mercy.
   * It doubles as the proof that a generated board is solvable at all, which is
   * how the unsolvable-board class of disaster is ruled out per seed.
   */
  solve(state: State): State;
  /** Escalating, never solving it outright until the last one. */
  readonly hints: readonly string[];
  readonly rewards: PuzzleReward;
  /** Seconds a competent player should need. Used only to time the skip offer. */
  readonly targetSeconds: number;
}

/* ── the skip policy ──────────────────────────────────────────────────────
   GDD Part 8: "Skip this puzzle" appears only after three minutes on an
   unsolved puzzle. STANDARDS 3.6: a skipped puzzle still grants its rewards.

   Both halves matter. Offering a skip immediately teaches that nothing is worth
   attempting; withholding the rewards turns the skip into a punishment, and a
   punished exit is not an exit. */

export const SKIP_OFFER_MS = 180_000;

export interface AttemptState {
  /** Milliseconds spent on this puzzle in this session. */
  readonly elapsedMs: number;
  readonly solved: boolean;
  readonly skipped: boolean;
  /** How many hints the player has asked for. */
  readonly hintsTaken: number;
}

export const shouldOfferSkip = (attempt: AttemptState): boolean =>
  !attempt.solved && !attempt.skipped && attempt.elapsedMs >= SKIP_OFFER_MS;

/**
 * Which hint to show next. Hints escalate on request only — an automatic hint
 * takes the puzzle away from the player who was about to solve it.
 */
export function nextHint<S, I>(puzzle: PuzzleDefinition<S, I>, attempt: AttemptState): string | null {
  if (attempt.solved) return null;
  return puzzle.hints[Math.min(attempt.hintsTaken, puzzle.hints.length - 1)] ?? null;
}

/** Rewards are identical whether the puzzle was solved or skipped. */
export const rewardsFor = <S, I>(puzzle: PuzzleDefinition<S, I>): PuzzleReward => puzzle.rewards;

/* ── a small deterministic RNG ───────────────────────────────────────────
   Seeded so `?seed=…` reproduces a board exactly, which is how a bug report
   becomes reproducible rather than a screenshot. */
export function rng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

export const registry = new Map<PuzzleId, PuzzleDefinition<unknown, unknown>>();

export function register<S, I>(puzzle: PuzzleDefinition<S, I>): PuzzleDefinition<S, I> {
  if (registry.has(puzzle.id)) throw new Error(`Duplicate puzzle id: ${puzzle.id}`);
  registry.set(puzzle.id, puzzle as unknown as PuzzleDefinition<unknown, unknown>);
  return puzzle;
}
