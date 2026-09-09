'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { freshSave, readSave, writeSave, clearSave, type PuzzleState, type Save } from './save';
/**
 * Puzzle rewards are *injected*, not imported.
 *
 * The store is shared by both layers, and importing the puzzle registry here
 * would pull every puzzle's logic into the Codex's bundle — a page that never
 * renders a puzzle and has 20 KB of JavaScript to spend in total. The world
 * calls `providePuzzleRewards` when it mounts; the Codex never does, and pays
 * nothing for a system it does not use.
 */
interface PuzzleRewardLookup {
  (id: string): { readonly memories?: readonly string[]; readonly fragment?: boolean } | undefined;
}

let lookupRewards: PuzzleRewardLookup = () => undefined;

export function providePuzzleRewards(lookup: PuzzleRewardLookup): void {
  lookupRewards = lookup;
}

/**
 * Game state, and the Reveal Contract.
 *
 * Recovering a memory in the world permanently unlocks its Codex entry — that
 * is the whole bridge between the two layers, and it is this store. The world
 * writes to it; the Codex reads from it; neither knows about the other.
 *
 * Writes are debounced by two seconds and flushed on `visibilitychange` and
 * `pagehide`, so a tab switch mid-puzzle costs nothing.
 */

export interface GameState {
  save: Save;
  /** False until the browser save has been read — the Codex renders locked until then. */
  hydrated: boolean;

  hydrate: () => void;
  recoverMemory: (id: string) => void;
  forgetMemory: (id: string) => void;
  revealAll: () => void;
  setArea: (area: string) => void;
  setPuzzle: (id: string, state: PuzzleState) => void;
  /**
   * Finish a puzzle and pay out.
   *
   * Skipping grants exactly what solving grants (STANDARDS 3.6). A skip that
   * withholds the reward is a punishment, and a punished exit is not an exit —
   * it is the guilt-trip this project spent its whole design avoiding.
   */
  completePuzzle: (id: string, how: 'solved' | 'skipped') => void;
  beginAgain: () => void;
  replaceSave: (save: Save) => void;

  isUnlocked: (id: string) => boolean;
  /** Core Fragments held, derived from finished puzzles. */
  fragmentsHeld: () => number;
}

const SAVE_DEBOUNCE_MS = 2000;
let pending: number | null = null;

function schedule(get: () => GameState): void {
  if (typeof window === 'undefined') return;
  if (pending !== null) window.clearTimeout(pending);
  pending = window.setTimeout(() => {
    pending = null;
    writeSave(get().save);
  }, SAVE_DEBOUNCE_MS);
}

function flush(get: () => GameState): void {
  if (typeof window === 'undefined') return;
  if (pending !== null) {
    window.clearTimeout(pending);
    pending = null;
  }
  writeSave(get().save);
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    save: freshSave(),
    hydrated: false,

    hydrate: () => {
      if (get().hydrated) return;
      const stored = readSave();
      set({ save: stored ?? get().save, hydrated: true });
    },

    recoverMemory: (id) => {
      const { save } = get();
      if (save.memories.includes(id)) return;
      set({ save: { ...save, memories: [...save.memories, id] } });
      schedule(get);
    },

    forgetMemory: (id) => {
      const { save } = get();
      if (!save.memories.includes(id)) return;
      set({ save: { ...save, memories: save.memories.filter((m) => m !== id) } });
      schedule(get);
    },

    /* The single most important interaction in the project: no penalty, no
       confirmation, no guilt. One click and everything is readable. */
    revealAll: () => {
      set({ save: { ...get().save, revealedAll: true } });
      flush(get);
    },

    setArea: (area) => {
      set({ save: { ...get().save, area } });
      schedule(get);
    },

    setPuzzle: (id, state) => {
      const { save } = get();
      set({ save: { ...save, puzzles: { ...save.puzzles, [id]: state } } });
      schedule(get);
    },

    completePuzzle: (id, how) => {
      const { save } = get();
      const already = save.puzzles[id];
      if (already === 'solved' || already === 'skipped') return;

      const granted = lookupRewards(id)?.memories ?? [];
      const memories = [...save.memories];
      for (const memory of granted) if (!memories.includes(memory)) memories.push(memory);

      set({ save: { ...save, memories, puzzles: { ...save.puzzles, [id]: how } } });
      flush(get);
    },

    beginAgain: () => {
      clearSave();
      set({ save: freshSave() });
    },

    replaceSave: (save) => {
      set({ save });
      flush(get);
    },

    isUnlocked: (id) => {
      const { save } = get();
      return save.revealedAll || save.memories.includes(id);
    },

    /* Fragments are derived, never stored: they are simply the puzzles that hold
       one and are finished. Storing them too would create two truths that can
       disagree, and the one in the save would win. */
    fragmentsHeld: () => {
      const { save } = get();
      let held = 0;
      for (const [id, state] of Object.entries(save.puzzles)) {
        if (state !== 'solved' && state !== 'skipped') continue;
        if (lookupRewards(id)?.fragment) held += 1;
      }
      return held;
    },
  })),
);

/** Installs the flush triggers. Called once, from the client root. */
export function installSaveTriggers(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onHidden = () => {
    if (document.visibilityState === 'hidden') flush(useGame.getState);
  };
  const onPageHide = () => flush(useGame.getState);

  document.addEventListener('visibilitychange', onHidden);
  // `pagehide`, not `unload` — an `unload` listener disables the bfcache entirely.
  window.addEventListener('pagehide', onPageHide);

  return () => {
    document.removeEventListener('visibilitychange', onHidden);
    window.removeEventListener('pagehide', onPageHide);
  };
}

export const game = () => useGame.getState();
