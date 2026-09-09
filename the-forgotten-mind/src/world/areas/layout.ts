import { AREA_SPECS, type AreaSpec, type AreaId } from './manifest';

/**
 * Where the ways out of an area stand.
 *
 * This is shared rather than computed twice because the Village dresses a
 * building around each of its exits: if the blockout put a door at one angle and
 * the village put its workshop at another, the player would walk into a wall to
 * reach the workshop. One function, one ring, no drift.
 */

export interface ExitPlacement {
  readonly to: AreaId;
  readonly position: readonly [number, number, number];
  /** Radians. A building at this exit faces the middle by rotating to `facing`. */
  readonly angle: number;
  readonly facing: number;
}

export function exitRing(spec: AreaSpec): readonly ExitPlacement[] {
  const [width, depth] = spec.size;
  const list = AREA_SPECS[spec.id].exits;
  /* Proportional, but capped in metres. The Village's footprint is 200 m; at
     0.42 of it the buildings stand ninety-four metres from the middle, which on
     screen is a horizon with a shed on it rather than a hub you are standing in.
     A plaza has to be crossable in a few seconds and legible in one look. */
  const radius = Math.min(Math.min(width, depth) * 0.42, 34);

  return list.map((to, index) => {
    /* Spread evenly and started at the top, so a player standing in the middle
       can turn once and see every way out — the one property a blockout owes. */
    const angle = (index / list.length) * Math.PI * 2 - Math.PI / 2;
    return {
      to,
      position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as const,
      angle,
      /* A mesh's front is its +Z face, which a Y rotation of `facing` sends to
         (sin, cos). Point that at the middle — the naive `-angle` turns every
         building exactly backwards, which reads as a ring of back walls. */
      facing: Math.atan2(-Math.cos(angle), -Math.sin(angle)),
    };
  });
}
