'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { getGPUTier } from 'detect-gpu';
import { PerfHud, PerfSampler } from './PerfHud';
import { Blockout } from './greybox/Blockout';
import { GreyboxArea } from './areas/GreyboxArea';
import { MemoryForest } from './areas/MemoryForest';
import { puzzleSpot } from './areas/layout';
import { ForgottenVillage } from './areas/ForgottenVillage';

/** Areas with real dressing. The rest are still honest grey-box blockouts. */
const DRESSED = new Set<AreaId>(['memory-forest', 'village']);
import { AREA_SPECS, type AreaId } from './areas/manifest';
import { providePuzzleRewards, useGame } from '@/state/game';
import { PlayerController } from './entities/PlayerController';
import { Flythrough } from './Flythrough';
import { DebugPanel } from './DebugPanel';
import { Memories, type MoteSpec } from './entities/Memories';
import { CompanionCat } from './entities/CompanionCat';
import { FountainAnchor } from './entities/FountainAnchor';
import { FountainGrate } from './puzzles/FountainGrate';
import { LightEcho } from './puzzles/LightEcho';
import { LumaPresence } from './entities/LumaPresence';
import { Hud } from './Hud';
import { CursorRitual } from './puzzles/CursorRitual';
import { PuzzleStation } from './entities/PuzzleStation';
import { PuzzlePanel } from './puzzles/PuzzlePanel';
import { BOARDS } from './puzzles/boards';
import { registry } from './systems/puzzles';
import { Luma } from './Luma';
import { InteractionSystem } from './InteractionSystem';
import { PauseMenu } from './PauseMenu';
import type { LumaIntent } from './systems/luma/fallback';
import { settingsFor, tierFromGpuTier } from './quality';
import { useSettings } from '@/state/settings';
import { tokens } from '@/generated/tokens';
import styles from './engine.module.css';

/**
 * The engine shell: renderer configuration, the physics world, and the two
 * things a WebGL page must survive — an unbenchmarkable GPU and a lost context.
 */

export interface EngineProps {
  /** Where the recoverable memories stand, and how many exist in total. */
  readonly motes: readonly MoteSpec[];
  readonly total: number;
  /** LUMA's scripted tree, loaded on the server so the world ships no parser. */
  readonly lumaIntents: readonly LumaIntent[];
}

/* Teach the shared store what puzzles pay out, now that the world is the one
   asking. Module scope, so it happens once per load rather than per render. */
providePuzzleRewards((id) => registry.get(id)?.rewards);

