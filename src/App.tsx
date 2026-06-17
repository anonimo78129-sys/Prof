import { useEffect, useRef, useState } from 'react';
import type { GameConfig } from './types/game';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import GameShell from './components/EscapeRoom/GameShell';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import ShareCard from './components/TeacherSetup/ShareCard';
import AnimatedHero from './components/EscapeRoom/mechanics/AnimatedHero';
import { DEMO_GAME } from './data/demoGame';

type View = 'home' | 'setup' | 'share' | 'play' | 'loading' | 'error';


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
    <div className="fixed inset-0 overflow-hidden scene-fade-in" style={{ touchAction: 'none' }}>

      {/* Sky */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #5ab8d0 0%, #7ed4e8 28%, #a8e8d0 52%, #5aaa2a 70%, #3a8010 100%)' }} />

      {/* Background.png — drifting sky */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, bottom: '28%',
        backgroundImage: "url('/assets/legacy/Background.png')",
        backgroundRepeat: 'repeat-x', backgroundSize: 'auto 65%', backgroundPositionY: '15%',
        imageRendering: 'pixelated', opacity: 0.6,
        animation: 'bg-drift 20s linear infinite',
      }} />

      {/* bg-castle silhouette */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '25%', height: '48%',
        backgroundImage: "url('/assets/world/bg-castle.png')",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom',
        backgroundSize: 'auto 100%', imageRendering: 'pixelated', opacity: 0.58,
      }} />

      {/* bg-layer3 — distant pines */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '25%', height: '32%',
        backgroundImage: "url('/assets/world/bg-layer3.png')",
        backgroundRepeat: 'repeat-x', backgroundPosition: 'bottom',
        backgroundSize: 'auto auto', imageRendering: 'pixelated', opacity: 0.48,
      }} />

      {/* bg-layer2 — midground pines */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '25%', height: '22%',
        backgroundImage: "url('/assets/world/bg-layer2.png')",
        backgroundRepeat: 'repeat-x', backgroundPosition: 'bottom',
        backgroundSize: 'auto auto', imageRendering: 'pixelated', opacity: 0.38,
      }} />

      {/* Ground */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '28%', background: 'linear-gradient(to bottom, #5aaa2a 0%, #5aaa2a 12%, #4a3a18 12%, #3a2a0e 100%)' }} />

      {/* Grass strip */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: '26%', height: 18,
        backgroundImage: "url('/assets/world/grass.png')",
        backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
        imageRendering: 'pixelated', opacity: 0.9, zIndex: 2,
      }} />

      {/* Left large tree */}
      <img src="/assets/legacy/trees/Green-Tree.png" alt="" style={{
        position: 'absolute', left: -24, bottom: '24%',
        height: 280, width: 'auto', imageRendering: 'pixelated', zIndex: 3, pointerEvents: 'none',
      }} />

      {/* Right large tree (flipped) */}
      <img src="/assets/legacy/trees/Green-Tree.png" alt="" style={{
        position: 'absolute', right: -24, bottom: '24%',
        height: 260, width: 'auto', imageRendering: 'pixelated',
        transform: 'scaleX(-1)', zIndex: 3, pointerEvents: 'none',
      }} />

      {/* Mid-left tree */}
      <img src="/assets/pack01/GREEN_09.png" alt="" style={{
        position: 'absolute', left: '18%', bottom: '26%',
        height: 195, width: 'auto', imageRendering: 'pixelated', zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Mid-right tree */}
      <img src="/assets/pack01/GREEN_05.png" alt="" style={{
        position: 'absolute', right: '15%', bottom: '26%',
        height: 185, width: 'auto', imageRendering: 'pixelated', zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Lake */}
      <div style={{
        position: 'absolute', left: '22%', right: '22%', bottom: '27%', height: 42, zIndex: 2,
        background: 'repeating-linear-gradient(90deg, rgba(34,102,164,0.85) 0px, rgba(68,153,204,0.92) 40px, rgba(34,102,164,0.85) 80px)',
        backgroundSize: '80px 100%', borderRadius: 3,
        animation: 'water-shimmer 2.8s ease-in-out infinite',
      }} />

      {/* Hero patrol */}
      <div className="hero-patrol" style={{ position: 'absolute', bottom: '27%', left: '50%', marginLeft: -80, zIndex: 5, pointerEvents: 'none' }}>
        <AnimatedHero scale={2.5} />
      </div>

      {/* Title (top, overlaid on scene) */}
      <div style={{ position: 'absolute', top: 18, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, pointerEvents: 'none', gap: 4 }}>
        <div style={{ background: 'rgba(0,12,6,0.72)', border: '2px solid #4aaa2a', padding: '5px 22px' }}>
          <h1 className="font-pixel" style={{ color: '#88ff44', fontSize: 20, textShadow: '0 0 10px #4aaa2a, 2px 2px 0 #000', letterSpacing: 4, margin: 0 }}>ÉTER</h1>
        </div>
        <p className="font-vt" style={{ color: '#ccffaa', fontSize: 18, textShadow: '1px 1px 0 #000', margin: 0 }}>A Jornada do Conhecimento</p>
      </div>

      {/* Menu panel (dark, fixed bottom) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(0,15,8,0.90)', borderTop: '2px solid #4aaa2a',
        padding: '14px 18px 22px',
      }}>
        <button
          onClick={() => { setGameConfig(DEMO_GAME); setView('play'); }}
          className="font-pixel w-full"
          style={{
            display: 'block', marginBottom: 10,
            background: 'linear-gradient(to bottom, #2a8a10, #1a6a08)',
            border: '3px solid #1a5a08', boxShadow: '0 4px 0 #0a3a02, 4px 4px 0 #000',
            color: '#88ff44', fontSize: 8, padding: '13px 8px', cursor: 'pointer', letterSpacing: 1,
          }}
        >
          ▶ JOGAR DEMO — SISTEMA SOLAR
        </button>

        <button
          onClick={() => { window.location.hash = '#setup'; }}
          className="font-pixel w-full"
          style={{
            display: 'block', marginBottom: 10,
            background: 'linear-gradient(to bottom, #f0c455, #c88f20)',
            border: '3px solid #7a4f1a', boxShadow: '0 4px 0 #4a2d08, 4px 4px 0 #000',
            color: '#2a1400', fontSize: 8, padding: '11px 8px', cursor: 'pointer',
          }}
        >
          🎓 SOU PROFESSOR
        </button>

        <div style={{ borderTop: '1px solid #2a6a1a', paddingTop: 10 }}>
          <p className="font-pixel" style={{ color: '#4aaa2a', fontSize: 6, marginBottom: 7 }}>SOU ALUNO — DIGITAR CÓDIGO</p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="input-rpg flex-1 px-3 py-2"
              placeholder="Código do jogo..."
              value={codeVal}
              onChange={e => setCodeVal(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
            />
            <button className="btn-rpg px-4 font-pixel" style={{ fontSize: 7 }} onClick={handleJoin}>▶ IR</button>
          </div>
        </div>
      </div>

    </div>
  );
}
