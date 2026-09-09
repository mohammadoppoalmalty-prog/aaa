/**
 * Frame statistics, deliberately outside React.
 *
 * A perf HUD that re-renders React every frame measures itself more than it
 * measures the world. This is a plain mutable record: one `useFrame` writes it,
 * the HUD reads it on a 250 ms timer and writes text into DOM nodes by ref.
 */

export interface FrameStats {
  /** Milliseconds for the last frame. */
  frameMs: number;
  /** Smoothed frames per second, ~1s of history. */
  fps: number;
  drawCalls: number;
  triangles: number;
  programs: number;
  geometries: number;
  textures: number;
  /** JS heap in MB where the browser exposes it, otherwise null. */
  heapMb: number | null;
  /** Rolling 3-second windows of average fps, most recent last, capped at 20. */
  windows: number[];
}

export const stats: FrameStats = {
  frameMs: 0,
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  programs: 0,
  geometries: 0,
  textures: 0,
  heapMb: null,
  windows: [],
};

const MAX_WINDOWS = 20;
const WINDOW_MS = 3000;

let windowStart = 0;
let windowFrames = 0;

/** Called once per frame with the delta in seconds. */
export function sample(deltaSeconds: number, now: number): void {
  const frameMs = deltaSeconds * 1000;
  stats.frameMs = frameMs;
  // Exponential smoothing: enough to read, not so much that a stall hides.
  const instant = frameMs > 0 ? 1000 / frameMs : 0;
  stats.fps = stats.fps === 0 ? instant : stats.fps * 0.9 + instant * 0.1;

  if (windowStart === 0) windowStart = now;
  windowFrames += 1;

  const elapsed = now - windowStart;
  if (elapsed >= WINDOW_MS) {
    stats.windows.push((windowFrames * 1000) / elapsed);
    if (stats.windows.length > MAX_WINDOWS) stats.windows.shift();
    windowStart = now;
    windowFrames = 0;
  }
}

export function resetWindows(): void {
  stats.windows.length = 0;
  windowStart = 0;
  windowFrames = 0;
}
