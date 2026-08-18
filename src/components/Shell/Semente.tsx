import { useEffect, useRef, useState } from 'react';
import { C, T } from '../../game/theme';
import {
  MAPAS, ENCONTROS, MAPA_INICIAL, INICIO, ORDEM,
  type Mapa, type Npc, type Encontro,
} from '../../game/semente';

// ─────────────────────────────────────────────────────────
// SEMENTE — motor de mundo em grade, no estilo dos RPGs de portátil
//
// Nada de 3D aqui, e é de propósito: um canvas 2D com tiles de 16 pixels
// roda a sessenta quadros em qualquer celular, pesa menos que uma única
// textura da estufa e não depende de nada da placa de vídeo. Toda a
// dificuldade que o Núcleo Verde teve com GPU simplesmente não existe.
//
// COMO O MUNDO É DESENHADO
//   1. o chão, tile por tile, só o pedaço que cabe na tela
//   2. objetos, NPCs e o jogador juntos numa lista só, ordenados pelo pé
//      — quem tem o pé mais embaixo desenha por último e tapa o resto.
//      É isso que faz o jogador passar ATRÁS da árvore e NA FRENTE do
//      arbusto sem nenhuma camada extra
//   3. a caixa de texto, que é HTML por cima, para a fonte ficar nítida
//
// O andar é travado na grade, como no jogo de referência: aperta a
// direção, o boneco caminha uma casa inteira e só então aceita a próxima
// ordem. Isso é o que dá o peso certo ao passo — movimento livre em
// mundo de tile sempre parece escorregadio.
//
// ARTE: pacote Ninja Adventure, de Pixel-boy (Sparklin Labs), CC0 1.0.
// ─────────────────────────────────────────────────────────

const TILE = 16;
const VISAO_L = 13, VISAO_A = 22;      // casas visíveis, retrato
const DUR_PASSO = 0.16;                 // segundos por casa

// ── peças do chão ────────────────────────────────────────
const CHAO: Record<string, { c: number; r: number; solido?: boolean }> = {
  '.': { c: 14, r: 16 },
  ',': { c: 13, r: 16 },
  ';': { c: 16, r: 16 },
  't': { c: 18, r: 16 },
  '=': { c: 22, r: 22 },
  '#': { c: 2, r: 28, solido: true },
  ' ': { c: 14, r: 16 },
};

// ── peças de objeto: recorte no tileset e tamanho em casas ──
interface Peca { c: number; r: number; l: number; a: number; solido?: boolean }
const PECAS: Record<string, Peca> = {
  casaA: { c: 0, r: 0, l: 5, a: 3, solido: true },
  casaB: { c: 5, r: 0, l: 5, a: 3, solido: true },
  casaC: { c: 10, r: 0, l: 5, a: 3, solido: true },
  arvore: { c: 0, r: 9, l: 3, a: 3, solido: true },
  arvoreMorta: { c: 3, r: 27, l: 3, a: 2, solido: true },
  matoMorto: { c: 2, r: 28, l: 1, a: 1, solido: true },
  broto: { c: 1, r: 27, l: 1, a: 1 },
  // a árvore que caiu e abriu a clareira: é o mesmo desenho de árvore
  // morta, deitado no meio do mato novo
  tronco: { c: 3, r: 27, l: 3, a: 2, solido: true },
  pote: { c: 1, r: 6, l: 1, a: 1, solido: true },
  barril: { c: 3, r: 6, l: 1, a: 1, solido: true },
  poco: { c: 20, r: 6, l: 4, a: 5, solido: true },
  canteiro: { c: 20, r: 15, l: 3, a: 3 },
  cofre: { c: 5, r: 7, l: 3, a: 2, solido: true },
  estante: { c: 12, r: 37, l: 2, a: 2, solido: true },
};

type Dir = 0 | 1 | 2 | 3;               // 0 baixo · 1 cima · 2 esquerda · 3 direita
const AVANCO: [number, number][] = [[0, 1], [0, -1], [-1, 0], [1, 0]];

interface Passo { ox: number; oy: number; dx: number; dy: number; t: number }

interface Cena {
  mapa: Mapa;
  solido: boolean[][];
}

