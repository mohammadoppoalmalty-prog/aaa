import 'server-only';

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import matter from 'gray-matter';
import { COLLECTIONS, type CollectionName, type Experience, type Memory, type Project, type Skill } from '@content/schema';

/**
 * The content loader.
 *
 * Reads MDX from `content/`, validates every file against its zod schema, and
 * throws on the first violation. Failing the build is the point: a portfolio
 * that renders a half-authored project is worse than one that refuses to build,
 * because nobody sees the second kind.
 *
 * Server-only, and memoised per process — the Codex is statically generated, so
 * each file is parsed once for the whole build.
 */

export interface Entry<T> {
  readonly data: T;
  /** Raw MDX body — rendered by the route, not here. */
  readonly body: string;
  readonly file: string;
}

const ROOT = resolve(process.cwd(), 'content');
const cache = new Map<CollectionName, readonly Entry<unknown>[]>();

function read<T>(name: CollectionName): readonly Entry<T>[] {
  const cached = cache.get(name);
  if (cached) return cached as readonly Entry<T>[];

  const { dir, schema } = COLLECTIONS[name];
  const path = join(ROOT, dir);
  const entries: Entry<T>[] = [];

  if (existsSync(path)) {
    for (const file of readdirSync(path).filter((f) => f.endsWith('.mdx')).sort()) {
      const raw = readFileSync(join(path, file), 'utf8');
      const { data, content } = matter(raw);
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `    ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
        throw new Error(`content/${dir}/${file} does not match its schema:\n${issues}`);
      }
      entries.push({ data: parsed.data as T, body: content.trim(), file: basename(file) });
    }
  }

  cache.set(name, entries as readonly Entry<unknown>[]);
  return entries;
}

/** Drafts are authored placeholders; they never reach a visitor. */
const published = <T extends { draft: boolean }>(entries: readonly Entry<T>[]) =>
  entries.filter((e) => !e.data.draft);

export const allProjects = (): readonly Entry<Project>[] =>
  published(read<Project>('projects')).sort((a, b) => b.data.year - a.data.year);

export const allMemories = (): readonly Entry<Memory>[] =>
  published(read<Memory>('memories')).sort((a, b) => a.data.id.localeCompare(b.data.id));

export const allSkills = (): readonly Entry<Skill>[] => published(read<Skill>('skills'));

export const allExperience = (): readonly Entry<Experience>[] =>
  published(read<Experience>('experience')).sort((a, b) => b.data.from.localeCompare(a.data.from));

export const projectBySlug = (slug: string): Entry<Project> | undefined =>
  allProjects().find((p) => p.data.slug === slug);

/** Every entry including drafts — the content lint and `/debug` need the truth. */
export const rawCollection = <T>(name: CollectionName): readonly Entry<T>[] => read<T>(name);
