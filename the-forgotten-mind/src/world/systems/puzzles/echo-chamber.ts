import { register, rng, type PuzzleDefinition } from './framework';

/**
 * ECHO CHAMBER — the Underground Cave, GDD Part 4 §11.
 *
 * The cave repeats what it is given, a beat late and a note low. Strike the
 * stones back in the order it struck them.
 *
 * A call-and-response puzzle lives or dies on whether a mistake costs the whole
 * sequence. Here it does not: a wrong strike clears what you have entered and
 * the cave repeats itself, forever, without comment. The cost of being wrong is
 * ten seconds and no dignity lost — which is the difference between a memory
 * test people finish and one they walk away from.
 */

export interface EchoChamberState {
  /** The phrase the cave plays, as stone indices. */
  readonly phrase: readonly number[];
  /** What the player has struck since the last mistake. */
  readonly struck: readonly number[];
}

export type ChamberInput = { readonly kind: 'strike'; readonly stone: number } | { readonly kind: 'listen' };

export const STONE_COUNT = 5;
export const PHRASE_LENGTH = 6;

export const echoChamber: PuzzleDefinition<EchoChamberState, ChamberInput> = register({
  id: 'echo-chamber',
  area: 'underground-cave',
  title: 'The Echo Chamber',
  premise: 'It answers. It has been answering for a long time.',
  targetSeconds: 120,

  initial: (seed): EchoChamberState => {
    const random = rng(seed);
    /* Never twice the same stone in a row: a repeat is indistinguishable from
       an echo, and a puzzle whose clue can be misheard is not a puzzle. */
    const phrase: number[] = [];
    while (phrase.length < PHRASE_LENGTH) {
      const stone = Math.floor(random() * STONE_COUNT);
      if (stone !== phrase[phrase.length - 1]) phrase.push(stone);
    }
    return { phrase, struck: [] };
  },

  apply: (state, input) => {
    if (input.kind === 'listen') return { ...state, struck: [] };
    const next = [...state.struck, input.stone];
    // A wrong stone costs the attempt, not the progress: the cave just repeats.
    const correct = next.every((stone, index) => stone === state.phrase[index]);
    return { ...state, struck: correct ? next : [] };
  },

  validate: (state) =>
    state.struck.length === state.phrase.length &&
    state.struck.every((stone, index) => stone === state.phrase[index]),

  solve: (state) => ({ ...state, struck: [...state.phrase] }),

  hints: [
    'Listen to the whole thing before you touch anything.',
    'It never strikes the same stone twice in a row.',
    'A mistake costs you nothing but the run. Listen again.',
  ],

  solvedLine: 'The cave repeats you once and then lets it go. It has been waiting a long time to be answered.',

  rewards: { memories: ['bio-05', 'lesson-05'], fragment: true },
});
