import { lazy, Suspense, useEffect, useState } from 'react';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import Credits from './components/Game/Credits';
import GameFrame, { Janela } from './components/Shell/GameFrame';
import { C, T } from './game/theme';
import { startMusic, stopMusic, startHomeTheme, stopHomeTheme } from './game/music';
import { CAPITULOS, PRIMEIRO } from './game/capitulos';
import { CenaCamadas, CenaProfundidade } from './components/Shell/CenaAnimada';
import { JOGOS, type Jogo } from './game/jogos';

// O SILO ALPHA carrega o Three.js inteiro. Quem só vai jogar CINZAS não
// tem por que baixar isso: o pedaço só chega quando o jogo é escolhido.
const JogoSilo = lazy(() => import('./components/Shell/JogoSilo'));
const Semente = lazy(() => import('./components/Shell/Semente'));
const Bosque = lazy(() => import('./components/Shell/Bosque'));

// ─────────────────────────────────────────────────────────
// O chassi (components/Shell/GameFrame) desenha a tela; os capítulos
// (game/capitulos) trazem o conteúdo. Um não conhece o outro: dá para
// trocar o roteiro sem tocar no desenho, e vice-versa.
// ─────────────────────────────────────────────────────────

type View = 'home' | 'jogo' | 'silo' | 'semente' | 'fonte' | 'fim' | 'setup' | 'creditos';

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

// Cartão da tela de escolha: a capa mostra a técnica de imagem que o
// jogo usa, então dá para ver a diferença antes de entrar.
function CartaoJogo({ jogo, onClick }: { jogo: Jogo; onClick: () => void }) {
  const [down, setDown] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      className="px-notch"
      style={{
        display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
        background: C.line, border: 'none', padding: 'var(--p)',
        transform: down ? 'translateY(var(--p))' : 'none',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '11 / 6', overflow: 'hidden', background: C.shellLo }}>
        {/* a capa do 3D não roda a cena: subir uma segunda instância de
            WebGL só para a miniatura custa caro e trava celular fraco */}
        {jogo.tecnica === 'plataforma'
          ? <div style={{
              width: '100%', height: '100%',
              backgroundImage: 'url(/assets/bosque/capa.png)',
              backgroundSize: 'cover', backgroundPosition: 'center 70%',
              imageRendering: 'pixelated',
            }} />
          : jogo.tecnica === 'pixel'
          ? <div style={{
              width: '100%', height: '100%',
              backgroundImage: 'url(/assets/semente/capa.png)',
              backgroundSize: 'cover', backgroundPosition: 'center 40%',
              imageRendering: 'pixelated',
            }} />
          : jogo.tecnica === '3d'
          ? <div
              className="px-dither"
              style={{
                width: '100%', height: '100%', display: 'grid', placeItems: 'center',
                backgroundColor: C.shellLo,
                ['--dither-a' as string]: C.shellLo,
                ['--dither-b' as string]: '#2c3a1a',
              }}
            >
              <span style={{ ...T.titulo, color: C.lineSoft, letterSpacing: 3 }}>3D</span>
            </div>
          : <img
              src={CAPITULOS[PRIMEIRO].imagem}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: CAPITULOS[PRIMEIRO].foco }}
            />}
      </div>
      <div style={{ background: C.shell, padding: `${px(3)} ${px(3)}` }}>
        <div style={{ ...T.titulo, color: C.bone }}>{jogo.titulo}</div>
        <div style={{ ...T.rotulo, color: C.rustLite, marginTop: px(1) }}>{jogo.subtitulo}</div>
        <div style={{ ...T.corpo, fontSize: 16, color: C.boneDim, marginTop: px(2) }}>{jogo.chamada}</div>
        <div style={{ ...T.rotulo, color: C.lineSoft, marginTop: px(2) }}>{jogo.conteudo}</div>
      </div>
    </button>
  );
}

const IDS = Object.keys(CAPITULOS);

