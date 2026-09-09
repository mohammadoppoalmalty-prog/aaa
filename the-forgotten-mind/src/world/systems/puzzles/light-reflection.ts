import { register, rng, type PuzzleDefinition } from './framework';

/**
 * LIGHT REFLECTION — Crystal Lake, GDD Part 4 §10.
 *
 * A beam enters the lake from the shore. Mirrors stand on the water. Turn them
 * until the beam reaches the far crystal.
 *
 * The board is built by walking a path first and standing a mirror at every
 * turn, then rotating each of them off true. So a solution provably exists, and
 * more usefully the solution is a path a player can *see* — which makes this
 * the moment the game asks someone to read a whole room at once.
 */

export const GRID = 5;

/** The two diagonals, named rather than drawn: `'\'` in source is a fight. */
export type Tilt = 'nesw' | 'nwse';

export interface Mirror {
  readonly x: number;
  readonly y: number;
  readonly tilt: Tilt;
}

export interface ReflectionState {
  readonly mirrors: readonly Mirror[];
  /** Row the beam enters on, travelling east from x = -1. */
  readonly entry: number;
  /** Row the crystal sits on, at x = GRID. */
  readonly target: number;
}

export type ReflectionInput = { readonly kind: 'turn'; readonly x: number; readonly y: number };

type Heading = 'E' | 'W' | 'N' | 'S';

/** `nesw` is the "/" mirror; `nwse` is the other one. */
const BOUNCE: Record<Tilt, Record<Heading, Heading>> = {
  nesw: { E: 'N', W: 'S', N: 'E', S: 'W' },
  nwse: { E: 'S', W: 'N', N: 'W', S: 'E' },
};

const STEP: Record<Heading, readonly [number, number]> = {
  E: [1, 0],
  W: [-1, 0],
  N: [0, -1],
  S: [0, 1],
};

/** Trace the beam. Returns the row it leaves on at x = GRID, or null. */
export function trace(state: ReflectionState): number | null {
  let x = -1;
  let y = state.entry;
  let heading: Heading = 'E';

  // Bounded, so a mirror loop ends the trace instead of hanging the frame.
  for (let steps = 0; steps < GRID * GRID * 4; steps += 1) {
    const [dx, dy] = STEP[heading];
    x += dx;
    y += dy;
    if (x === GRID) return y;
    if (x < 0 || y < 0 || y >= GRID) return null;
    const mirror = state.mirrors.find((candidate) => candidate.x === x && candidate.y === y);
    if (mirror) heading = BOUNCE[mirror.tilt][heading];
  }
  return null;
}

const flip = (tilt: Tilt): Tilt => (tilt === 'nesw' ? 'nwse' : 'nesw');

/**
 * The diagonal that carries a beam from `entry` to `target` — both corners of
 * the Z, because one diagonal turns east into south *and* south into east.
 * Getting this wrong sends the beam off the board on about half of all seeds.
 */
const tiltFor = (entry: number, target: number): Tilt => (target > entry ? 'nwse' : 'nesw');

export const lightReflection: PuzzleDefinition<ReflectionState, ReflectionInput> = register({
  id: 'light-reflection',
  area: 'crystal-lake',
  title: 'Reflection',
  premise: 'The lake does not hold the light. It passes it along.',
  targetSeconds: 200,

  initial: (seed): ReflectionState => {
    const random = rng(seed);
    const entry = Math.floor(random() * GRID);
    const firstX = Math.floor(random() * (GRID - 1));

    /* Walk the beam east, turn it once toward the crystal's row, turn it east
       again. Two mirrors is enough to require reading the board and few enough
       that the answer is legible the moment it is seen. */
    let target = Math.floor(random() * GRID);
    if (target === entry) target = entry === 0 ? 1 : entry - 1;

    const solution: Mirror[] = [
      { x: firstX, y: entry, tilt: tiltFor(entry, target) },
      { x: firstX, y: target, tilt: tiltFor(entry, target) },
    ];

    /* Now turn every one of them off true, so no mirror is a freebie and none
       can be ignored. Flipping them all back is the solution — which is also
       the proof that one exists for every seed. */
    return { entry, target, mirrors: solution.map((mirror) => ({ ...mirror, tilt: flip(mirror.tilt) })) };
  },

  apply: (state, input) => ({
    ...state,
    mirrors: state.mirrors.map((mirror) =>
      mirror.x === input.x && mirror.y === input.y ? { ...mirror, tilt: flip(mirror.tilt) } : mirror,
    ),
  }),

  validate: (state) => trace(state) === state.target,

  /* Computed, not flipped. `solve` has to produce a solved board from *any*
     state — including one that is already solved, which a blind flip would
     quietly break. */
  solve: (state) => ({
    ...state,
    mirrors: state.mirrors.map((mirror) => ({ ...mirror, tilt: tiltFor(state.entry, state.target) })),
  }),

  hints: [
    'Follow the beam from where it enters, not back from the crystal.',
    'A mirror turns a beam ninety degrees. Which way depends on the diagonal.',
    'Every mirror on this water is part of the answer. None of them is scenery.',
  ],

  rewards: { memories: ['bio-08', 'lesson-04'], fragment: true },
});
