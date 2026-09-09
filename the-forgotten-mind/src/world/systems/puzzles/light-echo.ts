import { register, rng, type PuzzleDefinition } from './framework';

/**
 * LIGHT ECHO — the Memory Forest, GDD Part 4 §2.
 *
 * Three unlit lanterns. Motes of light drift on the wind, and the wind's
 * direction is written all over the forest — falling leaves, a ribbon on a pole.
 * Turn each lantern's reflector upwind and it catches one.
 *
 * Difficulty: trivial, deliberately. Its job is to teach *observe → deduce →
 * act*, and that the ambient detail in this world carries information rather
 * than decorating it. A player who never notices the leaves can still solve it
 * by trial in a minute; a player who notices solves it in ten seconds and has
 * learned the lesson the rest of the game depends on.
 */

/** Eight compass points, clockwise from north. */
export const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export interface Lantern {
  readonly id: number;
  /** Which way the reflector currently faces. */
  readonly facing: Direction;
}

export interface EchoState {
  /** Where the wind is blowing *towards*. Upwind is the opposite. */
  readonly wind: Direction;
  readonly lanterns: readonly Lantern[];
}

export type EchoInput =
  | { readonly kind: 'rotate'; readonly lantern: number; readonly by: 1 | -1 }
  | { readonly kind: 'gust'; readonly wind: Direction };

export const LANTERN_COUNT = 3;

const index = (direction: Direction): number => DIRECTIONS.indexOf(direction);

export const upwindOf = (wind: Direction): Direction =>
  DIRECTIONS[(index(wind) + 4) % DIRECTIONS.length] as Direction;

export const rotate = (facing: Direction, by: 1 | -1): Direction =>
  DIRECTIONS[(index(facing) + by + DIRECTIONS.length) % DIRECTIONS.length] as Direction;

export const lightEcho: PuzzleDefinition<EchoState, EchoInput> = register({
  id: 'light-echo',
  area: 'memory-forest',
  title: 'Light Echo',
  premise: 'The lanterns are not broken. They are facing the wrong way.',
  targetSeconds: 75,

  initial: (seed) => {
    const random = rng(seed);
    const wind = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)] as Direction;
    const solution = upwindOf(wind);

    /* Never start a lantern already correct: three lanterns that are all
       solved on arrival would teach nothing, and one that is would read as a
       bug rather than a gift. */
    const lanterns = Array.from({ length: LANTERN_COUNT }, (_, id) => {
      let facing = DIRECTIONS[Math.floor(random() * DIRECTIONS.length)] as Direction;
      if (facing === solution) facing = rotate(facing, 1);
      return { id, facing };
    });

    return { wind, lanterns };
  },

  apply: (state, input) => {
    if (input.kind === 'gust') return { ...state, wind: input.wind };
    return {
      ...state,
      lanterns: state.lanterns.map((lantern) =>
        lantern.id === input.lantern ? { ...lantern, facing: rotate(lantern.facing, input.by) } : lantern,
      ),
    };
  },

  validate: (state) => {
    const target = upwindOf(state.wind);
    return state.lanterns.every((lantern) => lantern.facing === target);
  },

  solve: (state) => {
    const target = upwindOf(state.wind);
    return { ...state, lanterns: state.lanterns.map((lantern) => ({ ...lantern, facing: target })) };
  },

  hints: [
    'Watch the leaves. They are not falling straight down.',
    'A reflector catches light coming toward it, not light going away.',
    'All three face the same way when this is right.',
  ],

  rewards: { memories: ['bio-02', 'lesson-01'], fragment: true },
});
