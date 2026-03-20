import { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';

export function VictoryScreen() {
  const score = useGameStore(s => s.score);
  const playerName = useGameStore(s => s.playerName);
  const saveToLeaderboard = useGameStore(s => s.saveToLeaderboard);
  const resetGame = useGameStore(s => s.resetGame);
  const setCurrentGame = useGameStore(s => s.setCurrentGame);

  useEffect(() => { saveToLeaderboard(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex flex-col items-center justify-center p-6 gap-6 text-center">
      <div>
        <div className="text-7xl md:text-9xl mb-4">🏆</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-amber-400 mb-2">Victory!</h1>
        <p className="text-purple-100 text-lg md:text-xl">The castle falls, <span className="text-amber-400 font-bold">{playerName}</span>!</p>
        <p className="text-purple-400 text-sm md:text-base mt-1">You are a true Dragon Master! 🐉</p>
      </div>

      <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl p-6 md:p-8 w-full max-w-sm">
        <div className="text-purple-300 text-sm md:text-base mb-1">Final Score</div>
        <div className="text-6xl md:text-7xl font-extrabold text-amber-400">{score}</div>
        <div className="text-emerald-400 text-sm md:text-base mt-2">✨ Saved to leaderboard!</div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={resetGame}
          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-amber-900/30"
        >
          Quest Again! ⚔️
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
