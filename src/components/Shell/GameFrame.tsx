import { useState, type CSSProperties, type ReactNode } from 'react';
import { C, T } from '../../game/theme';

// ─────────────────────────────────────────────────────────
// O chassi do jogo, em pixel art de 8 bits.
//
//   ┌─────────────┐
//   │ HUD         │  título, marcador, progresso
//   ├─────────────┤
//   │   JANELA    │  a cena
//   ├─────────────┤
//   │ CAIXA TEXTO │  a narração, com seta de continuar
//   ├─────────────┤
//   │ ▶ RESPOSTA  │  o menu de escolhas
//   └─────────────┘
//
// Tudo é medido em --p, o tamanho de um pixel de arte (ver index.css).
// Nenhuma medida solta em px: borda, recuo e espaço entre caixas são
// múltiplos inteiros dessa unidade, senão a grade quebra e a tela deixa
// de ler como pixel art.
//
// Só o chassi mora aqui: nem história nem ilustração. O que entra em
// cada fatia vem por prop.
// ─────────────────────────────────────────────────────────

const px = (n: number) => `calc(var(--p) * ${n})`;

/**
 * Caixa de diálogo: anel preto, filete claro e linha preta fechando o
 * miolo, com o pixel da quina removido. O entalhe é o que separa moldura
 * de 8 bits de retângulo de navegador.
 */
export function Box({ children, style, tom = 'claro', padding = true }: {
  children: ReactNode; style?: CSSProperties; tom?: 'claro' | 'escuro';
  /** desliga o recuo interno para a divisa do menu correr de ponta a ponta */
  padding?: boolean;
}) {
  const fundo = tom === 'claro' ? C.paper : C.shell;
  return (
    <div className="px-notch" style={{ background: C.line, padding: 'var(--p)', ...style }}>
      <div className="px-notch" style={{ background: fundo, padding: 'var(--p)' }}>
        <div style={{ border: `var(--p) solid ${C.line}`, background: fundo }}>
          <div style={{ padding: padding ? `${px(3)} ${px(4)}` : undefined }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Linha de menu.
 *
 * O cursor fica SEMPRE visível, um por linha. Antes ele só aparecia no
 * hover, e como celular não tem hover as alternativas chegavam ao aluno
 * sem marcador nenhum: duas respostas de duas linhas cada liam como um
 * parágrafo único de quatro linhas, sem dar para saber onde uma acaba e
 * a outra começa. O hover agora só reforça a linha ativa, não é o que
 * revela que ali existe uma opção.
 *
 * A divisa entre as linhas é o segundo marcador, para o caso de a
 * alternativa quebrar em várias linhas.
 */
export function MenuItem({ children, onClick, divisor }: {
  children: ReactNode; onClick?: () => void; divisor?: boolean;
}) {
  const [ativa, setAtiva] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setAtiva(true)}
      onPointerLeave={() => setAtiva(false)}
      onPointerDown={() => setAtiva(true)}
      onFocus={() => setAtiva(true)}
      onBlur={() => setAtiva(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: px(2), width: '100%',
        textAlign: 'left', border: 'none', cursor: 'pointer',
        borderTop: divisor ? `var(--p) solid ${C.paperEdge}` : undefined,
        background: ativa ? C.paperEdge : 'transparent',
        padding: `${px(3)} ${px(2)}`,
        ...T.corpo, color: C.paperInk,
      }}
    >
      <span
        aria-hidden
        className={ativa ? 'px-nudge' : undefined}
        style={{ flex: 'none', width: px(4), color: ativa ? C.paperInk : C.paperSoft }}
      >
        ▶
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

/**
 * Janela da cena: só moldura preta, sem bisel. Bisel de canto claro é
 * idioma de interface de desktop dos anos 90; console de 8 bits emoldura
 * a tela com preto e ponto final.
 *
 * Sem ilustração, o interior recebe xadrez de dithering na escala do
 * pixel, para o vazio ler como textura proposital em vez de erro.
 */
export function Janela({ children, imagem, foco = 'center' }: {
  children?: ReactNode;
  /** ilustração da cena, recortada para a faixa da janela */
  imagem?: string;
  /** que parte da composição não pode ser cortada (object-position) */
  foco?: string;
}) {
  const vazia = !children && !imagem;
  return (
    <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }}>
      <div
        className={vazia ? 'px-dither' : undefined}
        style={{
          // faixa larga e baixa: em quadrado a janela empurrava a caixa de
          // texto e as alternativas para fora da dobra no celular
          position: 'relative', width: '100%', aspectRatio: '11 / 7',
          // backgroundColor, nunca o atalho background: o atalho zera o
          // background-image que a classe .px-dither define
          backgroundColor: C.shellLo, overflow: 'hidden',
          ['--dither-a' as string]: C.shellLo,
          ['--dither-b' as string]: '#232f18',
        }}
      >
        {imagem && (
          <img
            src={imagem}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: foco, display: 'block',
            }}
          />
        )}
        {children}
        {vazia && (
          <div style={{
            position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
            ...T.rotulo, letterSpacing: 2, color: C.boneDim, textAlign: 'center', padding: px(5),
          }}>
            JANELA DA CENA
          </div>
        )}
      </div>
    </div>
  );
}

