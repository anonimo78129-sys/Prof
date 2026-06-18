import { useEffect, useMemo, useState } from 'react';
import type { GameConfig } from './types/game';
import SetupWizard from './components/TeacherSetup/SetupWizard';

const BLUES = ['#4fc3f7', '#29b6f6', '#81d4fa', '#0288d1', '#80deea', '#40c4ff'];

function seeded(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function Particles() {
  const particles = useMemo(() => Array.from({ length: 32 }, (_, i) => ({
    id: i,
    left:     `${seeded(i * 7)  * 100}%`,
    top:      `${seeded(i * 13) * 100}%`,
    size:     1 + seeded(i * 3) * 2,
    color:    BLUES[Math.floor(seeded(i * 17) * BLUES.length)],
    duration: `${10 + seeded(i * 5) * 14}s`,
    delay:    `-${seeded(i * 11) * 12}s`,
    wind:     `${(seeded(i * 19) > 0.5 ? 1 : -1) * (40 + seeded(i * 23) * 80)}px`,
  })), []);

  return (
    <>
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          '--color': p.color,
          '--duration': p.duration,
          '--delay': p.delay,
          '--wind': p.wind,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

type View = 'home' | 'setup' | 'jogar';

export default function App() {
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#setup') setView('setup');
      else setView('home');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const goHome = () => { window.location.hash = ''; setView('home'); };

  // ── TELA DO PROFESSOR (criador de perguntas/jornada) ──
  if (view === 'setup') {
    return (
      <SetupWizard
        onGameCreated={(_config: GameConfig) => { goHome(); }}
      />
    );
  }

  // ── PLACEHOLDER "JOGAR" (o jogo do aluno vem depois) ──
  if (view === 'jogar') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-6"
        style={{ background: 'linear-gradient(to bottom, #0d1f12 0%, #07120a 100%)' }}>
        <div className="panel-pixel px-7 py-7 flex flex-col items-center gap-4 text-center"
          style={{ background: '#12331a', maxWidth: 360 }}>
          <p className="font-pixel" style={{ color: '#88ff44', fontSize: 12 }}>EM BREVE</p>
          <p className="font-vt" style={{ color: '#cfe8c0', fontSize: 20 }}>
            A aventura do aluno está sendo construída.
          </p>
        </div>
        <button onClick={goHome} className="btn-game font-pixel"
          style={{ background: 'linear-gradient(to bottom, #3a8a1a, #246010)', fontSize: 9, padding: '14px 22px' }}>
          ← VOLTAR
        </button>
      </div>
    );
  }

  // ── TELA INICIAL ──────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden scene-fade-in" style={{ touchAction: 'none' }}>

      {/* ── ARTE DE FUNDO (768×1376) ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: "url('/assets/landing-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }} />

      {/* ── PARTÍCULAS ── */}
      <Particles />

      {/* ── LOGO — topo ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
        <img src="/assets/logo.png" alt="Jardim Botânico" style={{ width: '100%', height: 'auto' }} />
      </div>

      {/* Gradiente escuro só na faixa dos botões (não cobre o personagem) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 180,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(4,18,6,0.82) 55%, rgba(2,10,3,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      {/* ── BOTÕES — fixos no rodapé ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 14, padding: '0 32px 127px',
      }}>
        <button
          onClick={() => setView('jogar')}
          className="btn-game font-pixel w-full"
          style={{ background: 'linear-gradient(to bottom, #5ad22a, #2f9410)', fontSize: 13, padding: '17px 8px', maxWidth: 320 }}
        >
          JOGAR
        </button>

        <button
          onClick={() => { window.location.hash = '#setup'; }}
          className="btn-game font-pixel w-full"
          style={{ background: 'linear-gradient(to bottom, #f0a84a, #c87a18)', fontSize: 13, padding: '17px 8px', maxWidth: 320 }}
        >
          CRIAR
        </button>
      </div>

    </div>
  );
}
