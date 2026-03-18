import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { HeartsDisplay } from './HeartsDisplay';
import { CharmBar } from './CharmBar';
import { NavInstructions } from './NavButtons';
import { MiniMap } from './MiniMap';
import type { Direction } from '../../types';

const GRADE_LABEL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' };
const DIFF_COLORS: Record<string, string> = {
  easy:   'bg-emerald-800/60 text-emerald-300 border-emerald-700/50',
  medium: 'bg-amber-800/60 text-amber-300 border-amber-700/50',
  hard:   'bg-red-800/60 text-red-300 border-red-700/50',
};

const KEY_DIR: Record<string, Direction> = {
  ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E',
};

export function GamePanel() {
  const playerName = useGameStore(s => s.playerName);
  const grade     = useGameStore(s => s.grade);
  const difficulty = useGameStore(s => s.difficulty);
  const hearts    = useGameStore(s => s.hearts);
  const score     = useGameStore(s => s.score);
  const rooms     = useGameStore(s => s.rooms);
  const currentRoomId = useGameStore(s => s.currentRoomId);
  const activePuzzle  = useGameStore(s => s.activePuzzle);
  const move = useGameStore(s => s.move);

  const [hoveredDir, setHoveredDir] = useState<Direction | null>(null);
  const [activeTab, setActiveTab] = useState<'play' | 'map'>('play');

  const current = rooms[currentRoomId];

  useEffect(() => { setHoveredDir(null); setActiveTab('play'); }, [currentRoomId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (activePuzzle) return;
    const dir = KEY_DIR[e.key];
    if (dir) {
      e.preventDefault();
      if (current?.connections[dir]) setHoveredDir(dir);
      return;
    }
    if (e.key === 'Enter' && hoveredDir && current?.connections[hoveredDir]) {
      e.preventDefault();
      move(hoveredDir);
    }
  }, [activePuzzle, current, hoveredDir, move]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const highlightedRoomId = hoveredDir ? (current?.connections[hoveredDir] ?? null) : null;

  const handleRoomClick = (roomId: string) => {
    if (activePuzzle) return;
    const dir = Object.entries(current?.connections ?? {}).find(([, id]) => id === roomId)?.[0] as Direction | undefined;
    if (dir) move(dir);
  };

  const handleMove = (dir: Direction) => {
    if (activePuzzle) return;
    move(dir);
  };

  const tabBtn = (tab: 'play' | 'map', label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
        activeTab === tab
          ? 'text-amber-400 border-b-2 border-amber-400'
          : 'text-purple-400 hover:text-purple-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Mobile tab bar (hidden on desktop) ── */}
      <div className="md:hidden flex border-b border-purple-700/50 bg-purple-950/60 shrink-0">
        {tabBtn('play', '🧭 Navigate')}
        {tabBtn('map', '🗺 Map')}
      </div>

      {/* ── Navigate pane: always visible on desktop; mobile shows only on 'play' tab ── */}
      <div className={`flex flex-col p-4 md:p-5 gap-4 overflow-y-auto ${activeTab === 'map' ? 'hidden md:flex' : 'flex'} md:flex-1`}>

        {/* Player info + stats row */}
        <div className="flex items-center justify-between gap-3 bg-purple-900/40 border border-purple-700/50 rounded-2xl px-4 py-3">
          <div className="min-w-0">
            <div className="text-purple-100 font-bold text-base md:text-lg truncate">{playerName}</div>
            <div className="text-purple-400 text-xs md:text-sm">{GRADE_LABEL[grade]} Grade</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <HeartsDisplay hearts={hearts} />
            <div className="text-right">
              <div className="text-purple-400 text-xs uppercase tracking-wide">Score</div>
              <div className="text-2xl font-extrabold text-amber-400">{score}</div>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-xl capitalize border ${DIFF_COLORS[difficulty]}`}>
              {difficulty}
            </span>
          </div>
        </div>

        {/* Charms */}
        <CharmBar />

        {/* Navigation compass */}
        <NavInstructions hoveredDir={hoveredDir} onMove={handleMove} />

        {/* Map — desktop only (below the compass) */}
        <div className="hidden md:block">
          <MiniMap highlightedRoomId={highlightedRoomId} onRoomClick={handleRoomClick} />
        </div>
      </div>

      {/* ── Map pane: always visible on desktop (inside nav pane above); mobile shows only on 'map' tab ── */}
      <div className={`flex flex-col p-4 gap-3 overflow-y-auto flex-1 ${activeTab === 'play' ? 'hidden md:hidden' : 'flex md:hidden'}`}>
        <MiniMap highlightedRoomId={highlightedRoomId} onRoomClick={handleRoomClick} />
      </div>

    </div>
  );
}
