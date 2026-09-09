'use client';

import type * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { tokens } from '@/generated/tokens';
import { bindRestoration } from '../systems/restoration';

/* Every surface opts into the one restoration uniform, so scrubbing the world
   from forgotten to whole costs a single float write. */
const bind = (material: THREE.Material | null) => {
  if (material) bindRestoration(material);
};

/**
 * The Phase-0 grey-box: an empty plane with just enough geometry to prove the
 * controller. Every shape here exists to test one number from GDD Part 7 —
 * the 0.35 m step, the 45° slope limit, the 0.4 m capsule radius — so a
 * regression in the controller is visible in ten seconds instead of a level.
 */

const GROUND = tokens.semantic.color['canvas-raised'].hex;
const PROP = tokens.semantic.color['text-muted'].hex;
const MARK = tokens.semantic.color.accent.hex;

const HALF = 60;

export function Blockout() {
  return (
    <>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <boxGeometry args={[HALF * 2, HALF * 2, 0.1]} />
          <meshStandardMaterial ref={bind} color={GROUND} roughness={0.95} />
        </mesh>
      </RigidBody>

      {/* A 2 m grid: the world is authored in metres, so the floor says so. */}
      <gridHelper args={[HALF * 2, HALF, MARK, PROP]} position={[0, 0.01, 0]}>
        <meshBasicMaterial attach="material" transparent opacity={0.12} />
      </gridHelper>

      {/* Steps at exactly the autostep height, then one above it — the second
          set must stop the player, or autostep is misconfigured. */}
      <Steps position={[-8, 0, -6]} rise={0.35} />
      <Steps position={[-4, 0, -6]} rise={0.5} />

      {/* Ramps either side of the 45° slope limit. */}
      <Ramp position={[4, 0, -8]} degrees={30} />
      <Ramp position={[10, 0, -8]} degrees={55} />

      {/* A gap narrower than the capsule, and one wider. */}
      <Wall position={[-2, 0, 6]} />
      <Wall position={[-1.2, 0, 6]} />
      <Wall position={[3, 0, 6]} />
      <Wall position={[4.6, 0, 6]} />
    </>
  );
}

function Steps({ position, rise }: { position: [number, number, number]; rise: number }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3].map((i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow position={[0, rise * i + rise / 2, -i * 0.6]}>
            <boxGeometry args={[2.4, rise, 0.6]} />
            <meshStandardMaterial ref={bind} color={PROP} roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}

function Ramp({ position, degrees }: { position: [number, number, number]; degrees: number }) {
  const radians = (degrees * Math.PI) / 180;
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position} rotation={[-radians, 0, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 0.2, 6]} />
        <meshStandardMaterial ref={bind} color={PROP} roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}

function Wall({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
        <boxGeometry args={[0.3, 2.4, 3]} />
        <meshStandardMaterial ref={bind} color={PROP} roughness={0.9} />
      </mesh>
    </RigidBody>
  );
}
