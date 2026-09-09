import type { Metadata } from 'next';
import { WorldShell } from './WorldShell';

export const metadata: Metadata = {
  title: 'The world',
  description: 'The 3D layer. Everything inside it is also readable in the Codex.',
  robots: { index: false, follow: true },
};

/**
 * The world route is a thin server shell. The engine is a client island loaded
 * dynamically so its bundle never enters the Codex's dependency graph.
 */
export default function WorldPage() {
  return <WorldShell />;
}
