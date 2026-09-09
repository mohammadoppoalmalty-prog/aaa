'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ask, stageFromRestoration, type LumaIntent, type LumaReply } from './systems/luma/fallback';
import { useGame } from '@/state/game';
import { restorationOf } from './systems/director';
import styles from './luma.module.css';

/**
 * LUMA, the Guardian — GDD Part 8.
 *
 * It is a diegetic object rather than a chat widget, but the panel is honest
 * about what it is: at stage 0–2 every answer is written in advance, and if you
 * ask whether it is an AI it tells you plainly that it is not. Pretending
 * otherwise would be the one lie this project cannot afford, because the whole
 * portfolio rests on the claim that what it says about itself is true.
 */

export function Luma({ intents, total }: { intents: readonly LumaIntent[]; total: number }) {
  const recovered = useGame((s) => s.save.memories.length);
  const revealedAll = useGame((s) => s.save.revealedAll);

  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<readonly (LumaReply & { asked: string })[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const stage = stageFromRestoration(revealedAll ? 1 : restorationOf(recovered, total));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'KeyL' && !event.metaKey && !event.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.code === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button type="button" className={styles.call} onClick={() => setOpen(true)}>
        Ask LUMA <kbd>L</kbd>
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="LUMA">
      <p className={styles.head}>
        LUMA
        <span className={styles.stage}>stage {stage} · scripted</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close">
          ×
        </button>
      </p>

      <ol className={styles.turns} role="log">
        {turns.length === 0 ? (
          <li className={styles.hint}>
            Ask about the projects, the skills, how to reach him — or say you are in a hurry.
          </li>
        ) : null}
        {turns.map((turn, index) => (
          <li key={index}>
            <p className={styles.asked}>{turn.asked}</p>
            <p className={styles.said}>{turn.text}</p>
            {turn.codex ? (
              <p className={styles.link}>
                <Link href={turn.codex}>Read it in the Codex →</Link>
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const question = input.current?.value.trim();
          if (!question) return;
          const reply = ask(question, intents, stage);
          // The last eight turns only — the save is not a transcript archive.
          setTurns((previous) => [...previous, { ...reply, asked: question }].slice(-8));
          if (input.current) input.current.value = '';
        }}
      >
        <label className="sr-only" htmlFor="luma-input">
          Ask LUMA a question
        </label>
        <input id="luma-input" ref={input} type="text" autoComplete="off" placeholder="Ask…" />
        <button type="submit">Ask</button>
      </form>
    </aside>
  );
}
