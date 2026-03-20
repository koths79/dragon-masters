import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Screen, GameMode, Grade, Difficulty, Room, CharmType, Direction, LeaderboardEntry, PuzzleConfig } from '../types';
import { generateMaze } from '../lib/mazeGenerator';
import { generatePuzzle } from '../lib/puzzleGenerator';
import { checkAnswer } from '../lib/puzzleSolver';
import { MAX_HEARTS } from '../constants/game';

interface GameStore {
  currentGame: GameMode;
  setCurrentGame: (g: GameMode) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
  playerName: string;
  grade: Grade;
  difficulty: Difficulty;
  hearts: number;
  score: number;
  charms: CharmType[];
  rooms: Record<string, Room>;
  currentRoomId: string;
  activePuzzle: PuzzleConfig | null;
  activeDoorId: string | null;
  leaderboard: LeaderboardEntry[];
  initGame(name: string, grade: Grade, difficulty: Difficulty): void;
  move(direction: Direction): void;
  openPuzzle(doorId: string): void;
  submitAnswer(expression: string): boolean;
  closePuzzle(): void;
  loseHeart(): void;
  activateCharm(charm: CharmType, tileIndex?: number): void;
  useHint(): string | null;   // returns the hint expression, deducts 5 points
  saveToLeaderboard(): void;
  resetGame(): void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentGame: 'SELECT',
      setCurrentGame: (g) => set({ currentGame: g }),
      screen: 'START',
      setScreen: (s) => set({ screen: s }),
      playerName: '',
      grade: 2,
      difficulty: 'medium',
      hearts: MAX_HEARTS,
      score: 0,
      charms: [],
      rooms: {},
      currentRoomId: '0',
      activePuzzle: null,
      activeDoorId: null,
      leaderboard: [],

      initGame(name, grade, difficulty) {
        const rooms = generateMaze(difficulty);
        set({
          screen: 'GAME',
          currentGame: 'STORM_CASTLE',
          playerName: name,
          grade,
          difficulty,
          hearts: MAX_HEARTS,
          score: 0,
          charms: [],
          rooms,
          currentRoomId: '0',
          activePuzzle: null,
          activeDoorId: null,
        });
      },

      move(direction) {
        const { rooms, currentRoomId, grade, difficulty } = get();
        const current = rooms[currentRoomId];
        if (!current) return;
        const nextId = current.connections[direction];
        if (!nextId) return;
        const next = rooms[nextId];

        // Mark current visited
        const updatedRooms = {
          ...rooms,
          [nextId]: { ...next, visited: true },
        };

        set({ rooms: updatedRooms, currentRoomId: nextId });

        // Handle room entry effects
        const room = updatedRooms[nextId];
        switch (room.type) {
          case 'TREASURE':
            if (!room.solved) {
              const puzzle = generatePuzzle(grade, difficulty);
              set({ activePuzzle: puzzle, activeDoorId: nextId });
            }
            break;
          case 'CHARM_FIRE':
            if (!next.visited) {
              set(s => ({
                score: s.score + 30,
                charms: s.charms.length >= 3 ? [...s.charms.slice(1), 'FIRE'] : [...s.charms, 'FIRE'],
              }));
            }
            break;
          case 'CHARM_ICE':
            if (!next.visited) {
              set(s => ({
                score: s.score + 30,
                charms: s.charms.length >= 3 ? [...s.charms.slice(1), 'ICE'] : [...s.charms, 'ICE'],
              }));
            }
            break;
          case 'CHARM_LIGHTNING':
            if (!next.visited) {
              set(s => ({
                score: s.score + 30,
                charms: s.charms.length >= 3 ? [...s.charms.slice(1), 'LIGHTNING'] : [...s.charms, 'LIGHTNING'],
              }));
            }
            break;
          case 'FINAL_VAULT':
            set(s => ({ score: s.score + 100, screen: 'VICTORY' }));
            break;
          case 'DOOR':
            if (!room.solved) {
              const puzzle = generatePuzzle(grade, difficulty);
              set({ activePuzzle: puzzle, activeDoorId: nextId });
            }
            break;
        }
      },

      openPuzzle(doorId) {
        const { grade, difficulty } = get();
        const puzzle = generatePuzzle(grade, difficulty);
        set({ activePuzzle: puzzle, activeDoorId: doorId });
      },

      submitAnswer(expression) {
        const { activePuzzle, activeDoorId, hearts, rooms } = get();
        if (!activePuzzle || !activeDoorId) return false;
        const result = checkAnswer(expression, activePuzzle.target, activePuzzle.numbers, activePuzzle.requireAll);
        if (result.correct) {
          const roomType = rooms[activeDoorId]?.type;
          const isTreasure = roomType === 'TREASURE';
          set(s => ({
            score: s.score + (isTreasure ? 20 : 10),
            hearts: isTreasure ? Math.min(s.hearts + 1, MAX_HEARTS) : s.hearts,
            rooms: {
              ...s.rooms,
              [activeDoorId]: { ...s.rooms[activeDoorId], solved: true },
            },
            activePuzzle: null,
            activeDoorId: null,
          }));
          return true;
        } else {
          const newHearts = hearts - 1;
          if (newHearts <= 0) {
            set({ hearts: 0, screen: 'GAMEOVER', activePuzzle: null, activeDoorId: null });
          } else {
            set({ hearts: newHearts });
          }
          return false;
        }
      },

      closePuzzle() {
        set({ activePuzzle: null, activeDoorId: null });
      },

      loseHeart() {
        const { hearts } = get();
        const newHearts = hearts - 1;
        if (newHearts <= 0) {
          set({ hearts: 0, screen: 'GAMEOVER', activePuzzle: null, activeDoorId: null });
        } else {
          set({ hearts: newHearts });
        }
      },

      activateCharm(charm, tileIndex) {
        const { activePuzzle, charms } = get();
        if (!activePuzzle) return;
        const charmIdx = charms.indexOf(charm);
        if (charmIdx === -1) return;
        const newCharms = charms.filter((_, i) => i !== charmIdx);
        let newNumbers = [...activePuzzle.numbers];
        if (charm === 'FIRE' && tileIndex !== undefined) {
          newNumbers[tileIndex] = newNumbers[tileIndex] * 2;
        } else if (charm === 'ICE' && tileIndex !== undefined) {
          newNumbers[tileIndex] = Math.floor(newNumbers[tileIndex] / 2);
        } else if (charm === 'LIGHTNING') {
          // Regenerate numbers: pick new random set keeping same count
          const count = newNumbers.length;
          newNumbers = Array.from({ length: count }, () => Math.floor(Math.random() * 12) + 2);
        }
        set({
          charms: newCharms,
          activePuzzle: { ...activePuzzle, numbers: newNumbers },
        });
      },

      useHint() {
        const { activePuzzle, score } = get();
        if (!activePuzzle) return null;
        set({ score: Math.max(0, score - 5) });
        return activePuzzle.solution;
      },

      saveToLeaderboard() {
        const { playerName, grade, difficulty, score, leaderboard } = get();
        const entry: LeaderboardEntry = {
          name: playerName,
          score,
          grade,
          difficulty,
          date: new Date().toISOString(),
        };
        const newLeaderboard = [...leaderboard, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
        set({ leaderboard: newLeaderboard });
      },

      resetGame() {
        set({ screen: 'START', activePuzzle: null, activeDoorId: null });
      },
    }),
    {
      name: 'dragon-masters',
      partialize: (state) => ({ leaderboard: state.leaderboard }),
    }
  )
);
