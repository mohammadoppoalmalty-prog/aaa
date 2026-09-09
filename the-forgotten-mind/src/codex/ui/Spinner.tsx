'use client';

import styles from './spinner.module.css';

/** A spinner that says what it is waiting for, and stops moving for anyone who
 *  asked the system for less motion. */
export function Spinner({ label = 'Loading…', size = '1.15em' }: { label?: string; size?: string }) {
  return (
    <span className={styles.spinner} style={{ inlineSize: size, blockSize: size }} role="status">
      <span className={styles.ring} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
