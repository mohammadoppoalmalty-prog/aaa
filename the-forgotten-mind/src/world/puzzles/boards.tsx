'use client';

import { useState } from 'react';
import type { Board } from './PuzzlePanel';
import { cls } from '@/lib/css';
import styles from './puzzle.module.css';
import {
  DIALS,
  GRID_REFLECTION,

  LAMP_COUNT,
  MODULUS,
  PHRASE_LENGTH,
  STAR_COUNT,
  STONE_COUNT,
  TEETH,
  trace,
  type AltarInput,
  type AltarState,
  type AssemblyInput,
  type AssemblyState,
  type AtticInput,
  type AtticState,
  type BenchInput,
  type BenchState,
  type BootInput,
  type BootState,
  type BridgeInput,
  type BridgeState,
  type ChamberInput,
  type CircuitInput,
  type CircuitState,
  type ConstellationInput,
  type ConstellationState,
  type EchoChamberState,
  type EngineInput,
  type EngineState,
  type RailInput,
  type RailState,
  type ReflectionInput,
  type ReflectionState,
  type ShelfInput,
  type ShelfState,
} from '../systems/puzzles';

/**
 * The boards.
 *
 * Every one of them is DOM rather than geometry, for the reason the Fountain
 * already gives: a grid of buttons is something a browser does with real focus
 * order, real labels and real keyboard support, and rebuilding that in WebGL
 * costs a week and loses all three. The world is where you *find* a puzzle; the
 * sheet is where you operate it.
 *
 * Each board therefore owes one thing the visuals do not carry: a label that
 * says what a control is and what state it is in, so every puzzle in the game
 * can be finished without seeing it.
 */

/* ── the Childhood Home ──────────────────────────────────────────────── */

export const AtticBoard: Board<AtticState, AtticInput> = ({ state, act, announce }) => (
  <ol className={styles.stack}>
    {state.boxes.map((box, index) => (
      <li key={box.id} className={styles.line}>
        <strong>{box.year}</strong>
        <span className={styles.grow}>{box.label}</span>
        {index < state.boxes.length - 1 ? (
          <button
            type="button"
            className={styles.tile}
            aria-label={`Swap ${box.year} ${box.label} with ${state.boxes[index + 1]!.year} ${state.boxes[index + 1]!.label}`}
            onClick={() => {
              act({ kind: 'swap', at: index });
              announce(`${box.year} and ${state.boxes[index + 1]!.year} swapped.`);
            }}
          >
            swap ↓
          </button>
        ) : null}
      </li>
    ))}
  </ol>
);

/* ── the Learning Workshop ───────────────────────────────────────────── */

