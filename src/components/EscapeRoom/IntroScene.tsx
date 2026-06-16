import { useState } from 'react';
import { INTRO_LINES, IRIS_INTRO } from '../../data/narrative';
import DialogBox from './ui/DialogBox';

interface Props {
  bgImg?: string;
  irisImg?: string;
  lines?: string[];
  onComplete: () => void;
}

export default function IntroScene({ bgImg, irisImg, lines, onComplete }: Props) {
  const portalLines = lines && lines.length ? lines.slice(0, 2) : INTRO_LINES;
  const irisLines   = lines && lines.length ? lines.slice(2)   : IRIS_INTRO;
  const allLines    = [...portalLines, ...irisLines];
  const [lineIdx, setLineIdx] = useState(0);
  const phase = lineIdx < portalLines.length ? 'portal' : 'iris';
  const currentLine = allLines[lineIdx];

  const advance = () => {
    if (lineIdx < allLines.length - 1) {
      setLineIdx(i => i + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col scene-fade-in"
      style={{
        background: bgImg
          ? `url(${bgImg}) center/cover no-repeat`
          : 'radial-gradient(ellipse at center, #1a004d 0%, #0a0014 70%, #000000 100%)',
      }}
      onClick={advance}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />

      {/* Stars (CSS only) */}
      {!bgImg && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white sparkle"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 60}%`,
                animationDelay: `${(i % 5) * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Portal visual */}
      {!bgImg && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '35%' }}>
          <div className="relative">
            <div className="portal-spin" style={{ width: 180, height: 180, borderRadius: '50%', border: '4px solid #7c3aed', boxShadow: '0 0 40px #7c3aed, inset 0 0 40px #7c3aed' }} />
            <div className="absolute inset-4 portal-spin" style={{ animationDirection: 'reverse', animationDuration: '5s', borderRadius: '50%', border: '3px solid #a855f7' }} />
            <div className="absolute inset-8" style={{ borderRadius: '50%', background: 'radial-gradient(circle, #c084fc 0%, #7c3aed 50%, transparent 100%)' }} />
          </div>
        </div>
      )}

      {/* Iris portrait (floating in scene during iris phase) */}
      {phase === 'iris' && (
        <div className="absolute left-1/2 -translate-x-1/2 fragment-float" style={{ bottom: 165 }}>
          {irisImg ? (
            <img src={irisImg} alt="Íris" style={{ width: 72, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 12px #00d4aa)' }} />
          ) : (
            <div className="iris-glow" style={{ width: 52, height: 52, borderRadius: '50%', background: 'radial-gradient(circle, #fff 20%, #00d4aa 60%, transparent 100%)' }} />
          )}
        </div>
      )}

      {/* Dialog box (bottom) */}
      <div className="absolute bottom-0 left-0 right-0">
        <DialogBox
          portrait={phase === 'iris' ? (irisImg ?? undefined) : undefined}
          name={phase === 'iris' ? 'ÍRIS' : '— ÉTER —'}
          text={currentLine}
          accentColor={phase === 'iris' ? '#00a88a' : '#7c3aed'}
          tapHint={lineIdx < allLines.length - 1 ? 'toque' : 'começar'}
        />
      </div>
    </div>
  );
}
