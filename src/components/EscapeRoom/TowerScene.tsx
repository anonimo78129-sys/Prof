import { useState } from 'react';
import type { MCQuestion, FragmentName, KarmaState } from '../../types/game';
import QuestionCard from './mechanics/QuestionCard';

interface Props {
  bgImg?: string;
  guardianImg?: string;
  questions: MCQuestion[];
  fragments: FragmentName[];
  karma: KarmaState;
  onCorrect: () => void;
  onWrong: () => void;
  onComplete: () => void;
}

const FRAG_ORDER: FragmentName[] = ['esmeralda', 'ambar', 'safira'];
const FRAG_COLORS: Record<FragmentName, { color: string; filter: string; label: string }> = {
  esmeralda: { color: '#00ff88', filter: 'hue-rotate(120deg) saturate(2)', label: 'ESMERALDA' },
  ambar: { color: '#ffc800', filter: 'hue-rotate(200deg) saturate(2) brightness(1.3)', label: 'ÂMBAR' },
  safira: { color: '#4488ff', filter: 'hue-rotate(240deg) saturate(1.5)', label: 'SAFIRA' },
};
const GUARDIAN_INTRO: Record<string, string> = {
  heroi: 'Sinto a Luz em você. Mas palavras não abrem portais. Prove.',
  sabio: 'A Sombra da curiosidade te guia. Mostre-me o que aprendeu.',
  explorador: 'Você caminhou entre dois mundos. Isso me diz muito. Vamos ver.',
  mestre: 'Algo em você é diferente. Surpreenda-me.',
};