export default function App() {
  const [view, setView] = useState<View>('home');
  const [capId, setCapId] = useState<string>(PRIMEIRO);
  // cada incremento dispara um passo da animação da ilustração
  const [gatilho, setGatilho] = useState(0);
  // texto de consequência mostrado depois da escolha, antes de seguir

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

  if (view === 'fonte') {
    return (
      <Suspense fallback={
        <div style={{
          position: 'fixed', inset: 0, background: C.ink, display: 'grid',
          placeItems: 'center', ...T.rotulo, color: C.lineSoft,
        }}>
          SUBINDO A SERRA…
        </div>
      }>
        <Bosque onSair={voltar} />
      </Suspense>
    );
  }

  if (view === 'semente') {
    return (
      <Suspense fallback={
        <div style={{
          position: 'fixed', inset: 0, background: C.ink, display: 'grid',
          placeItems: 'center', ...T.rotulo, color: C.lineSoft,
        }}>
          DESCENDO A TRILHA…
        </div>
      }>
        <Semente onSair={voltar} />
      </Suspense>
    );
  }

  if (view === 'silo') {
    return (
      <Suspense fallback={
        <div style={{
          position: 'fixed', inset: 0, background: C.ink, display: 'grid',
          placeItems: 'center', ...T.rotulo, color: C.lineSoft,
        }}>
          ABRINDO O NÚCLEO VERDE…
        </div>
      }>
        <JogoSilo onSair={voltar} />
      </Suspense>
    );
  }

  if (view === 'jogo') {
    const cap = CAPITULOS[capId];
    const an = cap.animacao;
    return (
      <GameFrame
        titulo={cap.titulo}
        onVoltar={voltar}
        etapas={IDS.length}
        etapaAtual={IDS.indexOf(cap.id)}
        imagem={an ? undefined : cap.imagem}
        foco={cap.foco}
        cena={
          an?.tipo === 'camadas'
            ? <CenaCamadas camadas={an.camadas} foco={cap.foco} gatilho={gatilho} />
            : an?.tipo === 'profundidade'
              ? <CenaProfundidade
                  arte={cap.imagem} mapa={an.mapa} gatilho={gatilho}
                  recorte={{ escalaY: an.escalaY, offsetY: an.offsetY }}
                />
              : undefined
        }
        texto={cap.texto}
        opcoes={cap.opcoes.map(o => ({
          label: o.label,
          onClick: () => {
            // a ilustração anda primeiro; a cena só troca quando o passo
            // termina, senão o movimento é cortado no meio
            setGatilho(g => g + 1);
            window.setTimeout(() => {
              if (o.proximo) { setCapId(o.proximo); window.scrollTo({ top: 0 }); }
              else setView('fim');
            }, 620);
          },
        }))}
      />
    );
  }

  // ── TELA INICIAL ──────────────────────────────────────
  return (
    <div className="scene-fade-in" style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: C.ink,
      display: 'flex', justifyContent: 'center', padding: '18px 12px 24px',
    }}>
      {/* Largura em coluna única no celular em pé, e em grade quando a
          tela é larga. Sem isso a tela inicial fica presa num tubo de
          56vh de largura, e quem gira o aparelho para jogar A FONTE não
          consegue nem chegar no cartão dele. */}
      <div style={{
        position: 'relative', width: 'min(100vw - 24px, 1040px)',
        display: 'flex', flexDirection: 'column', gap: px(5),
        // centralizar na vertical com conteúdo mais alto que a tela corta
        // o topo e o deixa fora do alcance da rolagem — e com quatro
        // cartões a lista é sempre mais alta que a tela
        justifyContent: 'flex-start',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...T.rotulo, color: C.boneDim, letterSpacing: 3 }}>ESCOLHA UMA HISTÓRIA</div>
        </div>

        <div style={{
          display: 'grid', gap: px(5),
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          alignItems: 'start',
        }}>
        {JOGOS.map(j => (
          <CartaoJogo
            key={j.id}
            jogo={j}
            onClick={() => {
              startMusic();
              if (j.id === 'cinzas') { setCapId(PRIMEIRO); setView('jogo'); }
              else if (j.id === 'semente') setView('semente');
              else if (j.id === 'fonte') setView('fonte');
              else setView('silo');
            }}
          />
        ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(3) }}>
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
