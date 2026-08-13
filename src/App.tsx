import { useEffect, useState } from 'react';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import Credits from './components/Game/Credits';
import GameFrame, { Box, Janela } from './components/Shell/GameFrame';
import { C, T } from './game/theme';
import { startMusic, stopMusic, startHomeTheme, stopHomeTheme } from './game/music';
import { CAPITULOS, PRIMEIRO } from './game/capitulos';

// ─────────────────────────────────────────────────────────
// O chassi (components/Shell/GameFrame) desenha a tela; os capítulos
// (game/capitulos) trazem o conteúdo. Um não conhece o outro: dá para
// trocar o roteiro sem tocar no desenho, e vice-versa.
// ─────────────────────────────────────────────────────────

type View = 'home' | 'jogo' | 'fim' | 'setup' | 'creditos';

const px = (n: number) => `calc(var(--p) * ${n})`;

// Botão do menu: moldura preta com bisel de um pixel em cima, e ao
// apertar ele afunda exatamente um pixel da grade — não uma fração.
function HomeButton({ label, tone, onClick }: {
  label: string; tone: 'primario' | 'fantasma'; onClick: () => void;
}) {
  const [down, setDown] = useState(false);
  const bg = tone === 'primario' ? C.rust : C.shell;
  const topo = tone === 'primario' ? C.rustLite : C.shellHi;
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      className="px-notch"
      style={{
        width: '100%', maxWidth: px(90),
        ...T.titulo, color: '#fff',
        background: bg, border: 'none', padding: `${px(4)} ${px(3)}`,
        boxShadow: down
          ? `inset 0 0 0 var(--p) ${C.line}`
          : `inset 0 0 0 var(--p) ${C.line}, inset 0 ${px(2)} 0 0 ${topo}`,
        transform: down ? `translateY(var(--p))` : 'none',
        cursor: 'pointer',
        textShadow: `0 var(--p) 0 rgba(0,0,0,0.45)`,
      }}
    >
      {label}
    </button>
  );
}

const IDS = Object.keys(CAPITULOS);

export default function App() {
  const [view, setView] = useState<View>('home');
  const [capId, setCapId] = useState<string>(PRIMEIRO);

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

  if (view === 'fim') {
    return (
      <GameFrame
        titulo="CINZAS"
        etapas={IDS.length}
        etapaAtual={IDS.length}
        texto="Por enquanto a trilha termina aqui. Os próximos capítulos ainda não foram escritos."
        opcoes={[
          { label: 'Voltar ao começo', onClick: () => { setCapId(PRIMEIRO); setView('jogo'); } },
          { label: 'Sair para a tela inicial', onClick: voltar },
        ]}
      />
    );
  }

  if (view === 'jogo') {
    const cap = CAPITULOS[capId];
    return (
      <GameFrame
        titulo={cap.titulo}
        marcador={cap.marcador}
        etapas={IDS.length}
        etapaAtual={IDS.indexOf(cap.id)}
        imagem={cap.imagem}
        foco={cap.foco}
        texto={cap.texto}
        opcoes={cap.opcoes.map(o => ({
          label: o.label,
          onClick: () => {
            if (o.proximo) { setCapId(o.proximo); window.scrollTo({ top: 0 }); }
            else setView('fim');
          },
        }))}
        acoes={
          <Box>
            <button
              onClick={voltar}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                ...T.rotulo, color: C.paperInk,
                padding: `${px(1)} ${px(1)}`, cursor: 'pointer', textAlign: 'left',
              }}
            >
              ← SAIR
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
        display: 'flex', flexDirection: 'column', gap: px(5), justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-pixel" style={{
            fontSize: 'clamp(24px, 8.5vw, 34px)', color: C.bone, letterSpacing: 6, margin: 0,
            textShadow: `0 var(--p) 0 ${C.line}`,
          }}>
            CINZAS
          </h1>
          <div className="px-notch" style={{
            display: 'inline-block', marginTop: px(3), padding: `${px(2)} ${px(3)}`,
            background: C.rust, boxShadow: `inset 0 0 0 var(--p) ${C.line}`,
          }}>
            <span style={{ ...T.rotulo, color: '#fff' }}>O ÚLTIMO ABRIGO</span>
          </div>
        </div>

        {/* capa: a mesma arte do primeiro capítulo */}
        <Janela imagem={CAPITULOS[PRIMEIRO].imagem} foco={CAPITULOS[PRIMEIRO].foco} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(3) }}>
          <HomeButton
            label="JOGAR"
            tone="primario"
            onClick={() => { startMusic(); setCapId(PRIMEIRO); setView('jogo'); }}
          />
          <div style={{ display: 'flex', gap: px(2), alignItems: 'center', marginTop: 'var(--p)' }}>
            {[
              { rotulo: 'SOU PROFESSOR', acao: () => { window.location.hash = '#setup'; } },
              { rotulo: 'CRÉDITOS', acao: () => setView('creditos') },
            ].map(({ rotulo, acao }, i) => (
              <span key={rotulo} style={{ display: 'flex', alignItems: 'center', gap: px(2) }}>
                {i > 0 && <span style={{ color: C.boneDim, opacity: 0.5 }}>·</span>}
                <button
                  onClick={acao}
                  style={{
                    background: 'transparent', border: 'none', color: C.boneDim,
                    ...T.rotulo, padding: `${px(2)} ${px(2)}`, cursor: 'pointer',
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
