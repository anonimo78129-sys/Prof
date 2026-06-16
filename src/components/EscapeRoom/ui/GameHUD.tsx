import React from 'react';
import type { FragmentName, GameConfig } from '../../../types/game';
import { HeartDisplay } from './HeartDisplay';
import { TimerDisplay } from './TimerDisplay';
import { FragmentBar } from './FragmentBar';

interface GameHUDProps {
  hearts: number;
  timer: string;
  fragments: FragmentName[];
  sceneColor: string;
  assets?: GameConfig['assets'];
}

export function GameHUD({ hearts, timer, fragments, sceneColor, assets }: GameHUDProps) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 select-none"
      style={{ pointerEvents: 'none' }}
    >
      {/* Top banner: hearts (left) + timer (right) */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          background: 'rgba(0,0,0,0.72)',
          borderBottom: `1px solid ${sceneColor}33`,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        {/* Hearts */}
        <HeartDisplay hearts={hearts} />

        {/* Scene color accent — centered dot indicator */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: sceneColor,
            boxShadow: `0 0 6px ${sceneColor}`,
            opacity: 0.8,
          }}
        />

        {/* Timer */}
        <TimerDisplay formatted={timer} />
      </div>

      {/* Fragment bar below banner */}
      <div
        className="flex justify-center"
        style={{
          background: 'rgba(0,0,0,0.55)',
          borderBottom: `1px solid ${sceneColor}22`,
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      >
        <FragmentBar fragments={fragments} config={assets} />
      </div>
    </div>
  );
}
