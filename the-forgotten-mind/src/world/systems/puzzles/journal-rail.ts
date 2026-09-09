import { register, rng, type PuzzleDefinition } from './framework';

/**
 * JOURNAL RAIL — the Experience Archive, GDD Part 4 §9.
 *
 * A sliding rail of journal plates with one empty slot. Slide plates into the
 * gap until the years read left to right.
 *
 * Scrambled by sliding, never by shuffling. Half of all randomly arranged
 * sliding puzzles are unsolvable, and there is no way for a player to tell
 * which half they were handed — they simply lose an hour and conclude they are
 * stupid. Generating the board with the same moves the player has makes the
 * unsolvable half unreachable.
 */

export interface RailState {
  /** Plate numbers 1..N with 0 for the gap, in rail order. */
  readonly plates: readonly number[];
}

export type RailInput = { readonly kind: 'slide'; readonly at: number };

export const PLATE_COUNT = 8;
const WIDTH = 3;

const gapOf = (plates: readonly number[]): number => plates.indexOf(0);

const adjacent = (a: number, b: number): boolean => {
  const [ra, ca] = [Math.floor(a / WIDTH), a % WIDTH];
  const [rb, cb] = [Math.floor(b / WIDTH), b % WIDTH];
  return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
};

const slide = (plates: readonly number[], at: number): number[] => {
  const gap = gapOf(plates);
  if (gap === -1 || !adjacent(at, gap)) return [...plates];
  const next = [...plates];
  next[gap] = next[at]!;
  next[at] = 0;
  return next;
};

export const journalRail: PuzzleDefinition<RailState, RailInput> = register({
  id: 'journal-rail',
  area: 'experience-archive',
  title: 'The Rail',
  premise: 'Nine plates, eight years, and one gap that has to travel.',
  targetSeconds: 240,

  initial: (seed): RailState => {
    const random = rng(seed);
    let plates = Array.from({ length: PLATE_COUNT + 1 }, (_, i) => (i + 1) % (PLATE_COUNT + 1));

    /* Two hundred legal slides. Far past the point of looking random, and every
       one of them reversible — which is the whole guarantee. */
    for (let i = 0; i < 200; i += 1) {
      const gap = gapOf(plates);
      const moves = plates.map((_, index) => index).filter((index) => adjacent(index, gap));
      plates = slide(plates, moves[Math.floor(random() * moves.length)] ?? gap);
    }

    return { plates };
  },

  apply: (state, input) => ({ plates: slide(state.plates, input.at) }),

  validate: (state) => state.plates.every((plate, index) => plate === (index + 1) % (PLATE_COUNT + 1)),

  /* Not a solver — the definition's contract is "put it in a solved state", and
     for a sliding puzzle the honest way to do that is to set the board. A
     player who takes the skip watches the plates settle, which is the same
     thing they would have seen had they finished it. */
  solve: () => ({ plates: Array.from({ length: PLATE_COUNT + 1 }, (_, i) => (i + 1) % (PLATE_COUNT + 1)) }),

  hints: [
    'Only a plate touching the gap can move.',
    'Finish the top row first, then never disturb it again.',
    'The gap belongs at the end, not the beginning.',
  ],

  solvedLine: 'The plates run in order and the gap sits at the end, where a gap belongs.',

  rewards: { memories: ['career-01', 'career-02'], fragment: true },
});
