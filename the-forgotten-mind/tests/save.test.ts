import { describe, expect, it } from 'vitest';
import { decodeSaveCode, encodeSaveCode, freshSave, migrate, SAVE_VERSION } from '../src/state/save';

/**
 * The save is the one piece of state a visitor would be upset to lose, so the
 * rule these tests hold to is: **migration never throws and never silently
 * discards memories.** Every other field can fall back to a default.
 */
describe('save migration', () => {
  it('accepts a current save unchanged', () => {
    const save = freshSave(1_000);
    const { save: out, migrated } = migrate(save);
    expect(migrated).toBe(false);
    expect(out.memories).toEqual([]);
    expect(out.seed).toBe(save.seed);
  });

  it('keeps recovered memories when the rest of the save is damaged', () => {
    const { save } = migrate({
      version: 1,
      memories: ['m-001', 'm-014'],
      position: 'not a vector',
      luma: 42,
      puzzles: ['not', 'a', 'record'],
      yaw: Number.NaN,
    });
    expect(save.memories).toEqual(['m-001', 'm-014']);
    expect(save.position).toEqual([0, 1.5, 4]);
    expect(save.yaw).toBe(0);
    expect(save.luma).toEqual({ stage: 0, turns: [] });
    expect(save.puzzles).toEqual({});
  });

  it('drops junk entries rather than trusting the array wholesale', () => {
    const { save } = migrate({ version: 1, memories: ['m-001', 7, null, 'm-002'] });
    expect(save.memories).toEqual(['m-001', 'm-002']);
  });

  it('upgrades a v0 prototype save without inventing memory ids', () => {
    const { save, migrated } = migrate({ version: 0, memoryCount: 12, area: 'village' });
    expect(migrated).toBe(true);
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.memories).toEqual([]);
    expect(save.area).toBe('village');
  });

  it('refuses a save from a newer build instead of mangling it', () => {
    const { save } = migrate({ version: SAVE_VERSION + 1, memories: ['m-001'] });
    expect(save.memories).toEqual([]);
    expect(save.version).toBe(SAVE_VERSION);
  });

  it('never throws, whatever it is handed', () => {
    for (const junk of [null, undefined, 0, 'save', [], { version: 'one' }, { memories: 'm-001' }]) {
      expect(() => migrate(junk)).not.toThrow();
    }
  });

  it('keeps only known puzzle states', () => {
    const { save } = migrate({ version: 1, puzzles: { 'light-echo': 'solved', 'gravity': 'exploded' } });
    expect(save.puzzles).toEqual({ 'light-echo': 'solved' });
  });
});

describe('the save code', () => {
  it('round-trips a save through a URL-safe string', () => {
    const save = { ...freshSave(2_000), memories: ['m-001', 'm-002'], revealedAll: true };
    const code = encodeSaveCode(save);
    expect(code).not.toMatch(/[+/=]/);
    const back = decodeSaveCode(code);
    expect(back?.memories).toEqual(['m-001', 'm-002']);
    expect(back?.revealedAll).toBe(true);
  });

  it('returns null for a code that is not one', () => {
    expect(decodeSaveCode('nonsense!!')).toBeNull();
    expect(decodeSaveCode('')).toBeNull();
  });
});
