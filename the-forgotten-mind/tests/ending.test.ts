import { describe, expect, it } from 'vitest';
import { endingFor, type EndingProgress } from '../src/world/systems/ending';

/**
 * The ending is the one place in this project where a lie would cost the most,
 * so it is the one place tested hardest. These assertions are about *intent* —
 * what the ending is allowed to claim, and what it is never allowed to do —
 * rather than about the prose, which is free to be rewritten.
 */

const progress = (over: Partial<EndingProgress> = {}): EndingProgress => ({
  recovered: 0,
  total: 100,
  skipped: 0,
  puzzlesFinished: 0,
  revealedAll: false,
  ...over,
});

const ids = (p: EndingProgress) => endingFor(p).lines.map((line) => line.id);

describe('the ending', () => {
  it('always turns outward, whatever the visitor did', () => {
    for (const p of [
      progress(),
      progress({ recovered: 100 }),
      progress({ recovered: 3, skipped: 16 }),
      progress({ revealedAll: true }),
    ]) {
      expect(endingFor(p).invitation.id).toBe('invitation');
      // The point of the tower: it ends outside the fiction, at a real person.
      expect(endingFor(p).invitation.text).toMatch(/real person/i);
    }
  });

  it('never claims more than the visitor recovered', () => {
    expect(ids(progress({ recovered: 0 }))).toContain('recovery-few');
    expect(ids(progress({ recovered: 6 }))).toContain('recovery-few');
    expect(ids(progress({ recovered: 20 }))).toContain('recovery-some');
    expect(ids(progress({ recovered: 60 }))).toContain('recovery-most');
    expect(ids(progress({ recovered: 95 }))).toContain('recovery-nearly-all');

    // And exactly one of them, ever.
    for (const recovered of [0, 1, 14, 15, 49, 50, 89, 90, 100]) {
      const chosen = ids(progress({ recovered })).filter((id) => id.startsWith('recovery-'));
      expect(chosen, `${recovered} recovered chose ${chosen.length} lines`).toHaveLength(1);
    }
  });

  it('mentions a skip without charging for it', () => {
    const withSkips = endingFor(progress({ recovered: 10, skipped: 5 }));
    expect(withSkips.lines.map((line) => line.id)).toContain('skipped');

    /* The skip has been free all game. An ending that finally made it cost
       something would retract the promise on the last screen, so the words that
       would do that are banned outright. */
    const text = [...withSkips.lines, withSkips.invitation].map((line) => line.text).join(' ');
    for (const scold of [
      'should have',
      'could have tried',
      'gave up',
      'only managed',
      'failed',
      'missed out',
      'if you had',
      'unfortunately',
      'sadly',
      'but you',
    ]) {
      expect(text.toLowerCase(), `the ending scolds: "${scold}"`).not.toContain(scold);
    }
  });

  it('says nothing about skipping to someone who skipped nothing', () => {
    expect(ids(progress({ recovered: 40 }))).not.toContain('skipped');
  });

  it('answers the line LUMA arrived on', () => {
    // She said "I am not what I was". Leaving that hanging makes the arrival a
    // mood rather than a setup.
    for (const recovered of [0, 50, 100]) {
      expect(ids(progress({ recovered }))).toContain('luma-notes');
      expect(ids(progress({ recovered }))).toContain('luma-why');
    }
  });

  it('does not thank a reader for walking', () => {
    // To someone who opened the archive and read it, "you walked anyway" is a
    // non-sequitur — and the Reveal Contract says reading is not a lesser way in.
    expect(ids(progress({ recovered: 0, revealedAll: true }))).not.toContain('walked');
    expect(ids(progress({ recovered: 0, revealedAll: true }))).toContain('revealed');
    expect(ids(progress({ recovered: 40 }))).toContain('walked');
    // Nor someone who never recovered anything at all.
    expect(ids(progress({ recovered: 0 }))).not.toContain('walked');
  });

  it('warms the room by exactly what was recovered, and never past one', () => {
    expect(endingFor(progress({ recovered: 0 })).warmth).toBe(0);
    expect(endingFor(progress({ recovered: 50 })).warmth).toBeCloseTo(0.5);
    expect(endingFor(progress({ recovered: 100 })).warmth).toBe(1);
    // A save carrying more memories than the atlas has must not break the room.
    expect(endingFor(progress({ recovered: 400 })).warmth).toBe(1);
    expect(endingFor(progress({ recovered: 5, total: 0 })).warmth).toBe(1);
  });

  it('is always worth listening to — never a single line', () => {
    for (const p of [progress(), progress({ recovered: 100, skipped: 16, revealedAll: true })]) {
      expect(endingFor(p).lines.length).toBeGreaterThanOrEqual(4);
      for (const line of endingFor(p).lines) expect(line.text.length).toBeGreaterThan(20);
    }
  });
});
