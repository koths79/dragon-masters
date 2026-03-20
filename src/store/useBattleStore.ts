import { create } from 'zustand';
import type { BattlePhase, BattleDragon, BattlePlayer, BattleProblem, Grade } from '../types';
import { generateBattleProblem } from '../lib/battleMathGenerator';
import { generateDragon } from '../lib/dragonGenerator';

// How many correct answers needed to earn 1 dragon
function dragonThreshold(myGrade: Grade, oppGrade: Grade): number {
  if (myGrade === oppGrade) return 2;
  return myGrade < oppGrade ? 1 : 2;
}

function emptyPlayer(name: string, grade: Grade): BattlePlayer {
  return { name, grade, dragons: [], selectedDragon: null, correctTowardNextDragon: 0 };
}

interface BattleStore {
  phase: BattlePhase;
  p1: BattlePlayer;
  p2: BattlePlayer;

  // collection
  collectionTimeLeft: number;
  currentProblem: BattleProblem | null;
  questionIndex: number;
  feedbackCorrect: boolean | null; // null = no feedback, true/false for flash

  // battle
  currentTurn: 1 | 2;
  p1Hp: number;
  p2Hp: number;
  p1MaxHp: number;
  p2MaxHp: number;
  battleProblem: BattleProblem | null;
  battleQuestionIndex: number;
  awaitingAction: boolean;
  winner: 1 | 2 | null;

  // actions
  initSetup(p1Name: string, p1Grade: Grade, p2Name: string, p2Grade: Grade): void;
  startCollection(player: 1 | 2): void;
  tickTimer(): void;
  submitCollectionAnswer(answer: number): { correct: boolean; dragonEarned: BattleDragon | null };
  passToPlayer2(): void;
  startDragonSelectP1(): void;
  selectDragon(player: 1 | 2, dragonId: string): void;
  passToP2Select(): void;
  submitBattleAnswer(answer: number): boolean;
  performAction(action: 'attack' | 'heal'): void;
  clearFeedback(): void;
  resetGame(): void;
}

let dragonCounter = 0;

