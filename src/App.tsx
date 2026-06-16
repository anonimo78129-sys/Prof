import { useEffect, useRef, useState } from 'react';
import type { GameConfig } from './types/game';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import GameShell from './components/EscapeRoom/GameShell';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import ShareCard from './components/TeacherSetup/ShareCard';
import AnimatedHero from './components/EscapeRoom/mechanics/AnimatedHero';

type View = 'home' | 'setup' | 'share' | 'play' | 'loading' | 'error';

// ── Pixel-art cloud (CSS only) ─────────────────────────
function PixelCloud({ x, y, w, animClass }: { x: string; y: string; w: number; animClass: string }) {
  return (
    <div className={`absolute pointer-events-none ${animClass}`} style={{ left: x, top: y }}>
      {/* body */}
      <div style={{ display: 'grid', gridTemplateRows: '8px 8px 8px', width: w }}>
        <div style={{ background: '#fff', width: '60%', margin: '0 auto', borderRadius: '0' }} />
        <div style={{ background: '#fff', width: '100%', opacity: 0.95 }} />
        <div style={{ background: '#e8e8e8', width: '85%' }} />
      </div>
    </div>
  );
}

// ── Pixel-art tree (CSS only) ──────────────────────────
function PixelTree({ x, flip }: { x: string; flip?: boolean }) {
  return (
    <div
      className="absolute bottom-0 pointer-events-none tree-sway"
      style={{ left: x, transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* canopy */}
      <div style={{ width: 32, height: 32, background: '#2a7c1a', border: '2px solid #1a5c0a', marginLeft: 4 }} />
      <div style={{ width: 40, height: 28, background: '#1e6a12', border: '2px solid #145008', marginTop: -8 }} />
      <div style={{ width: 48, height: 20, background: '#166010', border: '2px solid #0e4408', marginTop: -8, marginLeft: -4 }} />
      {/* trunk */}
      <div style={{ width: 12, height: 24, background: '#7a4f2d', border: '2px solid #4a2d10', margin: '0 auto' }} />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>('home');
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [codeVal, setCodeVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleJoin = () => {
    const val = codeVal.trim().toUpperCase();
    if (val) window.location.hash = `#play/${val}`;
  };

  if (view === 'loading') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(to bottom, #5ba3d8 0%, #8ec8f5 55%, #a8d46b 80%, #4a8a1a 100%)' }}>
        <div className="portal-spin" style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid #f0c455', boxShadow: '0 0 24px #f0c455' }} />
        <p className="font-pixel" style={{ color: '#2a1400', fontSize: 8, textShadow: '0 2px 0 rgba(255,255,255,0.5)' }}>CARREGANDO...</p>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 px-6"
        style={{ background: 'linear-gradient(to bottom, #5ba3d8 0%, #8ec8f5 55%, #a8d46b 80%, #4a8a1a 100%)' }}>
        <div className="panel-parchment px-6 py-5 max-w-sm w-full text-center flex flex-col gap-4">
          <p className="font-pixel" style={{ color: '#c82828', fontSize: 10 }}>ERRO</p>
          <p className="font-vt" style={{ color: '#4a2d10', fontSize: 20 }}>{errorMsg}</p>
          <button onClick={() => { window.location.hash = ''; }} className="btn-rpg py-3 w-full font-pixel" style={{ fontSize: 8 }}>
            ← INÍCIO
          </button>
        </div>
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

  // ── HOME SCREEN ──────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #5ba3d8 0%, #8ec8f5 42%, #c5e8fd 62%, #a8d46b 78%, #4a8a1a 100%)' }}>

      {/* ── CLOUDS ── */}
      <PixelCloud x="8%"  y="6%"  w={64} animClass="cloud-1" />
      <PixelCloud x="52%" y="3%"  w={80} animClass="cloud-2" />
      <PixelCloud x="30%" y="12%" w={48} animClass="cloud-3" />
      <PixelCloud x="72%" y="9%"  w={56} animClass="cloud-1" />

      {/* ── TITLE BANNER (in sky) ── */}
      <div className="relative z-10 flex flex-col items-center pt-10 px-4">
        <div className="panel-parchment px-6 py-3 text-center mb-2" style={{ background: 'linear-gradient(160deg,#fffbe8,#f0d890)' }}>
          <h1 className="font-pixel" style={{ color: '#3a1a00', fontSize: 18, letterSpacing: 4, textShadow: '2px 2px 0 rgba(0,0,0,0.2)' }}>
            ÉTER
          </h1>
        </div>
        <p className="font-vt" style={{ color: '#1a4a0a', fontSize: 22, textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
          A Jornada do Conhecimento
        </p>
        <p className="font-vt" style={{ color: '#2c6414', fontSize: 17 }}>
          6 fases · puzzles · batalhas
        </p>
      </div>

      {/* ── GAME SCENE: trees + hero ── */}
      <div className="relative flex-1 flex items-end justify-center overflow-hidden">
        {/* Trees */}
        <PixelTree x="4%" />
        <PixelTree x="74%" flip />
        <PixelTree x="14%" />
        <PixelTree x="62%" flip />

        {/* Hero patrol */}
        <div className="absolute hero-patrol" style={{ bottom: 48 }}>
          <AnimatedHero scale={2.5} />
        </div>

        {/* Iris orb floating above hero */}
        <div
          className="absolute iris-glow"
          style={{
            bottom: 118,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 18, height: 18,
            background: 'radial-gradient(circle, #80ffdd, #00d4aa)',
            borderRadius: '50%',
          }}
        />

        {/* Ground strip (darker grass) */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 48, background: 'linear-gradient(to bottom, #3a7a12 0%, #2a5a0a 100%)', borderTop: '4px solid #1a4006' }}>
          {/* grass tufts pattern */}
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} className="absolute bottom-0" style={{ left: `${i * 7.5}%`, width: 8, height: 14, background: '#4a9a1a', borderTop: '2px solid #2a6008' }} />
          ))}
        </div>
      </div>

      {/* ── MENU PANEL (parchment) ── */}
      <div className="relative z-20 flex-shrink-0">
        <div className="panel-parchment mx-4 mb-4 px-5 py-5 flex flex-col gap-3" style={{ boxShadow: '5px 5px 0 #3a2010, 0 -3px 0 #7a4f2d inset' }}>

          {/* Professor button */}
          <button
            onClick={() => { window.location.hash = '#setup'; }}
            className="btn-rpg py-4 w-full font-pixel"
            style={{ fontSize: 8 }}
          >
            🎓 SOU PROFESSOR
          </button>

          <div style={{ height: 2, background: '#c4a068', margin: '2px 0' }} />

          {/* Student code input */}
          <p className="font-pixel text-center" style={{ color: '#7a4f2d', fontSize: 6 }}>SOU ALUNO — DIGITAR CÓDIGO</p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="input-rpg flex-1 px-3 py-3"
              placeholder="Código do jogo..."
              value={codeVal}
              onChange={e => setCodeVal(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
            />
            <button
              className="btn-rpg px-4 font-pixel"
              style={{ fontSize: 7 }}
              onClick={handleJoin}
            >
              ▶ IR
            </button>
          </div>
        </div>

        {/* Credits */}
        <p className="font-vt text-center pb-2" style={{ color: '#1a5a04', fontSize: 13 }}>
          Sprites: CC0 · Ansimuz · Kenney
        </p>
      </div>
    </div>
  );
}
