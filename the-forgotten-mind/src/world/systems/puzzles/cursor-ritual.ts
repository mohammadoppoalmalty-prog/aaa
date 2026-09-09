import { register, rng, type PuzzleDefinition } from './framework';

/**
 * THE CURSOR RITUAL — the Gate, GDD Part 4 §1.
 *
 * The screen is black. The cursor carries a two-metre circle of light. Nothing
 * else is visible, and there is no instruction: the light *is* the instruction.
 * Sweeping it across the gate ignites glyphs where it touches. Seven of them
 * opens the gate.
 *
 * The teaching is the whole point — **your attention is the mechanic** — so the
 * logic is deliberately forgiving: a glyph lights on contact and never unlights.
 * A player who has understood must never be punished for a slow mouse.
 */

export interface Glyph {
  readonly id: number;
  /** Position on the gate face, 0–1 in both axes. */
  readonly x: number;
  readonly y: number;
  readonly lit: boolean;
}

export interface RitualState {
  readonly glyphs: readonly Glyph[];
  /** How far the cursor has travelled, in normalised units — used for the
   *  "you're patient" secret and for telling exploration from flailing. */
  readonly swept: number;
  readonly lastX: number | null;
  readonly lastY: number | null;
}

export interface RitualInput {
  readonly x: number;
  readonly y: number;
  /** Light radius in the same normalised space. */
  readonly radius?: number;
}

export const GLYPH_COUNT = 7;
const DEFAULT_RADIUS = 0.09;

/* Spread around the arch rather than scattered: the player should be able to
   find the seventh by following the shape of the gate, not by sweeping blindly. */
function layout(seed: number): Glyph[] {
  const random = rng(seed);
  return Array.from({ length: GLYPH_COUNT }, (_, id) => {
    const t = (id + 0.5) / GLYPH_COUNT;
    const angle = Math.PI * (1 - t);
    const jitter = (random() - 0.5) * 0.05;
    return {
      id,
      x: 0.5 + Math.cos(angle) * (0.34 + jitter),
      y: 0.28 + Math.sin(angle) * (0.44 + jitter),
      lit: false,
    };
  });
}

export const cursorRitual: PuzzleDefinition<RitualState, RitualInput> = register({
  id: 'cursor-ritual',
  area: 'gate',
  title: 'The Cursor Ritual',
  premise: 'The gate remembers light. Show it some.',
  targetSeconds: 45,

  initial: (seed): RitualState => ({ glyphs: layout(seed), swept: 0, lastX: null, lastY: null }),

  apply: (state, input) => {
    const radius = input.radius ?? DEFAULT_RADIUS;
    const moved =
      state.lastX === null || state.lastY === null
        ? 0
        : Math.hypot(input.x - state.lastX, input.y - state.lastY);

    let changed = false;
    const glyphs = state.glyphs.map((glyph) => {
      if (glyph.lit) return glyph;
      if (Math.hypot(glyph.x - input.x, glyph.y - input.y) > radius) return glyph;
      changed = true;
      return { ...glyph, lit: true };
    });

    return {
      glyphs: changed ? glyphs : state.glyphs,
      swept: state.swept + moved,
      lastX: input.x,
      lastY: input.y,
    };
  },

  validate: (state) => state.glyphs.every((glyph) => glyph.lit),

  solve: (state) => ({ ...state, glyphs: state.glyphs.map((glyph) => ({ ...glyph, lit: true })) }),

  hints: [
    'The light only touches what it reaches.',
    'The gate has a shape. The glyphs follow it.',
    'Two are lower than the rest, near where the arch meets the ground.',
  ],

  rewards: { memories: ['bio-01'] },
});

export const litCount = (state: RitualState): number => state.glyphs.filter((g) => g.lit).length;
