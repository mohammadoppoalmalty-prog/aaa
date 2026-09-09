import { register, rng, type PuzzleDefinition } from './framework';

/**
 * WORKSTATION BOOT — the Developer Studio, GDD Part 4 §7.
 *
 * A dead workstation and its boot sequence in pieces. Each step needs certain
 * other steps to have run first. Put them in an order that works.
 *
 * There is no single right answer, and that is the point: `validate` checks
 * that every dependency comes earlier, not that the list matches one blessed
 * permutation. A dependency puzzle that demands one exact order is a memory
 * test wearing an engineering costume.
 */

export interface Step {
  readonly id: number;
  readonly name: string;
  /** Step ids that must appear before this one. */
  readonly needs: readonly number[];
}

export interface BootState {
  /** The order the player has arranged, as step ids. */
  readonly order: readonly number[];
  readonly steps: readonly Step[];
}

export type BootInput = { readonly kind: 'move'; readonly from: number; readonly to: number };

const STEPS: readonly { name: string; needs: readonly number[] }[] = [
  { name: 'power', needs: [] },
  { name: 'mount the disk', needs: [0] },
  { name: 'load the kernel', needs: [1] },
  { name: 'bring up the network', needs: [2] },
  { name: 'unlock the keyring', needs: [1, 2] },
  { name: 'restore the session', needs: [3, 4] },
];

export const workstationBoot: PuzzleDefinition<BootState, BootInput> = register({
  id: 'workstation-boot',
  area: 'developer-studio',
  title: 'Cold Boot',
  premise: 'It remembers how to start. It has forgotten in what order.',
  targetSeconds: 150,

  initial: (seed): BootState => {
    const random = rng(seed);
    const steps: Step[] = STEPS.map((step, id) => ({ id, name: step.name, needs: step.needs }));

    const order = steps.map((step) => step.id);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const held = order[i]!;
      order[i] = order[j]!;
      order[j] = held;
    }

    // A shuffle that lands on a working order would open the door on arrival.
    const works = order.every((id, position) =>
      (steps[id]?.needs ?? []).every((need) => order.indexOf(need) < position),
    );
    if (works) {
      const held = order[0]!;
      order[0] = order[order.length - 1]!;
      order[order.length - 1] = held;
    }

    return { order, steps };
  },

  apply: (state, input) => {
    const { from, to } = input;
    if (from < 0 || from >= state.order.length || to < 0 || to >= state.order.length) return state;
    const order = [...state.order];
    const [held] = order.splice(from, 1);
    if (held === undefined) return state;
    order.splice(to, 0, held);
    return { ...state, order };
  },

  validate: (state) =>
    state.order.every((id, position) => {
      const step = state.steps.find((candidate) => candidate.id === id);
      return (step?.needs ?? []).every((need) => state.order.indexOf(need) < position);
    }),

  /* Kahn's algorithm. The steps form a DAG by construction, so this always
     terminates with every step placed. */
  solve: (state) => {
    const placed: number[] = [];
    const remaining = [...state.steps];
    while (remaining.length > 0) {
      const index = remaining.findIndex((step) => step.needs.every((need) => placed.includes(need)));
      if (index === -1) break;
      placed.push(remaining.splice(index, 1)[0]!.id);
    }
    return { ...state, order: placed.length === state.steps.length ? placed : state.order };
  },

  hints: [
    'Nothing can run before the thing it needs.',
    'One step needs nothing at all. It goes first.',
    'There is more than one working order. You only need one of them.',
  ],

  rewards: { memories: ['project-01', 'skill-02'], fragment: true },
});