export default function TowerScene({ bgImg, guardianImg, questions, fragments, karma, onCorrect, onWrong, onComplete }: Props) {
  const [filled, setFilled] = useState<boolean[]>(Array(3).fill(false));
  const [currentSlot, setCurrentSlot] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [triedOnce, setTriedOnce] = useState<boolean[]>(Array(3).fill(false));
  const [victory, setVictory] = useState(false);

  const allFilled = filled.every(Boolean);
  const karmaLabel = karma.ending ?? 'default';

  const handleSlotTap = (idx: number) => {
    if (filled[idx] || idx !== currentSlot || showQuestion || victory) return;
    setShowQuestion(true);
  };

  const handleAnswer = (answerIdx: number) => {
    const correct = answerIdx === questions[currentSlot]?.correct;
    setShowQuestion(false);

    if (correct) {
      const isFirstTry = !triedOnce[currentSlot];
      const newFilled = [...filled];
      newFilled[currentSlot] = true;
      setFilled(newFilled);
      if (isFirstTry) onCorrect();
      else onCorrect();

      const nextSlot = currentSlot + 1;
      if (nextSlot >= 3) {
        setVictory(true);
        setTimeout(onComplete, 1500);
      } else {
        setCurrentSlot(nextSlot);
      }
    } else {
      const newTried = [...triedOnce];
      newTried[currentSlot] = true;
      setTriedOnce(newTried);
      onWrong();
    }
  };

  return (
    <div
      className="fixed inset-0 scene-fade-in"
      style={{
        background: bgImg
          ? `url(${bgImg}) center/cover no-repeat`
          : 'radial-gradient(ellipse at 50% 40%, #0a0820 0%, #050310 70%, #000000 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.5)' }} />

      {/* Portal (no bg) */}
      {!bgImg && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="portal-spin" style={{ width: 120, height: 120, borderRadius: '50%', border: '3px solid #7c3aed', boxShadow: '0 0 30px #7c3aed, inset 0 0 30px rgba(124,58,237,0.3)' }} />
          {victory && (
            <div className="absolute inset-4" style={{ borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #a855f7 50%, transparent 100%)', animation: 'portal-spin 0.5s linear infinite' }} />
          )}
        </div>
      )}

      {/* Fragment slots */}
      <div className="absolute left-0 right-0 flex justify-center gap-5 px-4" style={{ top: bgImg ? 180 : 200 }}>
        {FRAG_ORDER.map((frag, idx) => {
          const isFilled = filled[idx];
          const isCurrent = idx === currentSlot && !isFilled;
          const { color, filter, label } = FRAG_COLORS[frag];
          const hasFragment = fragments.includes(frag);

          return (
            <button
              key={frag}
              onClick={() => hasFragment ? handleSlotTap(idx) : undefined}
              className="flex flex-col items-center gap-1"
              style={{ background: 'transparent', border: 'none', cursor: isCurrent && hasFragment ? 'pointer' : 'default' }}
            >
              <div
                className={isCurrent ? 'firefly-pulse' : ''}
                style={{
                  width: 60,
                  height: 60,
                  border: `3px solid ${isFilled ? color : isCurrent ? color : '#333'}`,
                  background: isFilled ? `${color}22` : '#050310',
                  boxShadow: isFilled ? `0 0 16px ${color}, 0 0 32px ${color}44` : isCurrent ? `0 0 8px ${color}` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.4s',
                }}
              >
                {isFilled ? (
                  <img src="/assets/frags/frag-esmeralda.png" alt={label}
                    style={{ width: 36, height: 36, imageRendering: 'pixelated', filter }} />
                ) : (
                  <span style={{ fontSize: 24, opacity: 0.25 }}>⬡</span>
                )}
              </div>
              <span className="font-pixel" style={{ color: isFilled ? color : '#444', fontSize: 5 }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress text */}
      <div className="absolute text-center" style={{ top: bgImg ? 280 : 300, left: 0, right: 0 }}>
        <p className="font-vt" style={{ color: '#ffd700', fontSize: 18 }}>
          {filled.filter(Boolean).length} / 3 fragmentos inseridos
        </p>
        {!allFilled && currentSlot < 3 && !showQuestion && (
          <p className="font-vt mt-1" style={{ color: '#aaa', fontSize: 16 }}>
            Toque no slot {FRAG_COLORS[FRAG_ORDER[currentSlot]].label} ↑
          </p>
        )}
      </div>

      {/* Victory flash */}
      {victory && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)', animation: 'scene-fade-in 0.3s ease-out' }} />
      )}

      {/* Guardian bottom dialog */}
      {!allFilled && !showQuestion && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20 }}>
          <div style={{ height: 28, background: 'linear-gradient(to bottom, transparent, rgba(4,2,18,0.92))', pointerEvents: 'none' }} />
          <div style={{ background: 'linear-gradient(180deg, #0d0b22 0%, #080618 100%)', borderTop: '2px solid #ffd70044', padding: '10px 12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ width: 56, height: 56, flexShrink: 0, border: '2px solid #ffd700', background: '#06040e', boxShadow: '0 0 10px #ffd70066', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {guardianImg
                ? <img src={guardianImg} alt="O Guardião" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
                : <span style={{ fontSize: 28 }}>⚔️</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-block', background: '#ffd700', padding: '2px 8px', marginBottom: 5 }}>
                <span className="font-pixel" style={{ color: '#000', fontSize: 6 }}>O GUARDIÃO</span>
              </div>
              <p className="font-vt" style={{ color: '#f0e8d8', fontSize: 20, lineHeight: 1.3, margin: 0 }}>
                {filled.some(Boolean)
                  ? `${filled.filter(Boolean).length} fragmento(s) inserido(s). Continue — o portal aguarda.`
                  : GUARDIAN_INTRO[karmaLabel] ?? GUARDIAN_INTRO.explorador}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Question */}
      {showQuestion && currentSlot < questions.length && (
        <QuestionCard
          question={questions[currentSlot]}
          onAnswer={handleAnswer}
          sceneColor="#ffd700"
          portrait={guardianImg}
          npcName="O GUARDIÃO"
        />
      )}
    </div>
  );
}
