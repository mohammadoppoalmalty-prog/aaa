import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './accessibility.module.css';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'What this site meets, what it does not, and why — stated per surface rather than claimed in general.',
};

/**
 * The accessibility statement — STANDARDS 7.9.
 *
 * The charter's commitment is that this page is *specific*: a blanket claim of
 * AAA for a 3D exploration game would be false, and a vague "we care about
 * accessibility" is worth nothing to the person reading it. So the Codex and the
 * world are stated separately, the two criteria the world cannot meet are named,
 * and the reason the two-layer architecture is itself the answer is written down.
 *
 * It is kept current by hand. A statement that drifts is worse than none.
 */

const CODEX = [
  ['Contrast', '7:1 on body text and 4.5:1 on large text, asserted in a unit test against the token palette.', 'met'],
  ['Keyboard', 'Every route, control and link is reachable and operable from a keyboard.', 'met'],
  ['Focus', 'A visible 2px ring with 2px offset on :focus-visible only, so a mouse click never draws one.', 'met'],
  ['Targets', 'Controls are at least 44×44 CSS pixels (AAA 2.5.5).', 'met'],
  ['Motion', 'prefers-reduced-motion removes every animation without removing content.', 'met'],
  ['Timing', 'Nothing expires, nothing auto-advances, nothing is timed.', 'met'],
  ['Drag', 'No interaction requires dragging (2.5.7).', 'met'],
  ['Structure', 'Real headings, real lists, real landmarks; a skip link before the content.', 'met'],
  ['Reading level', 'Not yet audited. It will be, before launch.', 'pending'],
] as const;

const WORLD = [
  ['Keyboard completability', '[ and ] cycle every interactable by distance; E takes it. Nothing needs aim.', 'met'],
  ['Announcements', 'The interaction prompt is a live region, so cycling speaks what is now focused.', 'met'],
  ['Motion', 'Reduced motion halves the camera spring and removes bob and cinematic moves.', 'met'],
  ['No fail states', 'No death, no damage, no timers. A puzzle can always be skipped, and skipping pays the same.', 'met'],
  [
    'Contrast against the scene (1.4.6)',
    'Cannot be met honestly: interface text sits over a moving 3D image whose colours change with restoration.',
    'not met',
  ],
  [
    'Link purpose from text alone (2.4.9)',
    'Cannot be met inside a rendered scene, where the "link" is a place you walk to.',
    'not met',
  ],
] as const;

export default function AccessibilityPage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>Accessibility</p>
      <h1 className={styles.title}>What is met, and what is not</h1>

      <p className={styles.lede}>
        This site has two surfaces with genuinely different ceilings, so it states them separately. Claiming one number
        for both would be the easier thing to write and the less useful thing to read.
      </p>

      <section className={styles.section}>
        <h2>The Codex — targets WCAG 2.2 AAA</h2>
        <p>
          The Codex is a complete, conforming alternate version of everything the world contains. It is reachable in one
          input from anywhere in the world, and it holds 100% of the content.
        </p>
        <Table rows={CODEX} />
      </section>

      <section className={styles.section}>
        <h2>The world — targets WCAG 2.2 AA, plus what it can reach beyond</h2>
        <p>
          Two AAA criteria cannot be met inside a rendered 3D scene without pretending. They are named here rather than
          left out.
        </p>
        <Table rows={WORLD} />
      </section>

      <section className={styles.section}>
        <h2>Why the architecture is the answer</h2>
        <p>
          The two criteria above are not met in the world and cannot be. What resolves that is not a colour tweak: the{' '}
          <Link href="/codex">Codex</Link> is a conforming alternate version under WCAG, holding the same content, one
          key away, at AAA. That is why this project is built in two layers — it is an accessibility decision as much as
          a business one.
        </p>
      </section>

      <p className={styles.contact}>
        Something here wrong, or something missing? <Link href="/codex/contact">Tell me</Link> — this page is maintained
        by hand, and a statement that has drifted is worse than none.
      </p>
    </main>
  );
}

function Table({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  return (
    <dl className={styles.rows}>
      {rows.map(([name, detail, state]) => (
        <div key={name} className={styles.row}>
          <dt>
            {name}
            <span className={state === 'met' ? styles.met : state === 'pending' ? styles.pending : styles.no}>
              {state === 'met' ? 'met' : state === 'pending' ? 'not audited' : 'not met'}
            </span>
          </dt>
          <dd>{detail}</dd>
        </div>
      ))}
    </dl>
  );
}
