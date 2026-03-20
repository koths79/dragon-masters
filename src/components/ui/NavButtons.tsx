import { useGameStore } from '../../store/useGameStore';
import type { Direction } from '../../types';

interface Props {
  hoveredDir: Direction | null;
  onMove: (dir: Direction) => void;
}

export function NavInstructions({ hoveredDir, onMove }: Props) {
  const rooms = useGameStore(s => s.rooms);
  const currentRoomId = useGameStore(s => s.currentRoomId);
  const current = rooms[currentRoomId];

  const hasConnection = (dir: Direction) => !!current?.connections[dir];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm md:text-base text-purple-300 uppercase tracking-wide font-semibold">Navigation</span>
      <div className="bg-purple-900/40 border border-purple-700/50 rounded-2xl px-4 py-4 flex flex-col items-center gap-3">
        {/* Compass-style grid */}
        <div className="grid grid-cols-3 gap-2 w-fit">
          {/* Top row: N */}
          <div />
          <NavButton
            dir="N"
            arrow={'\u2191'}
            label="North"
            active={hoveredDir === 'N'}
            enabled={hasConnection('N')}
            onMove={onMove}
          />
          <div />
          {/* Middle row: W, center, E */}
          <NavButton
            dir="W"
            arrow={'\u2190'}
            label="West"
            active={hoveredDir === 'W'}
            enabled={hasConnection('W')}
            onMove={onMove}
          />
          <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 text-purple-500 text-lg">
            {'\u2726'}
          </div>
          <NavButton
            dir="E"
            arrow={'\u2192'}
            label="East"
            active={hoveredDir === 'E'}
            enabled={hasConnection('E')}
            onMove={onMove}
          />
          {/* Bottom row: S */}
          <div />
          <NavButton
            dir="S"
            arrow={'\u2193'}
            label="South"
            active={hoveredDir === 'S'}
            enabled={hasConnection('S')}
            onMove={onMove}
          />
          <div />
        </div>
        <p className="text-xs text-purple-400 text-center">
          Tap a direction or use arrow keys + Enter
        </p>
      </div>
    </div>
  );
}

function NavButton({
  dir,
  arrow,
  label,
  active,
  enabled,
  onMove,
}: {
  dir: Direction;
  arrow: string;
  label: string;
  active: boolean;
  enabled: boolean;
  onMove: (dir: Direction) => void;
}) {
  return (
    <button
      onClick={() => enabled && onMove(dir)}
      disabled={!enabled}
      title={label}
      className={`
        flex flex-col items-center justify-center
        w-12 h-12 md:w-14 md:h-14
        rounded-xl font-bold text-lg md:text-xl
        transition-all duration-150
        ${enabled
          ? active
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105'
            : 'bg-purple-700 hover:bg-purple-600 text-purple-100 hover:scale-105'
          : 'bg-purple-900/30 text-purple-700 cursor-not-allowed'
        }
      `}
    >
      <span>{arrow}</span>
      <span className="text-[9px] md:text-[10px] uppercase tracking-wide leading-none">{dir}</span>
    </button>
  );
}
