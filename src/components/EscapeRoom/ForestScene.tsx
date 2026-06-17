import { useState, useCallback, useEffect } from 'react';
import type { MCQuestion, NarrativeChoice, KarmaChoice } from '../../types/game';
import AnimatedHero from './mechanics/AnimatedHero';
import QuestionCard from './mechanics/QuestionCard';
import NarrativeChoiceModal from './mechanics/NarrativeChoice';
import DPad from './ui/DPad';
import { useHeroMovement } from '../../hooks/useHeroMovement';

interface Props {
  bgImg?: string;
  treeImg?: string;
  questions: MCQuestion[];
  narrative: NarrativeChoice;
  onCorrect: () => void;
  onWrong: () => void;
  onComplete: (karma: KarmaChoice) => void;
}

const WORLD_W  = 1600;
const HERO_W   = 128;
const GROUND_H = 130;

// 6 firefly secrets hidden across the forest
const FIREFLY_WX = [190, 380, 570, 760, 970, 1160];

// Spacing: next_wx ≥ prev_wx + render_width + 50
// Green-Tree 1.12×h | GREEN_09 0.63×h | GREEN_05 0.71×h | GREEN_03 0.80×h
const TREES = [
  { wx: 20,   src: '/assets/legacy/trees/Green-Tree.png', h: 220 },            // right≈266
  { wx: 350,  src: '/assets/pack01/GREEN_09.png',          h: 220 },            // right≈489
  { wx: 560,  src: '/assets/pack01/GREEN_05.png',          h: 210 },            // right≈709
  { wx: 760,  src: '/assets/legacy/trees/Green-Tree.png', h: 210, flip: true }, // right≈995
  { wx: 1060, src: '/assets/pack01/GREEN_03.png',          h: 220 },            // right≈1236
  { wx: 1290, src: '/assets/legacy/trees/Green-Tree.png', h: 210 },            // right≈1525
  { wx: 1560, src: '/assets/pack01/GREEN_09.png',          h: 200, flip: true },// right≈1686
];

const ROCKS = [
  { wx: 160, src: '/assets/pack01/Rock_01.png', h: 40 },
  { wx: 460, src: '/assets/pack01/Rock_02.png', h: 48 },
  { wx: 700, src: '/assets/pack01/BUSH_01.png', h: 30 },
  { wx: 880, src: '/assets/pack01/Rock_03.png', h: 42 },
  { wx: 1070, src: '/assets/pack01/Rock_01.png', h: 40, flip: true },
];

const CAMPFIRES_WX = [320, 680, 1040];

