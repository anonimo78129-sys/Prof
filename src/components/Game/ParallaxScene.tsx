import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import manifesto from '../../game/artManifest.json';
import { C } from '../../game/theme';

// ─────────────────────────────────────────────────────────
// Renderiza uma cena em camadas.
//
// Cada camada com velocidade rola em loop numa tira que contém a mesma
// imagem duas vezes. Como a arte é desenhada em cilindro pelo gerador, a
// emenda não aparece. Velocidades diferentes por camada é o que produz a
// profundidade: o skyline distante quase parado, o chão passando rápido.
//
// Ao trocar de cena, a nova entra por cima em crossfade, camada por
// camada, e a antiga sai.
// ─────────────────────────────────────────────────────────

export type Camada = { n: string; v: number; fx: string | null };
type Manifesto = Record<string, Camada[]>;

const MANIFESTO = manifesto as Manifesto;
export const CENAS = Object.keys(MANIFESTO);

/** Onde mora a arte do jogo. Os estudos de estilo do painel DEV usam outra base. */
export const BASE_ARTE = '/assets/cinzas/art';

export const camadaSrc = (cena: string, nome: string, base = BASE_ARTE) => `${base}/${cena}/${nome}.png`;
export const cenaFlat = (cena: string, base = BASE_ARTE) => `${base}/${cena}/flat.png`;

/** Todos os arquivos de arte, para a tela de carregamento pré-carregar. */
export function todasAsImagens(): string[] {
  const out: string[] = [];
  for (const [cena, camadas] of Object.entries(MANIFESTO)) {
    for (const cam of camadas) out.push(camadaSrc(cena, cam.n));
    out.push(cenaFlat(cena));
  }
  return out;
}

const fxClass = (fx: string | null) =>
  fx === 'sway' ? 'fx-sway' : fx === 'glow' ? 'fx-glow' : fx === 'flicker' ? 'fx-flicker' : undefined;

function Cena({ cena, visivel, camadas: dadas, base, suave }: {
  cena: string; visivel: boolean; camadas?: Camada[]; base?: string; suave?: boolean;
}) {
  const camadas = dadas ?? MANIFESTO[cena] ?? [];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      opacity: visivel ? 1 : 0, transition: 'opacity 700ms ease',
    }}>
      {camadas.map(cam => {
        const cls = fxClass(cam.fx);
        const src = camadaSrc(cena, cam.n, base);
        if (cam.v <= 0) {
          // camada parada: uma imagem só
          return (
            <div key={cam.n} className={cls} style={{ position: 'absolute', inset: 0 }}>
              <img src={src} alt="" style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 88%',
                imageRendering: suave ? 'auto' : 'pixelated',
              }} />
            </div>
          );
        }
        return (
          <div key={cam.n} className={cls} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div className={`plx-track${suave ? ' plx-suave' : ''}`} style={{ animationDuration: `${cam.v}s` }}>
              <img src={src} alt="" />
              <img src={src} alt="" aria-hidden />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface ParallaxSceneProps {
  cena: string;
  /** proporção do quadro; a arte nativa é 540x300 (a da capa, 540x450) */
  aspect?: string;
  /** encolhe o quadro sem cortar a composição (usado na hora de decidir) */
  compact?: boolean;
  /** camadas avulsas, fora do manifesto do jogo (galeria de estudos do DEV) */
  camadas?: Camada[];
  /** prefixo dos arquivos; padrão é a arte do jogo */
  base?: string;
  /** amplia com interpolação em vez de "pixelated", para arte de tom contínuo */
  suave?: boolean;
  children?: React.ReactNode;
  style?: CSSProperties;
}

export default function ParallaxScene({ cena, aspect = '180 / 100', compact, camadas, base, suave, children, style }: ParallaxSceneProps) {
  // mantém a cena anterior montada durante o crossfade
  const [pilha, setPilha] = useState<string[]>([cena]);
  const [ativa, setAtiva] = useState(cena);

  useEffect(() => {
    if (cena === ativa) return;
    setPilha(p => (p.includes(cena) ? p : [...p, cena]));
    const entra = window.setTimeout(() => setAtiva(cena), 20);
    const limpa = window.setTimeout(() => setPilha([cena]), 900);
    return () => { window.clearTimeout(entra); window.clearTimeout(limpa); };
  }, [cena]); // eslint-disable-line react-hooks/exhaustive-deps

  const proporcao = useMemo(() => {
    if (!compact) return aspect;
    const [w, h] = aspect.split('/').map(n => Number(n.trim()));
    return `${w} / ${Math.round(h * 0.62)}`;
  }, [aspect, compact]);

  return (
    <div style={{
      position: 'relative', width: '100%', flex: 'none', overflow: 'hidden',
      aspectRatio: proporcao, transition: 'aspect-ratio 320ms ease',
      border: `2px solid ${C.line}`, background: C.shellLo, ...style,
    }}>
      {pilha.map(nome => (
        <Cena key={nome} cena={nome} visivel={nome === ativa} camadas={camadas} base={base} suave={suave} />
      ))}

      {/* vinheta por cima de tudo, parada: dá profundidade sem rolar junto */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.42) 100%)',
      }} />

      {children}
    </div>
  );
}
