'use client';

import { Button } from './Button';
import styles from './empty-state.module.css';

/**
 * An authored zero state: an illustration, a real heading, one sentence, and
 * exactly one action (STANDARDS 3.2). The Codex-with-nothing-recovered case is
 * the Impatience Detector's destination and must never read as a failure — so
 * the copy offers, it does not apologise.
 */
/* Optionals are written `?: T | undefined` throughout the UI layer: with
   exactOptionalPropertyTypes on, that is the difference between "may be
   omitted" and "may be passed as undefined", and callers legitimately do the
   second when a prop is conditional. */
export interface EmptyStateProps {
  readonly glyph?: string | undefined;
  readonly headline: string;
  readonly body: string;
  readonly actionLabel?: string | undefined;
  readonly onAction?: (() => void) | undefined;
  readonly headingLevel?: 2 | 3 | undefined;
}

export function EmptyState({
  glyph = '◈',
  headline,
  body,
  actionLabel,
  onAction,
  headingLevel = 2,
}: EmptyStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className={styles.empty}>
      <p className={styles.glyph} aria-hidden="true">{glyph}</p>
      <Heading className={styles.headline}>{headline}</Heading>
      <p className={styles.body}>{body}</p>
      {actionLabel ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
