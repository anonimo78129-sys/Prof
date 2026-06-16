import { useState } from 'react';

interface Props {
  lines: string[];
  irisImg?: string;
  onComplete: () => void;
}

export default function TransitionScene({ lines, irisImg, onComplete }: Props) {
  const [lineIdx, setLineIdx] = useState(0);

  const advance = () => {
    if (lineIdx < lines.length - 1) {
      setLineIdx(i => i + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center scene-fade-in"
      style={{ background: 'radial-gradient(ellipse at center, #0a001a 0%, #000000 100%)' }}
      onClick={advance}
    >
      {/* Traveling stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() > 0.7 ? 2 : 1,
              height: Math.random() > 0.7 ? 2 : 1,
              opacity: 0.4 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>

      {/* Iris */}
      <div className="mb-6">
        {irisImg ? (
          <img src={irisImg} alt="Íris" className="w-16 h-16 fragment-float" style={{ imageRendering: 'pixelated' }} />
        ) : (
          <div
            className="w-14 h-14 rounded-full iris-glow fragment-float mx-auto"
            style={{ background: 'radial-gradient(circle, #ffffff 20%, #00d4aa 60%, transparent 100%)' }}
          />
        )}
      </div>

      {/* Dialog */}
      <div className="w-full max-w-sm px-4">
        <div className="dialog-rpg p-4" style={{ borderColor: '#00d4aa' }}>
          <div className="flex items-center gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid #336' }}>
            <span className="font-pixel text-teal-300" style={{ fontSize: 7 }}>✦ ÍRIS</span>
          </div>
          <p className="font-vt text-white" style={{ fontSize: 20, lineHeight: 1.4, minHeight: 60 }}>
            {lines[lineIdx]}
          </p>
          <div className="text-right mt-2">
            <span className="font-vt text-gray-400" style={{ fontSize: 14 }}>
              {lineIdx < lines.length - 1 ? '[ continuar ]' : '[ avançar ]'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-4">
        {lines.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              background: i <= lineIdx ? '#00d4aa' : '#333',
              border: '1px solid #555',
            }}
          />
        ))}
      </div>
    </div>
  );
}
