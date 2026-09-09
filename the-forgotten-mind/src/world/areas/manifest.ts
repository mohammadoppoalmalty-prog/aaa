/**
 * The world atlas — GDD Part 4, as data.
 *
 * Every size, connection, memory count and gate here comes from the area
 * specifications. Keeping it as one typed table rather than nineteen scenes is
 * what makes the grey-box blockouts generatable, the Director's streaming
 * decisions testable without a GPU, and a pacing problem visible in week four
 * instead of week twenty.
 */

import { type AREAS } from '@content/schema';

export type AreaId = (typeof AREAS)[number];

export type AreaKind = 'exterior' | 'interior' | 'cave' | 'aerial';

export interface AreaGate {
  /** Fraction of the hundred memories that must be recovered, 0–1. */
  readonly restoration?: number;
  /** Core Fragments required, of eight. */
  readonly fragments?: number;
  /** Never a blank wall: what the player *sees* while it is locked. */
  readonly visibleReason: string;
}

export interface AreaSpec {
  readonly id: AreaId;
  readonly name: string;
  readonly purpose: string;
  readonly kind: AreaKind;
  /** Footprint in metres. Interiors are their room size; exteriors their extent. */
  readonly size: readonly [number, number];
  /** Storeys or vertical levels — the blockout stacks floors from this. */
  readonly levels: number;
  /** How many of the hundred memories live here. GDD Appendix B is authoritative:
   *  this column must sum to exactly 100, and a test asserts it. */
  readonly memories: number;
  /** The five secret memories, which sit outside the hundred by design. */
  readonly secretMemories: number;
  readonly fragment: boolean;
  readonly puzzle: string | null;
  /** Signposted ways out — the ones a blockout marks and a map draws.
   *  Every connection is walked, never faded. */
  readonly exits: readonly AreaId[];
  /** Ways out that exist but are not advertised: the basement door, the gap in
   *  the village wall. They are walked in both directions like any other path;
   *  what makes them secret is that nothing points at them. */
  readonly hiddenExits?: readonly AreaId[];
  readonly gate?: AreaGate;
  readonly secret?: string;
}

