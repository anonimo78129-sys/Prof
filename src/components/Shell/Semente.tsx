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

// ── o chão, por camadas com borda casada ────────────────
//
// Aqui estava o maior erro da versão anterior. Eu usava UM tile por
// material — o quadradinho do meio, chapado — e por isso todo encontro
// entre grama e terra saía num degrau reto de 16 pixels. Era isso que
// deixava o campo com cara de tabuleiro.
//
// Este pacote traz o jogo completo de transições: cada material vem num
// bloco de 5x5 com as quatro beiradas e os quatro cantos desenhados, com
// a franja de terra e o capim saindo por cima. O desenho passa a ser em
// camadas, de baixo para cima:
//
//   1. terra batida no mapa inteiro, sempre
//   2. água por cima, onde houver
//   3. grama por cima, escolhendo a peça pela vizinhança
//   4. grama escura por cima da clara, pela mesma regra
//
// Quem decide a peça é a vizinhança: olha os quatro lados, vê onde o
// material acaba, e pega a beirada ou o canto correspondente. É por isso
// que a margem agora contorna em vez de cortar.
type Material = 'terra' | 'grama' | 'escura' | 'agua' | 'madeira';

const MATERIAL: Record<string, Material> = {
  '.': 'grama', ',': 'escura', ';': 'grama', '#': 'grama',
  't': 'terra', '~': 'agua', '=': 'madeira', ' ': 'grama',
};
const SOLIDO_CHAO = new Set(['#', '~']);

/** canto superior esquerdo do bloco 5x5 de cada material que tem borda */
const BLOCO: Partial<Record<Material, { c: number; r: number }>> = {
  grama: { c: 1, r: 1 },
  escura: { c: 9, r: 1 },
};
/** tiles chapados, para o que não precisa de borda */
const CHAPADO: Partial<Record<Material, { c: number; r: number }>> = {
  terra: { c: 7, r: 3 },
  agua: { c: 13, r: 6 },
  madeira: { c: 6, r: 10 },
};

/** deslocamento dentro do bloco 5x5, por combinação de lados vazios */
function pedacoDoBloco(cima: boolean, baixo: boolean, esq: boolean, dir: boolean) {
  if (!cima && !baixo && !esq && !dir) return [2, 2];
  if (cima && esq) return [1, 1];
  if (cima && dir) return [3, 1];
  if (baixo && esq) return [1, 3];
  if (baixo && dir) return [3, 3];
  if (cima) return [2, 0];
  if (baixo) return [2, 4];
  if (esq) return [0, 2];
  return [4, 2];
}

