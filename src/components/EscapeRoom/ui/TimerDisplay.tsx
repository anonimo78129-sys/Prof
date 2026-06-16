import React from 'react';

interface TimerDisplayProps {
  formatted: string;
}

export function TimerDisplay({ formatted }: TimerDisplayProps) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded"
      style={{
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <span
        style={{
          fontFamily: 'VT323, monospace',
          fontSize: 22,
          color: '#ffffff',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        ⏱ {formatted}
      </span>
    </div>
  );
}
