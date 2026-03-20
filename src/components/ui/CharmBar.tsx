import { useGameStore } from '../../store/useGameStore';
import type { CharmType } from '../../types';

const CHARM_INFO: Record<CharmType, { emoji: string; name: string; desc: string }> = {
  FIRE: { emoji: '\uD83D\uDD25', name: 'Fire', desc: 'Double a number' },
  ICE: { emoji: '\u2744\uFE0F', name: 'Ice', desc: 'Halve a number' },
  LIGHTNING: { emoji: '\u26A1', name: 'Storm', desc: 'New numbers' },
};

export function CharmBar() {
  const charms = useGameStore(s => s.charms);
  const activePuzzle = useGameStore(s => s.activePuzzle);
  const activateCharm = useGameStore(s => s.activateCharm);

  const handleCharm = (charm: CharmType) => {
    if (!activePuzzle) return;
    if (charm === 'LIGHTNING') {
      activateCharm(charm);
    } else {
      activateCharm(charm, 0);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm md:text-base text-purple-300 uppercase tracking-wide font-semibold">Charms</span>
      <div className="flex gap-3 flex-wrap">
        {charms.length === 0 && (
          <span className="text-purple-500 text-base md:text-lg italic">None collected yet</span>
        )}
        {charms.map((charm, i) => {
          const info = CHARM_INFO[charm];
          return (
            <button
              key={i}
              onClick={() => handleCharm(charm)}
              disabled={!activePuzzle}
              title={info.desc}
              className={`
                flex flex-col items-center gap-1
                min-w-[56px] min-h-[56px] md:min-w-[64px] md:min-h-[64px]
                bg-purple-800/60 hover:bg-purple-700/80
                disabled:opacity-40 disabled:cursor-not-allowed
                rounded-2xl p-2 md:p-3
                transition-all duration-150
                border border-purple-600/40
                hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/10
              `}
            >
              <span className="text-2xl md:text-3xl">{info.emoji}</span>
              <span className="text-[10px] md:text-xs text-purple-200 font-semibold leading-tight">{info.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
