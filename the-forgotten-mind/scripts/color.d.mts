/** Types for the token pipeline's colour maths, which is plain ESM so the
 *  generator can run with no build step. */
export type Oklch = readonly [L: number, C: number, h: number];

export function hexToRgb(hex: string): number[];
export function rgbToHex(rgb: readonly number[]): string;
export function srgbToLinear(rgb: readonly number[]): number[];
export function linearToSrgb(rgb: readonly number[]): number[];
export function linearToOklab(rgb: readonly number[]): number[];
export function oklabToLinear(lab: readonly number[]): number[];
export function hexToOklch(hex: string): Oklch;
export function oklchToLinear(lch: Oklch): number[];
export function oklchToHex(lch: Oklch): string;
export function formatOklch(lch: Oklch, alpha?: number): string;
export function formatVec3(lch: Oklch): string;
export function clamp01(n: number): number;
export function r3(n: number, p?: number): number;
