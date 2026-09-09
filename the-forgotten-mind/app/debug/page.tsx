import type { Metadata } from 'next';
import { Inspector } from './Inspector';

export const metadata: Metadata = {
  title: 'Debug',
  robots: { index: false, follow: false },
};

/**
 * `/debug` — the world inspector (STANDARDS 9.4).
 *
 * Phase 0 ships the shell and the controls that have something to control:
 * quality tier, the perf HUD, reduced motion, and the live token palette.
 * Restoration scrubbing, area teleport, memory grant/revoke and seed override
 * land as their systems do — the point of building it now is that every system
 * after this one arrives with a switch already waiting for it.
 */
export default function DebugPage() {
  return <Inspector />;
}
