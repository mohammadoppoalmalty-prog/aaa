'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { decodeSaveCode, encodeSaveCode } from '@/state/save';
import { useGame } from '@/state/game';
import { useSettings } from '@/state/settings';
import { QUALITY_TIERS } from './quality';
import { AREA_SPECS, TOTAL_MEMORIES, type AreaId } from './areas/manifest';
import { reachable, restorationOf } from './systems/director';
import styles from './pause-menu.module.css';

/**
 * The pause menu — GDD Part 8.
 *
 * Two things here are not conveniences:
 *
 * — **The save code.** It is the only way progress leaves this browser, and it
 *   needs no account, no email and no server. Pasting one back is how a visitor
 *   moves from their phone to their laptop mid-visit.
 * — **Fast travel.** A 400 m walk back to the Village is charming once and
 *   hostile the fourth time. It lists only what is genuinely reachable, so it
 *   never becomes a way around a gate.
 *
 * "Begin again" asks first. It is the one destructive action in the project.
 */
export function PauseMenu() {
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<'root' | 'settings' | 'travel' | 'code'>('root');
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);

  const save = useGame((s) => s.save);
  const setArea = useGame((s) => s.setArea);
  const beginAgain = useGame((s) => s.beginAgain);
  const replaceSave = useGame((s) => s.replaceSave);
  const fragmentsHeld = useGame((s) => s.fragmentsHeld);

  const quality = useSettings((s) => s.quality);
  const setQuality = useSettings((s) => s.setQuality);
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const setReducedMotion = useSettings((s) => s.setReducedMotion);
  const showPerfHud = useSettings((s) => s.showPerfHud);
  const togglePerfHud = useSettings((s) => s.togglePerfHud);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return;
      if (document.activeElement?.tagName === 'INPUT') return;
      event.preventDefault();
      setOpen((v) => !v);
      setPane('root');
      setConfirming(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) dialog.current?.focus();
  }, [open, pane]);

  const restoration = save.revealedAll ? 1 : restorationOf(save.memories.length, TOTAL_MEMORIES);
  const destinations = useMemo(
    () => reachable(save.area as AreaId, { restoration, fragments: fragmentsHeld() }),
    [save.area, restoration, fragmentsHeld],
  );

  if (!open) {
    return (
      <button type="button" className={styles.open} onClick={() => setOpen(true)}>
        Menu <kbd>Esc</kbd>
      </button>
    );
  }

  return (
    <div className={styles.scrim} role="dialog" aria-modal="true" aria-label="Paused">
      <div className={styles.sheet} ref={dialog} tabIndex={-1}>
        <p className={styles.head}>
          Paused
          <span>
            ◈ {save.revealedAll ? TOTAL_MEMORIES : save.memories.length} / {TOTAL_MEMORIES} ·{' '}
            {fragmentsHeld()} / 8 fragments · {AREA_SPECS[save.area as AreaId]?.name ?? save.area}
          </span>
        </p>

        {pane === 'root' ? (
          <ul className={styles.list} role="list">
            <li>
              <button type="button" onClick={() => setOpen(false)}>
                Resume
              </button>
            </li>
            <li>
              <Link href="/codex">Codex</Link>
            </li>
            <li>
              <button type="button" onClick={() => setPane('travel')}>
                Map &amp; fast travel
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setPane('settings')}>
                Settings
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setPane('code')}>
                Save code
              </button>
            </li>
            <li>
              {confirming ? (
                <span className={styles.confirm}>
                  This erases everything you have recovered.
                  <button
                    type="button"
                    onClick={() => {
                      beginAgain();
                      setConfirming(false);
                      setOpen(false);
                    }}
                  >
                    Erase it
                  </button>
                  <button type="button" onClick={() => setConfirming(false)}>
                    Keep it
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirming(true)}>
                  Begin again
                </button>
              )}
            </li>
          </ul>
        ) : null}

        {pane === 'travel' ? (
          <>
            <ul className={styles.list} role="list">
              {destinations.map((area) => (
                <li key={area.id}>
                  <button
                    type="button"
                    disabled={area.id === save.area}
                    onClick={() => {
                      setArea(area.id);
                      setOpen(false);
                    }}
                  >
                    {area.name}
                    <span>
                      {area.id === save.area ? 'you are here' : `${area.memories} memories`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              Only places you could walk to are listed. Fast travel is a shortcut through distance, never through a
              gate.
            </p>
          </>
        ) : null}

        {pane === 'settings' ? (
          <div className={styles.settings}>
            <fieldset>
              <legend>Graphics</legend>
              <div className={styles.tiers}>
                {QUALITY_TIERS.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    aria-pressed={tier === quality}
                    className={tier === quality ? styles.on : undefined}
                    onClick={() => setQuality(tier)}
                  >
                    {tier}
                  </button>
                ))}
              </div>
              <label>
                <input type="checkbox" checked={showPerfHud} onChange={togglePerfHud} /> Frame-rate counter
              </label>
            </fieldset>

            <fieldset>
              <legend>Accessibility</legend>
              <label>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(event) => setReducedMotion(event.currentTarget.checked)}
                />{' '}
                Reduced motion
              </label>
              <p className={styles.note}>
                Every interactable can be cycled with <kbd>[</kbd> and <kbd>]</kbd> and taken with <kbd>E</kbd>, so
                nothing here needs aim. What is and is not met is written down at{' '}
                <Link href="/accessibility">/accessibility</Link>.
              </p>
            </fieldset>

            <fieldset>
              <legend>Audio</legend>
              <p className={styles.note}>
                Five sliders land with the audio pass in Phase 5. There is no sound yet, and a row of dead controls
                would be worse than saying so.
              </p>
            </fieldset>
          </div>
        ) : null}

        {pane === 'code' ? (
          <div className={styles.code}>
            <p className={styles.note}>
              Your progress lives in this browser. This code carries it to another one — no account, no email, nothing
              sent anywhere.
            </p>
            <textarea readOnly value={encodeSaveCode(save)} rows={3} aria-label="Your save code" />
            <div className={styles.row}>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(encodeSaveCode(save))
                    .then(() => setNotice('Copied.'))
                    .catch(() => setNotice('Your browser would not let me copy it — select it and copy by hand.'));
                }}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => {
                  const pasted = window.prompt('Paste a save code');
                  if (!pasted) return;
                  const restored = decodeSaveCode(pasted.trim());
                  if (!restored) {
                    setNotice('That is not a save code I can read.');
                    return;
                  }
                  replaceSave(restored);
                  setNotice(`Restored — ${restored.memories.length} memories.`);
                }}
              >
                Paste one
              </button>
            </div>
            {notice ? <p className={styles.notice}>{notice}</p> : null}
          </div>
        ) : null}

        {pane !== 'root' ? (
          <button type="button" className={styles.back} onClick={() => setPane('root')}>
            ← Back
          </button>
        ) : null}
      </div>
    </div>
  );
}
