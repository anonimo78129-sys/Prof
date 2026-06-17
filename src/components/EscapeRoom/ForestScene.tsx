import { useState, useCallback, useEffect } from 'react';
import type { MCQuestion, NarrativeChoice, KarmaChoice } from '../../types/game';
import AnimatedHero from './mechanics/AnimatedHero';
import QuestionCard from './mechanics/QuestionCard';
import NarrativeChoiceModal from './mechanics/NarrativeChoice';
import DialogBox from './ui/DialogBox';
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

const WORLD_W  = 1400;
const HERO_W   = 128;
const GROUND_H = 120;

// Firefly world X positions (hero center triggers interaction within 60px)
const FIREFLY_WX = [200, 380, 560, 740, 920, 1100];

const TREES = [
  { wx: 60,   img: '/assets/world/tree-oak1.png',   h: 88 },
  { wx: 170,  img: '/assets/world/tree-pine.png',   h: 96 },
  { wx: 295,  img: '/assets/world/tree-birch1.png', h: 74 },
  { wx: 455,  img: '/assets/world/tree-oak2.png',   h: 82 },
  { wx: 625,  img: '/assets/world/tree-pine.png',   h: 96, flip: true },
  { wx: 810,  img: '/assets/world/tree-birch2.png', h: 74 },
  { wx: 985,  img: '/assets/world/tree-oak1.png',   h: 88 },
  { wx: 1150, img: '/assets/world/tree-pine.png',   h: 96 },
];

const CAMPFIRES_WX = [310, 680, 1020];

