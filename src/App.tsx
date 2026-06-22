import { useEffect, useMemo, useState } from 'react';
import type { GameConfig } from './types/game';
import type { SceneBg } from './game/types';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import StoryGame from './components/Game/StoryGame';
import IntroSequence from './components/Game/IntroSequence';
import ScenePreview from './components/ScenePreview';

const DEV_ACTS = [
  { label: 'Ato 1 — Floresta (portão)',       beat: 0,  bg: undefined            },
  { label: 'Ato 2 — Clareira (pedra)',         beat: 7,  bg: undefined            },
  { label: 'Ato 3 — Macieira (scene)',         beat: 13, bg: undefined            },
  { label: 'Ato 3 — Coleta de maçãs',         beat: 19, bg: 'ato3' as SceneBg   },
  { label: 'Ato 4 — Estufa (avistando)',       beat: 20, bg: 'ato3' as SceneBg   },
  { label: 'Ato 4 — Estufa (dentro)',          beat: 23, bg: 'estufa' as SceneBg },
  { label: 'Ato 4 — Computador',               beat: 25, bg: 'estufa' as SceneBg },
  { label: 'Ato 4 — Pergunta (Transpiração)',  beat: 27, bg: 'estufa' as SceneBg },
  { label: 'Ato 5 — Pântano (sequência)',      beat: 36, bg: 'pantano' as SceneBg },
  { label: 'Ato 6 — Corredor (memória)',       beat: 42, bg: 'corredor' as SceneBg },
  { label: 'Ato 7 — Final (a escolha)',        beat: 47, bg: 'final' as SceneBg },
] as const;

