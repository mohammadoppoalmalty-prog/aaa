/**
 * The save system — GDD Part 5, STANDARDS 3.7.
 *
 * Three decisions here are load-bearing:
 *
 * — **The save is versioned and migrated, not validated-or-discarded.** A visitor
 *   who returns after a deploy must not lose an hour of exploration because a
 *   field was added. `migrate` accepts anything, repairs what it can, and only
 *   falls back to a fresh save when the data is unreadable.
 * — **It lives in `localStorage`, so progress never depends on a network.**
 * — **It is written on `visibilitychange` and `pagehide`, never `beforeunload`.**
 *   `beforeunload` is unreliable on mobile Safari and blocks the back/forward
 *   cache; using it is how "I lost my progress when I switched apps" happens.
 */

export const SAVE_VERSION = 1;
const STORAGE_KEY = 'tfm.save.v1';

export type PuzzleState = 'unsolved' | 'in-progress' | 'solved' | 'skipped';

export interface Save {
  readonly version: number;
  /** Seeds weather and the dynamic-event table, so a session is reproducible. */
  readonly seed: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly playtimeMs: number;
  /** Recovered memory ids. The Reveal Contract is this array. */
  readonly memories: readonly string[];
  /** True once the visitor took the skip path — every entry is readable. */
  readonly revealedAll: boolean;
  readonly area: string;
  readonly position: readonly [number, number, number];
  readonly yaw: number;
  readonly luma: { readonly stage: number; readonly turns: readonly string[] };
  /** Whether the cat is following. It does nothing, and it is remembered. */
  readonly hasCat: boolean;
  readonly puzzles: Readonly<Record<string, PuzzleState>>;
}

/* The schema is written by hand rather than in zod, deliberately.
   The content layer uses zod because its schemas are large, authored by a human
   in MDX, and validated at build time where bundle size is free. This one is
   ten fields read from `localStorage` on the Codex's critical path — and zod
   costs more gzipped than the Codex's entire JavaScript budget allows (GDD Part
   12: ≤ 20 KB). Coercion here is a dozen lines and ships nothing. */

const PUZZLE_STATES: readonly PuzzleState[] = ['unsolved', 'in-progress', 'solved', 'skipped'];

const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const str = (value: unknown, fallback: string): string => (typeof value === 'string' ? value : fallback);

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

const vector3 = (value: unknown, fallback: readonly [number, number, number]): [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every((v) => typeof v === 'number' && Number.isFinite(v))
    ? [value[0] as number, value[1] as number, value[2] as number]
    : [...fallback];

function puzzles(value: unknown): Record<string, PuzzleState> {
  if (typeof value !== 'object' || value === null) return {};
  const out: Record<string, PuzzleState> = {};
  for (const [id, state] of Object.entries(value as Record<string, unknown>)) {
    if (typeof state === 'string' && (PUZZLE_STATES as readonly string[]).includes(state)) {
      out[id] = state as PuzzleState;
    }
  }
  return out;
}

export function freshSave(now = Date.now()): Save {
  return {
    version: SAVE_VERSION,
    seed: Math.floor(Math.random() * 2 ** 31),
    createdAt: now,
    updatedAt: now,
    playtimeMs: 0,
    memories: [],
    revealedAll: false,
    area: 'gate',
    position: [0, 1.5, 4],
    yaw: 0,
    luma: { stage: 0, turns: [] },
    hasCat: false,
    puzzles: {},
  };
}

/** Coerces any record into a valid save, field by field, with no throw path. */
function coerce(record: Record<string, unknown>, now = Date.now()): Save {
  const base = freshSave(now);
  const luma = typeof record.luma === 'object' && record.luma !== null ? (record.luma as Record<string, unknown>) : {};
  return {
    version: SAVE_VERSION,
    seed: Math.max(0, Math.floor(num(record.seed, base.seed))),
    createdAt: Math.floor(num(record.createdAt, base.createdAt)),
    updatedAt: Math.floor(num(record.updatedAt, now)),
    playtimeMs: Math.max(0, Math.floor(num(record.playtimeMs, 0))),
    memories: strings(record.memories),
    revealedAll: record.revealedAll === true,
    area: str(record.area, base.area),
    position: vector3(record.position, base.position),
    yaw: num(record.yaw, 0),
    luma: {
      stage: Math.min(5, Math.max(0, Math.floor(num(luma.stage, 0)))),
      turns: strings(luma.turns),
    },
    hasCat: record.hasCat === true,
    puzzles: puzzles(record.puzzles),
  };
}

/**
 * Accepts any shape a previous build might have written and returns a valid
 * save. Unknown fields are dropped; missing fields take their defaults; a save
 * from a future version is refused rather than mangled.
 */
export function migrate(raw: unknown): { save: Save; migrated: boolean } {
  if (typeof raw !== 'object' || raw === null) return { save: freshSave(), migrated: false };

  const record = raw as Record<string, unknown>;
  const version = typeof record.version === 'number' ? record.version : 0;

  if (version > SAVE_VERSION) {
    // Written by a newer build — refusing is safer than guessing at its shape.
    return { save: freshSave(), migrated: false };
  }

  /* Coercion cannot fail: each field is either readable or replaced by its
     default. That is the behaviour a save wants — losing a camera angle must
     never cost a visitor their memories, which are the only part they would
     actually mourn. */
  const candidate = version === SAVE_VERSION ? record : upgrade(record, version);
  return { save: coerce(candidate), migrated: version !== SAVE_VERSION };
}

/** Version-by-version upgrades. Each step takes the shape to the next version. */
function upgrade(record: Record<string, unknown>, from: number): Record<string, unknown> {
  let working = record;
  if (from < 1) {
    /* v0 (the prototype) stored a memory *count*, which cannot be mapped back
       to ids. Playtime and position survive; the grid re-locks. Stating that
       here is better than silently unlocking the wrong entries. */
    const { memoryCount: _count, ...rest } = working;
    working = { ...rest, memories: [] };
  }
  return working;
}

/* ── persistence ────────────────────────────────────────────────────────── */

export function readSave(): Save | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw)).save;
  } catch {
    return null;
  }
}

export function writeSave(save: Save): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...save, updatedAt: Date.now() }));
  } catch {
    /* Private mode or a full quota. The session continues; it just will not be
       there next time, which is better than throwing mid-gameplay. */
  }
}

export function clearSave(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing to do — the save was already unreachable. */
  }
}

export const hasSave = (): boolean => readSave() !== null;

/* ── the save code ──────────────────────────────────────────────────────
   A visitor can carry progress between devices without an account. Base64url
   of the JSON: not secret, not tamper-proof, and it does not need to be —
   the worst a forged code can do is unlock a portfolio that is public anyway. */

export function encodeSaveCode(save: Save): string {
  const json = JSON.stringify(save);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSaveCode(code: string): Save | null {
  try {
    const padded = code.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return migrate(JSON.parse(new TextDecoder().decode(bytes))).save;
  } catch {
    return null;
  }
}
