'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { registerInteractable } from '../systems/interact';
import { tokens } from '@/generated/tokens';

/**
 * The grate in the middle of the plaza.
 *
 * The anchor lives in the scene; the puzzle it opens is DOM. Splitting them that
 * way keeps the thing you walk up to in the world and the thing you operate in
 * the layer that already knows how to be operated.
 */
export function FountainAnchor({ solved, onOpen }: { solved: boolean; onOpen: () => void }) {
  const at = useMemo(() => new THREE.Vector3(0, 0.4, 0), []);

  useEffect(
    () =>
      registerInteractable({
        id: 'fountain-grate',
        title: solved ? 'The fountain, running' : 'A grate, and pipes below it',
        position: at,
        reach: 3.5,
        act: onOpen,
      }),
    [at, solved, onOpen],
  );

  const colour = solved ? tokens.semantic.color.accent.hex : tokens.semantic.color['text-muted'].hex;

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 2.4, 6]} />
        <meshStandardMaterial color={colour} roughness={0.8} />
      </mesh>
      {/* The basin. Its water level is the restoration meter once it runs. */}
      <mesh position={[0, solved ? 0.5 : 0.12, 0]}>
        <cylinderGeometry args={[1.5, 1.5, solved ? 0.9 : 0.1, 16]} />
        <meshStandardMaterial
          color={colour}
          transparent
          opacity={solved ? 0.5 : 0.25}
          emissive={colour}
          emissiveIntensity={solved ? 0.5 : 0}
        />
      </mesh>
    </group>
  );
}
