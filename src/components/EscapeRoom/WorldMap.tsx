import type { PhaseDef, PhaseProgress, FragmentName } from '../../types/game';
import AnimatedHero from './mechanics/AnimatedHero';

interface Props {
  phases: PhaseDef[];
  progress: Record<string, PhaseProgress>;
  currentIndex: number;
  fragments: FragmentName[];
  coins: number;
  freePlay?: boolean;
  onEnterPhase: (index: number) => void;
}

const FRAG_META: Record<FragmentName, { color: string; img: string; label: string }> = {
  esmeralda: { color: '#00cc66', img: '/assets/frags/frag-esmeralda.png', label: 'Esmeralda' },
  ambar:     { color: '#ffc800', img: '/assets/frags/frag-ambar.png',     label: 'Âmbar' },
  safira:    { color: '#3399ff', img: '/assets/frags/frag-safira.png',    label: 'Safira' },
};

const KIND_COLOR: Record<string, string> = {
  forest: '#2a8c2a',
  city:   '#c88f20',
  caves:  '#8833cc',
  battle: '#cc3322',
};

const KIND_LABEL: Record<string, string> = {
  forest: 'FLORESTA',
  city:   'CIDADE',
  caves:  'CAVERNAS',
  battle: 'BATALHA',
};

export default function WorldMap({ phases, progress, currentIndex, fragments, coins, freePlay = false, onEnterPhase }: Props) {
  return (
    <div
      className="fixed inset-0 overflow-y-auto no-scrollbar"
      style={{
        background: 'linear-gradient(to bottom, #87ceeb 0%, #b8e4f9 18%, #d4f0a0 40%, #8ab84a 60%, #c8a864 80%, #a08040 100%)',
      }}
    >
      {/* ── HEADER BAR (wood style) ── */}
      <div className="sticky top-0 z-20 bar-wood flex items-center justify-between px-4 py-3">
        {/* Fragment collection */}
        <div className="flex gap-2 items-center">
          {(['esmeralda', 'ambar', 'safira'] as FragmentName[]).map(f => {
            const has = fragments.includes(f);
            const m = FRAG_META[f];
            return (
              <div key={f} title={m.label}
                style={{ width: 22, height: 22, opacity: has ? 1 : 0.3, filter: has ? `drop-shadow(0 0 6px ${m.color})` : 'grayscale(1)' }}>
                <img src={m.img} alt={m.label} style={{ width: '100%', imageRendering: 'pixelated' }} />
              </div>
            );
          })}
        </div>

        <p className="font-pixel" style={{ color: '#f7ead5', fontSize: 9, textShadow: '1px 2px 0 #1a0c04' }}>MAPA DO ÉTER</p>

        <div className="flex items-center gap-1">
          <img src="/assets/objects/coin1.png" alt="moedas" style={{ width: 20, imageRendering: 'pixelated' }} />
          <span className="font-pixel" style={{ color: '#ffd700', fontSize: 9, textShadow: '1px 2px 0 #000' }}>{coins}</span>
        </div>
      </div>

      {/* ── TEST MODE BANNER ── */}
      {freePlay && (
        <div className="max-w-md mx-auto px-5 pt-4">
          <div className="panel-parchment px-4 py-2 text-center" style={{ background: 'linear-gradient(160deg,#fff4d0,#f0d890)' }}>
            <p className="font-pixel" style={{ color: '#8b5e00', fontSize: 7 }}>🔓 MODO TESTE — TUDO LIBERADO</p>
            <p className="font-vt" style={{ color: '#7a4f2d', fontSize: 14 }}>Toque em qualquer fase para experimentar</p>
          </div>
        </div>
      )}

      {/* ── MAP PATH ── */}
      <div className="relative max-w-md mx-auto px-5 py-6 flex flex-col gap-0">
        {phases.map((phase, i) => {
          const prog     = progress[phase.id];
          const done     = prog?.completed ?? false;
          const isCurrent = i === currentIndex;
          const locked   = freePlay ? false : i > currentIndex;
          const alignRight = i % 2 === 1;
          const kindColor  = KIND_COLOR[phase.kind] ?? '#888';

          return (
            <div key={phase.id} className="relative flex flex-col">
              {/* ── connector path segment ── */}
              {i > 0 && (
                <div
                  className="self-center"
                  style={{
                    width: 8,
                    height: 28,
                    background: done || isCurrent || freePlay
                      ? 'linear-gradient(to bottom, #c88f20, #9a6a10)'
                      : 'linear-gradient(to bottom, #b09060, #907040)',
                    border: '2px solid rgba(0,0,0,0.25)',
                    boxShadow: done || isCurrent || freePlay ? '0 0 8px rgba(200,143,32,0.5)' : 'none',
                  }}
                />
              )}

              {/* ── phase card ── */}
              <button
                onClick={() => !locked && onEnterPhase(i)}
                disabled={locked}
                className={`relative flex items-center gap-3 p-3 ${isCurrent ? 'node-pulse' : ''}`}
                style={{
                  alignSelf: alignRight ? 'flex-end' : 'flex-start',
                  width: '88%',
                  flexDirection: alignRight ? 'row-reverse' : 'row',
                  textAlign: alignRight ? 'right' : 'left',
                  background: done
                    ? 'linear-gradient(135deg, #d4f0a0 0%, #b8d878 100%)'
                    : isCurrent
                    ? 'linear-gradient(135deg, #f7ead5 0%, #e8d4a8 100%)'
                    : locked
                    ? 'linear-gradient(135deg, #c8b890 0%, #b09870 100%)'
                    : 'linear-gradient(135deg, #f0e0c0 0%, #ddc898 100%)',
                  border: `3px solid ${isCurrent ? kindColor : done ? '#4a7a1a' : locked ? '#907050' : '#7a5828'}`,
                  boxShadow: isCurrent
                    ? `5px 5px 0 #3a2010, 0 0 0 2px ${kindColor}`
                    : '5px 5px 0 #3a2010',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.7 : 1,
                }}
              >
                {/* icon disc */}
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: 52, height: 52,
                    fontSize: locked ? 22 : 26,
                    background: locked ? '#b09870' : done ? '#a8d060' : '#f0e4c8',
                    border: `3px solid ${locked ? '#907050' : done ? '#4a7a1a' : kindColor}`,
                    boxShadow: `inset 0 -2px 0 rgba(0,0,0,0.2)`,
                  }}
                >
                  {locked ? '🔒' : phase.icon}
                </div>

                {/* text */}
                <div className="flex-1 min-w-0">
                  <p className="font-pixel" style={{ color: locked ? '#6a5030' : '#2a1400', fontSize: 7, lineHeight: 1.6 }}>
                    {phase.title}
                  </p>
                  <p className="font-vt" style={{ color: locked ? '#8a6840' : '#5a3a10', fontSize: 16, lineHeight: 1.1 }}>
                    {phase.subtitle}
                  </p>
                  <p className="font-pixel mt-1" style={{ color: kindColor, fontSize: 5 }}>
                    {KIND_LABEL[phase.kind] ?? phase.kind.toUpperCase()}
                  </p>
                  {done && (
                    <div className="flex gap-1 mt-1" style={{ justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
                      {Array.from({ length: 3 }, (_, s) => (
                        <span key={s} style={{ fontSize: 14, filter: s < (prog?.stars ?? 0) ? 'none' : 'grayscale(1) brightness(0.6)' }}>⭐</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* hero marker at current node */}
                {isCurrent && (
                  <div
                    className="absolute"
                    style={{
                      top: -48,
                      [alignRight ? 'right' : 'left']: 4,
                    }}
                  >
                    <AnimatedHero scale={1.4} />
                    {/* speech bubble */}
                    <div
                      className="absolute"
                      style={{
                        bottom: '100%',
                        [alignRight ? 'right' : 'left']: 0,
                        background: '#fff',
                        border: '2px solid #333',
                        padding: '2px 6px',
                        whiteSpace: 'nowrap',
                        marginBottom: 2,
                      }}
                    >
                      <span className="font-pixel" style={{ fontSize: 5, color: '#333' }}>Aqui!</span>
                    </div>
                  </div>
                )}
              </button>

              {/* enter button below current node */}
              {isCurrent && (
                <button
                  onClick={() => onEnterPhase(i)}
                  className="btn-rpg self-center mt-3 px-8 py-3 font-pixel"
                  style={{ fontSize: 8 }}
                >
                  ▶ {done ? 'JOGAR DE NOVO' : 'ENTRAR'}
                </button>
              )}
            </div>
          );
        })}

        {/* ── Portal goal ── */}
        <div className="self-center mt-2 flex flex-col items-center gap-1">
          <div style={{ width: 8, height: 24, background: 'linear-gradient(to bottom, #c88f20, #9a6a10)', border: '2px solid rgba(0,0,0,0.25)', margin: '0 auto' }} />
          <div className="panel-parchment px-5 py-3 flex flex-col items-center gap-1">
            <div className="text-4xl" style={{ filter: 'drop-shadow(0 0 14px #c88f20)' }}>🌀</div>
            <p className="font-pixel" style={{ color: '#7a4f2d', fontSize: 6 }}>O PORTAL DE VOLTA</p>
            <p className="font-vt" style={{ color: '#5a3a10', fontSize: 15 }}>Complete todas as fases para escapar</p>
          </div>
        </div>

        {/* bottom spacing */}
        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
