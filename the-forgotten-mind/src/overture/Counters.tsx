'use client';

import { useEffect, useRef } from 'react';
import styles from './counters.module.css';

/**
 * The scale of the thing, counted up once when it comes into view.
 *
 * Reduced Motion shows the final values immediately — the rule for every
 * animation in this project is that turning motion off never removes content,
 * and a counter frozen at zero would remove all of it.
 *
 * The count runs on `requestAnimationFrame` writing `textContent`, never through
 * React state: six counters re-rendering sixty times a second for a second and a
 * half is a measurable cost for a purely decorative effect.
 */

export interface Count {
  readonly value: number;
  readonly label: string;
  /** Shown instead of the number when the real figure is not authored yet. */
  readonly pending?: boolean;
}

const DURATION = 1400;
const ease = (t: number): number => 1 - (1 - t) ** 3;

export function Counters({ counts }: { counts: readonly Count[] }) {
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const node = list.current;
    if (!node) return;

    const values = [...node.querySelectorAll<HTMLElement>('[data-count]')];
    const settle = () => {
      for (const element of values) element.textContent = element.dataset.count ?? '0';
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settle();
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          for (const element of values) {
            const target = Number(element.dataset.count ?? 0);
            element.textContent = String(Math.round(target * ease(t)));
          }
          if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.14 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ul className={styles.counts} role="list" ref={list}>
      {counts.map((count) => (
        <li key={count.label}>
          <b>
            {count.pending ? (
              <span className={styles.pending}>—</span>
            ) : (
              <span data-count={count.value}>0</span>
            )}
          </b>
          <span>{count.label}</span>
        </li>
      ))}
    </ul>
  );
}
