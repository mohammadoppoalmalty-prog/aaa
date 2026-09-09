/**
 * Quality tiers — GDD Part 11.
 *
 * The table is data, and the adapter that moves between rows is a pure function,
 * so both are testable without a GPU. Nothing here touches Three.js; `Engine`
 * reads a row and configures the renderer from it.
 */

export const QUALITY_TIERS = ['ultra', 'high', 'medium', 'low', 'minimal'] as const;
export type QualityTier = (typeof QUALITY_TIERS)[number];

export type Antialiasing = 'taa' | 'smaa' | 'fxaa' | 'none';
export type WaterMode = 'full' | 'no-reflections' | 'flat-animated' | 'flat';
export type ShadowMode =
  | { readonly kind: 'csm'; readonly cascades: number; readonly size: number }
  | { readonly kind: 'single'; readonly size: number }
  | { readonly kind: 'baked' };

export interface QualitySettings {
  readonly tier: QualityTier;
  /** Renderer pixel-ratio multiplier, applied on top of a device ratio capped at 2. */
  readonly resolutionScale: number;
  readonly shadows: ShadowMode;
  readonly postFx: readonly ('bloom' | 'lut' | 'vignette' | 'ssao' | 'volumetrics')[];
  /** Fraction of the authored count that is actually spawned. */
  readonly particles: number;
  readonly foliage: number;
  readonly water: WaterMode;
  readonly drawDistance: number;
  readonly anisotropy: number;
  readonly textureSize: 512 | 1024 | 2048;
  readonly antialiasing: Antialiasing;
}

export const QUALITY: Readonly<Record<QualityTier, QualitySettings>> = {
  ultra: {
    tier: 'ultra',
    resolutionScale: 1,
    shadows: { kind: 'csm', cascades: 4, size: 2048 },
    postFx: ['bloom', 'lut', 'vignette', 'ssao', 'volumetrics'],
    particles: 1,
    foliage: 1,
    water: 'full',
    drawDistance: 400,
    anisotropy: 16,
    textureSize: 2048,
    antialiasing: 'taa',
  },
  high: {
    tier: 'high',
    resolutionScale: 1,
    shadows: { kind: 'csm', cascades: 3, size: 1024 },
    postFx: ['bloom', 'lut', 'vignette'],
    particles: 0.7,
    foliage: 0.6,
    water: 'no-reflections',
    drawDistance: 300,
    anisotropy: 8,
    textureSize: 2048,
    antialiasing: 'smaa',
  },
  medium: {
    tier: 'medium',
    resolutionScale: 0.85,
    shadows: { kind: 'single', size: 1024 },
    postFx: ['bloom', 'lut'],
    particles: 0.4,
    foliage: 0.3,
    water: 'flat-animated',
    drawDistance: 180,
    anisotropy: 4,
    textureSize: 1024,
    antialiasing: 'fxaa',
  },
  low: {
    tier: 'low',
    resolutionScale: 0.65,
    shadows: { kind: 'baked' },
    postFx: ['lut'],
    particles: 0.15,
    foliage: 0.1,
    water: 'flat',
    drawDistance: 100,
    anisotropy: 1,
    textureSize: 512,
    antialiasing: 'none',
  },
  minimal: {
    tier: 'minimal',
    resolutionScale: 0.5,
    shadows: { kind: 'baked' },
    postFx: [],
    particles: 0,
    foliage: 0.05,
    water: 'flat',
    drawDistance: 80,
    anisotropy: 1,
    textureSize: 512,
    antialiasing: 'none',
  },
};

export const settingsFor = (tier: QualityTier): QualitySettings => QUALITY[tier];

const index = (tier: QualityTier): number => QUALITY_TIERS.indexOf(tier);

/** One row down; already-minimal stays minimal. */
export function tierDown(tier: QualityTier): QualityTier {
  const next = QUALITY_TIERS[Math.min(index(tier) + 1, QUALITY_TIERS.length - 1)];
  return next ?? tier;
}

/** One row up; already-ultra stays ultra. */
export function tierUp(tier: QualityTier): QualityTier {
  const next = QUALITY_TIERS[Math.max(index(tier) - 1, 0)];
  return next ?? tier;
}

/* ── the live adapter ───────────────────────────────────────────────────────
   Frame time is sampled into rolling 3-second windows. Two consecutive bad
   windows drop a tier immediately; climbing back up is deliberately slower and
   only ever *offered*, because an automatic upgrade that immediately triggers a
   downgrade is a visible oscillation and reads as a broken page.            */

export const WINDOW_MS = 3000;
export const UPGRADE_HOLD_MS = 30_000;

export interface AdapterInput {
  readonly current: QualityTier;
  /** Average fps per 3-second window, most recent last. */
  readonly windows: readonly number[];
  readonly isMobile: boolean;
  /** True once the visitor has picked a tier by hand — that ends the adapter. */
  readonly manualOverride: boolean;
}

export type AdapterVerdict =
  | { readonly action: 'hold' }
  | { readonly action: 'downgrade'; readonly to: QualityTier }
  | { readonly action: 'offer-upgrade'; readonly to: QualityTier };

export function adapt({ current, windows, isMobile, manualOverride }: AdapterInput): AdapterVerdict {
  if (manualOverride) return { action: 'hold' };

  const floor = isMobile ? 25 : 50;
  const ceiling = 58;
  const holdWindows = Math.ceil(UPGRADE_HOLD_MS / WINDOW_MS);

  const last = windows.slice(-2);
  if (last.length === 2 && last.every((fps) => fps < floor)) {
    const to = tierDown(current);
    return to === current ? { action: 'hold' } : { action: 'downgrade', to };
  }

  const held = windows.slice(-holdWindows);
  if (held.length === holdWindows && held.every((fps) => fps > ceiling)) {
    const to = tierUp(current);
    return to === current ? { action: 'hold' } : { action: 'offer-upgrade', to };
  }

  return { action: 'hold' };
}

/**
 * `detect-gpu` returns a 0–3 tier plus a mobile flag. Its 0 means "we could not
 * benchmark this device", which is not the same as "this device is slow" — but
 * for a WebGL world the safe reading of an unknown GPU is the bottom row.
 */
export function tierFromGpuTier(gpuTier: number, isMobile: boolean): QualityTier {
  if (gpuTier >= 3) return isMobile ? 'high' : 'ultra';
  if (gpuTier === 2) return isMobile ? 'medium' : 'high';
  if (gpuTier === 1) return isMobile ? 'low' : 'medium';
  return 'minimal';
}
