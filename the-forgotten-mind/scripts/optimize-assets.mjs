/* The asset pipeline — GDD Part 12.
   Runs on every model added. Reads `assets/source/*.glb`, writes three LODs per
   model into `public/models/`, and reports triangles, materials, texture memory
   and final size against the previous run.

   Usage:
     node scripts/optimize-assets.mjs                # process everything
     node scripts/optimize-assets.mjs gate-arch      # one model
     node scripts/optimize-assets.mjs --check        # fail if any budget is broken

   KTX2 (step 5) needs the `toktx` binary from KTX-Software on PATH. When it is
   missing the pipeline says so and continues — a texture that is merely
   uncompressed is a budget problem, not a broken build, and the report shows it. */

import { readdirSync, mkdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, draco, instance, textureCompress } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'assets/source');
const OUT = resolve(root, 'public/models');
const MANIFEST = resolve(root, 'assets/manifest.json');

/** GDD Part 12: LOD0/1/2 at 100 / 45 / 18 % triangles. */
const LODS = [
  { name: 'lod0', ratio: 1 },
  { name: 'lod1', ratio: 0.45 },
  { name: 'lod2', ratio: 0.18 },
];

/** Per-model budgets. The world-wide budgets live in the manifest check. */
const BUDGET = { triangles: 120_000, materials: 12, bytes: 1_800_000 };

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const check = process.argv.includes('--check');

const hasToktx = spawnSync('toktx', ['--version'], { shell: true }).status === 0;

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function makeIO() {
  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
}

function measure(document) {
  const root_ = document.getRoot();
  let triangles = 0;
  for (const mesh of root_.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const indices = prim.getIndices();
      const position = prim.getAttribute('POSITION');
      triangles += (indices ? indices.getCount() : (position?.getCount() ?? 0)) / 3;
    }
  }
  let textureBytes = 0;
  for (const texture of root_.listTextures()) textureBytes += texture.getImage()?.byteLength ?? 0;

  return {
    triangles: Math.round(triangles),
    materials: root_.listMaterials().length,
    meshes: root_.listMeshes().length,
    textureBytes,
  };
}

async function processModel(file) {
  const io = await makeIO();
  const name = basename(file, '.glb');
  const source = resolve(SRC, file);
  const before = statSync(source).size;

  const results = [];

  for (const lod of LODS) {
    const document = await io.read(source);

    await document.transform(
      dedup(),                                   // 1 · merge duplicate accessors and materials
      prune(),                                   // 2 · strip unused nodes
      instance({ min: 2 }),                      // 6 · auto-instance repeated meshes
      weld(),                                    // 3 · weld before simplifying, or seams tear
      ...(lod.ratio < 1
        ? [simplify({ simplifier: MeshoptSimplifier, ratio: lod.ratio, error: 0.001 })]
        : []),
      // 5 · textures: KTX2 when the toolchain is present, WebP as the honest fallback
      ...(hasToktx ? [] : [textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 90 })]),
      draco(),                                   // 4 · geometry compression
    );

    const stats = measure(document);
    mkdirSync(OUT, { recursive: true });
    const target = resolve(OUT, `${name}.${lod.name}.glb`);
    await io.write(target, document);
    const size = statSync(target).size;

    if (hasToktx) {
      const ktx = spawnSync('toktx', ['--encode', 'uastc', '--genmipmap', '--t2', target, target], { shell: true });
      if (ktx.status !== 0) console.warn(`  ! toktx failed for ${name}.${lod.name}, textures left uncompressed`);
    }

    results.push({ lod: lod.name, ...stats, bytes: size });
  }

  return { name, sourceBytes: before, lods: results };
}

/* ── run ───────────────────────────────────────────────────────────────── */

if (!existsSync(SRC)) {
  console.error(`asset pipeline: no source directory at assets/source — nothing to do.`);
  process.exit(0);
}

const files = readdirSync(SRC).filter((f) => f.endsWith('.glb') && (only.length === 0 || only.includes(basename(f, '.glb'))));

if (files.length === 0) {
  console.log('asset pipeline: no .glb files matched.');
  process.exit(0);
}

console.log(`\nasset pipeline · ${files.length} model(s)`);
if (!hasToktx) {
  console.log('  toktx not found — textures compressed to WebP instead of KTX2.');
  console.log('  Install KTX-Software for GPU-native textures (typically 6× less texture memory).');
}

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { models: {} };
const manifest = { generatedAt: new Date().toISOString(), ktx2: hasToktx, models: {} };
const failures = [];

for (const file of files) {
  const result = await processModel(file);
  manifest.models[result.name] = result;

  const lod0 = result.lods[0];
  const was = previous.models?.[result.name]?.lods?.[0];
  const delta = was ? `  (was ${kb(was.bytes)}, ${was.triangles.toLocaleString()} tris)` : '  (new)';

  console.log(`\n  ${result.name}   ${kb(result.sourceBytes)} source${delta}`);
  for (const lod of result.lods) {
    console.log(
      `    ${lod.lod}  ${String(lod.triangles).padStart(7)} tris · ` +
        `${String(lod.materials).padStart(2)} materials · ` +
        `${kb(lod.textureBytes).padStart(8)} textures · ${kb(lod.bytes).padStart(8)} total`,
    );
  }

  if (lod0.triangles > BUDGET.triangles) failures.push(`${result.name}: ${lod0.triangles} triangles over the ${BUDGET.triangles} budget`);
  if (lod0.materials > BUDGET.materials) failures.push(`${result.name}: ${lod0.materials} materials over the ${BUDGET.materials} budget`);
  if (lod0.bytes > BUDGET.bytes) failures.push(`${result.name}: ${kb(lod0.bytes)} over the ${kb(BUDGET.bytes)} budget`);
}

mkdirSync(dirname(MANIFEST), { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

const totalBytes = Object.values(manifest.models).reduce((sum, m) => sum + m.lods[0].bytes, 0);
console.log(`\n  total (LOD0)  ${kb(totalBytes)}   ·   manifest written to assets/manifest.json`);

if (failures.length) {
  console.error('\nasset pipeline: over budget');
  for (const f of failures) console.error('  ' + f);
  if (check) process.exit(1);
} else {
  console.log('\nasset pipeline: within budget\n');
}
