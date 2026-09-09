'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tokens } from '@/generated/tokens';
import { AREA_SPECS, gateState, type AreaId } from './manifest';
import { canTravel, restorationOf } from '../systems/director';
import { interactable, playerPosition } from '../systems/player';
import { game, useGame } from '@/state/game';
import { TOTAL_MEMORIES } from './manifest';

/**
 * A way out, standing where you can see it.
 *
 * A locked exit is never a blank wall (GDD Part 4): it keeps its shape, changes
 * colour, and says what it is waiting for. Being able to see the thing you have
 * not earned yet is what makes earning it feel like a route rather than a wall.
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

  const target = AREA_SPECS[to];
  const progress = useMemo(
    () => ({
      restoration: revealedAll ? 1 : restorationOf(recovered, TOTAL_MEMORIES),
      /* Fragments arrive with the puzzle framework; until then the gates that
         need them stay visibly shut, which is the honest state. */
      fragments: 0,
    }),
    [recovered, revealedAll],
  );

  const verdict = useMemo(() => canTravel(from, to, progress), [from, to, progress]);
  const gate = useMemo(() => gateState(target, progress), [target, progress]);

  const mesh = useRef<THREE.Mesh>(null);
  const inReach = useRef(false);
  const here = useMemo(() => new THREE.Vector3(position[0], position[1] + 1.2, position[2]), [position]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!inReach.current) return;
      if (event.code !== 'KeyE' && event.code !== 'Enter') return;
      event.preventDefault();
      if (!verdict.ok) return;
      game().setArea(to);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [to, verdict]);

  useFrame(({ clock }) => {
    const node = mesh.current;
    if (!node) return;
    node.rotation.y = clock.elapsedTime * 0.4;

    const within = playerPosition.distanceTo(here) < REACH;
    if (within === inReach.current) return;
    inReach.current = within;

    /* The exit competes with memories for the interaction slot; whichever the
       player is standing next to wins, and the prompt always names it. */
    if (within) {
      interactable.current = {
        id: `exit:${to}`,
        title: verdict.ok ? `Walk to ${target.name}` : `${target.name} — ${gate.reason ?? 'not yet'}`,
      };
    } else if (interactable.current?.id === `exit:${to}`) {
      interactable.current = null;
    }
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
