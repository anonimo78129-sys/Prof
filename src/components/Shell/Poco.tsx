import { useEffect, useMemo, useRef, useState } from 'react';
import { C, T } from '../../game/theme';
import { playSfx } from '../../game/audio';
import {
  FASES, DESAFIOS, ORDEM, ABERTURA, DESFECHO, FINAIS,
  type Fase, type Desafio, type Fala, type Final, type PostoSentinela,
} from '../../game/poco';
import { CATALOGO, PREVIA, type Sexo } from '../../game/pocoCatalogo';
import {
  TILE, VISTA_L, VISTA_A, MUNDO_A, larguraDaVista,
  QUADRO_L, QUADRO_A, PE_NO_QUADRO, POSES, type Pose,
  PASTA_DA_CASA, opcoesDaCasa, caminhoPrevia,
  montaTraje, folhasDoTraje, type Traje, type Vestir,
  SENTINELA_L, SENTINELA_A, POSES_SENTINELA, folhaSentinela,
  BICHO_L, BICHO_A, POSES_BICHO, BICHOS, BICHO_CHAPEU, BICHO_MOCHILA,
  FOGO_FATUO, MOEDA, EMOJI, EMOCAO, MARCADOR, FOGUEIRA, PORTAL, FLECHA, AGUA,
  CEU, TOCHA, NEVASCA,
  HUD, PISO, OFFSET_ESTACAO, NOVE, FINA,
  FUNDO_FATOR, fundoUrl, FUNDO_L, FUNDO_A, FAIXA_ARVORES, ARVORES_DA_ESTACAO, TERRA,
  PECAS, FOLHA_ENFEITES, folhasDaFase, carrega,
} from './pocoArte';

// ─────────────────────────────────────────────────────────
// O POÇO — motor de plataforma
//
// Os outros jogos do app são de escolha em cima de uma ilustração parada
// (CINZAS), de grade vista de cima (SEMENTE) ou de cena 3D (SILO). Este
// é o quarto formato: rolagem lateral, pulo e queda, com o mesmo canvas
// 2D de 16 pixels do SEMENTE mas com física contínua em vez de passo
// travado na casa.
//
// A escolha continua sendo o miolo, e a Vigia é uma PAREDE: enquanto a
// resposta não vier, o caminho não abre. Errar não é game over — é uma
// flecha, uma vida, e a pergunta de volta. O que trava a passagem é
// entender com quem você está falando.
//
// COMO UM QUADRO É MONTADO
//   1. as cinco camadas do fundo, cada uma andando numa fração da câmera
//   2. o céu: nuvem sempre, sol e balão só onde ainda tem gente viva
//   3. a faixa de árvores grandes, a meio caminho entre fundo e mundo
//   4. o rio lá embaixo, que só aparece pelos buracos do chão
//   5. os enfeites de fundo, o chão bloco a bloco, o resto dos enfeites
//   6. moedas, Vigias, flechas, o bicho, o fogo-fátuo, o jogador
//   7. o CLIMA por cima de tudo: demão de cor, lanterna e vinheta —
//      é essa camada que faz a arte de dia claro do pacote virar noite
//   8. os balões de emoção, que precisam ficar acima do escuro
//
// O traje do jogador é achatado numa folha só antes da fase começar
// (ver montaTraje): no laço, o boneco custa um `drawImage`, não onze.
//
// ARTE: pacotes de GandalfHardcore (gandalfhardcore.itch.io).
// ─────────────────────────────────────────────────────────

// ── física ──────────────────────────────────────────────
//
// Os números foram escolhidos juntos, não um a um. Com esta gravidade e
// este impulso o pulo sobe 68 pixels, ou seja, pouco mais de quatro
// casas: é o que garante que TODA saliência do mapa esteja ao alcance de
// um pulo só. E o tempo de voo, multiplicado pela corrida, dá 109
// pixels de avanço — os vãos do mapa têm no máximo 5 casas (80 pixels),
// então nenhum salto do jogo depende de acerto no quadro exato.
const GRAVIDADE = 800;
const V_ANDAR = 82;
const V_CORRER = 132;
const V_PULO = 330;
/** depois de sair da beirada, ainda dá para pular por um instante */
const PERDAO_BEIRADA = 0.1;
/** apertar pulo um pouco antes de encostar no chão continua valendo */
const PULO_GUARDADO = 0.12;
/** meio corpo de largura, para a caixa de colisão */
const MEIA_L = 7;
const ALTURA_CORPO = 40;

const VIDA_CHEIA = 3;

type Tela = 'abertura' | 'criador' | 'jogo' | 'fim';

type Conversa =
  | { tipo: 'fala'; quem: string; texto: string; proximo: () => void }
  | { tipo: 'pergunta'; desafio: Desafio; sentinela: string; ordem: number[] }
  | { tipo: 'resposta'; texto: string; certa: boolean; desafio: Desafio; sentinela: string }
  /** a última: dois fins escritos, e nenhum deles é o certo */
  | { tipo: 'final' };

interface Moeda { x: number; y: number; pega: boolean }
interface Sentinela extends PostoSentinela {
  resolvida: boolean;
  pose: keyof typeof POSES_SENTINELA;
  t: number;
  /** já contou a história dela; na segunda tentativa vai direto à pergunta */
  apresentada: boolean;
  /** relógio até quando ela ignora o jogador, para a flecha ter tempo de voar */
  espera: number;
  /** quanto ela já andou para o lado depois de abrir a passagem, em pixels */
  saiu: number;
}
interface Flecha { x: number; y: number; vx: number; viva: boolean }
interface Balao { x: number; y: number; emocao: number; t: number }

interface Estado {
  x: number; y: number; vx: number; vy: number;
  noChao: boolean; olhando: 1 | -1;
  pose: Pose; tp: number;
  desdeChao: number; pedidoPulo: number;
  /** relógio da última vez que o retorno foi gravado */
  marcou: number;
  /** enquanto isso não vence, a animação manda e o comando não */
  travado: number;
  poseTravada: Pose | null;
  andando: number;
  vida: number; invencivel: number;
  moedas: number;
  retorno: { x: number; y: number };
  cam: number;
  t: number;
}

/**
 * Em que ordem as alternativas aparecem.
 *
 * No arquivo de conteúdo a resposta certa foi escrita sempre logo depois
 * da primeira armadilha, porque é assim que o texto se lê melhor — mas
 * na tela isso vira um padrão, e aluno que percebe padrão para de ler as
 * alternativas. A ordem embaralha a partir do nome do desafio: muda de
 * pergunta para pergunta e continua a MESMA em toda partida, para o
 * professor projetar a mesma tela que o aluno vê.
 */
function ordemDas(d: Desafio): number[] {
  let semente = 0;
  for (const ch of d.id) semente = (semente * 91 + ch.charCodeAt(0)) >>> 0;
  const ordem = d.escolhas.map((_, i) => i);
  for (let i = ordem.length - 1; i > 0; i--) {
    semente = (semente * 1664525 + 1013904223) >>> 0;
    const j = semente % (i + 1);
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return ordem;
}

// ── mundo montado a partir dos dados da fase ────────────

interface Mundo {
  fase: Fase;
  solido: Uint8Array;      // grade largura x MUNDO_A
  largura: number;
  moedas: Moeda[];
  sentinelas: Sentinela[];
  flechas: Flecha[];
  baloes: Balao[];
}

function montaMundo(fase: Fase): Mundo {
  const largura = fase.largura;
  const solido = new Uint8Array(largura * MUNDO_A);
  for (const b of fase.blocos) {
    // bloco que chega ao pé do mundo é chão de verdade e desce até o
    // fim; sem isso sobraria uma tira de céu embaixo de toda a trilha
    const ate = b.y + b.a >= MUNDO_A - 1 ? MUNDO_A : b.y + b.a;
    for (let y = Math.max(0, b.y); y < ate; y++)
      for (let x = Math.max(0, b.x); x < Math.min(largura, b.x + b.l); x++)
        solido[y * largura + x] = 1;
  }
  return {
    fase, solido, largura,
    moedas: fase.moedas.map(([x, y]) => ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2, pega: false })),
    sentinelas: fase.sentinelas.map((s) => ({
      ...s, resolvida: false, pose: 'parada' as const, t: 0, apresentada: false, espera: 0, saiu: 0,
    })),
    flechas: [],
    baloes: [],
  };
}

/** a Sentinela não resolvida vira parede: a casa logo depois dela fecha */
function bloqueada(m: Mundo, tx: number, ty: number) {
  if (ty < 0 || ty >= MUNDO_A) return false;
  for (const s of m.sentinelas) if (!s.resolvida && tx === s.x + 2) return true;
  return false;
}

function duro(m: Mundo, tx: number, ty: number) {
  if (tx < 0 || tx >= m.largura) return true;      // as bordas seguram
  if (ty < 0) return false;
  if (ty >= MUNDO_A) return false;                  // embaixo é o rio
  return m.solido[ty * m.largura + tx] === 1 || bloqueada(m, tx, ty);
}

/** algum ponto da caixa do corpo encosta em chão sólido? */
function encosta(m: Mundo, x: number, y: number) {
  const x0 = Math.floor((x - MEIA_L) / TILE), x1 = Math.floor((x + MEIA_L - 1) / TILE);
  const y0 = Math.floor((y - ALTURA_CORPO) / TILE), y1 = Math.floor((y - 1) / TILE);
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++)
      if (duro(m, tx, ty)) return true;
  return false;
}

// ── desenho ─────────────────────────────────────────────

function quadroDe(t: number, n: number, fps: number, uma = false) {
  const i = Math.floor(t * fps);
  return uma ? Math.min(i, n - 1) : i % n;
}

