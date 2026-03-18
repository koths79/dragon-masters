import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { Room, Direction } from '../../types';

const DIRECTIONS: Direction[] = ['N', 'S', 'E', 'W'];

const ROOM_BG: Record<string, string> = {
  ENTRANCE:        '#14532d', // green-900
  FLOOR:           '#1e1b4b', // indigo-950
  DOOR:            '#78350f', // amber-900
  TREASURE:        '#713f12', // yellow-900
  CHARM_FIRE:      '#7f1d1d', // red-900
  CHARM_ICE:       '#0c4a6e', // sky-900
  CHARM_LIGHTNING: '#4c1d95', // violet-900
  FINAL_VAULT:     '#78350f', // amber-900
};

const ROOM_BORDER: Record<string, string> = {
  ENTRANCE:        '#4ade80', // green-400
  FLOOR:           '#7c3aed', // violet-600
  DOOR:            '#f59e0b', // amber-400
  TREASURE:        '#fbbf24', // yellow-400
  CHARM_FIRE:      '#f87171', // red-400
  CHARM_ICE:       '#7dd3fc', // sky-300
  CHARM_LIGHTNING: '#c084fc', // purple-400
  FINAL_VAULT:     '#fde68a', // amber-200
};

const ROOM_LABEL: Record<string, string> = {
  ENTRANCE:        '🏰 Start',
  FLOOR:           '🪨 Chamber',
  DOOR:            '🔒 Door',
  TREASURE:        '💎 Treasure',
  CHARM_FIRE:      '🔥 Fire Shrine',
  CHARM_ICE:       '❄️ Ice Shrine',
  CHARM_LIGHTNING: '⚡ Storm Shrine',
  FINAL_VAULT:     '👑 Final Vault',
};

const CELL_W = 96;
const CELL_H = 52;
const GAP_X = 36;
const GAP_Y = 36;

interface Props {
  highlightedRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
}

export function MiniMap({ highlightedRoomId, onRoomClick }: Props) {
  const rooms = useGameStore(s => s.rooms);
  const currentRoomId = useGameStore(s => s.currentRoomId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (Object.keys(rooms).length === 0) return null;

  const roomList = Object.values(rooms);
  const current = rooms[currentRoomId];
  const adjacentIds = new Set(Object.values(current?.connections ?? {}));

  const maxX = Math.max(...roomList.map(r => r.gridX));
  const maxY = Math.max(...roomList.map(r => r.gridY));

  const totalW = (maxX + 1) * CELL_W + maxX * GAP_X;
  const totalH = (maxY + 1) * CELL_H + maxY * GAP_Y;

  // Scale down to fit the container width; never scale up beyond 1×
  const scale = Math.min(1, containerWidth / totalW);

  const getEdgePoint = (room: Room, dir: Direction): { x: number; y: number } => {
    const left = room.gridX * (CELL_W + GAP_X);
    const top  = room.gridY * (CELL_H + GAP_Y);
    const cx   = left + CELL_W / 2;
    const cy   = top  + CELL_H / 2;
    if (dir === 'N') return { x: cx, y: top };
    if (dir === 'S') return { x: cx, y: top + CELL_H };
    if (dir === 'E') return { x: left + CELL_W, y: cy };
                     return { x: left, y: cy }; // W
  };

  const OPPOSITE: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };

  // Deduplicate pairs — only render each connection once
  const renderedPairs = new Set<string>();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Castle Map</span>
      <div ref={containerRef} className="bg-purple-950/80 border border-purple-800/50 rounded-xl p-4 overflow-hidden">
        {/* Outer div collapses to the scaled height so no dead space */}
        <div style={{ height: totalH * scale, overflow: 'hidden' }}>
        <div className="relative" style={{ width: totalW, height: totalH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>

          {/* Connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={totalW}
            height={totalH}
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {roomList.map(room =>
              DIRECTIONS.map(dir => {
                const neighborId = room.connections[dir];
                if (!neighborId) return null;
                const neighbor = rooms[neighborId];
                if (!neighbor) return null;
                const pairKey = [room.id, neighborId].sort().join('|');
                if (renderedPairs.has(pairKey)) return null;
                renderedPairs.add(pairKey);

                const p1 = getEdgePoint(room, dir);
                const p2 = getEdgePoint(neighbor, OPPOSITE[dir]);
                const bothVisited = room.visited && neighbor.visited;

                // Midpoint for decorative diamond
                const mx = (p1.x + p2.x) / 2;
                const my = (p1.y + p2.y) / 2;
                const size = 3;

                if (bothVisited) {
                  return (
                    <g key={pairKey} filter="url(#glow)">
                      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                        stroke="#7c3aed" strokeWidth={2} />
                      <polygon
                        points={`${mx},${my - size} ${mx + size},${my} ${mx},${my + size} ${mx - size},${my}`}
                        fill="#a78bfa"
                      />
                    </g>
                  );
                }
                return (
                  <line
                    key={pairKey}
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke="#4c1d95" strokeWidth={1.5} strokeDasharray="4 4"
                  />
                );
              })
            )}
          </svg>

          {/* Room nodes */}
          {roomList.map(room => {
            const isCurrent = room.id === currentRoomId;
            const isHighlighted = room.id === highlightedRoomId;
            const isAdjacent = adjacentIds.has(room.id);
            const label = ROOM_LABEL[room.type];
            const bg = room.visited ? ROOM_BG[room.type] : '#1a0a2e';
            const border = room.visited ? ROOM_BORDER[room.type] : ROOM_BORDER[room.type] + '88';


            return (
              <div
                key={room.id}
                onClick={() => isAdjacent && onRoomClick?.(room.id)}
                style={{
                  position: 'absolute',
                  left: room.gridX * (CELL_W + GAP_X),
                  top: room.gridY * (CELL_H + GAP_Y),
                  width: CELL_W,
                  height: CELL_H,
                  backgroundColor: bg,
                  border: `2px solid ${border}`,
                  outline: isCurrent ? '3px solid #fbbf24' : isHighlighted ? '3px solid #c084fc' : 'none',
                  outlineOffset: '2px',
                  borderRadius: 10,
                  cursor: isAdjacent ? 'pointer' : 'default',
                  opacity: room.visited || isCurrent ? 1 : 0.5,
                  transition: 'outline 0.1s, opacity 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 6px',
                  boxSizing: 'border-box',
                }}
                title={room.visited ? ROOM_LABEL[room.type] : (isAdjacent ? 'Unexplored room' : 'Unknown')}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: isCurrent || isHighlighted ? 700 : 500,
                  color: isCurrent ? '#fbbf24' : isHighlighted ? '#c084fc' : room.visited ? '#e9d5ff' : '#6d28d9',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                  userSelect: 'none',
                }}>
                  {label}
                </span>
                {isCurrent && (
                  <span style={{ fontSize: 8, color: '#fbbf24', marginTop: 2 }}>YOU ARE HERE</span>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-purple-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded inline-block border border-green-400" style={{ backgroundColor: '#14532d' }} />Start</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded inline-block border border-amber-500" style={{ backgroundColor: '#78350f' }} />Door</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded inline-block border border-yellow-400" style={{ backgroundColor: '#713f12' }} />Treasure</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded inline-block border border-yellow-200" style={{ backgroundColor: '#78350f' }} />Vault</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded inline-block border border-violet-500" style={{ backgroundColor: '#1e1b4b' }} />Chamber</span>
      </div>
    </div>
  );
}