export function Engine({ motes, total, lumaIntents }: EngineProps) {
  const quality = useSettings((s) => s.quality);
  const qualityManual = useSettings((s) => s.qualityManual);
  const setQuality = useSettings((s) => s.setQuality);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const setReducedMotion = useSettings((s) => s.setReducedMotion);
  const togglePerfHud = useSettings((s) => s.togglePerfHud);
  const q = settingsFor(quality);

  /* Which area is mounted is a property of the save, so returning to the world
     puts the player back where they left it rather than at the gate. */
  const areaId = useGame((s) => s.save.area);
  const ritual = useGame((s) => s.save.puzzles['cursor-ritual']);
  const catFollows = useGame((s) => s.save.hasCat);
  const fountainState = useGame((s) => s.save.puzzles.fountain);
  const [grateOpen, setGrateOpen] = useState(false);
  /* Which puzzle sheet is open, if any. The three that were built before the
     shell keep their own panels; everything else opens through this. */
  const [openPuzzle, setOpenPuzzle] = useState<string | null>(null);
  const area = AREA_SPECS[areaId as AreaId] ?? AREA_SPECS.gate;

  /* Detect once, and never over a manual choice. */
  useEffect(() => {
    if (qualityManual) return;
    let cancelled = false;
    void getGPUTier().then((result) => {
      if (cancelled) return;
      setQuality(tierFromGpuTier(result.tier, result.isMobile ?? false), false);
    });
    return () => {
      cancelled = true;
    };
  }, [qualityManual, setQuality]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [setReducedMotion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'KeyH' && !event.metaKey && !event.ctrlKey) togglePerfHud();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePerfHud]);

  /* `?perf=90` swaps the player for the automated flythrough. The engine is
     already client-only, so reading the URL here is cheaper than pulling the
     router in for one string. */
  const { flythrough, debug } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('perf');
    const seconds = raw === null ? null : Number.isFinite(Number(raw)) && Number(raw) > 0 ? Number(raw) : 90;
    return { flythrough: seconds, debug: params.has('debug') };
  }, []);

  const dpr = useMemo<[number, number]>(
    () => [1, Math.min(2, q.resolutionScale * 2)],
    [q.resolutionScale],
  );

  return (
    <div className={styles.stage}>
      <Canvas
        shadows={q.shadows.kind !== 'baked'}
        dpr={dpr}
        gl={{
          antialias: q.antialiasing !== 'none',
          powerPreference: 'high-performance',
          // The world is composited over the page's own ground, never over white.
          alpha: false,
        }}
        camera={{ fov: 55, near: 0.1, far: q.drawDistance, position: [0, 3, 8] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          scene.background = new THREE.Color(tokens.semantic.color.canvas.hex);
          scene.fog = new THREE.Fog(tokens.semantic.color.canvas.hex, q.drawDistance * 0.45, q.drawDistance);
        }}
      >
        <ContextGuard />
        <PerfSampler />
        <InteractionSystem />

        {/* One light source, upper-left, obeyed by every surface in both layers. */}
        <hemisphereLight intensity={0.35} groundColor={tokens.semantic.color.canvas.hex} />
        <directionalLight
          position={[-24, 30, 14]}
          intensity={1.6}
          castShadow={q.shadows.kind !== 'baked'}
          shadow-mapSize={[
            q.shadows.kind === 'baked' ? 512 : q.shadows.size,
            q.shadows.kind === 'baked' ? 512 : q.shadows.size,
          ]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />

        <Suspense fallback={null}>
          <Physics gravity={[0, -18, 0]} timeStep="vary">
            {/* A dressed area does not want the generic massing on top of it;
                the other seventeen blockouts still do. */}
            <GreyboxArea key={area.id} spec={area} landmarks={!DRESSED.has(area.id)} />
            {area.id === 'memory-forest' ? <MemoryForest /> : null}
            {/* The controller calibration geometry — steps at and above the
                autostep height, ramps either side of the slope limit — lives in
                the Gate, where the tutorial already teaches movement. */}
            {area.id === 'gate' ? <Blockout /> : null}
            <Memories motes={motes.filter((mote) => mote.area === area.id)} total={total} />

            {/* The Forest: LUMA's arrival at the first fork, and the lanterns. */}
            {area.id === 'memory-forest' ? (
              <>
                <LumaPresence at={[0, 0, -4]} />
                <LightEcho />
              </>
            ) : null}

            {area.id === 'village' ? (
              <>
                <ForgottenVillage fountainRunning={fountainState === 'solved' || fountainState === 'skipped'} />
                <FountainAnchor
                  solved={fountainState === 'solved' || fountainState === 'skipped'}
                  onOpen={() => setGrateOpen(true)}
                />
              </>
            ) : null}

            {/* Every other area's puzzle stands on a station of its own. */}
            {area.puzzle !== null && BOARDS[area.puzzle] !== undefined ? (
              <PuzzleStation
                puzzleId={area.puzzle}
                position={puzzleSpot(area)}
                onOpen={() => setOpenPuzzle(area.puzzle)}
              />
            ) : null}

            {/* Off the path, in the Forest, doing nothing at all. */}
            {area.id === 'memory-forest' || catFollows ? (
              <CompanionCat
                home={[-18, 0, -14]}
                purrNear={motes.filter((mote) => mote.area === area.id).map((mote) => mote.position)}
              />
            ) : null}
            {flythrough === null ? (
              <PlayerController
                key={area.id}
                start={[0, 1.5, 4]}
                reducedMotion={reducedMotion}
                /* Only rooms have walls to end up behind. */
                {...(area.kind === 'interior' || area.kind === 'cave' ? { bounds: area.size } : {})}
              />
            ) : (
              <Flythrough seconds={flythrough} />
            )}
          </Physics>
        </Suspense>
      </Canvas>

      {/* The Gate opens with the ritual, once per save. The flythrough and the
          inspector skip it: a measurement run and a debugging session are not
          arrivals. */}
      {area.id === 'gate' && ritual === undefined && flythrough === null && !debug ? (
        <CursorRitual onDone={() => undefined} />
      ) : null}

      {grateOpen ? <FountainGrate onClose={() => setGrateOpen(false)} /> : null}

      {openPuzzle !== null && BOARDS[openPuzzle] !== undefined ? (
        <PuzzlePanel
          id={openPuzzle}
          board={BOARDS[openPuzzle]!}
          onClose={() => setOpenPuzzle(null)}
        />
      ) : null}

      <Hud total={total} />
      <Luma intents={lumaIntents} total={total} />
      <PauseMenu />
      <PerfHud />
      {debug ? <DebugPanel /> : null}
      <Legend />
    </div>
  );
}

/**
 * A browser can drop the GL context on a tab switch, GPU pressure, or a driver
 * hiccup. The default outcome is a frozen black canvas that a visitor reads as
 * a broken site; `preventDefault()` is what makes a restore possible at all.
 */
function ContextGuard() {
  const gl = useThree((s) => s.gl);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (event: Event) => {
      event.preventDefault();
      setLost(true);
    };
    const onRestored = () => setLost(false);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl]);

  useEffect(() => {
    // Phase 1 replaces this with LUMA's in-fiction line and a rebuild from the save.
    if (lost) console.warn('[world] WebGL context lost — awaiting restore');
  }, [lost]);

  return null;
}

function Legend() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.legend} ref={ref}>
      <p>
        <kbd>W A S D</kbd> move · <kbd>Shift</kbd> run · <kbd>Q</kbd>/<kbd>E</kbd> or hold right-drag turn ·{' '}
        <kbd>H</kbd> perf HUD
      </p>
    </div>
  );
}
