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
    /* 22 m of visibility at nothing recovered, 140 m at everything. This is the
       change a visitor feels several minutes before they could name it. */
    fogNear: 4 + r * 26,
    fogFar: 22 + r * 118,
    canopy: Math.round(trees * foliage * (0.15 + r * 0.85)),
    canopyScale: 0.6 + r * 1.9,
    /* Nothing until 45%: a firefly at 5% would spend the whole early game
       telling the player the world is already fine. */
    fireflies: Math.round(maxFireflies * foliage * Math.max(0, r - 0.45) * 1.8),
  };
}
