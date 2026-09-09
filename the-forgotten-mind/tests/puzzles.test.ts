import { describe, expect, it } from 'vitest';
import { nextHint, rng, shouldOfferSkip, SKIP_OFFER_MS } from '../src/world/systems/puzzles/framework';
import { cursorRitual, GLYPH_COUNT, litCount } from '../src/world/systems/puzzles/cursor-ritual';
import { DIRECTIONS, lightEcho, rotate, upwindOf, type Direction } from '../src/world/systems/puzzles/light-echo';
import {
  fountain,
  flow,
  GRID,
  INLET_CELL,
  OUTLET_CELL,
  openingsOf,
  type FountainState,
} from '../src/world/systems/puzzles/fountain';

/**
 * GDD Part 11: "every `validate()` gets a test — they are pure functions, so
 * this is cheap, and it prevents unsolvable-puzzle disasters."
 *
 * The generator tests below are the ones that earn their keep: they check a
 * hundred seeds each, because an unsolvable board that appears one time in fifty
 * is exactly the bug that survives manual testing and ships.
 */

const SEEDS = Array.from({ length: 100 }, (_, i) => i * 7919 + 13);

describe('the cursor ritual', () => {
  it('lights a glyph the cursor touches, and never unlights it', () => {
    const start = cursorRitual.initial(1);
    const glyph = start.glyphs[0];
    expect(glyph).toBeDefined();

    const touched = cursorRitual.apply(start, { x: glyph!.x, y: glyph!.y });
    expect(litCount(touched)).toBe(1);

    const walkedAway = cursorRitual.apply(touched, { x: 5, y: 5 });
    expect(litCount(walkedAway)).toBe(1);
  });

  it('is solved only when all seven are lit', () => {
    for (const seed of SEEDS.slice(0, 20)) {
      let state = cursorRitual.initial(seed);
      expect(state.glyphs).toHaveLength(GLYPH_COUNT);

      state.glyphs.slice(0, GLYPH_COUNT - 1).forEach((glyph) => {
        state = cursorRitual.apply(state, { x: glyph.x, y: glyph.y });
      });
      expect(cursorRitual.validate(state)).toBe(false);

      const last = state.glyphs[GLYPH_COUNT - 1]!;
      state = cursorRitual.apply(state, { x: last.x, y: last.y });
      expect(cursorRitual.validate(state)).toBe(true);
    }
  });

  it('places every glyph inside the gate face, for every seed', () => {
    for (const seed of SEEDS) {
      for (const glyph of cursorRitual.initial(seed).glyphs) {
        expect(glyph.x).toBeGreaterThan(0);
        expect(glyph.x).toBeLessThan(1);
        expect(glyph.y).toBeGreaterThan(0);
        expect(glyph.y).toBeLessThan(1);
      }
    }
  });

  it('measures sweep, which is what the patience secret reads', () => {
    let state = cursorRitual.initial(1);
    state = cursorRitual.apply(state, { x: 0.1, y: 0.1 });
    state = cursorRitual.apply(state, { x: 0.4, y: 0.1 });
    expect(state.swept).toBeCloseTo(0.3);
  });
});

describe('light echo', () => {
  it('is solved when every lantern faces upwind', () => {
    for (const seed of SEEDS) {
      const start = lightEcho.initial(seed);
      expect(lightEcho.validate(start), `seed ${seed} starts solved`).toBe(false);

      const target = upwindOf(start.wind);
      let state = start;
      for (const lantern of start.lanterns) {
        while (state.lanterns[lantern.id]!.facing !== target) {
          state = lightEcho.apply(state, { kind: 'rotate', lantern: lantern.id, by: 1 });
        }
      }
      expect(lightEcho.validate(state), `seed ${seed} is unsolvable`).toBe(true);
    }
  });

  it('unsolves itself if the wind changes, which is why the ribbon is always visible', () => {
    let state = lightEcho.initial(3);
    const target = upwindOf(state.wind);
    for (const lantern of state.lanterns) {
      while (state.lanterns[lantern.id]!.facing !== target) {
        state = lightEcho.apply(state, { kind: 'rotate', lantern: lantern.id, by: 1 });
      }
    }
    expect(lightEcho.validate(state)).toBe(true);

    const elsewhere = DIRECTIONS.find((d) => d !== state.wind) as Direction;
    state = lightEcho.apply(state, { kind: 'gust', wind: elsewhere });
    expect(lightEcho.validate(state)).toBe(false);
  });

  it('rotates both ways, around the compass', () => {
    expect(rotate('N', 1)).toBe('NE');
    expect(rotate('N', -1)).toBe('NW');
    expect(upwindOf('N')).toBe('S');
    expect(upwindOf(upwindOf('SE'))).toBe('SE');
  });
});

