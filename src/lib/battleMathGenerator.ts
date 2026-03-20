import type { Grade, BattleProblem } from '../types';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function level(qi: number): 0 | 1 | 2 {
  if (qi < 5) return 0;
  if (qi < 15) return 1;
  return 2;
}

function grade1(qi: number): BattleProblem {
  const lv = level(qi);
  const maxN = lv === 0 ? 10 : lv === 1 ? 15 : 20;
  if (lv === 0 || Math.random() < 0.6) {
    const a = randInt(0, maxN), b = randInt(0, maxN - a);
    return { expression: `${a} + ${b}`, answer: a + b };
  }
  const a = randInt(2, maxN), b = randInt(0, a);
  return { expression: `${a} - ${b}`, answer: a - b };
}

function grade2(qi: number): BattleProblem {
  const lv = level(qi);
  const useMultiply = lv > 0 && Math.random() < 0.4;
  if (useMultiply) {
    const a = randInt(1, lv === 1 ? 3 : 5), b = randInt(1, lv === 1 ? 3 : 5);
    return { expression: `${a} × ${b}`, answer: a * b };
  }
  const maxN = lv === 0 ? 30 : 100;
  const useAdd = Math.random() < 0.5;
  if (useAdd) {
    const a = randInt(0, maxN), b = randInt(0, maxN - a);
    return { expression: `${a} + ${b}`, answer: a + b };
  }
  const a = randInt(5, maxN), b = randInt(0, a);
  return { expression: `${a} - ${b}`, answer: a - b };
}

function grade3(qi: number): BattleProblem {
  const lv = level(qi);
  const roll = Math.random();
  if (roll < 0.4) {
    const maxMul = lv === 0 ? 5 : 10;
    const a = randInt(1, maxMul), b = randInt(1, maxMul);
    return { expression: `${a} × ${b}`, answer: a * b };
  }
  if (roll < 0.6 && lv > 0) {
    const b = randInt(2, 10), a = b * randInt(1, 10);
    return { expression: `${a} ÷ ${b}`, answer: a / b };
  }
  const maxN = lv < 2 ? 100 : 200;
  const useAdd = Math.random() < 0.5;
  if (useAdd) {
    const a = randInt(0, maxN), b = randInt(0, maxN - a);
    return { expression: `${a} + ${b}`, answer: a + b };
  }
  const a = randInt(10, maxN), b = randInt(0, a);
  return { expression: `${a} - ${b}`, answer: a - b };
}

function grade4(qi: number): BattleProblem {
  const lv = level(qi);
  const roll = Math.random();
  if (roll < 0.35) {
    const a = randInt(2, lv === 0 ? 9 : 12), b = randInt(2, lv === 0 ? 9 : 12);
    return { expression: `${a} × ${b}`, answer: a * b };
  }
  if (roll < 0.6) {
    const b = randInt(2, lv === 0 ? 9 : 12), a = b * randInt(2, lv === 0 ? 9 : 12);
    return { expression: `${a} ÷ ${b}`, answer: a / b };
  }
  if (roll < 0.8) {
    // simple two-step: a × b + c
    const a = randInt(2, 6), b = randInt(2, 6), c = randInt(1, 10);
    return { expression: `${a} × ${b} + ${c}`, answer: a * b + c };
  }
  // addition/subtraction with larger numbers
  const maxN = lv === 0 ? 500 : 999;
  if (Math.random() < 0.5) {
    const a = randInt(100, maxN), b = randInt(10, 200);
    return { expression: `${a} + ${b}`, answer: a + b };
  }
  const a = randInt(200, maxN), b = randInt(10, 200);
  return { expression: `${a} - ${b}`, answer: a - b };
}

function grade5(qi: number): BattleProblem {
  const lv = level(qi);
  const roll = Math.random();
  if (roll < 0.3) {
    const a = randInt(10, lv === 0 ? 20 : 25), b = randInt(2, 9);
    return { expression: `${a} × ${b}`, answer: a * b };
  }
  if (roll < 0.5) {
    const b = randInt(2, 12), a = b * randInt(5, lv === 0 ? 10 : 20);
    return { expression: `${a} ÷ ${b}`, answer: a / b };
  }
  if (roll < 0.75) {
    const a = randInt(2, 8), b = randInt(2, 8), c = randInt(2, 8);
    return { expression: `${a} × ${b} + ${c} × ${b}`, answer: a * b + c * b };
  }
  const a = randInt(100, lv === 0 ? 500 : 999), b = randInt(10, 200);
  return { expression: `${a} + ${b}`, answer: a + b };
}

export function generateBattleProblem(grade: Grade, questionIndex: number): BattleProblem {
  switch (grade) {
    case 1: return grade1(questionIndex);
    case 2: return grade2(questionIndex);
    case 3: return grade3(questionIndex);
    case 4: return grade4(questionIndex);
    case 5: return grade5(questionIndex);
  }
}
