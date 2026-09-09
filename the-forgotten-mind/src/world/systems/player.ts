'use client';

import * as THREE from 'three';

/**
 * Where the player is, readable without a scene traversal.
 *
 * `PlayerController` writes this once per frame; anything that needs proximity
 * reads it. The alternative — `scene.getObjectByName('player')` in a `useFrame`
 * — walks the scene graph every frame in every system that cares, which is a
 * cost that grows with the world rather than with the number of readers.
 */
export const playerPosition = new THREE.Vector3();

/** Facing, in radians. The camera and the interaction system both read it. */
export const playerYaw = { value: 0 };

/**
 * What the player can interact with right now, or null.
 *
 * GDD Part 7 binds `E` to both "turn right" and "interact", which cannot both
 * be true at once. The rule this project settles on: **`E` interacts when
 * something is within reach, and turns otherwise.** The prompt only appears
 * when something is in reach, so the key always does what the screen says.
 */
export const interactable: { current: { readonly id: string; readonly title: string } | null } = { current: null };

/**
 * A deliberate testing seam. The end-to-end tests drive the real controller
 * rather than calling into the store, because "walk over there and press E" is
 * the interaction being tested; without a way to read the resulting position
 * they can only assert that nothing happened, not why.
 */
export function publishPlayerDebug(): void {
  if (typeof window === 'undefined') return;
  (window as Window & { __tfmPlayer?: () => { x: number; y: number; z: number; near: string | null } }).__tfmPlayer =
    () => ({
      x: playerPosition.x,
      y: playerPosition.y,
      z: playerPosition.z,
      near: interactable.current?.id ?? null,
    });
}
