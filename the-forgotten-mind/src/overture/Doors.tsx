'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasSave, readSave } from '@/state/save';
import styles from './doors.module.css';

/**
 * The three doors.
 *
 * The rule that makes the Overture admissible at all: **they are in the first
 * viewport and pinned to the bottom of every subsequent one.** A visitor can act
 * on the first frame or the last with equal ease. It adds a path; it never adds
 * a gate.
 *
 * "Continue" appears only when there is something to continue, and says how far
 * along it is — a door that lies about what is behind it is worse than no door.
 */
export function Doors({ pinned = false }: { pinned?: boolean }) {
  const [progress, setProgress] = useState<{ memories: number } | null>(null);

  useEffect(() => {
    if (!hasSave()) return;
    const save = readSave();
    if (save) setProgress({ memories: save.revealedAll ? 100 : save.memories.length });
  }, []);

  return (
    <nav className={pinned ? `${styles.doors} ${styles.pinned}` : styles.doors} aria-label="Ways in">
      <Link href="/world" className={`${styles.door} ${styles.primary}`}>
        <span className={styles.label}>Enter the world</span>
        <span className={styles.cost}>20–60 min · headphones</span>
      </Link>
      <Link href="/codex" className={styles.door}>
        <span className={styles.label}>I have five minutes</span>
        <span className={styles.cost}>The whole portfolio, in text</span>
      </Link>
      {progress ? (
        <Link href="/world" className={styles.door}>
          <span className={styles.label}>Continue</span>
          <span className={styles.cost}>{progress.memories} memories recovered</span>
        </Link>
      ) : null}
    </nav>
  );
}
