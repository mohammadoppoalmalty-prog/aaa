'use client';

import { useEffect } from 'react';

/**
 * The page heals as you scroll.
 *
 * One custom property, `--r`, runs 0 → 1 with scroll progress and drives the
 * ground colour, the warmth of the type, the accent hue and the rail down the
 * left edge — the same mechanism as `uRestoration` in the world, executed in
 * CSS. The visitor performs the game's central mechanic before they enter it,
 * and by the time they reach the doors the page has gone from cold to warm.
 *
 * This is the only place in the project where a scroll position means anything.
 *
 * It writes a CSS variable from a passive scroll listener on an animation frame,
 * so it never lays out or reads geometry per event — and Reduced Motion pins it
 * at 1, showing the healed page immediately rather than an unhealed one that
 * never changes.
 */
export function Restoration() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reduced.matches) {
      root.style.setProperty('--r', '1');
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress = height <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / height));
      root.style.setProperty('--r', progress.toFixed(3));
    };

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      root.style.removeProperty('--r');
    };
  }, []);

  return null;
}
