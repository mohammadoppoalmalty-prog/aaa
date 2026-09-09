'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier, type RapierCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { tokens } from '@/generated/tokens';
import { interactable, playerPosition, playerYaw, publishPlayerDebug } from '../systems/player';

/* The same palette the Codex's CSS reads — one source, two renderers. */
const ACCENT = tokens.semantic.color.accent.hex;
const ACCENT_ALT = tokens.semantic.color['accent-alt'].hex;

/**
 * The grey-box character controller — GDD Part 7.
 *
 * Rapier kinematic capsule: 0.4 m radius, 0.35 m step height, 45° slope limit.
 * Walk 2.2 m/s, run 4.6 m/s on Shift. No jump, by design — removing it removes
 * a whole class of platforming and camera problems that nothing here needs.
 *
 * Every value below is mutated on a ref inside `useFrame`. Nothing in this file
 * calls `setState`, so gameplay produces no React commits (architecture Rule 1).
 */

const RADIUS = 0.4;
const HALF_HEIGHT = 0.5;
const STEP_HEIGHT = 0.35;
const SLOPE_LIMIT = (45 * Math.PI) / 180;
const WALK = 2.2;
const RUN = 4.6;
const GRAVITY = -18;
const TURN_RATE = 2.4;
const LOOK_SENSITIVITY = 0.0028;

/** Follow camera: 4.5 m back, 1.8 m up, spring-damped, FOV 55°. */
const CAM_DISTANCE = 4.5;
const CAM_HEIGHT = 1.8;
const CAM_STIFFNESS = 6.5;
/** How far inside a wall the camera is allowed to get before it is held back. */
const CAM_MARGIN = 0.8;

interface Keys {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

const KEY_MAP: Record<string, keyof Keys> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyQ: 'turnLeft',
  KeyE: 'turnRight',
};

export interface PlayerControllerProps {
  /** Spawn point, in metres. */
  readonly start?: readonly [number, number, number];
  /** Halved spring and no camera bob when the visitor asked for less motion. */
  readonly reducedMotion?: boolean;
  /**
   * The walls the camera must stay inside, as [width, depth] in metres.
   *
   * A room is usually smaller than the camera's four and a half metres of
   * follow distance, so in every interior in this game the camera ended up
   * *outside the building*, filming the back of a wall. The player saw a black
   * screen with a working interaction prompt floating in it.
   */
  readonly bounds?: readonly [number, number];
}

