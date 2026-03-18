import { useGameStore } from '../../store/useGameStore';

export function GameSelectScreen() {
  const setCurrentGame = useGameStore(s => s.setCurrentGame);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 gap-8 md:gap-10">
      <div className="text-center">
        <div className="text-6xl md:text-8xl mb-4">🐉</div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
          Dragon Masters
        </h1>
        <p className="text-purple-300 text-base md:text-lg">
          Choose your quest, brave dragon master!
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch w-full md:w-auto px-2">
        <button
          onClick={() => setCurrentGame('STORM_CASTLE')}
          className="rounded-2xl p-6 md:p-8 bg-purple-900/40 border border-purple-700/50 backdrop-blur w-full md:w-80 text-left transition-all hover:shadow-lg hover:shadow-amber-900/30 hover:border-amber-500/60 group flex flex-col"
        >
          <div className="text-6xl md:text-8xl mb-4">🏰</div>
          <h2 className="text-xl md:text-2xl font-bold text-purple-100 mb-2 group-hover:text-amber-400 transition-colors">
            Storm the Castle
          </h2>
          <p className="text-purple-300 text-sm md:text-base mb-6 flex-1">
            Explore a magical maze and solve math puzzles to unlock doors. Collect powerful charms and reach the Final Vault to win!
          </p>
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-3 px-6 rounded-2xl text-center shadow-lg shadow-amber-900/30 text-lg">
            Play
          </div>
        </button>

        <button
          onClick={() => setCurrentGame('HATCHERY')}
          className="rounded-2xl p-6 md:p-8 bg-purple-900/40 border border-purple-700/50 backdrop-blur w-full md:w-80 text-left transition-all hover:shadow-lg hover:shadow-amber-900/30 hover:border-amber-500/60 group flex flex-col"
        >
          <div className="text-6xl md:text-8xl mb-4">🥚</div>
          <h2 className="text-xl md:text-2xl font-bold text-purple-100 mb-2 group-hover:text-amber-400 transition-colors">
            Dragon Hatchery
          </h2>
          <p className="text-purple-300 text-sm md:text-base mb-6 flex-1">
            Solve math problems to hatch dragon eggs and grow your collection. Earn speed and streak bonuses as you unlock all 20 dragons!
          </p>
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-3 px-6 rounded-2xl text-center shadow-lg shadow-amber-900/30 text-lg">
            Play
          </div>
        </button>
      </div>
    </div>
  );
}
