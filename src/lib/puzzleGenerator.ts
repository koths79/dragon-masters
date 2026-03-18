import type { Grade, Difficulty, PuzzleConfig } from '../types';

interface PuzzleCfg {
  numCount: number;       // numbers in the solution
  ops: string[];          // allowed operators
  min: number;            // minimum valid target
  max: number;            // maximum valid target
  numRange: [number, number];  // range for each number
  distractors: number;    // extra numbers shown (0 = requireAll)
}

// distractors > 0  →  player picks a subset (easy/medium style)
// distractors = 0  →  player must use ALL numbers (hard style)
const PUZZLE_MAP: Record<Grade, Record<Difficulty, PuzzleCfg>> = {
  1: {
    // Grade 1: 2 numbers + 1 op, always show 4 (2 distractors), + and - only
    easy:   { numCount: 2, ops: ['+'],       min: 2, max: 12, numRange: [1, 9],  distractors: 2 },
    medium: { numCount: 2, ops: ['+', '-'],  min: 2, max: 15, numRange: [1, 9],  distractors: 2 },
    hard:   { numCount: 2, ops: ['+', '-'],  min: 3, max: 18, numRange: [2, 12], distractors: 0 },
  },
  2: {
    easy:   { numCount: 2, ops: ['+', '-'],       min: 3,  max: 25, numRange: [1, 15], distractors: 2 },
    medium: { numCount: 2, ops: ['+', '-', '*'],   min: 5,  max: 40, numRange: [2, 9],  distractors: 2 },
    hard:   { numCount: 3, ops: ['+', '-', '*'],   min: 10, max: 50, numRange: [2, 9],  distractors: 0 },
  },
  3: {
    easy:   { numCount: 2, ops: ['+', '-', '*'],         min: 5,  max: 30,  numRange: [2, 9],  distractors: 2 },
    medium: { numCount: 2, ops: ['+', '-', '*'],         min: 10, max: 50,  numRange: [2, 9],  distractors: 2 },
    hard:   { numCount: 3, ops: ['+', '-', '*'],         min: 15, max: 60,  numRange: [2, 9],  distractors: 0 },
  },
  4: {
    easy:   { numCount: 2, ops: ['+', '-', '*'],         min: 5,  max: 40,  numRange: [2, 9],  distractors: 2 },
    medium: { numCount: 3, ops: ['+', '-', '*', '/'],    min: 10, max: 70,  numRange: [2, 9],  distractors: 2 },
    hard:   { numCount: 4, ops: ['+', '-', '*', '/'],    min: 20, max: 100, numRange: [2, 12], distractors: 0 },
  },
  5: {
    easy:   { numCount: 3, ops: ['+', '-', '*', '/'],   min: 10, max: 70,  numRange: [2, 9],  distractors: 2 },
    medium: { numCount: 3, ops: ['+', '-', '*', '/'],   min: 20, max: 120, numRange: [2, 12], distractors: 2 },
    hard:   { numCount: 4, ops: ['+', '-', '*', '/'],   min: 30, max: 180, numRange: [2, 15], distractors: 0 },
  },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generatePuzzle(grade: Grade, difficulty: Difficulty): PuzzleConfig {
  const cfg = PUZZLE_MAP[grade][difficulty];
  const requireAll = cfg.distractors === 0;

  for (let attempt = 0; attempt < 100; attempt++) {
    // Pick solution numbers
    const numbers: number[] = [];
    for (let i = 0; i < cfg.numCount; i++) {
      numbers.push(randInt(cfg.numRange[0], cfg.numRange[1]));
    }

    // Pick operators between them
    const ops: string[] = [];
    for (let i = 0; i < cfg.numCount - 1; i++) {
      ops.push(cfg.ops[Math.floor(Math.random() * cfg.ops.length)]);
    }

    // Evaluate left-to-right to derive target
    let result = numbers[0];
    for (let i = 0; i < ops.length; i++) {
      const n = numbers[i + 1];
      switch (ops[i]) {
        case '+': result = result + n; break;
        case '-': result = result - n; break;
        case '*': result = result * n; break;
        case '/':
          if (n === 0 || result % n !== 0) { result = NaN; break; }
          result = result / n; break;
      }
    }

    if (isNaN(result) || result < cfg.min || result > cfg.max || !Number.isInteger(result)) continue;

    // Build the solution expression with left-to-right parenthesization
    // so hint expressions evaluate correctly under standard operator precedence.
    // 2 numbers: "a op b"  3 numbers: "(a op1 b) op2 c"  4 numbers: "((a op1 b) op2 c) op3 d"
    let solution = String(numbers[0]);
    for (let i = 0; i < ops.length; i++) {
      const rhs = String(numbers[i + 1]);
      solution = i === 0
        ? `${solution} ${ops[i]} ${rhs}`
        : `(${solution}) ${ops[i]} ${rhs}`;
    }

    // Add distractors for easy/medium (always 2 extras; grade 1 always has distractors)
    const shownNumbers = requireAll
      ? shuffle([...numbers])
      : shuffle([
          ...numbers,
          ...Array.from({ length: cfg.distractors }, () => randInt(cfg.numRange[0], cfg.numRange[1])),
        ]);

    return {
      target: result,
      numbers: shownNumbers,
      coreCount: cfg.numCount,
      operations: cfg.ops,
      requireAll,
      solution,
    };
  }

  // Fallback: simple addition
  const a = randInt(cfg.numRange[0], cfg.numRange[1]);
  const b = randInt(cfg.numRange[0], cfg.numRange[1]);
  const shownNumbers = requireAll
    ? shuffle([a, b])
    : shuffle([a, b, randInt(cfg.numRange[0], cfg.numRange[1]), randInt(cfg.numRange[0], cfg.numRange[1])]);
  return { target: a + b, numbers: shownNumbers, coreCount: 2, operations: cfg.ops, requireAll, solution: `${a} + ${b}` };
}
