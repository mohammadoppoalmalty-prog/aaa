import { register, rng, type PuzzleDefinition } from './framework';

/**
 * SHELF ORDER — the Knowledge Library, GDD Part 4 §8.
 *
 * Books scattered across three shelves. Each belongs to a subject, and each
 * shelf wants one subject. Carry them across until every shelf is of a piece.
 *
 * Which shelf takes which subject is not fixed — the library was never
 * catalogued, only used. `validate` asks whether each shelf is uniform, not
 * whether it matches a list somebody else wrote.
 */

export const SUBJECTS = ['systems', 'language', 'craft'] as const;
export type Subject = (typeof SUBJECTS)[number];

export interface Book {
  readonly id: number;
  readonly subject: Subject;
  readonly title: string;
}

export interface ShelfState {
  /** shelves[i] holds book ids, top to bottom. */
  readonly shelves: readonly (readonly number[])[];
  readonly books: readonly Book[];
}

export type ShelfInput = { readonly kind: 'move'; readonly book: number; readonly to: number };

export const SHELF_COUNT = 3;
const PER_SUBJECT = 3;

export const shelfOrder: PuzzleDefinition<ShelfState, ShelfInput> = register({
  id: 'shelf-order',
  area: 'knowledge-library',
  title: 'The Shelves',
  premise: 'Nobody catalogued this room. They only ever used it.',
  targetSeconds: 130,

  initial: (seed): ShelfState => {
    const random = rng(seed);
    const books: Book[] = SUBJECTS.flatMap((subject, s) =>
      Array.from({ length: PER_SUBJECT }, (_, n) => ({
        id: s * PER_SUBJECT + n,
        subject,
        title: `${subject}, volume ${n + 1}`,
      })),
    );

    const shelves: number[][] = Array.from({ length: SHELF_COUNT }, () => []);
    /* Dealt round-robin from a shuffled pile, so every shelf starts with the
       same number of books and none of them is already uniform. */
    const pile = [...books.map((book) => book.id)];
    for (let i = pile.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const held = pile[i]!;
      pile[i] = pile[j]!;
      pile[j] = held;
    }
    pile.forEach((id, index) => shelves[index % SHELF_COUNT]!.push(id));

    const uniform = (shelf: readonly number[]) =>
      shelf.every((id) => books[id]!.subject === books[shelf[0]!]!.subject);
    if (shelves.every(uniform)) {
      const a = shelves[0]![0]!;
      const b = shelves[1]![0]!;
      shelves[0]![0] = b;
      shelves[1]![0] = a;
    }

    return { shelves, books };
  },

  apply: (state, input) => {
    if (input.to < 0 || input.to >= state.shelves.length) return state;
    const from = state.shelves.findIndex((shelf) => shelf.includes(input.book));
    if (from === -1 || from === input.to) return state;
    return {
      ...state,
      shelves: state.shelves.map((shelf, index) =>
        index === from
          ? shelf.filter((id) => id !== input.book)
          : index === input.to
            ? [...shelf, input.book]
            : shelf,
      ),
    };
  },

  validate: (state) =>
    state.shelves.every((shelf) => {
      if (shelf.length === 0) return false;
      const subject = state.books.find((book) => book.id === shelf[0])?.subject;
      return shelf.every((id) => state.books.find((book) => book.id === id)?.subject === subject);
    }),

  solve: (state) => ({
    ...state,
    shelves: SUBJECTS.map((subject) =>
      state.books.filter((book) => book.subject === subject).map((book) => book.id),
    ),
  }),

  hints: [
    'Read the spines. There are only three kinds.',
    'It does not matter which shelf takes which subject.',
    'Empty a shelf completely before you start filling it.',
  ],

  rewards: { memories: ['skill-03', 'lesson-03'], fragment: true },
});
