'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { stats, sample } from './stats';
import { settings, useSettings } from '@/state/settings';
import { adapt, settingsFor } from './quality';
import styles from './perf-hud.module.css';
import { cls } from '@/lib/css';

/**
 * Two halves that must not be one component:
 *
 * `PerfSampler` lives inside the Canvas and runs every frame — it writes to a
 * plain object and never calls `setState`, so it produces zero React commits.
 * `PerfHud` lives in the DOM and repaints itself four times a second by writing
 * `textContent` through refs, which is also zero commits.
 */

export function PerfSampler() {
  const gl = useThree((s) => s.gl);
  const lastAdapt = useRef(0);

  useFrame((_, delta) => {
    const now = performance.now();
    sample(delta, now);

    const info = gl.info;
    stats.drawCalls = info.render.calls;
    stats.triangles = info.render.triangles;
    stats.programs = info.programs?.length ?? 0;
    stats.geometries = info.memory.geometries;
    stats.textures = info.memory.textures;

    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    stats.heapMb = mem ? Math.round(mem.usedJSHeapSize / 1_048_576) : null;

    // The live adapter is checked once a second, not once a frame.
    if (now - lastAdapt.current < 1000) return;
    lastAdapt.current = now;

    const s = settings();
    const verdict = adapt({
      current: s.quality,
      windows: stats.windows,
      isMobile: matchMedia('(pointer: coarse)').matches,
      manualOverride: s.qualityManual,
    });
    if (verdict.action === 'downgrade') {
      s.setQuality(verdict.to, false);
      stats.windows.length = 0;
    }
  });

  return null;
}

/** Lower is better — frame time, draw calls. */
const ceiling = (value: number, warn: number, bad: number): string =>
  cls(value >= bad ? styles.bad : value >= warn ? styles.warn : styles.good);

/** Higher is better — fps. */
const floor = (value: number, warn: number, bad: number): string =>
  cls(value <= bad ? styles.bad : value <= warn ? styles.warn : styles.good);

export function PerfHud() {
  const show = useSettings((s) => s.showPerfHud);
  const quality = useSettings((s) => s.quality);
  const rows = useRef<Record<string, HTMLSpanElement | null>>({});

  useEffect(() => {
    if (!show) return;
    const id = window.setInterval(() => {
      const set = (key: string, text: string, tone?: string) => {
        const el = rows.current[key];
        if (!el) return;
        el.textContent = text;
        if (tone !== undefined) el.className = cls(styles.value, tone);
      };
      set('fps', stats.fps.toFixed(0), floor(stats.fps, 58, 50));
      set('ms', stats.frameMs.toFixed(1), ceiling(stats.frameMs, 16.7, 20));
      // GDD Part 11 Rule 3: under 180 draw calls in the heaviest area.
      set('calls', String(stats.drawCalls), ceiling(stats.drawCalls, 150, 180));
      set('tris', `${(stats.triangles / 1000).toFixed(0)}k`);
      set('geo', `${stats.geometries}/${stats.textures}`);
      set('heap', stats.heapMb === null ? '—' : `${stats.heapMb} MB`);
    }, 250);
    return () => window.clearInterval(id);
  }, [show]);

  if (!show) return null;

  const q = settingsFor(quality);

  return (
    <div className={styles.hud} role="status" aria-live="off" aria-label="Performance">
      <Row label="fps" refs={rows} name="fps" />
      <Row label="ms" refs={rows} name="ms" />
      <Row label="draws" refs={rows} name="calls" />
      <Row label="tris" refs={rows} name="tris" />
      <Row label="geo/tex" refs={rows} name="geo" />
      <Row label="heap" refs={rows} name="heap" />
      <p className={styles.tier}>
        {q.tier} · scale {q.resolutionScale} · draw {q.drawDistance}m
      </p>
    </div>
  );
}

function Row({
  label,
  name,
  refs,
}: {
  label: string;
  name: string;
  refs: React.RefObject<Record<string, HTMLSpanElement | null>>;
}) {
  return (
    <p className={styles.row}>
      <span className={styles.key}>{label}</span>
      <span
        className={styles.value}
        ref={(el) => {
          refs.current[name] = el;
        }}
      >
        —
      </span>
    </p>
  );
}
