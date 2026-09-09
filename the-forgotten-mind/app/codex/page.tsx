import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './codex.module.css';

export const metadata: Metadata = {
  title: 'The Codex',
  description:
    'The complete portfolio in ink instead of light: every project, every memory, every failure, readable without entering the world.',
};

/**
 * Layer 2, Phase 0.
 *
 * The Codex is the project's spine and is built in full in Phase 1, from the
 * MDX in `content/`. This page exists now for one reason: the title screen
 * offers a door labelled "I have five minutes", and a door that opens onto a
 * 404 is worse than no door. It says what is here and what is not.
 */
export default function CodexPage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Layer two · the archive</p>
      <h1 className={styles.title}>The Codex</h1>
      <p className={styles.lede}>
        Everything the world contains is written down here — projects with their architecture and what broke in them,
        the work history, the skills at the level they are actually held, and how to reach me. It loads in under a
        second and needs no WebGL, because the people with the least time deserve the most direct route.
      </p>
      <p className={styles.status}>
        <b>Not written yet.</b> The Codex is authored from <code>content/</code> and lands in Phase 1, alongside the
        vertical slice. This build is Phase 0 — the foundation the rest stands on.
      </p>
      <p className={styles.back}>
        <Link href="/">← Back to the gate</Link> · <Link href="/debug">World inspector</Link>
      </p>
    </main>
  );
}
