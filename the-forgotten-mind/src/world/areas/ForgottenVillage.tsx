'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { getRestoration, bindRestoration } from '../systems/restoration';
import { AREA_SPECS } from './manifest';
import { exitRing } from './layout';
import { villageDressing } from './dressing';
import { tokens } from '@/generated/tokens';

/**
 * The Forgotten Village — the hub, dressed.
 *
 * Its one structural idea: **a building per way out, standing exactly where that
 * way out stands.** The workshop door *is* the workshop exit. A hub whose
 * architecture is decoration and whose exits are markers floating in front of it
 * teaches a player to read the markers and ignore the village; putting them in
 * the same place makes the architecture the navigation, which is the only reason
 * to build a hub as a place at all.
 *
 * The plaza therefore needs no signage, and the ring comes from `exitRing` — the
 * same function the blockout uses — so a door and its building cannot drift.
 */

const WALL = tokens.semantic.color['text-muted'].hex;
const ROOF = tokens.semantic.color['accent-alt-deep'].hex;
const POST = tokens.semantic.color['text-muted'].hex;
const LIT = new THREE.Color(tokens.semantic.color['memory-restored'].hex);
const WATER = new THREE.Color(tokens.semantic.color.accent.hex);

export function ForgottenVillage({ fountainRunning }: { fountainRunning: boolean }) {
  const spec = AREA_SPECS.village;

  /* Buildings sit a little further out than their doors, so the door is on the
     face of the building rather than inside it. */
  const buildings = useMemo(
    () =>
      exitRing(spec).map((exit, index) => {
        const target = AREA_SPECS[exit.to];
        const depth = 7 + (index % 3) * 2;
        return {
          to: exit.to,
          name: target.name,
          // Pushed back by half its own depth plus a doorstep.
          position: [exit.position[0] * 1.12, 0, exit.position[2] * 1.12] as [number, number, number],
          /* The front face, a few centimetres proud of the wall. Placing the
             window at the building's *centre* buries it inside the geometry —
             lit, correct, and invisible. */
          face: (() => {
            const length = Math.hypot(exit.position[0], exit.position[2]) || 1;
            const inward = depth / 2 + 0.06;
            return [
              exit.position[0] * 1.12 - (exit.position[0] / length) * inward,
              0,
              exit.position[2] * 1.12 - (exit.position[2] / length) * inward,
            ] as [number, number, number];
          })(),
          facing: exit.facing,
          width: 8 + (index % 4) * 1.6,
          depth,
          // Storeys follow the real area: the two-floor Childhood Home looks it.
          height: 4 + Math.min(2, target.levels - 1) * 2.6,
        };
      }),
    [spec],
  );

  /* Lamp posts stand between the doors, so the ring of light does not compete
     with the ring of buildings for the same spots. */
  const lamps = useMemo(
    () =>
      exitRing(spec).map((exit, index, all) => {
        const between = exit.angle + Math.PI / all.length;
        const radius = Math.hypot(exit.position[0], exit.position[2]) * 0.55;
        return [Math.cos(between) * radius, 0, Math.sin(between) * radius] as [number, number, number];
      }),
    [spec],
  );

  const windows = useRef<THREE.InstancedMesh>(null);
  const lampHeads = useRef<THREE.InstancedMesh>(null);
  const water = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const last = useRef(-1);

  useFrame(() => {
    const restoration = getRestoration();
    if (Math.abs(restoration - last.current) <= 0.01) return;
    last.current = restoration;

    const look = villageDressing(restoration, buildings.length, fountainRunning);

    const panes = windows.current;
    if (panes) {
      buildings.forEach((building, index) => {
        const lit = index < look.litBuildings;
        dummy.position.set(building.face[0], building.height * 0.45, building.face[2]);
        dummy.rotation.set(0, building.facing, 0);
        // A window, not a shopfront: taller than it is wide reads as a house.
        dummy.scale.set(lit ? building.width * 0.2 : 0.001, lit ? 1.4 : 0.001, 0.1);
        dummy.updateMatrix();
        panes.setMatrixAt(index, dummy.matrix);
      });
      panes.instanceMatrix.needsUpdate = true;
    }

    const heads = lampHeads.current;
    if (heads) {
      lamps.forEach((position, index) => {
        dummy.position.set(position[0], 3.1, position[2]);
        // The glow grows with restoration; the post itself never moves.
        dummy.scale.setScalar(0.16 + look.lampIntensity * 0.1);
        dummy.updateMatrix();
        heads.setMatrixAt(index, dummy.matrix);
      });
      heads.instanceMatrix.needsUpdate = true;
      const material = heads.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = look.lampIntensity;
    }

    const basin = water.current;
    if (basin) {
      /* Scaling a unit cylinder and lifting it by half keeps the water sitting
         on the bottom of the basin instead of growing in both directions. */
      basin.scale.set(1, Math.max(0.001, look.waterHeight), 1);
      basin.position.y = 0.1 + Math.max(0, look.waterHeight) / 2;
      basin.visible = look.waterHeight > 0.01;
    }
  });

  return (
    <group>
      {buildings.map((building) => (
        <RigidBody key={building.to} type="fixed" colliders="cuboid">
          <group position={building.position} rotation={[0, building.facing, 0]}>
            <mesh castShadow receiveShadow position={[0, building.height / 2, 0]}>
              <boxGeometry args={[building.width, building.height, building.depth]} />
              <meshStandardMaterial ref={(m) => m && bindRestoration(m)} color={WALL} roughness={0.94} />
            </mesh>
            {/* A roof, because a box is a crate and a box with a roof is a house. */}
            <mesh castShadow position={[0, building.height + 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[building.width * 0.78, 1.8, 4]} />
              <meshStandardMaterial ref={(m) => m && bindRestoration(m)} color={ROOF} roughness={0.9} flatShading />
            </mesh>
          </group>
        </RigidBody>
      ))}

      {/* Lit windows, as one instanced sheet — the village's restoration meter. */}
      <instancedMesh ref={windows} args={[undefined, undefined, buildings.length]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={LIT} emissive={LIT} emissiveIntensity={1.6} toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>

      {lamps.map((position, index) => (
        <RigidBody key={index} type="fixed" colliders="cuboid">
          <mesh castShadow position={[position[0], 1.5, position[2]]}>
            <cylinderGeometry args={[0.12, 0.16, 3, 6]} />
            <meshStandardMaterial ref={(m) => m && bindRestoration(m)} color={POST} roughness={0.9} />
          </mesh>
        </RigidBody>
      ))}

      <instancedMesh ref={lampHeads} args={[undefined, undefined, buildings.length]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={LIT} emissive={LIT} emissiveIntensity={1} toneMapped={false} />
      </instancedMesh>

      {/* The water the grate puzzle releases. Hidden until it runs. */}
      <mesh ref={water} position={[0, 0.1, 0]} visible={false}>
        <cylinderGeometry args={[1.45, 1.45, 1, 16]} />
        <meshStandardMaterial color={WATER} transparent opacity={0.55} emissive={WATER} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}
