'use client';

import { MemoryCard, type MemoryCategory } from './ui/MemoryCard';
import { EmptyState } from './ui/EmptyState';
import { useGame } from '@/state/game';
import { useSaveLifecycle } from '@/state/useSaveLifecycle';
import styles from './memory-grid.module.css';

/**
 * The Codex side of the Reveal Contract.
 *
 * The server renders every card locked, which is the correct state for a first
 * visit and for a crawler; the save is read after mount and unlocks what the
 * visitor has actually recovered. Doing it in that order means no hydration
 * mismatch and no flash of content a visitor has not earned.
 */

export interface MemorySummary {
  readonly id: string;
  readonly title: string;
  readonly category: MemoryCategory;
  readonly year: number;
  readonly excerpt: string;
  readonly href?: string | undefined;
}

export function MemoryGrid({ memories, total = 100 }: { memories: readonly MemorySummary[]; total?: number }) {
  const hydrated = useGame((s) => s.hydrated);
  const revealAll = useGame((s) => s.revealAll);
  const revealedAll = useGame((s) => s.save.revealedAll);
  const recovered = useGame((s) => s.save.memories);

  useSaveLifecycle();

  const unlocked = (id: string) => hydrated && (revealedAll || recovered.includes(id));
  const count = revealedAll ? memories.length : recovered.length;

  if (memories.length === 0) {
    return (
      <EmptyState
        headline="Nothing authored yet"
        body="The grid renders from content/memories. Every entry there is still a template — the contract is in place and the build refuses anything half-written."
      />
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.counter} role="status">
        <b>
          {count} / {total}
        </b>{' '}
        recovered
        {!revealedAll ? (
          <>
            {' · '}
            <button type="button" className={styles.reveal} onClick={revealAll}>
              open the whole Codex
            </button>
          </>
        ) : (
          ' · everything is open'
        )}
      </p>

      <ul className={styles.grid} role="list">
        {memories.map((memory) => (
          <li key={memory.id}>
            <MemoryCard
              id={memory.id}
              title={memory.title}
              category={memory.category}
              year={memory.year}
              excerpt={memory.excerpt}
              href={memory.href}
              locked={!unlocked(memory.id)}
              onRevealAll={revealAll}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
