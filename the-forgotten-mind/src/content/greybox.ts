import type { MemoryCategory } from '@/codex/ui/MemoryCard';

/**
 * Grey-box stand-ins, used by **both** layers until the memories are authored.
 *
 * This file exists so the recovery loop is testable end to end before any
 * content is written — and it lives in one place, because the world and the
 * Codex disagreeing about what exists is exactly the bug the Reveal Contract
 * cannot afford.
 *
 * They are labelled as scaffolding on purpose. Filling `content/memories/` with
 * invented career claims to make a demo look finished would make every real
 * claim beside them worth less.
 */

export interface GreyboxMemory {
  readonly id: string;
  readonly title: string;
  readonly category: MemoryCategory;
  readonly year: number;
  readonly excerpt: string;
  /** Which area holds it. */
  readonly area: string;
  /** Where it stands in that area's blockout, in metres. */
  readonly position: readonly [number, number, number];
}

export const GREYBOX_MEMORIES: readonly GreyboxMemory[] = [
  {
    id: 'greybox-1',
    title: 'Grey-box memory 1',
    category: 'craft',
    year: 2019,
    excerpt: 'Scaffolding. Replace this by authoring content/memories/m-001.mdx — the schema is already waiting.',
    area: 'gate',
    position: [-6, 1.2, -2],
  },
  {
    id: 'greybox-2',
    title: 'Grey-box memory 2',
    category: 'work',
    year: 2020,
    excerpt: 'Scaffolding. Every field a real memory needs is in content/schema.ts.',
    area: 'gate',
    position: [5, 1.2, -3],
  },
  {
    id: 'greybox-3',
    title: 'Grey-box memory 3',
    category: 'failure',
    year: 2021,
    excerpt: 'Scaffolding. The failure category is not decoration — roughly a fifth of the hundred belong to it.',
    area: 'gate',
    position: [-2, 1.2, 8],
  },
  {
    id: 'greybox-4',
    title: 'Grey-box memory 4',
    category: 'learning',
    year: 2022,
    excerpt: 'Scaffolding. A memory is one moment, not a summary of a year.',
    area: 'gate',
    position: [9, 1.2, 4],
  },
  {
    id: 'greybox-5',
    title: 'Grey-box memory 5',
    category: 'people',
    year: 2023,
    excerpt: 'Scaffolding. Written twice: a narrator line the world speaks, and the body a recruiter reads.',
    area: 'gate',
    position: [-11, 1.2, 6],
  },
];

/** The hundred the finished world holds — the counter reads against this. */
export const MEMORY_TARGET = 100;
