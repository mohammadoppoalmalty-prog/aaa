import type { Metadata } from 'next';
import { allExperience } from '@/content/loader';
import { EmptyState } from '@/codex/ui/EmptyState';
import styles from '../section.module.css';

export const metadata: Metadata = {
  title: 'Experience',
  description: 'Where he worked, what he owned, and what it cost.',
};

export default function ExperiencePage() {
  const roles = allExperience();

  if (roles.length === 0) {
    return (
      <EmptyState
        headline="No work history published yet"
        body="content/experience holds one template. The archive renders from it, newest first, once the entries are written."
      />
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Experience</h1>
      <ol className={styles.rail} role="list">
        {roles.map(({ data, body }) => (
          <li key={data.slug}>
            <p className={styles.when}>
              {data.from} — {data.to ?? 'present'}
            </p>
            <h2>
              {data.role} · <span>{data.organisation}</span>
            </h2>
            <p className={styles.summary}>{data.summary}</p>
            <p className={styles.body}>{body.split('\n\n')[0]}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
