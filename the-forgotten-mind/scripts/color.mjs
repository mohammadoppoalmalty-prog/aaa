/* Colour maths for the token pipeline.
   One implementation, used by every generator, so the CSS, the TS module and
   the GLSL constants can never disagree about what a colour is. */

const clamp01 = (n) => Math.min(1, Math.max(0, n));

export function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255);
}

export const rgbToHex = (rgb) =>
  '#' + rgb.map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

/* sRGB transfer function — the step most hand-rolled converters get wrong. */
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

export const srgbToLinear = (rgb) => rgb.map(toLinear);
export const linearToSrgb = (rgb) => rgb.map(toGamma);

export function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinear([L, a, bb]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexToOklch(hex) {
  const [L, a, b] = linearToOklab(srgbToLinear(hexToRgb(hex)));
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, C, C < 1e-4 ? 0 : h];
}

export function oklchToLinear([L, C, h]) {
  const rad = (h * Math.PI) / 180;
  return oklabToLinear([L, C * Math.cos(rad), C * Math.sin(rad)]);
}

export const oklchToHex = (lch) => rgbToHex(linearToSrgb(oklchToLinear(lch)));

const r3 = (n, p = 4) => Number(n.toFixed(p));

/** `oklch(62.1% 0.148 233.4)` — the CSS form. */
export function formatOklch([L, C, h], alpha) {
  const base = `${r3(L * 100, 2)}% ${r3(C, 4)} ${r3(h, 2)}`;
  return alpha === undefined || alpha >= 1 ? `oklch(${base})` : `oklch(${base} / ${r3(alpha, 3)})`;
}

/** Linear-space vec3 — what a shader actually wants, so no per-frame conversion. */
export function formatVec3(lch) {
  return `vec3(${oklchToLinear(lch).map((c) => r3(clamp01(c), 5).toFixed(5)).join(', ')})`;
}

export { clamp01, r3 };