/** Barra de progresso em blocos: em 8 bits progresso é contado, não medido. */
function Progresso({ total, atual }: { total: number; atual: number }) {
  return (
    <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }} aria-hidden>
      <div style={{ display: 'flex', gap: 'var(--p)' }}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} style={{
            flex: 1, height: px(2),
            background: i <= atual ? C.lineSoft : C.shellLo,
          }} />
        ))}
      </div>
    </div>
  );
}

export interface GameFrameProps {
  titulo: string;
  marcador?: string;
  etapas?: number;
  etapaAtual?: number;
  cena?: ReactNode;
  /** ilustração da cena e o ponto do recorte que não pode ser cortado */
  imagem?: string;
  foco?: string;
  texto: ReactNode;
  /** mostra a seta de continuar no canto da caixa de texto */
  continuar?: boolean;
  opcoes?: { label: string; onClick?: () => void }[];
  acoes?: ReactNode;
}

export default function GameFrame({
  titulo, marcador, etapas = 0, etapaAtual = 0,
  cena, imagem, foco, texto, continuar, opcoes, acoes,
}: GameFrameProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: C.ink,
      display: 'flex', justifyContent: 'center',
      padding: `${px(3)} 0 ${px(8)}`,
    }}>
      {/* preenche a largura no celular e trava em 9:16 no desktop */}
      <div style={{
        width: 'min(100vw, 56.25vh)', padding: `0 ${px(3)}`,
        display: 'flex', flexDirection: 'column', gap: px(3),
      }}>

        {/* ── HUD ── */}
        <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: px(3),
            background: C.shell, padding: `${px(2)} ${px(3)}`,
            boxShadow: `inset 0 ${px(1)} 0 0 ${C.shellHi}`,
          }}>
            <span style={{ ...T.titulo, color: C.bone }}>{titulo}</span>
            <div style={{ flex: 1 }} />
            {marcador && (
              <span style={{
                ...T.rotulo, color: '#fff', background: C.rust,
                padding: `${px(1)} ${px(2)}`,
                boxShadow: `0 0 0 var(--p) ${C.line}`,
                marginRight: 'var(--p)',
              }}>
                {marcador}
              </span>
            )}
          </div>
        </div>

        {etapas > 0 && <Progresso total={etapas} atual={etapaAtual} />}

        <Janela imagem={imagem} foco={foco}>{cena}</Janela>

        <Box>
          <div style={{ ...T.corpo, color: C.paperInk }}>{texto}</div>
          {continuar && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: px(2) }}>
              <span aria-hidden className="px-blink" style={{ ...T.rotulo, color: C.paperInk }}>▼</span>
            </div>
          )}
        </Box>

        {opcoes && opcoes.length > 0 && (
          <Box padding={false}>
            {opcoes.map((o, i) => (
              <MenuItem key={i} onClick={o.onClick} divisor={i > 0}>{o.label}</MenuItem>
            ))}
          </Box>
        )}

        {acoes}
      </div>
    </div>
  );
}