/** um bloco de chão, recortado em nove pedaços da folha da estação */
function desenhaBloco(
  ctx: CanvasRenderingContext2D, piso: HTMLImageElement, terra: HTMLImageElement | undefined,
  oy: number, bx: number, by: number, bl: number, ba: number, camX: number,
) {
  const ate = by + ba >= MUNDO_A - 1 ? MUNDO_A : by + ba;
  const fina = ate - by <= 2;
  const tabela = fina ? FINA : NOVE;
  for (let y = by; y < ate; y++) {
    const linha = y === by ? 'c' : (!fina && y === ate - 1 && ate < MUNDO_A ? 'b' : 'm');
    for (let x = bx; x < bx + bl; x++) {
      const col = x === bx ? 'e' : (x === bx + bl - 1 ? 'd' : 'm');
      const dx = x * TILE - camX, dy = y * TILE;
      // miolo de bloco alto: terra clara em vez do preto da folha de piso
      if (!fina && linha === 'm' && col === 'm' && terra?.naturalWidth) {
        ctx.drawImage(terra, TERRA.x, TERRA.y, TILE, TILE, dx, dy, TILE, TILE);
        continue;
      }
      const chave = (fina && linha === 'm' ? 'b' : linha) + col as keyof typeof NOVE;
      const [sx, sy] = (tabela as Record<string, readonly number[]>)[chave] ?? NOVE.mm;
      ctx.drawImage(piso, sx, sy + oy, TILE, TILE, dx, dy, TILE, TILE);
    }
  }
}

// ── componente ──────────────────────────────────────────

