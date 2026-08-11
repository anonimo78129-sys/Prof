import { useEffect, useMemo, useState } from 'react';
import type { GameConfig } from './types/game';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import SurvivalGame from './components/Game/SurvivalGame';
import LoadingScreen from './components/Game/LoadingScreen';
import Credits from './components/Game/Credits';
import { getSave, clearSave, resetStats } from './game/progress';
import { freshStats } from './game/cinzas';
import { C, ART, bevel } from './game/theme';
import { startMusic, stopMusic, startHomeTheme, stopHomeTheme } from './game/music';
import { decodeQuiz, type SharedQuiz } from './game/quizShare';

// Atalhos de DEV — pulam direto para um capítulo/desafio/desfecho
const DEV_SCENES = [
  { label: 'Cap. 1 — Abrigo 7', id: 'abrigo' },
  { label: 'Cap. 1 — O contador', id: 'desafio_radiacao' },
  { label: 'Cap. 2 — As Ruínas', id: 'ruinas' },
  { label: 'Cap. 2 — Zona industrial', id: 'perigo' },
  { label: 'Cap. 2 — A cisterna', id: 'desafio_agua' },
  { label: 'Cap. 3 — Elias', id: 'encontro' },
  { label: 'Cap. 3 — O braço de Elias', id: 'desafio_imunidade' },
  { label: 'Cap. 3 — A Mancha', id: 'mancha' },
  { label: 'Cap. 4 — O Cercado', id: 'assentamento' },
  { label: 'Cap. 4 — A estufa', id: 'desafio_estufa' },
  { label: 'Cap. 4 — A virada', id: 'desafio_fungo' },
  { label: 'A escolha (lua nova)', id: 'escolha' },
  { label: 'Epílogo — A Primeira Colheita', id: 'final_colheita' },
  { label: 'Epílogo — A Fogueira', id: 'final_fogueira' },
] as const;

