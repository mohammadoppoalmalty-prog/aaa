'use client';

import { useEffect, useRef } from 'react';
import { tokens } from '@/generated/tokens';
import styles from './ridge.module.css';

/**
 * The hero's ambient image.
 *
 * GDD Part 8 specifies a fourteen-second loop captured from the real Memory
 * Forest — footage that cannot exist until the world does. What ships now is the
 * procedural canvas that was always designed to sit *beneath* that video as its
 * permanent fallback for Reduced Motion, `Save-Data`, and decode failure. It is
 * not a placeholder for the video; it is the thing the video will fail back to,
 * built first so it is never the rushed part.
 *
 * A light sweep crosses the ridges every thirteen seconds. Reduced Motion paints
 * one frame and stops — a still image, not an empty box.
 */

const LAYERS = 5;

export function Ridge() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    const context = node?.getContext('2d');
    if (!node || !context) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      width = node.clientWidth;
      height = node.clientHeight;
      node.width = Math.round(width * ratio);
      node.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    /* Deterministic ridges: the same silhouette every visit, so the page has a
       shape people can recognise rather than a new one each load. */
    const ridge = (seed: number, y: number, amplitude: number): number[] => {
      const points: number[] = [];
      for (let x = 0; x <= 64; x += 1) {
        const t = x / 64;
        points.push(
          y +
            Math.sin(t * 6.1 + seed) * amplitude +
            Math.sin(t * 13.7 + seed * 2.3) * amplitude * 0.36 +
            Math.sin(t * 27.3 + seed * 5.1) * amplitude * 0.14,
        );
      }
      return points;
    };

    const paint = (time: number) => {
      context.clearRect(0, 0, width, height);

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, tokens.semantic.color.canvas.hex);
      sky.addColorStop(1, tokens.semantic.color['canvas-raised'].hex);
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      // The sweep: one slow band of light crossing the ridges, 13s per pass.
      const sweep = reduced ? 0.42 : ((time / 13000) % 1);

      for (let layer = 0; layer < LAYERS; layer += 1) {
        const depth = layer / (LAYERS - 1);
        const points = ridge(layer * 3.7, height * (0.46 + depth * 0.28), height * (0.1 - depth * 0.012));

        context.beginPath();
        context.moveTo(0, height);
        points.forEach((y, index) => context.lineTo((index / 64) * width, y));
        context.lineTo(width, height);
        context.closePath();

        const lit = Math.max(0, 1 - Math.abs(sweep - depth) * 3.4);
        const fill = context.createLinearGradient(0, height * 0.4, 0, height);
        fill.addColorStop(0, mix(tokens.semantic.color['accent-alt'].hex, 0.05 + lit * 0.14));
        fill.addColorStop(1, mix(tokens.semantic.color.canvas.hex, 0.9));
        context.fillStyle = fill;
        context.fill();

        context.strokeStyle = mix(tokens.semantic.color.accent.hex, 0.08 + lit * 0.5);
        context.lineWidth = 1;
        context.stroke();
      }
    };

    const loop = (time: number) => {
      paint(time);
      frame = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) paint(0);
    else frame = requestAnimationFrame(loop);

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas className={styles.ridge} ref={canvas} aria-hidden="true" />;
}

/** Hex → rgba, so the canvas can read the same palette the CSS does. */
function mix(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