export const useBattleStore = create<BattleStore>()((set, get) => ({
  phase: 'SETUP',
  p1: emptyPlayer('Player 1', 1),
  p2: emptyPlayer('Player 2', 1),

  collectionTimeLeft: 120,
  currentProblem: null,
  questionIndex: 0,
  feedbackCorrect: null,

  currentTurn: 1,
  p1Hp: 0,
  p2Hp: 0,
  p1MaxHp: 0,
  p2MaxHp: 0,
  battleProblem: null,
  battleQuestionIndex: 0,
  awaitingAction: false,
  winner: null,

  initSetup(p1Name, p1Grade, p2Name, p2Grade) {
    set({
      phase: 'SETUP',
      p1: emptyPlayer(p1Name || 'Player 1', p1Grade),
      p2: emptyPlayer(p2Name || 'Player 2', p2Grade),
      winner: null,
      awaitingAction: false,
    });
  },

  startCollection(player) {
    const phase = player === 1 ? 'COLLECTION_P1' : 'COLLECTION_P2';
    const { p1, p2 } = get();
    const grade = player === 1 ? p1.grade : p2.grade;
    set({
      phase,
      collectionTimeLeft: 120,
      questionIndex: 0,
      currentProblem: generateBattleProblem(grade, 0),
      feedbackCorrect: null,
    });
  },

  tickTimer() {
    const { collectionTimeLeft, phase } = get();
    if (phase !== 'COLLECTION_P1' && phase !== 'COLLECTION_P2') return;
    if (collectionTimeLeft <= 1) {
      // time's up — advance phase
      if (phase === 'COLLECTION_P1') {
        set({ collectionTimeLeft: 0, phase: 'PASS_TO_P2', currentProblem: null });
      } else {
        set({ collectionTimeLeft: 0, phase: 'DRAGON_SELECT_P1', currentProblem: null });
      }
    } else {
      set({ collectionTimeLeft: collectionTimeLeft - 1 });
    }
  },

  submitCollectionAnswer(answer) {
    const { currentProblem, p1, p2, questionIndex, phase } = get();
    if (!currentProblem) return { correct: false, dragonEarned: null };

    const isP1 = phase === 'COLLECTION_P1';
    const player = isP1 ? p1 : p2;
    const oppGrade = isP1 ? p2.grade : p1.grade;
    const correct = answer === currentProblem.answer;
    const newQIndex = questionIndex + 1;

    if (correct) {
      const threshold = dragonThreshold(player.grade, oppGrade);
      const newCorrect = player.correctTowardNextDragon + 1;
      let dragonEarned: BattleDragon | null = null;
      let resetCorrect = newCorrect;

      if (newCorrect >= threshold) {
        dragonEarned = generateDragon(`d-${++dragonCounter}`);
        resetCorrect = 0;
      }

      const updatedPlayer: BattlePlayer = {
        ...player,
        dragons: dragonEarned ? [...player.dragons, dragonEarned] : player.dragons,
        correctTowardNextDragon: resetCorrect,
      };

      set(s => ({
        p1: isP1 ? updatedPlayer : s.p1,
        p2: isP1 ? s.p2 : updatedPlayer,
        questionIndex: newQIndex,
        currentProblem: generateBattleProblem(player.grade, newQIndex),
        feedbackCorrect: true,
      }));

      return { correct: true, dragonEarned };
    } else {
      set(s => ({
        questionIndex: newQIndex,
        currentProblem: generateBattleProblem(player.grade, newQIndex),
        feedbackCorrect: false,
        p1: isP1 ? { ...s.p1, correctTowardNextDragon: 0 } : s.p1,
        p2: isP1 ? s.p2 : { ...s.p2, correctTowardNextDragon: 0 },
      }));
      return { correct: false, dragonEarned: null };
    }
  },

  passToPlayer2() {
    get().startCollection(2);
  },

  startDragonSelectP1() {
    const { p1 } = get();
    // If player earned 0 dragons, give them a starter
    if (p1.dragons.length === 0) {
      const starter = generateDragon(`starter-p1`);
      set(s => ({ p1: { ...s.p1, dragons: [starter] }, phase: 'DRAGON_SELECT_P1' }));
    } else {
      set({ phase: 'DRAGON_SELECT_P1' });
    }
  },

  selectDragon(player, dragonId) {
    const { p1, p2 } = get();
    if (player === 1) {
      const dragon = p1.dragons.find(d => d.id === dragonId) ?? null;
      set({ p1: { ...p1, selectedDragon: dragon }, phase: 'PASS_TO_P1_SELECT' });
    } else {
      // Ensure P2 has dragons
      let dragons = p2.dragons;
      if (dragons.length === 0) {
        dragons = [generateDragon('starter-p2')];
      }
      const dragon = dragons.find(d => d.id === dragonId) ?? dragons[0];
      const updatedP2 = { ...p2, dragons, selectedDragon: dragon };
      // Now start battle
      const updatedP1 = get().p1;
      const p1Dragon = updatedP1.selectedDragon!;
      const p2Dragon = dragon;
      const p1GradeBoost = updatedP1.grade < updatedP2.grade ? 1 : 0;
      const p2GradeBoost = updatedP2.grade < updatedP1.grade ? 1 : 0;
      const p1MaxHp = p1Dragon.health * 10;
      const p2MaxHp = p2Dragon.health * 10;
      set({
        phase: 'BATTLE',
        currentTurn: 1,
        p1Hp: p1MaxHp,
        p2Hp: p2MaxHp,
        p1MaxHp,
        p2MaxHp,
        // store adjusted power in the dragons
        p1: { ...updatedP1, selectedDragon: { ...p1Dragon, power: p1Dragon.power + p1GradeBoost } },
        p2: { ...updatedP2, selectedDragon: { ...p2Dragon, power: p2Dragon.power + p2GradeBoost } },
        battleProblem: generateBattleProblem(updatedP1.grade, 0),
        battleQuestionIndex: 0,
        awaitingAction: false,
        winner: null,
      });
    }
  },

  passToP2Select() {
    const { p2 } = get();
    if (p2.dragons.length === 0) {
      const starter = generateDragon('starter-p2');
      set(s => ({ p2: { ...s.p2, dragons: [starter] }, phase: 'DRAGON_SELECT_P2' }));
    } else {
      set({ phase: 'DRAGON_SELECT_P2' });
    }
  },

  submitBattleAnswer(answer) {
    const { battleProblem, currentTurn, p1, p2, p1Hp, p2Hp, battleQuestionIndex } = get();
    if (!battleProblem) return false;
    const correct = answer === battleProblem.answer;
    const newQIndex = battleQuestionIndex + 1;
    const grade = currentTurn === 1 ? p1.grade : p2.grade;

    if (correct) {
      set({ awaitingAction: true, battleProblem: generateBattleProblem(grade, newQIndex), battleQuestionIndex: newQIndex });
      return true;
    } else {
      // wrong: current player loses 2 HP
      const newP1Hp = currentTurn === 1 ? Math.max(0, p1Hp - 2) : p1Hp;
      const newP2Hp = currentTurn === 2 ? Math.max(0, p2Hp - 2) : p2Hp;
      const loser = newP1Hp <= 0 ? 1 : newP2Hp <= 0 ? 2 : null;
      const nextTurn: 1 | 2 = currentTurn === 1 ? 2 : 1;
      const nextGrade = nextTurn === 1 ? p1.grade : p2.grade;
      set({
        p1Hp: newP1Hp,
        p2Hp: newP2Hp,
        winner: loser,
        phase: loser ? 'VICTORY' : 'BATTLE',
        battleProblem: generateBattleProblem(nextGrade, newQIndex),
        battleQuestionIndex: newQIndex,
        currentTurn: nextTurn,
        awaitingAction: false,
      });
      return false;
    }
  },

  performAction(action) {
    const { currentTurn, p1, p2, p1Hp, p2Hp, p1MaxHp, p2MaxHp, battleProblem, battleQuestionIndex } = get();
    const attacker = currentTurn === 1 ? p1 : p2;
    const attackerPower = attacker.selectedDragon?.power ?? 1;
    const nextTurn: 1 | 2 = currentTurn === 1 ? 2 : 1;
    const nextGrade = nextTurn === 1 ? p1.grade : p2.grade;
    const newQIndex = battleQuestionIndex;

    let newP1Hp = p1Hp;
    let newP2Hp = p2Hp;

    if (action === 'attack') {
      const dmg = attackerPower * 3;
      if (currentTurn === 1) {
        newP2Hp = Math.max(0, p2Hp - dmg);
      } else {
        newP1Hp = Math.max(0, p1Hp - dmg);
      }
    } else {
      // heal
      if (currentTurn === 1) {
        newP1Hp = Math.min(p1MaxHp, p1Hp + 5);
      } else {
        newP2Hp = Math.min(p2MaxHp, p2Hp + 5);
      }
    }

    const loser = newP1Hp <= 0 ? 1 : newP2Hp <= 0 ? 2 : null;
    const nextProblem = battleProblem ?? generateBattleProblem(nextGrade, newQIndex);

    set({
      p1Hp: newP1Hp,
      p2Hp: newP2Hp,
      winner: loser,
      phase: loser ? 'VICTORY' : 'BATTLE',
      currentTurn: nextTurn,
      awaitingAction: false,
      battleProblem: generateBattleProblem(nextGrade, newQIndex),
    });

    void nextProblem; // suppress unused variable warning
  },

  clearFeedback() {
    set({ feedbackCorrect: null });
  },

  resetGame() {
    set({
      phase: 'SETUP',
      p1: emptyPlayer('Player 1', 1),
      p2: emptyPlayer('Player 2', 1),
      collectionTimeLeft: 120,
      currentProblem: null,
      questionIndex: 0,
      feedbackCorrect: null,
      currentTurn: 1,
      p1Hp: 0,
      p2Hp: 0,
      p1MaxHp: 0,
      p2MaxHp: 0,
      battleProblem: null,
      battleQuestionIndex: 0,
      awaitingAction: false,
      winner: null,
    });
  },
}));
