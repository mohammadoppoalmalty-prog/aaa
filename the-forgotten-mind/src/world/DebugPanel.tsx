'use client';

import { useEffect, useRef, useState } from 'react';
import { getRestoration, liveChunks, registrySize, setRestoration } from './systems/restoration';
import { QUALITY_TIERS } from './quality';
import { useSettings } from '@/state/settings';
import { stats } from './stats';
import { cls } from '@/lib/css';
import styles from './debug-panel.module.css';

/**
 * The in-world half of the inspector, shown at `/world?debug=1`.
 *
 * The restoration scrub has to live here rather than on `/debug`: the uniform is
 * a module-scoped object inside the running engine, and a control on another
 * route would be writing to a different instance of it. `/debug` configures the
 * world; this panel drives the one that is running.
 */
export function DebugPanel() {
  const quality = useSettings((s) => s.quality);
  const setQuality = useSettings((s) => s.setQuality);
  const [restoration, setLocal] = useState(getRestoration);
  const [open, setOpen] = useState(true);
  const readout = useRef<HTMLSpanElement>(null);

  /* The live numbers are written straight into the DOM on a timer, for the same
     reason the perf HUD does it: a debug panel must not perturb what it measures. */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (readout.current) {
        readout.current.textContent =
          `${registrySize()} tracked · ${stats.geometries} geo · ${stats.textures} tex` +
          (liveChunks().length ? ` · ${liveChunks().join(', ')}` : ' · no chunks registered');
      }
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Backquote') setOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) {
    return (
      <button type="button" className={cls(styles.panel, styles.collapsed)} onClick={() => setOpen(true)}>
        debug `
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="World inspector">
      <p className={styles.head}>
        world inspector
        <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Hide inspector">
          ×
        </button>
      </p>

      <label className={styles.field}>
        <span>
          restoration <b>{restoration.toFixed(2)}</b>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={restoration}
          onChange={(event) => {
            const value = Number(event.currentTarget.value);
            setLocal(value);
            // One float write moves the entire world.
            setRestoration(value);
          }}
        />
      </label>

      <div className={styles.field}>
        <span>quality</span>
        <div className={styles.tiers}>
          {QUALITY_TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              className={cls(styles.tier, tier === quality && styles.on)}
              aria-pressed={tier === quality}
              onClick={() => setQuality(tier)}
            >
              {tier.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.field}>
        <span>disposal</span>
        <span className={styles.readout} ref={readout}>
          —
        </span>
      </p>

      <p className={styles.hint}>
        <kbd>`</kbd> hide · <kbd>H</kbd> perf HUD · <a href="/world?perf=90&amp;debug=1">run the flythrough</a>
      </p>
    </aside>
  );
}
