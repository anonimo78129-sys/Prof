import React from 'react';

function FullHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 10 10" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="2" width="3" height="1" fill="#ff4444" />
      <rect x="6" y="2" width="3" height="1" fill="#ff4444" />
      <rect x="0" y="3" width="5" height="1" fill="#ff4444" />
      <rect x="5" y="3" width="5" height="1" fill="#ff4444" />
      <rect x="0" y="4" width="10" height="2" fill="#ff4444" />
      <rect x="1" y="6" width="8" height="1" fill="#ff4444" />
      <rect x="2" y="7" width="6" height="1" fill="#ff4444" />
      <rect x="3" y="8" width="4" height="1" fill="#ff4444" />
      <rect x="4" y="9" width="2" height="1" fill="#ff4444" />
    </svg>
  );
}

function EmptyHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 10 10" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="2" width="3" height="1" fill="#444444" />
      <rect x="6" y="2" width="3" height="1" fill="#444444" />
      <rect x="0" y="3" width="5" height="1" fill="#444444" />
      <rect x="5" y="3" width="5" height="1" fill="#444444" />
      <rect x="0" y="4" width="10" height="2" fill="#444444" />
      <rect x="1" y="6" width="8" height="1" fill="#444444" />
      <rect x="2" y="7" width="6" height="1" fill="#444444" />
      <rect x="3" y="8" width="4" height="1" fill="#444444" />
      <rect x="4" y="9" width="2" height="1" fill="#444444" />
    </svg>
  );
}

interface HeartDisplayProps {
  hearts: number;
}

export function HeartDisplay({ hearts }: HeartDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 3 }, (_, i) =>
        i < hearts ? <FullHeart key={i} /> : <EmptyHeart key={i} />
      )}
    </div>
  );
}
