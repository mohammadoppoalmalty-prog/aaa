import { register, rng, type PuzzleDefinition } from './framework';

/**
 * ATTIC ORDER — the Childhood Home, GDD Part 4 §4.
 *
 * Boxes in an attic, each labelled with a year, stacked in the order they were
 * shoved up there. Swap neighbours until the stack runs oldest to newest.
 *
 * The mechanic is adjacent-swap sorting because it is the one sorting move a
 * player can make without a UI: stand between two boxes and press once. It is
 * also why the puzzle cannot deadlock — adjacent swaps generate the whole
 * permutation group, so *every* arrangement is solvable from *every* other.
 */

export interface Box {
  readonly id: number;
  readonly year: number;
  readonly label: string;
}

export interface AtticState {
  readonly boxes: readonly Box[];
}

/** Swap the box at `at` with the one after it. */
export type AtticInput = { readonly kind: 'swap'; readonly at: number };

export const BOX_COUNT = 6;

const LABELS = [
  'school reports',
  'a bicycle bell',
  'birthday cards',
  'a football shirt',
  'exam papers',
  'a shoebox of photographs',
] as const;

export const atticOrder: PuzzleDefinition<AtticState, AtticInput> = register({
  id: 'attic-order',
  area: 'childhood-home',
  title: 'Attic Order',
  premise: 'They were put up here in the order they stopped mattering.',
  targetSeconds: 120,

  initial: (seed) => {
    const random = rng(seed);
    const firstYear = 1994 + Math.floor(random() * 6);
    const boxes = LABELS.map((label, index) => ({
      id: index,
      year: firstYear + index * (1 + Math.floor(random() * 2)),
      label,
    }));

    /* Shuffled by swaps rather than by sorting a random list, so the board a
       player meets is always reachable back to sorted by the moves they have. */
    const shuffled = [...boxes];
    for (let i = 0; i < 40; i += 1) {
      const at = Math.floor(random() * (shuffled.length - 1));
      const a = shuffled[at]!;
      shuffled[at] = shuffled[at + 1]!;
      shuffled[at + 1] = a;
    }

    // A stack that arrives sorted is not a puzzle; nudge it once if it does.
    const sorted = shuffled.every((box, i) => i === 0 || box.year >= shuffled[i - 1]!.year);
    if (sorted) {
      const a = shuffled[0]!;
      shuffled[0] = shuffled[1]!;
      shuffled[1] = a;
    }

    return { boxes: shuffled };
  },

  apply: (state, input) => {
    if (input.at < 0 || input.at >= state.boxes.length - 1) return state;
    const boxes = [...state.boxes];
    const held = boxes[input.at]!;
    boxes[input.at] = boxes[input.at + 1]!;
    boxes[input.at + 1] = held;
    return { boxes };
  },

  validate: (state) => state.boxes.every((box, i) => i === 0 || box.year >= state.boxes[i - 1]!.year),

  solve: (state) => ({ boxes: [...state.boxes].sort((a, b) => a.year - b.year) }),

  hints: [
    'The labels are not the point. The years are.',
    'You can only swap two boxes that are already touching.',
    'Oldest at the bottom, the way they went up.',
  ],

  solvedLine: 'The years run straight. Whatever else this house forgot, it knows its own order now.',

  rewards: { memories: ['bio-03', 'story-01'], fragment: true },
});
