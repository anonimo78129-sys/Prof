import { useEffect, useState } from 'react';
import type { GameConfig } from './types/game';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import GameShell from './components/EscapeRoom/GameShell';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import ShareCard from './components/TeacherSetup/ShareCard';

type View = 'home' | 'setup' | 'share' | 'play' | 'loading' | 'error';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle hash routing
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#play/')) {
        const gameId = hash.slice(6);
        if (gameId) {
          setView('loading');
          try {
            const snap = await getDoc(doc(db, 'games', gameId));
            if (snap.exists()) {
              setGameConfig(snap.data() as GameConfig);
              setView('play');
            } else {
              setErrorMsg('Jogo não encontrado. Verifique o link.');
              setView('error');
            }
          } catch {
            setErrorMsg('Erro ao carregar o jogo. Verifique sua conexão.');
            setView('error');
          }
        }
      } else if (hash === '#setup') {
        setView('setup');
      } else {
        setView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (view === 'loading') {
    return (
      <div className="fixed inset-0 bg-[#050518] flex flex-col items-center justify-center gap-4">
        <div className="portal-spin" style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid #a855f7', boxShadow: '0 0 20px #a855f7' }} />
        <p className="font-pixel text-white" style={{ fontSize: 8 }}>CARREGANDO...</p>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div className="fixed inset-0 bg-[#050518] flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-pixel text-center" style={{ color: '#ff4444', fontSize: 9, lineHeight: 2 }}>ERRO</p>
        <p className="font-vt text-center text-white" style={{ fontSize: 20 }}>{errorMsg}</p>
        <button onClick={() => { window.location.hash = ''; }} className="btn-pixel px-6 py-3" style={{ background: '#ffc800', color: '#000', fontSize: 8 }}>
          INÍCIO
        </button>
      </div>
    );
  }

  if (view === 'play' && gameConfig) {
    return <GameShell config={gameConfig} onExit={() => { window.location.hash = ''; }} />;
  }

  if (view === 'setup') {
    return (
      <SetupWizard
        onGameCreated={(config) => {
          setGameConfig(config);
          setView('share');
        }}
      />
    );
  }

  if (view === 'share' && gameConfig) {
    return (
      <ShareCard
        config={gameConfig}
        onPlayNow={() => setView('play')}
        onBack={() => setView('setup')}
      />
    );
  }

  // Home
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#050518]">
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className="absolute sparkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() > 0.7 ? 3 : 1,
              height: Math.random() > 0.7 ? 3 : 1,
              background: '#ffffff',
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Portal decoration */}
      <div className="mb-8 relative">
        <div
          className="portal-spin mx-auto"
          style={{ width: 100, height: 100, borderRadius: '50%', border: '3px solid #7c3aed', boxShadow: '0 0 30px #7c3aed, inset 0 0 30px rgba(124,58,237,0.3)' }}
        />
        <div
          className="absolute inset-3 portal-spin"
          style={{ animationDirection: 'reverse', animationDuration: '5s', borderRadius: '50%', border: '2px solid #a855f7', boxShadow: '0 0 15px #a855f7' }}
        />
      </div>

      {/* Title */}
      <h1 className="font-pixel text-center mb-2" style={{ color: '#ffffff', fontSize: 16, lineHeight: 2, textShadow: '0 0 20px #7c3aed' }}>
        ÉTER
      </h1>
      <p className="font-vt text-center mb-8" style={{ color: '#9f7aea', fontSize: 22 }}>
        O Escape Room do Conhecimento
      </p>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs px-6">
        <button
          onClick={() => { window.location.hash = '#setup'; }}
          className="btn-pixel py-4 w-full"
          style={{ background: '#7c3aed', color: '#fff', fontSize: 8 }}
        >
          🎓 SOU PROFESSOR
        </button>

        <div style={{ border: '1px solid #333' }} />

        <div className="flex gap-2">
          <input
            placeholder="Código do jogo..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim().toUpperCase();
                if (val) window.location.hash = `#play/${val}`;
              }
            }}
            style={{ flex: 1, background: '#0a0a1a', border: '2px solid #333', color: '#fff', padding: '12px 14px', fontSize: 16, fontFamily: 'sans-serif' }}
          />
          <button
            className="btn-pixel px-4"
            style={{ background: '#00ff88', color: '#000', fontSize: 8 }}
            onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              const val = input?.value.trim().toUpperCase();
              if (val) window.location.hash = `#play/${val}`;
            }}
          >
            JOGAR
          </button>
        </div>

        <p className="font-vt text-center" style={{ color: '#555', fontSize: 16 }}>
          Digite o código para entrar no jogo
        </p>
      </div>

      {/* Credits */}
      <p className="absolute bottom-4 font-vt" style={{ color: '#333', fontSize: 12 }}>
        Sprites: Kenney (CC0) · Ansimuz (Public Domain)
      </p>
    </div>
  );
}
