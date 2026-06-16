import { useState } from 'react';
import type { NarrativeChoice as NarrativeChoiceType, KarmaChoice } from '../../../types/game';
import DialogBox from '../ui/DialogBox';

interface Props {
  choice: NarrativeChoiceType;
  guardianImg?: string;
  guardianName: string;
  onChoose: (karma: KarmaChoice, reaction: string) => void;
  sceneColor?: string;
}

export default function NarrativeChoice({ choice, guardianImg, guardianName, onChoose, sceneColor = '#4338ca' }: Props) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [reaction, setReaction] = useState('');

  const handleChoose = (idx: 0 | 1) => {
    if (chosen !== null) return;
    const opt = choice.options[idx];
    setChosen(idx);
    setReaction(opt.reaction);
    setTimeout(() => {
      onChoose(opt.karma, opt.reaction);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.72)' }}>

      {chosen === null ? (
        /* ── Choice phase ── */
        <div className="slide-up">
          {/* Prompt dialog */}
          <DialogBox
            portrait={guardianImg}
            name={guardianName}
            text={choice.prompt}
            accentColor={sceneColor}
          />

          {/* Options */}
          <div className="max-w-md mx-auto px-3 pb-4 flex flex-col gap-2 mt-1">
            {choice.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleChoose(idx as 0 | 1)}
                style={{
                  background: idx === 0
                    ? 'linear-gradient(135deg, #d4f0e8 0%, #b8e0d0 100%)'
                    : 'linear-gradient(135deg, #e8d4f0 0%, #d0b8e0 100%)',
                  border: `3px solid ${idx === 0 ? '#2a8c6a' : '#8c2a8c'}`,
                  boxShadow: `3px 3px 0 ${idx === 0 ? '#1a5c44' : '#5c1a5c'}`,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span className="font-pixel" style={{ color: idx === 0 ? '#1a5c44' : '#5c1a5c', fontSize: 6, display: 'block', marginBottom: 3 }}>
                  {idx === 0 ? '✦ LUZ' : '✦ SOMBRA'}
                </span>
                <span className="font-vt" style={{ color: '#1a0c00', fontSize: 19 }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Reaction phase ── */
        <div className="slide-up">
          <DialogBox
            portrait={guardianImg}
            name={guardianName}
            text={`"${reaction}"`}
            accentColor={sceneColor}
            tapHint="continuando..."
          />
        </div>
      )}
    </div>
  );
}
