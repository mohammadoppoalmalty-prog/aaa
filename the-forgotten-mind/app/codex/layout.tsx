import Link from 'next/link';
import styles from './codex-shell.module.css';

/**
 * The Codex shell — Layer 2.
 *
 * Server-rendered, no client JavaScript in the frame itself, and one skip link
 * before anything else. The section rail is a real `<nav>` with real links, so
 * every route is crawlable, linkable and printable; that is what makes the Codex
 * a conforming alternate version of the world rather than a fallback.
 */

const SECTIONS = [
  { href: '/codex', label: 'Memories' },
  { href: '/codex/projects', label: 'Projects' },
  { href: '/codex/skills', label: 'Skills' },
  { href: '/codex/experience', label: 'Experience' },
  { href: '/codex/contact', label: 'Contact' },
] as const;

export default function CodexLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#codex-main">
        Skip to content
      </a>

      <header className={styles.head}>
        <p className={styles.mark}>
          <Link href="/">◈ The Forgotten Mind</Link>
        </p>
        <nav className={styles.rail} aria-label="Codex sections">
          {SECTIONS.map((section) => (
            <Link key={section.href} href={section.href}>
              {section.label}
            </Link>
          ))}
        </nav>
        <p className={styles.aside}>
          <Link href="/world">Enter the world →</Link>
        </p>
      </header>

      <main id="codex-main" className={styles.main}>
        {children}
      </main>

      <footer className={styles.foot}>
        <p>The Codex holds everything the world holds. Nothing here is behind a puzzle.</p>
      </footer>
    </div>
  );
}
