import { useState } from 'react';
import type { MCQuestion } from '../../../types/game';

interface Props {
  question: MCQuestion;
  onAnswer: (idx: number) => void;
  sceneColor?: string;
}

export default function QuestionCard({ question, onAnswer, sceneColor = '#4338ca' }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [shaking, setShaking] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);

    if (idx === question.correct) {
      setAnswered(true);
      setTimeout(() => onAnswer(idx), 600);
    } else {
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        setSelected(null);
        onAnswer(idx);
      }, 600);
    }
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    /* Sem overlay escuro — o cenário de batalha fica visível */
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className={`w-full max-w-md mx-auto slide-up ${shaking ? 'shake' : ''}`}>
        {/* Question panel */}
        <div
          className="mx-3 mb-3 p-4"
          style={{
            background: 'linear-gradient(160deg, #f5ead0 0%, #e8d8b0 100%)',
            border: `3px solid ${sceneColor}`,
            boxShadow: `4px 4px 0 rgba(0,0,0,0.5)`,
          }}
        >
          {/* Question text */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="flex-shrink-0 flex items-center justify-center"
              style={{ width: 28, height: 28, background: sceneColor, border: '2px solid rgba(0,0,0,0.4)', boxShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}
            >
              <span className="font-pixel text-white" style={{ fontSize: 10 }}>?</span>
            </div>
            <p className="font-vt leading-tight" style={{ color: '#1a0c00', fontSize: 20 }}>
              {question.text}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2">
            {question.options.map((opt, idx) => {
              const isCorrectPick = selected === idx && idx === question.correct;
              const isWrongPick   = selected === idx && idx !== question.correct;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className="flex items-center gap-3 px-3 py-2 text-left"
                  style={{
                    background: isCorrectPick ? '#c8f0c8' : isWrongPick ? '#f0c8c8' : '#f0e4c8',
                    border: `2px solid ${isCorrectPick ? '#2a8c2a' : isWrongPick ? '#cc2222' : sceneColor}`,
                    boxShadow: `2px 2px 0 rgba(0,0,0,0.25)`,
                    cursor: answered ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <span
                    className="font-pixel flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: 24, height: 24, minWidth: 24,
                      background: isCorrectPick ? '#2a8c2a' : isWrongPick ? '#cc2222' : sceneColor,
                      color: '#fff',
                      fontSize: 8,
                    }}
                  >
                    {letters[idx]}
                  </span>
                  <span className="font-vt" style={{ color: isCorrectPick ? '#1a5c1a' : isWrongPick ? '#8c1a1a' : '#1a0c00', fontSize: 18, lineHeight: 1.2 }}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
