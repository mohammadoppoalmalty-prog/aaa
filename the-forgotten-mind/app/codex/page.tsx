import type { Metadata } from 'next';
import { allMemories, allProjects } from '@/content/loader';
import { MemoryCard } from '@/codex/ui/MemoryCard';
import { EmptyState } from '@/codex/ui/EmptyState';
import styles from './index.module.css';

export const metadata: Metadata = {
  title: 'The Codex',
  description:
    'The complete portfolio in ink instead of light: every project, every memory, every failure, readable without entering the world.',
};

/**
 * The Codex index — the hundred-memory grid.
 *
 * Statically generated from `content/`. Locked entries render as silhouettes
 * with the reveal offer, so the page is never a dead end; unlocking is the
 * Reveal Contract and arrives with the save system.
 */
export default function CodexIndex() {
  const memories = allMemories();
  const projects = allProjects();

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Layer two · the archive</p>
        <h1 className={styles.title}>Everything the world remembers</h1>
        <p className={styles.lede}>
          A hundred memories, ten projects, and the failures attached to each of them. The world hides these behind a
          walk; this page does not hide them behind anything.
        </p>
      </header>

      {memories.length === 0 ? (
        <EmptyState
          headline="Nothing authored yet"
          body="The memory grid renders from content/memories. Every entry there is still a template — the schema is in place and the build refuses anything half-written."
          actionLabel={projects.length === 0 ? undefined : 'See the projects'}
        />
      ) : (
        <ul className={styles.grid} role="list">
          {memories.map((memory) => (
            <li key={memory.data.id}>
              <MemoryCard
                id={memory.data.id}
                title={memory.data.title}
                category={memory.data.category}
                year={memory.data.year}
                excerpt={memory.body.split('\n\n')[0]}
                /* Everything is locked until the save system lands in this phase. */
                locked
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
