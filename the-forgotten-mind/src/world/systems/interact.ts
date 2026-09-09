'use client';

import type * as THREE from 'three';
import { playerPosition } from './player';

/**
 * One interaction system for the whole world.
 *
 * Before this, every entity that could be interacted with wrote its own result
 * into a shared slot — so a memory standing near an exit and an exit standing
 * near a memory would overwrite each other in whatever order the frame happened
 * to run them, and the prompt would flicker between two names. Registration
 * plus a single arbiter removes that class of bug entirely.
 *
 * It also makes the world keyboard-completable, which is the harder requirement:
 * `[` and `]` cycle every interactable in the area by distance, so nothing here
 * depends on being able to aim.
 */

export interface Interactable {
  readonly id: string;
  /** Shown in the prompt and read aloud by the screen-reader mode. */
  readonly title: string;
  readonly position: THREE.Vector3;
  /** How close the player must be, in metres. */
  readonly reach: number;
  /** What `E` does here. Returning false means "not now" — the prompt stays. */
  act(): void | boolean;
  /** False when the thing is visible but not usable yet, e.g. a locked exit. */
  readonly enabled?: boolean;
}

const registry = new Map<string, Interactable>();

export function registerInteractable(item: Interactable): () => void {
  registry.set(item.id, item);
  return () => {
    registry.delete(item.id);
    if (focused.current?.id === item.id) focused.current = null;
  };
}

/** What `E` would act on right now. */
export const focused: { current: Interactable | null } = { current: null };

/** Set by `[`/`]`; cleared as soon as the player walks somewhere else. */
let pinned: string | null = null;

const byDistance = (): readonly Interactable[] =>
  [...registry.values()]
    .filter((item) => item.enabled !== false)
    .sort((a, b) => playerPosition.distanceTo(a.position) - playerPosition.distanceTo(b.position));

/**
 * Called once per frame by the interaction system component.
 * @returns true when the focused interactable changed.
 */
export function updateFocus(): boolean {
  const previous = focused.current;

  if (pinned !== null) {
    const held = registry.get(pinned);
    /* A pinned target is kept even out of reach, so cycling to something across
       the room and walking to it works. It is dropped when it disappears. */
    if (held && held.enabled !== false) {
      focused.current = held;
      return focused.current !== previous;
    }
    pinned = null;
  }

  let best: Interactable | null = null;
  let bestDistance = Infinity;
  for (const item of registry.values()) {
    if (item.enabled === false) continue;
    const distance = playerPosition.distanceTo(item.position);
    if (distance <= item.reach && distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  }

  focused.current = best;
  return best !== previous;
}

/** `[` and `]` — cycle by distance, which is the order a player would guess. */
export function cycleFocus(direction: 1 | -1): Interactable | null {
  const items = byDistance();
  if (items.length === 0) return null;

  const currentIndex = focused.current ? items.findIndex((item) => item.id === focused.current?.id) : -1;
  const next = items[(currentIndex + direction + items.length) % items.length] ?? items[0] ?? null;

  pinned = next?.id ?? null;
  focused.current = next;
  return next;
}

export function clearPin(): void {
  pinned = null;
}

/** Act on whatever is focused. Returns whether anything happened. */
export function actOnFocus(): boolean {
  const target = focused.current;
  if (!target) return false;
  const result = target.act();
  if (result !== false) pinned = null;
  return result !== false;
}

export const interactableCount = (): number => registry.size;
