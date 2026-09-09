import { describe, expect, it } from 'vitest';
import {
  ALL_AREAS,
  allExits,
  AREA_SPECS,
  gateState,
  TOTAL_MEMORIES,
  TOTAL_SECRET_MEMORIES,
  type AreaId,
} from '../src/world/areas/manifest';
import { canTravel, planResidency, reachable, residencyDelta, restorationOf, route } from '../src/world/systems/director';

const NONE = { restoration: 0, fragments: 0 };
const ALL = { restoration: 1, fragments: 8 };

describe('the atlas', () => {
  /* GDD Appendix B: "this column must always sum to 100". It is the denominator
     of every restoration percentage in the project, so it is worth a test. */
  it('holds exactly one hundred memories, plus the five secret ones', () => {
    expect(TOTAL_MEMORIES).toBe(100);
    expect(TOTAL_SECRET_MEMORIES).toBe(5);
  });

  it('has eight Core Fragments, one per major building', () => {
    expect(ALL_AREAS.filter((area) => area.fragment)).toHaveLength(8);
  });

  it('connects every way out back, so no area is a one-way trap', () => {
    const oneWay = new Set<AreaId>(['gate']); // the Gate is deliberately one-way
    for (const area of ALL_AREAS) {
      for (const exit of allExits(area)) {
        if (oneWay.has(exit)) continue;
        expect(allExits(AREA_SPECS[exit]), `${exit} does not lead back to ${area.id}`).toContain(area.id);
      }
    }
  });

  it('keeps its two secret ways in unmarked, so nothing points at them', () => {
    expect(AREA_SPECS.village.hiddenExits).toEqual(['secret-sanctuary']);
    expect(AREA_SPECS.village.exits).not.toContain('secret-sanctuary');
    expect(AREA_SPECS['childhood-home'].hiddenExits).toEqual(['hidden-basement']);
  });

  it('can be walked from the Gate to the Contact Tower', () => {
    const path = route('gate', 'contact-tower');
    expect(path).not.toBeNull();
    expect(path?.[0]).toBe('gate');
    expect(path?.at(-1)).toBe('contact-tower');
  });

  it('gives every locked area something visible to say', () => {
    for (const area of ALL_AREAS) {
      if (!area.gate) continue;
      const state = gateState(area, NONE);
      expect(state.open).toBe(false);
      expect(state.reason, `${area.id} is locked without a visible reason`).toBeTruthy();
    }
  });
});

describe('gating', () => {
  it('opens the Achievement Hall at 40% restoration and not before', () => {
    const hall = AREA_SPECS['achievement-hall'];
    expect(gateState(hall, { restoration: 0.39, fragments: 0 }).open).toBe(false);
    expect(gateState(hall, { restoration: 0.4, fragments: 0 }).open).toBe(true);
  });

  it('needs both currencies for the Sky Bridge', () => {
    const bridge = AREA_SPECS['sky-bridge'];
    expect(gateState(bridge, { restoration: 1, fragments: 5 }).open).toBe(false);
    expect(gateState(bridge, { restoration: 0.5, fragments: 8 }).open).toBe(false);
    expect(gateState(bridge, { restoration: 0.6, fragments: 6 }).open).toBe(true);
  });

  it('refuses a route that does not exist, separately from one that is locked', () => {
    expect(canTravel('gate', 'contact-tower', ALL)).toEqual({
      ok: false,
      reason: 'There is no path from The Gate to Contact Tower.',
    });
    const locked = canTravel('village', 'achievement-hall', NONE);
    expect(locked.ok).toBe(false);
    expect(locked.ok === false && locked.reason).toContain('sconces');
  });

  it('reaches only the early world with nothing recovered', () => {
    const open = reachable('gate', NONE).map((a) => a.id);
    expect(open).toContain('village');
    expect(open).not.toContain('achievement-hall');
    expect(open).not.toContain('contact-tower');
  });

  it('reaches everything once both currencies are full', () => {
    expect(reachable('gate', ALL)).toHaveLength(ALL_AREAS.length);
  });
});

describe('streaming', () => {
  it('keeps the current area resident and its neighbours warm', () => {
    const plan = planResidency('village');
    expect(plan.resident).toBe('village');
    expect(plan.warm).toEqual(allExits(AREA_SPECS.village));
    expect(plan.cold).not.toContain('village');
    expect([...plan.warm, ...plan.cold, plan.resident]).toHaveLength(ALL_AREAS.length);
  });

  it('names what to unload when the player moves — the list that leaks if nobody computes it', () => {
    const delta = residencyDelta('village', 'memory-forest');
    expect(delta.load).toContain('gate');
    expect(delta.unload).toContain('crystal-lake');
    expect(delta.unload).not.toContain('village'); // still warm: the forest leads back
  });

  it('warms a locked neighbour, because a locked area is still visible from here', () => {
    expect(planResidency('village').warm).toContain('achievement-hall');
  });
});

describe('restoration', () => {
  it('is the fraction recovered, clamped', () => {
    expect(restorationOf(0, 100)).toBe(0);
    expect(restorationOf(40, 100)).toBeCloseTo(0.4);
    expect(restorationOf(120, 100)).toBe(1);
    expect(restorationOf(1, 0)).toBe(0);
  });
});
