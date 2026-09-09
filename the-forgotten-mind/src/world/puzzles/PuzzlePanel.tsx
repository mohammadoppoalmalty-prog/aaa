'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  nextHint,
  shouldOfferSkip,
  registry,
  type AttemptState,
  type PuzzleDefinition,
} from '../systems/puzzles/framework';
import { game, useGame } from '@/state/game';
import styles from './puzzle.module.css';

/**
 * The sheet every puzzle is played on.
 *
 * Sixteen puzzles, one shell. What the shell owns is everything that is the
 * same in all of them and easy to get subtly wrong in each: the dialog and its
 * focus, the live region that announces what changed, the escalating hints, the
 * skip policy, and paying out the rewards exactly once. What each board owns is
 *  only its own controls.
 *
 * The board is handed `state` and an `act` function and nothing else. It cannot
 * reach the store, so it cannot pay itself out twice or forget to.
 */

export interface BoardProps<State, Input> {
  readonly state: State;
  readonly act: (input: Input) => void;
  readonly solved: boolean;
  /** Say what just happened. It reaches the player through the live region. */
  readonly announce: (message: string) => void;
}

export type Board<State, Input> = (props: BoardProps<State, Input>) => ReactNode;

export function PuzzlePanel<State, Input>({
  id,
  board: BoardView,
  onClose,
}: {
  id: string;
  board: Board<State, Input>;
  onClose: () => void;
}) {
  const seed = useGame((s) => s.save.seed);
  const puzzle = registry.get(id) as PuzzleDefinition<State, Input> | undefined;

  const [state, setState] = useState<State | null>(() => puzzle?.initial(seed) ?? null);
  const [hintsTaken, setHintsTaken] = useState(0);
  const [message, setMessage] = useState('');
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const sheet = useRef<HTMLDivElement>(null);

  /* One tick a second, only while unsolved. The skip offer is the only thing
     in this panel that depends on the clock, and it is measured in minutes —
     polling faster would spend a frame budget on a number nobody reads. */
  const solved = useMemo(
    () => (puzzle && state !== null ? puzzle.validate(state) : false),
    [puzzle, state],
  );

  useEffect(() => {
    if (solved) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [solved]);

  // The sheet takes focus on open, so the keyboard lands inside the puzzle.
  useEffect(() => {
    sheet.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Paid out here and nowhere else. `completePuzzle` is itself idempotent, but
     a puzzle that only *looks* solved-once because two call sites happen not to
     overlap is a bug waiting for a refactor. */
  useEffect(() => {
    if (solved) game().completePuzzle(id, 'solved');
  }, [solved, id]);

  if (!puzzle || state === null) return null;

  const attempt: AttemptState = {
    elapsedMs: now - openedAt,
    solved,
    skipped: false,
    hintsTaken,
  };

  /* GDD Part 8 puts the skip three minutes in. It also arrives the moment a
     player has taken every hint and is still stuck — at that point the game has
     said everything it has to say, and making them wait out a timer is just
     the game being slow to admit it. */
  const takenEveryHint = hintsTaken >= puzzle.hints.length;
  const offerSkip = !solved && (shouldOfferSkip(attempt) || takenEveryHint);
  const hint = hintsTaken > 0 ? nextHint(puzzle, { ...attempt, hintsTaken: hintsTaken - 1 }) : null;

  const act = (input: Input) => {
    setState((current) => (current === null ? current : puzzle.apply(current, input)));
  };

  return (
    <div className={styles.scrim} role="dialog" aria-modal="true" aria-label={puzzle.title}>
      <div className={styles.sheet} ref={sheet} tabIndex={-1}>
        <p className={styles.head}>
          {puzzle.title}
          <span>{solved ? 'solved' : 'unsolved'}</span>
        </p>

        <p className={styles.premise}>{puzzle.premise}</p>

        <div className={styles.board}>
          <BoardView state={state} act={act} solved={solved} announce={setMessage} />
        </div>

        {/* Every board's changes are narrated here rather than sixteen times. */}
        <p role="status" aria-live="polite" className={styles.note}>
          {solved ? 'Solved.' : message}
        </p>

        {hint ? <p className={styles.hint}>{hint}</p> : null}

        {solved ? <p className={styles.solved}>{puzzle.solvedLine}</p> : null}

        <div className={styles.actions}>
          {!solved && hintsTaken < puzzle.hints.length ? (
            <button type="button" onClick={() => setHintsTaken((taken) => taken + 1)}>
              {hintsTaken === 0 ? 'Ask LUMA' : 'Ask again'}
            </button>
          ) : null}

          {offerSkip ? (
            <button
              type="button"
              onClick={() => {
                setState((current) => (current === null ? current : puzzle.solve(current)));
                game().completePuzzle(id, 'skipped');
                setMessage('Solved for you. It counts the same.');
              }}
            >
              Solve it for me
            </button>
          ) : null}

          <button type="button" onClick={onClose}>
            Stand up
          </button>
        </div>
      </div>
    </div>
  );
}