/* Ordered by the path a first-time visitor walks. */
export const AREA_SPECS: Readonly<Record<AreaId, AreaSpec>> = {
  gate: {
    id: 'gate',
    name: 'The Gate',
    purpose: 'Intro, control tutorial, emotional contract',
    kind: 'exterior',
    size: [40, 40],
    levels: 1,
    memories: 1,
    secretMemories: 0,
    fragment: false,
    puzzle: 'cursor-ritual',
    exits: ['memory-forest'],
    secret: 'Holding still for 30 seconds unlocks the patience achievement.',
  },
  'memory-forest': {
    id: 'memory-forest',
    name: 'Memory Forest',
    purpose: 'Teach movement, interaction, LUMA, the memory system',
    kind: 'exterior',
    size: [120, 120],
    levels: 1,
    memories: 5,
    secretMemories: 0,
    fragment: false,
    puzzle: 'light-echo',
    exits: ['gate', 'village'],
  },
  village: {
    id: 'village',
    name: 'Forgotten Village',
    purpose: 'The hub. Every road out of the story starts here.',
    kind: 'exterior',
    size: [200, 200],
    levels: 1,
    memories: 6,
    secretMemories: 0,
    fragment: false,
    puzzle: 'fountain',
    exits: [
      'memory-forest',
      'childhood-home',
      'learning-workshop',
      'knowledge-library',
      'experience-archive',
      'crystal-lake',
      'achievement-hall',
    ],
    hiddenExits: ['secret-sanctuary'],
  },
  'childhood-home': {
    id: 'childhood-home',
    name: 'Childhood Home',
    purpose: 'Origin',
    kind: 'interior',
    size: [15, 12],
    levels: 2,
    memories: 7,
    secretMemories: 0,
    fragment: true,
    puzzle: 'attic-order',
    exits: ['village'],
    hiddenExits: ['hidden-basement'],
    secret: 'The basement door only exists once you have looked for it.',
  },
  'learning-workshop': {
    id: 'learning-workshop',
    name: 'Learning Workshop',
    purpose: 'Skills, part one',
    kind: 'interior',
    size: [20, 14],
    levels: 2,
    memories: 8,
    secretMemories: 0,
    fragment: true,
    puzzle: 'tool-bench',
    exits: ['village', 'innovation-laboratory'],
  },
  'innovation-laboratory': {
    id: 'innovation-laboratory',
    name: 'Innovation Laboratory',
    purpose: 'Skills, part two',
    kind: 'interior',
    size: [24, 18],
    levels: 1,
    memories: 8,
    secretMemories: 1,
    fragment: true,
    puzzle: 'circuit-table',
    exits: ['learning-workshop', 'developer-studio'],
  },
  'developer-studio': {
    id: 'developer-studio',
    name: 'Developer Studio',
    purpose: 'The ten projects, as working machines',
    kind: 'interior',
    size: [30, 20],
    levels: 1,
    memories: 20,
    secretMemories: 0,
    fragment: true,
    puzzle: 'workstation-boot',
    exits: ['innovation-laboratory', 'sky-bridge'],
  },
  'knowledge-library': {
    id: 'knowledge-library',
    name: 'Knowledge Library',
    purpose: 'Education and certificates',
    kind: 'interior',
    size: [26, 26],
    levels: 3,
    memories: 10,
    secretMemories: 0,
    fragment: true,
    puzzle: 'shelf-order',
    exits: ['village', 'ancient-temple'],
  },
  'experience-archive': {
    id: 'experience-archive',
    name: 'Experience Archive',
    purpose: 'Work history, on a year-marked rail',
    kind: 'interior',
    size: [22, 16],
    levels: 1,
    memories: 8,
    secretMemories: 0,
    fragment: true,
    puzzle: 'journal-rail',
    exits: ['village'],
  },
  'crystal-lake': {
    id: 'crystal-lake',
    name: 'Crystal Lake',
    purpose: 'Skills, part three — 24 crystals on plinths',
    kind: 'exterior',
    size: [180, 180],
    levels: 1,
    memories: 8,
    secretMemories: 0,
    fragment: true,
    puzzle: 'light-reflection',
    exits: ['village', 'underground-cave'],
  },
  'underground-cave': {
    id: 'underground-cave',
    name: 'Underground Cave',
    purpose: 'The subconscious — three chambers',
    kind: 'cave',
    size: [90, 30],
    levels: 1,
    memories: 5,
    secretMemories: 0,
    fragment: false,
    puzzle: 'echo-chamber',
    exits: ['crystal-lake', 'ancient-temple'],
  },
  'ancient-temple': {
    id: 'ancient-temple',
    name: 'Ancient Temple',
    purpose: 'The turn',
    kind: 'interior',
    size: [34, 34],
    levels: 1,
    memories: 4,
    secretMemories: 0,
    fragment: true,
    puzzle: 'mirror-altar',
    exits: ['knowledge-library', 'underground-cave', 'floating-islands'],
  },
  'floating-islands': {
    id: 'floating-islands',
    name: 'Floating Islands',
    purpose: 'Ambition — eleven islands across open sky',
    kind: 'aerial',
    size: [400, 400],
    levels: 1,
    memories: 3,
    secretMemories: 1,
    fragment: false,
    puzzle: 'gravity-bridge',
    exits: ['ancient-temple', 'dream-observatory'],
  },
  'dream-observatory': {
    id: 'dream-observatory',
    name: 'Dream Observatory',
    purpose: 'The future, as traceable constellations',
    kind: 'interior',
    size: [28, 28],
    levels: 1,
    memories: 3,
    secretMemories: 0,
    fragment: false,
    puzzle: 'constellation',
    exits: ['floating-islands', 'sky-bridge'],
  },
  'achievement-hall': {
    id: 'achievement-hall',
    name: 'Achievement Hall',
    purpose: 'Recognition — a colonnade of monuments',
    kind: 'interior',
    size: [30, 14],
    levels: 1,
    memories: 2,
    secretMemories: 0,
    fragment: false,
    puzzle: null,
    exits: ['village'],
    gate: {
      restoration: 0.4,
      visibleReason: 'Forty sconces stand at the door, and you can count the ones alight.',
    },
  },
  'sky-bridge': {
    id: 'sky-bridge',
    name: 'Sky Bridge',
    purpose: 'The ascent — a 300 m span, assembled as you cross',
    kind: 'aerial',
    size: [300, 20],
    levels: 1,
    memories: 1,
    secretMemories: 0,
    fragment: false,
    puzzle: 'bridge-assembly',
    exits: ['developer-studio', 'dream-observatory', 'contact-tower'],
    gate: {
      restoration: 0.6,
      fragments: 6,
      visibleReason: 'Its pieces float unassembled in the air, and you can count them.',
    },
  },
  'contact-tower': {
    id: 'contact-tower',
    name: 'Contact Tower',
    purpose: 'The finale, and the way to reach a real person',
    kind: 'interior',
    size: [24, 24],
    levels: 4,
    memories: 1,
    secretMemories: 0,
    fragment: false,
    puzzle: 'core-engine',
    exits: ['sky-bridge'],
    gate: {
      fragments: 8,
      visibleReason: 'The Engine has eight empty sockets, and they are lit from within.',
    },
  },
  'hidden-basement': {
    id: 'hidden-basement',
    name: 'Hidden Basement',
    purpose: "The developer's real room",
    kind: 'interior',
    size: [10, 8],
    levels: 1,
    memories: 0,
    secretMemories: 3,
    fragment: false,
    puzzle: null,
    exits: ['childhood-home'],
    secret: 'Not on any map. It is found, not routed to.',
  },
  'secret-sanctuary': {
    id: 'secret-sanctuary',
    name: 'Secret Sanctuary',
    purpose: 'The Tree of Visitors',
    kind: 'exterior',
    size: [120, 120],
    levels: 1,
    memories: 0,
    secretMemories: 0,
    fragment: false,
    puzzle: null,
    exits: ['village'],
    secret: 'A walled garden, reached only by noticing a gap that should not be there.',
  },
};

