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
//   1. a grama, que é cor chapada, pintada de uma vez só
//   2. as manchas por cima dela — mato alto, trilha, água, canteiro,
//      concreto — cada uma escolhendo a peça pela vizinhança
//   3. objetos, NPCs e o jogador juntos numa lista só, ordenados pelo pé
//      — quem tem o pé mais embaixo desenha por último e tapa o resto.
//      É isso que faz o jogador passar ATRÁS da árvore e NA FRENTE do
//      arbusto sem nenhuma camada extra
//   4. a caixa de texto, que é HTML por cima, para a fonte ficar nítida
//
// O andar é travado na grade, como no jogo de referência: aperta a
// direção, o boneco caminha uma casa inteira e só então aceita a próxima
// ordem. Isso é o que dá o peso certo ao passo — movimento livre em
// mundo de tile sempre parece escorregadio.
//
// ARTE: pacote Cute Fantasy, de Kenmi. Ver src/game/credits.ts.
// ─────────────────────────────────────────────────────────

const TILE = 16;
const VISAO_L = 13, VISAO_A = 22;      // casas visíveis, retrato
const DUR_PASSO = 0.16;                 // segundos por casa
const BONECO = 32;                      // gente é desenhada em 32, não em 16
/** onde o pé do boneco cai dentro do quadro de 32 */
const OFX = -8, OFY = -9;

// A grama do pacote é uma cor chapada de 16x16 — pintar o fundo inteiro
// com ela sai mais barato que mil e poucos drawImage por quadro, e dá
// exatamente o mesmo pixel.
const VERDE = '#3e8948';

// ── o chão, por manchas com borda casada ────────────────
//
// Aqui estava o maior erro das versões anteriores. Eu usava UM tile por
// material — o quadradinho do meio, chapado — e por isso todo encontro
// entre grama e terra saía num degrau reto de 16 pixels. Era isso que
// deixava o campo com cara de tabuleiro.
//
// Este pacote desenha a transição de verdade: para cada material vêm as
// oito peças de borda, os quatro cantos côncavos (aqueles que fecham a
// quina quando a mancha faz uma dobra para dentro) e três variações do
// miolo com cascalho. O truque que aproveita tudo isso é ter apagado o
// verde chapado do fundo das folhas na hora de gerar os arquivos: sem
// ele, cada mancha vira um decalque que pode ser posto por cima de
// qualquer chão, e não um retângulo que apaga o que estava embaixo.
//
// Mato alto e concreto não vinham no pacote. Foram tirados da MESMA
// silhueta da trilha, só repintados — assim herdam de graça as bordas
// recortadas e os cantos, e nada destoa.
type Material = 'grama' | 'escura' | 'terra' | 'agua' | 'horta' | 'piso';

const MATERIAL: Record<string, Material> = {
  '.': 'grama', ',': 'escura', '#': 'grama', ' ': 'grama',
  't': 'terra', '~': 'agua', 'h': 'horta', '=': 'piso',
};
const SOLIDO_CHAO = new Set(['#', '~']);

interface Camada { folha: string; simples?: boolean }
/** grama não entra: é o fundo, não uma mancha */
const CAMADA: Partial<Record<Material, Camada>> = {
  escura: { folha: 'escura' },
  piso: { folha: 'piso' },
  agua: { folha: 'agua' },
  horta: { folha: 'horta', simples: true },
  terra: { folha: 'trilha' },
};

/**
 * Qual peça da folha de transição usar, olhando os oito vizinhos.
 * A folha é 3x6: linhas 0-2 são as bordas e o miolo, linhas 3-4 são os
 * quatro cantos côncavos e a linha 5 traz variações do miolo.
 */
function pedaco(
  n: boolean, s: boolean, o: boolean, l: boolean,
  no: boolean, ne: boolean, so: boolean, se: boolean,
  simples: boolean, v: number,
): [number, number] {
  const cx = o ? (l ? 1 : 2) : 0;
  const cy = n ? (s ? 1 : 2) : 0;
  if (cx !== 1 || cy !== 1) return [cx, cy];
  if (simples) return [1, 1];
  // rodeado dos quatro lados, mas com uma quina faltando: canto côncavo
  if (!se) return [0, 3];
  if (!so) return [1, 3];
  if (!ne) return [0, 4];
  if (!no) return [1, 4];
  return v < 0.09 ? [Math.floor(v / 0.03), 5] : [1, 1];
}

