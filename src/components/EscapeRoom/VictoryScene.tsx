import { useEffect, useState } from 'react';
import type { GameScore, KarmaState } from '../../types/game';
import { VICTORY_TEXTS } from '../../data/narrative';
import AnimatedHero from './mechanics/AnimatedHero';

interface Props {
  score: GameScore;
  karma: KarmaState;
  coins?: number;
  onPlayAgain: () => void;
}

export default function VictoryScene({ score, karma, coins = 0, onPlayAgain }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);
  const ending = karma.ending ?? 'explorador';
  const { title, text, color } = VICTORY_TEXTS[ending] ?? VICTORY_TEXTS.explorador;

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 300);
    return () => clearTimeout(t);
  }, []);

  const pct = score.total > 0 ? Math.round((score.firstTry / score.total) * 100) : 0;
  const min = Math.floor(score.timeSeconds / 60);
  const sec = score.timeSeconds % 60;

  const confetti = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    color: ['#ffd700', '#ff4444', '#00cc66', '#4488ff', '#cc44ff', '#ff8800'][i % 6],
    size: 5 + Math.round(Math.random() * 8),
  }));

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center scene-fade-in overflow-y-auto no-scrollbar"
      style={{ background: 'linear-gradient(to bottom, #87ceeb 0%, #b8e4f9 35%, #a8d46b 70%, #4a8a1a 100%)' }}
    >
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {confetti.map(p => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.left}%`, top: -20,
                width: p.size, height: p.size,
                background: p.color,
                animation: `fall ${p.duration}s ${p.delay}s ease-in forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-8 text-center w-full max-w-sm">

        {/* Hero celebration */}
        <div className="relative">
          <AnimatedHero scale={3} />
          <div
            className="absolute left-1/2 iris-glow"
            style={{ bottom: '110%', transform: 'translateX(-50%)', width: 20, height: 20, borderRadius: '50%', background: 'radial-gradient(circle, #80ffdd, #00d4aa)' }}
          />
        </div>

        {/* Title banner */}
        <div className="panel-parchment px-6 py-3 w-full" style={{ background: 'linear-gradient(160deg,#fffbe8,#f0d890)' }}>
          <p className="font-pixel" style={{ color: '#3a1a00', fontSize: 10, lineHeight: 1.8 }}>
            {title}
          </p>
        </div>

        {/* Ending text */}
        <div className="dialog-rpg px-5 py-4 max-w-xs" style={{ borderColor: color }}>
          <p className="font-vt text-white" style={{ fontSize: 20, lineHeight: 1.4 }}>
            "{text}"
          </p>
          <p className="font-vt mt-2" style={{ color: '#aaa', fontSize: 15 }}>— Íris</p>
        </div>

        {/* Score card */}
        <div className="panel-parchment px-5 py-4 w-full">
          <p className="font-pixel mb-3 text-center" style={{ color: '#7a4f2d', fontSize: 7 }}>RESULTADO</p>

          {[
            ['1ª tentativa', `${pct}%`],
            ['Respostas', `${score.firstTry}/${score.total}`],
            ['Tempo', `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center mb-2">
              <span className="font-vt" style={{ color: '#5a3a10', fontSize: 19 }}>{label}</span>
              <span className="font-pixel" style={{ color: '#2a1400', fontSize: 9 }}>{value}</span>
            </div>
          ))}

          <div className="flex justify-between items-center">
            <span className="font-vt" style={{ color: '#5a3a10', fontSize: 19 }}>Moedas</span>
            <span className="font-pixel flex items-center gap-1" style={{ color: '#c88f20', fontSize: 9 }}>
              <img src="/assets/objects/coin1.png" alt="" style={{ width: 16, imageRendering: 'pixelated' }} /> {coins}
            </span>
          </div>
        </div>

        {/* Fragment recap */}
        <div className="flex gap-3 justify-center">
          {(['esmeralda','ambar','safira'] as const).map(f => (
            <div key={f} className="flex flex-col items-center gap-1">
              <img src={`/assets/frags/frag-${f}.png`} alt={f} style={{ width: 32, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 8px gold)' }} />
            </div>
          ))}
        </div>

        {/* Play again */}
        <button
          onClick={onPlayAgain}
          className="btn-rpg px-8 py-4 font-pixel w-full"
          style={{ fontSize: 9 }}
        >
          ↺ JOGAR DE NOVO
        </button>
      </div>

      <style>{`
        @keyframes fall {
          from { transform: translateY(0) rotate(0deg); opacity: 1; }
          to   { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
