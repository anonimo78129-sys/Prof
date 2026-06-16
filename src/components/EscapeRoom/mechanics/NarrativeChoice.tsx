import { useState } from 'react';
import type { NarrativeChoice as NarrativeChoiceType, KarmaChoice } from '../../../types/game';

interface Props {
  choice: NarrativeChoiceType;
  guardianImg?: string;
  guardianName: string;
  onChoose: (karma: KarmaChoice, reaction: string) => void;
  sceneColor?: string;
}

export default function NarrativeChoice({ choice, guardianImg, guardianName, onChoose, sceneColor = '#4338ca' }: Props) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [showReaction, setShowReaction] = useState(false);
  const [reaction, setReaction] = useState('');

  const handleChoose = (idx: 0 | 1) => {
    if (chosen !== null) return;
    const opt = choice.options[idx];
    setChosen(idx);
    setReaction(opt.reaction);
    setShowReaction(true);
    setTimeout(() => {
      onChoose(opt.karma, opt.reaction);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-md slide-up">
        <div className="dialog-rpg mx-3 mb-3 p-4" style={{ borderColor: sceneColor }}>

          {/* Guardian header */}
          <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: `2px solid ${sceneColor}` }}>
            {guardianImg ? (
              <img src={guardianImg} alt={guardianName} className="w-12 h-12 object-contain" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: sceneColor, border: '2px solid #1a1a1a' }}>
                <span style={{ fontSize: 24 }}>👤</span>
              </div>
            )}
            <span className="font-pixel text-white" style={{ fontSize: 8 }}>{guardianName}</span>
          </div>

          {!showReaction ? (
            <>
              {/* Prompt */}
              <p className="font-vt text-white mb-4" style={{ fontSize: 20, lineHeight: 1.3 }}>
                {choice.prompt}
              </p>

              {/* Choices */}
              <div className="flex flex-col gap-3">
                {choice.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChoose(idx as 0 | 1)}
                    className="btn-pixel px-4 py-3 text-left w-full"
                    style={{
                      background: idx === 0 ? '#001a33' : '#1a0033',
                      borderColor: idx === 0 ? '#00aaff' : '#aa44ff',
                      color: idx === 0 ? '#00aaff' : '#aa44ff',
                    }}
                  >
                    <span className="font-vt" style={{ fontSize: 18 }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Reaction */
            <div className="text-center py-2">
              <p className="font-vt text-white mb-2" style={{ fontSize: 22 }}>
                "{reaction}"
              </p>
              <p className="font-vt" style={{ color: sceneColor, fontSize: 16 }}>
                Continuando...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
