/* Generates `assets/source/gate-arch-test.glb` — a stand-in for the first real
   model, dense enough that simplification and Draco have something to do.

   It exists so the asset pipeline can be proved end to end before any art
   exists, which is one of Phase 0's exit criteria: the pipeline compresses a
   test model and reports its budget. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'assets/source/gate-arch-test.glb');

const SEGMENTS = 160;   // around the arch
const RINGS = 48;       // across its thickness
const RADIUS = 4;
const THICKNESS = 0.55;

/* A half-torus: the gate's arch. Parameterised so the triangle count lands in
   the tens of thousands — enough that LOD1 and LOD2 are visibly different. */
const positions = [];
const normals = [];
const uvs = [];
const indices = [];

for (let i = 0; i <= SEGMENTS; i += 1) {
  const u = (i / SEGMENTS) * Math.PI; // half turn
  for (let j = 0; j <= RINGS; j += 1) {
    const v = (j / RINGS) * Math.PI * 2;
    const cx = Math.cos(u) * RADIUS;
    const cy = Math.sin(u) * RADIUS;
    const nx = Math.cos(u) * Math.cos(v);
    const ny = Math.sin(u) * Math.cos(v);
    const nz = Math.sin(v);
    positions.push(cx + nx * THICKNESS, cy + ny * THICKNESS, nz * THICKNESS);
    normals.push(nx, ny, nz);
    uvs.push(i / SEGMENTS, j / RINGS);
  }
}

for (let i = 0; i < SEGMENTS; i += 1) {
  for (let j = 0; j < RINGS; j += 1) {
    const a = i * (RINGS + 1) + j;
    const b = a + RINGS + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
}

const document = new Document();
const buffer = document.createBuffer();
const scene = document.createScene('gate-arch-test');

const material = document
  .createMaterial('stone')
  .setBaseColorFactor([0.42, 0.45, 0.52, 1])
  .setRoughnessFactor(0.86)
  .setMetallicFactor(0);

const primitive = document
  .createPrimitive()
  .setMaterial(material)
  .setAttribute('POSITION', document.createAccessor().setType('VEC3').setArray(new Float32Array(positions)).setBuffer(buffer))
  .setAttribute('NORMAL', document.createAccessor().setType('VEC3').setArray(new Float32Array(normals)).setBuffer(buffer))
  .setAttribute('TEXCOORD_0', document.createAccessor().setType('VEC2').setArray(new Float32Array(uvs)).setBuffer(buffer))
  .setIndices(document.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer));

const mesh = document.createMesh('arch').addPrimitive(primitive);

/* Two instances of the same mesh, so `instance()` has a duplicate to find. */
scene.addChild(document.createNode('arch-near').setMesh(mesh));
scene.addChild(document.createNode('arch-far').setMesh(mesh).setTranslation([0, 0, -9]));

/* An unused node and a duplicate material, so `prune()` and `dedup()` have work
   to do — the pipeline should report them gone. */
scene.addChild(document.createNode('empty-helper'));
document.createMaterial('stone-copy').setBaseColorFactor([0.42, 0.45, 0.52, 1]).setRoughnessFactor(0.86).setMetallicFactor(0);

mkdirSync(dirname(out), { recursive: true });
const glb = await new NodeIO().writeBinary(document);
writeFileSync(out, glb);

console.log(`test model written: assets/source/gate-arch-test.glb`);
console.log(`  ${(indices.length / 3).toLocaleString()} triangles · ${(glb.byteLength / 1024).toFixed(0)} KB uncompressed`);
