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
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className={`w-full max-w-md slide-up ${shaking ? 'shake' : ''}`}>
        {/* Question box */}
        <div
          className="dialog-rpg mx-3 mb-3 p-4"
          style={{ borderColor: sceneColor }}
        >
          {/* Question mark icon */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center btn-pixel"
              style={{ background: sceneColor, fontSize: 14 }}
            >
              <span className="font-pixel text-white" style={{ fontSize: 10 }}>?</span>
            </div>
            <p className="font-vt text-white leading-tight" style={{ fontSize: 20 }}>
              {question.text}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2">
            {question.options.map((opt, idx) => {
              let bg = '#1a1a2e';
              let border = '#555';
              let textColor = '#ffffff';

              if (selected === idx) {
                if (idx === question.correct) {
                  bg = '#004400';
                  border = '#00ff88';
                  textColor = '#00ff88';
                } else {
                  bg = '#440000';
                  border = '#ff4444';
                  textColor = '#ff4444';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className="flex items-center gap-3 px-3 py-2 text-left transition-colors"
                  style={{
                    background: bg,
                    border: `2px solid ${border}`,
                    cursor: answered ? 'default' : 'pointer',
                  }}
                >
                  <span
                    className="font-pixel flex-shrink-0 w-6 h-6 flex items-center justify-center text-center"
                    style={{ background: sceneColor, color: '#000', fontSize: 8, minWidth: 24 }}
                  >
                    {letters[idx]}
                  </span>
                  <span className="font-vt" style={{ color: textColor, fontSize: 18, lineHeight: 1.2 }}>
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
