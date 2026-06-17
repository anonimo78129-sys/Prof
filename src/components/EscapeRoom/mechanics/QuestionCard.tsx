import { useState } from 'react';
import type { MCQuestion } from '../../../types/game';

interface Props {
  question: MCQuestion;
  onAnswer: (idx: number) => void;
  sceneColor?: string;
  portrait?: string;
  npcName?: string;
}

export default function QuestionCard({
  question,
  onAnswer,
  sceneColor = '#4a8ec8',
  portrait,
  npcName = 'GUARDIÃO',
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setTimeout(() => onAnswer(idx), idx === question.correct ? 500 : 600);
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 slide-up">

      {/* Gradient fade from game to panel */}
      <div style={{ height: 36, background: 'linear-gradient(to bottom, transparent, rgba(4,2,18,0.92))', pointerEvents: 'none' }} />

      {/* ── NPC dialog row ── */}
      <div style={{
        background: 'linear-gradient(180deg, #0d0b22 0%, #080618 100%)',
        borderTop: `2px solid ${sceneColor}44`,
        padding: '10px 12px 8px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        {/* Portrait frame */}
        <div style={{
          width: 56, height: 56, flexShrink: 0,
          border: `2px solid ${sceneColor}`,
          background: '#06040e',
          boxShadow: `0 0 10px ${sceneColor}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {portrait
            ? <img src={portrait} alt={npcName} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
            : <span style={{ fontSize: 28 }}>❓</span>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name tag */}
          <div style={{ display: 'inline-block', background: sceneColor, padding: '2px 8px', marginBottom: 5 }}>
            <span className="font-pixel" style={{ color: '#fff', fontSize: 6, textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}>
              {npcName}
            </span>
          </div>
          {/* Question text */}
          <p className="font-vt" style={{ color: '#f0e8d8', fontSize: 20, lineHeight: 1.3, margin: 0 }}>
            {question.text}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${sceneColor}88, transparent)` }} />

      {/* ── Answer choices ── */}
      <div style={{
        background: 'linear-gradient(180deg, #060414 0%, #030210 100%)',
        padding: '6px 12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}>
        {question.options.map((opt, idx) => {
          const isCorrectPick = selected === idx && idx === question.correct;
          const isWrongPick   = selected === idx && idx !== question.correct;
          const isDimmed      = answered && selected !== idx;

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={answered}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 10px',
                background: isCorrectPick
                  ? 'rgba(0,180,60,0.22)'
                  : isWrongPick
                  ? 'rgba(200,30,30,0.22)'
                  : isDimmed
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(255,255,255,0.06)',
                border: `1px solid ${
                  isCorrectPick ? '#00cc44'
                  : isWrongPick ? '#cc2222'
                  : isDimmed ? 'rgba(255,255,255,0.08)'
                  : `${sceneColor}55`
                }`,
                cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.12s',
                textAlign: 'left',
                opacity: isDimmed ? 0.45 : 1,
              }}
            >
              {/* Letter badge */}
              <span
                className="font-pixel"
                style={{
                  width: 22, height: 22, minWidth: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCorrectPick ? '#00cc44' : isWrongPick ? '#cc2222' : isDimmed ? '#222' : sceneColor,
                  color: '#fff',
                  fontSize: 7,
                  flexShrink: 0,
                  boxShadow: !isDimmed && !answered ? `0 0 6px ${sceneColor}66` : 'none',
                }}
              >
                {isCorrectPick ? '✓' : isWrongPick ? '✗' : letters[idx]}
              </span>

              {/* ► + text */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!answered && (
                  <span className="font-vt" style={{ color: sceneColor, fontSize: 18, lineHeight: 1 }}>►</span>
                )}
                <span className="font-vt" style={{
                  color: isCorrectPick ? '#00ee55' : isWrongPick ? '#ff4444' : '#e8e0d0',
                  fontSize: 19, lineHeight: 1.25,
                }}>
                  {opt}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
