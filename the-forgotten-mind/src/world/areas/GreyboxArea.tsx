'use client';

import { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import type * as THREE from 'three';
import { tokens } from '@/generated/tokens';
import { bindRestoration } from '../systems/restoration';
import { type AreaSpec } from './manifest';
import { exitRing } from './layout';
import { ExitMarker } from './ExitMarker';

/**
 * A walkable blockout, generated from the area manifest.
 *
 * Phase 1 asks for grey-box wireframes of all nineteen areas *before* any art
 * exists, so pacing problems surface in week four rather than week twenty.
 * Hand-modelling nineteen blockouts would take a week and go stale the first
 * time a footprint changes; generating them from the table that already holds
 * every footprint, level count and exit takes none, and cannot drift.
 *
 * It is deliberately crude. A blockout that looks finished stops people from
 * saying what is wrong with it.
 */

const GROUND = tokens.semantic.color['canvas-raised'].hex;
const PROP = tokens.semantic.color['text-muted'].hex;
const bind = (material: THREE.Material | null) => {
  if (material) bindRestoration(material);
};

/** Deterministic per-area scatter — the same area is the same shape every run. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const hash = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export function GreyboxArea({ spec, landmarks: showLandmarks = true }: { spec: AreaSpec; landmarks?: boolean }) {
  const [width, depth] = spec.size;
  const interior = spec.kind === 'interior' || spec.kind === 'cave';

  /* Landmarks: enough massing to read scale and sightlines, and no more. The
     count scales with footprint so a 15 m room is not as busy as a 200 m plaza. */
  const landmarks = useMemo(() => {
    const random = seeded(hash(spec.id));
    const count = Math.round(Math.min(26, Math.max(4, (width * depth) / 420)));
    return Array.from({ length: count }, () => {
      const height = 2 + random() * (interior ? 2 : 9);
      return {
        x: (random() - 0.5) * width * 0.82,
        z: (random() - 0.5) * depth * 0.82,
        w: 1.4 + random() * (interior ? 1.6 : 5),
        d: 1.4 + random() * (interior ? 1.6 : 5),
        h: height,
      };
    });
  }, [spec.id, width, depth, interior]);

  /* Exits sit on the rim, spread around it, so a player can see every way out
     from the middle of the area — the single most useful property of a blockout.
     The ring is shared with whatever dresses the area, so a door and the building
     built around it cannot end up in different places. */
  const exits = useMemo(() => exitRing(spec), [spec]);

  return (
    <group>
      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial ref={bind} color={GROUND} roughness={0.95} />
        </mesh>
      </RigidBody>

      {/* A 2 m grid: the world is authored in metres, so the floor says so. */}
      <gridHelper args={[Math.max(width, depth), Math.round(Math.max(width, depth) / 2), PROP, PROP]} position={[0, 0.02, 0]}>
        <meshBasicMaterial attach="material" transparent opacity={0.1} />
      </gridHelper>

      {/* Walls, for anything that has them — an interior with no walls reads as
          an exterior and every judgement about its scale comes out wrong. */}
      {interior ? <Walls width={width} depth={depth} height={3.2 * spec.levels} /> : null}

      {/* Upper storeys, as slabs with a stair-sized gap at one edge. */}
      {Array.from({ length: Math.max(0, spec.levels - 1) }, (_, level) => (
        <RigidBody key={level} type="fixed" colliders="cuboid">
          <mesh receiveShadow castShadow position={[0, 3.2 * (level + 1), -depth * 0.18]}>
            <boxGeometry args={[width * 0.94, 0.2, depth * 0.6]} />
            <meshStandardMaterial ref={bind} color={PROP} roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}

      {(showLandmarks ? landmarks : []).map((mark, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow position={[mark.x, mark.h / 2, mark.z]}>
            <boxGeometry args={[mark.w, mark.h, mark.d]} />
            <meshStandardMaterial ref={bind} color={PROP} roughness={0.92} />
          </mesh>
        </RigidBody>
      ))}

      {exits.map((exit) => (
        <ExitMarker key={exit.to} from={spec.id} to={exit.to} position={exit.position} />
      ))}
    </group>
  );
}

function Walls({ width, depth, height }: { width: number; depth: number; height: number }) {
  const thickness = 0.4;
  const walls: readonly [number, number, number, number, number][] = [
    [0, height / 2, -depth / 2, width, thickness],
    [0, height / 2, depth / 2, width, thickness],
    [-width / 2, height / 2, 0, thickness, depth],
    [width / 2, height / 2, 0, thickness, depth],
  ];
  return (
    <>
      {walls.map(([x, y, z, w, d], index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[x, y, z]}>
            <boxGeometry args={[w, height, d]} />
            <meshStandardMaterial ref={bind} color={GROUND} roughness={0.98} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
