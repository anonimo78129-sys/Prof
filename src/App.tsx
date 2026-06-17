import { useEffect, useState } from 'react';
import type { GameConfig } from './types/game';
import SetupWizard from './components/TeacherSetup/SetupWizard';

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

      {/* ── CAMADA DE FUNDO ──────────────────────────────
          TODO: trocar pela arte pronta do fundo, ex:
          backgroundImage: "url('/assets/landing-bg.png')"
      */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, #6fc3e0 0%, #9fe0d0 55%, #5aaa2a 78%, #2f6e14 100%)',
        imageRendering: 'pixelated',
      }} />

      {/* ── CONTEÚDO CLICÁVEL ────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24,
      }}>

        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 className="font-pixel" style={{
            color: '#ffffff', fontSize: 40, letterSpacing: 6,
            textShadow: '4px 4px 0 #0d2a0d, 0 0 18px rgba(0,0,0,0.35)', margin: 0,
          }}>
            ÉTER
          </h1>
          <p className="font-vt" style={{ color: '#0d2a0d', fontSize: 22, marginTop: 6 }}>
            A Jornada do Conhecimento
          </p>
        </div>

        {/* Botões empilhados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 300 }}>
          <button
            onClick={() => setView('jogar')}
            className="btn-game font-pixel w-full"
            style={{ background: 'linear-gradient(to bottom, #5ad22a, #2f9410)', fontSize: 13, padding: '18px 8px' }}
          >
            JOGAR
          </button>

          <button
            onClick={() => { window.location.hash = '#setup'; }}
            className="btn-game font-pixel w-full"
            style={{ background: 'linear-gradient(to bottom, #f0a84a, #c87a18)', fontSize: 13, padding: '18px 8px' }}
          >
            CRIAR
          </button>
        </div>
      </div>
    </div>
  );
}
