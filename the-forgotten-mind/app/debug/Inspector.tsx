'use client';

import Link from 'next/link';
import { useSettings } from '@/state/settings';
import { QUALITY_TIERS, settingsFor } from '@/world/quality';
import { tokens, tokenVersion } from '@/generated/tokens';
import styles from './inspector.module.css';

const PENDING = [
  ['Memory grant / revoke', 'Phase 1 · with the memory system'],
  ['Weather force', 'Phase 2 · with the seeded weather'],
  ['Puzzle override', 'Phase 1 · with the puzzle framework'],
  ['Seed override', 'Phase 2 · with the event table'],
] as const;

export function Inspector() {
  const quality = useSettings((s) => s.quality);
  const qualityManual = useSettings((s) => s.qualityManual);
  const showPerfHud = useSettings((s) => s.showPerfHud);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const setQuality = useSettings((s) => s.setQuality);
  const togglePerfHud = useSettings((s) => s.togglePerfHud);
  const setReducedMotion = useSettings((s) => s.setReducedMotion);

  const active = settingsFor(quality);

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <h1>World inspector</h1>
        <p>
          Ember tokens v{tokenVersion} · <Link href="/world?debug=1">open the world with the scrub</Link> ·{' '}
          <Link href="/world?perf=90&amp;debug=1">run the flythrough</Link> · <Link href="/">title screen</Link>
        </p>
      </header>

      <section className={styles.panel} aria-labelledby="quality-heading">
        <h2 id="quality-heading">Quality</h2>
        <div className={styles.tiers} role="group" aria-label="Quality tier">
          {QUALITY_TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              className={tier === quality ? `${styles.tier} ${styles.on}` : styles.tier}
              aria-pressed={tier === quality}
              onClick={() => setQuality(tier)}
            >
              {tier}
            </button>
          ))}
        </div>
        <p className={styles.note}>
          {qualityManual
            ? 'Manual — the live adapter is off for this visitor, as designed.'
            : 'Auto — detect-gpu picked this tier and the adapter may still move it.'}
        </p>

        <dl className={styles.readout}>
          <Fact k="resolution scale" v={String(active.resolutionScale)} />
          <Fact k="shadows" v={active.shadows.kind === 'baked' ? 'baked' : `${active.shadows.kind} ${'cascades' in active.shadows ? active.shadows.cascades : 1}×${active.shadows.size}`} />
          <Fact k="post fx" v={active.postFx.join(', ') || 'none'} />
          <Fact k="particles / foliage" v={`${Math.round(active.particles * 100)}% / ${Math.round(active.foliage * 100)}%`} />
          <Fact k="draw distance" v={`${active.drawDistance} m`} />
          <Fact k="textures" v={`${active.textureSize}px · aniso ${active.anisotropy}`} />
          <Fact k="antialiasing" v={active.antialiasing} />
        </dl>
      </section>

      <section className={styles.panel} aria-labelledby="switches-heading">
        <h2 id="switches-heading">Switches</h2>
        <label className={styles.switch}>
          <input type="checkbox" checked={showPerfHud} onChange={togglePerfHud} />
          Performance HUD <span className={styles.note}>(H in the world)</span>
        </label>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.currentTarget.checked)}
          />
          Reduced motion <span className={styles.note}>(overrides the OS setting for this session)</span>
        </label>
      </section>

      <section className={styles.panel} aria-labelledby="palette-heading">
        <h2 id="palette-heading">Palette</h2>
        <p className={styles.note}>
          The same values the world&rsquo;s shaders compile in. If a swatch here is wrong, both layers are wrong —
          which is the point of generating them from one file.
        </p>
        <ul className={styles.swatches} role="list">
          {Object.entries(tokens.semantic.color).map(([name, token]) => (
            <li key={name}>
              <span className={styles.chip} style={{ background: token.var }} aria-hidden="true" />
              <b>{name}</b>
              <code>{token.hex}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="pending-heading">
        <h2 id="pending-heading">Not built yet</h2>
        <ul className={styles.pending} role="list">
          {PENDING.map(([name, when]) => (
            <li key={name}>
              <b>{name}</b>
              <span>{when}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className={styles.fact}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
