import { describe, expect, it } from 'vitest';
import { AREA_SPECS, type AreaId } from '../src/world/areas/manifest';
import { exitRing } from '../src/world/areas/layout';
import { villageDressing } from '../src/world/areas/dressing';

const ids = Object.keys(AREA_SPECS) as AreaId[];

describe('where the ways out stand', () => {
  it('places every exit of every area, inside that area', () => {
    for (const id of ids) {
      const spec = AREA_SPECS[id];
      const ring = exitRing(spec);
      expect(ring.map((exit) => exit.to)).toEqual([...spec.exits]);

      for (const exit of ring) {
        const [x, , z] = exit.position;
        // Inside the footprint, or the door is outside the room it belongs to.
        expect(Math.abs(x)).toBeLessThan(spec.size[0] / 2);
        expect(Math.abs(z)).toBeLessThan(spec.size[1] / 2);
      }
    }
  });

  it('never stacks two exits in the same spot', () => {
    for (const id of ids) {
      const ring = exitRing(AREA_SPECS[id]);
      for (let a = 0; a < ring.length; a += 1) {
        for (let b = a + 1; b < ring.length; b += 1) {
          const [ax, , az] = ring[a]!.position;
          const [bx, , bz] = ring[b]!.position;
          expect(Math.hypot(ax - bx, az - bz)).toBeGreaterThan(2);
        }
      }
    }
  });

  it('is stable, so a door is in the same place on every visit', () => {
    expect(exitRing(AREA_SPECS.village)).toEqual(exitRing(AREA_SPECS.village));
  });

  it('turns buildings to face the middle', () => {
    for (const exit of exitRing(AREA_SPECS.village)) {
      /* A building rotated by `facing` must have its front pointing back at the
         plaza — otherwise the hub is a ring of buildings showing their backs. */
      const front = new Float64Array([Math.sin(exit.facing), Math.cos(exit.facing)]);
      const inward = new Float64Array([-exit.position[0], -exit.position[2]]);
      const length = Math.hypot(inward[0]!, inward[1]!);
      const dot = (front[0]! * inward[0]! + front[1]! * inward[1]!) / length;
      expect(dot).toBeGreaterThan(0.99);
    }
  });
});

describe('the village, as the player sees it', () => {
  const houses = AREA_SPECS.village.exits.length;

  it('lights a window early, so a returning player is told what they did', () => {
    expect(villageDressing(0.1, houses, false).litBuildings).toBeGreaterThan(0);
    expect(villageDressing(1, houses, false).litBuildings).toBe(houses);
  });

  it('keeps the fountain dry until its puzzle is solved', () => {
    // Otherwise the puzzle is decoration: the reward arrives without it.
    expect(villageDressing(1, houses, false).waterHeight).toBe(0);
    expect(villageDressing(0, houses, true).waterHeight).toBeGreaterThan(0);
  });

  it('never lights more buildings than exist', () => {
    for (const r of [0, 0.5, 1, 5]) {
      expect(villageDressing(r, houses, true).litBuildings).toBeLessThanOrEqual(houses);
    }
  });
});
