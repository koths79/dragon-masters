import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import PhaserGame, { type PhaserGameRef } from '../../game/PhaserGame';
import { GamePanel } from '../ui/GamePanel';
import { PuzzleModal } from '../ui/PuzzleModal';
import type { CharmType } from '../../types';

const CHARM_MESSAGES: Record<CharmType, string> = {
  FIRE:      '🔥 Fire Charm! Double a number in a puzzle.',
  ICE:       '❄️ Ice Charm! Halve a number in a puzzle.',
  LIGHTNING: '⚡ Lightning Charm! Swap all numbers in a puzzle.',
};

const ROOM_TYPE_EMOJI: Record<string, string> = {
  ENTRANCE:        '🏰',
  FLOOR:           '🪨',
  DOOR:            '🚪',
  TREASURE:        '💎',
  CHARM_FIRE:      '🔥',
  CHARM_ICE:       '❄️',
  CHARM_LIGHTNING: '⚡',
  FINAL_VAULT:     '👑',
};

const ROOM_TYPE_NAME: Record<string, string> = {
  ENTRANCE:        'Castle Entrance',
  FLOOR:           'Stone Chamber',
  DOOR:            'Locked Door',
  TREASURE:        'Treasure Room',
  CHARM_FIRE:      'Fire Shrine',
  CHARM_ICE:       'Ice Shrine',
  CHARM_LIGHTNING: 'Storm Shrine',
  FINAL_VAULT:     'Final Vault',
};

const ROOM_TYPE_DESC: Record<string, string> = {
  ENTRANCE:        'You stand at the entrance of the ancient castle.',
  FLOOR:           'A dimly lit stone chamber. Passages lead in different directions.',
  DOOR:            'A magical door blocks your path. Solve the puzzle to proceed!',
  TREASURE:        'Glittering treasure fills this room. You feel your strength renewed!',
  CHARM_FIRE:      'Flames dance in this shrine. A fire charm awaits you!',
  CHARM_ICE:       'Frost coats the walls. An ice charm is yours!',
  CHARM_LIGHTNING: 'Lightning crackles here. A lightning charm empowers you!',
  FINAL_VAULT:     'The Final Vault! Victory is yours!',
};

export function GameScreen() {
  const dragonRef = useRef<PhaserGameRef | null>(null);
  const rooms = useGameStore(s => s.rooms);
  const currentRoomId = useGameStore(s => s.currentRoomId);
  const charms = useGameStore(s => s.charms);
  const currentRoom = rooms[currentRoomId];
  const roomType = currentRoom?.type ?? 'FLOOR';

  const [charmNotification, setCharmNotification] = useState<string | null>(null);
  const prevCharmCount = useRef(charms.length);

  useEffect(() => {
    if (currentRoom && dragonRef.current) {
      dragonRef.current.setRoomBackground(currentRoom.type);
    }
  }, [currentRoomId, currentRoom]);

  useEffect(() => {
    if (charms.length > prevCharmCount.current) {
      const roomCharmType = (roomType as string).replace('CHARM_', '') as CharmType;
      const msg = CHARM_MESSAGES[roomCharmType] ?? '✨ Charm acquired!';
      setCharmNotification(msg);
      const timer = setTimeout(() => setCharmNotification(null), 2500);
      prevCharmCount.current = charms.length;
      return () => clearTimeout(timer);
    }
    prevCharmCount.current = charms.length;
  }, [charms.length, roomType]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-indigo-950 to-gray-950 flex flex-col lg:flex-row">
      {charmNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-purple-900 border border-amber-600/60 rounded-2xl px-5 py-3 text-amber-300 font-bold text-base shadow-xl animate-bounce">
          {charmNotification}
        </div>
      )}

      {/* Dragon panel — hidden on mobile, sidebar on desktop */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:items-center lg:justify-center lg:min-h-screen bg-purple-900/20 border-r border-purple-700/30 gap-4 p-5">
        <div className="text-center">
          <div className="text-4xl mb-1">{ROOM_TYPE_EMOJI[roomType]}</div>
          <h2 className="text-purple-100 font-bold text-lg">{ROOM_TYPE_NAME[roomType]}</h2>
        </div>
        <PhaserGame ref={dragonRef} />
        <p className="text-purple-400 text-sm text-center px-2 leading-relaxed">
          {ROOM_TYPE_DESC[roomType]}
        </p>
      </div>

      {/* Mobile room header (replaces dragon panel on small screens) */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-purple-900/40 border-b border-purple-700/30">
        <span className="text-3xl">{ROOM_TYPE_EMOJI[roomType]}</span>
        <div>
          <div className="text-purple-100 font-bold text-base">{ROOM_TYPE_NAME[roomType]}</div>
          <div className="text-purple-400 text-xs">{ROOM_TYPE_DESC[roomType]}</div>
        </div>
      </div>

      {/* Main game panel */}
      <GamePanel />

      {/* Puzzle overlay */}
      <PuzzleModal dragonRef={dragonRef} />
    </div>
  );
}
