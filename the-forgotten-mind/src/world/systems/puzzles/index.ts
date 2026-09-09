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
export { atticOrder, BOX_COUNT } from './attic-order';
export type { Box, AtticState, AtticInput } from './attic-order';
export { toolBench, SHAPES } from './tool-bench';
export type { Shape, Socket, Tool, BenchState, BenchInput } from './tool-bench';
export { circuitTable, LAMP_COUNT } from './circuit-table';
export type { CircuitState, CircuitInput } from './circuit-table';
export { workstationBoot } from './workstation-boot';
export type { Step, BootState, BootInput } from './workstation-boot';
export { shelfOrder, SUBJECTS, SHELF_COUNT } from './shelf-order';
export type { Subject, Book, ShelfState, ShelfInput } from './shelf-order';
export { journalRail, PLATE_COUNT } from './journal-rail';
export type { RailState, RailInput } from './journal-rail';
export { lightReflection, trace, GRID as REFLECTION_GRID } from './light-reflection';
export type { Tilt, Mirror, ReflectionState, ReflectionInput } from './light-reflection';
export { echoChamber, STONE_COUNT, PHRASE_LENGTH } from './echo-chamber';
export type { EchoChamberState, ChamberInput } from './echo-chamber';
export { mirrorAltar, TEETH, RING_COUNT } from './mirror-altar';
export type { AltarState, AltarInput } from './mirror-altar';
export { gravityBridge, ISLAND_COUNT } from './gravity-bridge';
export type { Island, BridgeState, BridgeInput } from './gravity-bridge';
export { constellation, STAR_COUNT } from './constellation';
export type { Star, ConstellationState, ConstellationInput } from './constellation';
export { bridgeAssembly, SECTION_COUNT } from './bridge-assembly';
export type { Span, AssemblyState, AssemblyInput } from './bridge-assembly';
export { coreEngine, DIALS, MODULUS } from './core-engine';
export type { Constraint, EngineState, EngineInput } from './core-engine';

export * from './framework';
