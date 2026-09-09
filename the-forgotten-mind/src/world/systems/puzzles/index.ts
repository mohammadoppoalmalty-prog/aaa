/**
 * Importing this module registers every puzzle.
 *
 * The registry is populated by side effect at import time, so anything that
 * looks a puzzle up by id — the save's reward payout, the debug inspector, the
 * pause menu's skip — imports this rather than the individual files. Importing
 * `framework` alone would find an empty registry and silently pay out nothing.
 */

export { cursorRitual, GLYPH_COUNT, litCount } from './cursor-ritual';
export type { Glyph, RitualState, RitualInput } from './cursor-ritual';
export { lightEcho, DIRECTIONS, rotate, upwindOf } from './light-echo';
export type { Direction, Lantern, EchoState, EchoInput } from './light-echo';
export { fountain, flow, GRID as FOUNTAIN_GRID, openingsOf } from './fountain';
export type { Piece, PieceKind, Side, FountainState, FountainInput } from './fountain';
export * from './framework';
