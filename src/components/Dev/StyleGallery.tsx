import { useEffect, useState } from 'react';
import estudos from '../../game/styleStudies.json';
import ParallaxScene, { cenaFlat, type Camada } from '../Game/ParallaxScene';

// ─────────────────────────────────────────────────────────
// Galeria de estudos de estilo.
//
// O mesmo cenário — a cidade em ruínas do Cap. 2 — desenhado em nove
// técnicas de ilustração diferentes, geradas por scripts/gen-styles.mjs.
// A geometria é a mesma nas nove, então a única variável é a técnica.
//
// A grade mostra a versão parada de cada estudo: nove cenas em parallax
// ao mesmo tempo seriam 45 imagens animadas e travariam no celular. O
// movimento aparece quando um estudo é aberto, e no modo comparar.
// ─────────────────────────────────────────────────────────

const BASE = '/assets/cinzas/estudos';

interface Estudo { nome: string; ref: string; desc: string; camadas: Camada[] }
const ESTUDOS = estudos as Record<string, Estudo>;
const SLUGS = Object.keys(ESTUDOS);

const MONO = { fontFamily: 'monospace' } as const;

function Rotulo({ slug, i }: { slug: string; i: number }) {
  const e = ESTUDOS[slug];
  return (
    <div style={{ ...MONO, padding: '6px 8px' }}>
      <div style={{ color: '#C7B990', fontSize: 12 }}>{i + 1}. {e.nome}</div>
      <div style={{ color: '#6d7f8c', fontSize: 10, marginTop: 2 }}>{e.ref}</div>
    </div>
  );
}

/** Um estudo rodando de verdade, com as camadas em velocidades diferentes. */
function Vivo({ slug, aspect = '180 / 100' }: { slug: string; aspect?: string }) {
  return (
    <ParallaxScene
      cena={slug}
      camadas={ESTUDOS[slug].camadas}
      base={BASE}
      aspect={aspect}
      // só o estudo em pixel art quer ampliação dura; os outros oito foram
      // desenhados em 3x e reduzidos, e "pixelated" serrilharia a borda
      suave={slug !== 'pixel'}
      style={{ border: '1px solid #332A3B' }}
    />
  );
}

export default function StyleGallery({ onFechar }: { onFechar: () => void }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [comparar, setComparar] = useState<[string, string] | null>(null);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (comparar) setComparar(null);
      else if (aberto) setAberto(null);
      else onFechar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aberto, comparar, onFechar]);

  const idx = aberto ? SLUGS.indexOf(aberto) : -1;
  const anda = (d: number) => setAberto(SLUGS[(idx + d + SLUGS.length) % SLUGS.length]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: '#0a080c',
      overflowY: 'auto', padding: 16,
    }}>
      {/* ── cabeçalho ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 14, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ ...MONO, color: '#8fd0e6', fontSize: 14, letterSpacing: 2 }}>
            GALERIA DE ESTILOS
          </div>
          <div style={{ ...MONO, color: '#6d7f8c', fontSize: 11, marginTop: 4, maxWidth: 620 }}>
            O mesmo cenário em {SLUGS.length} técnicas. A geometria é idêntica nas nove —
            mesmo sol, mesmos prédios, mesma posição da protagonista — então a única coisa
            que muda de um quadro para o outro é a técnica de ilustração.
          </div>
        </div>
        <button onClick={onFechar} style={{
          ...MONO, background: 'rgba(0,0,0,0.7)', border: '1px solid #4C7A8C',
          color: '#4C7A8C', fontSize: 11, padding: '8px 14px', borderRadius: 4, cursor: 'pointer',
        }}>
          ✕ FECHAR
        </button>
      </div>

      {/* ── modo comparar: dois estudos animados, um sobre o outro ── */}
      {comparar && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ ...MONO, color: '#8fd0e6', fontSize: 11, letterSpacing: 2 }}>
              COMPARANDO
            </div>
            <button onClick={() => setComparar(null)} style={BOTAO}>SAIR DA COMPARAÇÃO</button>
          </div>
          {comparar.map(slug => (
            <div key={slug} style={{ marginBottom: 10 }}>
              <Rotulo slug={slug} i={SLUGS.indexOf(slug)} />
              <Vivo slug={slug} />
            </div>
          ))}
        </div>
      )}

      {/* ── um estudo aberto, com parallax rodando ── */}
      {aberto && !comparar && (
        <div style={{ marginBottom: 18 }}>
          <Vivo slug={aberto} />
          <div style={{ ...MONO, padding: '10px 2px' }}>
            <div style={{ color: '#C7B990', fontSize: 13 }}>
              {idx + 1}. {ESTUDOS[aberto].nome}
            </div>
            <div style={{ color: '#6d7f8c', fontSize: 11, marginTop: 3 }}>
              {ESTUDOS[aberto].ref}
            </div>
            <div style={{ color: '#9a8f7a', fontSize: 12, marginTop: 8, lineHeight: 1.55, maxWidth: 680 }}>
              {ESTUDOS[aberto].desc}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => anda(-1)} style={BOTAO}>◀ ANTERIOR</button>
            <button onClick={() => anda(1)} style={BOTAO}>PRÓXIMO ▶</button>
            <button
              onClick={() => setComparar([aberto, SLUGS[(idx + 1) % SLUGS.length]])}
              style={BOTAO}
            >
              COMPARAR COM O PRÓXIMO
            </button>
            <button onClick={() => setAberto(null)} style={BOTAO}>FECHAR ESTUDO</button>
          </div>
        </div>
      )}

      {/* ── grade: versão parada, para não animar nove cenas de uma vez ── */}
      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
      }}>
        {SLUGS.map((slug, i) => (
          <button
            key={slug}
            onClick={() => { setComparar(null); setAberto(slug); window.scrollTo({ top: 0 }); }}
            style={{
              background: '#101014', border: `1px solid ${slug === aberto ? '#4C7A8C' : '#241d33'}`,
              borderRadius: 4, padding: 0, cursor: 'pointer', textAlign: 'left', overflow: 'hidden',
            }}
          >
            <img
              src={cenaFlat(slug, BASE)}
              alt={ESTUDOS[slug].nome}
              loading="lazy"
              style={{
                display: 'block', width: '100%', aspectRatio: '180 / 100', objectFit: 'cover',
                imageRendering: slug === 'pixel' ? 'pixelated' : 'auto',
              }}
            />
            <Rotulo slug={slug} i={i} />
          </button>
        ))}
      </div>

      <div style={{ ...MONO, color: '#4a4450', fontSize: 10, marginTop: 16, lineHeight: 1.6 }}>
        Gerado por scripts/gen-styles.mjs · npm run art:estudos
      </div>
    </div>
  );
}

const BOTAO = {
  ...MONO, background: '#14121a', border: '1px solid #332A3B', color: '#C7B990',
  fontSize: 11, padding: '9px 12px', borderRadius: 4, cursor: 'pointer',
} as const;
