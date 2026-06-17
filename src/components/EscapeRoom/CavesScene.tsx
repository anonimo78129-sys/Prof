import { useState } from 'react';
import type { MCQuestion, NarrativeChoice, KarmaChoice } from '../../types/game';
import QuestionCard from './mechanics/QuestionCard';
import NarrativeChoiceModal from './mechanics/NarrativeChoice';
import DialogBox from './ui/DialogBox';

interface Props {
  bgImg?: string;
  celeneImg?: string;
  questions: MCQuestion[];
  narrative: NarrativeChoice;
  onCorrect: () => void;
  onWrong: () => void;
  onComplete: (karma: KarmaChoice) => void;
}

export default function CavesScene({ bgImg, celeneImg, questions, narrative, onCorrect, onWrong, onComplete }: Props) {
  const [lit, setLit] = useState<boolean[]>(Array(questions.length).fill(false));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [triedOnce, setTriedOnce] = useState<boolean[]>(Array(questions.length).fill(false));
  const [showNarrative, setShowNarrative] = useState(false);

  const allLit = lit.every(Boolean);

  const handleCrystalTap = () => {
    if (showQuestion || allLit || showNarrative) return;
    setShowQuestion(true);
  };

  const handleAnswer = (answerIdx: number) => {
    const correct = answerIdx === questions[currentIdx].correct;
    setShowQuestion(false);

    if (correct) {
      const isFirstTry = !triedOnce[currentIdx];
      const newLit = [...lit];
      newLit[currentIdx] = true;
      setLit(newLit);
      if (isFirstTry) onCorrect();
      else onCorrect();

      const nextIdx = currentIdx + 1;
      if (nextIdx >= questions.length) {
        // All crystals lit
        setTimeout(() => setShowNarrative(true), 600);
      } else {
        setCurrentIdx(nextIdx);
      }
    } else {
      const newTried = [...triedOnce];
      newTried[currentIdx] = true;
      setTriedOnce(newTried);
      onWrong();
    }
  };

  const handleNarrative = (karma: KarmaChoice) => {
    setShowNarrative(false);
    setTimeout(() => onComplete(karma), 600);
  };

  return (
    <div
      className="fixed inset-0 scene-fade-in"
      style={{
        background: bgImg
          ? `url(${bgImg}) center/cover no-repeat`
          : "url('/assets/bg/caves-scene.jpg') center/cover no-repeat",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(10,0,25,0.25)' }} />

      {/* Crystal path */}
      <div className="absolute left-0 right-0 flex items-end justify-center gap-3 px-4" style={{ top: 120 }}>
        {questions.map((_, idx) => {
          const isLit = lit[idx];
          const isCurrent = idx === currentIdx && !allLit;
          const isLocked = idx > currentIdx;

          return (
            <button
              key={idx}
              onClick={isCurrent ? handleCrystalTap : undefined}
              className={`relative flex flex-col items-center ${isCurrent ? 'firefly-pulse' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: isCurrent ? 'pointer' : 'default',
                opacity: isLocked ? 0.3 : 1,
                padding: 4,
              }}
            >
              {/* Crystal SVG */}
              <svg viewBox="0 0 10 14" style={{ imageRendering: 'pixelated', width: 40, height: 56 }}>
                <rect x="3" y="0" width="4" height="1" fill={isLit ? '#ffd700' : isCurrent ? '#9333ea' : '#555'}/>
                <rect x="2" y="1" width="6" height="1" fill={isLit ? '#ffd700' : isCurrent ? '#9333ea' : '#444'}/>
                <rect x="1" y="2" width="8" height="3" fill={isLit ? '#ffaa00' : isCurrent ? '#7c22bb' : '#333'}/>
                <rect x="2" y="5" width="6" height="3" fill={isLit ? '#ff8800' : isCurrent ? '#5c1a88' : '#222'}/>
                <rect x="3" y="8" width="4" height="2" fill={isLit ? '#ff6600' : isCurrent ? '#3d1155' : '#1a1a1a'}/>
                <rect x="4" y="10" width="2" height="3" fill={isLit ? '#ff4400' : isCurrent ? '#2a0a33' : '#111'}/>
                {(isLit || isCurrent) && <rect x="2" y="2" width="2" height="1" fill="rgba(255,255,255,0.4)"/>}
              </svg>

              <span className="font-pixel mt-1" style={{ color: isLit ? '#ffd700' : isCurrent ? '#9333ea' : '#555', fontSize: 6 }}>
                {idx + 1}
              </span>

              {isCurrent && (
                <span className="font-vt mt-1 animate-bounce" style={{ color: '#9333ea', fontSize: 14 }}>↓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status */}
      {!allLit && !showNarrative && (
        <div className="absolute text-center" style={{ top: 280, left: 0, right: 0 }}>
          <p className="font-vt" style={{ color: '#9333ea', fontSize: 18 }}>
            {lit.filter(Boolean).length}/{questions.length} cristais acesos
          </p>
          {!showQuestion && currentIdx < questions.length && (
            <p className="font-vt mt-1" style={{ color: '#aaa', fontSize: 16 }}>
              Toque no cristal {currentIdx + 1} ↑
            </p>
          )}
        </div>
      )}

      {/* Fragment glow when all lit */}
      {allLit && !showNarrative && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ top: '20%' }}>
          <div className="fragment-float" style={{ filter: 'drop-shadow(0 0 16px #4488ff)' }}>
            <svg viewBox="0 0 10 10" style={{ imageRendering: 'pixelated', width: 48, height: 48 }}>
              <rect x="3" y="0" width="4" height="1" fill="#4488ff"/>
              <rect x="2" y="1" width="6" height="1" fill="#4488ff"/>
              <rect x="1" y="2" width="8" height="1" fill="#4488ff"/>
              <rect x="0" y="3" width="10" height="2" fill="#4488ff"/>
              <rect x="1" y="5" width="8" height="1" fill="#2255cc"/>
              <rect x="2" y="6" width="6" height="1" fill="#2255cc"/>
              <rect x="3" y="7" width="4" height="1" fill="#113399"/>
              <rect x="4" y="8" width="2" height="1" fill="#001166"/>
            </svg>
          </div>
        </div>
      )}

      {/* Guardian dialog */}
      {!showQuestion && !allLit && (
        <div className="absolute bottom-0 left-0 right-0">
          <DialogBox
            portrait={celeneImg}
            name="ORÁCULO CELENE"
            text={
              currentIdx === 0
                ? 'Acenda os cristais com o brilho do teu saber. Toque no primeiro!'
                : `${lit.filter(Boolean).length} de ${questions.length} cristais acesos...`
            }
            accentColor="#7c22bb"
          />
        </div>
      )}

      {/* Question */}
      {showQuestion && currentIdx < questions.length && (
        <QuestionCard
          question={questions[currentIdx]}
          onAnswer={handleAnswer}
          sceneColor="#9333ea"
        />
      )}

      {/* Narrative */}
      {showNarrative && (
        <NarrativeChoiceModal
          choice={narrative}
          guardianImg={celeneImg}
          guardianName="ORÁCULO CELENE"
          onChoose={handleNarrative}
          sceneColor="#9333ea"
        />
      )}
    </div>
  );
}
