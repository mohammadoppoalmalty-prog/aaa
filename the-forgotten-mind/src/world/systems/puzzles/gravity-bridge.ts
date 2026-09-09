import { register, rng, type PuzzleDefinition } from './framework';

/**
 * GRAVITY BRIDGE — the Floating Islands, GDD Part 4 §13.
 *
 * A line of islands at different heights and a shore at each end. Raise and
 * lower them until you can walk the whole way — no step up or down bigger than
 * one, from the first shore to the last.
 *
 * Each island has a range it can move within, and the ranges overlap only
 * partly, so the answer is a shape rather than "put everything at zero". It is
 * the first puzzle that asks a player to plan a whole route before touching
 * anything, which is why it sits this late.
 */

export interface Island {
  readonly id: number;
  readonly height: number;
  readonly min: number;
  readonly max: number;
}

export interface BridgeState {
  readonly islands: readonly Island[];
  /** The fixed shores at either end. */
  readonly start: number;
  readonly end: number;
}

export type BridgeInput = { readonly kind: 'shift'; readonly island: number; readonly by: 1 | -1 };

export const ISLAND_COUNT = 5;
const STEP = 1;

/** Can the whole line be walked, shore to shore, one step at a time? */
const walkable = (state: BridgeState): boolean => {
  const path = [state.start, ...state.islands.map((island) => island.height), state.end];
  return path.every((height, index) => index === 0 || Math.abs(height - path[index - 1]!) <= STEP);
};

export const gravityBridge: PuzzleDefinition<BridgeState, BridgeInput> = register({
  id: 'gravity-bridge',
  area: 'floating-islands',
  title: 'The Gravity Bridge',
  premise: 'They drift. They have always drifted. They can still be made to line up.',
  targetSeconds: 210,

  initial: (seed): BridgeState => {
    const random = rng(seed);
    const start = 2 + Math.floor(random() * 3);

    /* Build a walkable route first — each island within one step of the last —
       then give every island a range that contains its answer and push it off
       that answer. A route that exists by construction cannot be generated into
       an island nobody can reach. */
    const route: number[] = [];
    let height = start;
    for (let i = 0; i < ISLAND_COUNT; i += 1) {
      height += Math.floor(random() * 3) - 1;
      height = Math.max(0, Math.min(8, height));
      route.push(height);
    }
    const end = route[route.length - 1]!;

    const islands = route.map((answer, id) => {
      const min = Math.max(0, answer - 1 - Math.floor(random() * 2));
      const max = Math.min(8, answer + 1 + Math.floor(random() * 2));
      // Start somewhere else in range, so no island arrives already right.
      const offBy = answer === min ? max : min;
      return { id, height: offBy, min, max };
    });

    const board: BridgeState = { islands, start, end };
    if (!walkable(board)) return board;

    /* The offsets happened to leave a walkable path, so the tower would open on
       arrival. Move one island to any height in its range that breaks the walk —
       checked rather than assumed, because "surely that cannot happen" is how
       one seed in a hundred ships solved. */
    for (const island of islands) {
      for (let height = island.min; height <= island.max; height += 1) {
        const disturbed = {
          ...board,
          islands: islands.map((other) => (other.id === island.id ? { ...other, height } : other)),
        };
        if (!walkable(disturbed)) return disturbed;
      }
    }
    return board;
  },

  apply: (state, input) => ({
    ...state,
    islands: state.islands.map((island) =>
      island.id === input.island
        ? { ...island, height: Math.max(island.min, Math.min(island.max, island.height + input.by)) }
        : island,
    ),
  }),

  validate: walkable,

  /* A pass forward marking every height each island can hold while still being
     reachable from the shore, then a walk back from the far shore choosing one.
     Greedy is wrong here and quietly so: pulling each island toward the last
     one satisfies every constraint except the final island's, which has to
     reach its neighbour *and* the far shore at once. Nine heights and five
     islands make the exhaustive answer cost nothing, so there is no reason to
     accept an approximation that fails on some seeds and not others. */
  solve: (state) => {
    const HEIGHTS = 9;
    const reachable: boolean[][] = [];

    state.islands.forEach((island, index) => {
      const row = Array.from({ length: HEIGHTS }, (_, height) => {
        if (height < island.min || height > island.max) return false;
        if (index === 0) return Math.abs(height - state.start) <= STEP;
        return (reachable[index - 1] ?? []).some(
          (ok, previous) => ok && Math.abs(height - previous) <= STEP,
        );
      });
      reachable.push(row);
    });

    const last = reachable.length - 1;
    const finalHeight = (reachable[last] ?? []).findIndex(
      (ok, height) => ok && Math.abs(height - state.end) <= STEP,
    );
    if (finalHeight === -1) return state;

    const chosen: number[] = [finalHeight];
    for (let index = last - 1; index >= 0; index -= 1) {
      const next = chosen[0]!;
      const height = (reachable[index] ?? []).findIndex(
        (ok, candidate) => ok && Math.abs(candidate - next) <= STEP,
      );
      if (height === -1) return state;
      chosen.unshift(height);
    }

    return { ...state, islands: state.islands.map((island, index) => ({ ...island, height: chosen[index]! })) };
  },

  hints: [
    'You cannot climb more than one. Not up, and not down either.',
    'Each island only moves so far. Look at what it can do before you plan.',
    'Both shores are fixed. Work inward from them.',
  ],

  solvedLine: 'The islands hold their heights. You can walk it now, and it will not drift while you do.',

  rewards: { memories: ['career-03', 'lesson-07'], fragment: true },
});
