'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useGame } from '@/state/game';
import { areaById } from './areas/manifest';
import { useSaveLifecycle } from '@/state/useSaveLifecycle';
import styles from './hud.module.css';

/**
 * The HUD — GDD Part 8. Four elements, no more.
 *
 * The Impatience Detector is the important one. If a visitor has been in-world
 * for 75 seconds with nothing recovered, or moves the pointer toward the
 * browser's own controls, the world offers the exit *once*: no modal, no "are
 * you sure", no penalty. This is the single most important interaction in the
 * project — a visible, dignified way out is what makes the choice to stay mean
 * anything.
 */

const IMPATIENCE_MS = 75_000;
const COUNTER_VISIBLE_MS = 4000;

export function Hud({ total }: { total: number }) {
  const areaId = useGame((s) => s.save.area);
  const recovered = useGame((s) => s.save.memories.length);
  const revealedAll = useGame((s) => s.save.revealedAll);
  const revealAll = useGame((s) => s.revealAll);

  const [counterVisible, setCounterVisible] = useState(false);
  const [offerExit, setOfferExit] = useState(false);
  const offered = useRef(false);

  useSaveLifecycle();

  /* The counter appears for four seconds when it changes, then fades. */
  useEffect(() => {
    setCounterVisible(true);
    const id = window.setTimeout(() => setCounterVisible(false), COUNTER_VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [recovered]);

  useEffect(() => {
    if (offered.current || revealedAll) return;

    const offer = () => {
      if (offered.current) return;
      offered.current = true;
      setOfferExit(true);
    };

    const timer = window.setTimeout(() => {
      if (useGame.getState().save.memories.length === 0) offer();
    }, IMPATIENCE_MS);

    /* Reaching for the tab bar or the back button is the same signal as sitting
       still: this visitor is leaving, and would rather have the content. */
    const onLeave = (event: PointerEvent) => {
      if (event.clientY <= 4 && useGame.getState().save.memories.length === 0) offer();
    };
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [revealedAll]);

  return (
    <>
      <p className={counterVisible ? `${styles.counter} ${styles.on}` : styles.counter} aria-live="polite">
        ◈ {revealedAll ? total : recovered} / {total}
        <span className={styles.where}>{areaById(areaId)?.name ?? areaId}</span>
      </p>

      {offerExit ? (
        <div className={styles.offer} role="dialog" aria-label="Open the Codex">
          <p className={styles.offerLine}>
            You are in a hurry. I understand — you did not come here for riddles. Ask me to open the Codex and I will
            show you everything at once. The world will still be here.
          </p>
          <p className={styles.offerActions}>
            <Link href="/codex" className={styles.primary} onClick={revealAll}>
              Skip the journey — open the Codex
            </Link>
            <button type="button" className={styles.dismiss} onClick={() => setOfferExit(false)}>
              Keep walking
            </button>
          </p>
        </div>
      ) : null}

      {/* Always present, never fades — one click to the whole portfolio. */}
      <Link href="/codex" className={styles.codex}>
        Codex
      </Link>
    </>
  );
}
