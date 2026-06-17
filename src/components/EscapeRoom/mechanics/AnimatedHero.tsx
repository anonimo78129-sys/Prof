import { useEffect, useRef, useState } from 'react';

interface Props {
  scale?: number;
  className?: string;
  hurt?: boolean;
  walking?: boolean;
  facingLeft?: boolean;
}

const IDLE = { src: '/assets/legacy/Idle-Sheet.png', frames: 4, fw: 64, fh: 80, sheetW: 256, ms: 160 };
const RUN  = { src: '/assets/legacy/Run-Sheet.png',  frames: 8, fw: 80, fh: 80, sheetW: 640, ms: 90  };

export default function AnimatedHero({
  scale = 2,
  className = '',
  hurt = false,
  walking = false,
  facingLeft = false,
}: Props) {
  const anim = walking ? RUN : IDLE;
  const [frame, setFrame] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFrame(0);
    timerRef.current = setInterval(() => {
      setFrame(f => (f + 1) % anim.frames);
    }, anim.ms);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [walking, anim.frames, anim.ms]);

  return (
    <div
      className={className}
      style={{
        width: anim.fw * scale,
        height: anim.fh * scale,
        backgroundImage: `url(${anim.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${anim.sheetW * scale}px ${anim.fh * scale}px`,
        backgroundPosition: `${-frame * anim.fw * scale}px 0`,
        imageRendering: 'pixelated',
        filter: hurt
          ? 'brightness(3) saturate(0)'
          : 'drop-shadow(0 4px 8px rgba(0,0,0,0.7))',
        transition: 'filter 0.1s',
        transform: facingLeft ? 'scaleX(-1)' : undefined,
        display: 'block',
      }}
    />
  );
}
