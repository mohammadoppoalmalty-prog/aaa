import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../section.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Every way to reach a real person, with no form standing in front of them.',
};

/**
 * The contact page is on the project's spine: it is one of the things that must
 * never be cut, at any scope. So it is plain, static, and puts the address in
 * front of the visitor rather than behind a form — a form is a gate, and this
 * page exists to remove gates.
 */
export default function ContactPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Contact</h1>
      <p className={styles.lede}>
        No form in front of the address, and no newsletter. If you have read enough to want a conversation, you should
        not have to fill anything in to start one.
      </p>

      <dl className={styles.facts}>
        <div>
          <dt>Email</dt>
          <dd>
            <span className={styles.pending}>Add it in app/codex/contact — it is the one field that cannot be scaffolded.</span>
          </dd>
        </div>
        <div>
          <dt>Résumé</dt>
          <dd>
            <span className={styles.pending}>public/resume.pdf, once it exists.</span>
          </dd>
        </div>
        <div>
          <dt>In the world</dt>
          <dd>
            The Contact Tower, on brass plates at the base of the Engine. <Link href="/world">Walk there →</Link>
          </dd>
        </div>
      </dl>
    </div>
  );
}
