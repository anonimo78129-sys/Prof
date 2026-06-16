import { useMemo, useState } from 'react';
import type { MatchPair, NarrativeChoice, KarmaChoice } from '../../types/game';
import NarrativeChoiceModal from './mechanics/NarrativeChoice';

interface Props {
  bgImg?: string;
  cogImg?: string;
  pairs: MatchPair[];
  narrative: NarrativeChoice;
  onCorrect: () => void;
  onWrong: () => void;
  onComplete: (karma: KarmaChoice) => void;
}

export default function CityScene({ bgImg, cogImg, pairs, narrative, onCorrect, onWrong, onComplete }: Props) {
  const [connected, setConnected] = useState<boolean[]>(Array(pairs.length).fill(false));
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  const allConnected = connected.every(Boolean);

  // Shuffle definitions once (stable via useMemo)
  const shuffled = useMemo(() =>
    [...pairs.map((p, i) => ({ def: p.definition, origIdx: i }))]
      .sort(() => Math.random() - 0.5),
    [] // intentionally stable
  );

  const handleConceptTap = (idx: number) => {
    if (connected[idx] || allConnected) return;
    setSelected(selected === idx ? null : idx);
  };

  const handleDefTap = (origIdx: number) => {
    if (selected === null || connected[origIdx]) return;

    if (selected === origIdx) {
      // Correct match
      const next = [...connected];
      next[origIdx] = true;
      setConnected(next);
      setSelected(null);
      onCorrect();

      if (next.every(Boolean)) {
        setTimeout(() => setShowNarrative(true), 500);
      }
    } else {
      // Wrong match
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
      setSelected(null);
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
          : 'linear-gradient(180deg, #0a1628 0%, #1a2a50 40%, #0d1830 100%)',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.4)' }} />

      {/* Scene label */}
      <div className="absolute top-20 left-0 right-0 text-center pointer-events-none">
        <p className="font-pixel" style={{ color: '#ffc800', fontSize: 8, textShadow: '2px 2px #000' }}>
          CONECTE OS FIOS
        </p>
        <p className="font-vt mt-1" style={{ color: '#aaa', fontSize: 16 }}>
          Conceito ← → Definição
        </p>
      </div>

      {/* Wire connect */}
      {!allConnected && (
        <div className={`absolute inset-x-3 flex gap-2 ${wrongFlash ? 'shake' : ''}`} style={{ top: 110, bottom: 160 }}>
          {/* Left: concepts */}
          <div className="flex-1 flex flex-col gap-2 justify-center">
            {pairs.map((pair, idx) => {
              const isConn = connected[idx];
              const isSel = selected === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleConceptTap(idx)}
                  className="p-2 text-left transition-all"
                  style={{
                    background: isConn ? '#001a00' : isSel ? '#001a33' : '#0a0a1a',
                    border: `2px solid ${isConn ? '#00ff88' : isSel ? '#00aaff' : '#334'}`,
                    cursor: isConn ? 'default' : 'pointer',
                    opacity: isConn ? 0.7 : 1,
                  }}
                >
                  <span className="font-vt text-white" style={{ fontSize: 17, lineHeight: 1.2 }}>
                    {isConn ? '✓ ' : ''}{pair.concept}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Middle: wire indicators */}
          <div className="w-6 flex flex-col justify-center items-center gap-2">
            {pairs.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 3,
                  flex: 1,
                  maxHeight: 36,
                  background: connected[idx] ? '#ffc800' : '#2a2a3a',
                  boxShadow: connected[idx] ? '0 0 6px #ffc800' : 'none',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>

          {/* Right: definitions (shuffled) */}
          <div className="flex-1 flex flex-col gap-2 justify-center">
            {shuffled.map(({ def, origIdx }) => {
              const isConn = connected[origIdx];
              const canSelect = selected !== null && !isConn;
              return (
                <button
                  key={origIdx}
                  onClick={() => handleDefTap(origIdx)}
                  className="p-2 text-left transition-all"
                  style={{
                    background: isConn ? '#001a00' : '#0a0a1a',
                    border: `2px solid ${isConn ? '#00ff88' : canSelect ? '#ffc800' : '#334'}`,
                    cursor: isConn || selected === null ? 'default' : 'pointer',
                    opacity: isConn ? 0.7 : 1,
                  }}
                >
                  <span className="font-vt text-white" style={{ fontSize: 17, lineHeight: 1.2 }}>
                    {isConn ? '✓ ' : ''}{def}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Guardian */}
      {!allConnected && (
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="dialog-rpg p-3 max-w-md mx-auto flex items-start gap-3" style={{ borderColor: '#ffc800' }}>
            {cogImg ? (
              <img src={cogImg} alt="Prof. Cog" className="w-12 h-12 object-contain flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-2xl" style={{ border: '2px solid #ffc800' }}>🤖</div>
            )}
            <div>
              <p className="font-pixel mb-1" style={{ color: '#ffc800', fontSize: 7 }}>PROF. COG</p>
              <p className="font-vt text-white" style={{ fontSize: 17 }}>
                {selected !== null
                  ? 'Agora toque na definição correspondente!'
                  : `${connected.filter(Boolean).length}/${pairs.length} fios reconectados. Continue!`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Narrative */}
      {showNarrative && (
        <NarrativeChoiceModal
          choice={narrative}
          guardianImg={cogImg}
          guardianName="PROF. COG"
          onChoose={handleNarrative}
          sceneColor="#ffc800"
        />
      )}
    </div>
  );
}
