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
  celeneImg?: string;
  questions: MCQuestion[];
  narrative: NarrativeChoice;
  onCorrect: () => void;
  onWrong: () => void;
  onComplete: (karma: KarmaChoice) => void;
}

const WORLD_W  = 1300;
const HERO_W   = 128;
const GROUND_H = 120;
const CRYSTAL_WX = [180, 360, 560, 760, 960];
const LIGHT_BASE = 120;
const LIGHT_GAIN = 22;
const LIGHT_LOSE = 14;

export default function CavesScene({ celeneImg, questions, narrative, onCorrect, onWrong, onComplete }: Props) {
  const count = Math.min(questions.length, CRYSTAL_WX.length);
  const threshold = count;

  const [lit, setLit] = useState<boolean[]>(Array(count).fill(false));
  const [triedOnce, setTriedOnce] = useState<boolean[]>(Array(count).fill(false));
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [showNarrative, setShowNarrative] = useState(false);
  const [lightRadius, setLightRadius] = useState(LIGHT_BASE);

  const litCount = lit.filter(Boolean).length;
  const allLit = litCount >= threshold;

  const { heroWorldX, cameraX, isWalking, facingLeft, nearNodeIdx, startWalking, stopWalking } =
    useHeroMovement({
      worldWidth: WORLD_W,
      heroWidth: HERO_W,
      nodeWorldX: CRYSTAL_WX.slice(0, count),
      nodeTriggerDist: 65,
      initialX: 20,
    });

  const heroScreen = heroWorldX - cameraX;
  const heroCenterX = heroScreen + HERO_W / 2;

  const handleInteract = useCallback(() => {
    if (activeQ !== null || showNarrative || allLit) return;
    if (nearNodeIdx !== null && !lit[nearNodeIdx]) {
      setActiveQ(nearNodeIdx);
    }
  }, [activeQ, showNarrative, allLit, nearNodeIdx, lit]);

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
      const firstTry = !triedOnce[qi];
      const next = [...lit]; next[qi] = true; setLit(next);
      if (firstTry) onCorrect(); else onCorrect();
      setLightRadius(r => Math.min(r + LIGHT_GAIN, 260));
      if (next.filter(Boolean).length >= threshold) {
        setTimeout(() => setShowNarrative(true), 700);
      }
    } else {
      const t = [...triedOnce]; t[qi] = true; setTriedOnce(t);
      onWrong();
      setLightRadius(r => Math.max(r - LIGHT_LOSE, 60));
    }
  };

  const handleNarrative = (karma: KarmaChoice) => {
    setShowNarrative(false);
    setTimeout(() => onComplete(karma), 500);
  };

  // Dark overlay with circular cutout around hero
  const darkOverlay = `radial-gradient(circle ${lightRadius}px at ${heroCenterX}px calc(100% - ${GROUND_H + 40}px), transparent 60%, rgba(5,0,15,0.96) 100%)`;

  return (
    <div className="fixed inset-0 overflow-hidden scene-fade-in" style={{ touchAction: 'none' }}>
      {/* Base sky */}
      <div style={{ position: 'absolute', inset: 0, background: '#050008' }} />

      {/* Cave BG */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: GROUND_H, top: 0,
        backgroundImage: "url('/assets/bg/caves-scene.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.55,
      }} />

      {/* Ground */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_H, background: 'linear-gradient(to bottom, #1a0a3a 0%, #1a0a3a 14%, #0e0520 14%, #070210 100%)' }} />

      {/* Crystals */}
      {Array.from({ length: count }, (_, idx) => {
        const sx = CRYSTAL_WX[idx] - cameraX;
        if (sx < -80 || sx > 520) return null;
        const isLit = lit[idx];
        const isNear = nearNodeIdx === idx && !isLit;
        return (
          <div key={idx} style={{ position: 'absolute', left: sx - 16, bottom: GROUND_H + 4, zIndex: 4 }}>
            <svg viewBox="0 0 10 14" style={{ imageRendering: 'pixelated', width: 40, height: 56, display: 'block' }}>
              <rect x="3" y="0" width="4" height="1" fill={isLit ? '#ffd700' : isNear ? '#9333ea' : '#2a1440'} />
              <rect x="2" y="1" width="6" height="1" fill={isLit ? '#ffd700' : isNear ? '#9333ea' : '#221033'} />
              <rect x="1" y="2" width="8" height="3" fill={isLit ? '#ffaa00' : isNear ? '#7c22bb' : '#180a28'} />
              <rect x="2" y="5" width="6" height="3" fill={isLit ? '#ff8800' : isNear ? '#5c1a88' : '#0f0618'} />
              <rect x="3" y="8" width="4" height="2" fill={isLit ? '#ff6600' : isNear ? '#3d1155' : '#0a0412'} />
              <rect x="4" y="10" width="2" height="3" fill={isLit ? '#ff4400' : isNear ? '#2a0a33' : '#06020a'} />
              {(isLit || isNear) && <rect x="2" y="2" width="2" height="1" fill="rgba(255,255,255,0.4)" />}
            </svg>
            {isLit && (
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,200,0,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            )}
            {isNear && (
              <p className="font-pixel" style={{ color: '#9333ea', fontSize: 5, textShadow: '1px 1px 0 #000', whiteSpace: 'nowrap', marginTop: 2, textAlign: 'center' }}>▼ ACENDER</p>
            )}
          </div>
        );
      })}

      {/* Hero */}
      <div style={{ position: 'absolute', left: heroScreen, bottom: GROUND_H, zIndex: 6, pointerEvents: 'none' }}>
        <AnimatedHero scale={2} walking={isWalking} facingLeft={facingLeft} />
      </div>

      {/* Darkness overlay */}
      {!allLit && (
        <div style={{ position: 'absolute', inset: 0, background: darkOverlay, pointerEvents: 'none', zIndex: 5, transition: 'background 0.4s' }} />
      )}

      {/* Light radius indicator */}
      {!allLit && !showNarrative && (
        <div style={{ position: 'fixed', top: 56, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(5,0,15,0.8)', border: '1px solid #9333ea', padding: '3px 10px' }}>
            <p className="font-pixel" style={{ color: '#9333ea', fontSize: 6 }}>
              🔮 {litCount}/{count} cristais · Luz: {lightRadius}px
            </p>
          </div>
        </div>
      )}

      {/* NPC dialog */}
      {!activeQ && !showNarrative && (
        <div className="fixed left-0 right-0 z-20" style={{ bottom: 80 }}>
          {nearNodeIdx !== null && !lit[nearNodeIdx] ? (
            <DialogBox portrait={celeneImg} name="ORÁCULO CELENE" text="Um cristal pulsa nas sombras! Responda para acendê-lo e expandir sua luz." accentColor="#7c22bb" />
          ) : (
            <DialogBox portrait={celeneImg} name="ORÁCULO CELENE" text={
              litCount === 0
                ? 'As Cavernas de Cristal estão escuras. Use seu saber para acender os cristais!'
                : `${litCount} de ${count} cristais acesos. Continue explorando!`
            } accentColor="#7c22bb" />
          )}
        </div>
      )}

      {/* Question */}
      {activeQ !== null && (
        <QuestionCard question={questions[activeQ]} onAnswer={handleAnswer} sceneColor="#9333ea" portrait={celeneImg} npcName="ORÁCULO CELENE" />
      )}

      {/* Narrative */}
      {showNarrative && (
        <NarrativeChoiceModal choice={narrative} guardianImg={celeneImg} guardianName="ORÁCULO CELENE" onChoose={handleNarrative} sceneColor="#9333ea" />
      )}

      {/* D-Pad (hidden during question or narrative) */}
      {!activeQ && !showNarrative && (
        <DPad onStart={startWalking} onStop={stopWalking} onAction={handleInteract} />
      )}
    </div>
  );
}
