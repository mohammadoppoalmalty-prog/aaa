import { register, rng, type PuzzleDefinition } from './framework';

/**
 * CONSTELLATION — the Dream Observatory, GDD Part 4 §14.
 *
 * A sky full of stars, and one shape hidden in it. Trace the stars in order of
 * brightness, faintest first, and the shape draws itself.
 *
 * Brightness rather than position, because position is a shape-matching task
 * that a player either sees instantly or never sees at all. Brightness can be
 * *compared* — two stars at a time, in any order — so the puzzle rewards
 * patience instead of a knack, and nobody is locked out of the observatory for
 * not having the right kind of eyes.
 */

export interface Star {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  /** 0..1. Never equal between two stars in the same sky. */
  readonly brightness: number;
}

export interface ConstellationState {
  readonly stars: readonly Star[];
  /** Star ids in the order the player has traced them. */
  readonly traced: readonly number[];
}

export type ConstellationInput =
  | { readonly kind: 'trace'; readonly star: number }
  | { readonly kind: 'clear' };

export const STAR_COUNT = 7;

const byBrightness = (stars: readonly Star[]): number[] =>
  [...stars].sort((a, b) => a.brightness - b.brightness).map((star) => star.id);

export const constellation: PuzzleDefinition<ConstellationState, ConstellationInput> = register({
  id: 'constellation',
  area: 'dream-observatory',
  title: 'The Constellation',
  premise: 'Every one of them is a different age. The faintest light left first.',
  targetSeconds: 180,

  initial: (seed): ConstellationState => {
    const random = rng(seed);

    /* Brightnesses are drawn on a grid and then jittered, which guarantees they
       are distinct and comfortably apart. Two stars a hundredth apart would be
       a puzzle about monitor calibration. */
    const stars: Star[] = Array.from({ length: STAR_COUNT }, (_, id) => ({
      id,
      x: 0.1 + random() * 0.8,
      y: 0.1 + random() * 0.8,
      brightness: (id + 0.25 + random() * 0.5) / STAR_COUNT,
    }));

    // Shuffled for display, so their order on screen says nothing.
    for (let i = stars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const held = stars[i]!;
      stars[i] = stars[j]!;
      stars[j] = held;
    }

    return { stars, traced: [] };
  },

  apply: (state, input) => {
    if (input.kind === 'clear') return { ...state, traced: [] };
    if (state.traced.includes(input.star)) return state;

    const next = [...state.traced, input.star];
    const answer = byBrightness(state.stars);
    // A wrong star ends the trace rather than half-scoring it.
    return { ...state, traced: next.every((id, index) => id === answer[index]) ? next : [] };
  },

  validate: (state) => {
    const answer = byBrightness(state.stars);
    return (
      state.traced.length === answer.length && state.traced.every((id, index) => id === answer[index])
    );
  },

  solve: (state) => ({ ...state, traced: byBrightness(state.stars) }),

  hints: [
    'Their places in the sky mean nothing. Their light does.',
    'Faintest first. The brightest is the last one you touch.',
    'Compare two at a time. You do not have to see the whole order at once.',
  ],

  rewards: { memories: ['bio-07', 'lesson-08'], fragment: true },
});
