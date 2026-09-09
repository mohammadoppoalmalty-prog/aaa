/**
 * How restoration reads, as numbers.
 *
 * The Forest's healing is the vertical slice's whole proof, so the mapping from
 * "memories recovered" to "what the player sees" is a pure function rather than
 * arithmetic buried in a frame loop: it can be tested, tuned from one place, and
 * reused by the Village and every area after it.
 */

export interface Dressing {
  /** Fog distances in metres. Near is where haze starts; far is where it closes. */
  readonly fogNear: number;
  readonly fogFar: number;
  /** How many of the trees carry a canopy. */
  readonly canopy: number;
  /** Canopy scale, from bare twigs to full crown. */
  readonly canopyScale: number;
  /** Fireflies arrive late — they are the reward for finishing, not for starting. */
  readonly fireflies: number;
}

export function dressing(restoration: number, foliage: number, trees: number, maxFireflies: number): Dressing {
  const r = Math.min(1, Math.max(0, restoration));
  return {
    /* 48 m of visibility at nothing recovered, 140 m at everything.
       The floor was 22 m, which measured well and looked like nothing at all:
       the trees begin twelve metres out and reach sixty-six, so a 22 m wall
       swallowed the forest and left a black void. A ruined forest has to be
       *visible* to read as ruined — bare trunks in mist, not an absence. */
    fogNear: 6 + r * 24,
    fogFar: 48 + r * 92,
    canopy: Math.round(trees * foliage * (0.15 + r * 0.85)),
    canopyScale: 0.6 + r * 1.9,
    /* Nothing until 45%: a firefly at 5% would spend the whole early game
       telling the player the world is already fine. */
    fireflies: Math.round(maxFireflies * foliage * Math.max(0, r - 0.45) * 1.8),
  };
}

export interface VillageDressing {
  /** Buildings whose windows are lit, out of however many stand in the plaza. */
  readonly litBuildings: number;
  /** How high the fountain runs, in metres. Zero until the grate is opened. */
  readonly waterHeight: number;
  /** Lamp-post glow, from cold and dim to warm and full. */
  readonly lampIntensity: number;
}

export function villageDressing(restoration: number, buildings: number, fountainRunning: boolean): VillageDressing {
  const r = Math.min(1, Math.max(0, restoration));
  return {
    /* Windows light one building at a time, and the first one lights early: a
       hub that stays uniformly dark until late tells a returning player nothing
       about what they have done. */
    litBuildings: Math.min(buildings, Math.round(buildings * (0.1 + r * 0.9))),
    /* The fountain is the *narrative* meter — it only runs once its puzzle is
       solved, and then its level tracks restoration. A fountain that fills
       without being fixed would make the puzzle decorative. */
    waterHeight: fountainRunning ? 0.15 + r * 0.75 : 0,
    lampIntensity: 0.35 + r * 1.15,
  };
}