// ── peças de objeto ─────────────────────────────────────
//
// Os recortes são em PIXEL, não em casa: neste pacote quase nada começa
// na quina do tile — o carvalho, por exemplo, tem onze pixels de folga à
// esquerda. Recorte estimado na grade puxava pedaço do vizinho, e era
// isso que deixava casa cortada e vaso pela metade na tela.
//
// `l` e `a` são o que a peça OCUPA no mapa, em casas; `cy`/`ca` limitam
// a colisão a uma faixa. Árvore com cinco casas de altura só barra o
// passo nas duas de baixo — o resto é copa, e copa a gente passa atrás.
interface Peca {
  f: string;
  sx: number; sy: number; sl: number; sa: number;
  l?: number; a?: number;
  ox?: number; oy?: number;
  solido?: boolean;
  cy?: number; ca?: number;
  /** desenhado junto com o chão, fora da ordenação por pé */
  piso?: boolean;
  /** quadros de animação lado a lado, para os bichos */
  q?: number;
}

// Atenção ao escolher célula na folha de decoração: ela mistura as peças
// de mundo com os ícones de inventário das MESMAS coisas, e o ícone vem
// com um contorno creme em volta. Numa folha só isso passa despercebido;
// no chão do jogo vira adesivo recortado. As células de ícone são (4,0)
// (6,0) (4,3) (6,3) (0..2,4) e (0..2,6) — não usar.
/** peça de uma casa, tirada da folha de decoração */
const d = (c: number, r: number, extra: Partial<Peca> = {}): Peca =>
  ({ f: 'decor', sx: c * 16, sy: r * 16, sl: 16, sa: 16, ...extra });
/** bicho: quadro de 32, dois passos de animação */
const bicho = (f: string): Peca =>
  ({ f, sx: 0, sy: 0, sl: 32, sa: 32, ox: OFX, oy: OFY, q: 2, solido: true });
const copa = (f: string): Peca =>
  ({ f, sx: 0, sy: 0, sl: 64, sa: 80, l: 4, a: 5, solido: true, cy: 3, ca: 2 });

const PECAS: Record<string, Peca> = {
  casa: { f: 'casa', sx: 0, sy: 0, sl: 96, sa: 128, l: 6, a: 8, solido: true },

  arvore: copa('arvore'),
  arvoreMata: copa('arvoreMata'),
  arvoreSeca: copa('arvoreSeca'),
  arvoreMedia: { f: 'arvore2', sx: 32, sy: 0, sl: 32, sa: 48, l: 2, a: 3, solido: true, cy: 2, ca: 1 },
  arvoreMediaSeca: { f: 'arvore2Seca', sx: 32, sy: 0, sl: 32, sa: 48, l: 2, a: 3, solido: true, cy: 2, ca: 1 },
  arvorePeq: { f: 'arvore2', sx: 64, sy: 0, sl: 32, sa: 32, l: 2, a: 2, solido: true, cy: 1, ca: 1 },
  arvorePeqSeca: { f: 'arvore2Seca', sx: 64, sy: 0, sl: 32, sa: 32, l: 2, a: 2, solido: true, cy: 1, ca: 1 },

  cercaH: { f: 'cerca', sx: 32, sy: 0, sl: 16, sa: 16, solido: true },
  cercaV: { f: 'cerca', sx: 0, sy: 16, sl: 16, sa: 16, solido: true },
  // ponte é chão, não objeto: entra antes da fila de profundidade, senão
  // o tabuado passa por cima de quem está atravessando
  ponteH: { f: 'ponte', sx: 0, sy: 16, sl: 48, sa: 48, l: 3, a: 3, piso: true },
  ponteV: { f: 'ponte', sx: 56, sy: 16, sl: 32, sa: 48, l: 2, a: 3, piso: true },
  bau: { f: 'bau', sx: 0, sy: 0, sl: 16, sa: 16, solido: true },

  poste: { f: 'decor', sx: 64, sy: 64, sl: 16, sa: 48, l: 1, a: 3, solido: true, cy: 2, ca: 1 },
  tora: { f: 'decor', sx: 0, sy: 112, sl: 32, sa: 16, l: 2, a: 1, solido: true },

  tufo: d(0, 0), tufo2: d(1, 0), tufo3: d(2, 0),
  placa: d(3, 0, { solido: true }), placa2: d(5, 0, { solido: true }),
  florAmarela: d(0, 1), florLaranja: d(1, 1), florBranca: d(2, 1),
  brotinho: d(3, 1), broto: d(4, 1), moitaRasteira: d(5, 1), capimAlto: d(6, 1),
  tocoSeco: d(0, 2, { solido: true }), pedrinhas: d(1, 2), pedras: d(2, 2),
  mudaSolo: d(3, 2), cenoura: d(4, 2), trigo: d(5, 2), trigoSeco: d(6, 2),
  pedreira: d(0, 3, { solido: true }), pedreira2: d(1, 3, { solido: true }),
  pedreira3: d(2, 3, { solido: true }), cristal: d(3, 3), cogumelo: d(2, 7),
  canteiro1: d(0, 10), canteiro2: d(1, 10), canteiro3: d(2, 10), canteiro4: d(3, 10),

  galinha: bicho('galinha'), porco: bicho('porco'),
  ovelha: bicho('ovelha'), vaca: { ...bicho('vaca'), l: 2 },
};

