/**
 * The ending — GDD Part 4 §17, the Contact Tower.
 *
 * The atlas states what this room is for: "the finale, and the way to reach a
 * real person." Both halves are load-bearing. A portfolio that ends inside its
 * own fiction has wasted the visitor's hour; the last thing in the tower is not
 * a puzzle, it is a door out of the metaphor.
 *
 * Three rules the script has to hold to, which is why it is a pure function
 * rather than a paragraph in a component:
 *
 * 1. **It never claims more than the visitor did.** Someone who recovered six
 *    memories and skipped four puzzles gets a real ending, and LUMA does not
 *    tell them they remembered everything. The one thing this project cannot
 *    afford to do at its most emotional moment is lie.
 * 2. **It never scolds.** The skip has been free all game — "a punished exit is
 *    not an exit" — and an ending that finally charges for it would retract the
 *    promise on the last screen.
 * 3. **It closes what the Overture opened.** LUMA arrived saying "I am not what
 *    I was." She has to answer that here or the arc has no shape.
 */

export interface EndingLine {
  /** Stable id, so tests assert on which line was chosen and not on its prose. */
  readonly id: string;
  readonly text: string;
}

export interface EndingScript {
  readonly lines: readonly EndingLine[];
  /** The turn outward. Always last, always present. */
  readonly invitation: EndingLine;
  /** 0–1. The scene lights the room by this; nothing else reads it. */
  readonly warmth: number;
}

export interface EndingProgress {
  /** Memories recovered, out of everything there is. */
  readonly recovered: number;
  readonly total: number;
  /** Puzzles finished by asking LUMA to do it. */
  readonly skipped: number;
  readonly puzzlesFinished: number;
  /** Whether the visitor opened the whole archive instead of walking to it. */
  readonly revealedAll: boolean;
}

const OPENING: EndingLine = {
  id: 'opening',
  text: 'The engine is running. Listen — that is the whole building, thinking.',
};

/* What was actually recovered. One of these, chosen by the number and by
   nothing else, because the number is the only honest thing to choose by. */
const RECOVERY: readonly (EndingLine & { readonly atLeast: number })[] = [
  {
    atLeast: 0.9,
    id: 'recovery-nearly-all',
    text: 'You found nearly all of it. He never expected anyone to go that far in.',
  },
  {
    atLeast: 0.5,
    id: 'recovery-most',
    text: 'More than half of it is back. That is more than he kept himself.',
  },
  {
    atLeast: 0.15,
    id: 'recovery-some',
    text: 'Not all of it. Enough that the lights are on and the doors know their own names.',
  },
  {
    atLeast: 0,
    id: 'recovery-few',
    text: 'Almost none of it, and the door opened anyway. That was the arrangement. It was never a toll.',
  },
];

const SKIPPED: EndingLine = {
  id: 'skipped',
  text: 'You asked me to do some of it for you, and I did. It counted the same. I said it would.',
};

const REVEALED: EndingLine = {
  id: 'revealed',
  text: 'You opened the archive early and read it straight through. That was always allowed. It is not a lesser way in.',
};

/* LUMA answering her own first line. She arrived saying "I am not what I was";
   leaving that unanswered would make the arrival a mood rather than a setup. */
const LUMA: readonly EndingLine[] = [
  {
    id: 'luma-notes',
    text: 'I told you I was what was left of the part of him that kept notes. That was true.',
  },
  {
    id: 'luma-why',
    text: 'I know where everything is now, because you put it back. I still do not always remember why. That part was never mine to hold.',
  },
];

const WALKED: EndingLine = {
  id: 'walked',
  text: 'You could have read all of this without taking a step. The offer stood the whole time. You walked anyway.',
};

const INVITATION: EndingLine = {
  id: 'invitation',
  text: 'So here is the last thing, and it is not a puzzle. He is a real person, he is still working, and he is reachable. The way to write to him is at the end of the Codex.',
};

export function endingFor(progress: EndingProgress): EndingScript {
  const total = Math.max(1, progress.total);
  const share = Math.min(1, Math.max(0, progress.recovered / total));

  const recovery =
    RECOVERY.find((candidate) => share >= candidate.atLeast) ?? RECOVERY[RECOVERY.length - 1]!;

  const lines: EndingLine[] = [OPENING, { id: recovery.id, text: recovery.text }];

  /* Acknowledged, not charged for. It is mentioned at all because pretending a
     skipped puzzle was solved would be the same lie in the other direction. */
  if (progress.skipped > 0) lines.push(SKIPPED);
  if (progress.revealedAll) lines.push(REVEALED);

  lines.push(...LUMA);

  // Only to someone who actually walked. To a reader it would be a non-sequitur.
  if (!progress.revealedAll && progress.recovered > 0) lines.push(WALKED);

  return { lines, invitation: INVITATION, warmth: share };
}
