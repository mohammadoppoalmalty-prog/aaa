import { register, rng, type PuzzleDefinition } from './framework';

/**
 * BRIDGE ASSEMBLY — the Sky Bridge, GDD Part 4 §16.
 *
 * A gap, and a pile of spans in the wrong lengths. Lay them across the piers so
 * every section is covered exactly — no overlap, nothing left short.
 *
 * The pile is cut from the answer: the real gaps are measured first, then each
 * one is broken into two or three spans and the lot is jumbled. So the pile
 * always fits exactly, and the puzzle is arithmetic on a handful of small
 * numbers rather than a search. The Sky Bridge is the second-to-last thing a
 * player builds, and it should feel like assembly, not like luck.
 */

export interface Span {
  readonly id: number;
  readonly length: number;
  /** Which section it has been laid in, or null while it is still in the pile. */
  readonly section: number | null;
}

export interface AssemblyState {
  /** The length each section of the gap needs. */
  readonly sections: readonly number[];
  readonly spans: readonly Span[];
}

export type AssemblyInput =
  | { readonly kind: 'lay'; readonly span: number; readonly section: number }
  | { readonly kind: 'lift'; readonly span: number };

export const SECTION_COUNT = 3;

export const bridgeAssembly: PuzzleDefinition<AssemblyState, AssemblyInput> = register({
  id: 'bridge-assembly',
  area: 'sky-bridge',
  title: 'Bridge Assembly',
  premise: 'Every piece you need is here. None of them is the right length alone.',
  targetSeconds: 200,

  initial: (seed): AssemblyState => {
    const random = rng(seed);
    const sections: number[] = [];
    const pile: number[] = [];

    for (let section = 0; section < SECTION_COUNT; section += 1) {
      const pieces = 2 + Math.floor(random() * 2);
      let total = 0;
      for (let piece = 0; piece < pieces; piece += 1) {
        const length = 2 + Math.floor(random() * 4);
        pile.push(length);
        total += length;
      }
      sections.push(total);
    }

    for (let i = pile.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const held = pile[i]!;
      pile[i] = pile[j]!;
      pile[j] = held;
    }

    return { sections, spans: pile.map((length, id) => ({ id, length, section: null })) };
  },

  apply: (state, input) => {
    if (input.kind === 'lift') {
      return {
        ...state,
        spans: state.spans.map((span) => (span.id === input.span ? { ...span, section: null } : span)),
      };
    }
    if (input.section < 0 || input.section >= state.sections.length) return state;
    return {
      ...state,
      spans: state.spans.map((span) =>
        span.id === input.span ? { ...span, section: input.section } : span,
      ),
    };
  },

  validate: (state) =>
    state.sections.every(
      (needed, section) =>
        state.spans
          .filter((span) => span.section === section)
          .reduce((total, span) => total + span.length, 0) === needed,
    ) && state.spans.every((span) => span.section !== null),

  /* Every span placed at once, with backtracking across *all* sections.
     Filling one section at a time and only backtracking inside it looks
     equivalent and is not: section one can take a span that section two was the
     only possible home for, and there is no way to discover that without being
     allowed to undo the earlier choice. The pile is cut from the sections so an
     exact packing always exists, and with nine spans over three sections the
     search is over before it starts. */
  solve: (state) => {
    const remaining = state.sections.map((length) => length);
    const assignment = new Array<number>(state.spans.length).fill(-1);

    const place = (index: number): boolean => {
      if (index === state.spans.length) return remaining.every((left) => left === 0);
      const span = state.spans[index]!;
      for (let section = 0; section < remaining.length; section += 1) {
        if ((remaining[section] ?? 0) < span.length) continue;
        remaining[section] = (remaining[section] ?? 0) - span.length;
        assignment[index] = section;
        if (place(index + 1)) return true;
        remaining[section] = (remaining[section] ?? 0) + span.length;
        assignment[index] = -1;
      }
      return false;
    };

    if (!place(0)) return state;

    return {
      ...state,
      spans: state.spans.map((span, index) => ({ ...span, section: assignment[index]! })),
    };
  },

  hints: [
    'Measure the gap before you pick anything up.',
    'Every span is used. There is nothing spare in this pile.',
    'Start with the longest piece. It only fits in so many places.',
  ],

  rewards: { memories: ['project-03', 'career-04'], fragment: true },
});