/** todas as folhas de imagem, e onde cada uma mora */
const FOLHAS: Record<string, string> = {
  trilha: 'cf/trilha', escura: 'cf/escura', agua: 'cf/agua',
  piso: 'cf/piso', horta: 'cf/horta', decor: 'cf/decor',
  arvore: 'cf/arvore', arvoreMata: 'cf/arvoreMata', arvoreSeca: 'cf/arvoreSeca',
  arvore2: 'cf/arvore2', arvore2Seca: 'cf/arvore2Seca',
  casa: 'cf/casa', cerca: 'cf/cerca', ponte: 'cf/ponte', bau: 'cf/bau',
  galinha: 'cf/galinha', porco: 'cf/porco', ovelha: 'cf/ovelha', vaca: 'cf/vaca',
  heroi: 'cf/heroi',
  nita: 'cf/g-nita', doril: 'cf/g-doril', vilma: 'cf/g-vilma',
  anciana: 'cf/g-anciana', teo: 'cf/g-teo', andarilho: 'cf/g-andarilho',
};

/** linha da folha de gente, por direção: parado e andando */
const PARADO = [0, 2, 1, 1];
const ANDANDO = [3, 5, 4, 4];

/** Sorteio preso à posição: mesma casa, mesma variação, toda partida. */
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
    const l = p.l ?? 1, a = p.a ?? 1;
    const y0 = o.y + (p.cy ?? 0), y1 = y0 + (p.ca ?? a);
    for (let y = y0; y < y1; y++)
      for (let x = o.x; x < o.x + l; x++)
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
    tempo: 0, andado: 0,
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
    const nomes = Object.keys(FOLHAS);
    let faltam = nomes.length;
    for (const n of nomes) {
      const img = new Image();
      img.src = `/assets/semente/${FOLHAS[n]}.png`;
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
      g.tempo += dt;

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

      if (g.passo) g.andado += dt; else g.andado = 0;

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
              background: VERDE, display: 'grid', placeItems: 'center',
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
  tempo: number; andado: number; cena: Cena;
}

/** um quadro de gente, com o lado esquerdo saindo do direito espelhado */
function boneco(
  ctx: CanvasRenderingContext2D, folha: HTMLImageElement,
  col: number, lin: number, dx: number, dy: number, espelha: boolean,
) {
  const sx = col * BONECO, sy = lin * BONECO;
  if (!espelha) {
    ctx.drawImage(folha, sx, sy, BONECO, BONECO, dx, dy, BONECO, BONECO);
    return;
  }
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(folha, sx, sy, BONECO, BONECO, -dx - BONECO, dy, BONECO, BONECO);
  ctx.restore();
}

