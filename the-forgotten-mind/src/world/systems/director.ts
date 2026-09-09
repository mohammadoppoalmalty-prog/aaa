import { AREA_SPECS, ALL_AREAS, allExits, areaById, gateState, type AreaId, type AreaSpec } from '../areas/manifest';

/**
 * The Director — GDD Part 11, "asset streaming".
 *
 * Three residency states, and the rule that makes them work: a transition is a
 * walk, never a fade. Adjacent areas are warmed while the player is still in the
 * current one, so the corridor between them hides the load.
 *
 * Everything here is a pure function of (current area, progress). The component
 * that mounts scenes reads these decisions; it does not make them — which is
 * what lets a nineteen-area streaming policy be tested in milliseconds without a
 * GPU, a scene, or a frame.
 */

export type Residency = 'resident' | 'warm' | 'cold';

export interface Progress {
  /** 0–1, the fraction of the hundred memories recovered. */
  readonly restoration: number;
  /** Core Fragments held, of eight. */
  readonly fragments: number;
}

export interface ResidencyPlan {
  readonly resident: AreaId;
  /** Loaded at LOD1, geometry only, textures deferred. */
  readonly warm: readonly AreaId[];
  /** Unloaded — only a manifest entry in memory. */
  readonly cold: readonly AreaId[];
}

/**
 * Warm exactly the areas the player could walk into next.
 *
 * Deliberately *not* filtered by whether their gate is open: a locked area is
 * still visible from where the player stands — the Sky Bridge's unassembled
 * pieces, the Hall's unlit sconces — and those are the frames a visitor judges
 * the world by, so their geometry has to be resident before they arrive.
 */
export function planResidency(current: AreaId): ResidencyPlan {
  const spec = AREA_SPECS[current];
  const warm = allExits(spec).filter((id) => id !== current);
  const warmSet = new Set<AreaId>(warm);

  return {
    resident: current,
    warm,
    cold: ALL_AREAS.map((a) => a.id).filter((id) => id !== current && !warmSet.has(id)),
  };
}

/** What happens to each area when the player moves — the unload list is the
 *  part that leaks if nobody computes it. */
export function residencyDelta(from: AreaId, to: AreaId): {
  readonly load: readonly AreaId[];
  readonly unload: readonly AreaId[];
} {
  const before = planResidency(from);
  const after = planResidency(to);

  const live = (plan: ResidencyPlan) => new Set<AreaId>([plan.resident, ...plan.warm]);
  const wasLive = live(before);
  const isLive = live(after);

  return {
    load: [...isLive].filter((id) => !wasLive.has(id)),
    unload: [...wasLive].filter((id) => !isLive.has(id)),
  };
}

export type TravelVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

/** Can the player walk from here to there, and if not, what do they see instead. */
export function canTravel(from: AreaId, to: AreaId, progress: Progress): TravelVerdict {
  const origin = areaById(from);
  const target = areaById(to);
  if (!origin || !target) return { ok: false, reason: 'That way leads nowhere.' };

  if (!allExits(origin).includes(to)) {
    return { ok: false, reason: `There is no path from ${origin.name} to ${target.name}.` };
  }

  const gate = gateState(target, progress);
  return gate.open ? { ok: true } : { ok: false, reason: gate.reason ?? 'It is not open yet.' };
}

/**
 * Shortest walking route, for fast travel and for the "you are here" map.
 * Breadth-first over the area graph, ignoring gates — the route a player would
 * eventually be able to take, which is what a map should show.
 */
export function route(from: AreaId, to: AreaId): readonly AreaId[] | null {
  if (from === to) return [from];

  const previous = new Map<AreaId, AreaId>();
  const seen = new Set<AreaId>([from]);
  const queue: AreaId[] = [from];

  while (queue.length > 0) {
    const here = queue.shift() as AreaId;
    for (const next of allExits(AREA_SPECS[here])) {
      if (seen.has(next)) continue;
      seen.add(next);
      previous.set(next, here);
      if (next === to) {
        const path: AreaId[] = [to];
        let step: AreaId | undefined = to;
        while (step !== undefined && step !== from) {
          step = previous.get(step);
          if (step !== undefined) path.unshift(step);
        }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

/** Restoration as the world measures it: recovered over the authored total. */
export const restorationOf = (recovered: number, total: number): number =>
  total <= 0 ? 0 : Math.min(1, Math.max(0, recovered / total));

/** Every area reachable on foot right now, for the fountain map and `/debug`. */
export function reachable(from: AreaId, progress: Progress): readonly AreaSpec[] {
  const open = new Set<AreaId>([from]);
  const queue: AreaId[] = [from];

  while (queue.length > 0) {
    const here = queue.shift() as AreaId;
    for (const next of allExits(AREA_SPECS[here])) {
      if (open.has(next)) continue;
      if (!canTravel(here, next, progress).ok) continue;
      open.add(next);
      queue.push(next);
    }
  }
  return [...open].map((id) => AREA_SPECS[id]);
}
