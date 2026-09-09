import Link from 'next/link';
import styles from './page.module.css';

export const metadata = { title: "Enter" };

/**
 * Screen 01 — the title screen.
 *
 * A server component with no client JavaScript, because the first thing a
 * visitor meets must not wait on a bundle. The third door (CONTINUE) appears
 * only when a save exists and arrives with the save system in Phase 1.
 */

const DOORS = [
  {
    href: '/world',
    label: 'Enter the world',
    cost: '20–60 minutes · headphones recommended',
    primary: true,
  },
  {
    href: '/codex',
    label: 'I have five minutes',
    cost: 'Opens the Codex · full portfolio, no puzzles',
    primary: false,
  },
] as const;

export default function TitleScreen() {
  return (
    <main className={styles.screen}>
      <div className={styles.stage}>
        <Gate />

        <p className={`${styles.eyebrow} ${styles.settle}`}>An interactive portfolio · Chapter one</p>

        <h1 className={`${styles.title} ${styles.settle}`}>
          The <strong>Forgotten Mind</strong>
        </h1>

        <p className={`${styles.lede} ${styles.settle}`}>
          A world that remembers a career, and forgets it again if nobody walks through. Everything inside it is also
          written down — so you can explore it, or read it, and neither route is the consolation prize.
        </p>

        <nav className={`${styles.doors} ${styles.settle}`} aria-label="Ways in">
          {DOORS.map((door) => (
            <Link
              key={door.href}
              href={door.href}
              className={`${styles.door} ${door.primary ? styles.primary : ''}`}
            >
              <span className={styles.mark} aria-hidden="true">
                ▸
              </span>
              <span>
                <span className={styles.label}>{door.label}</span>
                <span className={styles.cost}>{door.cost}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <footer className={styles.rail}>
        <span>Phase 0 · foundation build</span>
        <span>
          <Link href="/">← The introduction</Link> · <Link href="/debug">Debug</Link>
        </span>
      </footer>
    </main>
  );
}

/** The gate, in silhouette. Drawn rather than shipped as an asset — it is nine
 *  path commands, and a texture request here would cost more than the screen. */
function Gate() {
  return (
    <svg className={styles.gate} viewBox="0 0 400 420" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="gate-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M40 420V150a160 160 0 0 1 320 0v270"
        stroke="url(#gate-edge)"
        strokeWidth="1.5"
      />
      <path d="M96 420V158a104 104 0 0 1 208 0v262" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1" />
      <path d="M200 46v374" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1" />
      <circle cx="200" cy="150" r="26" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="200" cy="150" r="4" fill="currentColor" />
    </svg>
  );
}
