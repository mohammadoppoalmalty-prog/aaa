'use client';

import dynamic from 'next/dynamic';
import type { EngineProps } from '@/world/Engine';

/* ssr:false is not optional here — Three.js touches `window` at module scope
   and the engine has nothing meaningful to render on the server anyway. */
const Engine = dynamic(() => import('@/world/Engine').then((m) => m.Engine), {
  ssr: false,
  loading: () => <p style={{ padding: '2rem' }}>Waking the world…</p>,
});

export function WorldShell(props: EngineProps) {
  return <Engine {...props} />;
}