export default function Poco({ onSair }: { onSair: () => void }) {
  const tela = useRef<HTMLCanvasElement>(null);
  const elmo = useRef<HTMLCanvasElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  // A largura da janela do jogo acompanha o formato da tela; a altura
  // nunca muda. Fica num ref, e não em estado, porque quem lê isso é o
  // laço de desenho — sessenta vezes por segundo, fora do React.
  const janela = useRef({ l: VISTA_L, a: VISTA_A });
  const [vista, setVista] = useState<Tela>('abertura');
  const [faseIdx, setFaseIdx] = useState(0);
  const [pronto, setPronto] = useState(false);
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [resolvidos, setResolvidos] = useState<string[]>([]);
  const [placar, setPlacar] = useState({ vida: VIDA_CHEIA, moedas: 0 });
  const [final, setFinal] = useState<Final | null>(null);

  const [traje, setTraje] = useState<Traje>(() => trajePadrao('m'));
  const [bicho, setBicho] = useState(BICHOS[0].id);

  const arte = useRef<Record<string, HTMLImageElement>>({});
  const folhaJogador = useRef<HTMLCanvasElement | null>(null);
  const folhaIara = useRef<HTMLCanvasElement | null>(null);
  const mundo = useRef<Mundo | null>(null);
  const rastro = useRef<{ x: number; y: number; t: number }[]>([]);
  const conversaRef = useRef<Conversa | null>(null);
  conversaRef.current = conversa;

  const fase = FASES[faseIdx];

  const jogo = useRef<Estado>({
    x: 0, y: 0, vx: 0, vy: 0, noChao: false, olhando: 1,
    pose: 'parado', tp: 0, desdeChao: 0, pedidoPulo: -1, marcou: 0,
    travado: 0, poseTravada: null, andando: 0,
    vida: VIDA_CHEIA, invencivel: 0, moedas: 0,
    retorno: { x: 0, y: 0 }, cam: 0, t: 0,
  });
  const teclas = useRef({ esq: false, dir: false, pulo: false });

  // ── carrega a fase ──
  useEffect(() => {
    if (vista !== 'jogo') return;
    let vivo = true;
    setPronto(false);
    const cores = [...new Set(fase.sentinelas.map((s) => s.cor))];
    const trajeIara: Traje = { ...IARA, sexo: IARA.sexo };
    const urls = [
      ...folhasDaFase(fase.id, cores),
      ...folhasDoTraje(traje),
      ...folhasDoTraje(trajeIara),
      BICHOS.find((b) => b.id === bicho)!.url,
      BICHO_CHAPEU, BICHO_MOCHILA,
    ];
    carrega(urls).then((imgs) => {
      if (!vivo) return;
      arte.current = { ...arte.current, ...imgs };
      folhaJogador.current = montaTraje(traje, arte.current);
      folhaIara.current = montaTraje(trajeIara, arte.current);
      const m = montaMundo(fase);
      mundo.current = m;
      const g = jogo.current;
      g.x = fase.inicio.x * TILE; g.y = fase.inicio.y * TILE + TILE;
      g.vx = 0; g.vy = 0; g.cam = 0; g.t = 0;
      g.vida = VIDA_CHEIA; g.invencivel = 0; g.moedas = 0;
      g.retorno = { x: g.x, y: g.y };
      rastro.current = [];
      setPlacar({ vida: VIDA_CHEIA, moedas: 0 });
      setPronto(true);
    });
    return () => { vivo = false; };
  }, [vista, faseIdx, traje, bicho, fase]);

  // ── a janela acompanha o formato da tela ──
  useEffect(() => {
    if (vista !== 'jogo') return;
    const ajusta = () => {
      const cv = tela.current, box = palco.current;
      if (!cv || !box) return;
      const l = larguraDaVista(box.clientWidth / Math.max(1, box.clientHeight));
      if (cv.width === l && cv.height === VISTA_A) return;
      janela.current = { l, a: VISTA_A };
      cv.width = l; cv.height = VISTA_A;
      // mexer em width zera o contexto, inclusive o filtro; sem religar
      // isto o pixel volta a sair borrado depois de girar o aparelho
      const ctx = cv.getContext('2d');
      if (ctx) ctx.imageSmoothingEnabled = false;
    };
    ajusta();
    const obs = new ResizeObserver(ajusta);
    if (palco.current) obs.observe(palco.current);
    window.addEventListener('orientationchange', ajusta);
    return () => { obs.disconnect(); window.removeEventListener('orientationchange', ajusta); };
  }, [vista, pronto]);

  // ── laço ──
  useEffect(() => {
    if (vista !== 'jogo' || !pronto) return;
    const cv = tela.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    let vivo = true, antes = performance.now();
    const passo = (agora: number) => {
      if (!vivo) return;
      const dt = Math.min((agora - antes) / 1000, 0.04);
      antes = agora;
      if (!conversaRef.current) anda(dt);
      desenha(ctx);
      const ctxHud = elmo.current?.getContext('2d');
      if (ctxHud) { ctxHud.imageSmoothingEnabled = false; desenhaHud(ctxHud); }
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, pronto, faseIdx]);

  // ── um passo do mundo ──
  function anda(dt: number) {
    const m = mundo.current;
    if (!m) return;
    const g = jogo.current;
    g.t += dt;

    // Momentos em que a animação manda: o tombo e a comemoração. Sem
    // isso o boneco cai e levanta no mesmo quadro, e acertar a pergunta
    // não tem nenhuma consequência visível no mundo.
    const preso = g.travado > g.t;
    if (!preso && g.poseTravada === 'tombo') {
      g.poseTravada = null;
      g.x = g.retorno.x; g.y = g.retorno.y; g.vx = 0; g.vy = 0;
      g.vida = VIDA_CHEIA;
      rastro.current = [];
      setPlacar((pl) => ({ ...pl, vida: g.vida }));
    } else if (!preso) g.poseTravada = null;

    const k = teclas.current;
    const dir = preso ? 0 : (k.dir ? 1 : 0) - (k.esq ? 1 : 0);

    // correr não é botão: quem segura a direção por meio segundo passa a
    // correr sozinho. Um botão a mais na tela do celular custaria mais
    // do que a corrida vale.
    if (dir !== 0) { g.andando += dt; g.olhando = dir as 1 | -1; }
    else g.andando = 0;
    const correndo = g.andando > 0.45;
    const alvo = dir * (correndo ? V_CORRER : V_ANDAR);
    // aceleração em vez de velocidade direta: o boneco tem peso
    g.vx += (alvo - g.vx) * Math.min(1, dt * (g.noChao ? 16 : 7));

    if (k.pulo && !preso) g.pedidoPulo = g.t;
    const podePular = g.noChao || g.t - g.desdeChao < PERDAO_BEIRADA;
    if (podePular && g.t - g.pedidoPulo < PULO_GUARDADO) {
      g.vy = -V_PULO; g.noChao = false; g.pedidoPulo = -1;
      playSfx('tap', 0.35);
    }
    // soltar o botão no meio da subida corta o pulo: é o que dá controle
    // fino de altura sem precisar de dois botões
    if (!k.pulo && g.vy < -V_PULO * 0.35) g.vy = -V_PULO * 0.35;

    g.vy = Math.min(g.vy + GRAVIDADE * dt, 520);

    // ── colisão, um eixo de cada vez ──
    const nx = g.x + g.vx * dt;
    if (!encosta(m, nx, g.y)) g.x = nx;
    else {
      // encostou na parede: encaixa rente e zera a velocidade
      g.vx = 0;
      const passoFino = Math.sign(nx - g.x);
      for (let i = 1; i <= Math.abs(nx - g.x); i++)
        if (!encosta(m, g.x + passoFino, g.y)) g.x += passoFino; else break;
    }

    const ny = g.y + g.vy * dt;
    if (!encosta(m, g.x, ny)) {
      if (g.noChao) g.desdeChao = g.t;
      g.noChao = false;
      g.y = ny;
    } else {
      const dirY = Math.sign(g.vy);
      for (let i = 1; i <= Math.abs(ny - g.y); i++)
        if (!encosta(m, g.x, g.y + dirY)) g.y += dirY; else break;
      if (g.vy > 0) { g.noChao = true; g.desdeChao = g.t; }
      g.vy = 0;
    }
    g.x = Math.max(TILE / 2, Math.min(m.largura * TILE - TILE / 2, g.x));

    // ── pose ──
    const posAnterior = g.pose;
    if (g.poseTravada) g.pose = g.poseTravada;
    else g.pose = !g.noChao ? 'pular' : Math.abs(g.vx) > 8 ? (correndo ? 'correr' : 'andar') : 'parado';
    g.tp = g.pose === posAnterior ? g.tp + dt : 0;
    // parado tempo demais, ele acena — o boneco continua vivo na tela
    // enquanto o aluno lê a explicação da Sentinela
    if (g.pose === 'parado' && g.tp > 6 && g.tp % 6 < 0.6) g.pose = 'aceno';

    // ── ponto de retorno ──
    // Cair no rio devolve o jogador ao último chão firme que ele pisou,
    // não à fogueira lá atrás: um buraco custa uma vida e dez passos, e
    // não a fase inteira. A fogueira ficou com o papel de curar.
    if (g.noChao && g.t - g.marcou > 0.25 && duro(m, Math.floor(g.x / TILE), Math.floor(g.y / TILE))) {
      g.marcou = g.t;
      g.retorno = { x: g.x, y: g.y };
    }

    // ── caiu no rio ──
    if (g.y > MUNDO_A * TILE + 48) machuca(g, 'queda');

    // ── rastro para o bicho ──
    rastro.current.push({ x: g.x, y: g.y, t: g.t });
    while (rastro.current.length > 2 && g.t - rastro.current[0].t > 1.2) rastro.current.shift();

    // ── moedas ──
    for (const mo of m.moedas) {
      if (mo.pega) continue;
      if (Math.abs(mo.x - g.x) < 12 && Math.abs(mo.y - (g.y - 20)) < 22) {
        mo.pega = true; g.moedas++;
        playSfx('select', 0.4);
        setPlacar((p) => ({ ...p, moedas: g.moedas }));
      }
    }

    // ── fogueira: descanso ──
    for (const [fx, fy] of m.fase.fogueiras) {
      const px = fx * TILE + TILE, py = fy * TILE;
      if (Math.abs(px - g.x) < 20 && Math.abs(py - g.y) < 40 && g.vida < VIDA_CHEIA) {
        g.vida = VIDA_CHEIA;
        playSfx('correct', 0.35);
        setPlacar((pl) => ({ ...pl, vida: g.vida }));
      }
    }

    // ── Sentinelas ──
    for (const s of m.sentinelas) {
      s.t += dt;
      // resolvida, ela dá alguns passos para trás e sai do meio do
      // caminho — abrir a passagem tem que dar para VER, não só sentir
      if (s.resolvida && s.saiu < 22) {
        s.saiu = Math.min(22, s.saiu + dt * 26);
        s.pose = s.saiu < 22 ? 'andar' : 'parada';
      }
      const sx = s.x * TILE + TILE / 2;
      if (!s.resolvida && s.espera < g.t && Math.abs(sx - g.x) < 34 && Math.abs(s.y * TILE - g.y) < 48) {
        abreDesafio(s);
      }
    }

    // ── flechas ──
    for (const f of m.flechas) {
      if (!f.viva) continue;
      f.x += f.vx * dt;
      if (Math.abs(f.x - g.x) < 12 && Math.abs(f.y - (g.y - 22)) < 22) {
        f.viva = false; machuca(g, 'flecha');
      }
      if (f.x < g.cam - 40 || f.x > g.cam + janela.current.l + 40) f.viva = false;
    }
    m.flechas = m.flechas.filter((f) => f.viva);

    for (const b of m.baloes) b.t += dt;
    m.baloes = m.baloes.filter((b) => b.t < 1.1);

    if (g.invencivel > 0) g.invencivel -= dt;

    // ── portal ──
    const px = m.fase.portal.x * TILE, py = m.fase.portal.y * TILE;
    if (Math.abs(px - g.x) < 22 && Math.abs(py - g.y) < 44) terminaFase();

    // ── câmera ──
    // a câmera persegue com folga: dentro de uma faixa central o jogador
    // anda sem arrastar o mundo, e é isso que impede o cenário de tremer
    // a cada correção de meio pixel
    const alvoCam = g.x - janela.current.l * (g.olhando > 0 ? 0.42 : 0.58);
    g.cam += (alvoCam - g.cam) * Math.min(1, dt * 4);
    g.cam = Math.max(0, Math.min(m.largura * TILE - janela.current.l, g.cam));
  }

  function machuca(g: Estado, causa: 'flecha' | 'queda') {
    if (g.invencivel > 0 && causa === 'flecha') return;
    g.vida--;
    g.invencivel = 1.3;
    playSfx('hurt', 0.6);
    // quem caiu volta ao chão firme antes de qualquer outra coisa: o
    // tombo não pode ser animado no fundo do vale, fora da tela
    if (causa === 'queda') {
      g.x = g.retorno.x; g.y = g.retorno.y; g.vx = 0; g.vy = 0;
      rastro.current = [];
    }
    if (g.vida <= 0) {
      g.travado = g.t + 1.1; g.poseTravada = 'tombo'; g.tp = 0;
      g.vx = 0;
    } else if (causa === 'flecha') {
      g.vx = -g.olhando * 90; g.vy = -140;
    }
    setPlacar((p) => ({ ...p, vida: g.vida }));
  }

  // ── conversa ──
  function abreDesafio(s: Sentinela) {
    if (conversaRef.current) return;
    const d = DESAFIOS[s.desafio];
    // o mundo já para sozinho enquanto há conversa; zerar as teclas aqui
    // obrigaria quem joga no teclado a soltar e apertar a direção de novo
    // depois de cada resposta
    teclas.current.pulo = false;
    // quem já ouviu a história dela uma vez não ouve de novo: na segunda
    // tentativa a Sentinela repete só a pergunta
    const ordem = ordemDas(d);
    if (s.apresentada) { setConversa({ tipo: 'pergunta', desafio: d, sentinela: s.id, ordem }); return; }
    s.apresentada = true;
    let i = 0;
    const seguir = () => {
      if (i < d.fala.length) {
        const f = d.fala[i++];
        setConversa({ tipo: 'fala', quem: f.quem, texto: f.texto, proximo: seguir });
      } else {
        setConversa({ tipo: 'pergunta', desafio: d, sentinela: s.id, ordem });
      }
    };
    seguir();
  }

  /** o jogador fecha os olhos, ou não */
  function decide(f: Final) {
    playSfx(f.titulo === 'DOIS SUBIRAM' ? 'victory' : 'wrong', 0.55);
    setFinal(f);
    setConversa(null);
    setVista('fim');
  }

  function escolhe(i: number) {
    const c = conversaRef.current;
    if (c?.tipo !== 'pergunta') return;
    const op = c.desafio.escolhas[c.ordem[i]];
    playSfx(op.certa ? 'correct' : 'wrong', 0.6);
    setConversa({
      tipo: 'resposta', texto: op.resultado, certa: op.certa,
      desafio: c.desafio, sentinela: c.sentinela,
    });
  }

  function avanca() {
    const c = conversaRef.current;
    if (!c) return;
    if (c.tipo === 'fala') { c.proximo(); return; }
    if (c.tipo !== 'resposta') return;
    const m = mundo.current;
    const s = m?.sentinelas.find((x) => x.id === c.sentinela);
    if (c.certa) {
      if (s) { s.resolvida = true; s.pose = 'parada'; s.t = 0; }
      setResolvidos((r) => (r.includes(c.desafio.id) ? r : [...r, c.desafio.id]));
      playSfx('gate', 0.5);
      // o boneco comemora: a passagem aberta tem que aparecer no mundo,
      // e não só no contador do topo
      const g = jogo.current;
      g.travado = g.t + 1.1; g.poseTravada = 'festa'; g.tp = 0;
      if (m) m.baloes.push({
        x: (s?.x ?? 0) * TILE + TILE / 2, y: (s?.y ?? 0) * TILE - 46,
        emocao: EMOCAO.duvida, t: 0,
      });
      // a última coisa que ela diz é o resumo em uma linha, dito de
      // passagem — é o que fica na cabeça depois da explicação comprida
      const quem = c.desafio.fala[0]?.quem ?? 'SENTINELA';
      setConversa({ tipo: 'fala', quem, texto: c.desafio.depois, proximo: () => setConversa(null) });
    } else {
      // errou: a Sentinela atira. A flecha custa uma vida, e a pergunta
      // volta — porque o que trava a passagem é entender, não sobreviver.
      if (s && m) {
        s.pose = 'atirar'; s.t = 0;
        const g = jogo.current;
        const sx = s.x * TILE + TILE / 2;
        m.flechas.push({
          x: sx, y: s.y * TILE - 26,
          vx: Math.sign(g.x - sx || 1) * 240, viva: true,
        });
        m.baloes.push({ x: sx, y: s.y * TILE - 46, emocao: EMOCAO.raiva, t: 0 });
        // o mundo volta a correr por um instante, senão a flecha nunca
        // sai do arco: é essa pausa que faz o erro doer
        s.espera = g.t + 1.4;
      }
      setConversa(null);
    }
  }

  function terminaFase() {
    const m = mundo.current;
    if (!m) return;
    mundo.current = null;
    playSfx('victory', 0.6);
    if (faseIdx < FASES.length - 1) {
      setFaseIdx((i) => i + 1);
      setPronto(false);
    } else {
      let i = 0;
      const seguir = () => {
        if (i < DESFECHO.length) {
          const f = DESFECHO[i++];
          setConversa({ tipo: 'fala', quem: f.quem, texto: f.texto, proximo: seguir });
        } else setConversa({ tipo: 'final' });
      };
      seguir();
    }
  }

  // ── teclado ──
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { e.preventDefault(); teclas.current.esq = true; }
      if (k === 'arrowright' || k === 'd') { e.preventDefault(); teclas.current.dir = true; }
      if (k === ' ' || k === 'arrowup' || k === 'w' || k === 'z') {
        e.preventDefault();
        if (conversaRef.current) avanca(); else teclas.current.pulo = true;
      }
      if (k === 'enter' && conversaRef.current) { e.preventDefault(); avanca(); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') teclas.current.esq = false;
      if (k === 'arrowright' || k === 'd') teclas.current.dir = false;
      if (k === ' ' || k === 'arrowup' || k === 'w' || k === 'z') teclas.current.pulo = false;
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── desenho de um quadro ──
  function desenha(ctx: CanvasRenderingContext2D) {
    const m = mundo.current;
    const g = jogo.current;
    const A = arte.current;
    if (!m) return;
    const cam = Math.round(g.cam);
    const oy = OFFSET_ESTACAO[m.fase.id];

    ctx.clearRect(0, 0, janela.current.l, VISTA_A);

    // 1. fundo em camadas, da mais longe para a mais perto
    for (let n = 5; n >= 1; n--) {
      const img = A[fundoUrl(m.fase.id, n)];
      if (!img?.naturalWidth) continue;
      const f = FUNDO_FATOR[n - 1];
      // as camadas emendam nelas mesmas: basta repetir a folha o número
      // de vezes que couber na tela, deslocada pelo resto da divisão
      let x = -(((cam * f) % FUNDO_L) + FUNDO_L) % FUNDO_L;
      const alvoA = VISTA_A + 20;
      const escala = alvoA / FUNDO_A;
      const largura = Math.ceil(FUNDO_L * escala);
      x = -(((cam * f) % largura) + largura) % largura;
      for (; x < janela.current.l; x += largura)
        ctx.drawImage(img, 0, 0, FUNDO_L, FUNDO_A, Math.round(x), VISTA_A - alvoA, largura, alvoA);
    }

    // 2. céu: sol, nuvens, pássaros e o balão, quase parados
    desenhaCeu(ctx, A, cam, g.t);

    // 3. faixa de árvores grandes, entre o fundo e o mundo
    desenhaFaixaArvores(ctx, A, cam, m);

    // 3. o rio no fundo do vale, visível pelos buracos do chão
    desenhaRio(ctx, A, cam, m, g.t);

    // 4/5/6. enfeites de fundo, chão, enfeites da frente
    const piso = A[PISO];
    const enfeites = A[FOLHA_ENFEITES];
    const desenhaAdorno = (fundo: boolean) => {
      for (const ad of m.fase.adornos) {
        if (!!ad.fundo !== fundo) continue;
        const p = PECAS[ad.peca];
        if (!p) continue;
        const img = p.f ? A[p.f] : enfeites;
        if (!img?.naturalWidth) continue;
        const dx = Math.round(ad.x * TILE - cam);
        const dy = ad.y * TILE - p.a;
        if (dx + p.l < -8 || dx > janela.current.l + 8) continue;
        if (ad.vira) {
          ctx.save();
          ctx.translate(dx + p.l, dy);
          ctx.scale(-1, 1);
          ctx.drawImage(img, p.x, p.y, p.l, p.a, 0, 0, p.l, p.a);
          ctx.restore();
        } else {
          ctx.drawImage(img, p.x, p.y, p.l, p.a, dx, dy, p.l, p.a);
        }
      }
    };
    desenhaAdorno(true);

    if (piso?.naturalWidth) {
      const terra = A[TERRA.url];
      for (const b of m.fase.blocos) {
        const dx = b.x * TILE - cam;
        if (dx + b.l * TILE < -TILE || dx > janela.current.l + TILE) continue;
        desenhaBloco(ctx, piso, terra, oy, b.x, b.y, b.l, b.a, cam);
      }
    }
    desenhaAdorno(false);

    // fogueiras
    const fog = A[FOGUEIRA.url];
    if (fog?.naturalWidth) {
      for (const [fx, fy] of m.fase.fogueiras) {
        const i = quadroDe(g.t, FOGUEIRA.n, FOGUEIRA.fps);
        ctx.drawImage(fog,
          (i % FOGUEIRA.cols) * FOGUEIRA.l, Math.floor(i / FOGUEIRA.cols) * FOGUEIRA.a,
          FOGUEIRA.l, FOGUEIRA.a,
          Math.round(fx * TILE - cam), fy * TILE - FOGUEIRA.a, FOGUEIRA.l, FOGUEIRA.a);
      }
    }

    // tochas: duas de cada lado do portal, marcando a saída de longe
    const to = A[TOCHA.url];
    if (to?.naturalWidth) {
      const q = quadroDe(g.t, TOCHA.n, TOCHA.fps);
      for (const lado of [-3, 2]) {
        const tx = Math.round((m.fase.portal.x + lado) * TILE - cam);
        if (tx < -TOCHA.l || tx > janela.current.l) continue;
        ctx.drawImage(to, q * TOCHA.l, TOCHA.linha * TOCHA.a, TOCHA.l, TOCHA.a,
          tx, m.fase.portal.y * TILE - TOCHA.a - 8, TOCHA.l, TOCHA.a);
      }
    }

    // portal
    const por = A[PORTAL.url];
    if (por?.naturalWidth) {
      const i = quadroDe(g.t, PORTAL.n, PORTAL.fps);
      ctx.drawImage(por, i * PORTAL.l, 0, PORTAL.l, PORTAL.a,
        Math.round(m.fase.portal.x * TILE - cam - 16), m.fase.portal.y * TILE - PORTAL.a,
        PORTAL.l, PORTAL.a);
    }

    // a Iara, amarrada ao lado do portal da última fase
    const refem = m.fase.refem;
    if (refem && folhaIara.current) {
      const dx = Math.round(refem.x * TILE - cam - QUADRO_L / 2);
      if (dx + QUADRO_L > 0 && dx < janela.current.l) {
        const i = quadroDe(g.t, POSES.parado.n, POSES.parado.fps);
        ctx.drawImage(folhaIara.current, i * QUADRO_L, 0, QUADRO_L, QUADRO_A,
          dx, refem.y * TILE - PE_NO_QUADRO, QUADRO_L, QUADRO_A);
        const mk = A[MARCADOR.url];
        if (mk?.naturalWidth) {
          // a linha de baixo do marcador é a interrogação: quem está ali
          // ainda é uma pergunta, não uma tarefa cumprida
          const q = quadroDe(g.t, MARCADOR.cols, 10);
          ctx.drawImage(mk, q * MARCADOR.l, MARCADOR.a, MARCADOR.l, MARCADOR.a,
            dx + QUADRO_L / 2 - 16, refem.y * TILE - PE_NO_QUADRO - 20, MARCADOR.l, MARCADOR.a);
        }
      }
    }

    // moedas
    const mo = A[MOEDA.url];
    if (mo?.naturalWidth) {
      for (const c of m.moedas) {
        if (c.pega) continue;
        const dx = Math.round(c.x - cam - 8);
        if (dx < -16 || dx > janela.current.l) continue;
        // cada moeda gira fora de fase com a vizinha, senão a fileira
        // inteira pisca junto e lê como um objeto só
        const i = quadroDe(g.t + c.x * 0.01, MOEDA.n, MOEDA.fps);
        ctx.drawImage(mo, i * MOEDA.l, 0, MOEDA.l, MOEDA.a, dx, Math.round(c.y - 8), MOEDA.l, MOEDA.a);
      }
    }

    // Sentinelas
    for (const s of m.sentinelas) {
      const img = A[folhaSentinela(s.cor)];
      if (!img?.naturalWidth) continue;
      const pose = POSES_SENTINELA[s.pose];
      const i = quadroDe(s.t, pose.n, pose.fps, 'uma' in pose && pose.uma);
      if ('uma' in pose && pose.uma && s.t * pose.fps >= pose.n) { s.pose = 'parada'; s.t = 0; }
      // ela recua para o lado oposto ao do jogador
      const recuo = s.saiu * (g.x < s.x * TILE ? 1 : -1);
      const dx = Math.round(s.x * TILE + recuo - cam - SENTINELA_L / 2 + TILE / 2);
      if (dx + SENTINELA_L < 0 || dx > janela.current.l) continue;
      const dy = s.y * TILE - SENTINELA_A;
      // a Sentinela olha para o jogador; a folha vem virada para a direita
      const paraEsquerda = g.x < s.x * TILE;
      if (paraEsquerda) {
        ctx.save();
        ctx.translate(dx + SENTINELA_L, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(img, i * SENTINELA_L, pose.linha * SENTINELA_A, SENTINELA_L, SENTINELA_A,
          0, 0, SENTINELA_L, SENTINELA_A);
        ctx.restore();
      } else {
        ctx.drawImage(img, i * SENTINELA_L, pose.linha * SENTINELA_A, SENTINELA_L, SENTINELA_A,
          dx, dy, SENTINELA_L, SENTINELA_A);
      }
      // marcador de missão em cima de quem ainda não foi respondida
      const mk = A[MARCADOR.url];
      if (!s.resolvida && mk?.naturalWidth) {
        const q = quadroDe(g.t, MARCADOR.cols, 10);
        ctx.drawImage(mk, q * MARCADOR.l, 0, MARCADOR.l, MARCADOR.a,
          dx + SENTINELA_L / 2 - 16, dy - 26, MARCADOR.l, MARCADOR.a);
      }
    }

    // flechas
    const fl = A[FLECHA];
    if (fl?.naturalWidth) {
      for (const f of m.flechas) {
        const dx = Math.round(f.x - cam);
        ctx.save();
        if (f.vx < 0) { ctx.translate(dx + fl.naturalWidth, Math.round(f.y)); ctx.scale(-1, 1); }
        else ctx.translate(dx, Math.round(f.y));
        ctx.drawImage(fl, 0, 0);
        ctx.restore();
      }
    }

    // bicho: anda no rastro do jogador, com atraso
    desenhaBicho(ctx, A, cam, g);

    // fogo-fátuo, dando volta no jogador
    const ff = A[FOGO_FATUO.url];
    if (ff?.naturalWidth) {
      const i = quadroDe(g.t, FOGO_FATUO.n, FOGO_FATUO.fps);
      const fx = g.x - cam + Math.cos(g.t * 1.6) * 26 - 16;
      const fy = g.y - 46 + Math.sin(g.t * 2.3) * 8 - 16;
      ctx.drawImage(ff, i * FOGO_FATUO.l, 0, FOGO_FATUO.l, FOGO_FATUO.a,
        Math.round(fx), Math.round(fy), FOGO_FATUO.l, FOGO_FATUO.a);
    }

    // jogador
    const folha = folhaJogador.current;
    if (folha) {
      const pose = POSES[g.pose];
      const i = quadroDe(g.tp, pose.n, pose.fps, pose.uma);
      // piscando quando invencível: some em quadros alternados
      const some = g.invencivel > 0 && Math.floor(g.t * 14) % 2 === 0;
      if (!some) {
        const dx = Math.round(g.x - cam - QUADRO_L / 2);
        const dy = Math.round(g.y) - PE_NO_QUADRO;
        if (g.olhando < 0) {
          ctx.save();
          ctx.translate(dx + QUADRO_L, dy);
          ctx.scale(-1, 1);
          ctx.drawImage(folha, i * QUADRO_L, pose.linha * QUADRO_A, QUADRO_L, QUADRO_A,
            0, 0, QUADRO_L, QUADRO_A);
          ctx.restore();
        } else {
          ctx.drawImage(folha, i * QUADRO_L, pose.linha * QUADRO_A, QUADRO_L, QUADRO_A,
            dx, dy, QUADRO_L, QUADRO_A);
        }
      }
    }

    if (m.fase.clima.nevando) {
      const nv = A[NEVASCA.url];
      if (nv?.naturalWidth) {
        const i = quadroDe(g.t, NEVASCA.n, NEVASCA.fps);
        ctx.globalAlpha = 0.4;
        ctx.drawImage(nv,
          (i % NEVASCA.cols) * NEVASCA.l, Math.floor(i / NEVASCA.cols) * NEVASCA.a,
          janela.current.l, VISTA_A, 0, 0, janela.current.l, VISTA_A);
        ctx.globalAlpha = 1;
      }
    }

    // a neve entra antes da demão: assim ela escurece junto com o resto,
    // em vez de virar chuvisco branco por cima da noite
    desenhaClima(ctx, g);


    // balões de emoção
    const em = A[EMOJI.url];
    if (em?.naturalWidth) {
      for (const b of m.baloes) {
        const q = Math.min(EMOJI.cols - 1, Math.floor(b.t * EMOJI.fps));
        ctx.drawImage(em, q * EMOJI.l, b.emocao * EMOJI.a, EMOJI.l, EMOJI.a,
          Math.round(b.x - cam - 8), Math.round(b.y - b.t * 10), EMOJI.l, EMOJI.a);
      }
    }

  }

  /**
   * O clima da fase, em três demãos por cima do mundo já desenhado.
   *
   * A arte dos pacotes é de dia claro: céu azul, maçã vermelha, capim
   * verde. Nada disso serve para um jogo que se passa dentro de um poço.
   * Em vez de repintar 400 arquivos, o mundo é desenhado como veio e
   * recebe cor por cima — o que também deixa as três fases escurecerem
   * na mesma medida em que a história desce.
   *
   *   1. tinta: uma cor chapada sobre tudo, com pouca opacidade
   *   2. lanterna: buraco de luz em volta do jogador, escuro no resto —
   *      é ela que faz o fundo do poço ser fundo de poço
   *   3. vinheta: as bordas escurecem sempre, em qualquer fase
   */
  function desenhaClima(ctx: CanvasRenderingContext2D, g: Estado) {
    const m = mundo.current;
    if (!m) return;
    const { l: L, a: A_ } = janela.current;
    const cl = m.fase.clima;

    // Uma demão translúcida por cima clareia tanto quanto escurece e a
    // arte continua parecendo tarde de domingo. O que funciona é o que
    // um colorista faria: primeiro DRENA a cor (modo saturação com um
    // cinza), depois MULTIPLICA por uma cor — multiplicar nunca clareia,
    // então o mundo só pode ir para o escuro.
    if (cl.lavagem > 0) {
      ctx.globalCompositeOperation = 'saturation';
      ctx.globalAlpha = cl.lavagem;
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, L, A_);
      ctx.globalAlpha = 1;
    }
    if (cl.tinta) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = cl.tinta;
      ctx.fillRect(0, 0, L, A_);
    }
    ctx.globalCompositeOperation = 'source-over';

    if (cl.lanterna) {
      // o tremor do raio é o fogo-fátuo respirando; sem ele a borda da
      // luz lê como um círculo desenhado por cima da tela
      const raio = cl.lanterna * (1 + Math.sin(g.t * 1.7) * 0.05);
      const cx = g.x - g.cam, cy = g.y - 22;
      const luz = ctx.createRadialGradient(cx, cy, raio * 0.28, cx, cy, raio);
      // o escuro de fora para em 0.88, e não em 1: o jogador precisa
      // continuar enxergando a linha do chão e a boca dos buracos, senão
      // a fase deixa de ser assustadora e passa a ser injusta
      luz.addColorStop(0, 'rgba(4,6,16,0)');
      luz.addColorStop(0.6, 'rgba(4,6,16,0.5)');
      luz.addColorStop(1, 'rgba(4,6,16,0.88)');
      ctx.fillStyle = luz;
      ctx.fillRect(0, 0, L, A_);
    }

    if (cl.vinheta > 0) {
      const v = ctx.createRadialGradient(L / 2, A_ / 2, A_ * 0.34, L / 2, A_ / 2, L * 0.72);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, `rgba(0,0,0,${cl.vinheta})`);
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, L, A_);
    }
  }

  /**
   * O céu.
   *
   * Nada aqui muda de posição de verdade: sol, nuvem, pássaro e balão são
   * postos numa régua fixa em coordenada de mundo e desenhados com um
   * deslocamento pequeno. É o mesmo truque das camadas de fundo, e é o
   * que faz o céu parecer longe em vez de parecer papel de parede colado
   * na tela.
   */
  function desenhaCeu(
    ctx: CanvasRenderingContext2D, A: Record<string, HTMLImageElement>,
    cam: number, t: number,
  ) {
    // o sol só existe em Água Preta. Da boca do poço para baixo não tem
    // de onde ele vir, e é essa ausência que faz o céu da terceira fase
    // ser um problema em vez de um cenário
    const clima = mundo.current?.fase.clima;
    const sol = clima?.sol ? A[CEU.sol] : undefined;
    if (sol?.naturalWidth) ctx.drawImage(sol, Math.round(janela.current.l - 74 - cam * 0.02), 14);

    // nuvens: uma a cada 150 pixels de mundo, alternando desenho e altura
    const passo = 150, fator = 0.1;
    const desloc = cam * fator;
    for (let i = Math.floor(desloc / passo) - 1; i * passo < desloc + janela.current.l + 170; i++) {
      const img = A[CEU.nuvens[((i % 6) + 6) % 6]];
      if (!img?.naturalWidth) continue;
      const y = 8 + ((i * 53) % 46);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(img, Math.round(i * passo - desloc), y);
      ctx.globalAlpha = 1;
    }

    // um balão a cada oito nuvens, e só onde ainda tem gente para soltar
    const bal = clima?.sol ? A[CEU.balao] : undefined;
    if (bal?.naturalWidth) {
      const p2 = passo * 8;
      for (let i = Math.floor((cam * 0.16) / p2); i * p2 < cam * 0.16 + janela.current.l; i++)
        ctx.drawImage(bal, Math.round(i * p2 - cam * 0.16), 26 + ((i * 31) % 24));
    }

    // pássaros: além do deslocamento da câmera, eles andam sozinhos
    const pas = A[CEU.passaros.url];
    if (pas?.naturalWidth) {
      const { l, a, n, fps } = CEU.passaros;
      const q = quadroDe(t, n, fps);
      const p3 = 190, voo = t * 11;
      for (let i = Math.floor((cam * 0.2 + voo) / p3) - 1; i * p3 < cam * 0.2 + voo + janela.current.l; i++)
        ctx.drawImage(pas, q * l, 0, l, a,
          Math.round(i * p3 - cam * 0.2 - voo), 18 + ((i * 71) % 40), l, a);
    }
  }

  function desenhaFaixaArvores(
    ctx: CanvasRenderingContext2D, A: Record<string, HTMLImageElement>,
    cam: number, m: Mundo,
  ) {
    const { fator, l, a, passo } = FAIXA_ARVORES;
    const urls = ARVORES_DA_ESTACAO[m.fase.id];
    const desloc = cam * fator;
    const primeiro = Math.floor((desloc - l) / passo);
    const ultimo = Math.ceil((desloc + janela.current.l) / passo);
    for (let i = primeiro; i <= ultimo; i++) {
      // a escolha da árvore é fixa pelo índice: o mesmo trecho do mapa
      // mostra sempre a mesma mata, em vez de sortear a cada quadro
      const img = A[urls[((i % urls.length) + urls.length) % urls.length]];
      if (!img?.naturalWidth) continue;
      const dx = Math.round(i * passo - desloc);
      // altura alternada, para a fileira não virar uma cerca
      const base = m.fase.blocos[0].y * TILE + (i % 3) * 6 - 2;
      ctx.drawImage(img, 0, 0, l, a, dx, base - a, l, a);
    }
  }

  function desenhaRio(
    ctx: CanvasRenderingContext2D, A: Record<string, HTMLImageElement>,
    cam: number, m: Mundo, t: number,
  ) {
    const img = A[AGUA.url];
    if (!img?.naturalWidth) return;
    const q = Math.floor(t * AGUA.fps) % AGUA.n;
    const y = (MUNDO_A - 1) * TILE;
    let x = -(((cam * 0.9) % AGUA.l) + AGUA.l) % AGUA.l;
    for (; x < janela.current.l; x += AGUA.l)
      ctx.drawImage(img, 0, q * AGUA.a, AGUA.l, AGUA.a, Math.round(x), y, AGUA.l, AGUA.a);
  }

  function desenhaBicho(
    ctx: CanvasRenderingContext2D, A: Record<string, HTMLImageElement>,
    cam: number, g: Estado,
  ) {
    const img = A[BICHOS.find((b) => b.id === bicho)!.url];
    if (!img?.naturalWidth) return;
    // Em vez de dar física própria ao bicho, ele repete o caminho que o
    // jogador fez meio segundo atrás. Sai de graça: o bicho sobe as
    // mesmas plataformas, pula os mesmos buracos e nunca fica preso.
    const atraso = 0.32;
    const r = rastro.current;
    let ponto = r[0] ?? { x: g.x, y: g.y, t: g.t };
    for (const p of r) { if (g.t - p.t <= atraso) break; ponto = p; }
    const anterior = r[Math.max(0, r.indexOf(ponto) - 4)] ?? ponto;
    const parado = Math.abs(ponto.x - anterior.x) < 1;
    const pose = parado ? POSES_BICHO.parado : POSES_BICHO.correr;
    const i = quadroDe(g.t, pose.n, pose.fps);
    const dx = Math.round(ponto.x - cam - BICHO_L / 2);
    const dy = Math.round(ponto.y) - BICHO_A;
    const paraEsquerda = ponto.x < anterior.x;
    ctx.save();
    if (paraEsquerda) { ctx.translate(dx + BICHO_L, dy); ctx.scale(-1, 1); }
    else ctx.translate(dx, dy);
    ctx.drawImage(img, i * BICHO_L, pose.linha * BICHO_A, BICHO_L, BICHO_A, 0, 0, BICHO_L, BICHO_A);
    // chapéu e mochila são folhas na MESMA grade do cão, feitas para
    // empilhar por cima — só que desenhadas em cima do cão, não da
    // raposa, então a raposa sai sem carga
    if (bicho.startsWith('cao')) {
      for (const extra of [BICHO_MOCHILA, BICHO_CHAPEU]) {
        const ac = A[extra];
        if (ac?.naturalWidth)
          ctx.drawImage(ac, i * BICHO_L, pose.linha * BICHO_A, BICHO_L, BICHO_A, 0, 0, BICHO_L, BICHO_A);
      }
    }
    ctx.restore();
  }

  /**
   * O elmo do pacote tem 116x64 — quase um terço da janela do jogo. Ele
   * fica bonito, mas por cima da cena tapa justamente o canto para onde
   * o jogador olha ao andar para a direita. Então ele mora fora da
   * janela, numa tira só dele, desenhada no mesmo relógio.
   */
  function desenhaHud(ctx: CanvasRenderingContext2D) {
    const m = mundo.current;
    const g = jogo.current;
    const A = arte.current;
    if (!m) return;
    ctx.clearRect(0, 0, HUD.l, HUD.a);
    const ox = 0, oyH = 0;
    const barra = (b: typeof HUD.vida, fatia: number, vertical = false) => {
      const img = A[b.url];
      if (!img?.naturalWidth) return;
      const f = Math.max(0, Math.min(1, fatia));
      if (vertical) {
        // o elmo esvazia de cima para baixo, como um copo virando
        const alt = Math.round(b.a * f);
        if (alt <= 0) return;
        ctx.drawImage(img, 0, b.a - alt, b.l, alt,
          ox + b.x, oyH + b.y + (b.a - alt), b.l, alt);
      } else {
        const lar = Math.round(b.l * f);
        if (lar <= 0) return;
        ctx.drawImage(img, 0, 0, lar, b.a, ox + b.x, oyH + b.y, lar, b.a);
      }
    };
    barra(HUD.vida, g.vida / VIDA_CHEIA, true);
    barra(HUD.ouro, g.moedas / Math.max(1, m.moedas.length));
    barra(HUD.saber, m.sentinelas.filter((s) => s.resolvida).length / m.sentinelas.length);
    const moldura = A[HUD.moldura];
    if (moldura?.naturalWidth) ctx.drawImage(moldura, ox, oyH);
  }

  // ── telas ───────────────────────────────────────────────

  const px = (n: number) => `calc(var(--p) * ${n})`;

  if (vista === 'abertura') {
    return (
      <Moldura titulo="O POÇO" onSair={onSair}>
        <Prosa
          falas={ABERTURA}
          aoFim={() => setVista('criador')}
          rotuloFim="Pegar a corda"
        />
      </Moldura>
    );
  }

  if (vista === 'criador') {
    return (
      <Criador
        traje={traje} setTraje={setTraje}
        bicho={bicho} setBicho={setBicho}
        onSair={onSair}
        aoPronto={() => setVista('jogo')}
      />
    );
  }

  if (vista === 'fim') {
    const f = final ?? FINAIS[0];
    return (
      <Moldura titulo="O POÇO" onSair={onSair}>
        <div style={{ padding: px(4), display: 'flex', flexDirection: 'column', gap: px(4) }}>
          <Caixa>
            <div style={{ ...T.titulo, color: C.rust, marginBottom: px(3) }}>{f.titulo}</div>
            <div style={{ ...T.corpo, color: C.paperInk, whiteSpace: 'pre-line' }}>{f.texto}</div>
          </Caixa>
          <div style={{ ...T.rotulo, color: C.boneDim, lineHeight: 1.7 }}>
            {/* dizer que existe outro fim é o que faz o jogador querer
                voltar; dizer qual seria estragaria os dois */}
            O poço tem dois fins. Este foi o seu.
          </div>
          <Caixa padding={false}>
            <Opcao onClick={() => {
              setFinal(null); setFaseIdx(0); setResolvidos([]); setVista('abertura');
            }}>
              Descer de novo
            </Opcao>
            <Opcao divisor onClick={onSair}>Sair para a tela inicial</Opcao>
          </Caixa>
          <div style={{ height: px(4) }} />
        </div>
      </Moldura>
    );
  }

  // ── tela de jogo ──
  //
  // Deitado e em tela cheia: o mundo rola na horizontal, então o jogo
  // ocupa a tela inteira e todo o resto — placar, saída, botões e caixa
  // de fala — fica POR CIMA dele, em cantos que a ação não usa. Numa
  // faixa de 13 casas de altura, qualquer coisa empilhada por fora
  // roubaria metade do céu.
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0d07', overflow: 'hidden',
      touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
    }}>
      <div ref={palco} style={{ position: 'absolute', inset: 0 }}>
        {/* `contain` é o que impede o mundo de esticar. A largura da janela
            já acompanha o formato da tela, então em aparelho deitado ela
            bate e não sobra tarja; em pé, onde nenhuma largura possível
            chega perto do formato, a tarja aparece e é ela que segura a
            proporção do pixel. */}
        <canvas
          ref={tela}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', imageRendering: 'pixelated', display: 'block',
          }}
        />

        {/* placar, no canto de cima à esquerda: o elmo e três números */}
        <div style={{
          position: 'absolute', left: 8, top: 8, display: 'flex', alignItems: 'center', gap: 8,
          pointerEvents: 'none',
        }}>
          <canvas
            ref={elmo} width={HUD.l} height={HUD.a}
            style={{ width: 96, height: 53, imageRendering: 'pixelated', flex: 'none' }}
          />
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 3, ...T.rotulo,
            textShadow: `2px 2px 0 ${C.line}`,
          }}>
            <span style={{ color: C.rustLite }}>{fase.nome}</span>
            <span style={{ color: C.amber }}>♦ {placar.moedas}</span>
            <span style={{ color: C.greenLite }}>
              ▲ {mundo.current ? mundo.current.sentinelas.filter((s) => s.resolvida).length : 0}/3
            </span>
          </div>
        </div>

        {/* saída e progresso, no canto de cima à direita */}
        <div style={{ position: 'absolute', right: 8, top: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            ...T.rotulo, color: C.bone, textShadow: `2px 2px 0 ${C.line}`,
          }}>{resolvidos.length}/{ORDEM.length}</span>
          <button
            onClick={onSair}
            style={{
              ...T.rotulo, color: '#fff', background: C.rust, border: 'none',
              padding: '6px 8px', boxShadow: `0 0 0 2px ${C.line}`, cursor: 'pointer',
            }}
          >SAIR</button>
        </div>

        {!pronto && (
          <div style={{
            position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
            background: C.ink, ...T.rotulo, color: C.lineSoft,
          }}>DESCENDO…</div>
        )}

        {/* comandos por cima do mundo, nos dois cantos de baixo */}
        {!conversa && pronto && <Controles teclas={teclas} />}

        {/* a fala ocupa a metade de baixo e some assim que termina */}
        {conversa && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '78%',
            display: 'flex', flexDirection: 'column', gap: 6,
            padding: 8, overflowY: 'auto',
            background: 'linear-gradient(to top, rgba(10,13,7,0.92) 62%, rgba(10,13,7,0))',
          }}>
            <div style={{ width: 'min(100%, 720px)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(conversa.tipo === 'fala' || conversa.tipo === 'resposta') && (
                <div onClick={avanca} style={{ cursor: 'pointer' }}>
                <Caixa>
                  {conversa.tipo === 'fala' && (
                    <div style={{ ...T.rotulo, color: C.rust, marginBottom: px(2) }}>{conversa.quem}</div>
                  )}
                  {conversa.tipo === 'resposta' && (
                    <div style={{
                      ...T.rotulo, marginBottom: px(2),
                      color: conversa.certa ? C.green : C.red,
                    }}>{conversa.certa ? 'ELA SAI DA FRENTE' : 'ELA NÃO BAIXA O ARCO'}</div>
                  )}
                  <div style={{ ...T.corpo, color: C.paperInk, whiteSpace: 'pre-line' }}>{conversa.texto}</div>
                  <div
                    className="px-blink"
                    style={{ ...T.rotulo, color: C.rust, textAlign: 'right', marginTop: px(2) }}
                  >▼ CONTINUAR</div>
                </Caixa>
                </div>
              )}
              {conversa.tipo === 'final' && (
                <>
                  <Caixa>
                    <div style={{ ...T.rotulo, color: C.rust, marginBottom: px(2) }}>DOZE PASSOS</div>
                    <div style={{ ...T.corpo, color: C.paperInk }}>
                      Para virar ela, você vai ter que olhar. E atrás dela é o fundo.
                    </div>
                  </Caixa>
                  <Caixa padding={false}>
                    {FINAIS.map((f, i) => (
                      <Opcao key={f.titulo} divisor={i > 0} onClick={() => decide(f)}>{f.label}</Opcao>
                    ))}
                  </Caixa>
                </>
              )}
              {conversa.tipo === 'pergunta' && (
                <>
                  <Caixa>
                    <div style={{ ...T.rotulo, color: C.rust, marginBottom: px(2) }}>A VIGIA ESPERA</div>
                    <div style={{ ...T.corpo, color: C.paperInk }}>{conversa.desafio.pergunta}</div>
                  </Caixa>
                  <Caixa padding={false}>
                    {conversa.ordem.map((k, i) => (
                      <Opcao key={k} divisor={i > 0} onClick={() => escolhe(i)}>
                        {conversa.desafio.escolhas[k].label}
                      </Opcao>
                    ))}
                  </Caixa>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <GirarCelular />
    </div>
  );
}