export function PlayerController({ start = [0, 2, 0], reducedMotion = false, bounds }: PlayerControllerProps) {
  const body = useRef<RapierRigidBody>(null);
  const collider = useRef<RapierCollider>(null);
  const mesh = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();
  const camera = useThree((s) => s.camera);

  const keys = useRef<Keys>({
    forward: false,
    back: false,
    left: false,
    right: false,
    run: false,
    turnLeft: false,
    turnRight: false,
  });
  const yaw = useRef(0);
  const verticalVelocity = useRef(0);

  useEffect(publishPlayerDebug, []);

  /* ── input ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (down: boolean) => (event: KeyboardEvent) => {
      const action = KEY_MAP[event.code];
      if (!action) return;
      // Never swallow browser shortcuts — the Codex must stay one key away.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      keys.current[action] = down;
      event.preventDefault();
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);

    /* Hold right mouse to look — the same gesture the pointer-locked build will use. */
    let looking = false;
    const down = (e: PointerEvent) => {
      if (e.button === 2) looking = true;
    };
    const up = (e: PointerEvent) => {
      if (e.button === 2) looking = false;
    };
    const move = (e: PointerEvent) => {
      if (looking) yaw.current -= e.movementX * LOOK_SENSITIVITY;
    };
    const blur = () => {
      looking = false;
      keys.current = {
        forward: false, back: false, left: false, right: false,
        run: false, turnLeft: false, turnRight: false,
      };
    };
    const contextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointermove', move);
    window.addEventListener('blur', blur);
    window.addEventListener('contextmenu', contextMenu);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', blur);
      window.removeEventListener('contextmenu', contextMenu);
    };
  }, []);

  /* ── the character controller ──────────────────────────────────────────── */
  const controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null);
  useEffect(() => {
    const c = world.createCharacterController(0.02);
    c.setUp({ x: 0, y: 1, z: 0 });
    c.enableAutostep(STEP_HEIGHT, 0.2, true);
    c.setMaxSlopeClimbAngle(SLOPE_LIMIT);
    c.setMinSlopeSlideAngle(SLOPE_LIMIT);
    c.enableSnapToGround(0.4);
    c.setApplyImpulsesToDynamicBodies(true);
    controller.current = c;
    return () => {
      controller.current = null;
      world.removeCharacterController(c);
    };
  }, [world]);

  /* ── per-frame ─────────────────────────────────────────────────────────── */
  const desired = useRef(new THREE.Vector3());
  const camTarget = useRef(new THREE.Vector3());
  const camLook = useRef(new THREE.Vector3());
  /** The authoritative kinematic target — see the note in the frame loop. */
  const target = useRef(new THREE.Vector3(start[0], start[1], start[2]));

  useFrame((_, rawDelta) => {
    const rb = body.current;
    const col = collider.current;
    const ctrl = controller.current;
    if (!rb || !col || !ctrl) return;

    // A tab-switch or a long GC pause must not teleport the player through a wall.
    const delta = Math.min(rawDelta, 1 / 30);
    const k = keys.current;

    if (k.turnLeft) yaw.current += TURN_RATE * delta;
    // E turns only when there is nothing to interact with — see systems/player.
    if (k.turnRight && interactable.current === null) yaw.current -= TURN_RATE * delta;

    const forward = (k.forward ? 1 : 0) - (k.back ? 1 : 0);
    const strafe = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    const speed = k.run ? RUN : WALK;

    desired.current.set(strafe, 0, -forward);
    if (desired.current.lengthSq() > 0) {
      desired.current.normalize().multiplyScalar(speed * delta).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw.current);
    }

    // Gravity is integrated by hand: a kinematic body has none of its own.
    verticalVelocity.current += GRAVITY * delta;
    desired.current.y = verticalVelocity.current * delta;

    ctrl.computeColliderMovement(col, desired.current);
    const moved = ctrl.computedMovement();
    if (ctrl.computedGrounded()) verticalVelocity.current = 0;

    /* The target is accumulated here rather than read back from the body.
       A kinematic body's translation only updates when the physics world steps,
       so on any frame that outruns a step, `rb.translation()` is last step's
       position — and `stale + moved` silently discards every frame of movement
       but the last. That reads as a character walking at a third of its speed
       and is almost impossible to spot by eye. */
    target.current.add(moved as THREE.Vector3);
    rb.setNextKinematicTranslation(target.current);

    if (mesh.current) mesh.current.rotation.y = yaw.current;

    // Published for every system that needs proximity, so none of them traverses.
    playerPosition.copy(target.current);
    playerYaw.value = yaw.current;

    /* Spring-damped follow. Reduced Motion halves the spring, which removes the
       overshoot that causes most of the sickness reports on third-person cameras. */
    const stiffness = reducedMotion ? CAM_STIFFNESS / 2 : CAM_STIFFNESS;
    camTarget.current.set(
      target.current.x + Math.sin(yaw.current) * CAM_DISTANCE,
      target.current.y + CAM_HEIGHT,
      target.current.z + Math.cos(yaw.current) * CAM_DISTANCE,
    );

    /* Held inside the walls. Pulling the camera in rather than pushing the
       player around keeps the controls honest — the character still goes where
       it was told, the view just stops leaving the room. */
    if (bounds) {
      const limitX = bounds[0] / 2 - CAM_MARGIN;
      const limitZ = bounds[1] / 2 - CAM_MARGIN;
      camTarget.current.x = Math.max(-limitX, Math.min(limitX, camTarget.current.x));
      camTarget.current.z = Math.max(-limitZ, Math.min(limitZ, camTarget.current.z));
    }
    camera.position.lerp(camTarget.current, 1 - Math.exp(-stiffness * delta));
    camLook.current.set(target.current.x, target.current.y + 1, target.current.z);
    camera.lookAt(camLook.current);
  });

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[start[0], start[1], start[2]]}
      // Rapier's own types are re-exported so the controller can be typed without `any`.
      userData={{ kind: 'player', rapierVersion: rapier.version() }}
    >
      <CapsuleCollider ref={collider} args={[HALF_HEIGHT, RADIUS]} />
      <group ref={mesh}>
        <mesh castShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[RADIUS, HALF_HEIGHT * 2, 4, 12]} />
          <meshStandardMaterial color={ACCENT_ALT} roughness={0.6} metalness={0} />
        </mesh>
        {/* A nose, so facing is legible in a grey-box with no character art. */}
        <mesh position={[0, 0.2, -RADIUS]}>
          <boxGeometry args={[0.12, 0.12, 0.28]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.6} />
        </mesh>
      </group>
    </RigidBody>
  );
}
