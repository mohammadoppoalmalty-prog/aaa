'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { getGPUTier } from 'detect-gpu';
import { PerfHud, PerfSampler } from './PerfHud';
import { Blockout } from './greybox/Blockout';
import { PlayerController } from './entities/PlayerController';
import { Flythrough } from './Flythrough';
import { DebugPanel } from './DebugPanel';
import { settingsFor, tierFromGpuTier } from './quality';
import { useSettings } from '@/state/settings';
import { tokens } from '@/generated/tokens';
import styles from './engine.module.css';

/**
 * The engine shell: renderer configuration, the physics world, and the two
 * things a WebGL page must survive — an unbenchmarkable GPU and a lost context.
 */

export function Engine() {
  const quality = useSettings((s) => s.quality);
  const qualityManual = useSettings((s) => s.qualityManual);
  const setQuality = useSettings((s) => s.setQuality);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const setReducedMotion = useSettings((s) => s.setReducedMotion);
  const togglePerfHud = useSettings((s) => s.togglePerfHud);
  const q = settingsFor(quality);

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
            <Blockout />
            {flythrough === null ? (
              <PlayerController start={[0, 1.5, 4]} reducedMotion={reducedMotion} />
            ) : (
              <Flythrough seconds={flythrough} />
            )}
          </Physics>
        </Suspense>
      </Canvas>

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
