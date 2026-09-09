'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getRestoration, bindRestoration } from '../systems/restoration';
import { settingsFor } from '../quality';
import { useSettings } from '@/state/settings';
import { tokens } from '@/generated/tokens';
import { dressing } from './dressing';

/**
 * The Memory Forest, dressed — GDD Part 4 §2.
 *
 * The restoration visuals are the vertical slice's whole proof: at 0% the forest
 * is bare black trees in grey fog; at 100% it is full canopy, god-rays through
 * the gaps, fireflies, and paths that bloom. A stranger recovering six memories
 * has to *see* it change, or none of the rest of this project means anything.
 *
 * Two performance rules shape the implementation:
 *
 * — **Everything is instanced.** Trunks, canopies and fireflies are three
 *   `InstancedMesh`es, so a hundred and twenty trees cost three draw calls.
 * — **Matrices are rewritten only when restoration actually moves.** Restoration
 *   changes a hundred times in a session, not sixty times a second, so a
 *   threshold on the delta turns a per-frame rebuild into an occasional one.
 *   Without it this file alone would spend more time than the rest of the world
 *   combined.
 */

const TRUNK = tokens.semantic.color['text-muted'].hex;
const LEAF = new THREE.Color(tokens.semantic.color['state-success'].hex);
const SPARK = new THREE.Color(tokens.semantic.color['memory-restored'].hex);

const TREES = 120;
const FIREFLIES = 60;
const EXTENT = 54; // the clearing is left open in the middle

/** Deterministic layout: the same forest every visit. */
function layout(count: number) {
  let state = 0x9e3779b9;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return Array.from({ length: count }, () => {
    // Pushed outward from the centre, so the clearing and its paths stay clear.
    const angle = random() * Math.PI * 2;
    const radius = 12 + random() * EXTENT;
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      height: 5 + random() * 7,
      girth: 0.18 + random() * 0.22,
      lean: (random() - 0.5) * 0.16,
      phase: random() * Math.PI * 2,
    };
  });
}

export function MemoryForest() {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const canopy = useRef<THREE.InstancedMesh>(null);
  const motes = useRef<THREE.InstancedMesh>(null);
  const scene = useThree((s) => s.scene);

  const quality = useSettings((s) => s.quality);
  const foliage = settingsFor(quality).foliage;

  const trees = useMemo(() => layout(TREES), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lastRestoration = useRef(-1);

  /* The fog belongs to the scene, not to this area — so put it back on the way
     out, or every area after the Forest inherits the Forest's weather. */
  useEffect(() => {
    const fog = scene.fog;
    if (!(fog instanceof THREE.Fog)) return;
    const near = fog.near;
    const far = fog.far;
    return () => {
      fog.near = near;
      fog.far = far;
    };
  }, [scene]);

  /* Trunks never change: written once, then left alone for the whole session. */
  useEffect(() => {
    const mesh = trunks.current;
    if (!mesh) return;
    trees.forEach((tree, index) => {
      dummy.position.set(tree.x, tree.height / 2, tree.z);
      dummy.rotation.set(tree.lean, tree.phase, 0);
      dummy.scale.set(tree.girth, tree.height / 2, tree.girth);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [trees, dummy]);

  useFrame(({ clock }) => {
    const restoration = getRestoration();

    /* A hundredth of restoration is roughly one memory in a hundred — the
       smallest change a player could have caused. Anything finer is noise. */
    if (Math.abs(restoration - lastRestoration.current) > 0.01) {
      lastRestoration.current = restoration;

      const look = dressing(restoration, foliage, TREES, FIREFLIES);
      const leaves = canopy.current;
      if (leaves) {
        const visible = look.canopy;
        trees.forEach((tree, index) => {
          const grown = index < visible;
          dummy.position.set(tree.x, tree.height * 0.92, tree.z);
          dummy.rotation.set(0, tree.phase, tree.lean);
          // Bare at zero, full at one — the canopy is the restoration meter.
          dummy.scale.setScalar(grown ? look.canopyScale : 0.001);
          dummy.updateMatrix();
          leaves.setMatrixAt(index, dummy.matrix);
        });
        leaves.instanceMatrix.needsUpdate = true;
      }

      const fog = scene.fog;
      if (fog instanceof THREE.Fog) {
        fog.near = look.fogNear;
        fog.far = look.fogFar;
      }
    }

    // Fireflies arrive late and only at the top of the range.
    const sparks = motes.current;
    if (!sparks) return;
    const alive = dressing(restoration, foliage, TREES, FIREFLIES).fireflies;
    const time = clock.elapsedTime;

    for (let index = 0; index < FIREFLIES; index += 1) {
      if (index >= alive) {
        dummy.scale.setScalar(0.001);
        dummy.position.set(0, -50, 0);
      } else {
        const tree = trees[index % trees.length];
        const drift = time * 0.35 + index;
        dummy.position.set(
          (tree?.x ?? 0) + Math.sin(drift) * 2.4,
          1.2 + Math.sin(drift * 1.7 + index) * 0.9,
          (tree?.z ?? 0) + Math.cos(drift * 0.8) * 2.4,
        );
        dummy.scale.setScalar(0.06 + Math.sin(time * 3 + index) * 0.02);
      }
      dummy.updateMatrix();
      sparks.setMatrixAt(index, dummy.matrix);
    }
    sparks.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, TREES]} castShadow receiveShadow frustumCulled={false}>
        <cylinderGeometry args={[0.7, 1, 2, 5]} />
        <meshStandardMaterial ref={(m) => m && bindRestoration(m)} color={TRUNK} roughness={0.95} flatShading />
      </instancedMesh>

      <instancedMesh ref={canopy} args={[undefined, undefined, TREES]} castShadow frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          ref={(m) => m && bindRestoration(m)}
          color={LEAF}
          roughness={0.8}
          flatShading
          transparent
          opacity={0.92}
        />
      </instancedMesh>

      <instancedMesh ref={motes} args={[undefined, undefined, FIREFLIES]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshStandardMaterial color={SPARK} emissive={SPARK} emissiveIntensity={2.4} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
