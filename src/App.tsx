import { useEffect, useState } from 'react';
import SetupWizard from './components/TeacherSetup/SetupWizard';
import Credits from './components/Game/Credits';
import { C, T } from './game/theme';
import { startMusic, stopMusic, startHomeTheme, stopHomeTheme } from './game/music';
import { JOGOS, type Jogo } from './game/jogos';

// ─────────────────────────────────────────────────────────
// A casca do aplicativo: tela inicial, quiz do professor e créditos.
//
// Os quatro jogos educacionais saíram daqui. O que ficou é o encaixe —
// o roteamento por `view`, o chassi de interface em pixel, a música e o
// cartão da tela de escolha. Um jogo novo entra em três lugares: uma
// entrada em game/jogos, um id no tipo `View` e um `lazy()` ao lado dos
// outros, para o pacote dele só ser baixado quando alguém escolher.
// ─────────────────────────────────────────────────────────

type View = 'home' | 'setup' | 'creditos';

const px = (n: number) => `calc(var(--p) * ${n})`;

// Cartão da tela de escolha. A capa é opcional: sem imagem ele desenha
// um padrão pontilhado com o título por cima, que é o suficiente para o
// cartão existir antes de a arte existir.
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
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '11 / 6',
        overflow: 'hidden', background: C.shellLo,
      }}>
        {jogo.capa
          ? <div style={{
              width: '100%', height: '100%',
              backgroundImage: `url(${jogo.capa})`,
              backgroundSize: 'cover', backgroundPosition: jogo.foco ?? 'center',
              imageRendering: 'pixelated',
            }} />
          : <div
              className="px-dither"
              style={{
                width: '100%', height: '100%', display: 'grid', placeItems: 'center',
                backgroundColor: C.shellLo,
                ['--dither-a' as string]: C.shellLo,
                ['--dither-b' as string]: '#2c3a1a',
              }}
            >
              <span style={{ ...T.titulo, color: C.lineSoft, letterSpacing: 3 }}>
                {jogo.titulo}
              </span>
            </div>}
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
    return <SetupWizard onGameCreated={voltar} />;
  }

  if (view === 'creditos') {
    return <Credits onBack={() => setView('home')} />;
  }

  // ── TELA INICIAL ──────────────────────────────────────
  return (
    <div className="scene-fade-in" style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: C.ink,
      display: 'flex', justifyContent: 'center', padding: '18px 12px 24px',
    }}>
      {/* Coluna única no celular em pé, grade quando a tela é larga. E
          'safe' no alinhamento vertical: com 'center' puro, uma lista
          mais alta que a tela sangra para cima e o topo do primeiro
          cartão sai da área rolável. */}
      <div style={{
        position: 'relative', width: 'min(100vw - 24px, 1040px)',
        display: 'flex', flexDirection: 'column', gap: px(5),
        justifyContent: 'safe center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...T.rotulo, color: C.boneDim, letterSpacing: 3 }}>
            {JOGOS.length ? 'ESCOLHA UMA HISTÓRIA' : 'NADA AQUI AINDA'}
          </div>
        </div>

        {JOGOS.length > 0 ? (
          <div style={{
            display: 'grid', gap: px(5),
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            alignItems: 'start',
          }}>
            {JOGOS.map(j => (
              <CartaoJogo
                key={j.id}
                jogo={j}
                onClick={() => { startMusic(); }}
              />
            ))}
          </div>
        ) : (
          <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }}>
            <div style={{
              background: C.shell, padding: `${px(6)} ${px(4)}`, textAlign: 'center',
            }}>
              <div style={{ ...T.corpo, fontSize: 16, color: C.boneDim }}>
                O jogo novo ainda não foi construído.
              </div>
            </div>
          </div>
        )}

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
