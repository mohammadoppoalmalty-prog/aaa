import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ask, MIN_CONFIDENCE, stageFromRestoration, type LumaIntent } from '../src/world/systems/luma/fallback';

const intents: LumaIntent[] = JSON.parse(
  readFileSync(resolve(process.cwd(), 'content/luma/fallback.json'), 'utf8'),
).intents;

/**
 * The golden-question eval, as a unit test.
 *
 * GDD Part 11 asks for a forty-question regression harness before LUMA is
 * allowed near a model. This is that harness running against the scripted tree —
 * so when the AI does arrive, the questions it must not get *worse* at are
 * already written down.
 */
const GOLDEN: readonly (readonly [question: string, intent: string])[] = [
  ['who are you?', 'who-are-you'],
  ['what is luma', 'who-are-you'],
  ['what is this place?', 'what-is-this'],
  ['what is this site', 'what-is-this'],
  ['how do I move?', 'how-do-i-move'],
  ['which keys do I press to walk', 'how-do-i-move'],
  ['I am in a hurry', 'skip'],
  ['can I skip this', 'skip'],
  ['I only have five minutes', 'skip'],
  ['show me the projects', 'projects'],
  ['what has he built?', 'projects'],
  ['what went wrong in his work', 'what-broke'],
  ['tell me about a failure', 'what-broke'],
  ['what is his stack', 'skills'],
  ['which languages does he know', 'skills'],
  ['where has he worked', 'experience'],
  ['what is his job history', 'experience'],
  ['how do I contact him', 'contact'],
  ['what is his email', 'contact'],
  ['can I see a cv', 'contact'],
  ['how many memories are there', 'memories'],
  ['how do I recover a memory', 'memories'],
  ['I am stuck, where do I go', 'lost'],
  ['why is this door locked', 'locked'],
  ['what are the fragments', 'fragments'],
  ['give me a hint for this puzzle', 'puzzle-help'],
  ['does the game save', 'save'],
  ['is there a cat', 'cat'],
  ['why make a game instead of a normal site', 'why-a-game'],
  ['what is restoration', 'restoration'],
  ['can I play with a keyboard only', 'accessibility'],
  ['who made this', 'who-made-you'],
  ['are you a real ai', 'ai'],
  ['is this claude', 'ai'],
  ['how long does this take', 'how-long'],
];

describe("LUMA's scripted tree", () => {
  it('answers every golden question with the intended intent', () => {
    for (const [question, intent] of GOLDEN) {
      const reply = ask(question, intents, 2);
      expect(reply.intent, `"${question}" answered as ${reply.intent}`).toBe(intent);
      expect(reply.confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
    }
  });

  it('says it does not know rather than guessing at a fact about a person', () => {
    for (const question of [
      'what is his salary expectation',
      'is he married',
      'what did he score in his degree',
      'zzzzz',
    ]) {
      const reply = ask(question, intents, 2);
      expect(reply.intent, `"${question}" was answered as ${reply.intent}`).toBe('unknown');
      expect(reply.text).toContain('Codex');
    }
  });

  it('never offers a stage it has not reached', () => {
    const early = ask('what are the fragments', intents, 0);
    expect(early.intent).toBe('unknown');
    expect(ask('what are the fragments', intents, 1).intent).toBe('fragments');
  });

  it('always points somewhere — an answer with no next step is a dead end', () => {
    for (const [question] of GOLDEN) {
      const reply = ask(question, intents, 2);
      expect(reply.text.length).toBeGreaterThan(20);
    }
    expect(ask('nonsense here', intents, 2).codex).toBe('/codex');
  });

  it('is deterministic — the same question twice is the same answer', () => {
    const a = ask('how do I contact him', intents, 2);
    const b = ask('how do I contact him', intents, 2);
    expect(a).toEqual(b);
  });

  it('has no duplicate intent ids', () => {
    const ids = intents.map((intent) => intent.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('opens up as the world heals', () => {
    expect(stageFromRestoration(0)).toBe(0);
    expect(stageFromRestoration(0.15)).toBe(1);
    expect(stageFromRestoration(0.6)).toBe(2);
  });
});
