import { useEffect, useRef } from 'react';
import { useHatcheryStore } from '../../store/useHatcheryStore';
import { useGameStore } from '../../store/useGameStore';

const DRAGON_NAMES = [
  'Ember', 'Sparky', 'Blaze', 'Sunny', 'Cinder',
  'Crimson', 'Scarlet', 'Fury', 'Ember Rose', 'Magma',
  'Frost', 'Steel', 'Shadow', 'Smoke', 'Void',
  'Aurum', 'Lava King', 'Obsidian', 'Nebula', 'Ancient',
];

export function HatcheryVictoryScreen() {
  const { playerName, grade, score, dragonsUnlocked, saveToLeaderboard, resetGame } = useHatcheryStore();
  const setCurrentGame = useGameStore(s => s.setCurrentGame);
  const saved = useRef(false);

  useEffect(() => {
    if (!saved.current) {
      saved.current = true;
      saveToLeaderboard();
    }
  }, [saveToLeaderboard]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex flex-col items-center justify-center p-4 md:p-6 gap-6">
      <div className="text-center">
        <div className="text-6xl md:text-8xl mb-3">🎉🐉🎉</div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-amber-400 mb-2">All Dragons Hatched!</h1>
        <p className="text-purple-100 text-base md:text-xl">
          <span className="text-amber-400 font-bold">{playerName}</span> collected all {dragonsUnlocked} dragons!
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <span className="bg-purple-900/60 border border-amber-700/50 text-amber-400 font-extrabold text-xl md:text-2xl px-6 py-2 rounded-2xl">
            {score} pts
          </span>
          <span className="bg-purple-900/60 border border-purple-600/50 text-purple-300 font-bold px-4 py-2 rounded-2xl">
            Grade {grade}
          </span>
        </div>
      </div>

      {/* Dragon collection grid */}
      <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl p-4 md:p-6 w-full max-w-2xl">
        <h2 className="text-purple-100 font-bold text-lg md:text-xl mb-4 text-center">🐉 Your Dragon Collection</h2>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 md:gap-3">
          {Array.from({ length: dragonsUnlocked }, (_, i) => (
            <div
              key={i}
              className="bg-purple-800/50 border border-purple-600/50 rounded-xl p-2 md:p-3 flex flex-col items-center gap-1"
            >
              <div className="text-2xl md:text-3xl">🐉</div>
              <div className="text-amber-400 text-xs font-bold text-center leading-tight">{DRAGON_NAMES[i]}</div>
              <div className="text-purple-500 text-xs">#{i + 1}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          onClick={resetGame}
          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-amber-900/30"
        >
          Hatch Again! 🥚
        </button>
        <button
          onClick={() => { resetGame(); setCurrentGame('SELECT'); }}
          className="flex-1 bg-purple-700 hover:bg-purple-600 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
