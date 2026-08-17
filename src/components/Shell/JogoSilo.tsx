import { useState } from 'react';
import Silo3D from './Silo3D';
import { Box } from './GameFrame';
import { C, T } from '../../game/theme';
import { SILO, ESTACOES, type CapituloSilo } from '../../game/silo';

// ─────────────────────────────────────────────────────────
// Junta as duas metades do jogo:
//
//   EXPLORAR — o jogador anda pelo Núcleo Verde em 3D, em primeira
//   pessoa, e chega perto das bancadas por conta própria.
//
//   DECIDIR — ao alcançar uma bancada, a história abre no mesmo chassi
//   de caixa de texto dos outros capítulos. É o "estilo antigo" para a
//   parte narrativa, com movimento livre para chegar até ela.
//
// A separação importa: exploração é o que dá lugar ao mundo, e caixa de
// texto é o que dá tempo de pensar. Misturar os dois deixaria a decisão
// atropelada pelo controle.
// ─────────────────────────────────────────────────────────

const px = (n: number) => `calc(var(--p) * ${n})`;

export default function JogoSilo({ onSair }: { onSair: () => void }) {
  const [perto, setPerto] = useState<string | null>(null);
  const [aberto, setAberto] = useState<CapituloSilo | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [resolvidos, setResolvidos] = useState<string[]>([]);

  const abrir = () => {
    if (!perto) return;
    setAberto(SILO[perto]);
    setResultado(null);
  };

  const fechar = () => {
    if (aberto) setResolvidos(r => (r.includes(aberto.id) ? r : [...r, aberto.id]));
    setAberto(null);
    setResultado(null);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.ink,
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        position: 'relative', width: 'min(100vw, 56.25vh)', height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* HUD */}
        <div style={{ padding: `${px(2)} ${px(3)} 0` }}>
          <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: px(3),
              background: C.shell, padding: `${px(2)} ${px(3)}`,
            }}>
              <span style={{ ...T.titulo, color: C.bone }}>SILO ALPHA</span>
              <div style={{ flex: 1 }} />
              <span style={{ ...T.rotulo, color: C.lineSoft }}>
                {resolvidos.length}/{ESTACOES.length}
              </span>
              <button
                onClick={onSair}
                style={{
                  ...T.rotulo, color: '#fff', background: C.rust, border: 'none',
                  padding: `${px(1)} ${px(2)}`, marginLeft: px(2),
                  boxShadow: `0 0 0 var(--p) ${C.line}`, cursor: 'pointer',
                }}
              >
                ← VOLTAR
              </button>
            </div>
          </div>
        </div>

        {/* mundo 3D */}
        <div style={{ position: 'relative', flex: 1, margin: `${px(2)} ${px(3)}` }}>
          <div className="px-notch" style={{ position: 'absolute', inset: 0, background: C.line, padding: 'var(--p)' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
              <Silo3D estacoes={ESTACOES} onPerto={setPerto} />

              {/* aviso de que há algo para examinar aqui */}
              {perto && !aberto && (
                <button
                  onClick={abrir}
                  className="px-notch"
                  style={{
                    position: 'absolute', left: '50%', bottom: px(4), transform: 'translateX(-50%)',
                    zIndex: 4, background: C.rust, border: 'none', cursor: 'pointer',
                    padding: `${px(2)} ${px(4)}`, ...T.rotulo, color: '#fff',
                    boxShadow: `0 0 0 var(--p) ${C.line}`,
                  }}
                >
                  {resolvidos.includes(perto) ? 'REVER' : 'EXAMINAR'} · {SILO[perto].rotulo}
                </button>
              )}
            </div>
          </div>

          {/* a história abre por cima, no chassi de sempre */}
          {aberto && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10, overflowY: 'auto',
              background: 'rgba(10,13,7,0.94)', padding: px(2),
              display: 'flex', flexDirection: 'column', gap: px(3), justifyContent: 'center',
            }}>
              <div style={{ ...T.rotulo, color: C.lineSoft, paddingLeft: px(1) }}>
                {aberto.rotulo}
              </div>

              <Box>
                <div style={{ ...T.corpo, color: C.paperInk }}>
                  {resultado ?? aberto.texto}
                </div>
              </Box>

              <Box padding={false}>
                {resultado ? (
                  <MenuLinha onClick={fechar}>Voltar ao corredor</MenuLinha>
                ) : (
                  aberto.opcoes.map((o, i) => (
                    <MenuLinha
                      key={i}
                      divisor={i > 0}
                      onClick={() => setResultado(o.resultado)}
                    >
                      {o.label}
                    </MenuLinha>
                  ))
                )}
              </Box>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Mesma linha de menu do chassi, com cursor sempre visível. */
function MenuLinha({ children, onClick, divisor }: {
  children: React.ReactNode; onClick: () => void; divisor?: boolean;
}) {
  const [ativa, setAtiva] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setAtiva(true)}
      onPointerLeave={() => setAtiva(false)}
      onPointerDown={() => setAtiva(true)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: px(2), width: '100%',
        textAlign: 'left', border: 'none', cursor: 'pointer',
        borderTop: divisor ? `var(--p) solid ${C.paperEdge}` : undefined,
        background: ativa ? C.paperEdge : 'transparent',
        padding: `${px(3)} ${px(2)}`,
        ...T.corpo, color: C.paperInk,
      }}
    >
      <span aria-hidden style={{ flex: 'none', width: px(4), color: ativa ? C.paperInk : C.paperSoft }}>▶</span>
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}