// ── peças de objeto ─────────────────────────────────────
//
// Estas coordenadas NÃO foram escolhidas no olho. Neste tileset as peças
// se encostam, sem faixa transparente entre elas, então todo recorte
// estimado puxava um pedaço do vizinho — e era isso que deixava casa
// cortada e vaso pela metade na tela.
//
// A lista abaixo saiu de uma varredura do PNG: os pixels opacos foram
// agrupados em regiões conexas e cada região devolveu seu retângulo
// exato. Onde duas peças se tocavam de verdade no desenho original, o
// grupo inteiro virou uma peça só — é por isso que o bosque é uma faixa
// de treze casas e não uma árvore avulsa. Melhor uma mata inteira certa
// que uma árvore errada.
type Folha = 'tileset' | 'bosque';
interface Peca { f?: Folha; c: number; r: number; l: number; a: number; solido?: boolean }
const PECAS: Record<string, Peca> = {
  casa: { c: 0, r: 0, l: 8, a: 3, solido: true },
  // árvores da folha de bosque: com tronco, copa e sombra própria, ao
  // contrário da faixa achatada do primeiro pacote
  arvore: { f: 'bosque', c: 17, r: 0, l: 4, a: 5, solido: true },
  arvoreMedia: { f: 'bosque', c: 17, r: 5, l: 2, a: 3, solido: true },
  pinheiro: { f: 'bosque', c: 19, r: 6, l: 2, a: 2, solido: true },
  ponte: { f: 'bosque', c: 5, r: 7, l: 3, a: 4 },
  moitaVerde: { f: 'bosque', c: 14, r: 3, l: 1, a: 1 },
  cogumelo: { f: 'bosque', c: 14, r: 4, l: 1, a: 1 },
  pedregulho: { f: 'bosque', c: 14, r: 2, l: 1, a: 1, solido: true },
  florRosa: { f: 'bosque', c: 16, r: 3, l: 1, a: 1 },
  bosqueMorto: { c: 0, r: 27, l: 6, a: 3, solido: true },
  rochedo: { c: 21, r: 0, l: 4, a: 4, solido: true },
  caverna: { c: 14, r: 9, l: 4, a: 3, solido: true },
  portal: { c: 8, r: 21, l: 3, a: 3, solido: true },
  estatua: { c: 26, r: 0, l: 2, a: 2, solido: true },
  altar: { c: 9, r: 7, l: 2, a: 2, solido: true },
  varal: { c: 8, r: 4, l: 2, a: 2, solido: true },
  carroca: { c: 5, r: 8, l: 2, a: 2, solido: true },
  carrocaCheia: { c: 7, r: 8, l: 2, a: 2, solido: true },
  caixotes: { c: 6, r: 6, l: 2, a: 2, solido: true },
  pedraGrande: { c: 12, r: 10, l: 2, a: 2, solido: true },
  toco: { c: 6, r: 18, l: 2, a: 2, solido: true },
  cerca: { c: 19, r: 0, l: 2, a: 2, solido: true },
  grade: { c: 19, r: 2, l: 2, a: 2, solido: true },
  bancada: { c: 0, r: 3, l: 3, a: 2, solido: true },
  varanda: { c: 5, r: 4, l: 3, a: 2, solido: true },
  moita: { c: 5, r: 9, l: 2, a: 1, solido: true },
  moitaSeca: { c: 7, r: 9, l: 2, a: 1, solido: true },
  poste: { c: 8, r: 18, l: 1, a: 2, solido: true },
  vaso: { c: 0, r: 37, l: 1, a: 2, solido: true },
  // miudezas de uma casa só
  pote: { c: 0, r: 6, l: 1, a: 1, solido: true },
  caixote: { c: 1, r: 6, l: 1, a: 1, solido: true },
  saco: { c: 2, r: 6, l: 1, a: 1, solido: true },
  pedra: { c: 1, r: 7, l: 1, a: 1, solido: true },
  cruz: { c: 8, r: 7, l: 1, a: 1, solido: true },
  caveira: { c: 2, r: 17, l: 1, a: 1 },
  osso: { c: 3, r: 17, l: 1, a: 1 },
  broto: { c: 1, r: 27, l: 1, a: 1 },
  girassol: { c: 3, r: 15, l: 1, a: 1 },
  margarida: { c: 1, r: 8, l: 1, a: 1 },
  flores: { c: 1, r: 21, l: 1, a: 1 },
  arbusto: { c: 0, r: 21, l: 1, a: 1, solido: true },
  canteiro: { c: 20, r: 15, l: 3, a: 3 },
};

// Miudezas espalhadas pelo chão. Sem elas o campo vira feltro verde: é a
// sujeira pequena e repetida que faz um mundo de tiles parecer lugar.
// O sorteio é por posição, então a mesma pedrinha nasce sempre no mesmo
// canto — mundo que muda a cada visita não vira mapa na cabeça de
// ninguém.
const MIUDEZAS: Peca[] = [
  { f: 'bosque', c: 7, r: 2, l: 1, a: 1 },    // tufo de capim
  { f: 'bosque', c: 6, r: 3, l: 1, a: 1 },    // tufo
  { f: 'bosque', c: 7, r: 4, l: 1, a: 1 },    // moita rasteira
  { f: 'bosque', c: 8, r: 5, l: 1, a: 1 },    // moita
  { f: 'bosque', c: 5, r: 5, l: 1, a: 1 },    // flor amarela
  { f: 'bosque', c: 16, r: 3, l: 1, a: 1 },   // flor rosa
  { f: 'bosque', c: 15, r: 2, l: 1, a: 1 },   // pedrinha
  { f: 'bosque', c: 14, r: 4, l: 1, a: 1 },   // cogumelo
  { f: 'bosque', c: 16, r: 2, l: 1, a: 1 },   // graveto
  { c: 0, r: 27, l: 1, a: 1 },                // raiz seca do outro pacote
];

const PEDRISCOS: Peca[] = [
  { f: 'bosque', c: 15, r: 2, l: 1, a: 1 },
  { f: 'bosque', c: 16, r: 2, l: 1, a: 1 },
  { c: 0, r: 27, l: 1, a: 1 },
];

