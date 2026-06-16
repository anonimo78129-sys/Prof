import { useState } from 'react';
import type { MCQuestion, NarrativeChoice, KarmaChoice } from '../../types/game';
import QuestionCard from './mechanics/QuestionCard';
import NarrativeChoiceModal from './mechanics/NarrativeChoice';
import DialogBox from './ui/DialogBox';

interface Props {
  bgImg?: string;
  treeImg?: string;
  questions: MCQuestion[];
  narrative: NarrativeChoice;
  onCorrect: () => void;
  onWrong: () => void;
  onComplete: (karma: KarmaChoice) => void;
}

const FIREFLY_POS = [
  { left: '22%', top: '30%' },
  { left: '68%', top: '24%' },
  { left: '48%', top: '45%' },
];

export default function ForestScene({ bgImg, treeImg, questions, narrative, onCorrect, onWrong, onComplete }: Props) {
  const [passed, setPassed] = useState<boolean[]>(Array(questions.length).fill(false));
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [triedOnce, setTriedOnce] = useState<boolean[]>(Array(questions.length).fill(false));
  const [showNarrative, setShowNarrative] = useState(false);
  const [done, setDone] = useState(false);

  const passedCount = passed.filter(Boolean).length;
  const threshold = Math.ceil(questions.length * 0.67); // 2/3
  const puzzleComplete = passedCount >= threshold;

  const handleTap = (idx: number) => {
    if (passed[idx] || activeQ !== null || puzzleComplete) return;
    setActiveQ(idx);
  };

  const handleAnswer = (idx: number, answerIdx: number) => {
    const correct = answerIdx === questions[idx].correct;
    setActiveQ(null);
    if (correct) {
      const isFirstTry = !triedOnce[idx];
      const newPassed = [...passed];
      newPassed[idx] = true;
      setPassed(newPassed);
      if (isFirstTry) onCorrect();
      else onCorrect(); // still award correct but score tracks firstTry separately

      // Check if puzzle done
      const newCount = newPassed.filter(Boolean).length;
      if (newCount >= threshold && !showNarrative && !done) {
        setTimeout(() => setShowNarrative(true), 500);
      }
    } else {
      const newTried = [...triedOnce];
      newTried[idx] = true;
      setTriedOnce(newTried);
      onWrong();
    }
  };

  const handleNarrative = (karma: KarmaChoice) => {
    setShowNarrative(false);
    setDone(true);
    setTimeout(() => onComplete(karma), 600);
  };

  return (
    <div
      className="fixed inset-0 scene-fade-in"
      style={{
        background: bgImg
          ? `url(${bgImg}) center/cover no-repeat`
          : 'radial-gradient(ellipse at 50% 60%, #0a2d14 0%, #051a0a 60%, #020d05 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.3)' }} />

      {/* Fireflies */}
      {questions.map((_, idx) => {
        const isPassed = passed[idx];
        const isAvail = !isPassed && activeQ === null && !puzzleComplete;
        return (
          <button
            key={idx}
            onClick={() => handleTap(idx)}
            className={`absolute ${isAvail ? 'firefly-pulse' : ''}`}
            style={{
              left: FIREFLY_POS[idx]?.left ?? `${25 + idx * 25}%`,
              top: FIREFLY_POS[idx]?.top ?? '35%',
              transform: 'translate(-50%,-50%)',
              background: 'transparent',
              border: 'none',
              padding: 12,
              cursor: isAvail ? 'pointer' : 'default',
            }}
          >
            <div
              style={{
                width: isPassed ? 22 : 14,
                height: isPassed ? 22 : 14,
                background: isPassed ? '#ffd700' : '#00d4aa',
                boxShadow: isPassed ? '0 0 14px #ffd700, 0 0 28px #ffd700' : '0 0 8px #00d4aa, 0 0 16px rgba(0,212,170,0.4)',
                transition: 'all 0.4s',
              }}
            />
          </button>
        );
      })}

      {/* Fragment glow (when puzzle complete but narrative not yet shown) */}
      {puzzleComplete && !showNarrative && !done && (
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ top: '30%' }}
        >
          <div className="fragment-float" style={{ filter: 'drop-shadow(0 0 16px #00ff88)' }}>
            <svg viewBox="0 0 10 10" style={{ imageRendering: 'pixelated', width: 48, height: 48 }}>
              <rect x="3" y="0" width="4" height="1" fill="#00ff88"/>
              <rect x="2" y="1" width="6" height="1" fill="#00ff88"/>
              <rect x="1" y="2" width="8" height="1" fill="#00ff88"/>
              <rect x="0" y="3" width="10" height="2" fill="#00ff88"/>
              <rect x="1" y="5" width="8" height="1" fill="#00cc66"/>
              <rect x="2" y="6" width="6" height="1" fill="#00cc66"/>
              <rect x="3" y="7" width="4" height="1" fill="#00aa44"/>
              <rect x="4" y="8" width="2" height="1" fill="#008833"/>
            </svg>
          </div>
        </div>
      )}

      {/* Guardian dialog */}
      {!puzzleComplete && activeQ === null && (
        <div className="absolute bottom-0 left-0 right-0">
          <DialogBox
            portrait={treeImg}
            name="ÁRVORE ANCIÃ"
            text={
              passedCount === 0
                ? 'Encontre os segredos desta floresta. Toque nos vaga-lumes!'
                : passedCount === 1
                ? 'Bem feito. Falta mais um segredo para a floresta confiar em você.'
                : 'Você encontrou os segredos... O Fragmento desperta!'
            }
            accentColor="#00a888"
          />
        </div>
      )}

      {/* Question */}
      {activeQ !== null && (
        <QuestionCard
          question={questions[activeQ]}
          onAnswer={(answerIdx) => handleAnswer(activeQ, answerIdx)}
          sceneColor="#00d4aa"
        />
      )}

      {/* Narrative choice */}
      {showNarrative && (
        <NarrativeChoiceModal
          choice={narrative}
          guardianImg={treeImg}
          guardianName="ÁRVORE ANCIÃ"
          onChoose={handleNarrative}
          sceneColor="#00d4aa"
        />
      )}
    </div>
  );
}