function montaCena(id: string): Cena {
  const mapa = MAPAS[id];
  const alt = mapa.chao.length, larg = mapa.chao[0].length;
  const solido: boolean[][] = Array.from({ length: alt }, (_, y) =>
    Array.from({ length: larg }, (_, x) => !!CHAO[mapa.chao[y][x] ?? '#']?.solido));
  for (const o of mapa.objetos) {
    const p = PECAS[o.peca];
    if (!p?.solido) continue;
    for (let y = o.y; y < o.y + p.a; y++)
      for (let x = o.x; x < o.x + p.l; x++)
        if (solido[y]) solido[y][x] = true;
  }
  for (const n of mapa.npcs) if (solido[n.y]) solido[n.y][n.x] = true;
  return { mapa, solido };
}

// ── conversa em andamento ────────────────────────────────
type Conversa =
  | { tipo: 'fala'; quem: string; texto: string; proximo: () => void }
  | { tipo: 'escolha'; encontro: Encontro }
  | { tipo: 'resultado'; texto: string; certa: boolean; encontro: Encontro };

export default function Semente({ onSair }: { onSair: () => void }) {
  const area = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [resolvidos, setResolvidos] = useState<string[]>([]);
  const [mapaId, setMapaId] = useState(MAPA_INICIAL);
  const [pronto, setPronto] = useState(false);

  // estado do mundo fora do React: muda a cada quadro e não pode
  // disparar renderização
  const jogo = useRef({
    x: INICIO.x, y: INICIO.y, olhando: INICIO.olhando as Dir,
    passo: null as Passo | null,
    quadro: 0, andado: 0,
    apertado: null as Dir | null,
    cena: montaCena(MAPA_INICIAL),
  });
  const conversaRef = useRef<Conversa | null>(null);
  conversaRef.current = conversa;
  const resolvidosRef = useRef<string[]>([]);
  resolvidosRef.current = resolvidos;

  const arte = useRef<Record<string, HTMLImageElement>>({});

  // ── carrega o material ──
  useEffect(() => {
    const nomes = ['tileset', 'p3', 'p2', 'p4', 'p6', 'p7', 'p9', 'p12'];
    let faltam = nomes.length;
    for (const n of nomes) {
      const img = new Image();
      img.src = `/assets/semente/${n}.png`;
      img.onload = () => { if (--faltam === 0) setPronto(true); };
      img.onerror = () => { if (--faltam === 0) setPronto(true); };
      arte.current[n] = img;
    }
  }, []);

  // ── troca de mapa ──
  useEffect(() => { jogo.current.cena = montaCena(mapaId); }, [mapaId]);

  /**
   * Virar é uma ação por si só. Sem isto, encostar numa parede ou num NPC
   * não mudava a direção do olhar — e encarar alguém para conversar só
   * funcionava se desse para dar um passo naquele sentido, o que nunca é
   * o caso quando a pessoa está bem na sua frente.
   */
  const encara = (d: Dir) => {
    const g = jogo.current;
    g.apertado = d;
    if (!g.passo && !conversaRef.current) g.olhando = d;
  };

  const podeIr = (x: number, y: number) => {
    const s = jogo.current.cena.solido;
    return !!s[y] && s[y][x] !== undefined && !s[y][x];
  };

  const encaraNpc = (): Npc | null => {
    const g = jogo.current;
    const [dx, dy] = AVANCO[g.olhando];
    const ax = g.x + dx, ay = g.y + dy;
    return g.cena.mapa.npcs.find(n => n.x === ax && n.y === ay) ?? null;
  };

  // ── interação ──
  const interage = () => {
    if (conversaRef.current) { avanca(); return; }
    const n = encaraNpc();
    if (!n) return;
    jogo.current.apertado = null;

    if (n.encontro) {
      const e = ENCONTROS[n.encontro];
      if (resolvidosRef.current.includes(e.id)) {
        setConversa({ tipo: 'fala', quem: n.id.toUpperCase(), texto: e.depois, proximo: fecha });
        return;
      }
      let i = 0;
      const seguir = () => {
        if (i < e.fala.length) {
          const f = e.fala[i++];
          setConversa({ tipo: 'fala', quem: f.quem, texto: f.texto, proximo: seguir });
        } else {
          setConversa({ tipo: 'escolha', encontro: e });
        }
      };
      seguir();
      return;
    }

    if (n.conversa) {
      let i = 0;
      const seguir = () => {
        if (i < n.conversa!.length) {
          const texto = n.conversa![i++];
          setConversa({ tipo: 'fala', quem: n.id.toUpperCase(), texto, proximo: seguir });
        } else fecha();
      };
      seguir();
    }
  };

  const fecha = () => setConversa(null);

  const avanca = () => {
    const c = conversaRef.current;
    if (!c) return;
    if (c.tipo === 'fala') c.proximo();
    else if (c.tipo === 'resultado') {
      if (c.certa) setResolvidos(r => (r.includes(c.encontro.id) ? r : [...r, c.encontro.id]));
      fecha();
    }
  };

  const escolhe = (i: number) => {
    const c = conversaRef.current;
    if (c?.tipo !== 'escolha') return;
    const op = c.encontro.escolhas[i];
    setConversa({ tipo: 'resultado', texto: op.resultado, certa: op.certa, encontro: c.encontro });
  };

  // ── laço do jogo ──
  useEffect(() => {
    if (!pronto) return;
    const cv = tela.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let vivo = true, anterior = performance.now();

    const quadro = (agora: number) => {
      if (!vivo) return;
      const dt = Math.min((agora - anterior) / 1000, 0.05);
      anterior = agora;
      const g = jogo.current;

      // andar: só aceita ordem nova quando a casa anterior terminou
      if (g.passo) {
        g.passo.t += dt / DUR_PASSO;
        if (g.passo.t >= 1) {
          g.x = g.passo.ox + g.passo.dx;
          g.y = g.passo.oy + g.passo.dy;
          g.passo = null;
          const s = g.cena.mapa.saidas.find(p => p.x === g.x && p.y === g.y);
          if (s) {
            g.x = s.destinoX; g.y = s.destinoY; g.apertado = null;
            setMapaId(s.para);
          }
        }
      } else if (g.apertado !== null && !conversaRef.current) {
        const d = g.apertado;
        g.olhando = d;
        const [dx, dy] = AVANCO[d];
        if (podeIr(g.x + dx, g.y + dy)) g.passo = { ox: g.x, oy: g.y, dx, dy, t: 0 };
      }

      const movendo = !!g.passo;
      if (movendo) { g.andado += dt; g.quadro = Math.floor(g.andado / 0.08) % 4; }
      else { g.andado = 0; g.quadro = 0; }

      desenha(ctx, g, arte.current);
      requestAnimationFrame(quadro);
    };
    requestAnimationFrame(quadro);
    return () => { vivo = false; };
  }, [pronto, mapaId]);

  // ── teclado ──
  useEffect(() => {
    const mapa: Record<string, Dir> = {
      arrowdown: 0, s: 0, arrowup: 1, w: 1,
      arrowleft: 2, a: 2, arrowright: 3, d: 3,
    };
    const dn = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in mapa) { e.preventDefault(); encara(mapa[k]); }
      if (k === ' ' || k === 'enter' || k === 'z') { e.preventDefault(); interage(); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k in mapa && jogo.current.apertado === mapa[k]) jogo.current.apertado = null;
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  const px = (n: number) => `calc(var(--p) * ${n})`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.ink, display: 'flex', justifyContent: 'center' }}>
      <div ref={area} style={{
        position: 'relative', width: 'min(100vw, 56.25vh)', height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* HUD */}
        <div style={{ padding: `${px(2)} ${px(3)} 0` }}>
          <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: px(3), background: C.shell, padding: `${px(2)} ${px(3)}` }}>
              <span style={{ ...T.titulo, color: C.bone }}>SEMENTE</span>
              <div style={{ flex: 1 }} />
              <span style={{ ...T.rotulo, color: C.lineSoft }}>{resolvidos.length}/{ORDEM.length}</span>
              <button
                onClick={onSair}
                style={{
                  ...T.rotulo, color: '#fff', background: C.rust, border: 'none',
                  padding: `${px(1)} ${px(2)}`, marginLeft: px(2),
                  boxShadow: `0 0 0 var(--p) ${C.line}`, cursor: 'pointer',
                }}
              >← VOLTAR</button>
            </div>
          </div>
        </div>

        {/* mundo */}
        <div style={{ position: 'relative', flex: 1, margin: `${px(2)} ${px(3)}`, minHeight: 0 }}>
          <div className="px-notch" style={{ position: 'absolute', inset: 0, background: C.line, padding: 'var(--p)' }}>
            <div style={{
              position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
              background: '#20301c', display: 'grid', placeItems: 'center',
            }}>
              <canvas
                ref={tela}
                width={VISAO_L * TILE}
                height={VISAO_A * TILE}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  imageRendering: 'pixelated', display: 'block',
                }}
              />
              {!pronto && (
                <div style={{ position: 'absolute', ...T.rotulo, color: C.lineSoft }}>CARREGANDO…</div>
              )}
            </div>
          </div>

          {/* caixa de texto por cima, em HTML: fonte nítida em qualquer tela */}
          {conversa && (
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5,
              display: 'flex', flexDirection: 'column', gap: px(2), padding: px(2),
              // explicação comprida não pode empurrar o jogo para fora da
              // tela: a caixa para de crescer e passa a rolar por dentro
              maxHeight: '76%', overflowY: 'auto',
            }}>
              {conversa.tipo !== 'escolha' && (
                <Caixa>
                  {conversa.tipo === 'fala' && (
                    <div style={{ ...T.rotulo, color: C.rust, marginBottom: px(2) }}>{conversa.quem}</div>
                  )}
                  <div style={{ ...T.corpo, color: C.paperInk, whiteSpace: 'pre-line' }}>{conversa.texto}</div>
                  <div
                    onClick={avanca}
                    className="px-blink"
                    style={{ ...T.rotulo, color: C.paperSoft, textAlign: 'right', marginTop: px(2), cursor: 'pointer' }}
                  >▼</div>
                </Caixa>
              )}

              {conversa.tipo === 'escolha' && (
                <>
                  <Caixa>
                    <div style={{ ...T.corpo, color: C.paperInk }}>{conversa.encontro.pergunta}</div>
                  </Caixa>
                  <Caixa padding={false}>
                    {conversa.encontro.escolhas.map((o, i) => (
                      <Opcao key={i} divisor={i > 0} onClick={() => escolhe(i)}>{o.label}</Opcao>
                    ))}
                  </Caixa>
                </>
              )}
            </div>
          )}

          {/* toque em qualquer lugar da cena avança a fala */}
          {conversa?.tipo === 'fala' && (
            <div onClick={avanca} style={{ position: 'absolute', inset: 0, zIndex: 4 }} />
          )}
        </div>

        <Controles
          aperta={encara}
          solta={() => { jogo.current.apertado = null; }}
          acao={interage}
        />
      </div>
    </div>
  );
}