export const BenchBoard: Board<BenchState, BenchInput> = ({ state, act, announce }) => {
  const [held, setHeld] = useState<number | null>(null);

  return (
    <div className={styles.columns}>
      <div className={styles.column}>
        <p className={styles.label}>The bench</p>
        {state.sockets.map((socket) => {
          const tool = state.tools.find((candidate) => candidate.id === socket.tool);
          return (
            <button
              key={socket.id}
              type="button"
              className={cls(styles.tile, tool?.shape === socket.shape && styles.on)}
              aria-label={`${socket.shape} socket, ${tool ? `holding ${tool.name}` : 'empty'}${held !== null ? '. Hang the held tool here' : ''}`}
              onClick={() => {
                if (held !== null) {
                  act({ kind: 'hang', tool: held, socket: socket.id });
                  announce(`Hung in the ${socket.shape} socket.`);
                  setHeld(null);
                } else if (socket.tool !== null) {
                  act({ kind: 'take', socket: socket.id });
                  announce(`Took the tool from the ${socket.shape} socket.`);
                }
              }}
            >
              {socket.shape} · {tool ? tool.shape : '—'}
            </button>
          );
        })}
      </div>

      <div className={styles.column}>
        <p className={styles.label}>On the floor</p>
        {state.loose.length === 0 ? <p className={styles.note}>Nothing left down here.</p> : null}
        {state.loose.map((id) => {
          const tool = state.tools.find((candidate) => candidate.id === id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={held === id}
              className={cls(styles.tile, held === id && styles.picked)}
              aria-label={`${tool?.name ?? 'a tool'}, ${tool?.shape} shank`}
              onClick={() => setHeld(held === id ? null : id)}
            >
              {tool?.shape}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── the Innovation Laboratory ───────────────────────────────────────── */

export const CircuitBoard: Board<CircuitState, CircuitInput> = ({ state, act, announce }) => (
  <div className={styles.row} role="group" aria-label={`${LAMP_COUNT} lamps`}>
    {state.lamps.map((lit, index) => (
      <button
        key={index}
        type="button"
        className={cls(styles.tile, lit && styles.on)}
        aria-label={`Switch ${index + 1}, lamp ${lit ? 'lit' : 'dark'}. Flips itself and its neighbours`}
        onClick={() => {
          act({ kind: 'press', at: index });
          announce(`Pressed ${index + 1}.`);
        }}
      >
        {lit ? '●' : '○'}
      </button>
    ))}
  </div>
);

/* ── the Developer Studio ────────────────────────────────────────────── */

export const BootBoard: Board<BootState, BootInput> = ({ state, act, announce }) => (
  <ol className={styles.stack}>
    {state.order.map((id, index) => {
      const step = state.steps.find((candidate) => candidate.id === id);
      const needs = step?.needs ?? [];
      const met = needs.every((need) => state.order.indexOf(need) < index);
      return (
        <li key={id} className={cls(styles.line, met && styles.on)}>
          <strong>{index + 1}</strong>
          <span className={styles.grow}>
            {step?.name}
            {needs.length > 0
              ? ` — after ${needs.map((need) => state.steps.find((s) => s.id === need)?.name).join(', ')}`
              : ' — needs nothing'}
          </span>
          <button
            type="button"
            className={styles.tile}
            disabled={index === 0}
            aria-label={`Move ${step?.name} earlier`}
            onClick={() => {
              act({ kind: 'move', from: index, to: index - 1 });
              announce(`${step?.name} moved earlier.`);
            }}
          >
            ↑
          </button>
          <button
            type="button"
            className={styles.tile}
            disabled={index === state.order.length - 1}
            aria-label={`Move ${step?.name} later`}
            onClick={() => {
              act({ kind: 'move', from: index, to: index + 1 });
              announce(`${step?.name} moved later.`);
            }}
          >
            ↓
          </button>
        </li>
      );
    })}
  </ol>
);

/* ── the Knowledge Library ───────────────────────────────────────────── */

export const ShelfBoard: Board<ShelfState, ShelfInput> = ({ state, act, announce }) => {
  const [held, setHeld] = useState<number | null>(null);

  return (
    <div className={styles.columns}>
      {state.shelves.map((shelf, index) => {
        const subjects = new Set(
          shelf.map((id) => state.books.find((book) => book.id === id)?.subject),
        );
        return (
          <div key={index} className={styles.column}>
            <p className={styles.label}>Shelf {index + 1}</p>
            {shelf.map((id) => {
              const book = state.books.find((candidate) => candidate.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={held === id}
                  className={cls(styles.tile, held === id && styles.picked, subjects.size === 1 && styles.on)}
                  aria-label={`${book?.title}, on shelf ${index + 1}`}
                  onClick={() => setHeld(held === id ? null : id)}
                >
                  {book?.subject}
                </button>
              );
            })}
            <button
              type="button"
              className={styles.tile}
              disabled={held === null}
              aria-label={`Move the held book to shelf ${index + 1}`}
              onClick={() => {
                if (held === null) return;
                act({ kind: 'move', book: held, to: index });
                announce(`Moved to shelf ${index + 1}.`);
                setHeld(null);
              }}
            >
              put here
            </button>
          </div>
        );
      })}
    </div>
  );
};

/* ── the Experience Archive ──────────────────────────────────────────── */

export const RailBoard: Board<RailState, RailInput> = ({ state, act, announce }) => (
  <div
    className={styles.grid}
    style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
    role="group"
    aria-label="Nine slots, three by three"
  >
    {state.plates.map((plate, index) => (
      <button
        key={index}
        type="button"
        className={cls(styles.tile, plate === (index + 1) % 9 && plate !== 0 && styles.on)}
        aria-label={
          plate === 0
            ? `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}: the gap`
            : `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}: plate ${plate}`
        }
        onClick={() => {
          act({ kind: 'slide', at: index });
          announce(plate === 0 ? 'That is the gap.' : `Plate ${plate} slid.`);
        }}
      >
        {plate === 0 ? '·' : plate}
      </button>
    ))}
  </div>
);

/* ── Crystal Lake ────────────────────────────────────────────────────── */

export const ReflectionBoard: Board<ReflectionState, ReflectionInput> = ({ state, act, announce }) => {
  const exit = trace(state);

  return (
    <>
      <p className={styles.note}>
        The beam enters on row {state.entry + 1} and the crystal sits on row {state.target + 1}. It
        currently leaves {exit === null ? 'nowhere — it dies on the water' : `on row ${exit + 1}`}.
      </p>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${GRID_REFLECTION}, 1fr)` }}
        role="group"
        aria-label="The lake, five by five"
      >
        {Array.from({ length: GRID_REFLECTION * GRID_REFLECTION }, (_, cell) => {
          const x = cell % GRID_REFLECTION;
          const y = Math.floor(cell / GRID_REFLECTION);
          const mirror = state.mirrors.find((candidate) => candidate.x === x && candidate.y === y);
          if (!mirror) {
            return (
              <span key={cell} className={styles.tile} aria-hidden="true">
                ·
              </span>
            );
          }
          return (
            <button
              key={cell}
              type="button"
              className={styles.tile}
              aria-label={`Mirror at row ${y + 1}, column ${x + 1}, lying ${mirror.tilt === 'nesw' ? 'north-east to south-west' : 'north-west to south-east'}`}
              onClick={() => {
                act({ kind: 'turn', x, y });
                announce(`Turned the mirror at row ${y + 1}, column ${x + 1}.`);
              }}
            >
              {mirror.tilt === 'nesw' ? '/' : '\\'}
            </button>
          );
        })}
      </div>
    </>
  );
};

/* ── the Underground Cave ────────────────────────────────────────────── */

export const ChamberBoard: Board<EchoChamberState, ChamberInput> = ({ state, act, announce }) => (
  <>
    <p className={styles.note}>
      {state.struck.length} of {PHRASE_LENGTH} struck back.
    </p>
    <div className={styles.row} role="group" aria-label={`${STONE_COUNT} stones`}>
      {Array.from({ length: STONE_COUNT }, (_, stone) => (
        <button
          key={stone}
          type="button"
          className={styles.tile}
          aria-label={`Strike stone ${stone + 1}`}
          onClick={() => {
            act({ kind: 'strike', stone });
            announce(`Struck ${stone + 1}.`);
          }}
        >
          {stone + 1}
        </button>
      ))}
    </div>
    <div className={styles.row}>
      <button
        type="button"
        className={styles.tile}
        onClick={() => {
          act({ kind: 'listen' });
          announce(`The cave answers: ${state.phrase.map((stone) => stone + 1).join(', ')}.`);
        }}
      >
        Listen again
      </button>
    </div>
  </>
);

/* ── the Ancient Temple ──────────────────────────────────────────────── */

export const AltarBoard: Board<AltarState, AltarInput> = ({ state, act, announce }) => (
  <div className={styles.stack}>
    {state.rings.map((position, ring) => (
      <div key={ring} className={cls(styles.line, position === 0 && styles.on)}>
        <strong>Ring {ring + 1}</strong>
        <span className={styles.grow}>
          notch at {position} of {TEETH}
          {position === 0 ? ' — aligned' : ''}
        </span>
        <button
          type="button"
          className={styles.tile}
          aria-label={`Turn ring ${ring + 1}. It moves the others by ${(state.coupling[ring] ?? []).join(', ')}`}
          onClick={() => {
            act({ kind: 'turn', ring });
            announce(`Turned ring ${ring + 1}.`);
          }}
        >
          turn
        </button>
      </div>
    ))}
  </div>
);

/* ── the Floating Islands ────────────────────────────────────────────── */

export const BridgeBoard: Board<BridgeState, BridgeInput> = ({ state, act, announce }) => (
  <>
    <p className={styles.note}>
      The near shore is at {state.start}; the far shore is at {state.end}.
    </p>
    <div className={styles.stack}>
      {state.islands.map((island, index) => {
        const before = index === 0 ? state.start : state.islands[index - 1]!.height;
        const reachable = Math.abs(island.height - before) <= 1;
        return (
          <div key={island.id} className={cls(styles.line, reachable && styles.on)}>
            <strong>{index + 1}</strong>
            <span className={styles.grow}>
              at {island.height} · moves between {island.min} and {island.max}
              {reachable ? '' : ' · too far from the last one'}
            </span>
            <button
              type="button"
              className={styles.tile}
              disabled={island.height >= island.max}
              aria-label={`Raise island ${index + 1} from ${island.height}`}
              onClick={() => {
                act({ kind: 'shift', island: island.id, by: 1 });
                announce(`Island ${index + 1} raised.`);
              }}
            >
              ↑
            </button>
            <button
              type="button"
              className={styles.tile}
              disabled={island.height <= island.min}
              aria-label={`Lower island ${index + 1} from ${island.height}`}
              onClick={() => {
                act({ kind: 'shift', island: island.id, by: -1 });
                announce(`Island ${index + 1} lowered.`);
              }}
            >
              ↓
            </button>
          </div>
        );
      })}
    </div>
  </>
);

/* ── the Dream Observatory ───────────────────────────────────────────── */

export const ConstellationBoard: Board<ConstellationState, ConstellationInput> = ({
  state,
  act,
  announce,
}) => (
  <>
    <p className={styles.note}>
      {state.traced.length} of {STAR_COUNT} traced. Faintest first.
    </p>
    <div className={styles.row} role="group" aria-label="The sky">
      {state.stars.map((star) => {
        const order = state.traced.indexOf(star.id);
        return (
          <button
            key={star.id}
            type="button"
            className={cls(styles.tile, order !== -1 && styles.on)}
            style={{ opacity: 0.35 + star.brightness * 0.65 }}
            /* The number is in the label on purpose. A player who cannot see the
               glow cannot compare two of them, and the alternative to saying it
               out loud is an observatory they are locked out of. */
            aria-label={`Star at ${Math.round(star.x * 100)} across, ${Math.round(star.y * 100)} up. Brightness ${Math.round(star.brightness * 100)}${order === -1 ? '' : `. Traced ${order + 1}`}`}
            onClick={() => {
              act({ kind: 'trace', star: star.id });
              announce(`Traced a star of brightness ${Math.round(star.brightness * 100)}.`);
            }}
          >
            ✦
          </button>
        );
      })}
    </div>
    <div className={styles.row}>
      <button
        type="button"
        className={styles.tile}
        onClick={() => {
          act({ kind: 'clear' });
          announce('Cleared.');
        }}
      >
        Start again
      </button>
    </div>
  </>
);

/* ── the Sky Bridge ──────────────────────────────────────────────────── */

export const AssemblyBoard: Board<AssemblyState, AssemblyInput> = ({ state, act, announce }) => {
  const [held, setHeld] = useState<number | null>(null);

  return (
    <div className={styles.columns}>
      {state.sections.map((needed, section) => {
        const laid = state.spans.filter((span) => span.section === section);
        const total = laid.reduce((sum, span) => sum + span.length, 0);
        return (
          <div key={section} className={styles.column}>
            <p className={styles.label}>
              Section {section + 1} · {total} of {needed}
            </p>
            {laid.map((span) => (
              <button
                key={span.id}
                type="button"
                className={cls(styles.tile, total === needed && styles.on)}
                aria-label={`A span of ${span.length}, laid in section ${section + 1}. Lift it`}
                onClick={() => {
                  act({ kind: 'lift', span: span.id });
                  announce(`Lifted a span of ${span.length}.`);
                }}
              >
                {span.length}
              </button>
            ))}
            <button
              type="button"
              className={styles.tile}
              disabled={held === null}
              aria-label={`Lay the held span in section ${section + 1}`}
              onClick={() => {
                if (held === null) return;
                act({ kind: 'lay', span: held, section });
                announce(`Laid in section ${section + 1}.`);
                setHeld(null);
              }}
            >
              lay here
            </button>
          </div>
        );
      })}

      <div className={styles.column}>
        <p className={styles.label}>The pile</p>
        {state.spans.filter((span) => span.section === null).length === 0 ? (
          <p className={styles.note}>Empty.</p>
        ) : null}
        {state.spans
          .filter((span) => span.section === null)
          .map((span) => (
            <button
              key={span.id}
              type="button"
              aria-pressed={held === span.id}
              className={cls(styles.tile, held === span.id && styles.picked)}
              aria-label={`A span of ${span.length}, in the pile`}
              onClick={() => setHeld(held === span.id ? null : span.id)}
            >
              {span.length}
            </button>
          ))}
      </div>
    </div>
  );
};

/* ── the Contact Tower ───────────────────────────────────────────────── */

export const EngineBoard: Board<EngineState, EngineInput> = ({ state, act, announce }) => (
  <>
    <div className={styles.stack}>
      {state.constraints.map((rule) => (
        <p key={rule.dial} className={styles.line}>
          <strong>Dial {rule.dial + 1}</strong>
          <span className={styles.grow}>
            = {rule.from.map((dial) => `dial ${dial + 1}`).join(' + ')} + {rule.plus}, wrapping at{' '}
            {MODULUS}
          </span>
        </p>
      ))}
    </div>

    <div className={styles.row} role="group" aria-label={`${DIALS} dials`}>
      {state.dials.map((value, dial) => {
        const rule = state.constraints.find((candidate) => candidate.dial === dial);
        const met =
          rule === undefined ||
          value ===
            (rule.from.reduce((sum, from) => sum + (state.dials[from] ?? 0), 0) + rule.plus) % MODULUS;
        return (
          <button
            key={dial}
            type="button"
            className={cls(styles.tile, met && styles.on)}
            aria-label={`Dial ${dial + 1}, reading ${value}${met ? ', agreeing' : ', disagreeing'}. Turn it up`}
            onClick={() => {
              act({ kind: 'set', dial, to: (value + 1) % MODULUS });
              announce(`Dial ${dial + 1} now reads ${(value + 1) % MODULUS}.`);
            }}
          >
            {dial + 1}: {value}
          </button>
        );
      })}
    </div>
  </>
);

/* ── which board belongs to which puzzle ─────────────────────────────── */

/* Typed loosely on purpose. Each board is exact about its own state; the map
   from thirteen different state types to one lookup cannot be, and pretending
   otherwise costs a generic parameter on every call site to buy nothing. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BOARDS: Readonly<Record<string, Board<any, any>>> = {
  'attic-order': AtticBoard,
  'tool-bench': BenchBoard,
  'circuit-table': CircuitBoard,
  'workstation-boot': BootBoard,
  'shelf-order': ShelfBoard,
  'journal-rail': RailBoard,
  'light-reflection': ReflectionBoard,
  'echo-chamber': ChamberBoard,
  'mirror-altar': AltarBoard,
  'gravity-bridge': BridgeBoard,
  constellation: ConstellationBoard,
  'bridge-assembly': AssemblyBoard,
  'core-engine': EngineBoard,
};