// ── traje inicial e a Iara ──────────────────────────────

function primeiro(camada: keyof typeof CATALOGO, sexo: Sexo, casa?: (id: string) => boolean) {
  const lista = CATALOGO[camada][sexo];
  const achado = casa ? lista.find((p) => casa(p.id)) : lista[0];
  return achado?.id;
}

function trajePadrao(sexo: Sexo): Traje {
  return {
    sexo,
    corpo: primeiro('corpo', sexo),
    cabelo: primeiro('cabelo', sexo),
    torso: primeiro('roupa', sexo, (id) => /shirt|corset/.test(id) && !/v-2/.test(id)),
    pernas: primeiro('roupa', sexo, (id) => /pants|skirt/.test(id)),
    calcado: primeiro('roupa', sexo, (id) => /boots|shoes/.test(id)),
  };
}

/**
 * A Iara, a aguadeira, já vem vestida: ela é personagem do roteiro, não
 * do criador. As duas camadas de amarras (corda e venda) ficam por cima
 * de tudo — é assim que o jogador a encontra no fim da terceira fase.
 */
const IARA: Traje = {
  sexo: 'f',
  corpo: 'female-skin-3.png',
  cabelo: 'female-hair-12.png',
  torso: 'green-bodice-long-sleeves.png',
  pernas: 'skirt.png',
  calcado: 'boots.png',
  amarras: 'female-tied-up.png',
};