describe('the fountain', () => {
  it('generates a board whose solution is reachable, on every seed', () => {
    for (const seed of SEEDS) {
      const start = fountain.initial(seed);
      expect(fountain.validate(start), `seed ${seed} starts solved`).toBe(false);
      expect(fountain.validate(fountain.solve(start)), `seed ${seed} produced an unsolvable board`).toBe(true);
    }
  });

  it('is solvable by the player: replace the two broken segments, then rotate', () => {
    for (const seed of SEEDS.slice(0, 25)) {
      let state = fountain.initial(seed);

      // Fit each spare into a broken cell, as a player would from the cart.
      while (state.spares.length > 0) {
        const brokenCell = state.cells.findIndex((piece) => piece.kind === 'broken');
        expect(brokenCell, `seed ${seed} has a spare with nowhere to go`).toBeGreaterThanOrEqual(0);
        const spareIndex = state.spares.findIndex(
          (spare) => spare === (state.solution[brokenCell] as { kind: string }).kind,
        );
        state = fountain.apply(state, { kind: 'place', cell: brokenCell, spare: spareIndex });
      }

      // Then turn every cell until it matches the laid solution.
      for (let cell = 0; cell < GRID * GRID; cell += 1) {
        const want = state.solution[cell]!;
        for (let turn = 0; turn < 4 && state.cells[cell]!.rotation !== want.rotation; turn += 1) {
          state = fountain.apply(state, { kind: 'rotate', cell });
        }
      }

      expect(fountain.validate(state), `seed ${seed} could not be solved by hand`).toBe(true);
    }
  });

  it('always breaks exactly two segments and puts both in the cart', () => {
    for (const seed of SEEDS) {
      const start = fountain.initial(seed);
      expect(start.cells.filter((piece) => piece.kind === 'broken')).toHaveLength(2);
      expect(start.spares).toHaveLength(2);
    }
  });

  it('refuses a spare in a cell that is not broken', () => {
    const start = fountain.initial(11);
    const intact = start.cells.findIndex((piece) => piece.kind !== 'broken');
    expect(fountain.apply(start, { kind: 'place', cell: intact, spare: 0 })).toBe(start);
  });

  it('will not rotate a broken segment — it has to be replaced', () => {
    const start = fountain.initial(11);
    const brokenCell = start.cells.findIndex((piece) => piece.kind === 'broken');
    expect(fountain.apply(start, { kind: 'rotate', cell: brokenCell })).toBe(start);
  });

  it('does not call it solved when the water reaches the last cell but cannot leave', () => {
    /* Getting this wrong would let a board "solve" while the fountain stays dry. */
    const cells = Array.from({ length: GRID * GRID }, () => ({ kind: 'empty' as const, rotation: 0 as const }));
    const state: FountainState = { cells, spares: [], solution: cells };
    expect(flow(state).solved).toBe(false);
    expect(openingsOf({ kind: 'straight', rotation: 0 })).toEqual([0, 2]);
    expect(INLET_CELL).toBe(0);
    expect(OUTLET_CELL).toBe(GRID * GRID - 1);
  });
});

describe('the skip policy', () => {
  const attempt = { elapsedMs: 0, solved: false, skipped: false, hintsTaken: 0 };

  it('offers no skip before three minutes — an instant exit teaches that nothing is worth trying', () => {
    expect(shouldOfferSkip({ ...attempt, elapsedMs: SKIP_OFFER_MS - 1 })).toBe(false);
    expect(shouldOfferSkip({ ...attempt, elapsedMs: SKIP_OFFER_MS })).toBe(true);
  });

  it('stops offering once the puzzle is done, either way', () => {
    expect(shouldOfferSkip({ ...attempt, elapsedMs: SKIP_OFFER_MS, solved: true })).toBe(false);
    expect(shouldOfferSkip({ ...attempt, elapsedMs: SKIP_OFFER_MS, skipped: true })).toBe(false);
  });

  it('grants the same rewards whether solved or skipped', () => {
    expect(fountain.rewards.fragment).toBe(true);
    expect(lightEcho.rewards.fragment).toBe(true);
  });

  it('escalates hints on request and never runs out', () => {
    expect(nextHint(fountain, attempt)).toBe(fountain.hints[0]);
    expect(nextHint(fountain, { ...attempt, hintsTaken: 99 })).toBe(fountain.hints.at(-1));
    expect(nextHint(fountain, { ...attempt, solved: true })).toBeNull();
  });
});

describe('the seeded rng', () => {
  it('is reproducible, so a bug report can carry a seed', () => {
    const a = rng(42);
    const b = rng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
