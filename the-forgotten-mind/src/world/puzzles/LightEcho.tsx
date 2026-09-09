'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DIRECTIONS, lightEcho, upwindOf, type Direction, type EchoState } from '../systems/puzzles';
import { registerInteractable } from '../systems/interact';
import { game, useGame } from '@/state/game';
import { tokens } from '@/generated/tokens';

/**
 * LIGHT ECHO, in the Memory Forest — GDD Part 4 §2.
 *
 * Three unlit lanterns, and a wind whose direction is written all over the
 * place: a ribbon on a pole, and leaves that fall at an angle rather than
 * straight down. Turn each reflector upwind and it catches a drifting mote.
 *
 * The puzzle is trivial on purpose. Its job is to teach *observe → deduce → act*
 * and, more importantly, that the ambient detail in this world carries
 * information instead of decorating it. Everything the player needs is visible
 * before they touch anything.
 *
 * The state machine is imported, not reimplemented: this file draws it and
 * feeds it input. That separation is why the puzzle is proved solvable across a
 * hundred seeds by a unit test that never opens a browser.
 */

const LIT = new THREE.Color(tokens.semantic.color['memory-restored'].hex);
const UNLIT = new THREE.Color(tokens.semantic.color['text-muted'].hex);
const MOTE = new THREE.Color(tokens.semantic.color.accent.hex);

/** Compass → world direction. North is −Z, matching the camera's default facing. */
function toVector(direction: Direction): THREE.Vector3 {
  const index = DIRECTIONS.indexOf(direction);
  const angle = (index / DIRECTIONS.length) * Math.PI * 2;
  return new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle));
}

const LANTERN_AT: readonly (readonly [number, number, number])[] = [
  [-14, 0, -6],
  [2, 0, -16],
  [16, 0, -4],
];

const LEAVES = 40;

export function LightEcho() {
  const seed = useGame((s) => s.save.seed);
  const solvedInSave = useGame((s) => s.save.puzzles['light-echo']);
  const [state, setState] = useState<EchoState>(() => lightEcho.initial(seed));

  const solved = lightEcho.validate(state) || solvedInSave === 'solved' || solvedInSave === 'skipped';
  const wind = useMemo(() => toVector(state.wind), [state.wind]);
  const target = upwindOf(state.wind);

  /* Report the solve once. Everything the puzzle pays out — the memories and
     Fragment I — goes through the same call the skip path uses. */
  const reported = useRef(false);
  useEffect(() => {
    if (!solved || reported.current) return;
    reported.current = true;
    game().completePuzzle('light-echo', 'solved');
  }, [solved]);

  /* Each lantern is an interactable that turns its own reflector. Registering
     them means `[` and `]` reach them, so the puzzle needs no aim. */
  useEffect(() => {
    if (solved) return;
    const drop = state.lanterns.map((lantern, index) => {
      const at = LANTERN_AT[index] ?? [0, 0, 0];
      return registerInteractable({
        id: `lantern-${lantern.id}`,
        title: `A lantern, facing ${lantern.facing}`,
        position: new THREE.Vector3(at[0], at[1] + 1.4, at[2]),
        reach: 3,
        act: () => {
          setState((previous) => lightEcho.apply(previous, { kind: 'rotate', lantern: lantern.id, by: 1 }));
        },
      });
    });
    return () => {
      for (const remove of drop) remove();
    };
  }, [state.lanterns, solved]);

  return (
    <group>
      <WindRibbon wind={wind} />
      <Leaves wind={wind} />
      {state.lanterns.map((lantern, index) => (
        <Lantern
          key={lantern.id}
          position={LANTERN_AT[index] ?? [0, 0, 0]}
          facing={lantern.facing}
          lit={solved || lantern.facing === target}
        />
      ))}
    </group>
  );
}

function Lantern({
  position,
  facing,
  lit,
}: {
  position: readonly [number, number, number];
  facing: Direction;
  lit: boolean;
}) {
  const reflector = useRef<THREE.Group>(null);
  const wanted = useMemo(() => {
    const index = DIRECTIONS.indexOf(facing);
    return (index / DIRECTIONS.length) * Math.PI * 2;
  }, [facing]);

  useFrame((_, delta) => {
    const node = reflector.current;
    if (!node) return;
    // Eased, so a turn reads as a turn rather than a jump.
    node.rotation.y += (wanted - node.rotation.y) * Math.min(1, delta * 7);
  });

  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.4, 8]} />
        <meshStandardMaterial color={UNLIT} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <icosahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial
          color={lit ? LIT : UNLIT}
          emissive={lit ? LIT : UNLIT}
          emissiveIntensity={lit ? 1.4 : 0.05}
          toneMapped={false}
        />
      </mesh>
      {/* The reflector: an open half-shell, so which way it faces is legible
          from across the clearing without any label. */}
      <group ref={reflector} position={[0, 1.55, 0]}>
        <mesh position={[0, 0, -0.34]}>
          <sphereGeometry args={[0.36, 12, 8, 0, Math.PI]} />
          <meshStandardMaterial color={UNLIT} metalness={0.6} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/** The ribbon: the wind, made readable, on a pole you can see from anywhere. */
function WindRibbon({ wind }: { wind: THREE.Vector3 }) {
  const ribbon = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const node = ribbon.current;
    if (!node) return;
    node.rotation.y = Math.atan2(wind.x, wind.z);
    node.rotation.z = Math.sin(clock.elapsedTime * 2.4) * 0.12;
  });

  return (
    <group position={[0, 0, -8]}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 3.2, 6]} />
        <meshStandardMaterial color={UNLIT} roughness={0.9} />
      </mesh>
      <mesh ref={ribbon} position={[0, 3, 0]}>
        <planeGeometry args={[0.18, 1.6]} />
        <meshStandardMaterial color={MOTE} side={THREE.DoubleSide} emissive={MOTE} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/** Leaves that fall *at an angle*. The angle is the answer. */
function Leaves({ wind }: { wind: THREE.Vector3 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () => Array.from({ length: LEAVES }, (_, i) => ({ x: (i * 7.13) % 34 - 17, z: (i * 11.7) % 30 - 20, o: i * 0.37 })),
    [],
  );

  useFrame(({ clock }) => {
    const instanced = mesh.current;
    if (!instanced) return;
    const time = clock.elapsedTime;

    seeds.forEach((leaf, index) => {
      const fall = (time * 0.5 + leaf.o) % 1;
      const height = 5 - fall * 5;
      dummy.position.set(leaf.x + wind.x * fall * 5, height, leaf.z + wind.z * fall * 5);
      dummy.rotation.set(time + leaf.o, time * 0.7 + leaf.o, 0);
      dummy.scale.setScalar(0.09);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, LEAVES]} frustumCulled={false}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={UNLIT} roughness={0.9} />
    </instancedMesh>
  );
}