// ── peças de tela ───────────────────────────────────────

const pxu = (n: number) => `calc(var(--p) * ${n})`;

function Caixa({ children, padding = true }: { children: React.ReactNode; padding?: boolean }) {
  return (
    <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }}>
      <div className="px-notch" style={{
        background: C.paper, padding: padding ? `${pxu(3)} ${pxu(3)}` : 0,
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
  return (
    <button
      onClick={onClick}
      onPointerDown={() => setAtiva(true)}
      onPointerEnter={() => setAtiva(true)}
      onPointerLeave={() => setAtiva(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: pxu(2), width: '100%',
        textAlign: 'left', border: 'none', cursor: 'pointer',
        borderTop: divisor ? `var(--p) solid ${C.paperEdge}` : undefined,
        background: ativa ? C.paperEdge : 'transparent',
        padding: `${pxu(3)} ${pxu(2)}`, ...T.corpo, color: C.paperInk,
      }}
    >
      <span aria-hidden style={{ flex: 'none', width: pxu(4), color: ativa ? C.paperInk : C.paperSoft }}>▶</span>
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

/**
 * Chassi das telas de texto (abertura, criador, desfecho).
 *
 * Largura presa em 880: deitado num monitor, uma linha correndo de ponta
 * a ponta da tela é ilegível, e a caixa de fala tem parágrafo de verdade.
 */
function Moldura({ titulo, onSair, children }: {
  titulo: string; onSair: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.ink, display: 'flex',
      justifyContent: 'center', overflowY: 'auto',
    }}>
      <div style={{
        position: 'relative', width: 'min(100vw, 880px)', minHeight: '100%',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: `${pxu(2)} ${pxu(3)} 0` }}>
          <div className="px-notch" style={{ background: C.line, padding: 'var(--p)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: pxu(3),
              background: C.shell, padding: `${pxu(2)} ${pxu(3)}`,
            }}>
              <span style={{ ...T.titulo, color: C.bone }}>{titulo}</span>
              <div style={{ flex: 1 }} />
              <button
                onClick={onSair}
                style={{
                  ...T.rotulo, color: '#fff', background: C.rust, border: 'none',
                  padding: `${pxu(1)} ${pxu(2)}`,
                  boxShadow: `0 0 0 var(--p) ${C.line}`, cursor: 'pointer',
                }}
              >← VOLTAR</button>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/** fila de falas com um botão só, para a abertura e o desfecho */
function Prosa({ falas, aoFim, rotuloFim }: {
  falas: Fala[]; aoFim: () => void; rotuloFim: string;
}) {
  const [i, setI] = useState(0);
  const f = falas[i];
  const ultima = i === falas.length - 1;
  return (
    <div style={{
      padding: pxu(4), display: 'flex', flexDirection: 'column', gap: pxu(4),
      flex: 1, justifyContent: 'center',
    }}>
      <Caixa>
        <div style={{ ...T.rotulo, color: C.rust, marginBottom: pxu(2) }}>{f.quem}</div>
        <div style={{ ...T.corpo, color: C.paperInk, whiteSpace: 'pre-line' }}>{f.texto}</div>
      </Caixa>
      <Caixa padding={false}>
        <Opcao onClick={() => { playSfx('tap', 0.4); ultima ? aoFim() : setI(i + 1); }}>
          {ultima ? rotuloFim : 'Continuar'}
        </Opcao>
      </Caixa>
    </div>
  );
}

// ── criador de personagem ───────────────────────────────

/** as casas de vestir na ordem em que aparecem, com rótulo e se são obrigatórias */
const CASAS: { casa: Vestir; rotulo: string; solta?: boolean }[] = [
  { casa: 'corpo', rotulo: 'PELE' },
  { casa: 'cabelo', rotulo: 'CABELO', solta: true },
  { casa: 'orelha', rotulo: 'ORELHAS', solta: true },
  { casa: 'torso', rotulo: 'TRONCO', solta: true },
  { casa: 'pernas', rotulo: 'PERNAS', solta: true },
  { casa: 'calcado', rotulo: 'CALÇADO', solta: true },
  { casa: 'braco', rotulo: 'BRAÇOS', solta: true },
  { casa: 'chapeu', rotulo: 'CABEÇA', solta: true },
  { casa: 'mascara', rotulo: 'ROSTO', solta: true },
  { casa: 'mao', rotulo: 'NA MÃO', solta: true },
];

function Criador({ traje, setTraje, bicho, setBicho, onSair, aoPronto }: {
  traje: Traje; setTraje: (t: Traje) => void;
  bicho: string; setBicho: (b: string) => void;
  onSair: () => void; aoPronto: () => void;
}) {
  const [casa, setCasa] = useState<Vestir>('corpo');
  const boneco = useRef<HTMLCanvasElement>(null);

  // o boneco de amostra é montado do mesmo jeito que o do jogo, e
  // redesenhado a cada troca de peça
  const urls = useMemo(() => folhasDoTraje(traje), [traje]);
  useEffect(() => {
    let vivo = true;
    carrega(urls).then((imgs) => {
      if (!vivo) return;
      const cv = boneco.current;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const folha = montaTraje(traje, imgs);
      // quadro parado, recortado no boneco e ampliado três vezes
      ctx.drawImage(folha, 20, 2, 40, 62, 0, 0, cv.width, cv.height);
    });
    return () => { vivo = false; };
  }, [urls, traje]);

  const opcoes = opcoesDaCasa(casa, traje.sexo);
  const camada = PASTA_DA_CASA[casa];
  const info = CASAS.find((c) => c.casa === casa)!;

  const troca = (id: string | undefined) => {
    playSfx('select', 0.3);
    setTraje({ ...traje, [casa]: id });
  };

  return (
    <Moldura titulo="O POÇO" onSair={onSair}>
      {/* Deitado o criador vira duas colunas: o boneco e as decisões de
          corpo à esquerda, a grade de peças à direita, rolando sozinha.
          Empilhado, a grade empurraria o boneco para fora da tela e o
          jogador escolheria cabelo sem ver a cabeça. */}
      <div style={{ padding: pxu(3), display: 'flex', flexDirection: 'column', gap: pxu(3) }}>
        <div style={{ ...T.corpo, color: C.boneDim, fontSize: 17, lineHeight: 1.35 }}>
          <span style={{ ...T.rotulo, color: C.rustLite }}>QUEM DESCE </span>
          Monte quem desce atrás da Iara. Nada disso muda a dificuldade: é a sua cara no
          jogo, e é ela que a Bruna vai confundir com outra pessoa.
        </div>

        <div className="poco-criador">
          <div style={{ display: 'flex', flexDirection: 'column', gap: pxu(2) }}>
            <div style={{ display: 'flex', gap: pxu(3), alignItems: 'stretch' }}>
              <div className="px-notch" style={{ background: C.line, padding: 'var(--p)', flex: 'none' }}>
                <div style={{ background: C.shellLo, padding: pxu(2) }}>
                  <canvas
                    ref={boneco} width={120} height={186}
                    style={{ display: 'block', width: 84, imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: pxu(2), minWidth: 0 }}>
                <BotaoLinha
                  rotulo={traje.sexo === 'm' ? 'CORPO A' : 'CORPO B'}
                  onClick={() => {
                    playSfx('select', 0.3);
                    const sx: Sexo = traje.sexo === 'm' ? 'f' : 'm';
                    // as folhas são desenhadas em cima de um corpo específico
                    // e não servem no outro: trocar de corpo troca o traje
                    // inteiro pelo padrão do novo
                    setTraje(trajePadrao(sx));
                  }}
                />
                <BotaoLinha rotulo="COMPANHEIRO" nota={BICHOS.find((b) => b.id === bicho)!.rotulo} onClick={() => {
                  playSfx('select', 0.3);
                  const i = BICHOS.findIndex((b) => b.id === bicho);
                  setBicho(BICHOS[(i + 1) % BICHOS.length].id);
                }} />
                <div style={{ ...T.rotulo, color: C.boneDim, lineHeight: 1.6 }}>
                  As peças de um corpo não servem no outro: elas foram desenhadas
                  quadro a quadro por cima dele.
                </div>
              </div>
            </div>

            <Caixa padding={false}>
              <Opcao onClick={() => { playSfx('gate', 0.5); aoPronto(); }}>
                Descer
              </Opcao>
            </Caixa>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: pxu(2), minWidth: 0 }}>
            {/* abas das casas de vestir */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: pxu(1) }}>
              {CASAS.map((c) => (
                <button
                  key={c.casa}
                  onClick={() => { playSfx('tap', 0.25); setCasa(c.casa); }}
                  style={{
                    ...T.rotulo, border: 'none', cursor: 'pointer',
                    padding: `${pxu(2)} ${pxu(2)}`,
                    background: casa === c.casa ? C.rust : C.shell,
                    color: casa === c.casa ? '#fff' : C.boneDim,
                    boxShadow: `0 0 0 var(--p) ${C.line}`,
                  }}
                >{c.rotulo}</button>
              ))}
            </div>

            {/* grade de peças, recortada do atlas de prévias */}
            <div className="px-notch" style={{ background: C.line, padding: 'var(--p)', flex: 1, minHeight: 0 }}>
              <div style={{
                background: C.shellLo, padding: pxu(2), height: '100%',
                maxHeight: 'min(52vh, 420px)', overflowY: 'auto',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(54px, 1fr))', gap: pxu(1),
                alignContent: 'start',
              }}>
                {info.solta && (
                  <Miniatura vazia escolhida={!traje[casa]} onClick={() => troca(undefined)} />
                )}
                {opcoes.map((p) => (
                  <Miniatura
                    key={p.id}
                    atlas={caminhoPrevia(camada, traje.sexo)}
                    indice={p.i}
                    titulo={p.rotulo}
                    escolhida={traje[casa] === p.id}
                    onClick={() => troca(p.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: pxu(4) }} />
      </div>
    </Moldura>
  );
}

function BotaoLinha({ rotulo, nota, onClick }: { rotulo: string; nota?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...T.rotulo, textAlign: 'left', border: 'none', cursor: 'pointer',
        background: C.shell, color: C.bone, padding: `${pxu(2)} ${pxu(3)}`,
        boxShadow: `0 0 0 var(--p) ${C.line}`, lineHeight: 1.8,
      }}
    >
      {rotulo}{nota && <span style={{ color: C.rustLite }}> · {nota}</span>}
      <span style={{ color: C.lineSoft }}> ▸</span>
    </button>
  );
}