// ── desenho ──────────────────────────────────────────────

interface EstadoJogo {
  x: number; y: number; olhando: Dir; passo: Passo | null;
  quadro: number; cena: Cena;
}

function desenha(
  ctx: CanvasRenderingContext2D,
  g: EstadoJogo,
  arte: Record<string, HTMLImageElement>,
) {
  const ts = arte.tileset;
  const mapa = g.cena.mapa;
  const larg = mapa.chao[0].length, alt = mapa.chao.length;

  // posição do jogador em pixels, interpolada entre duas casas
  const p = g.passo;
  const jx = (p ? p.ox + p.dx * p.t : g.x) * TILE;
  const jy = (p ? p.oy + p.dy * p.t : g.y) * TILE;

  // câmera centrada, presa dentro do mapa
  const meioX = (VISAO_L * TILE) / 2 - TILE / 2;
  const meioY = (VISAO_A * TILE) / 2 - TILE / 2;
  const camX = Math.round(Math.max(0, Math.min(jx - meioX, larg * TILE - VISAO_L * TILE)));
  const camY = Math.round(Math.max(0, Math.min(jy - meioY, alt * TILE - VISAO_A * TILE)));

  ctx.fillStyle = '#20301c';
  ctx.fillRect(0, 0, VISAO_L * TILE, VISAO_A * TILE);
  if (!ts?.complete || !ts.naturalWidth) return;

  const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
  for (let y = y0; y <= y0 + VISAO_A; y++) {
    for (let x = x0; x <= x0 + VISAO_L; x++) {
      const ch = mapa.chao[y]?.[x];
      const t = CHAO[ch ?? '#'] ?? CHAO['#'];
      ctx.drawImage(ts, t.c * TILE, t.r * TILE, TILE, TILE,
        x * TILE - camX, y * TILE - camY, TILE, TILE);
    }
  }

  // tudo que tem pé entra numa lista só e é ordenado por ele
  interface Sprite { pe: number; desenhar: () => void }
  const fila: Sprite[] = [];

  for (const o of mapa.objetos) {
    const pc = PECAS[o.peca];
    if (!pc) continue;
    if (o.x + pc.l < x0 - 1 || o.x > x0 + VISAO_L + 1) continue;
    if (o.y + pc.a < y0 - 1 || o.y > y0 + VISAO_A + 1) continue;
    fila.push({
      pe: (o.y + pc.a) * TILE,
      desenhar: () => ctx.drawImage(ts, pc.c * TILE, pc.r * TILE, pc.l * TILE, pc.a * TILE,
        o.x * TILE - camX, o.y * TILE - camY, pc.l * TILE, pc.a * TILE),
    });
  }

  for (const n of mapa.npcs) {
    const folha = arte[n.arte];
    if (!folha?.complete) continue;
    fila.push({
      pe: (n.y + 1) * TILE,
      desenhar: () => ctx.drawImage(folha, n.olhando * TILE, 0, TILE, TILE,
        n.x * TILE - camX, n.y * TILE - camY, TILE, TILE),
    });
  }

  const heroi = arte.p3;
  if (heroi?.complete) {
    fila.push({
      pe: jy + TILE,
      desenhar: () => ctx.drawImage(heroi, g.olhando * TILE, g.quadro * TILE, TILE, TILE,
        Math.round(jx - camX), Math.round(jy - camY), TILE, TILE),
    });
  }

  fila.sort((a, b) => a.pe - b.pe);
  for (const s of fila) s.desenhar();
}

