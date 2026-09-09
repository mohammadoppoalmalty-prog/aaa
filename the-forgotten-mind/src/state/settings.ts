'use client';

/**
 * Settings live outside React's render cycle.
 *
 * Rule 1 of the architecture: React never renders per frame. Anything the world
 * reads while running is read through a transient subscription (`subscribe`) or
 * straight off `getState()`, never through a hook in a per-frame component.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { QUALITY_TIERS, type QualityTier } from '@/world/quality';

export interface SettingsState {
  quality: QualityTier;
  /** True once the visitor chose a tier by hand — this permanently ends the adapter. */
  qualityManual: boolean;
  reducedMotion: boolean;
  showPerfHud: boolean;

  setQuality: (tier: QualityTier, manual?: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  togglePerfHud: () => void;
}

const STORAGE_KEY = 'tfm.settings.v1';

interface Persisted {
  quality?: QualityTier;
  qualityManual?: boolean;
  showPerfHud?: boolean;
}

function load(): Persisted {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const p = parsed as Persisted;
    // A stored tier from an older build must not resurrect a row that no longer exists.
    const quality = p.quality && QUALITY_TIERS.includes(p.quality) ? p.quality : undefined;
    return { ...p, ...(quality ? { quality } : {}) };
  } catch {
    return {};
  }
}

function save(state: SettingsState): void {
  if (typeof window === 'undefined') return;
  try {
    const persisted: Persisted = {
      quality: state.quality,
      qualityManual: state.qualityManual,
      showPerfHud: state.showPerfHud,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    /* Private mode, quota, or a locked-down browser. Settings are a convenience,
       never a requirement — losing them must not break the world. */
  }
}

const stored = load();

export const useSettings = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    quality: stored.quality ?? 'high',
    qualityManual: stored.qualityManual ?? false,
    reducedMotion: false,
    showPerfHud: stored.showPerfHud ?? false,

    setQuality: (quality, manual = true) => {
      set({ quality, qualityManual: manual || get().qualityManual });
      save(get());
    },
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    togglePerfHud: () => {
      set({ showPerfHud: !get().showPerfHud });
      save(get());
    },
  })),
);

/** Read without subscribing — the form the world uses. */
export const settings = () => useSettings.getState();
