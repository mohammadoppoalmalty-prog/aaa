import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens, tokenVersion } from '../src/generated/tokens';
import { hexToOklch, oklchToHex } from '../scripts/color.mjs';

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src/generated', file), 'utf8');

/**
 * The pipeline's promise is that CSS, TypeScript and GLSL cannot disagree about
 * a colour. These tests are what makes that a fact rather than an intention.
 */
describe('the token pipeline', () => {
  const css = read('tokens.css');
  const glsl = read('tokens.glsl');
  const manifest: { tiers: Record<string, string[]> } = JSON.parse(read('tokens.manifest.json'));

  it('emits every token into the stylesheet', () => {
    for (const names of Object.values(manifest.tiers)) {
      for (const name of names) expect(css).toContain(`${name}:`);
    }
  });

  it('gives every semantic colour a GLSL constant, so shaders read the same palette', () => {
    for (const name of Object.keys(tokens.semantic.color)) {
      const constant = `TFM_COLOR_${name.replace(/-/g, '_').toUpperCase()}`;
      expect(glsl).toContain(`const vec3 ${constant} =`);
    }
  });

  it('keeps the semantic tier free of raw colour values — every one is a reference', () => {
    for (const name of Object.keys(tokens.semantic.color)) {
      const line = css.split('\n').find((l) => l.trim().startsWith(`--tfm-color-${name}:`));
      expect(line, `missing --tfm-color-${name}`).toBeTruthy();
      expect(line, `${name} bakes a literal instead of referencing a global token`).toContain('var(--tfm-color-');
    }
  });

  it('round-trips OKLCH through sRGB without drift', () => {
    for (const hex of ['#05070F', '#5BE1FF', '#9B7CFF', '#FFC96B', '#3EE0B0']) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it('is versioned, because a token file without a version cannot be deprecated safely', () => {
    expect(tokenVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

/**
 * WCAG 2.2 AAA on the Codex means 7:1 on body text. STANDARDS 7.9 commits to it
 * in writing, so it is checked here rather than claimed.
 */
describe('contrast', () => {
  const luminance = (hex: string): number => {
    const channel = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
  };

  const canvas = tokens.semantic.color.canvas.hex;

  it('holds 7:1 for high-emphasis text on the canvas', () => {
    expect(ratio(tokens.semantic.color['text-high'].hex, canvas)).toBeGreaterThanOrEqual(7);
  });

  it('holds 4.5:1 for the accent, which carries links and focus', () => {
    expect(ratio(tokens.semantic.color.accent.hex, canvas)).toBeGreaterThanOrEqual(4.5);
  });

  it('holds 3:1 for every state colour, which must read at a glance', () => {
    for (const key of ['state-success', 'state-warning', 'state-error', 'state-info'] as const) {
      expect(ratio(tokens.semantic.color[key].hex, canvas), key).toBeGreaterThanOrEqual(3);
    }
  });
});
