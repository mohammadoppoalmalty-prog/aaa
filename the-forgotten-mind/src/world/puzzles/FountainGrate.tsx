'use client';

import { useMemo, useState } from 'react';
import {
  flow,
  fountain,
  FOUNTAIN_GRID as GRID,
  openingsOf,
  type FountainState,
  type Piece,
} from '../systems/puzzles';
import { game, useGame } from '@/state/game';
import { cls } from '@/lib/css';
import styles from './fountain.module.css';

/**
 * The Fountain, looked at through the grate in the plaza.
 *
 * The board is DOM, not geometry: it is a 5×5 grid of buttons, and a grid of
 * buttons is something a browser already does with real focus order, real
 * keyboard support and real labels. Rebuilding that in WebGL would cost a week
 * and lose all three.
 *
 * Each cell announces what it is and where its openings point, so the puzzle is
 * solvable without seeing it — which is what "keyboard-completable" has to mean
 * for a puzzle rather than for a corridor.
 */

const SIDE_NAMES = ['north', 'east', 'south', 'west'] as const;

const describe = (piece: Piece): string => {
  if (piece.kind === 'broken') return 'cracked through — needs a spare';
  if (piece.kind === 'empty') return 'no pipe';
  const sides = openingsOf(piece).map((side) => SIDE_NAMES[side]);
  return `${piece.kind}, open ${sides.join(' and ')}`;
};

export function FountainGrate({ onClose }: { onClose: () => void }) {
  const seed = useGame((s) => s.save.seed);
  const [state, setState] = useState<FountainState>(() => fountain.initial(seed));
  const [spare, setSpare] = useState<number | null>(null);

  const { wet, solved } = useMemo(() => flow(state), [state]);

  const finish = (next: FountainState) => {
    setState(next);
    if (fountain.validate(next)) game().completePuzzle('fountain', 'solved');
  };

  return (
    <div className={styles.scrim} role="dialog" aria-modal="true" aria-label="The fountain pipes">
      <div className={styles.sheet}>
        <p className={styles.head}>
          The grate
          <span>{solved ? 'the water is running' : 'route the water from the north-west to the south-east'}</span>
        </p>

        <div className={styles.grid} role="group" aria-label="Pipe grid, five by five">
          {state.cells.map((piece, cell) => {
            const x = (cell % GRID) + 1;
            const y = Math.floor(cell / GRID) + 1;
            return (
              <button
                key={cell}
                type="button"
                className={cls(
                  styles.cell,
                  styles[piece.kind],
                  wet.has(cell) && styles.wet,
                  piece.kind !== 'broken' && piece.kind !== 'empty' && styles.turnable,
                )}
                style={{ '--turn': `${piece.rotation * 90}deg` } as React.CSSProperties}
                aria-label={`Row ${y}, column ${x}: ${describe(piece)}${wet.has(cell) ? ', water reaches it' : ''}`}
                onClick={() => {
                  if (piece.kind === 'broken' && spare !== null) {
                    finish(fountain.apply(state, { kind: 'place', cell, spare }));
                    setSpare(null);
                    return;
                  }
                  finish(fountain.apply(state, { kind: 'rotate', cell }));
                }}
              >
                <span aria-hidden="true">{glyphFor(piece)}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.cart}>
          <p className={styles.label}>From the cart</p>
          {state.spares.length === 0 ? (
            <p className={styles.note}>Both spares are fitted.</p>
          ) : (
            state.spares.map((kind, index) => (
              <button
                key={index}
                type="button"
                aria-pressed={spare === index}
                className={cls(styles.spare, spare === index && styles.picked)}
                onClick={() => setSpare(spare === index ? null : index)}
              >
                {kind}
              </button>
            ))
          )}
          {spare !== null ? <p className={styles.note}>Now choose a cracked segment.</p> : null}
        </div>

        {solved ? (
          <p className={styles.solved}>
            Water. From here the fountain reads the world back to you — its level is how much of him you have
            remembered.
          </p>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => {
              const done = fountain.solve(state);
              setState(done);
              game().completePuzzle('fountain', 'skipped');
            }}
          >
            Solve it for me
          </button>
          <button type="button" onClick={onClose}>
            Stand up
          </button>
        </div>
      </div>
    </div>
  );
}

/* A pipe drawn in text. Crude on purpose — this is the blockout of a puzzle, and
   a board that looks finished stops people saying what is wrong with it. */
function glyphFor(piece: Piece): string {
  switch (piece.kind) {
    case 'straight':
      return piece.rotation % 2 === 0 ? '│' : '─';
    case 'elbow':
      return ['└', '┌', '┐', '┘'][piece.rotation] ?? '└';
    case 'tee':
      return ['├', '┬', '┤', '┴'][piece.rotation] ?? '├';
    case 'cross':
      return '┼';
    case 'broken':
      return '╳';
    default:
      return '·';
  }
}
