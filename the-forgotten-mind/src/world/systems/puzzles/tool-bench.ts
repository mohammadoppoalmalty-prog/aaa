import { register, rng, type PuzzleDefinition } from './framework';

/**
 * TOOL BENCH — the Learning Workshop, GDD Part 4 §5.
 *
 * Every socket in the bench is cut for one tool. Hang each tool where it fits.
 *
 * A tool already in the right place is left visibly right, and a tool in the
 * wrong place is not punished — it is simply swapped out when something else
 * needs the socket. The puzzle has no fail state and no move limit because its
 * subject is learning, and a workshop that punishes a wrong guess teaches
 * people to stop guessing.
 */

export const SHAPES = ['hex', 'square', 'round', 'blade', 'claw'] as const;
export type Shape = (typeof SHAPES)[number];

export interface Socket {
  readonly id: number;
  readonly shape: Shape;
  /** Which tool is hanging here, or null. */
  readonly tool: number | null;
}

export interface Tool {
  readonly id: number;
  readonly shape: Shape;
  readonly name: string;
}

export interface BenchState {
  readonly sockets: readonly Socket[];
  readonly tools: readonly Tool[];
  /** Tool ids not currently in a socket. */
  readonly loose: readonly number[];
}

export type BenchInput =
  | { readonly kind: 'hang'; readonly tool: number; readonly socket: number }
  | { readonly kind: 'take'; readonly socket: number };

const NAMES: Record<Shape, string> = {
  hex: 'a hex key, worn smooth',
  square: 'a square file',
  round: 'a round rasp',
  blade: 'a chisel',
  claw: 'a claw hammer',
};

export const toolBench: PuzzleDefinition<BenchState, BenchInput> = register({
  id: 'tool-bench',
  area: 'learning-workshop',
  title: 'The Bench',
  premise: 'Someone kept this bench for years. Every socket is cut for one tool.',
  targetSeconds: 100,

  initial: (seed): BenchState => {
    const random = rng(seed);
    /* One socket per shape, in a shuffled order — so the answer is a bijection
       and no two tools ever compete for the same hole. */
    const order = [...SHAPES];
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const held = order[i]!;
      order[i] = order[j]!;
      order[j] = held;
    }

    const sockets: Socket[] = order.map((shape, id) => ({ id, shape, tool: null }));
    const tools = SHAPES.map((shape, id) => ({ id, shape, name: NAMES[shape] }));
    return { sockets, tools, loose: tools.map((tool) => tool.id) };
  },

  apply: (state, input) => {
    if (input.kind === 'take') {
      const socket = state.sockets[input.socket];
      if (!socket || socket.tool === null) return state;
      return {
        ...state,
        sockets: state.sockets.map((s) => (s.id === socket.id ? { ...s, tool: null } : s)),
        loose: [...state.loose, socket.tool],
      };
    }

    const socket = state.sockets[input.socket];
    if (!socket) return state;
    /* Hanging a tool where another already hangs displaces it to the floor
       rather than refusing: a bench that says "no" is a bench nobody uses. */
    const displaced = socket.tool;
    return {
      ...state,
      sockets: state.sockets.map((s) =>
        s.id === socket.id ? { ...s, tool: input.tool } : s.tool === input.tool ? { ...s, tool: null } : s,
      ),
      loose: [
        ...state.loose.filter((id) => id !== input.tool),
        ...(displaced !== null && displaced !== input.tool ? [displaced] : []),
      ],
    };
  },

  validate: (state) =>
    state.sockets.every((socket) => {
      const tool = state.tools.find((candidate) => candidate.id === socket.tool);
      return tool !== undefined && tool.shape === socket.shape;
    }),

  solve: (state) => ({
    ...state,
    loose: [],
    sockets: state.sockets.map((socket) => ({
      ...socket,
      tool: state.tools.find((tool) => tool.shape === socket.shape)?.id ?? null,
    })),
  }),

  hints: [
    'The sockets are not decorative. Look at their shapes.',
    'Every tool fits exactly one, and every socket takes exactly one.',
    'Start with the shape you are surest of and work outward.',
  ],

  rewards: { memories: ['skill-01', 'lesson-02'], fragment: true },
});
