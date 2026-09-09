import { z } from 'zod';

/**
 * The content contract (STANDARDS 9.5).
 *
 * Defined once and imported by the loader, the Codex, the world, and the build
 * lint — so a drift between what is authored and what is rendered is a compile
 * error rather than a blank panel in production.
 *
 * Two rules encoded here are editorial, not technical, and they are the reason
 * this file is worth having:
 *
 * — **`whatBroke` is required on every project.** A portfolio in which nothing
 *   ever went wrong is not credible, and the field is what keeps the Fracture
 *   Records tonally consistent with the rest of the project.
 * — **Everything is written twice.** `narratorLine` is the voiced, ≤25-word line
 *   the world speaks; the MDX body is the 100–300 word factual version a
 *   recruiter reads. That is the two-layer architecture at the content level.
 */

const url = z.string().url();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slugs are lowercase-kebab-case');

/** ≤ 25 words, because it is spoken aloud and subtitled. */
export const narratorLine = z
  .string()
  .min(1)
  .refine((line) => line.trim().split(/\s+/).length <= 25, {
    message: 'a narrator line is at most 25 words — it is voiced, not read',
  });

export const MEMORY_CATEGORIES = ['work', 'learning', 'failure', 'people', 'craft', 'life'] as const;
export const PROJECT_CATEGORIES = ['frontend', 'backend', 'fullstack', 'tooling', 'experiment'] as const;
export const AREAS = [
  'gate', 'memory-forest', 'village', 'childhood-home', 'learning-workshop',
  'innovation-laboratory', 'developer-studio', 'knowledge-library', 'experience-archive',
  'crystal-lake', 'underground-cave', 'ancient-temple', 'floating-islands',
  'dream-observatory', 'achievement-hall', 'sky-bridge', 'contact-tower',
  'hidden-basement', 'secret-sanctuary',
] as const;

export const projectSchema = z.object({
  slug,
  title: z.string().min(1),
  /** Which desk in the Developer Studio holds this project's machine, 1–8. */
  workstation: z.number().int().min(1).max(8),
  year: z.number().int().min(2000).max(2100),
  role: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  category: z.enum(PROJECT_CATEGORIES),
  status: z.enum(['shipped', 'archived', 'ongoing']),
  demo: url.nullable(),
  repo: url.nullable(),
  /** Stated openly when there is no public repo — silence reads as evasion. */
  repoAbsentReason: z.string().min(1).optional(),
  video: z.string().startsWith('/').nullable(),
  architecture: z.string().startsWith('/').nullable(),
  codeFiles: z
    .array(z.object({ path: z.string().min(1), lines: z.string().regex(/^\d+-\d+$/), note: z.string().min(1) }))
    .default([]),
  metrics: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([]),
  narratorLine,
  whatBroke: z.string().min(20, 'name the actual failure, not a euphemism'),
  whatILearned: z.string().min(20),
  /** Template entries are excluded from the Codex until they are replaced. */
  draft: z.boolean().default(false),
}).refine((p) => p.repo !== null || p.repoAbsentReason !== undefined, {
  message: 'a project without a repo must say why',
  path: ['repoAbsentReason'],
});

export const memorySchema = z.object({
  id: z.string().regex(/^m-\d{3}$/, 'memory ids are m-001 … m-100'),
  title: z.string().min(1).max(72),
  category: z.enum(MEMORY_CATEGORIES),
  year: z.number().int().min(1990).max(2100),
  area: z.enum(AREAS),
  /** The Codex route this memory unlocks, if it belongs to one. */
  unlocks: z.string().startsWith('/codex').optional(),
  narratorLine,
  /** Recovered without solving anything — the first few must be. */
  free: z.boolean().default(false),
  draft: z.boolean().default(false),
});

export const skillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['language', 'framework', 'infrastructure', 'data', 'craft']),
  /** The honest three: lead it, work in it, or support someone better. */
  level: z.enum(['lead', 'fluent', 'supporting']),
  since: z.number().int().min(1990).max(2100),
  evidence: z.array(slug).default([]),
  draft: z.boolean().default(false),
});

export const experienceSchema = z.object({
  slug,
  organisation: z.string().min(1),
  role: z.string().min(1),
  from: z.string().regex(/^\d{4}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  summary: z.string().min(1),
  narratorLine,
  draft: z.boolean().default(false),
});

export type Project = z.infer<typeof projectSchema>;
export type Memory = z.infer<typeof memorySchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Experience = z.infer<typeof experienceSchema>;

export const COLLECTIONS = {
  projects: { dir: 'projects', schema: projectSchema, key: 'slug' },
  memories: { dir: 'memories', schema: memorySchema, key: 'id' },
  skills: { dir: 'skills', schema: skillSchema, key: 'name' },
  experience: { dir: 'experience', schema: experienceSchema, key: 'slug' },
} as const;

export type CollectionName = keyof typeof COLLECTIONS;

/** Body-length rule: long enough to be useful, short enough to be read. */
export const BODY_WORDS = { min: 100, max: 300 } as const;
