'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tokens } from '@/generated/tokens';
import { AREA_SPECS, gateState, TOTAL_MEMORIES, type AreaId } from './manifest';
import { canTravel, restorationOf } from '../systems/director';
import { registerInteractable } from '../systems/interact';
import { game, useGame } from '@/state/game';

/**
 * A way out, standing where you can see it.
 *
 * A locked exit is never a blank wall (GDD Part 4): it keeps its shape, changes
 * colour, and says what it is waiting for. It also stays *registered* while
 * locked, so `[` and `]` still reach it and a screen reader still announces the
 * reason — a door you cannot open is still information.
 */

const OPEN = new THREE.Color(tokens.semantic.color.accent.hex);
const LOCKED = new THREE.Color(tokens.semantic.color['text-muted'].hex);
const REACH = 3.5;

export function ExitMarker({
  from,
  to,
  position,
}: {
  from: AreaId;
  to: AreaId;
  position: readonly [number, number, number];
}) {
  const recovered = useGame((s) => s.save.memories.length);
  const revealedAll = useGame((s) => s.save.revealedAll);
  const fragmentsHeld = useGame((s) => s.fragmentsHeld);

  const target = AREA_SPECS[to];
  const progress = useMemo(
    () => ({
      restoration: revealedAll ? 1 : restorationOf(recovered, TOTAL_MEMORIES),
      fragments: fragmentsHeld(),
    }),
    [recovered, revealedAll, fragmentsHeld],
  );

  const verdict = useMemo(() => canTravel(from, to, progress), [from, to, progress]);
  const gate = useMemo(() => gateState(target, progress), [target, progress]);

  const mesh = useRef<THREE.Mesh>(null);
  const here = useMemo(() => new THREE.Vector3(position[0], position[1] + 1.2, position[2]), [position]);

  useEffect(
    () =>
      registerInteractable({
        id: `exit:${to}`,
        title: verdict.ok ? `Walk to ${target.name}` : `${target.name} — ${gate.reason ?? 'not open yet'}`,
        position: here,
        reach: REACH,
        /* A locked exit stays enabled so it can be found and read. Acting on it
           does nothing but say why, which is the honest behaviour: the player
           learns the requirement instead of bouncing off silence. */
        act: () => {
          if (!verdict.ok) return false;
          game().setArea(to);
        },
      }),
    [to, target.name, verdict, gate.reason, here],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    if (node) node.rotation.y = clock.elapsedTime * 0.4;
  });

  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh ref={mesh} position={[0, 1.2, 0]}>
        <torusGeometry args={[0.9, 0.08, 8, 24]} />
        <meshStandardMaterial
          color={verdict.ok ? OPEN : LOCKED}
          emissive={verdict.ok ? OPEN : LOCKED}
          emissiveIntensity={verdict.ok ? 0.8 : 0.15}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.7, 24]} />
        <meshBasicMaterial color={verdict.ok ? OPEN : LOCKED} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
