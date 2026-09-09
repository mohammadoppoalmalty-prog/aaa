import { describe, expect, it } from 'vitest';
import {
  adapt,
  QUALITY,
  QUALITY_TIERS,
  settingsFor,
  tierDown,
  tierFromGpuTier,
  tierUp,
  UPGRADE_HOLD_MS,
  WINDOW_MS,
} from '../src/world/quality';

const windows = (fps: number, count: number) => Array.from({ length: count }, () => fps);
const HOLD = Math.ceil(UPGRADE_HOLD_MS / WINDOW_MS);

describe('the quality table', () => {
  it('is ordered from most to least expensive', () => {
    const distances = QUALITY_TIERS.map((t) => QUALITY[t].drawDistance);
    expect(distances).toEqual([...distances].sort((a, b) => b - a));

    const scales = QUALITY_TIERS.map((t) => QUALITY[t].resolutionScale);
    expect(scales).toEqual([...scales].sort((a, b) => b - a));
  });

  it('never spends post-processing below the tier that can afford it', () => {
    expect(settingsFor('low').postFx).toEqual(['lut']);
    expect(settingsFor('minimal').postFx).toEqual([]);
    expect(settingsFor('minimal').shadows).toEqual({ kind: 'baked' });
  });

  it('clamps at both ends rather than walking off the table', () => {
    expect(tierUp('ultra')).toBe('ultra');
    expect(tierDown('minimal')).toBe('minimal');
    expect(tierDown('ultra')).toBe('high');
    expect(tierUp('minimal')).toBe('low');
  });
});

describe('the live adapter', () => {
  it('holds on a single bad window — one stutter is not a trend', () => {
    expect(adapt({ current: 'high', windows: [40], isMobile: false, manualOverride: false })).toEqual({
      action: 'hold',
    });
  });

  it('drops a tier after two consecutive bad windows', () => {
    expect(adapt({ current: 'high', windows: [60, 40, 42], isMobile: false, manualOverride: false })).toEqual({
      action: 'downgrade',
      to: 'medium',
    });
  });

  it('uses the mobile floor of 25 fps rather than the desktop 50', () => {
    const input = { current: 'medium', windows: [30, 30], manualOverride: false } as const;
    expect(adapt({ ...input, isMobile: true }).action).toBe('hold');
    expect(adapt({ ...input, isMobile: false }).action).toBe('downgrade');
  });

  it('only offers an upgrade after a full 30 seconds above the ceiling', () => {
    expect(
      adapt({ current: 'medium', windows: windows(60, HOLD - 1), isMobile: false, manualOverride: false }).action,
    ).toBe('hold');
    expect(adapt({ current: 'medium', windows: windows(60, HOLD), isMobile: false, manualOverride: false })).toEqual({
      action: 'offer-upgrade',
      to: 'high',
    });
  });

  it('never overrides a manual choice — that is the whole contract of the setting', () => {
    expect(adapt({ current: 'ultra', windows: windows(12, 10), isMobile: false, manualOverride: true })).toEqual({
      action: 'hold',
    });
  });

  it('does not offer an upgrade past the top of the table', () => {
    expect(
      adapt({ current: 'ultra', windows: windows(60, HOLD), isMobile: false, manualOverride: false }).action,
    ).toBe('hold');
  });
});

describe('gpu detection', () => {
  it('reads an unbenchmarkable GPU as the bottom row, not as unknown-therefore-fine', () => {
    expect(tierFromGpuTier(0, false)).toBe('minimal');
  });

  it('never starts a phone at ultra', () => {
    expect(tierFromGpuTier(3, true)).toBe('high');
    expect(tierFromGpuTier(3, false)).toBe('ultra');
  });
});
