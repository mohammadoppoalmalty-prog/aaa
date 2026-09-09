import { register, rng, type PuzzleDefinition } from './framework';

/**
 * CORE ENGINE — the Contact Tower, GDD Part 4 §17. The last one.
 *
 * Four dials and a plate of ratios. Each dial has to end up at a value the
 * others decide: the tower will not open until every reading agrees with every
 * other reading.
 *
 * The finale is arithmetic, not dexterity, and it is solvable on paper. That is
 * deliberate — a game that spends eight hours saying *look closely and think*
 * should not end on a reaction test. The last thing a player does here is the
 * first thing the Gate asked of them, at full size.
 */

export const DIALS = 4;
export const MODULUS = 10;

export interface Constraint {
  /** The dial this rule fixes. */
  readonly dial: number;
  /** Its value is the sum of the `from` dials, plus this constant, mod MODULUS. */
  readonly from: readonly number[];
  readonly plus: number;
}

export interface EngineState {
  readonly dials: readonly number[];
  readonly constraints: readonly Constraint[];
}

export type EngineInput = { readonly kind: 'set'; readonly dial: number; readonly to: number };

const satisfied = (state: EngineState, rule: Constraint): boolean => {
  const sum = rule.from.reduce((total, dial) => total + (state.dials[dial] ?? 0), 0);
  return (state.dials[rule.dial] ?? 0) === (sum + rule.plus + MODULUS * 2) % MODULUS;
};

export const coreEngine: PuzzleDefinition<EngineState, EngineInput> = register({
  id: 'core-engine',
  area: 'contact-tower',
  title: 'The Core Engine',
  premise: 'It is not locked. It is only waiting for the numbers to agree.',
  targetSeconds: 300,

  initial: (seed): EngineState => {
    const random = rng(seed);

    /* The rules are written *from* a chosen answer, so the system is consistent
       by construction. A finale generated as random simultaneous equations
       would be unsolvable most of the time, and the player would be told they
       had failed the last puzzle in the game by a bug. */
    const answer = Array.from({ length: DIALS }, () => Math.floor(random() * MODULUS));

    /* Dials 1..3 are each fixed by the dials before them, so the whole engine
       follows from dial 0 — which is what makes it solvable by hand in a couple
       of minutes rather than by trying ten thousand combinations. */
    const constraints: Constraint[] = [];
    for (let dial = 1; dial < DIALS; dial += 1) {
      const from = Array.from({ length: dial }, (_, index) => index).filter(
        (index) => index === dial - 1 || random() < 0.5,
      );
      const sum = from.reduce((total, index) => total + (answer[index] ?? 0), 0);
      const plus = ((answer[dial] ?? 0) - sum + MODULUS * 4) % MODULUS;
      constraints.push({ dial, from, plus });
    }

    // Start somewhere wrong, or the tower opens as the player walks in.
    const dials = answer.map((value, index) => (index === 0 ? value : (value + 1 + Math.floor(random() * 3)) % MODULUS));
    const start = { dials, constraints };
    if (constraints.every((rule) => satisfied(start, rule))) {
      return { constraints, dials: dials.map((value, index) => (index === 1 ? (value + 1) % MODULUS : value)) };
    }
    return start;
  },

  apply: (state, input) => {
    if (input.dial < 0 || input.dial >= DIALS) return state;
    return {
      ...state,
      dials: state.dials.map((value, index) =>
        index === input.dial ? ((input.to % MODULUS) + MODULUS) % MODULUS : value,
      ),
    };
  },

  validate: (state) => state.constraints.every((rule) => satisfied(state, rule)),

  /* Each rule fixes a dial in terms of earlier ones only, so one pass in order
     settles the whole engine. */
  solve: (state) => {
    const dials = [...state.dials];
    for (const rule of [...state.constraints].sort((a, b) => a.dial - b.dial)) {
      const sum = rule.from.reduce((total, dial) => total + (dials[dial] ?? 0), 0);
      dials[rule.dial] = (sum + rule.plus + MODULUS * 2) % MODULUS;
    }
    return { ...state, dials };
  },

  hints: [
    'The plate is not decoration. Every line on it is a rule.',
    'One dial answers to nothing. Everything else follows from it.',
    'Work down the plate in order. Each rule only uses dials above it.',
  ],

  solvedLine: 'The numbers agree. The tower opens, and what is at the top of it is not another puzzle.',

  rewards: { memories: ['career-05', 'project-04'], fragment: true },
});