/**
 * Uma célula da grade de escolhas.
 *
 * A miniatura não é o PNG da peça: é um recorte do atlas gerado por
 * scripts/gen-poco.mjs, onde a peça já aparece vestida num corpo. Sem
 * o atlas, abrir a aba de cabelo baixaria 68 folhas de 800x448 de uma
 * vez; com ele, baixa uma imagem só por aba.
 */
function Miniatura({ atlas, indice, titulo, escolhida, vazia, onClick }: {
  atlas?: string; indice?: number; titulo?: string;
  escolhida: boolean; vazia?: boolean; onClick: () => void;
}) {
  const { cols, l, a } = PREVIA;
  const cx = indice === undefined ? 0 : (indice % cols) * l;
  const cy = indice === undefined ? 0 : Math.floor(indice / cols) * a;
  return (
    <button
      onClick={onClick}
      title={titulo}
      style={{
        position: 'relative', border: 'none', cursor: 'pointer', padding: 0,
        aspectRatio: `${l} / ${a}`,
        background: escolhida ? C.rust : C.shell,
        boxShadow: `0 0 0 var(--p) ${escolhida ? C.rustLite : C.line}`,
        overflow: 'hidden',
      }}
    >
      {vazia ? (
        <span style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          ...T.rotulo, fontSize: 7, color: C.boneDim,
        }}>SEM</span>
      ) : (
        <span
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${atlas})`,
            backgroundPosition: `-${cx}px -${cy}px`,
            backgroundSize: 'auto',
            imageRendering: 'pixelated',
            // a célula do atlas tem tamanho fixo; a caixa acompanha
            width: l, height: a, margin: '0 auto',
            transformOrigin: 'top left',
          }}
        />
      )}
    </button>
  );
}

// ── controles de toque ──────────────────────────────────

/**
 * Comandos de toque, por cima do mundo.
 *
 * Direção nos dois cantos de baixo, pulo no canto oposto: é onde os dois
 * polegares já estão quando o aparelho está deitado. Eles são meio
 * transparentes de propósito — a faixa de jogo tem 13 casas de altura e
 * um botão opaco desse tamanho tapa chão que o jogador precisa ver.
 *
 * O botão sai da tela quando há conversa: ali o comando é a alternativa
 * na caixa de fala, e um botão de pulo sobrando só confunde.
 */
function Controles({ teclas }: {
  teclas: React.MutableRefObject<{ esq: boolean; dir: boolean; pulo: boolean }>;
}) {
  const base: React.CSSProperties = {
    display: 'grid', placeItems: 'center', borderRadius: 12,
    background: 'rgba(44,58,26,0.62)', color: C.bone,
    border: `2px solid rgba(143,191,53,0.75)`,
    fontFamily: 'monospace', cursor: 'pointer',
    touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
    backdropFilter: 'blur(1px)',
  };
  const aperta = (campo: 'esq' | 'dir' | 'pulo', rotulo: string, extra: React.CSSProperties) => (
    <button
      aria-label={campo}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => { e.preventDefault(); teclas.current[campo] = true; }}
      onPointerUp={() => { teclas.current[campo] = false; }}
      onPointerLeave={() => { teclas.current[campo] = false; }}
      onPointerCancel={() => { teclas.current[campo] = false; }}
      style={{ ...base, ...extra }}
    >{rotulo}</button>
  );
  return (
    <>
      <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', gap: 8 }}>
        {aperta('esq', '◄', { width: 60, height: 60, fontSize: 22 })}
        {aperta('dir', '►', { width: 60, height: 60, fontSize: 22 })}
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 12 }}>
        {aperta('pulo', '▲', {
          width: 76, height: 76, borderRadius: '50%', fontSize: 26,
          background: 'rgba(168,90,16,0.72)', borderColor: 'rgba(255,179,71,0.8)',
        })}
      </div>
    </>
  );
}

/**
 * Aviso de girar o aparelho.
 *
 * Só aparece em tela pequena e em pé. Não bloqueia nada: quem insistir
 * continua jogando numa tira estreita, e o aviso some sozinho no
 * instante em que o aparelho vira.
 */
function GirarCelular() {
  const [empe, setEmpe] = useState(false);
  useEffect(() => {
    const ve = () => setEmpe(window.innerHeight > window.innerWidth && window.innerWidth < 620);
    ve();
    window.addEventListener('resize', ve);
    window.addEventListener('orientationchange', ve);
    return () => { window.removeEventListener('resize', ve); window.removeEventListener('orientationchange', ve); };
  }, []);
  if (!empe) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)',
      display: 'grid', placeItems: 'center', gap: 10, padding: 20,
      background: 'rgba(10,13,7,0.88)', pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 40 }} aria-hidden>📱↻</div>
      <div style={{ ...T.titulo, color: C.bone, textAlign: 'center' }}>GIRE O APARELHO</div>
      <div style={{ ...T.corpo, color: C.boneDim, textAlign: 'center', maxWidth: 260 }}>
        O poço é fundo e a tela é curta. Deitado, cabe mais escuro.
      </div>
    </div>
  );
}
