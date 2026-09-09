'use client';

import { useEffect } from 'react';
import { startRum } from './rum';
import { useSettings } from '@/state/settings';

/**
 * Mounted once in the root layout. Renders nothing, reports once per metric, and
 * is named apart from `rum.ts` deliberately — a `Rum.tsx` beside a `rum.ts`
 * resolves differently on a case-insensitive filesystem than on the Linux box
 * that builds it, which is a class of bug that only ever appears in CI.
 */
export function RumReporter() {
  useEffect(() => {
    startRum(() => useSettings.getState().quality);
  }, []);
  return null;
}
