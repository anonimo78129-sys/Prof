import { useEffect, useState } from 'react';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import Credits from './components/Game/Credits';
import GameFrame, { Box } from './components/Shell/GameFrame';
import { C, bevel } from './game/theme';
import { startMusic, stopMusic, startHomeTheme, stopHomeTheme } from './game/music';

// ─────────────────────────────────────────────────────────
// A história e as ilustrações foram removidas a pedido: o foco agora é o
// desenho da tela. O que sobrou é o chassi — moldura, caixas, tipografia,
// paleta e ritmo vertical — alimentado por conteúdo de demonstração, para
// dar para julgar o design sem depender de roteiro nem de arte.
// ─────────────────────────────────────────────────────────

type View = 'home' | 'demo' | 'setup' | 'creditos';

// Texto só para ocupar a caixa com um volume realista de leitura.
const DEMO = {
  titulo: 'CINZAS',
  marcador: 'DIA 01',
  rotuloCena: 'Nome do lugar',
  texto:
    'Aqui entra a narração da cena. O bloco existe para mostrar como a caixa ' +
    'se comporta com um parágrafo de tamanho realista, com a entrelinha e a ' +
    'margem que o texto vai ter de verdade.',
  opcoes: ['Primeira alternativa da escolha', 'Segunda alternativa, um pouco mais longa que a primeira'],
};

function HomeButton({ label, tone, onClick }: {
  label: string; tone: 'primario' | 'fantasma'; onClick: () => void;
}) {
  const [down, setDown] = useState(false);
  const bg = tone === 'primario' ? C.rust : C.shell;
  const top = tone === 'primario' ? C.rustLite : C.shellHi;
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      className="font-pixel"
      style={{
        width: '100%', maxWidth: 320, fontSize: 12, letterSpacing: 1, color: '#fff',
        background: bg, border: `3px solid ${C.line}`, borderTop: `3px solid ${top}`,
        boxShadow: down ? 'none' : bevel(4),
        transform: down ? 'translate(4px, 4px)' : 'none',
        padding: '15px 8px', cursor: 'pointer',
        transition: 'transform 70ms, box-shadow 70ms',
        textShadow: '0 2px 0 rgba(0,0,0,0.45)',
      }}
    >
      {label}
    </button>
  );
}

export default function App() {
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    const handleHash = () => {
      setView(window.location.hash === '#setup' ? 'setup' : 'home');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (view === 'home') startHomeTheme(); else stopHomeTheme();
  }, [view]);

  const voltar = () => { stopMusic(); window.location.hash = ''; setView('home'); };

  if (view === 'setup') {
    // o quiz do professor gerava as perguntas do roteiro; sem roteiro ele
    // só devolve para a home até haver conteúdo novo para alimentar
    return <SetupWizard onGameCreated={voltar} />;
  }

  if (view === 'creditos') {
    return <Credits onBack={() => setView('home')} />;
  }

  if (view === 'demo') {
    return (
      <GameFrame
        titulo={DEMO.titulo}
        marcador={DEMO.marcador}
        etapas={6}
        etapaAtual={1}
        rotuloCena={DEMO.rotuloCena}
        texto={DEMO.texto}
        opcoes={DEMO.opcoes.map(label => ({ label, onClick: () => {} }))}
        acoes={
          <Box>
            <button
              onClick={voltar}
              className="font-pixel"
              style={{
                width: '100%', background: 'transparent', border: 'none',
                fontSize: 9, letterSpacing: 1, color: C.paperInk,
                padding: '4px 2px', cursor: 'pointer', textAlign: 'left',
              }}
            >
              ← VOLTAR
            </button>
          </Box>
        }
      />
    );
  }

  // ── TELA INICIAL ──────────────────────────────────────
  return (
    <div className="scene-fade-in" style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: C.ink,
      display: 'flex', justifyContent: 'center', padding: '18px 12px 24px',
    }}>
      <div style={{
        position: 'relative', width: 'min(100vw - 24px, 56.25vh)',
        display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-pixel" style={{
            fontSize: 'clamp(24px, 8.5vw, 34px)', color: C.bone, letterSpacing: 6, margin: 0,
            textShadow: `0 4px 0 ${C.line}`,
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
        </div>

        {/* a janela vazia já mostra a proporção e a moldura da cena */}
        <div style={{
          width: '100%', aspectRatio: '1 / 1', background: C.shellLo,
          border: `3px solid ${C.line}`, boxShadow: bevel(4),
          display: 'grid', placeItems: 'center',
        }}>
          <span className="font-pixel" style={{ fontSize: 8, letterSpacing: 2, color: C.boneDim }}>
            SEM ILUSTRAÇÃO
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
          <HomeButton label="VER O CHASSI" tone="primario" onClick={() => { startMusic(); setView('demo'); }} />
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
                  }}
                >
                  {rotulo}
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
