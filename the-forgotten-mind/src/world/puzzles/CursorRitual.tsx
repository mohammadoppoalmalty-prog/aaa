'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cursorRitual, litCount, nextHint, shouldOfferSkip, type RitualState } from '../systems/puzzles';
import { game, useGame } from '@/state/game';
import styles from './cursor-ritual.module.css';

/**
 * The Cursor Ritual, played on a black screen in front of the Gate.
 *
 * It is DOM rather than WebGL on purpose. The whole interaction is a pointer, a
 * circle of light and seven glyphs; rendering it in the engine would cost a
 * scene, a camera and a shader to reproduce something the browser already does
 * perfectly — and it would arrive after the engine bundle, when this is the
 * first thing a visitor is supposed to see.
 *
 * The pointer path is tracked on a ref and written to CSS custom properties, so
 * moving the light costs no React render. Only the seven glyph ignitions do.
 */

export function CursorRitual({ onDone }: { onDone: () => void }) {
  const setPuzzle = useGame((s) => s.setPuzzle);
  const seed = useGame((s) => s.save.seed);

  const [state, setState] = useState<RitualState>(() => cursorRitual.initial(seed));
  const [hint, setHint] = useState<string | null>(null);
  const [canSkip, setCanSkip] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const started = useRef(Date.now());
  const solved = cursorRitual.validate(state);

  /* Keyboard completability is not optional (GDD Part 7): arrow keys move the
     light at the same radius, so this screen is not a wall for anyone who does
     not use a pointer. */
  const light = useRef({ x: 0.5, y: 0.5 });

  const move = useCallback((x: number, y: number) => {
    light.current = { x, y };
    const node = stage.current;
    if (node) {
      node.style.setProperty('--x', `${x * 100}%`);
      node.style.setProperty('--y', `${y * 100}%`);
    }
    setState((previous) => {
      const next = cursorRitual.apply(previous, { x, y });
      return next === previous ? previous : next;
    });
  }, []);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const node = stage.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      move((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
    };

    const onKey = (event: KeyboardEvent) => {
      const step = 0.04;
      const { x, y } = light.current;
      switch (event.code) {
        case 'ArrowLeft': move(Math.max(0, x - step), y); break;
        case 'ArrowRight': move(Math.min(1, x + step), y); break;
        case 'ArrowUp': move(x, Math.max(0, y - step)); break;
        case 'ArrowDown': move(x, Math.min(1, y + step)); break;
        default: return;
      }
      event.preventDefault();
    };

    window.addEventListener('pointermove', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [move]);

  /* The skip offer appears after three minutes, and never sooner. */
  useEffect(() => {
    if (solved) return;
    const id = window.setInterval(() => {
      setCanSkip(
        shouldOfferSkip({ elapsedMs: Date.now() - started.current, solved: false, skipped: false, hintsTaken: 0 }),
      );
    }, 5000);
    return () => window.clearInterval(id);
  }, [solved]);

  useEffect(() => {
    if (!solved) return;
    game().completePuzzle('cursor-ritual', 'solved');
    const id = window.setTimeout(onDone, 1600);
    return () => window.clearTimeout(id);
  }, [solved, onDone]);

  const lit = litCount(state);

  return (
    <div
      className={solved ? `${styles.stage} ${styles.opened}` : styles.stage}
      ref={stage}
      role="application"
      aria-label="The gate. Move the light across it."
    >
      <div className={styles.light} aria-hidden="true" />

      {state.glyphs.map((glyph) => (
        <span
          key={glyph.id}
          className={glyph.lit ? `${styles.glyph} ${styles.lit}` : styles.glyph}
          style={{ left: `${glyph.x * 100}%`, top: `${glyph.y * 100}%` }}
          aria-hidden="true"
        />
      ))}

      {/* The only text on the screen, and it appears late: the light is the
          instruction, and explaining it first would take the discovery away. */}
      <p className={styles.count} aria-live="polite">
        {solved ? 'The gate remembers.' : lit === 0 ? '' : `${lit} / ${state.glyphs.length}`}
      </p>

      {hint ? <p className={styles.hint}>{hint}</p> : null}

      <div className={styles.aside}>
        {!solved && lit > 0 ? (
          <button
            type="button"
            onClick={() => setHint(nextHint(cursorRitual, { elapsedMs: 0, solved, skipped: false, hintsTaken: hint ? 1 : 0 }))}
          >
            I am stuck
          </button>
        ) : null}
        {canSkip && !solved ? (
          <button
            type="button"
            onClick={() => {
              setState(cursorRitual.solve(state));
              setPuzzle('cursor-ritual', 'skipped');
              game().completePuzzle('cursor-ritual', 'skipped');
            }}
          >
            Open it for me
          </button>
        ) : null}
      </div>
    </div>
  );
}