/** Sorteio preso à posição: mesma casa, mesma miudeza, toda partida. */
function sorteio(x: number, y: number, semente: number) {
  let n = (x * 374761393 + y * 668265263 + semente * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

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
    Array.from({ length: larg }, (_, x) => SOLIDO_CHAO.has(mapa.chao[y][x] ?? '#')));
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
    const nomes = ['tileset', 'bosque', 'p3', 'p2', 'p4', 'p6', 'p7', 'p9', 'p12'];
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

  const bosque = arte.bosque;
  const mat = (x: number, y: number): Material =>
    MATERIAL[mapa.chao[y]?.[x] ?? '#'] ?? 'grama';
  // fora do mapa conta como o mesmo material: assim a beirada da tela
  // não ganha franja de borda onde não existe borda nenhuma
  const temCamada = (x: number, y: number, camada: Material) => {
    if (y < 0 || y >= alt || x < 0 || x >= larg) return true;
    const m = mat(x, y);
    return camada === 'grama' ? (m === 'grama' || m === 'escura') : m === camada;
  };

  const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
  if (bosque?.complete) {
    for (let y = y0; y <= y0 + VISAO_A; y++) {
      for (let x = x0; x <= x0 + VISAO_L; x++) {
        const dx = x * TILE - camX, dy = y * TILE - camY;
        const m = mat(x, y);
        const chapa = (p: { c: number; r: number }) =>
          ctx.drawImage(bosque, p.c * TILE, p.r * TILE, TILE, TILE, dx, dy, TILE, TILE);
        const camada = (nome: Material) => {
          const b = BLOCO[nome]!;
          const [ox, oy] = pedacoDoBloco(
            !temCamada(x, y - 1, nome), !temCamada(x, y + 1, nome),
            !temCamada(x - 1, y, nome), !temCamada(x + 1, y, nome),
          );
          ctx.drawImage(bosque, (b.c + ox) * TILE, (b.r + oy) * TILE, TILE, TILE,
            dx, dy, TILE, TILE);
        };

        if (m === 'madeira') { chapa(CHAPADO.madeira!); continue; }
        chapa(CHAPADO.terra!);
        if (m === 'agua') chapa(CHAPADO.agua!);
        if (m === 'grama' || m === 'escura') camada('grama');
        if (m === 'escura') camada('escura');
      }
    }
  }

  // tudo que tem pé entra numa lista só e é ordenado por ele
  interface Sprite { pe: number; desenhar: () => void }
  const fila: Sprite[] = [];

  // miudezas do chão: entram na mesma fila, então um vaso na frente
  // continua tapando o capim de trás
  for (let y = y0; y <= y0 + VISAO_A; y++) {
    for (let x = x0; x <= x0 + VISAO_L; x++) {
      const ch = mapa.chao[y]?.[x];
      const naGrama = ch === '.' || ch === ',' || ch === ';';
      const naTerra = ch === 't';
      if (!naGrama && !naTerra) continue;
      if (sorteio(x, y, 7) > (naGrama ? 0.3 : 0.14)) continue;
      // na terra só entra pedrisco e graveto; capim no meio da trilha
      // desmancharia justamente a leitura de caminho
      const lista = naGrama ? MIUDEZAS : PEDRISCOS;
      const m = lista[Math.floor(sorteio(x, y, 11) * lista.length)];
      const fo = arte[m.f ?? 'tileset'];
      if (!fo?.complete) continue;
      fila.push({
        pe: (y + 1) * TILE - 1,
        desenhar: () => ctx.drawImage(fo, m.c * TILE, m.r * TILE, TILE, TILE,
          x * TILE - camX, y * TILE - camY, TILE, TILE),
      });
    }
  }

  for (const o of mapa.objetos) {
    const pc = PECAS[o.peca];
    if (!pc) continue;
    if (o.x + pc.l < x0 - 1 || o.x > x0 + VISAO_L + 1) continue;
    if (o.y + pc.a < y0 - 1 || o.y > y0 + VISAO_A + 1) continue;
    const fo = arte[pc.f ?? 'tileset'];
    if (!fo?.complete) continue;
    fila.push({
      pe: (o.y + pc.a) * TILE,
      desenhar: () => ctx.drawImage(fo, pc.c * TILE, pc.r * TILE, pc.l * TILE, pc.a * TILE,
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