// ── peças de tela ────────────────────────────────────────

function Caixa({ children, padding = true }: { children: React.ReactNode; padding?: boolean }) {
  const px = (n: number) => `calc(var(--p) * ${n})`;
  return (
    <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }}>
      <div className="px-notch" style={{
        background: C.paper, padding: padding ? `${px(3)} ${px(3)}` : 0,
      }}>
        {children}
      </div>
    </div>
  );
}

function Opcao({ children, onClick, divisor }: {
  children: React.ReactNode; onClick: () => void; divisor?: boolean;
}) {
  const [ativa, setAtiva] = useState(false);
  const px = (n: number) => `calc(var(--p) * ${n})`;
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setAtiva(true)}
      onPointerEnter={() => setAtiva(true)}
      onPointerLeave={() => setAtiva(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: px(2), width: '100%',
        textAlign: 'left', border: 'none', cursor: 'pointer',
        borderTop: divisor ? `var(--p) solid ${C.paperEdge}` : undefined,
        background: ativa ? C.paperEdge : 'transparent',
        padding: `${px(3)} ${px(2)}`, ...T.corpo, color: C.paperInk,
      }}
    >
      <span aria-hidden style={{ flex: 'none', width: px(4), color: ativa ? C.paperInk : C.paperSoft }}>▶</span>
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

