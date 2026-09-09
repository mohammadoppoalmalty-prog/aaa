import { describe, expect, it } from 'vitest';
import '../src/world/systems/puzzles';
import { registry } from '../src/world/systems/puzzles/framework';
import { AREA_SPECS, type AreaId } from '../src/world/areas/manifest';

/**
 * One contract, held by every puzzle in the game.
 *
 * GDD Part 11 asks for a test per `validate()`. This goes further and tests the
 * whole registry generically, because the failure that actually ships is not a
 * wrong `validate` — it is the sixteenth puzzle, written last and in a hurry,
 * that generates an unsolvable board one seed in fifty. A player cannot tell
 * that from a hard puzzle. They conclude they are stupid and they close the tab.
 *
 * A hundred seeds each, sixteen puzzles: sixteen hundred boards, in milliseconds,
 * because a puzzle here is a pure function and nothing else.
 */

const SEEDS = Array.from({ length: 100 }, (_, i) => i * 7919 + 13);
const puzzles = [...registry.values()];

describe('every puzzle in the registry', () => {
  it('is registered — all sixteen of them', () => {
    const expected = Object.values(AREA_SPECS)
      .map((spec) => spec.puzzle)
      .filter((id): id is string => id !== null);

    expect(puzzles).toHaveLength(expected.length);
    expect([...registry.keys()].sort()).toEqual([...expected].sort());
  });

  it('names an area that exists, and the area names it back', () => {
    for (const puzzle of puzzles) {
      const spec = AREA_SPECS[puzzle.area as AreaId];
      expect(spec, `${puzzle.id} points at a missing area`).toBeDefined();
      expect(spec.puzzle, `${puzzle.id} and ${spec.id} disagree`).toBe(puzzle.id);
    }
  });

  it('can always be solved, on every seed', () => {
    for (const puzzle of puzzles) {
      for (const seed of SEEDS) {
        const start = puzzle.initial(seed);
        const solved = puzzle.solve(start);
        expect(puzzle.validate(solved), `${puzzle.id} could not solve seed ${seed}`).toBe(true);
      }
    }
  });

  it('does not hand the player a board that is already finished', () => {
    for (const puzzle of puzzles) {
      for (const seed of SEEDS) {
        expect(
          puzzle.validate(puzzle.initial(seed)),
          `${puzzle.id} opens solved on seed ${seed}`,
        ).toBe(false);
      }
    }
  });

  it('generates the same board twice from the same seed', () => {
    // Or a bug report carrying a seed reproduces a different puzzle.
    for (const puzzle of puzzles) {
      for (const seed of SEEDS.slice(0, 20)) {
        expect(puzzle.initial(seed)).toEqual(puzzle.initial(seed));
      }
    }
  });

  it('never mutates the state handed to it', () => {
    for (const puzzle of puzzles) {
      const start = puzzle.initial(7);
      const copy = structuredClone(start);
      puzzle.solve(start);
      puzzle.validate(start);
      expect(start, `${puzzle.id} mutated its own state`).toEqual(copy);
    }
  });

  it('stays solved once it is solved', () => {
    // Nothing in this game takes progress back. Solving twice is still solved.
    for (const puzzle of puzzles) {
      for (const seed of SEEDS.slice(0, 25)) {
        const once = puzzle.solve(puzzle.initial(seed));
        expect(puzzle.validate(puzzle.solve(once)), `${puzzle.id} unsolved itself`).toBe(true);
      }
    }
  });

  it('speaks, and offers three escalating hints', () => {
    for (const puzzle of puzzles) {
      expect(puzzle.premise.length, `${puzzle.id} has no premise`).toBeGreaterThan(10);
      expect(puzzle.hints.length, `${puzzle.id} has too few hints`).toBeGreaterThanOrEqual(3);
      // The last hint may point at the answer; the first must never state it.
      expect(puzzle.hints[0]!.length).toBeGreaterThan(10);
      expect(puzzle.title.length).toBeGreaterThan(2);
    }
  });

  it('pays out something, and times its own skip offer', () => {
    for (const puzzle of puzzles) {
      const memories = puzzle.rewards.memories ?? [];
      expect(memories.length, `${puzzle.id} rewards nothing`).toBeGreaterThan(0);
      expect(new Set(memories).size, `${puzzle.id} pays the same memory twice`).toBe(memories.length);
      /* Between half a minute and eight: under that the skip offer arrives
         before the puzzle has been read, over it the pacing is a different
         problem than this test can see. */
      expect(puzzle.targetSeconds).toBeGreaterThan(30);
      expect(puzzle.targetSeconds).toBeLessThan(480);
    }
  });

  it('grants each memory to exactly one puzzle', () => {
    // Two puzzles paying out the same memory means one of them pays out nothing.
    const seen = new Map<string, string>();
    for (const puzzle of puzzles) {
      for (const memory of puzzle.rewards.memories ?? []) {
        expect(seen.get(memory), `${memory} is paid by ${seen.get(memory)} and ${puzzle.id}`).toBeUndefined();
        seen.set(memory, puzzle.id);
      }
    }
  });
});
