'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { game, useGame } from '@/state/game';
import { setRestoration } from '../systems/restoration';
import { interactable, playerPosition } from '../systems/player';
import { tokens } from '@/generated/tokens';

/**
 * Memory motes — the grey-box form of the recovery loop.
 *
 * Everything per-frame here writes to refs and to the DOM directly: the
 * proximity test, the prompt, and the mote's own float and pulse. The only
 * React commit in the whole interaction is the one that recovers a memory, and
 * that is a state change a visitor caused, not a frame.
 *
 * All motes are one `InstancedMesh` — architecture Rule 3. A hundred of these
 * must cost one draw call, not a hundred.
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
  const nearest = useRef<MoteSpec | null>(null);
  const prompt = useRef<HTMLDivElement | null>(null);

  /* Restoration is a pure function of progress, so it is set wherever progress
     changes rather than tracked as a second source of truth. */
  useEffect(() => {
    const count = revealedAll ? total : recovered.length;
    setRestoration(total === 0 ? 0 : count / total);
  }, [recovered.length, revealedAll, total]);

  /* The prompt is a DOM node the world writes into — no React in the hot path. */
  useEffect(() => {
    const node = document.createElement('div');
    node.className = 'tfm-prompt';
    node.hidden = true;
    document.body.append(node);
    prompt.current = node;
    return () => node.remove();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' && event.code !== 'Space' && event.code !== 'Enter') return;
      const target = nearest.current;
      if (!target) return;
      event.preventDefault();
      game().recoverMemory(target.id);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      interactable.current = null;
    };
  }, []);

  /* Which motes are taken changes a handful of times per session, so the colour
     attribute is written then — not sixty times a second for no reason. */
  const taken = useMemo(
    () => new Set(revealedAll ? motes.map((m) => m.id) : recovered),
    [revealedAll, recovered, motes],
  );

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
    let closest: MoteSpec | null = null;
    let closestDistance = REACH;

    for (const [index, mote] of motes.entries()) {
      const [x, y, z] = mote.position;
      const isTaken = taken.has(mote.id);
      const bob = Math.sin(time * 1.3 + index) * 0.14;

      dummy.position.set(x, y + bob + (isTaken ? 0.5 : 0), z);
      dummy.rotation.y = time * 0.5 + index;
      dummy.scale.setScalar(isTaken ? 0.18 : 0.32);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);

      if (isTaken) continue;
      const distance = playerPosition.distanceTo(dummy.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = mote;
      }
    }

    instanced.instanceMatrix.needsUpdate = true;

    /* The prompt is written straight into the DOM when the nearest interactable
       changes — a few times a minute, not a few times a second, and never a
       React commit either way. */
    if (closest !== nearest.current) {
      nearest.current = closest;
      interactable.current = closest;
      const node = prompt.current;
      if (node) {
        node.hidden = closest === null;
        node.textContent = closest === null ? '' : `◈  ${closest.title}   —   press E`;
      }
    }
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
