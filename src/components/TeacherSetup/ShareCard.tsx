import { QRCodeSVG } from 'qrcode.react';
import type { GameConfig } from '../../types/game';

interface Props {
  config: GameConfig;
  onPlayNow: () => void;
  onBack: () => void;
}

export default function ShareCard({ config, onPlayNow, onBack }: Props) {
  const baseUrl = window.location.origin + window.location.pathname;
  const playUrl = `${baseUrl}#play/${config.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(playUrl).catch(() => {});
  };

  return (
    <div className="fixed inset-0 bg-[#050518] flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <p className="font-pixel" style={{ color: '#00ff88', fontSize: 10 }}>JOGO CRIADO!</p>
        <p className="font-vt mt-1" style={{ color: '#aaa', fontSize: 20 }}>{config.subject}</p>
      </div>

      {/* QR Code */}
      <div style={{ background: '#ffffff', padding: 16, border: '4px solid #ffc800', boxShadow: '6px 6px 0 #1a1200' }}>
        <QRCodeSVG value={playUrl} size={200} level="M" />
      </div>

      <p className="font-vt mt-3 text-center" style={{ color: '#aaa', fontSize: 16 }}>
        Alunos escaneiam para jogar
      </p>

      {/* Link */}
      <div
        className="mt-4 flex items-center gap-2 px-3 py-2 w-full max-w-sm"
        style={{ background: '#0a0a1a', border: '2px solid #333' }}
      >
        <span className="font-vt text-white flex-1 overflow-hidden" style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {playUrl}
        </span>
        <button
          onClick={copyLink}
          className="btn-pixel px-3 py-1 flex-shrink-0"
          style={{ background: '#ffc800', color: '#000', fontSize: 7 }}
        >
          COPIAR
        </button>
      </div>

      {/* Game code */}
      <div className="mt-3 text-center">
        <p className="font-vt" style={{ color: '#aaa', fontSize: 16 }}>Código do jogo:</p>
        <p className="font-pixel" style={{ color: '#ffc800', fontSize: 18, letterSpacing: 8 }}>{config.id}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6 w-full max-w-sm">
        <button onClick={onBack} className="btn-pixel flex-1 py-3" style={{ background: '#222', color: '#aaa', fontSize: 7 }}>
          ← VOLTAR
        </button>
        <button onClick={onPlayNow} className="btn-pixel flex-1 py-3" style={{ background: '#00ff88', color: '#000', fontSize: 7 }}>
          JOGAR AGORA
        </button>
      </div>

      {/* Credits */}
      <p className="mt-6 font-vt text-center" style={{ color: '#444', fontSize: 12 }}>
        Sprites: Kenney (CC0) · Ansimuz (Public Domain)
      </p>
    </div>
  );
}
