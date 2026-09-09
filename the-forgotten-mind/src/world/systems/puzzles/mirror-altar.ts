import { register, rng, type PuzzleDefinition } from './framework';

/**
 * MIRROR ALTAR — the Ancient Temple, GDD Part 4 §12.
 *
 * Three stone rings around one altar. Turning any ring turns the others too,
 * by amounts the temple decided a long time ago. Line all three notches up.
 *
 * The coupling is the puzzle: nothing here moves alone, so the player cannot
 * solve one ring and move on. They have to find the *combination* of turns that
 * lands all three at once — which is arithmetic dressed as ritual, and the only
 * puzzle in the game that rewards writing something down.
 */

export const TEETH = 12;
export const RING_COUNT = 3;

export interface AltarState {
  /** Each ring's notch position, 0..TEETH-1. */
  readonly rings: readonly number[];
  /** coupling[i][j] — how far ring j turns when ring i is turned once. */
  readonly coupling: readonly (readonly number[])[];
}

export type AltarInput = { readonly kind: 'turn'; readonly ring: number };

const turn = (state: AltarState, ring: number): number[] => {
  const row = state.coupling[ring] ?? [];
  return state.rings.map((position, index) => (position + (row[index] ?? 0) + TEETH) % TEETH);
};

export const mirrorAltar: PuzzleDefinition<AltarState, AltarInput> = register({
  id: 'mirror-altar',
  area: 'ancient-temple',
  title: 'The Mirror Altar',
  premise: 'Three rings, and not one of them turns by itself.',
  targetSeconds: 220,

  initial: (seed): AltarState => {
    const random = rng(seed);

    /* Each ring turns itself by one and drags the others by a fixed amount.
       Self-turn is always 1 so that turning a ring TEETH times returns the
       whole altar to where it started — the player can always undo by going
       round, and a coupled puzzle without an undo is a trap. */
    const coupling = Array.from({ length: RING_COUNT }, (_, i) =>
      Array.from({ length: RING_COUNT }, (_, j) => (i === j ? 1 : Math.floor(random() * 3) + 1)),
    );

    const state: AltarState = { rings: Array.from({ length: RING_COUNT }, () => 0), coupling };

    // Scrambled with the player's own moves, so the way back always exists.
    let rings = state.rings;
    const turns = 5 + Math.floor(random() * 8);
    for (let i = 0; i < turns; i += 1) {
      rings = turn({ ...state, rings }, Math.floor(random() * RING_COUNT));
    }

    if (rings.every((position) => position === 0)) rings = turn({ ...state, rings }, 0);
    return { ...state, rings };
  },

  apply: (state, input) =>
    input.ring < 0 || input.ring >= RING_COUNT ? state : { ...state, rings: turn(state, input.ring) },

  validate: (state) => state.rings.every((position) => position === 0),

  /* Search every combination of turn counts. Three rings and twelve teeth is
     1,728 candidates — small enough to be exhaustive, which is the only way to
     be certain the altar can always be closed. */
  solve: (state) => {
    for (let a = 0; a < TEETH; a += 1) {
      for (let b = 0; b < TEETH; b += 1) {
        for (let c = 0; c < TEETH; c += 1) {
          let rings = state.rings;
          for (let i = 0; i < a; i += 1) rings = turn({ ...state, rings }, 0);
          for (let i = 0; i < b; i += 1) rings = turn({ ...state, rings }, 1);
          for (let i = 0; i < c; i += 1) rings = turn({ ...state, rings }, 2);
          if (rings.every((position) => position === 0)) return { ...state, rings };
        }
      }
    }
    return state;
  },

  hints: [
    'Turning one ring turns all three. Watch how far each one moves.',
    'The amounts never change. Count them once and you have the whole temple.',
    'Twelve turns of any ring puts everything back exactly as it was.',
  ],

  rewards: { memories: ['lesson-06', 'bio-06'], fragment: true },
});
