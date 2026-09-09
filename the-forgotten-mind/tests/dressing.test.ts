import { describe, expect, it } from 'vitest';
import { dressing } from '../src/world/areas/dressing';

/**
 * The Forest healing is the vertical slice's exit criterion: "a stranger can
 * play for eight minutes, recover six memories, and watch the Forest visibly
 * heal." Six of a hundred is 6% — so the test that matters is not that 0% and
 * 100% differ, but that a *small* early gain is already visible.
 */

const TREES = 120;
const FLIES = 60;
const full = (r: number) => dressing(r, 1, TREES, FLIES);

describe('restoration, as the player sees it', () => {
  it('is visible after six memories, not just after sixty', () => {
    const start = full(0);
    const early = full(0.06);

    expect(early.fogFar).toBeGreaterThan(start.fogFar + 5);
    expect(early.canopy).toBeGreaterThan(start.canopy);
    expect(early.canopyScale).toBeGreaterThan(start.canopyScale);
  });

  it('leaves the world bare at zero, but still visible', () => {
    const start = full(0);
    /* The trees stand between 12 m and 66 m out. Fog that closes before the
       first of them makes a ruined forest indistinguishable from an empty
       field — the failure a screenshot caught and no assertion had. */
    expect(start.fogFar).toBeGreaterThan(20);
    expect(start.fogFar).toBeLessThan(90);
    expect(start.fireflies).toBe(0);
    // Some canopy, or the forest reads as dead ground rather than winter.
    expect(start.canopy).toBeGreaterThan(0);
  });

  it('holds the fireflies back until the world has earned them', () => {
    expect(full(0.2).fireflies).toBe(0);
    expect(full(0.45).fireflies).toBe(0);
    expect(full(0.6).fireflies).toBeGreaterThan(0);
    expect(full(1).fireflies).toBeGreaterThan(full(0.7).fireflies);
  });

  it('never puts a canopy on a tree that does not exist', () => {
    for (const r of [0, 0.3, 0.77, 1]) {
      expect(full(r).canopy).toBeLessThanOrEqual(TREES);
      expect(full(r).fireflies).toBeLessThanOrEqual(FLIES);
    }
  });

  it('respects the quality tier, so Low is thinner without being broken', () => {
    const high = dressing(1, 1, TREES, FLIES);
    const low = dressing(1, 0.1, TREES, FLIES);
    expect(low.canopy).toBeLessThan(high.canopy);
    expect(low.canopy).toBeGreaterThan(0);
    // Fog is atmosphere, not geometry: it must not thin out with the tier.
    expect(low.fogFar).toBe(high.fogFar);
  });

  it('clamps rather than trusting its input', () => {
    expect(dressing(-3, 1, TREES, FLIES)).toEqual(full(0));
    expect(dressing(7, 1, TREES, FLIES)).toEqual(full(1));
  });

  it('moves monotonically, so recovering a memory never makes the world worse', () => {
    let previous = full(0);
    for (let r = 0.05; r <= 1.0001; r += 0.05) {
      const next = full(Math.min(1, r));
      expect(next.fogFar).toBeGreaterThanOrEqual(previous.fogFar);
      expect(next.canopy).toBeGreaterThanOrEqual(previous.canopy);
      expect(next.fireflies).toBeGreaterThanOrEqual(previous.fireflies);
      previous = next;
    }
  });
});
