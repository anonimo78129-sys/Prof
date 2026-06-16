import { useState } from 'react';
import { INTRO_LINES, IRIS_INTRO } from '../../data/narrative';

interface Props {
  bgImg?: string;
  irisImg?: string;
  lines?: string[];
  onComplete: () => void;
}

export default function IntroScene({ bgImg, irisImg, lines, onComplete }: Props) {
  // Quando a IA gera a história, mostramos o portal nas 2 primeiras falas e Íris nas demais.
  const portalLines = lines && lines.length ? lines.slice(0, 2) : INTRO_LINES;
  const irisLines = lines && lines.length ? lines.slice(2) : IRIS_INTRO;
  const allLines = [...portalLines, ...irisLines];
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
        background: bgImg ? `url(${bgImg}) center/cover no-repeat` : 'radial-gradient(ellipse at center, #1a004d 0%, #0a0014 70%, #000000 100%)',
      }}
      onClick={advance}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />

      {/* Stars (CSS only) */}
      {!bgImg && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Portal visual (if no bg image) */}
      {!bgImg && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-10%' }}>
          <div className="relative">
            <div
              className="portal-spin"
              style={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                border: '4px solid #7c3aed',
                boxShadow: '0 0 40px #7c3aed, inset 0 0 40px #7c3aed',
              }}
            />
            <div
              className="absolute inset-4 portal-spin"
              style={{
                animationDirection: 'reverse',
                animationDuration: '5s',
                borderRadius: '50%',
                border: '3px solid #a855f7',
                boxShadow: '0 0 20px #a855f7',
              }}
            />
            <div
              className="absolute inset-8"
              style={{
                borderRadius: '50%',
                background: 'radial-gradient(circle, #c084fc 0%, #7c3aed 50%, transparent 100%)',
              }}
            />
          </div>
        </div>
      )}

      {/* Iris portrait (phase 2) */}
      {phase === 'iris' && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2">
          {irisImg ? (
            <img src={irisImg} alt="Íris" className="w-20 h-20 fragment-float" style={{ imageRendering: 'pixelated' }} />
          ) : (
            <div
              className="w-16 h-16 rounded-full iris-glow fragment-float"
              style={{ background: 'radial-gradient(circle, #ffffff 20%, #00d4aa 60%, transparent 100%)' }}
            />
          )}
        </div>
      )}

      {/* Dialog box */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="dialog-rpg p-4 max-w-md mx-auto" style={{ borderColor: '#a855f7' }}>
          <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid #555' }}>
            <span className="font-pixel text-purple-300" style={{ fontSize: 7 }}>
              {phase === 'iris' ? '✦ ÍRIS' : '...'}
            </span>
          </div>
          <p className="font-vt text-white" style={{ fontSize: 20, lineHeight: 1.4, minHeight: 56 }}>
            {currentLine}
          </p>
          <div className="text-right mt-2">
            <span className="font-vt text-gray-400" style={{ fontSize: 14 }}>
              {lineIdx < allLines.length - 1 ? '[ toque para continuar ]' : '[ começar ]'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