function desenha(
  ctx: CanvasRenderingContext2D,
  g: EstadoJogo,
  arte: Record<string, HTMLImageElement>,
) {
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

  ctx.fillStyle = VERDE;
  ctx.fillRect(0, 0, VISAO_L * TILE, VISAO_A * TILE);

  // fora do mapa vale o vizinho de dentro mais próximo: assim a beirada
  // da tela não ganha franja de borda onde não existe borda nenhuma
  const mat = (x: number, y: number): Material => {
    const cx = x < 0 ? 0 : x >= larg ? larg - 1 : x;
    const cy = y < 0 ? 0 : y >= alt ? alt - 1 : y;
    return MATERIAL[mapa.chao[cy][cx]] ?? 'grama';
  };

  const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
  for (let y = y0; y <= y0 + VISAO_A; y++) {
    for (let x = x0; x <= x0 + VISAO_L; x++) {
      const m = mat(x, y);
      const cam = CAMADA[m];
      if (!cam) continue;
      const fo = arte[cam.folha];
      if (!fo?.complete || !fo.naturalWidth) continue;
      const ig = (i: number, j: number) => mat(x + i, y + j) === m;
      const [cx, cy] = pedaco(
        ig(0, -1), ig(0, 1), ig(-1, 0), ig(1, 0),
        ig(-1, -1), ig(1, -1), ig(-1, 1), ig(1, 1),
        !!cam.simples, sorteio(x, y, 3),
      );
      ctx.drawImage(fo, cx * TILE, cy * TILE, TILE, TILE,
        x * TILE - camX, y * TILE - camY, TILE, TILE);
    }
  }

  // tudo que tem pé entra numa lista só e é ordenado por ele
  interface Sprite { pe: number; desenhar: () => void }
  const fila: Sprite[] = [];

  for (const o of mapa.objetos) {
    const pc = PECAS[o.peca];
    if (!pc) continue;
    if (!pc.piso) continue;
    const fo = arte[pc.f];
    if (!fo?.complete || !fo.naturalWidth) continue;
    ctx.drawImage(fo, pc.sx, pc.sy, pc.sl, pc.sa,
      Math.round(o.x * TILE + (pc.ox ?? 0) - camX),
      Math.round(o.y * TILE + (pc.oy ?? 0) - camY), pc.sl, pc.sa);
  }

  for (const o of mapa.objetos) {
    const pc = PECAS[o.peca];
    if (!pc || pc.piso) continue;
    const l = pc.l ?? 1, a = pc.a ?? 1;
    if (o.x + l < x0 - 1 || o.x > x0 + VISAO_L + 1) continue;
    if (o.y + a < y0 - 1 || o.y > y0 + VISAO_A + 1) continue;
    const fo = arte[pc.f];
    if (!fo?.complete || !fo.naturalWidth) continue;
    const sx = pc.sx + (pc.q ? Math.floor(g.tempo / 0.7 + o.x) % pc.q * pc.sl : 0);
    const dx = Math.round(o.x * TILE + (pc.ox ?? 0) - camX);
    const dy = Math.round(o.y * TILE + (pc.oy ?? 0) - camY);
    fila.push({
      pe: (o.y + a) * TILE,
      desenhar: () => ctx.drawImage(fo, sx, pc.sy, pc.sl, pc.sa, dx, dy, pc.sl, pc.sa),
    });
  }

  for (const n of mapa.npcs) {
    const fo = arte[n.arte];
    if (!fo?.complete || !fo.naturalWidth) continue;
    // cada um respira no seu tempo, senão o povoado inteiro pisca junto
    const col = Math.floor(g.tempo / 0.22 + n.x + n.y) % 6;
    const dx = Math.round(n.x * TILE + OFX - camX);
    const dy = Math.round(n.y * TILE + OFY - camY);
    fila.push({
      pe: (n.y + 1) * TILE,
      desenhar: () => boneco(ctx, fo, col, PARADO[n.olhando], dx, dy, n.olhando === 2),
    });
  }

  const heroi = arte.heroi;
  if (heroi?.complete && heroi.naturalWidth) {
    const andando = !!g.passo;
    const lin = (andando ? ANDANDO : PARADO)[g.olhando];
    const col = andando
      ? Math.floor(g.andado / 0.08) % 6
      : Math.floor(g.tempo / 0.22) % 6;
    const dx = Math.round(jx + OFX - camX);
    const dy = Math.round(jy + OFY - camY);
    fila.push({
      pe: jy + TILE,
      desenhar: () => boneco(ctx, heroi, col, lin, dx, dy, g.olhando === 2),
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
