import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { Grade, Difficulty } from '../../types';


const DIFF_DESC: Record<Difficulty, string> = {
  easy:   'Small castle · fewer puzzles',
  medium: 'Bigger castle · multiply too',
  hard:   'Big castle · use every number',
};

export function StartScreen() {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>(2);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const initGame = useGameStore(s => s.initGame);
  const setCurrentGame = useGameStore(s => s.setCurrentGame);
  const leaderboard = useGameStore(s => s.leaderboard);

  const handleStart = () => {
    initGame(name.trim() || 'Player', grade, difficulty);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 gap-6 md:gap-8">
      <div className="text-center">
        <div className="text-6xl md:text-8xl mb-4">🏰🐉</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Storm the Castle</h1>
        <p className="text-amber-400 text-base md:text-lg">Dragon Math Quest</p>
      </div>

      <div className="rounded-2xl p-6 md:p-8 bg-purple-900/40 border border-purple-700/50 backdrop-blur w-full max-w-md shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold text-purple-100 mb-4">Start Adventure</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-purple-300 text-base md:text-lg block mb-1">Dragon Master Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="Enter your name, hero!"
              className="w-full bg-purple-950/60 border border-purple-600/40 rounded-2xl px-4 py-3 text-white text-base md:text-lg focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-purple-300 text-base md:text-lg block mb-1">Grade</label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as Grade[]).map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`flex-1 py-3 rounded-2xl font-bold text-base md:text-lg transition-colors ${
                    grade === g ? 'bg-amber-600 text-white' : 'bg-purple-800 text-purple-300 hover:bg-purple-700'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-purple-300 text-base md:text-lg block mb-1">Difficulty</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-3 rounded-2xl font-bold capitalize text-base md:text-lg transition-colors ${
                    difficulty === d ? 'bg-amber-600 text-white' : 'bg-purple-800 text-purple-300 hover:bg-purple-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-purple-400 text-xs text-center mt-1">{DIFF_DESC[difficulty]}</p>
          </div>

          <button
            onClick={handleStart}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-2xl transition-colors text-lg md:text-xl mt-2 shadow-lg shadow-amber-900/30"
          >
            Begin Your Quest! 🐉
          </button>

          <button
            onClick={() => setCurrentGame('SELECT')}
            className="text-purple-400 hover:text-purple-200 text-base md:text-lg transition-colors text-center py-2"
          >
            Back to Game Select
          </button>
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div className="rounded-2xl p-6 md:p-8 bg-purple-900/40 border border-purple-700/50 backdrop-blur w-full max-w-md overflow-x-auto">
          <h2 className="text-xl md:text-2xl font-bold text-purple-100 mb-3">🏆 Leaderboard</h2>
          <table className="w-full text-base md:text-lg">
            <thead>
              <tr className="text-purple-400">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Name</th>
                <th className="text-right py-2">Score</th>
                <th className="text-right py-2">Grade</th>
                <th className="text-right py-2">Diff</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={i} className="border-t border-purple-700/40">
                  <td className="py-2 text-purple-400">{i + 1}</td>
                  <td className="py-2 text-purple-100">{entry.name}</td>
                  <td className="py-2 text-amber-400 text-right font-bold">{entry.score}</td>
                  <td className="py-2 text-purple-300 text-right">{entry.grade}</td>
                  <td className="py-2 text-purple-300 text-right capitalize">{entry.difficulty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