function Controles({ aperta, solta, acao }: {
  aperta: (d: Dir) => void; solta: () => void; acao: () => void;
}) {
  const px = (n: number) => `calc(var(--p) * ${n})`;
  const b = (rotulo: string, d: Dir) => (
    <button
      onContextMenu={e => e.preventDefault()}
      onPointerDown={e => { e.preventDefault(); aperta(d); }}
      onPointerUp={solta}
      onPointerLeave={solta}
      onPointerCancel={solta}
      style={{
        width: 48, height: 48, display: 'grid', placeItems: 'center',
        background: C.shell, color: C.bone, border: `2px solid ${C.lineSoft}`,
        fontFamily: 'monospace', fontSize: 17, cursor: 'pointer',
        touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >{rotulo}</button>
  );
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: `${px(2)} ${px(4)} ${px(4)}`,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 48px)', gap: 3 }}>
        <div />{b('▲', 1)}<div />
        {b('◄', 2)}{b('▼', 0)}{b('►', 3)}
      </div>
      <button
        onContextMenu={e => e.preventDefault()}
        onPointerDown={e => { e.preventDefault(); acao(); }}
        style={{
          width: 68, height: 68, borderRadius: '50%', display: 'grid', placeItems: 'center',
          background: C.rust, color: '#fff', border: `3px solid ${C.line}`,
          ...T.titulo, cursor: 'pointer', touchAction: 'none', userSelect: 'none',
        }}
      >A</button>
    </div>
  );
}
