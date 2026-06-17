import type { HeroDir } from '../../../hooks/useHeroMovement';

interface Props {
  onStart: (dir: HeroDir) => void;
  onStop: () => void;
  onAction: () => void;
}

const BTN: React.CSSProperties = {
  width: 48,
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(10,10,20,0.65)',
  border: '2px solid rgba(255,255,255,0.18)',
  borderRadius: 6,
  cursor: 'pointer',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'none',
  color: '#f7ead5',
  fontSize: 20,
  boxShadow: '0 3px 0 rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
  fontFamily: 'monospace',
};

function Arrow({ dir, label, onStart, onStop }: { dir: HeroDir; label: string; onStart: (d: HeroDir) => void; onStop: () => void }) {
  return (
    <div
      role="button"
      aria-label={dir}
      style={BTN}
      onPointerDown={e => { e.preventDefault(); onStart(dir); }}
      onPointerUp={e => { e.preventDefault(); onStop(); }}
      onPointerLeave={e => { e.preventDefault(); onStop(); }}
    >
      {label}
    </div>
  );
}

export default function DPad({ onStart, onStop, onAction }: Props) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 16px', pointerEvents: 'none' }}>
      {/* Left/Right arrows */}
      <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        <Arrow dir="left"  label="◀" onStart={onStart} onStop={onStop} />
        <Arrow dir="right" label="▶" onStart={onStart} onStop={onStop} />
      </div>

      {/* Action button */}
      <div
        role="button"
        aria-label="Entrar"
        style={{
          ...BTN,
          width: 56,
          height: 56,
          background: 'rgba(40,140,60,0.75)',
          border: '2px solid rgba(100,230,120,0.35)',
          fontSize: 9,
          fontFamily: "'Press Start 2P', monospace",
          color: '#fff',
          pointerEvents: 'auto',
        }}
        onPointerDown={e => { e.preventDefault(); onAction(); }}
      >
        OK
      </div>
    </div>
  );
}
