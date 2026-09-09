'use client';

import Link from 'next/link';
import { cls } from '@/lib/css';
import styles from './memory-card.module.css';

/**
 * A memory, as the Codex renders it.
 *
 * The locked state is the one that matters. A locked entry is never a dead end:
 * it shows its category, a silhouette, and the single line that offers the way
 * out — GDD Part 8. It stays a link, so keyboard and screen-reader users reach
 * the same offer a mouse user sees.
 */

export type MemoryCategory = 'work' | 'learning' | 'failure' | 'people' | 'craft' | 'life';

export interface MemoryCardProps {
  readonly id: string;
  readonly title: string;
  readonly category: MemoryCategory;
  readonly year: number;
  readonly excerpt?: string | undefined;
  readonly locked?: boolean | undefined;
  readonly href?: string | undefined;
  /** Called by the locked card's offer — the Impatience Detector's destination. */
  readonly onRevealAll?: (() => void) | undefined;
}

const CATEGORY_LABEL: Record<MemoryCategory, string> = {
  work: 'Work',
  learning: 'Learning',
  failure: 'What broke',
  people: 'People',
  craft: 'Craft',
  life: 'Life',
};

export function MemoryCard({
  id,
  title,
  category,
  year,
  excerpt,
  locked = false,
  href,
  onRevealAll,
}: MemoryCardProps) {
  const meta = (
    <p className={styles.meta}>
      <span className={cls(styles.dot, styles[category])} aria-hidden="true" />
      {CATEGORY_LABEL[category]} · {year}
    </p>
  );

  if (locked) {
    return (
      <article className={cls(styles.card, styles.locked)} aria-labelledby={`${id}-title`}>
        {meta}
        <h3 className={styles.title} id={`${id}-title`}>
          <span className={styles.silhouette} aria-hidden="true">
            {title.replace(/\S/g, '▁')}
          </span>
          <span className="sr-only">Not yet recovered</span>
        </h3>
        <p className={styles.offer}>
          Not yet recovered — or open the whole Codex.{' '}
          <button type="button" className={styles.reveal} onClick={onRevealAll}>
            Reveal everything
          </button>
        </p>
      </article>
    );
  }

  return (
    <article className={styles.card} aria-labelledby={`${id}-title`}>
      {meta}
      <h3 className={styles.title} id={`${id}-title`}>
        {href ? (
          <Link href={href} className={styles.link}>
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}
    </article>
  );
}
