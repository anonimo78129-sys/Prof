import { useCallback, useEffect, useRef, useState } from 'react';

export type HeroDir = 'left' | 'right';

interface Options {
  worldWidth: number;
  heroWidth: number;
  nodeWorldX: number[];
  nodeTriggerDist?: number;
  initialX?: number;
  viewportWidth?: number;
}

interface HeroMovement {
  heroWorldX: number;
  cameraX: number;
  isWalking: boolean;
  facingLeft: boolean;
  nearNodeIdx: number | null;
  startWalking: (dir: HeroDir) => void;
  stopWalking: () => void;
}

const SPEED = 3;
const HERO_SCREEN_X = 160;

export function useHeroMovement({
  worldWidth,
  heroWidth,
  nodeWorldX,
  nodeTriggerDist = 70,
  initialX = 100,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 420,
}: Options): HeroMovement {
  const [heroWorldX, setHeroWorldX] = useState(initialX);
  const [cameraX, setCameraX] = useState(Math.max(0, initialX - HERO_SCREEN_X));
  const [isWalking, setIsWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [nearNodeIdx, setNearNodeIdx] = useState<number | null>(null);

  const dirRef = useRef<HeroDir | null>(null);
  const posRef = useRef(initialX);
  const rafRef = useRef<number | null>(null);

  const checkNear = useCallback((x: number) => {
    const cx = x + heroWidth / 2;
    for (let i = 0; i < nodeWorldX.length; i++) {
      if (Math.abs(cx - nodeWorldX[i]) < nodeTriggerDist) return i;
    }
    return null;
  }, [nodeWorldX, nodeTriggerDist, heroWidth]);

  useEffect(() => {
    const tick = () => {
      if (dirRef.current !== null) {
        const dx = dirRef.current === 'right' ? SPEED : -SPEED;
        const next = Math.max(0, Math.min(worldWidth - heroWidth, posRef.current + dx));
        posRef.current = next;
        const cam = Math.max(0, Math.min(worldWidth - viewportWidth, next - HERO_SCREEN_X));
        setHeroWorldX(next);
        setCameraX(cam);
        setNearNodeIdx(checkNear(next));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [worldWidth, heroWidth, checkNear]);

  const startWalking = useCallback((dir: HeroDir) => {
    dirRef.current = dir;
    setIsWalking(true);
    setFacingLeft(dir === 'left');
  }, []);

  const stopWalking = useCallback(() => {
    dirRef.current = null;
    setIsWalking(false);
  }, []);

  // Keyboard (arrows + WASD)
  useEffect(() => {
    const held = new Set<string>();
    const sync = () => {
      if (held.has('ArrowLeft') || held.has('a') || held.has('A')) startWalking('left');
      else if (held.has('ArrowRight') || held.has('d') || held.has('D')) startWalking('right');
      else stopWalking();
    };
    const down = (e: KeyboardEvent) => { held.add(e.key); sync(); };
    const up = (e: KeyboardEvent) => { held.delete(e.key); sync(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [startWalking, stopWalking]);

  return { heroWorldX, cameraX, isWalking, facingLeft, nearNodeIdx, startWalking, stopWalking };
}
