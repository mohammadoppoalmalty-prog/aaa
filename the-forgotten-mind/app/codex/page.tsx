import type { Metadata } from 'next';
import Link from 'next/link';
import { allMemories, allProjects } from '@/content/loader';
import { GREYBOX_MEMORIES } from '@/content/greybox';
import { MemoryGrid, type MemorySummary } from '@/codex/MemoryGrid';
import styles from './index.module.css';

export const metadata: Metadata = {
  title: 'The Codex',
  description:
    'The complete portfolio in ink instead of light: every project, every memory, every failure, readable without entering the world.',
};

/**
 * The Codex index — the memory grid.
 *
 * Statically generated from `content/`. Locked entries render as silhouettes
 * with the reveal offer, so the page is never a dead end, and the unlocking is
 * the Reveal Contract: what the visitor recovered in the world, read back here.
 */
export default function CodexIndex() {
  const authored = allMemories();
  const projects = allProjects();

  /* Both layers fall back to the same scaffolding, so the world and the Codex
     can never disagree about which memories exist. */
  const memories: MemorySummary[] =
    authored.length > 0
      ? authored.map(({ data, body }) => ({
          id: data.id,
          title: data.title,
          category: data.category,
          year: data.year,
          excerpt: body.split('\n\n')[0] ?? '',
          href: data.unlocks,
        }))
      : GREYBOX_MEMORIES.map((memory) => ({
          id: memory.id,
          title: memory.title,
          category: memory.category,
          year: memory.year,
          excerpt: memory.excerpt,
        }));

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Layer two · the archive</p>
        <h1 className={styles.title}>Everything the world remembers</h1>
        <p className={styles.lede}>
          A hundred memories, ten projects, and the failures attached to each of them. The world hides these behind a
          walk; this page does not hide them behind anything.
        </p>
        {authored.length === 0 ? (
          <p className={styles.scaffold}>
            <b>Scaffolding.</b> No memories are authored yet, so both layers are showing the same five grey-box
            stand-ins. The contract, the grid and the unlocking are real; the content is not.
          </p>
        ) : null}
      </header>

      <MemoryGrid memories={memories} total={memories.length} />

      {projects.length > 0 ? (
        <p className={styles.jump}>
          <Link href="/codex/projects">All {projects.length} projects, with what broke in each →</Link>
        </p>
      ) : null}
    </div>
  );
}
