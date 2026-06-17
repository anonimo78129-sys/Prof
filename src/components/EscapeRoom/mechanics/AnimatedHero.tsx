import { useEffect, useRef, useState } from 'react';

const IDLE_FRAMES = [
  '/assets/hero/idle1.png',
  '/assets/hero/idle2.png',
  '/assets/hero/idle3.png',
  '/assets/hero/idle4.png',
  '/assets/hero/idle5.png',
];

const WALK_FRAMES = [
  '/assets/hero/walk1.png',
  '/assets/hero/walk2.png',
  '/assets/hero/walk3.png',
  '/assets/hero/walk4.png',
  '/assets/hero/walk5.png',
  '/assets/hero/walk6.png',
];

interface Props {
  scale?: number;
  className?: string;
  hurt?: boolean;
  walking?: boolean;
  facingLeft?: boolean;
}

export default function AnimatedHero({
  scale = 2,
  className = '',
  hurt = false,
  walking = false,
  facingLeft = false,
}: Props) {
  const frames = walking ? WALK_FRAMES : IDLE_FRAMES;
  const [frame, setFrame] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFrame(0);
    const interval = walking ? 90 : 150;
    timerRef.current = setInterval(() => {
      setFrame(f => (f + 1) % frames.length);
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [walking, frames.length]);

  return (
    <div style={{ display: 'inline-block' }}>
      <img
        src={frames[frame]}
        alt="Herói"
        className={className}
        style={{
          width: 64 * scale,
          height: 40 * scale,
          imageRendering: 'pixelated',
          filter: hurt
            ? 'brightness(3) saturate(0)'
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.7))',
          transition: 'filter 0.1s',
          transform: facingLeft ? 'scaleX(-1)' : undefined,
          display: 'block',
        }}
      />
    </div>
  );
}
