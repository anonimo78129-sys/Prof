import { useEffect, useState } from 'react';
import type { GameScore, KarmaState } from '../../types/game';
import { VICTORY_TEXTS } from '../../data/narrative';

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

  // Generate confetti particles
  const confetti = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    color: ['#ffd700', '#ff4444', '#00ff88', '#4488ff', '#cc44ff', '#ff8800'][i % 6],
    size: 4 + Math.round(Math.random() * 8),
  }));

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center scene-fade-in"
      style={{ background: 'radial-gradient(ellipse at center, #0a0820 0%, #000000 100%)' }}>

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map(p => (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.left}%`,
                top: -20,
                width: p.size,
                height: p.size,
                background: p.color,
                animation: `fall ${p.duration}s ${p.delay}s ease-in forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} className="absolute sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 3, height: 3,
              background: color,
              animationDelay: `${Math.random() * 2}s`,
            }} />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
        {/* Portal emoji */}
        <div className="text-6xl" style={{ filter: `drop-shadow(0 0 20px ${color})` }}>🌀</div>

        {/* Title */}
        <div>
          <p className="font-pixel" style={{ color, fontSize: 11, lineHeight: 1.8, textShadow: `0 0 20px ${color}` }}>
            {title}
          </p>
        </div>

        {/* Ending text */}
        <div className="dialog-rpg px-5 py-4 max-w-xs" style={{ borderColor: color }}>
          <p className="font-vt text-white" style={{ fontSize: 19, lineHeight: 1.4 }}>
            "{text}"
          </p>
          <p className="font-vt mt-2" style={{ color: '#aaa', fontSize: 14 }}>— Íris</p>
        </div>

        {/* Score card */}
        <div className="panel-pixel px-5 py-4 w-full max-w-xs" style={{ background: '#0a0820', borderColor: '#333' }}>
          <p className="font-pixel mb-3" style={{ color: '#aaa', fontSize: 7 }}>RESULTADO</p>
          <div className="flex justify-between items-center mb-2">
            <span className="font-vt text-white" style={{ fontSize: 18 }}>Acertos na 1ª tentativa</span>
            <span className="font-pixel" style={{ color, fontSize: 9 }}>{pct}%</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-vt text-white" style={{ fontSize: 18 }}>Perguntas respondidas</span>
            <span className="font-pixel" style={{ color: '#fff', fontSize: 9 }}>{score.firstTry}/{score.total}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-vt text-white" style={{ fontSize: 18 }}>Tempo total</span>
            <span className="font-pixel" style={{ color: '#aaa', fontSize: 9 }}>
              {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-vt text-white" style={{ fontSize: 18 }}>Moedas do Éter</span>
            <span className="font-pixel flex items-center gap-1" style={{ color: '#ffd700', fontSize: 9 }}>
              <img src="/assets/objects/coin1.png" alt="" style={{ width: 14, imageRendering: 'pixelated' }} /> {coins}
            </span>
          </div>
        </div>

        {/* Play again */}
        <button
          onClick={onPlayAgain}
          className="btn-pixel px-6 py-3"
          style={{ background: color, color: '#000', fontSize: 9 }}
        >
          JOGAR DE NOVO
        </button>
      </div>

      <style>{`
        @keyframes fall {
          from { transform: translateY(0) rotate(0deg); opacity: 1; }
          to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
