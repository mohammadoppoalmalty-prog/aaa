'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { endingFor, type EndingScript } from '../systems/ending';
import { registerInteractable } from '../systems/interact';
import { TOTAL_MEMORIES } from '../areas/manifest';
import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { tokens } from '@/generated/tokens';
import styles from './the-ending.module.css';

/**
 * The top of the Contact Tower, once the Engine is running.
 *
 * It plays itself. Standing here is enough — the last thing this world says to
 * someone is not a thing they should have to press a key to be told.
 *
 * The words are split from the room on purpose. `endingFor` decides what may be
 * claimed and is pure and tested; this file only says it out loud. And the
 * saying happens in DOM rather than in a texture, because subtitles belong in
 * the layer that already has a live region, a reading order and font scaling —
 * an ending a screen reader cannot reach is not an ending.
 */

const TYPE_RATE = 45; // characters a second, the same rate LUMA arrived at
const HOLD = 2.6; // seconds a finished line sits before the next one starts

const CORE = new THREE.Color(tokens.semantic.color['accent-alt'].hex);
const WARM = new THREE.Color(tokens.semantic.color['memory-restored'].hex);

/** The script for this save. Pure, so both halves may ask for it separately. */
export function useEndingScript(): EndingScript {
  const save = useGame((s) => s.save);
  return useMemo(
    () =>
      endingFor({
        recovered: save.memories.length,
        total: TOTAL_MEMORIES,
        skipped: Object.values(save.puzzles).filter((state) => state === 'skipped').length,
        puzzlesFinished: Object.values(save.puzzles).filter(
          (state) => state === 'solved' || state === 'skipped',
        ).length,
        revealedAll: save.revealedAll,
      }),
    [save],
  );
}

export function TheEnding({
  captionRef,
  onFinished,
}: {
  captionRef: RefObject<HTMLParagraphElement | null>;
  onFinished: () => void;
}) {
  const script = useEndingScript();
  const reducedMotion = useSettings((s) => s.reducedMotion);

  const [line, setLine] = useState(0);
  const [done, setDone] = useState(false);
  const core = useRef<THREE.Mesh>(null);
  const typed = useRef(0);
  const held = useRef(0);

  useFrame((_, delta) => {
    const node = captionRef.current;
    const text = script.lines[line]?.text ?? '';

    /* Written straight to the node rather than to state. The caption advances
       forty-five times a second, and this project has a commit-count gate
       precisely to stop that from becoming forty-five renders. */
    if (node && !done) {
      if (reducedMotion) {
        node.textContent = text;
        typed.current = text.length;
      } else if (typed.current < text.length) {
        typed.current = Math.min(text.length, typed.current + delta * TYPE_RATE);
        node.textContent = text.slice(0, Math.floor(typed.current));
      }

      if (typed.current >= text.length) {
        held.current += delta;
        if (held.current >= HOLD) {
          held.current = 0;
          typed.current = 0;
          if (line + 1 < script.lines.length) {
            setLine(line + 1);
          } else {
            setDone(true);
            onFinished();
          }
        }
      }
    }

    /* The core turns, and its colour is how much of him came back: cold violet
       at nothing recovered, warm gold at all of it. Nothing else in the room
       reads `warmth`, and nothing else needs to. */
    const mesh = core.current;
    if (mesh) {
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.color.copy(CORE).lerp(WARM, script.warmth);
      material.emissive.copy(material.color);
      mesh.rotation.y += delta * 0.25;
    }
  });

  /* The door out of the metaphor, registered only once the speech is over.
     Offered mid-sentence it would read as "skip this", and this is the one
     thing in the game there is no reason to skip. */
  useEffect(() => {
    if (!done) return;
    const at = new THREE.Vector3(0, 1.4, 0);
    return registerInteractable({
      id: 'the-way-out',
      title: 'The way to reach him',
      position: at,
      // The tower is 24 m across and this is the last thing standing in it.
      reach: 40,
      act: () => window.location.assign('/codex/contact'),
    });
  }, [done]);

  return (
    <group>
      <mesh ref={core} position={[0, 1.6, 0]}>
        <icosahedronGeometry args={[0.55, 2]} />
        <meshStandardMaterial color={CORE} emissive={CORE} emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.2, 0]} intensity={6 + script.warmth * 10} distance={26} color={WARM} />
    </group>
  );
}

/**
 * The ending's words, and the one link that leaves the fiction.
 *
 * A plain anchor, not a button that calls the router: the last thing this
 * project asks anyone to do is open a page, and a page opens with a link.
 */
export function EndingCaption({
  captionRef,
  done,
}: {
  captionRef: RefObject<HTMLParagraphElement | null>;
  done: boolean;
}) {
  const script = useEndingScript();

  return (
    <div className={styles.stage}>
      <p ref={captionRef} className={styles.line} role="status" aria-live="polite" />
      {done ? (
        <div className={styles.out}>
          <p className={styles.invitation}>{script.invitation.text}</p>
          <a className={styles.door} href="/codex/contact">
            Write to him
          </a>
        </div>
      ) : null}
    </div>
  );
}
