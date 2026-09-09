import { register, rng, type PuzzleDefinition } from './framework';

/**
 * THE FOUNTAIN — the Forgotten Village, GDD Part 4 §3.
 *
 * Under a grate in the plaza: a 5×5 grid of rotatable pipe segments. Route water
 * from the aqueduct inlet at the north-west to the fountain outlet at the
 * south-east. Two segments are broken and have to be swapped for spares from a
 * cart nearby.
 *
 * On solve the fountain becomes the game's **diegetic progress bar** — its water
 * level, glow and jet count scale with restoration for the rest of the game.
 *
 * The generator lays a real path first and then dresses the board around it, so
 * a board is solvable by construction. Generating randomly and *hoping* is how a
 * player ends up staring at an impossible puzzle, and no amount of testing after
 * the fact fully rules it out.
 */

export const GRID = 5;

export type Side = 0 | 1 | 2 | 3; // N, E, S, W
export type PieceKind = 'straight' | 'elbow' | 'tee' | 'cross' | 'broken' | 'empty';

export interface Piece {
  readonly kind: PieceKind;
  /** Quarter-turns clockwise. */
  readonly rotation: 0 | 1 | 2 | 3;
}

export interface FountainState {
  readonly cells: readonly Piece[];
  /** Replacement segments from the cart, consumed when placed. */
  readonly spares: readonly PieceKind[];
  /**
   * The board the generator laid before it scrambled and broke it.
   *
   * Carried with the state rather than recomputed, for two reasons: the skip
   * path has to *show* a solved fountain, and a test can assert per seed that
   * the board it generated is reachable — which is what makes "solvable by
   * construction" a fact rather than a claim. It is never shown to the player
   * and never written to the save.
   */
  readonly solution: readonly Piece[];
}

export type FountainInput =
  | { readonly kind: 'rotate'; readonly cell: number }
  | { readonly kind: 'place'; readonly cell: number; readonly spare: number };

/** Which sides a piece connects, before rotation. */
const OPENINGS: Readonly<Record<PieceKind, readonly Side[]>> = {
  straight: [0, 2],
  elbow: [0, 1],
  tee: [0, 1, 2],
  cross: [0, 1, 2, 3],
  broken: [],
  empty: [],
};

export const openingsOf = (piece: Piece): readonly Side[] =>
  OPENINGS[piece.kind].map((side) => (((side + piece.rotation) % 4) as Side));

const at = (x: number, y: number): number => y * GRID + x;
const coords = (cell: number): readonly [number, number] => [cell % GRID, Math.floor(cell / GRID)];

const STEP: Readonly<Record<Side, readonly [number, number]>> = {
  0: [0, -1],
  1: [1, 0],
  2: [0, 1],
  3: [-1, 0],
};

const OPPOSITE: Readonly<Record<Side, Side>> = { 0: 2, 1: 3, 2: 0, 3: 1 };

/* The aqueduct enters the north-west cell from the west; the fountain drains
   from the south-east cell to the east. Both are outside the grid, which is why
   they are checked as openings rather than as neighbours. */
export const INLET_CELL = at(0, 0);
export const INLET_SIDE: Side = 3;
export const OUTLET_CELL = at(GRID - 1, GRID - 1);
export const OUTLET_SIDE: Side = 1;

/**
 * Water flows from the inlet through connected openings. Both pieces must open
 * toward each other — a pipe pointing at a wall is not a connection, which is
 * the rule that makes rotation meaningful.
 */
export function flow(state: FountainState): { readonly wet: ReadonlySet<number>; readonly solved: boolean } {
  const wet = new Set<number>();
  const inlet = state.cells[INLET_CELL];
  if (!inlet || !openingsOf(inlet).includes(INLET_SIDE)) return { wet, solved: false };

  const queue: number[] = [INLET_CELL];
  wet.add(INLET_CELL);

  while (queue.length > 0) {
    const cell = queue.shift() as number;
    const piece = state.cells[cell];
    if (!piece) continue;
    const [x, y] = coords(cell);

    for (const side of openingsOf(piece)) {
      const [dx, dy] = STEP[side];
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;

      const neighbourCell = at(nx, ny);
      if (wet.has(neighbourCell)) continue;

      const neighbour = state.cells[neighbourCell];
      if (!neighbour || !openingsOf(neighbour).includes(OPPOSITE[side])) continue;

      wet.add(neighbourCell);
      queue.push(neighbourCell);
    }
  }

  const outlet = state.cells[OUTLET_CELL];
  const solved = wet.has(OUTLET_CELL) && outlet !== undefined && openingsOf(outlet).includes(OUTLET_SIDE);
  return { wet, solved };
}

