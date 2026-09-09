'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { stats } from './stats';

/**
 * The automated flythrough the perf regression script drives (GDD Part 12).
 *
 * A fixed spline, a fixed duration, and no input — so two runs of the same
 * commit produce the same camera path and a frame-time difference means a code
 * difference. It publishes its result on `window.__tfmPerf`, which is the only
 * thing the script outside the browser needs to read.
 */

export interface PerfReport {
  readonly done: boolean;
  readonly frames: number;
  readonly seconds: number;
  readonly fps: number;
  readonly p50: number;
  readonly p95: number;
  readonly p99: number;
  readonly maxDrawCalls: number;
  readonly maxTriangles: number;
}

declare global {
  interface Window {
    __tfmPerf?: PerfReport;
  }
}

const percentile = (sorted: readonly number[], p: number): number =>
  sorted.length === 0 ? 0 : (sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] ?? 0);

export function Flythrough({ seconds = 90 }: { seconds?: number }) {
  const camera = useThree((s) => s.camera);
  const samples = useRef<number[]>([]);
  const maxCalls = useRef(0);
  const maxTris = useRef(0);
  const elapsed = useRef(0);
  const warmup = useRef(0);
  const finished = useRef(false);

  /* A closed loop over the blockout: the steps, both ramps, the wall gaps, and
     a long open stretch that isolates fill rate from geometry. */
  const path = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 3, 14),
          new THREE.Vector3(-14, 4, 2),
          new THREE.Vector3(-8, 3, -12),
          new THREE.Vector3(6, 5, -16),
          new THREE.Vector3(16, 4, -6),
          new THREE.Vector3(12, 3, 10),
        ],
        true,
        'catmullrom',
        0.5,
      ),
    [],
  );

  useEffect(() => {
    window.__tfmPerf = {
      done: false, frames: 0, seconds: 0, fps: 0,
      p50: 0, p95: 0, p99: 0, maxDrawCalls: 0, maxTriangles: 0,
    };
  }, []);

  const look = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (finished.current) return;

    const t = (elapsed.current / seconds) % 1;
    path.getPointAt(t, camera.position);
    path.getPointAt((t + 0.06) % 1, look.current);
    camera.lookAt(look.current);

    // Two seconds of warm-up: shader compilation is not a frame-rate problem.
    warmup.current += delta;
    if (warmup.current < 2) return;

    elapsed.current += delta;
    samples.current.push(delta * 1000);
    maxCalls.current = Math.max(maxCalls.current, stats.drawCalls);
    maxTris.current = Math.max(maxTris.current, stats.triangles);

    if (elapsed.current < seconds) return;

    finished.current = true;
    const sorted = [...samples.current].sort((a, b) => a - b);
    const total = samples.current.reduce((sum, ms) => sum + ms, 0);
    window.__tfmPerf = {
      done: true,
      frames: samples.current.length,
      seconds: total / 1000,
      fps: (samples.current.length * 1000) / total,
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      maxDrawCalls: maxCalls.current,
      maxTriangles: maxTris.current,
    };
  });

  return null;
}