function seeded(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// Brasas/cinzas cor de ferrugem, deriva errática — versão da tela inicial
function Embers() {
  const flies = useMemo(() => Array.from({ length: 32 }, (_, i) => {
    const size = 1 + seeded(i * 3) * 4;
    const bright = 0.6 + seeded(i * 29) * 0.4;
    return {
      id: i,
      left:     `${seeded(i * 7) * 100}%`,
      top:      `${seeded(i * 13) * 85}%`,
      size,
      pulseDur: `${1.4 + seeded(i * 41) * 2.6}s`,
      pulseDelay: `-${seeded(i * 17) * 3}s`,
      driftDur:  `${9 + seeded(i * 5) * 14}s`,
      driftDelay: `-${seeded(i * 11) * 12}s`,
      driftX:    `${(seeded(i * 19) > 0.5 ? 1 : -1) * (18 + seeded(i * 23) * 55)}px`,
      driftY:    `${(seeded(i * 31) > 0.5 ? 1 : -1) * (10 + seeded(i * 37) * 35)}px`,
      glow: `0 0 ${Math.round(size * 2)}px rgba(217,122,62,${(bright * 0.9).toFixed(2)}), 0 0 ${Math.round(size * 5)}px rgba(181,85,30,${(bright * 0.55).toFixed(2)})`,
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
          background: `radial-gradient(circle, #F2C464, #B5551E)`,
          boxShadow: f.glow,
          pointerEvents: 'none',
          animation: `ember-drift ${f.driftDur} ease-in-out ${f.driftDelay} infinite, ember-pulse ${f.pulseDur} ease-in-out ${f.pulseDelay} infinite`,
          '--dx': f.driftX,
          '--dy': f.driftY,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// Botão da tela inicial: bisel pixel, sem gradiente, com press físico
function HomeButton({ label, tone, onClick }: {
  label: string; tone: 'rust' | 'steel' | 'ghost'; onClick: () => void;
}) {
  const [down, setDown] = useState(false);
  const bg = tone === 'rust' ? C.rust : tone === 'steel' ? C.steel : C.shell;
  const top = tone === 'rust' ? C.rustLite : tone === 'steel' ? '#5fa9cc' : C.shellHi;
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      className="font-pixel"
      style={{
        width: '100%', maxWidth: 300, fontSize: 12, letterSpacing: 1, color: '#fff',
        background: bg, border: `3px solid ${C.line}`, borderTop: `3px solid ${top}`,
        boxShadow: down ? 'none' : bevel(4),
        transform: down ? 'translate(4px, 4px)' : 'none',
        padding: '15px 8px', cursor: 'pointer',
        transition: 'transform 70ms, box-shadow 70ms',
        textShadow: `0 2px 0 rgba(0,0,0,0.45)`,
      }}
    >
      {label}
    </button>
  );
}

type View = 'home' | 'loading' | 'setup' | 'jogar' | 'creditos';

const isTestMode = typeof window !== 'undefined' && window.location.search.includes('test');

export default function App() {
  const [view, setView] = useState<View>('home');
  const [devStart, setDevStart] = useState<{ sceneId: string; stats: ReturnType<typeof freshStats> } | null>(null);
  const [showDevMenu, setShowDevMenu] = useState(false);
  // remonta o SurvivalGame do zero em "JOGAR DE NOVO"
  const [gameKey, setGameKey] = useState(0);
  // checkpoint salvo (para o botão CONTINUAR); relido ao voltar à home
  const [save, setSave] = useState(() => getSave());
  useEffect(() => { if (view === 'home') setSave(getSave()); }, [view]);
  // quiz do professor (quando o aluno abre um link/QR compartilhado)
  const [quiz, setQuiz] = useState<SharedQuiz | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      // link/QR compartilhado pelo professor: #jogo=<quiz codificado>
      if (hash.startsWith('#jogo=')) {
        const q = decodeQuiz(hash.slice('#jogo='.length));
        if (q && (q.questions.length > 0 || q.pairs.length > 0)) {
          setQuiz(q);
          resetStats(); clearSave(); setDevStart(null); setGameKey(k => k + 1);
          setView('loading');
          startMusic();
          return;
        }
        // link inválido: cai na home
        window.location.hash = '';
      }
      if (hash === '#setup') setView('setup');
      else setView('home');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Tema da tela inicial: toca em loop enquanto view === 'home'.
  // Os navegadores bloqueiam autoplay sem interação, então tentamos tocar
  // direto (funciona se o navegador permitir) e, se falhar, disparamos na
  // PRIMEIRA interação de qualquer tipo — mover o mouse, rolar, tocar a
  // tela ou apertar uma tecla — não só ao clicar num botão. Assim a música
  // começa o quanto antes, sem depender de o usuário clicar em JOGAR.
  useEffect(() => {
    if (view !== 'home') { stopHomeTheme(); return; }
    startHomeTheme();
    const EVENTS = ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'scroll', 'wheel', 'click'] as const;
    const kick = () => { startHomeTheme(); cleanup(); };
    const cleanup = () => EVENTS.forEach(ev => window.removeEventListener(ev, kick, true));
    EVENTS.forEach(ev => window.addEventListener(ev, kick, { capture: true, passive: true }));
    return cleanup;
  }, [view]);

  const goHome = () => { stopMusic(); setQuiz(null); window.location.hash = ''; setView('home'); };

  // ── TELA DO PROFESSOR (criador de perguntas/jornada) ──
  if (view === 'setup') {
    return (
      <SetupWizard
        onGameCreated={(_config: GameConfig) => { goHome(); }}
      />
    );
  }

  // ── CRÉDITOS — atribuições de arte, áudio, fontes e tecnologia ──
  if (view === 'creditos') {
    return <Credits onBack={() => setView('home')} />;
  }

  // ── LOADING — pré-carrega os ícones antes de começar ──
  if (view === 'loading') {
    return <LoadingScreen onDone={() => setView('jogar')} />;
  }

  // ── JOGAR — ficção interativa de sobrevivência ──
  if (view === 'jogar') {
    return <SurvivalGame key={gameKey}
      onExit={() => { setDevStart(null); goHome(); }}
      onRestart={() => { resetStats(); clearSave(); setDevStart(null); setGameKey(k => k + 1); }}
      continueFrom={devStart}
      quiz={quiz} />;
  }

  // ── TELA INICIAL ──────────────────────────────────────
  return (
    <div className="scene-fade-in" style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: C.ink,
      display: 'flex', justifyContent: 'center', padding: '18px 12px 24px',
    }}>
      {/* arte borrada ao fundo, só para não deixar as bordas mortas */}
      <img src={ART('hero')} alt="" aria-hidden style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
        filter: 'brightness(0.35) saturate(1.1) blur(3px)', pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 400,
        display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center',
      }}>
        {/* ── TÍTULO ── */}
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-pixel" style={{
            fontSize: 'clamp(24px, 8.5vw, 34px)', color: C.bone, letterSpacing: 6, margin: 0,
            textShadow: `0 4px 0 ${C.line}, 0 0 26px rgba(226,97,47,0.5)`,
          }}>
            CINZAS
          </h1>
          <div style={{
            display: 'inline-block', marginTop: 9, padding: '5px 10px',
            background: C.rust, border: `2px solid ${C.line}`, boxShadow: bevel(3),
          }}>
            <span className="font-pixel" style={{ fontSize: 8, color: '#fff', letterSpacing: 1 }}>
              O ÚLTIMO ABRIGO
            </span>
          </div>
          {/* quem chega pelo QR do professor não sabe o que vai jogar */}
          <p className="font-vt" style={{
            fontSize: 17, lineHeight: 1.4, color: C.bone, margin: '11px auto 0', maxWidth: 320,
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}>
            Uma história de sobrevivência em que suas decisões dependem de
            entender o que o mundo está fazendo. Cerca de 10 minutos.
          </p>
        </div>

        {/* ── ARTE EMOLDURADA — mesma proporção nativa, sem corte ── */}
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '180 / 150', flex: 'none',
          border: `3px solid ${C.line}`, boxShadow: bevel(4), overflow: 'hidden', background: C.shellLo,
        }}>
          <img src={ART('hero')} alt="Ruínas de uma cidade ao amanhecer" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            imageRendering: 'pixelated', objectFit: 'cover',
          }} />
          <div className="screen-shimmer" />
          <Embers />
        </div>

        {/* ── BOTÕES ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
          {save && (
            <HomeButton
              label="CONTINUAR"
              tone="rust"
              onClick={() => { startMusic(); setQuiz(null); setDevStart({ sceneId: save.sceneId, stats: save.stats }); setGameKey(k => k + 1); setView('loading'); }}
            />
          )}
          <HomeButton
            label={save ? 'NOVO JOGO' : 'JOGAR'}
            tone={save ? 'ghost' : 'rust'}
            onClick={() => { startMusic(); setQuiz(null); resetStats(); clearSave(); setDevStart(null); setGameKey(k => k + 1); setView('loading'); }}
          />
          {/* ações de professor e de rodapé, subordinadas ao JOGAR */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
            {[
              { rotulo: 'SOU PROFESSOR', acao: () => { window.location.hash = '#setup'; } },
              { rotulo: 'CRÉDITOS', acao: () => setView('creditos') },
            ].map(({ rotulo, acao }, i) => (
              <span key={rotulo} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <span style={{ color: C.boneDim, opacity: 0.5 }}>·</span>}
                <button
                  onClick={acao}
                  className="font-pixel"
                  style={{
                    background: 'transparent', border: 'none', color: C.boneDim, fontSize: 8,
                    letterSpacing: 1, padding: '8px 6px', cursor: 'pointer',
                    textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                  }}
                >
                  {rotulo}
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAINEL DEV — visível em dev local OU com ?test na URL ── */}
      {(import.meta.env.DEV || isTestMode) && (
        <>
          <button
            onClick={() => setShowDevMenu(m => !m)}
            style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 90, background: 'rgba(0,0,0,0.7)', border: '1px solid #4C7A8C', color: '#4C7A8C', fontFamily: 'monospace', fontSize: 11, padding: '8px 14px', borderRadius: 4, cursor: 'pointer' }}>
            DEV
          </button>
          {showDevMenu && (
            <div style={{ position: 'absolute', bottom: 48, right: 12, zIndex: 90, background: 'rgba(10,8,12,0.97)', border: '1px solid #4C7A8C', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 260 }}>
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
              <div style={{ color: '#4C7A8C', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, marginTop: 4, marginBottom: 0 }}>PULAR PARA</div>
              {DEV_SCENES.map(s => (
                <button key={s.id}
                  onClick={() => { startMusic(); setQuiz(null); setDevStart({ sceneId: s.id, stats: freshStats() }); setShowDevMenu(false); setView('jogar'); }}
                  style={{ background: '#14121a', border: '1px solid #332A3B', color: '#C7B990', fontFamily: 'monospace', fontSize: 11, padding: '10px 12px', borderRadius: 4, cursor: 'pointer', textAlign: 'left' }}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
