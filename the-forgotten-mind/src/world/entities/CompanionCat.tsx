'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { game, useGame } from '@/state/game';
import { registerInteractable } from '../systems/interact';
import { playerPosition } from '../systems/player';
import { tokens } from '@/generated/tokens';

/**
 * The cat — GDD Part 4 §2.
 *
 * It sits on a branch off the main path in the Forest, and it is only found by
 * leaving the path. Once followed, it stays for the rest of the session: it
 * trails three metres behind, sits when you stand still, and purrs near a
 * recovered memory.
 *
 * It has no gameplay function whatsoever, and it will be the single most
 * mentioned thing in anything anyone shares about this project. That is not a
 * joke about cats — it is the reason it is worth the sixty lines.
 */

const LAG = 3; // metres behind the player
const WALK = 3.4; // slightly faster than the player, so it can catch up
const SIT_AFTER = 1.6; // seconds of stillness before it sits
const GREY = tokens.semantic.color['text-body'].hex;
const PURR = tokens.semantic.color['memory-restored'].hex;

type CatState = 'waiting' | 'follow' | 'sit' | 'purr';

export function CompanionCat({
  home,
  purrNear,
}: {
  /** Where it waits, off the path, until someone notices it. */
  home: readonly [number, number, number];
  /** Recovered memory positions — it purrs near these. */
  purrNear: readonly (readonly [number, number, number])[];
}) {
  const adopted = useGame((s) => s.save.hasCat);
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);

  const state = useRef<CatState>('waiting');
  const still = useRef(0);
  const at = useMemo(() => new THREE.Vector3(home[0], home[1], home[2]), [home]);
  const wanted = useMemo(() => new THREE.Vector3(), []);
  const lastPlayer = useMemo(() => new THREE.Vector3(), []);
  const purrPoints = useMemo(
    () => purrNear.map((point) => new THREE.Vector3(point[0], point[1], point[2])),
    [purrNear],
  );

  useEffect(() => {
    if (adopted) return;
    return registerInteractable({
      id: 'cat',
      title: 'A grey cat, watching',
      position: at,
      reach: 2.5,
      act: () => {
        game().adoptCat();
      },
    });
  }, [adopted, at]);

  useFrame((_, rawDelta) => {
    const node = group.current;
    if (!node) return;
    const delta = Math.min(rawDelta, 1 / 30);

    if (!adopted) {
      state.current = 'waiting';
      // It breathes where it sits, so a still cat still looks alive.
      node.position.copy(at);
      node.position.y = at.y + Math.sin(performance.now() / 900) * 0.03;
      return;
    }

    const movedBy = lastPlayer.distanceTo(playerPosition);
    lastPlayer.copy(playerPosition);
    still.current = movedBy < 0.01 ? still.current + delta : 0;

    /* Stand three metres back along the line from the cat to the player, so it
       trails rather than crowds — a companion that walks into your shins is a
       companion people turn off. */
    wanted.copy(playerPosition).sub(node.position);
    const distance = wanted.length();

    if (distance > LAG) {
      wanted.normalize().multiplyScalar(Math.min(WALK * delta, distance - LAG));
      node.position.add(wanted);
      state.current = 'follow';
      still.current = 0;
    } else if (still.current > SIT_AFTER) {
      state.current = purrPoints.some((point) => point.distanceTo(node.position) < 4) ? 'purr' : 'sit';
    }

    node.lookAt(playerPosition.x, node.position.y, playerPosition.z);

    const mesh = body.current;
    if (!mesh) return;
    if (state.current === 'purr') {
      // A slow breath, and it goes gold near something remembered.
      const breath = 1 + Math.sin(performance.now() / 260) * 0.03;
      mesh.scale.set(1, breath, 1);
      (mesh.material as THREE.MeshStandardMaterial).color.set(PURR);
    } else {
      mesh.scale.set(1, state.current === 'sit' ? 0.82 : 1, 1);
      (mesh.material as THREE.MeshStandardMaterial).color.set(GREY);
    }
  });

  return (
    <group ref={group} position={[home[0], home[1], home[2]]}>
      <mesh ref={body} castShadow position={[0, 0.24, 0]}>
        <capsuleGeometry args={[0.16, 0.34, 4, 8]} />
        <meshStandardMaterial color={GREY} roughness={0.85} />
      </mesh>
      {/* Head and tail, so it reads as a cat rather than a pill at ten metres. */}
      <mesh position={[0, 0.5, 0.18]} castShadow>
        <sphereGeometry args={[0.14, 10, 8]} />
        <meshStandardMaterial color={GREY} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.34, -0.3]} rotation={[0.6, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.34, 3, 6]} />
        <meshStandardMaterial color={GREY} roughness={0.85} />
      </mesh>
    </group>
  );
}
