import { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useHatcheryStore } from '../../store/useHatcheryStore';
import type { Grade } from '../../types';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; desc: string }> = {
  easy:   { label: 'Easy',     desc: 'Smaller numbers' },
  medium: { label: 'Medium',   desc: 'Standard challenge' },
  hard:   { label: 'Hard',     desc: 'Big numbers & multi-step' },
};

export function HatcheryStartScreen() {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [lbGrade, setLbGrade] = useState<Grade>(1);
  const [lbDiff, setLbDiff] = useState<Difficulty>('medium');
  const setCurrentGame = useGameStore(s => s.setCurrentGame);
  const initGame = useHatcheryStore(s => s.initGame);
  const leaderboard = useHatcheryStore(s => s.leaderboard);

  const gradeLeaderboard = leaderboard
    .filter(e => e.grade === lbGrade && e.difficulty === lbDiff)
    .sort((a, b) => b.score - a.score);

  const handleStart = () => {
    initGame(name.trim() || 'Player', grade, difficulty);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 gap-6 md:gap-8">
      <div className="text-center">
        <div className="text-6xl md:text-8xl mb-4">🥚🐉</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Dragon Egg Hatchery</h1>
        <p className="text-amber-400 text-base md:text-lg">Hatch all 10 dragons!</p>
      </div>

      <div className="rounded-2xl p-6 md:p-8 bg-purple-900/40 border border-purple-700/50 backdrop-blur w-full max-w-md shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold text-purple-100 mb-4">Start Hatching</h2>
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
                  className={`flex-1 py-3 rounded-2xl font-bold transition-colors text-base md:text-lg ${
                    difficulty === d
                      ? 'bg-amber-600 text-white'
                      : 'bg-purple-800 text-purple-300 hover:bg-purple-700'
                  }`}
                >
                  {DIFFICULTY_LABELS[d].label}
                </button>
              ))}
            </div>
            <p className="text-purple-400 text-sm md:text-base mt-1">{DIFFICULTY_LABELS[difficulty].desc}</p>
          </div>

          <button
            onClick={handleStart}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 rounded-2xl transition-colors text-lg md:text-xl mt-2 shadow-lg shadow-amber-900/30"
          >
            Begin Hatching! 🥚
          </button>

          <button
            onClick={() => setCurrentGame('SELECT')}
            className="text-purple-400 hover:text-purple-200 text-base md:text-lg transition-colors text-center py-2"
          >
            Back to Game Select
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-6 md:p-8 bg-purple-900/40 border border-purple-700/50 backdrop-blur w-full max-w-md overflow-x-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-purple-100">🏆 Leaderboard</h2>
          <div className="flex gap-1">
            {([1, 2, 3, 4, 5] as Grade[]).map(g => (
              <button
                key={g}
                onClick={() => setLbGrade(g)}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-xl text-sm md:text-base font-bold transition-colors ${
                  lbGrade === g ? 'bg-amber-600 text-white' : 'bg-purple-800 text-purple-300 hover:bg-purple-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              onClick={() => setLbDiff(d)}
              className={`flex-1 py-2 rounded-xl text-sm md:text-base font-bold transition-colors ${
                lbDiff === d ? 'bg-amber-600 text-white' : 'bg-purple-800 text-purple-400 hover:bg-purple-700'
              }`}
            >
              {DIFFICULTY_LABELS[d].label}
            </button>
          ))}
        </div>
        {gradeLeaderboard.length === 0 ? (
          <p className="text-purple-400 text-base md:text-lg">No scores yet. Be the first!</p>
        ) : (
          <table className="w-full text-base md:text-lg">
            <thead>
              <tr className="text-purple-400">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Name</th>
                <th className="text-right py-2">Score</th>
                <th className="text-right py-2">Dragons</th>
              </tr>
            </thead>
            <tbody>
              {gradeLeaderboard.map((entry, i) => (
                <tr key={i} className="border-t border-purple-700/40">
                  <td className="py-2 text-purple-400">{i + 1}</td>
                  <td className="py-2 text-purple-100">{entry.name}</td>
                  <td className="py-2 text-amber-400 text-right font-bold">{entry.score}</td>
                  <td className="py-2 text-purple-300 text-right">{entry.dragonsUnlocked}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
