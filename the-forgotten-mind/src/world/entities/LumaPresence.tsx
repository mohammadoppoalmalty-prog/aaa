'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { registerInteractable } from '../systems/interact';
import { playerPosition } from '../systems/player';
import { getRestoration } from '../systems/restoration';
import { tokens } from '@/generated/tokens';
import styles from './luma-presence.module.css';

/**
 * LUMA's arrival — GDD Part 4 §2.
 *
 * At the first fork in the Forest it comes out of a cracked stone and speaks its
 * first complete sentence. This is also the first save point, which is why the
 * moment is worth building properly: it is where a visitor decides whether
 * anything is listening.
 *
 * It is an object in the world, not a UI element. Its speech types at 45
 * characters a second over a subtitle-safe backing, and Reduced Motion prints
 * the whole line at once — the words are the content, the typing is not.
 */

const TYPE_RATE = 45; // characters per second, GDD Part 8
const TRIGGER = 9; // metres — close enough to be met rather than approached

const CORE = new THREE.Color(tokens.semantic.color['accent-alt'].hex);

const LINES = [
  'You came back.',
  'I am not what I was. Neither is any of this.',
  'Everything here belongs to someone who stopped visiting. Find enough of it and the place remembers itself.',
  'You can leave whenever you like. Ask me and I will open the whole archive at once — that is not giving up, it is just a different way in.',
] as const;

export function LumaPresence({ at = [0, 0, -4] as const }: { at?: readonly [number, number, number] }) {
  const [met, setMet] = useState(false);
  const [line, setLine] = useState(0);

  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const home = useMemo(() => new THREE.Vector3(at[0], at[1] + 1.1, at[2]), [at]);

  /* Meeting it is not an interaction — walking near is enough. A first contact
     that has to be requested is not an arrival. */
  useFrame(({ clock }) => {
    if (!met && playerPosition.distanceTo(home) < TRIGGER) setMet(true);

    const time = clock.elapsedTime;
    if (core.current) {
      core.current.position.y = home.y + Math.sin(time * 1.1) * 0.12;
      core.current.rotation.y = time * 0.6;
    }
    if (shell.current) {
      shell.current.rotation.x = time * 0.31;
      shell.current.rotation.z = time * 0.22;
      // It brightens as the world does — one uniform, read here as a number.
      const material = shell.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.16 + getRestoration() * 0.34;
    }
  });

  useEffect(() => {
    if (!met) return;
    return registerInteractable({
      id: 'luma',
      title: line < LINES.length - 1 ? 'Listen to LUMA' : 'Ask LUMA something (L)',
      position: home,
      reach: 4,
      act: () => {
        setLine((previous) => Math.min(previous + 1, LINES.length - 1));
      },
    });
  }, [met, line, home]);

  /* The subtitle is a DOM node, not a label in the scene. It has to stay
     readable at any distance, survive Reduced Motion, and be announced by a
     screen reader — three things a texture does badly and an aria-live
     paragraph does for nothing. */
  const subtitle = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!met) return;
    const element = document.createElement('div');
    element.className = styles.speech ?? '';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    document.body.append(element);
    subtitle.current = element;
    return () => {
      element.remove();
      subtitle.current = null;
    };
  }, [met]);

  /* The typewriter writes into the node directly.
     Forty-five characters a second through React state would be forty-five
     commits a second — the exact thing architecture Rule 1 exists to prevent,
     and the CI gate would be right to fail it. The text is the content; where
     it is stored is not. */
  useEffect(() => {
    if (!met) return;
    const element = subtitle.current;
    if (!element) return;

    const text = LINES[line] ?? '';
    const tail = line < LINES.length - 1 ? '  ▸' : '';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = text + tail;
      return;
    }

    element.textContent = '';
    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      element.textContent = index >= text.length ? text + tail : text.slice(0, index);
      if (index >= text.length) window.clearInterval(id);
    }, 1000 / TYPE_RATE);
    return () => window.clearInterval(id);
  }, [met, line]);

  return (
    <>
      <group position={[at[0], at[1], at[2]]}>
        {/* The cracked stone it comes out of, left standing afterwards. */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color={tokens.semantic.color['text-muted'].hex} roughness={0.95} flatShading />
        </mesh>

        {met ? (
          <>
            <mesh ref={core} position={[0, 1.1, 0]}>
              <icosahedronGeometry args={[0.22, 1]} />
              <meshStandardMaterial color={CORE} emissive={CORE} emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
            <mesh ref={shell} position={[0, 1.1, 0]}>
              <icosahedronGeometry args={[0.5, 0]} />
              <meshStandardMaterial
                color={CORE}
                wireframe
                transparent
                opacity={0.24}
                emissive={CORE}
                emissiveIntensity={0.5}
                toneMapped={false}
              />
            </mesh>
            <pointLight position={[0, 1.2, 0]} color={CORE} intensity={3} distance={9} />
          </>
        ) : null}
      </group>

    </>
  );
}