/** The piece and rotation that connects exactly these two sides. */
function pieceFor(sides: readonly Side[]): Piece {
  const set = new Set(sides);
  if (set.size === 2) {
    const [a, b] = [...set].sort((p, q) => p - q) as [Side, Side];
    if ((b - a) % 2 === 0) {
      // opposite sides — a straight, vertical at rotation 0
      return { kind: 'straight', rotation: (a % 2) as 0 | 1 };
    }
    /* An elbow at rotation 0 joins N and E; rotating it r quarter-turns joins
       (0+r) and (1+r). Find the r whose pair matches. */
    for (let rotation = 0 as 0 | 1 | 2 | 3; rotation < 4; rotation = ((rotation + 1) as 0 | 1 | 2 | 3)) {
      const opened = new Set(OPENINGS.elbow.map((side) => ((side + rotation) % 4) as Side));
      if (opened.size === set.size && [...set].every((side) => opened.has(side))) {
        return { kind: 'elbow', rotation };
      }
    }
  }
  if (set.size === 3) {
    for (let rotation = 0 as 0 | 1 | 2 | 3; rotation < 4; rotation = ((rotation + 1) as 0 | 1 | 2 | 3)) {
      const opened = new Set(OPENINGS.tee.map((side) => ((side + rotation) % 4) as Side));
      if ([...set].every((side) => opened.has(side))) return { kind: 'tee', rotation };
    }
  }
  return { kind: 'cross', rotation: 0 };
}

/** A monotone-ish random walk from the inlet cell to the outlet cell. */
function carvePath(random: () => number): readonly number[] {
  let x = 0;
  let y = 0;
  const path = [at(x, y)];
  while (x !== GRID - 1 || y !== GRID - 1) {
    const canRight = x < GRID - 1;
    const canDown = y < GRID - 1;
    if (canRight && (!canDown || random() < 0.5)) x += 1;
    else y += 1;
    path.push(at(x, y));
  }
  return path;
}

export const fountain: PuzzleDefinition<FountainState, FountainInput> = register({
  id: 'fountain',
  area: 'village',
  title: 'The Fountain',
  premise: 'The village went quiet when the water stopped. The pipes are still there.',
  targetSeconds: 240,

  initial: (seed) => {
    const random = rng(seed);
    const path = carvePath(random);

    const cells: Piece[] = Array.from({ length: GRID * GRID }, () => {
      const kinds: PieceKind[] = ['straight', 'elbow', 'elbow', 'empty'];
      const kind = kinds[Math.floor(random() * kinds.length)] as PieceKind;
      return { kind, rotation: Math.floor(random() * 4) as 0 | 1 | 2 | 3 };
    });

    /* The solution starts as a copy of the dressed board and is then corrected
       along the path. A sparse array here would leave holes at every cell the
       path does not touch, and `solve()` would hand back an undefined piece. */
    const solution: Piece[] = cells.map((piece) => ({ ...piece }));
    path.forEach((cell, step) => {
      const sides: Side[] = [];
      const previous = path[step - 1];
      const next = path[step + 1];
      const [x, y] = coords(cell);

      if (previous === undefined) sides.push(INLET_SIDE);
      else {
        const [px, py] = coords(previous);
        sides.push(px < x ? 3 : py < y ? 0 : px > x ? 1 : 2);
      }

      if (next === undefined) sides.push(OUTLET_SIDE);
      else {
        const [nx, ny] = coords(next);
        sides.push(nx > x ? 1 : ny > y ? 2 : nx < x ? 3 : 0);
      }

      const piece = pieceFor(sides);
      solution[cell] = piece;
      cells[cell] = { kind: piece.kind, rotation: ((piece.rotation + 1 + Math.floor(random() * 3)) % 4) as 0 | 1 | 2 | 3 };
    });

    /* Break two path cells and put their pieces in the cart. Breaking a cell
       that is not on the path would be a decoy the player cannot distinguish
       from a real one — cruel rather than difficult. */
    const interior = path.slice(1, -1);
    const broken = new Set<number>();
    const spares: PieceKind[] = [];
    while (broken.size < 2 && broken.size < interior.length) {
      const cell = interior[Math.floor(random() * interior.length)] as number;
      if (broken.has(cell)) continue;
      broken.add(cell);
      spares.push((solution[cell] as Piece).kind);
      cells[cell] = { kind: 'broken', rotation: 0 };
    }

    return { cells, spares, solution };
  },

  apply: (state, input) => {
    if (input.kind === 'rotate') {
      const piece = state.cells[input.cell];
      if (!piece || piece.kind === 'broken' || piece.kind === 'empty') return state;
      const cells = [...state.cells];
      cells[input.cell] = { ...piece, rotation: ((piece.rotation + 1) % 4) as 0 | 1 | 2 | 3 };
      return { ...state, cells };
    }

    const spare = state.spares[input.spare];
    const target = state.cells[input.cell];
    if (spare === undefined || !target || target.kind !== 'broken') return state;

    const cells = [...state.cells];
    cells[input.cell] = { kind: spare, rotation: 0 };
    return { ...state, cells, spares: state.spares.filter((_, index) => index !== input.spare) };
  },

  validate: (state) => flow(state).solved,

  solve: (state) => ({ ...state, cells: state.solution, spares: [] }),

  hints: [
    'The water comes in at the top left and has to leave at the bottom right.',
    'Two segments are cracked through. There are spares in the cart by the well.',
    'A pipe pointing at a wall is not a pipe. Follow the wet ones and find where they stop.',
  ],

  rewards: { memories: ['bio-04', 'story-02'], fragment: true },
});
