'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { game, useGame } from '@/state/game';
import { setRestoration } from '../systems/restoration';
import { registerInteractable } from '../systems/interact';
import { tokens } from '@/generated/tokens';

/**
 * Memory motes — the recovery loop.
 *
 * All motes are one `InstancedMesh` (architecture Rule 3): a hundred of these
 * must cost one draw call, not a hundred. Their float and spin are written to
 * the instance matrix each frame; nothing else here touches React.
 *
 * Interaction is *registered* rather than detected here. One arbiter decides
 * what `E` means, so a mote standing beside an exit cannot fight it for the
 * prompt — which is exactly what happened when each entity wrote its own.
 */

const REACH = 3; // metres — GDD Part 8's interaction radius
const GOLD = new THREE.Color(tokens.semantic.color['memory-restored'].hex);
const LOST = new THREE.Color(tokens.semantic.color['memory-lost'].hex);

export interface MoteSpec {
  readonly id: string;
  readonly title: string;
  readonly area: string;
  readonly position: readonly [number, number, number];
}

export function Memories({ motes, total }: { motes: readonly MoteSpec[]; total: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const recovered = useGame((s) => s.save.memories);
  const revealedAll = useGame((s) => s.save.revealedAll);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  /* Restoration is a pure function of progress, so it is set wherever progress
     changes rather than tracked as a second source of truth. */
  useEffect(() => {
    const count = revealedAll ? total : recovered.length;
    setRestoration(total === 0 ? 0 : count / total);
  }, [recovered.length, revealedAll, total]);

  const taken = useMemo(
    () => new Set(revealedAll ? motes.map((m) => m.id) : recovered),
    [revealedAll, recovered, motes],
  );

  /* Register every un-recovered mote, and drop it the moment it is taken — the
     prompt must never offer something that is already in hand. */
  useEffect(() => {
    const drop = motes
      .filter((mote) => !taken.has(mote.id))
      .map((mote) =>
        registerInteractable({
          id: mote.id,
          title: mote.title,
          position: new THREE.Vector3(mote.position[0], mote.position[1], mote.position[2]),
          reach: REACH,
          act: () => {
            game().recoverMemory(mote.id);
          },
        }),
      );
    return () => {
      for (const remove of drop) remove();
    };
  }, [motes, taken]);

  /* Which motes are taken changes a handful of times per session, so the colour
     attribute is written then — not sixty times a second for no reason. */
  useEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    motes.forEach((mote, index) => instanced.setColorAt(index, taken.has(mote.id) ? GOLD : LOST));
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  }, [motes, taken]);

  useFrame(({ clock }) => {
    const instanced = mesh.current;
    if (!instanced) return;
    const time = clock.elapsedTime;

    for (const [index, mote] of motes.entries()) {
      const [x, y, z] = mote.position;
      const isTaken = taken.has(mote.id);
      const bob = Math.sin(time * 1.3 + index) * 0.14;

      dummy.position.set(x, y + bob + (isTaken ? 0.5 : 0), z);
      dummy.rotation.y = time * 0.5 + index;
      dummy.scale.setScalar(isTaken ? 0.18 : 0.32);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, Math.max(motes.length, 1)]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        emissive={GOLD}
        emissiveIntensity={0.9}
        roughness={0.25}
        metalness={0.1}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
