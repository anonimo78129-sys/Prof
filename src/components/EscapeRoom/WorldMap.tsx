import type { PhaseDef, PhaseProgress, FragmentName } from '../../types/game';
import { HERO_PORTRAIT } from '../../data/journey';

interface Props {
  phases: PhaseDef[];
  progress: Record<string, PhaseProgress>;
  currentIndex: number;
  fragments: FragmentName[];
  coins: number;
  onEnterPhase: (index: number) => void;
}

const FRAG_META: Record<FragmentName, { color: string; label: string }> = {
  esmeralda: { color: '#00ff88', label: 'Esmeralda' },
  ambar: { color: '#ffc800', label: 'Âmbar' },
  safira: { color: '#4488ff', label: 'Safira' },
};

export default function WorldMap({ phases, progress, currentIndex, fragments, coins, onEnterPhase }: Props) {
  return (
    <div className="fixed inset-0 overflow-y-auto no-scrollbar" style={{ background: 'radial-gradient(ellipse at 50% 0%, #141033 0%, #0a0820 55%, #050310 100%)' }}>
      {/* stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="absolute sparkle" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, width: i % 4 ? 1 : 2, height: i % 4 ? 1 : 2, background: '#fff', animationDelay: `${(i % 5) * 0.4}s` }} />
        ))}
      </div>

      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3" style={{ background: 'rgba(8,6,24,0.92)', borderBottom: '2px solid #2a2350' }}>
        <div className="flex gap-2 items-center">
          {(['esmeralda', 'ambar', 'safira'] as FragmentName[]).map(f => {
            const has = fragments.includes(f);
            return (
              <div key={f} title={FRAG_META[f].label} style={{
                width: 16, height: 16, transform: 'rotate(45deg)',
                background: has ? FRAG_META[f].color : '#222',
                boxShadow: has ? `0 0 10px ${FRAG_META[f].color}` : 'none',
                border: '1px solid #000',
              }} />
            );
          })}
        </div>
        <p className="font-pixel" style={{ color: '#fff', fontSize: 9, textShadow: '0 0 12px #7c3aed' }}>A JORNADA</p>
        <div className="flex items-center gap-1">
          <img src="/assets/objects/coin1.png" alt="moedas" style={{ width: 18, imageRendering: 'pixelated' }} />
          <span className="font-pixel" style={{ color: '#ffd700', fontSize: 9 }}>{coins}</span>
        </div>
      </div>

      {/* Path */}
      <div className="relative max-w-md mx-auto px-6 py-8 flex flex-col gap-2">
        {phases.map((phase, i) => {
          const prog = progress[phase.id];
          const done = prog?.completed;
          const isCurrent = i === currentIndex;
          const locked = i > currentIndex;
          const alignRight = i % 2 === 1;

          return (
            <div key={phase.id} className="relative flex flex-col">
              {/* connector */}
              {i > 0 && (
                <div className="self-center" style={{ width: 4, height: 28, background: done || isCurrent ? '#7c3aed' : '#2a2350', boxShadow: done || isCurrent ? '0 0 8px #7c3aed' : 'none' }} />
              )}

              <button
                onClick={() => !locked && onEnterPhase(i)}
                disabled={locked}
                className={`relative flex items-center gap-3 p-3 ${isCurrent ? 'node-pulse' : ''}`}
                style={{
                  alignSelf: alignRight ? 'flex-end' : 'flex-start',
                  width: '88%',
                  flexDirection: alignRight ? 'row-reverse' : 'row',
                  textAlign: alignRight ? 'right' : 'left',
                  background: isCurrent ? 'rgba(124,58,237,0.22)' : done ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `3px solid ${isCurrent ? '#a855f7' : done ? '#00ff88' : locked ? '#222' : '#444'}`,
                  boxShadow: isCurrent ? '4px 4px 0 #1a1a1a, 0 0 18px rgba(168,85,247,0.5)' : '4px 4px 0 #1a1a1a',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.55 : 1,
                }}
              >
                {/* icon disc */}
                <div className="flex-shrink-0 flex items-center justify-center" style={{
                  width: 52, height: 52, fontSize: 26,
                  background: isCurrent ? '#2a1a4a' : '#14102a',
                  border: `2px solid ${isCurrent ? '#a855f7' : done ? '#00ff88' : '#333'}`,
                }}>
                  {locked ? '🔒' : phase.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-pixel truncate" style={{ color: locked ? '#666' : '#fff', fontSize: 8, lineHeight: 1.5 }}>{phase.title}</p>
                  <p className="font-vt" style={{ color: locked ? '#555' : '#b9a9e0', fontSize: 15, lineHeight: 1.1 }}>{phase.subtitle}</p>
                  {done && (
                    <div className="flex gap-1 mt-1" style={{ justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
                      {Array.from({ length: 3 }, (_, s) => (
                        <span key={s} style={{ fontSize: 13, filter: s < (prog?.stars ?? 0) ? 'none' : 'grayscale(1) brightness(0.4)' }}>⭐</span>
                      ))}
                    </div>
                  )}
                  {phase.kind === 'battle' && !done && !locked && (
                    <p className="font-pixel mt-1" style={{ color: '#ff6b6b', fontSize: 6 }}>⚔️ BATALHA</p>
                  )}
                </div>

                {/* hero marker on current */}
                {isCurrent && (
                  <img src={HERO_PORTRAIT} alt="você" className="absolute" style={{
                    width: 34, imageRendering: 'pixelated', top: -20,
                    [alignRight ? 'right' : 'left']: 8,
                    border: '2px solid #fff', outline: '2px solid #000', background: '#111',
                  } as React.CSSProperties} />
                )}
              </button>

              {isCurrent && (
                <button onClick={() => onEnterPhase(i)} className="btn-pixel self-center mt-3 px-8 py-3 node-pulse" style={{ background: '#ffc800', color: '#000', fontSize: 9 }}>
                  ▶ {done ? 'JOGAR DE NOVO' : 'JOGAR'}
                </button>
              )}
            </div>
          );
        })}

        {/* final goal */}
        <div className="self-center mt-2 flex flex-col items-center gap-1">
          <div className="self-center" style={{ width: 4, height: 24, background: '#2a2350' }} />
          <div className="text-4xl" style={{ filter: 'drop-shadow(0 0 14px #7c3aed)' }}>🌀</div>
          <p className="font-vt" style={{ color: '#7c6aad', fontSize: 15 }}>O Portal de Volta</p>
        </div>
      </div>
    </div>
  );
}
