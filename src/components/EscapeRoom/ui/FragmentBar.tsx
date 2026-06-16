import React from 'react';
import type { FragmentName, GameConfig } from '../../../types/game';

const FRAGMENT_COLORS: Record<FragmentName, string> = {
  esmeralda: '#00d4aa',
  ambar: '#ffc800',
  safira: '#4488ff',
};

const FRAGMENT_ORDER: FragmentName[] = ['esmeralda', 'ambar', 'safira'];

function PixelGem({ color, size = 28 }: { color: string; size?: number }) {
  // 10x10 pixel gem grid
  // Row layout (X = filled, _ = empty):
  // 0: _ _ _ X X X X _ _ _
  // 1: _ _ X X X X X X _ _
  // 2: _ X X X X X X X X _
  // 3: X X X X X X X X X X
  // 4: X X X X X X X X X X
  // 5: _ X X X X X X X X _
  // 6: _ _ X X X X X X _ _
  // 7: _ _ _ X X X X _ _ _
  // 8: _ _ _ _ X X _ _ _ _
  const rows: Array<[number, number, number]> = [
    [3, 4, 0],  // row 0: x=3, width=4, y=0
    [2, 6, 1],  // row 1
    [1, 8, 2],  // row 2
    [0, 10, 3], // row 3
    [0, 10, 4], // row 4
    [1, 8, 5],  // row 5
    [2, 6, 6],  // row 6
    [3, 4, 7],  // row 7
    [4, 2, 8],  // row 8
  ];

  // Highlight: lighter shade on top-left portion
  const highlightColor = '#ffffff';
  const highlightOpacity = 0.35;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      style={{ imageRendering: 'pixelated' }}
    >
      {rows.map(([x, w, y]) => (
        <rect key={y} x={x} y={y} width={w} height={1} fill={color} />
      ))}
      {/* Subtle highlight on top rows */}
      <rect x={4} y={0} width={2} height={1} fill={highlightColor} fillOpacity={highlightOpacity} />
      <rect x={3} y={1} width={3} height={1} fill={highlightColor} fillOpacity={highlightOpacity} />
      <rect x={2} y={2} width={3} height={1} fill={highlightColor} fillOpacity={highlightOpacity} />
    </svg>
  );
}

function EmptyGem({ size = 28 }: { size?: number }) {
  const rows: Array<[number, number, number]> = [
    [3, 4, 0],
    [2, 6, 1],
    [1, 8, 2],
    [0, 10, 3],
    [0, 10, 4],
    [1, 8, 5],
    [2, 6, 6],
    [3, 4, 7],
    [4, 2, 8],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      style={{ imageRendering: 'pixelated' }}
    >
      {rows.map(([x, w, y]) => (
        <rect key={y} x={x} y={y} width={w} height={1} fill="#333333" stroke="#555555" strokeWidth={0} />
      ))}
      {/* Outline effect */}
      {rows.map(([x, w, y]) => (
        <rect
          key={`outline-${y}`}
          x={x}
          y={y}
          width={w}
          height={1}
          fill="none"
          stroke="#666666"
          strokeWidth={0.1}
        />
      ))}
    </svg>
  );
}

interface FragmentBarProps {
  fragments: FragmentName[];
  config?: GameConfig['assets'];
}

export function FragmentBar({ fragments, config }: FragmentBarProps) {
  const assetKeys: Record<FragmentName, keyof NonNullable<GameConfig['assets']>> = {
    esmeralda: 'fragEsmeralda',
    ambar: 'fragAmbar',
    safira: 'fragSafira',
  };

  return (
    <div className="flex items-center justify-center gap-4 py-1">
      {FRAGMENT_ORDER.map(name => {
        const collected = fragments.includes(name);
        const color = FRAGMENT_COLORS[name];
        const assetKey = assetKeys[name];
        const imageUrl = config?.[assetKey];

        return (
          <div
            key={name}
            className="flex flex-col items-center gap-0.5"
            title={collected ? `Fragmento ${name}` : 'Slot vazio'}
          >
            <div
              className="relative flex items-center justify-center rounded"
              style={{
                width: 36,
                height: 36,
                background: collected ? `${color}22` : '#11111180',
                border: `1px solid ${collected ? color : '#444444'}`,
                boxShadow: collected ? `0 0 6px ${color}66` : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {collected ? (
                imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    style={{ width: 28, height: 28, imageRendering: 'pixelated', objectFit: 'contain' }}
                  />
                ) : (
                  <PixelGem color={color} size={28} />
                )
              ) : (
                <EmptyGem size={28} />
              )}
            </div>
            <span
              className="text-center leading-none"
              style={{
                fontFamily: 'VT323, monospace',
                fontSize: 10,
                color: collected ? color : '#555555',
                textTransform: 'capitalize',
              }}
            >
              {collected ? name : '???'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
