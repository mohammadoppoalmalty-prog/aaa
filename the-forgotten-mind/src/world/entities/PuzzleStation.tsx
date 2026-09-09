'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { registerInteractable } from '../systems/interact';
import { registry } from '../systems/puzzles/framework';
import { useGame } from '@/state/game';
import { tokens } from '@/generated/tokens';

/**
 * The thing in an area that a puzzle is played on.
 *
 * One station serves all thirteen. What differs between a workbench and an
 * altar is the model, and there are no models yet — so rather than thirteen
 * near-identical placeholder components, there is one that reads its title from
 * the puzzle registry and stands where the area's puzzle lives.
 *
 * It stays registered after it is solved, and says so. A puzzle that vanishes
 * on completion takes with it the only evidence the player did anything.
 */

const DONE = tokens.semantic.color['state-success'].hex;
const OPEN = tokens.semantic.color.accent.hex;

export function PuzzleStation({
  puzzleId,
  position = [0, 0, -8],
  onOpen,
}: {
  puzzleId: string;
  position?: readonly [number, number, number];
  onOpen: () => void;
}) {
  const status = useGame((s) => s.save.puzzles[puzzleId]);
  const done = status === 'solved' || status === 'skipped';

  const puzzle = registry.get(puzzleId);
  const at = useMemo(() => new THREE.Vector3(position[0], 1, position[2]), [position]);

  useEffect(() => {
    if (!puzzle) return;
    return registerInteractable({
      id: `puzzle-${puzzleId}`,
      title: done ? `${puzzle.title} — done` : puzzle.title,
      position: at,
      reach: 3.5,
      act: onOpen,
    });
  }, [puzzle, puzzleId, done, at, onOpen]);

  if (!puzzle) return null;
  const colour = done ? DONE : OPEN;

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* A table, because every one of these is something you lean over. */}
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[1.8, 0.12, 1.1]} />
        <meshStandardMaterial color={tokens.semantic.color['text-muted'].hex} roughness={0.9} />
      </mesh>
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} castShadow position={[x, 0.37, 0]}>
          <boxGeometry args={[0.12, 0.75, 0.9]} />
          <meshStandardMaterial color={tokens.semantic.color['text-muted'].hex} roughness={0.95} />
        </mesh>
      ))}
      {/* What is on it: lit while it waits, green once it is finished. */}
      <mesh position={[0, 0.87, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshStandardMaterial
          color={colour}
          emissive={colour}
          emissiveIntensity={done ? 0.7 : 1.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
