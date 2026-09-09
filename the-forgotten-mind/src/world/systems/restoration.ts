'use client';

import type * as THREE from 'three';
import { stats } from '../stats';

/**
 * Architecture Rule 2 — one uniform drives the world.
 *
 * `uRestoration` is a single shared `THREE.Uniform`. Every material that opts in
 * receives *the same object*, so moving the world from ruined to whole costs one
 * float write — no scene traversal, no material swapping, no rebuild. This is the
 * difference between a restoration mechanic that is free and one that stutters
 * every time a memory is recovered.
 *
 * The GLSL side reads the same palette the Codex's CSS reads, from
 * `src/generated/tokens.glsl`. Neither layer can drift from the other.
 */

export const restorationUniform: THREE.IUniform<number> = { value: 0 };

/** 0 = the world as the player finds it. 1 = the world as it was. */
export function setRestoration(value: number): void {
  restorationUniform.value = Math.min(1, Math.max(0, value));
}

export const getRestoration = (): number => restorationUniform.value;

/* ── the shader injection ─────────────────────────────────────────────────
   Two small edits to Three's own standard material: declare the uniform, and
   grade the final colour between a cold, desaturated version of itself and the
   authored one. Everything else about the material is untouched, which is why
   this works on any material in the project rather than a bespoke set.      */

const PARS = /* glsl */ `
uniform float uRestoration;

// Desaturate toward luma and cool the result — the world before it is remembered.
vec3 tfm_forgotten(vec3 base) {
  float luma = dot(base, vec3(0.2126, 0.7152, 0.0722));
  vec3 grey = vec3(luma);
  return mix(grey, base, 0.18) * vec3(0.82, 0.86, 1.0);
}
`;

const GRADE = /* glsl */ `
  gl_FragColor.rgb = mix(tfm_forgotten(gl_FragColor.rgb), gl_FragColor.rgb, uRestoration);
`;

type Compilable = THREE.Material & {
  onBeforeCompile: (shader: THREE.WebGLProgramParametersWithUniforms) => void;
  customProgramCacheKey?: () => string;
};

const bound = new WeakSet<THREE.Material>();

/**
 * Opt a material into the restoration bus. Idempotent, so calling it from a
 * component body on every render is safe — though nothing in this project does.
 */
export function bindRestoration<T extends THREE.Material>(material: T): T {
  if (bound.has(material)) return material;
  bound.add(material);

  const target = material as unknown as Compilable;
  const previous = target.onBeforeCompile;

  target.onBeforeCompile = (shader) => {
    previous?.call(material, shader);
    shader.uniforms.uRestoration = restorationUniform;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `${PARS}\nvoid main() {`)
      .replace('#include <dithering_fragment>', `${GRADE}\n#include <dithering_fragment>`);
  };

  /* Without this, Three reuses a cached program compiled before the injection
     and the uniform silently does nothing — the classic onBeforeCompile bug. */
  target.customProgramCacheKey = () => 'tfm-restoration';

  return material;
}

/* ── the disposal registry ────────────────────────────────────────────────
   Three.js does not garbage-collect GPU resources. Every geometry, material and
   texture is registered against the chunk that created it and asserted clean on
   unload; the memory-leak CI gate is what keeps this honest.               */

type Disposable = { dispose: () => void };

const registry = new Map<string, Set<Disposable>>();

export function register<T extends Disposable>(chunk: string, resource: T): T {
  let set = registry.get(chunk);
  if (!set) {
    set = new Set();
    registry.set(chunk, set);
  }
  set.add(resource);
  return resource;
}

/** Disposes everything a chunk created and returns how many resources went. */
export function disposeChunk(chunk: string): number {
  const set = registry.get(chunk);
  if (!set) return 0;
  let count = 0;
  for (const resource of set) {
    resource.dispose();
    count += 1;
  }
  set.clear();
  registry.delete(chunk);
  return count;
}

export const registrySize = (): number => {
  let total = 0;
  for (const set of registry.values()) total += set.size;
  return total;
};

/** Chunk names with live resources — `/debug` reads this. */
export const liveChunks = (): readonly string[] => [...registry.keys()];

/**
 * The assertion the leak test leans on: after an area unloads, the renderer's
 * own counters must come back to where they were before it loaded.
 */
export function assertClean(chunk: string): void {
  const set = registry.get(chunk);
  if (set && set.size > 0) {
    throw new Error(
      `DisposalRegistry: chunk "${chunk}" unloaded with ${set.size} live resource(s). ` +
        `Renderer still holds ${stats.geometries} geometries and ${stats.textures} textures.`,
    );
  }
}
