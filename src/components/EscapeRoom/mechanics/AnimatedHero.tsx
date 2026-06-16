import { useEffect, useRef, useState } from 'react';

const FRAMES = [
  '/assets/hero/idle1.png',
  '/assets/hero/idle2.png',
  '/assets/hero/idle3.png',
  '/assets/hero/idle4.png',
  '/assets/hero/idle5.png',
];

interface Props {
  scale?: number;
  className?: string;
  hurt?: boolean;
}

export default function AnimatedHero({ scale = 2, className = '', hurt = false }: Props) {
  const [frame, setFrame] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES.length);
    }, 150);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <img
      src={FRAMES[frame]}
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
      }}
    />
  );
}
