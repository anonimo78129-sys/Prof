import { useMemo, useState, useCallback, useEffect } from 'react';
import type { MatchPair, NarrativeChoice, KarmaChoice } from '../../types/game';
import AnimatedHero from './mechanics/AnimatedHero';
import NarrativeChoiceModal from './mechanics/NarrativeChoice';
import DialogBox from './ui/DialogBox';
import DPad from './ui/DPad';
import { useHeroMovement } from '../../hooks/useHeroMovement';

interface Props {
  bgImg?: string;
  cogImg?: string;
  pairs: MatchPair[];
  narrative: NarrativeChoice;
  onCorrect: () => void;
  onWrong: () => void;
  onComplete: (karma: KarmaChoice) => void;
}

const WORLD_W  = 1400;
const HERO_W   = 128;
const GROUND_H = 120;

// First half = concept pedestals, second half = definition slots
const CONCEPT_BASE = 160;
const CONCEPT_GAP  = 240;
const SLOT_BASE    = 800;
const SLOT_GAP     = 200;

export default function CityScene({ cogImg, pairs, narrative, onCorrect, onWrong, onComplete }: Props) {
  const n = Math.min(pairs.length, 4);

  const conceptWX = Array.from({ length: n }, (_, i) => CONCEPT_BASE + i * CONCEPT_GAP);
  const slotWX    = Array.from({ length: n }, (_, i) => SLOT_BASE + i * SLOT_GAP);
  const nodeWorldX = [...conceptWX, ...slotWX];

  // Shuffle definitions once
  const shuffled = useMemo(() =>
    [...pairs.slice(0, n).map((p, i) => ({ def: p.definition, origIdx: i }))]
      .sort(() => Math.random() - 0.5),
  []);

  const [matched, setMatched] = useState<boolean[]>(Array(n).fill(false));
  const [carrying, setCarrying] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [showNarrative, setShowNarrative] = useState(false);
  const [npcMsg, setNpcMsg] = useState('Bem-vinda à Cidade Flutuante! Pegue um CONCEITO (esquerda) e carregue até a DEFINIÇÃO correta (direita)!');

  const allMatched = matched.every(Boolean);

  const { heroWorldX, cameraX, isWalking, facingLeft, nearNodeIdx, startWalking, stopWalking } =
    useHeroMovement({
      worldWidth: WORLD_W,
      heroWidth: HERO_W,
      nodeWorldX,
      nodeTriggerDist: 65,
      initialX: 20,
    });

  const heroScreen = heroWorldX - cameraX;

  const handleInteract = useCallback(() => {
    if (showNarrative || allMatched || nearNodeIdx === null) return;

    if (nearNodeIdx < n) {
      // Near a concept
      const ci = nearNodeIdx;
      if (matched[ci]) return;
      setCarrying(ci);
      setNpcMsg(`Carregando "${pairs[ci].concept}". Agora leve até a definição correta!`);
    } else {
      // Near a slot
      const si = nearNodeIdx - n;
      const { origIdx } = shuffled[si];
      if (matched[origIdx]) return;

      if (carrying === null) {
        setNpcMsg('Primeiro pegue um conceito à esquerda!');
        return;
      }

      if (carrying === origIdx) {
        // Correct match
        const next = [...matched]; next[origIdx] = true; setMatched(next);
        setCarrying(null);
        onCorrect();
        setNpcMsg(`Correto! "${pairs[origIdx].concept}" encaixou perfeitamente!`);
        if (next.every(Boolean)) {
          setTimeout(() => setShowNarrative(true), 600);
        }
      } else {
        // Wrong match
        setWrongFlash(si);
        setTimeout(() => setWrongFlash(null), 500);
        setCarrying(null);
        onWrong();
        setNpcMsg('Não é este par! Tente outro conceito.');
      }
    }
  }, [showNarrative, allMatched, nearNodeIdx, n, matched, carrying, pairs, shuffled, onCorrect, onWrong]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleInteract(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleInteract]);

  const handleNarrative = (karma: KarmaChoice) => {
    setShowNarrative(false);
    setTimeout(() => onComplete(karma), 500);
  };

  return (
    <div className="fixed inset-0 overflow-hidden scene-fade-in" style={{ touchAction: 'none' }}>
      {/* Sky */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #2040a0 0%, #4080c0 50%, #80b0e0 100%)' }} />

      {/* City BG */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: GROUND_H, top: 0,
        backgroundImage: "url('/assets/bg/city-scene.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.7,
      }} />

      {/* Ground */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_H, background: 'linear-gradient(to bottom, #6090c0 0%, #6090c0 14%, #304870 14%, #203050 100%)' }} />

      {/* Zone label */}
      <div style={{ position: 'absolute', top: 56, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
        <div className="panel-parchment px-3 py-1" style={{ background: 'rgba(0,10,40,0.7)', border: '1px solid #c88f20' }}>
          <p className="font-pixel text-center" style={{ color: '#c88f20', fontSize: 6 }}>ESQUERDA: CONCEITOS · DIREITA: DEFINIÇÕES</p>
        </div>
      </div>

      {/* Concept pedestals */}
      {Array.from({ length: n }, (_, i) => {
        const sx = conceptWX[i] - cameraX;
        if (sx < -100 || sx > 520) return null;
        const isMatched = matched[i];
        const isCarried = carrying === i;
        const isNear = nearNodeIdx === i && !isMatched;
        return (
          <div key={i} style={{ position: 'absolute', left: sx - 40, bottom: GROUND_H + 4, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Pedestal */}
            <div style={{ width: 80, height: 8, background: '#8060c0', boxShadow: '0 2px 0 #4030a0' }} />
            <div style={{
              width: 80, padding: '6px 4px',
              background: isMatched ? 'rgba(0,80,20,0.85)' : isCarried ? 'rgba(0,50,100,0.85)' : 'rgba(10,10,40,0.85)',
              border: `2px solid ${isMatched ? '#00ff88' : isNear ? '#c88f20' : '#6060c0'}`,
              opacity: isMatched ? 0.6 : 1,
              boxShadow: isNear ? '0 0 12px #c88f20' : undefined,
              transition: 'all 0.2s',
            }}>
              <p className="font-vt text-center" style={{ color: isMatched ? '#00ff88' : '#fff', fontSize: 13, lineHeight: 1.2 }}>
                {isMatched ? '✓' : isCarried ? '↑' : ''} {pairs[i].concept}
              </p>
            </div>
            {isNear && !isCarried && (
              <p className="font-pixel mt-1" style={{ color: '#c88f20', fontSize: 5, textShadow: '1px 1px 0 #000', whiteSpace: 'nowrap' }}>▼ PEGAR</p>
            )}
          </div>
        );
      })}

      {/* Definition slots */}
      {shuffled.slice(0, n).map(({ def, origIdx }, si) => {
        const sx = slotWX[si] - cameraX;
        if (sx < -100 || sx > 520) return null;
        const isMatched = matched[origIdx];
        const isNear = nearNodeIdx === si + n && !isMatched;
        const isFlashing = wrongFlash === si;
        return (
          <div key={si} style={{ position: 'absolute', left: sx - 40, bottom: GROUND_H + 4, zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 80, height: 8, background: '#c06020', boxShadow: '0 2px 0 #804010' }} />
            <div style={{
              width: 80, padding: '6px 4px',
              background: isMatched ? 'rgba(0,80,20,0.85)' : isFlashing ? 'rgba(120,0,0,0.85)' : 'rgba(10,10,40,0.85)',
              border: `2px solid ${isMatched ? '#00ff88' : isFlashing ? '#ff3333' : isNear ? '#ffe14d' : '#c06020'}`,
              boxShadow: isNear ? '0 0 12px #ffe14d' : isFlashing ? '0 0 16px #ff0000' : undefined,
              transition: 'all 0.2s',
            }}>
              <p className="font-vt text-center" style={{ color: isMatched ? '#00ff88' : '#ddd', fontSize: 12, lineHeight: 1.2 }}>
                {isMatched ? '✓ ' : ''}{def}
              </p>
            </div>
            {isNear && (
              <p className="font-pixel mt-1" style={{ color: '#ffe14d', fontSize: 5, textShadow: '1px 1px 0 #000', whiteSpace: 'nowrap' }}>▼ ENCAIXAR</p>
            )}
          </div>
        );
      })}

      {/* Carried item floating above hero */}
      {carrying !== null && (
        <div style={{
          position: 'absolute',
          left: heroScreen + HERO_W / 2 - 40,
          bottom: GROUND_H + 90,
          zIndex: 7,
          width: 80,
          padding: '4px',
          background: 'rgba(0,50,100,0.9)',
          border: '2px solid #00aaff',
          boxShadow: '0 0 10px #00aaff',
        }}>
          <p className="font-vt text-center" style={{ color: '#00aaff', fontSize: 12 }}>{pairs[carrying].concept}</p>
        </div>
      )}

      {/* Hero */}
      <div style={{ position: 'absolute', left: heroScreen, bottom: GROUND_H, zIndex: 6, pointerEvents: 'none' }}>
        <AnimatedHero scale={2} walking={isWalking} facingLeft={facingLeft} />
      </div>

      {/* NPC dialog */}
      {!showNarrative && (
        <div className="fixed left-0 right-0 z-20" style={{ bottom: 80 }}>
          <DialogBox portrait={cogImg} name="PROF. COG" text={npcMsg} accentColor="#c88f20" />
        </div>
      )}

      {/* Narrative */}
      {showNarrative && (
        <NarrativeChoiceModal choice={narrative} guardianImg={cogImg} guardianName="PROF. COG" onChoose={handleNarrative} sceneColor="#ffc800" />
      )}

      {/* D-Pad */}
      <DPad onStart={startWalking} onStop={stopWalking} onAction={handleInteract} />
    </div>
  );
}
