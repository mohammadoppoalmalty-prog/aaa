import type { Metadata } from 'next';
import { allMemories } from '@/content/loader';
import { GREYBOX_MEMORIES } from '@/content/greybox';
import type { MoteSpec } from '@/world/entities/Memories';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LumaIntent } from '@/world/systems/luma/fallback';
import { WorldShell } from './WorldShell';

export const metadata: Metadata = {
  title: 'The world',
  description: 'The 3D layer. Everything inside it is also readable in the Codex.',
  robots: { index: false, follow: true },
};

/** Where the Gate's first memories stand. Anchors move to the area manifest
 *  once the Gate is art-passed; the positions are the blockout's, not the art's. */
const GATE_ANCHORS = GREYBOX_MEMORIES.map((memory) => memory.position);

/**
 * The world route is a thin server shell: it resolves which memories exist and
 * where they stand, then hands a plain array to the client engine. Nothing about
 * the content layer is bundled into the world's JavaScript.
 */
/* LUMA's tree is read on the server and handed over as data. The world ships
   the matcher, which is forty lines; it does not ship a JSON loader or the
   file's parse cost. */
function lumaIntents(): LumaIntent[] {
  const path = resolve(process.cwd(), 'content/luma/fallback.json');
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
  const intents = (parsed as { intents?: LumaIntent[] }).intents;
  return Array.isArray(intents) ? intents : [];
}

export default function WorldPage() {
  const memories = allMemories();

  /* Until the memories are authored, both layers fall back to the same
     scaffolding — defined once in src/content/greybox.ts, so the world and the
     Codex can never disagree about which memories exist. */
  const motes: MoteSpec[] =
    memories.length > 0
      ? memories.slice(0, GATE_ANCHORS.length).map((memory, index) => ({
          id: memory.data.id,
          title: memory.data.title,
          area: memory.data.area,
          position: GATE_ANCHORS[index] ?? [0, 1.2, 0],
        }))
      : GREYBOX_MEMORIES.map((memory) => ({
          id: memory.id,
          title: memory.title,
          area: memory.area,
          position: memory.position,
        }));

  return <WorldShell motes={motes} total={motes.length} lumaIntents={lumaIntents()} />;
}
