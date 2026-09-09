'use client';

import { useMemo, useState } from 'react';
import {
  flow,
  FOUNTAIN_GRID as GRID,
  openingsOf,
  type FountainInput,
  type FountainState,
  type Piece,
} from '../systems/puzzles';
import type { Board } from './PuzzlePanel';
import { cls } from '@/lib/css';
import shared from './puzzle.module.css';
import styles from './fountain.module.css';

/**
 * The Fountain's pipes, as a board on the shared sheet.
 *
 * This was the first puzzle built and it had its own panel, its own skip button
 * and its own stylesheet — written before there was a shell to put it in. Two
 * skip policies in one game is not a style difference, it is a promise made
 * twice with different words, so it now plays on the same sheet as the other
 * fifteen. What stayed behind is the part that is genuinely about pipes: the
 * grid, the glyphs, and the water.
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

export const FountainBoard: Board<FountainState, FountainInput> = ({ state, act, announce }) => {
  const [spare, setSpare] = useState<number | null>(null);
  const { wet } = useMemo(() => flow(state), [state]);

  return (
    <>
      <p className={shared.note}>Route the water from the north-west to the south-east.</p>

      <div className={styles.grid} role="group" aria-label="Pipe grid, five by five">
        {state.cells.map((piece, cell) => {
          const x = (cell % GRID) + 1;
          const y = Math.floor(cell / GRID) + 1;
          const turnable = piece.kind !== 'broken' && piece.kind !== 'empty';
          return (
            <button
              key={cell}
              type="button"
              className={cls(
                styles.cell,
                styles[piece.kind],
                wet.has(cell) && styles.wet,
                turnable && styles.turnable,
              )}
              style={{ '--turn': `${piece.rotation * 90}deg` } as React.CSSProperties}
              aria-label={`Row ${y}, column ${x}: ${describe(piece)}${wet.has(cell) ? ', water reaches it' : ''}`}
              onClick={() => {
                if (piece.kind === 'broken' && spare !== null) {
                  act({ kind: 'place', cell, spare });
                  announce(`Fitted a spare at row ${y}, column ${x}.`);
                  setSpare(null);
                  return;
                }
                act({ kind: 'rotate', cell });
                announce(`Turned the pipe at row ${y}, column ${x}.`);
              }}
            >
              <span aria-hidden="true">{glyphFor(piece)}</span>
            </button>
          );
        })}
      </div>

      <div className={shared.row}>
        <p className={shared.label}>From the cart</p>
        {state.spares.length === 0 ? (
          <p className={shared.note}>Both spares are fitted.</p>
        ) : (
          state.spares.map((kind, index) => (
            <button
              key={index}
              type="button"
              aria-pressed={spare === index}
              className={cls(shared.tile, spare === index && shared.picked)}
              onClick={() => setSpare(spare === index ? null : index)}
            >
              {kind}
            </button>
          ))
        )}
        {spare !== null ? <p className={shared.note}>Now choose a cracked segment.</p> : null}
      </div>
    </>
  );
};

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