function seeded(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// Vaga-lumes turquesa fluorescentes: tamanhos 1–5 px, movimento errante orgânico
function Fireflies() {
  const flies = useMemo(() => Array.from({ length: 38 }, (_, i) => {
    const size = 1 + seeded(i * 3) * 4;          // 1–5 px
    const bright = 0.7 + seeded(i * 29) * 0.3;   // brilho variado
    return {
      id: i,
      left:     `${seeded(i * 7) * 100}%`,
      top:      `${seeded(i * 13) * 85}%`,        // não vai no rodapé dos botões
      size,
      // pulsar suave: alterna opacidade
      pulseDur: `${1.4 + seeded(i * 41) * 2.6}s`,
      pulseDelay: `-${seeded(i * 17) * 3}s`,
      // deriva pelo espaço
      driftDur:  `${9 + seeded(i * 5) * 14}s`,
      driftDelay: `-${seeded(i * 11) * 12}s`,
      driftX:    `${(seeded(i * 19) > 0.5 ? 1 : -1) * (18 + seeded(i * 23) * 55)}px`,
      driftY:    `${(seeded(i * 31) > 0.5 ? 1 : -1) * (10 + seeded(i * 37) * 35)}px`,
      glow: `0 0 ${Math.round(size * 2)}px rgba(64,224,208,${(bright * 0.9).toFixed(2)}), 0 0 ${Math.round(size * 5)}px rgba(64,224,208,${(bright * 0.55).toFixed(2)}), 0 0 ${Math.round(size * 10)}px rgba(32,200,200,${(bright * 0.3).toFixed(2)})`,
    };
  }), []);

  return (
    <>
      {flies.map(f => (
        <div key={f.id} style={{
          position: 'absolute',
          left: f.left, top: f.top,
          width: f.size, height: f.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, #e0fffa, #40e0d0)`,
          boxShadow: f.glow,
          pointerEvents: 'none',
          animation: `firefly-drift ${f.driftDur} ease-in-out ${f.driftDelay} infinite, firefly-pulse ${f.pulseDur} ease-in-out ${f.pulseDelay} infinite`,
          '--dx': f.driftX,
          '--dy': f.driftY,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

type View = 'home' | 'intro' | 'setup' | 'jogar' | 'preview';

const isTestMode = typeof window !== 'undefined' && window.location.search.includes('test');

export default function App() {
  const [view, setView] = useState<View>('home');
  const [devStart, setDevStart] = useState<{ beat: number; bg?: SceneBg } | null>(null);
  const [showDevMenu, setShowDevMenu] = useState(false);

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

  // ── PREVIEW — galeria de cenários ──
  if (view === 'preview') {
    return <ScenePreview onBack={() => setView('home')} />;
  }

  // ── INTRO — sequência ilustrada antes do jogo ──
  if (view === 'intro') {
    return <IntroSequence onDone={() => setView('jogar')} />;
  }

  // ── JOGAR — aventura narrativa (visual novel + caminhada) ──
  if (view === 'jogar') {
    return <StoryGame onExit={() => { setDevStart(null); goHome(); }}
      startBeat={devStart?.beat} startBg={devStart?.bg} />;
  }

  // ── TELA INICIAL ──────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden scene-fade-in" style={{ touchAction: 'none' }}>

      {/* ── ARTE DE FUNDO — floresta ── */}
      <img src="/assets/landing-forest.png" alt="" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center top',
        pointerEvents: 'none',
        animation: 'bg-breathe 7s ease-in-out infinite',
        transformOrigin: 'center center',
      }} />

      {/* ── LOGO — meio ── */}
      <img src="/assets/landing-logo.png" alt="logo" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center top',
        pointerEvents: 'none', zIndex: 5,
        animation: 'logo-float 3.8s ease-in-out infinite',
      }} />

      {/* ── PERSONAGEM — sobreposto ── */}
      <img src="/assets/landing-char.png" alt="" style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center top',
        pointerEvents: 'none',
      }} />

      {/* ── SHIMMER TELA TODA ── */}
      <div className="screen-shimmer" />

      {/* ── VAGA-LUMES ── */}
      <Fireflies />

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
          onClick={() => setView('intro')}
          className="btn-game font-pixel w-full"
          style={{
            background: 'linear-gradient(to bottom, #2ca149 0% 30%, #84d03c 30% 90%, #c4de3c 90% 100%)',
            fontSize: 13, padding: '17px 8px', maxWidth: 320,
          }}
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

      {/* ── PAINEL DEV — visível em dev local OU com ?test na URL ── */}
      {(import.meta.env.DEV || isTestMode) && (
        <>
          <button
            onClick={() => setShowDevMenu(m => !m)}
            style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 90, background: 'rgba(0,0,0,0.7)', border: '1px solid #40e0d0', color: '#40e0d0', fontFamily: 'monospace', fontSize: 11, padding: '8px 14px', borderRadius: 4, cursor: 'pointer' }}>
            DEV
          </button>
          {showDevMenu && (
            <div style={{ position: 'absolute', bottom: 48, right: 12, zIndex: 90, background: 'rgba(6,14,7,0.97)', border: '1px solid #40e0d0', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
              <button
                onClick={async () => {
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map(r => r.unregister()));
                  }
                  if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(k => caches.delete(k)));
                  }
                  window.location.reload();
                }}
                style={{ background: '#1a0a00', border: '1px solid #ff6020', color: '#ff9060', fontFamily: 'monospace', fontSize: 11, padding: '10px 12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
                ♻ Forçar atualização
              </button>
              <div style={{ color: '#40e0d0', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginTop: 4, marginBottom: 0 }}>PULAR PARA</div>
              <button
                onClick={() => { setShowDevMenu(false); setView('preview'); }}
                style={{ background: '#101a20', border: '1px solid #40e0d0', color: '#40e0d0', fontFamily: 'monospace', fontSize: 11, padding: '10px 12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left' }}>
                🖼 Preview Cenários (5 packs)
              </button>
              {DEV_ACTS.map(act => (
                <button key={act.beat}
                  onClick={() => { setDevStart({ beat: act.beat, bg: act.bg }); setShowDevMenu(false); setView('jogar'); }}
                  style={{ background: '#0d1f10', border: '1px solid #2a4a2e', color: '#cfe8c8', fontFamily: 'monospace', fontSize: 11, padding: '10px 12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left' }}>
                  {act.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