export const ALL_AREAS: readonly AreaSpec[] = Object.values(AREA_SPECS);

/** The hundred memories, distributed — GDD Appendix B’s by-area cross-check. */
export const TOTAL_MEMORIES = ALL_AREAS.reduce((sum, area) => sum + area.memories, 0);

/** The five that are revealed on discovery rather than counted toward progress. */
export const TOTAL_SECRET_MEMORIES = ALL_AREAS.reduce((sum, area) => sum + area.secretMemories, 0);

export const areaById = (id: string): AreaSpec | undefined =>
  (AREA_SPECS as Record<string, AreaSpec | undefined>)[id];

/** Every way out, signposted or not — what the pathfinder and the streamer use. */
export const allExits = (area: AreaSpec): readonly AreaId[] => [...area.exits, ...(area.hiddenExits ?? [])];

/**
 * Whether an area's gate is open. Pure, so the whole gating system is testable
 * without a scene — and so a locked area can explain itself rather than being a
 * wall the player bounces off.
 */
export function gateState(
  area: AreaSpec,
  progress: { readonly restoration: number; readonly fragments: number },
): { readonly open: boolean; readonly reason?: string } {
  if (!area.gate) return { open: true };

  const needsRestoration = area.gate.restoration ?? 0;
  const needsFragments = area.gate.fragments ?? 0;

  if (progress.restoration >= needsRestoration && progress.fragments >= needsFragments) {
    return { open: true };
  }
  return { open: false, reason: area.gate.visibleReason };
}