export default function ForestScene({ treeImg, questions, narrative, onCorrect, onWrong, onComplete }: Props) {
  const count = Math.min(questions.length, FIREFLY_WX.length);
  const threshold = Math.max(1, Math.ceil(count * 0.67));

  const [passed, setPassed] = useState<boolean[]>(Array(count).fill(false));
  const [triedOnce, setTriedOnce] = useState<boolean[]>(Array(count).fill(false));
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [showNarrative, setShowNarrative] = useState(false);
  const [puzzleDone, setPuzzleDone] = useState(false);
  const [npcDismissed, setNpcDismissed] = useState(false);

  const passedCount = passed.filter(Boolean).length;
  const isDone = passedCount >= threshold;

  const { heroWorldX, cameraX, isWalking, facingLeft, nearNodeIdx, startWalking, stopWalking } =
    useHeroMovement({
      worldWidth: WORLD_W,
      heroWidth: HERO_W,
      nodeWorldX: FIREFLY_WX.slice(0, count),
      nodeTriggerDist: 60,
      initialX: 20,
    });

  const heroScreen = heroWorldX - cameraX;

  const handleInteract = useCallback(() => {
    if (activeQ !== null || showNarrative || puzzleDone) return;
    if (nearNodeIdx !== null && !passed[nearNodeIdx]) {
      setActiveQ(nearNodeIdx);
    }
  }, [activeQ, showNarrative, puzzleDone, nearNodeIdx, passed]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleInteract(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleInteract]);

  const handleAnswer = (answerIdx: number) => {
    if (activeQ === null) return;
    const correct = answerIdx === questions[activeQ].correct;
    setActiveQ(null);

    if (correct) {
      const firstTry = !triedOnce[activeQ];
      const next = [...passed]; next[activeQ] = true; setPassed(next);
      if (firstTry) onCorrect(); else onCorrect();
      if (next.filter(Boolean).length >= threshold && !puzzleDone) {
        setPuzzleDone(true);
        setTimeout(() => setShowNarrative(true), 600);
      }
    } else {
      const t = [...triedOnce]; t[activeQ] = true; setTriedOnce(t);
      onWrong();
    }
  };

  const handleNarrative = (karma: KarmaChoice) => {
    setShowNarrative(false);
    setTimeout(() => onComplete(karma), 500);
  };

  return (
    <div className="fixed inset-0 overflow-hidden scene-fade-in" style={{ touchAction: 'none' }}>
      {/* Sky */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #1a3d1a 0%, #2d6b2d 50%, #4a9940 75%, #5aaa2a 100%)' }} />

      {/* Forest BG (Legacy asset as parallax) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: GROUND_H,
        height: 'calc(100% - 48px - 120px)',
        backgroundImage: "url('/assets/legacy/Background.png')",
        backgroundRepeat: 'repeat-x',
        backgroundSize: 'auto 100%',
        backgroundPositionX: -(cameraX * 0.3),
        imageRendering: 'pixelated',
        opacity: 0.9,
      }} />

      {/* Ground */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_H, background: 'linear-gradient(to bottom, #5aaa2a 0%, #5aaa2a 14%, #4a3a18 14%, #3a2a0e 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: GROUND_H - 12, height: 24, backgroundImage: "url('/assets/world/grass.png')", backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%', backgroundPositionX: -(cameraX), imageRendering: 'pixelated', opacity: 0.85 }} />

      {/* Trees */}
      {TREES.map((t, i) => {
        const sx = t.wx - cameraX;
        if (sx < -160 || sx > 540) return null;
        return (
          <img key={i} src={t.img} style={{ position: 'absolute', left: sx, bottom: GROUND_H, height: t.h, imageRendering: 'pixelated', transform: t.flip ? 'scaleX(-1)' : undefined, zIndex: 2 }} />
        );
      })}

      {/* Campfires */}
      {CAMPFIRES_WX.map((wx, i) => {
        const sx = wx - cameraX;
        if (sx < -80 || sx > 540) return null;
        return <div key={i} className="campfire-anim" style={{ position: 'absolute', left: sx, bottom: GROUND_H, zIndex: 3 }} />;
      })}

      {/* Fireflies */}
      {Array.from({ length: count }, (_, idx) => {
        const sx = FIREFLY_WX[idx] - cameraX;
        if (sx < -60 || sx > 520) return null;
        const isPassed = passed[idx];
        const isNear = nearNodeIdx === idx && !isPassed && !puzzleDone;
        return (
          <div key={idx} style={{ position: 'absolute', left: sx - 16, bottom: GROUND_H + 40 + Math.sin(idx * 1.3) * 20, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: isPassed ? 22 : isNear ? 18 : 12,
              height: isPassed ? 22 : isNear ? 18 : 12,
              background: isPassed ? '#ffd700' : isNear ? '#00ffcc' : '#00d4aa',
              boxShadow: isPassed
                ? '0 0 14px #ffd700, 0 0 28px rgba(255,215,0,0.5)'
                : isNear
                ? '0 0 10px #00ffcc, 0 0 22px rgba(0,255,204,0.5)'
                : '0 0 6px #00d4aa',
              borderRadius: 2,
              transition: 'all 0.25s',
              animation: isNear ? 'firefly-pulse 1s ease-in-out infinite' : undefined,
            }} />
            {isNear && (
              <span className="font-pixel" style={{ color: '#00ffcc', fontSize: 5, textShadow: '1px 1px 0 #000', whiteSpace: 'nowrap', animation: 'firefly-pulse 0.8s ease-in-out infinite' }}>▼ INTERAGIR</span>
            )}
          </div>
        );
      })}

      {/* NPC dialog (entry) */}
      {!npcDismissed && !activeQ && !showNarrative && passedCount === 0 && (
        <div className="fixed left-0 right-0 z-20" style={{ bottom: 80 }}>
          <button onClick={() => setNpcDismissed(true)} style={{ position: 'absolute', right: 16, top: 8, background: 'none', border: 'none', color: '#f7ead5', fontSize: 12, cursor: 'pointer' }}>✕</button>
          <DialogBox portrait={treeImg} name="ÁRVORE ANCIÃ" text="Bem-vindo à Floresta dos Ecos. Procure os vaga-lumes que guardam os segredos! Chegue perto e pressione ▶ para responder." accentColor="#00a888" />
        </div>
      )}

      {/* Progress hint */}
      {npcDismissed && !activeQ && !showNarrative && !puzzleDone && (
        <div className="fixed left-0 right-0 z-20" style={{ bottom: 80 }}>
          {nearNodeIdx !== null && !passed[nearNodeIdx] ? (
            <DialogBox portrait={treeImg} name="ÁRVORE ANCIÃ" text="O vaga-lume pulsa! Pressione ▶ para despertar o segredo." accentColor="#00a888" />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="panel-parchment px-3 py-1">
                <p className="font-pixel text-center" style={{ color: '#f7ead5', fontSize: 6 }}>
                  {passedCount}/{threshold} segredos encontrados
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hero */}
      <div style={{ position: 'absolute', left: heroScreen, bottom: GROUND_H, zIndex: 6, pointerEvents: 'none' }}>
        <AnimatedHero scale={2} walking={isWalking} facingLeft={facingLeft} />
      </div>

      {/* Question overlay */}
      {activeQ !== null && (
        <QuestionCard question={questions[activeQ]} onAnswer={handleAnswer} sceneColor="#00d4aa" />
      )}

      {/* Narrative */}
      {showNarrative && (
        <NarrativeChoiceModal choice={narrative} guardianImg={treeImg} guardianName="ÁRVORE ANCIÃ" onChoose={handleNarrative} sceneColor="#00d4aa" />
      )}

      {/* D-Pad */}
      <DPad onStart={startWalking} onStop={stopWalking} onAction={handleInteract} />
    </div>
  );
}