export default function ForestScene({ treeImg, questions, narrative, onCorrect, onWrong, onComplete }: Props) {
  const count     = Math.min(questions.length, FIREFLY_WX.length);
  const threshold = Math.max(1, Math.ceil(count * 0.67));

  const [passed,      setPassed]      = useState<boolean[]>(Array(count).fill(false));
  const [triedOnce,   setTriedOnce]   = useState<boolean[]>(Array(count).fill(false));
  const [activeQ,     setActiveQ]     = useState<number | null>(null);
  const [showNarr,    setShowNarr]    = useState(false);
  const [puzzleDone,  setPuzzleDone]  = useState(false);
  const [npcDismissed, setNpcDismissed] = useState(false);

  const passedCount = passed.filter(Boolean).length;

  const { heroWorldX, cameraX, isWalking, facingLeft, nearNodeIdx, startWalking, stopWalking } =
    useHeroMovement({ worldWidth: WORLD_W, heroWidth: HERO_W, nodeWorldX: FIREFLY_WX.slice(0, count), nodeTriggerDist: 65, initialX: 20 });

  const heroScreen = heroWorldX - cameraX;

  const handleInteract = useCallback(() => {
    if (activeQ !== null || showNarr || puzzleDone) return;
    if (nearNodeIdx !== null && !passed[nearNodeIdx]) setActiveQ(nearNodeIdx);
  }, [activeQ, showNarr, puzzleDone, nearNodeIdx, passed]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleInteract(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleInteract]);

  const handleAnswer = (answerIdx: number) => {
    if (activeQ === null) return;
    const correct = answerIdx === questions[activeQ].correct;
    const qi = activeQ;
    setActiveQ(null);
    if (correct) {
      const isFirst = !triedOnce[qi];
      const next = [...passed]; next[qi] = true; setPassed(next);
      if (isFirst) onCorrect(); else onCorrect();
      if (next.filter(Boolean).length >= threshold && !puzzleDone) {
        setPuzzleDone(true);
        setTimeout(() => setShowNarr(true), 700);
      }
    } else {
      const t = [...triedOnce]; t[qi] = true; setTriedOnce(t);
      onWrong();
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden scene-fade-in" style={{ touchAction: 'none' }}>

      {/* Sky */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #1c4a1c 0%, #2d6e2d 40%, #4a9940 72%, #5aaa2a 100%)' }} />

      {/* Forest BG parallax */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: GROUND_H, top: 48, backgroundImage: "url('/assets/legacy/Background.png')", backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%', backgroundPositionX: -(cameraX * 0.28), imageRendering: 'pixelated', opacity: 0.85 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: GROUND_H, top: 48, backgroundImage: "url('/assets/pack01/BACKGROUNDS_01.png')", backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%', backgroundPositionX: -(cameraX * 0.15), imageRendering: 'pixelated', opacity: 0.5 }} />

      {/* Ground */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_H, background: 'linear-gradient(to bottom, #5aaa2a 0%, #5aaa2a 14%, #4a3a18 14%, #3a2a0e 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: GROUND_H - 12, height: 22, backgroundImage: "url('/assets/world/grass.png')", backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%', backgroundPositionX: -(cameraX), imageRendering: 'pixelated', opacity: 0.9 }} />

      {/* Trees */}
      {TREES.map((t, i) => {
        const sx = t.wx - cameraX;
        if (sx < -400 || sx > 900) return null;
        return <img key={i} src={t.src} style={{ position: 'absolute', left: sx, bottom: GROUND_H, height: t.h, width: 'auto', imageRendering: 'pixelated', transform: t.flip ? 'scaleX(-1)' : undefined, zIndex: 2, pointerEvents: 'none' }} />;
      })}

      {/* Rocks */}
      {ROCKS.map((r, i) => {
        const sx = r.wx - cameraX;
        if (sx < -200 || sx > 900) return null;
        return <img key={i} src={r.src} style={{ position: 'absolute', left: sx, bottom: GROUND_H, height: r.h, width: 'auto', imageRendering: 'pixelated', transform: r.flip ? 'scaleX(-1)' : undefined, zIndex: 3, pointerEvents: 'none' }} />;
      })}

      {/* Campfires */}
      {CAMPFIRES_WX.map((wx, i) => {
        const sx = wx - cameraX;
        if (sx < -80 || sx > 900) return null;
        return <div key={i} className="campfire-anim" style={{ position: 'absolute', left: sx, bottom: GROUND_H, zIndex: 3 }} />;
      })}

      {/* Firefly secrets */}
      {Array.from({ length: count }, (_, idx) => {
        const sx = FIREFLY_WX[idx] - cameraX;
        if (sx < -60 || sx > 900) return null;
        const isPassed = passed[idx];
        const isNear   = nearNodeIdx === idx && !isPassed && !puzzleDone;
        const bobY     = Math.sin(idx * 1.57) * 18;
        return (
          <div key={idx} style={{ position: 'absolute', left: sx - 14, bottom: GROUND_H + 55 + bobY, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: isPassed ? 20 : isNear ? 17 : 11,
              height: isPassed ? 20 : isNear ? 17 : 11,
              background: isPassed ? '#ffd700' : isNear ? '#00ffcc' : '#00c89a',
              boxShadow: isPassed ? '0 0 12px #ffd700, 0 0 24px rgba(255,215,0,0.5)' : isNear ? '0 0 10px #00ffcc, 0 0 20px rgba(0,255,204,0.4)' : '0 0 5px #00c89a',
              borderRadius: 2, transition: 'all 0.2s',
              animation: isNear ? 'firefly-pulse 0.9s ease-in-out infinite' : undefined,
            }} />
            {isNear && !activeQ && (
              <span className="font-pixel" style={{ color: '#00ffcc', fontSize: 5, textShadow: '1px 1px 0 #000', whiteSpace: 'nowrap', animation: 'firefly-pulse 0.8s ease-in-out infinite' }}>
                ▼ OK
              </span>
            )}
          </div>
        );
      })}

      {/* NPC Tree guide (standing near start) */}
      {(() => { const sx = 40 - cameraX; if (sx < -120 || sx > 900) return null;
        return <img src={treeImg ?? '/assets/chars/char-tree.png'} style={{ position: 'absolute', left: sx, bottom: GROUND_H, height: 80, width: 'auto', imageRendering: 'pixelated', zIndex: 4, pointerEvents: 'none', filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.6))' }} />;
      })()}

      {/* Hero */}
      <div style={{ position: 'absolute', left: heroScreen, bottom: GROUND_H, zIndex: 6, pointerEvents: 'none' }}>
        <AnimatedHero scale={2} walking={isWalking} facingLeft={facingLeft} />
      </div>

      {/* Progress HUD (top status, below GameShell HUD) */}
      {!activeQ && !showNarr && (
        <div style={{ position: 'fixed', top: 58, left: 0, right: 0, zIndex: 15, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(0,20,10,0.75)', border: '1px solid #00c89a44', padding: '3px 14px', backdropFilter: 'blur(4px)' }}>
            <p className="font-pixel" style={{ color: '#00ffcc', fontSize: 6, textShadow: '0 0 6px #00c89a' }}>
              🌿 {passedCount}/{threshold} segredos · {nearNodeIdx !== null && !passed[nearNodeIdx] ? 'Pressione OK ▶' : 'Explore a floresta'}
            </p>
          </div>
        </div>
      )}

      {/* Question panel */}
      {activeQ !== null && (
        <QuestionCard
          question={questions[activeQ]}
          onAnswer={handleAnswer}
          sceneColor="#00c89a"
          portrait={treeImg ?? '/assets/chars/char-tree.png'}
          npcName="ÁRVORE ANCIÃ"
        />
      )}

      {/* Narrative */}
      {showNarr && (
        <NarrativeChoiceModal choice={narrative} guardianImg={treeImg} guardianName="ÁRVORE ANCIÃ" onChoose={k => { setShowNarr(false); setTimeout(() => onComplete(k), 500); }} sceneColor="#00c89a" />
      )}

      {/* D-Pad (hidden while question or narrative is open) */}
      {!activeQ && !showNarr && (
        <DPad onStart={startWalking} onStop={stopWalking} onAction={handleInteract} />
      )}
    </div>
  );
}
