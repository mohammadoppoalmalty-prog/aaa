import type { Metadata } from 'next';
import Link from 'next/link';
import { allProjects } from '@/content/loader';
import { EmptyState } from '@/codex/ui/EmptyState';
import styles from './projects.module.css';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Ten projects, their stacks, what each one measured, and what broke in it.',
};

export default function ProjectsIndex() {
  const projects = allProjects();

  if (projects.length === 0) {
    return (
      <EmptyState
        headline="No projects published yet"
        body="content/projects holds one template. The schema requires a real failure in every entry, and the build refuses anything that still says REPLACE."
      />
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Projects</h1>
      <ul className={styles.list} role="list">
        {projects.map(({ data }) => (
          <li key={data.slug} className={styles.row}>
            <p className={styles.year}>{data.year}</p>
            <div>
              <h2 className={styles.name}>
                <Link href={`/codex/projects/${data.slug}`}>{data.title}</Link>
              </h2>
              <p className={styles.role}>
                {data.role} · {data.status}
              </p>
              <ul className={styles.stack} role="list">
                {data.stack.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </div>
            {/* The failure is on the index, not buried in the detail page — it is
                the field that makes the rest of the row believable. */}
            <p className={styles.broke}>
              <span>What broke</span>
              {data.whatBroke}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
