'use client';

import { useEffect } from 'react';
import { installSaveTriggers, useGame } from './game';

/**
 * Read the save on mount, and make sure it is written before the page goes away.
 *
 * Every surface that touches the save calls this — the world's HUD and the
 * Codex's grid alike. Installing the flush triggers on only one of them is a
 * real bug and an easy one to ship: writes are debounced by two seconds, so
 * recovering a memory and immediately opening the Codex loses it, and it looks
 * exactly like a broken Reveal Contract rather than a missing listener.
 */
export function useSaveLifecycle(): void {
  const hydrate = useGame((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    return installSaveTriggers();
  }, [hydrate]);
}
