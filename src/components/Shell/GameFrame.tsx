import { useState, type CSSProperties, type ReactNode } from 'react';
import { C, bevel } from '../../game/theme';

// ─────────────────────────────────────────────────────────
// O chassi do jogo, no formato de RPG de portátil antigo:
//
//   ┌─────────────┐
//   │   JANELA    │  a cena
//   ├─────────────┤
//   │ CAIXA TEXTO │  a narração
//   ├─────────────┤
//   │ ▶ RESPOSTA  │  o menu de escolhas
//   └─────────────┘
//
// Só o chassi mora aqui: nem história nem ilustração. O que entra em
// cada fatia vem por prop, então dá para julgar o desenho da tela sem
// depender de conteúdo nenhum.
// ─────────────────────────────────────────────────────────

/**
 * Caixa de três anéis: moldura preta, filete claro e linha preta fechando
 * o miolo. Uma borda só lê como caixa de site; é a repetição dos anéis
 * que dá o ar de portátil antigo.
 */
export function Box({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: C.line, padding: 3, boxShadow: bevel(3), ...style }}>
      <div style={{ background: C.paper, padding: 3 }}>
        <div style={{ border: `2px solid ${C.line}`, background: C.paper }}>
          <div style={{ padding: '11px 12px' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Linha de menu: o cursor só aparece na opção ativa, como no portátil. */
export function MenuItem({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const [ativa, setAtiva] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setAtiva(true)}
      onPointerLeave={() => setAtiva(false)}
      onFocus={() => setAtiva(true)}
      onBlur={() => setAtiva(false)}
      className="font-vt"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 7, width: '100%',
        textAlign: 'left', background: 'transparent', border: 'none',
        padding: '7px 2px', cursor: 'pointer',
        fontSize: 17, lineHeight: 1.3, color: C.paperInk,
      }}
    >
      <span aria-hidden style={{ flex: 'none', width: 11, visibility: ativa ? 'visible' : 'hidden' }}>
        ▶
      </span>
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

/** Janela da cena. Sem ilustração, mostra a moldura vazia com um rótulo. */
export function Janela({ rotulo, children }: { rotulo?: string; children?: ReactNode }) {
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '1 / 1',
      background: C.shellLo, border: `3px solid ${C.line}`, boxShadow: bevel(3),
      overflow: 'hidden',
    }}>
      {children ?? (
        <div className="font-pixel" style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontSize: 8, letterSpacing: 2, color: C.boneDim, textAlign: 'center', padding: 16,
        }}>
          JANELA DA CENA
        </div>
      )}
      {rotulo && (
        <div className="font-pixel" style={{
          position: 'absolute', left: 0, bottom: 0, right: 0, fontSize: 7.5,
          color: C.bone, background: 'linear-gradient(to top, rgba(16,16,16,0.92), rgba(16,16,16,0))',
          padding: '12px 8px 5px', letterSpacing: 0.5,
        }}>
          {rotulo}
        </div>
      )}
    </div>
  );
}

export interface GameFrameProps {
  titulo: string;
  /** contador curto no topo, ex. "DIA 01" */
  marcador?: string;
  /** quantas etapas a barra de progresso tem, e em qual estamos */
  etapas?: number;
  etapaAtual?: number;
  rotuloCena?: string;
  cena?: ReactNode;
  /** o texto da caixa de narração */
  texto: ReactNode;
  /** as opções do menu; sem elas a caixa de respostas não aparece */
  opcoes?: { label: string; onClick?: () => void }[];
  acoes?: ReactNode;
}

export default function GameFrame({
  titulo, marcador, etapas = 0, etapaAtual = 0,
  rotuloCena, cena, texto, opcoes, acoes,
}: GameFrameProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: C.ink,
      display: 'flex', justifyContent: 'center', padding: '10px 0 28px',
    }}>
      {/* preenche a largura no celular e trava em 9:16 no desktop */}
      <div style={{
        width: 'min(100vw, 56.25vh)', padding: '0 10px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.shell, border: `2px solid ${C.line}`, boxShadow: bevel(3),
          padding: '7px 8px',
        }}>
          <span className="font-pixel" style={{ fontSize: 10, color: C.bone, letterSpacing: 1 }}>
            {titulo}
          </span>
          {marcador && (
            <span className="font-pixel" style={{
              fontSize: 7, color: '#fff', background: C.rust,
              border: `2px solid ${C.line}`, padding: '3px 6px',
            }}>
              {marcador}
            </span>
          )}
        </div>

        {etapas > 0 && (
          <div style={{ display: 'flex', gap: 3 }} aria-hidden>
            {Array.from({ length: etapas }, (_, i) => (
              <span key={i} style={{
                flex: 1, height: 4, border: `1px solid ${C.line}`,
                background: i <= etapaAtual ? C.lineSoft : 'rgba(255,255,255,0.08)',
              }} />
            ))}
          </div>
        )}

        <Janela rotulo={rotuloCena}>{cena}</Janela>

        <Box>
          <div className="font-vt" style={{ fontSize: 19, lineHeight: 1.4, color: C.paperInk }}>
            {texto}
          </div>
        </Box>

        {opcoes && opcoes.length > 0 && (
          <Box>
            {opcoes.map((o, i) => (
              <MenuItem key={i} onClick={o.onClick}>{o.label}</MenuItem>
            ))}
          </Box>
        )}

        {acoes}
      </div>
    </div>
  );
}
