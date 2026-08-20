// ─────────────────────────────────────────────────────────
// Recortes da arte de O POÇO.
//
// Os pacotes vêm em folha corrida, sem arquivo de metadados: cada PNG é
// uma grade de quadros ou uma prancha com várias peças encostadas. Este
// arquivo é a tradução disso para números — onde começa cada quadro,
// quantos quadros tem cada animação, qual retângulo é a barraca e qual é
// a lápide.
//
// As medidas NÃO foram estimadas no olho. Saíram de uma varredura dos
// PNGs: as colunas e linhas totalmente transparentes revelam a grade das
// folhas de personagem (80x64, 10 por 7), e nas pranchas soltas os
// pixels opacos foram agrupados em regiões conexas, cada região
// devolvendo seu retângulo exato. Onde duas peças se encostavam no
// desenho original, o grupo virou uma peça só.
//
// ARTE: pacotes de pixel art de GandalfHardcore (gandalfhardcore.itch.io),
// licenciados para uso em jogo, com modificação permitida e
// redistribuição do pacote proibida.
// ─────────────────────────────────────────────────────────
import { CATALOGO, type Camada, type Sexo } from '../../game/pocoCatalogo';

export const TILE = 16;
// A janela é uma faixa larga e baixa, e não um quadrado: o mundo aqui
// rola na horizontal, então altura sobrando vira terra preta embaixo do
// caminho — que é exatamente o que não se quer olhando. Com 13 casas,
// sobram 10 de céu acima do chão e 3 de terra abaixo dele.
//
// A ALTURA é fixa: são sempre as mesmas 13 casas, em qualquer aparelho,
// senão a mesma plataforma ficaria fácil num celular e impossível noutro.
// A LARGURA é que se ajusta ao formato da tela, para o jogo encher o
// aparelho deitado sem tarja preta dos lados. Quem tem tela mais larga vê
// mais chão pela frente, e isso não muda nada do que o jogo cobra.
export const VISTA_A = 208;
/** largura padrão, e os limites do que o ajuste pode escolher */
export const VISTA_L = 416;
export const VISTA_L_MIN = 320, VISTA_L_MAX = 640;

/** largura de janela para um formato de tela, presa à grade de 2 pixels */
export function larguraDaVista(proporcao: number) {
  const l = Math.round((VISTA_A * proporcao) / 2) * 2;
  return Math.max(VISTA_L_MIN, Math.min(VISTA_L_MAX, l));
}
/** altura do mundo, em casas — a largura vem de cada fase */
export const MUNDO_A = 13;

const RAIZ = '/assets/poco';

// ── folha de personagem ─────────────────────────────────
//
// Todas as camadas (corpo, cabelo, roupa, chapéu, item de mão) usam a
// MESMA grade, e é isso que faz a montagem funcionar: basta empilhar os
// PNGs um sobre o outro sem deslocar nada. Só as orelhas élficas vêm com
// 9 colunas em vez de 10 — falta o último quadro do tombo, e como a
// coluna mede o mesmo, o recorte não muda.
export const QUADRO_L = 80, QUADRO_A = 64;
/** o boneco ocupa a faixa central do quadro e pisa na última linha */
export const PE_NO_QUADRO = 63;

export type Pose = 'parado' | 'andar' | 'correr' | 'pular' | 'festa' | 'aceno' | 'tombo';

/** linha da folha e quantos quadros aquela linha usa */
export const POSES: Record<Pose, { linha: number; n: number; fps: number; uma?: boolean }> = {
  parado: { linha: 0, n: 5, fps: 6 },
  andar:  { linha: 1, n: 8, fps: 11 },
  correr: { linha: 2, n: 8, fps: 14 },
  pular:  { linha: 3, n: 4, fps: 8, uma: true },
  festa:  { linha: 4, n: 4, fps: 8 },
  aceno:  { linha: 5, n: 4, fps: 7 },
  tombo:  { linha: 6, n: 10, fps: 10, uma: true },
};

/**
 * Ordem de empilhamento das camadas, de trás para frente.
 *
 * A roupa do pacote vem toda numa lista só, misturando camisa, calça e
 * bota. Aqui ela é separada em três casas de vestir, porque senão o
 * jogador escolheria camisa OU calça, nunca as duas.
 */
export const ORDEM_CAMADAS = [
  'corpo', 'orelha', 'pernas', 'calcado', 'torso', 'braco',
  'cabelo', 'chapeu', 'mascara', 'amarras', 'venda', 'mao',
] as const;
export type Vestir = typeof ORDEM_CAMADAS[number];

/** de que pasta sai cada casa de vestir (as três de roupa dividem a mesma) */
export const PASTA_DA_CASA: Record<Vestir, Camada> = {
  corpo: 'corpo', orelha: 'orelha', pernas: 'roupa', calcado: 'roupa',
  torso: 'roupa', braco: 'braco', cabelo: 'cabelo', chapeu: 'chapeu',
  mascara: 'mascara', amarras: 'amarras', venda: 'amarras', mao: 'mao',
};

/** como as peças de roupa se dividem entre as três casas */
function casaDaRoupa(id: string): 'pernas' | 'calcado' | 'torso' {
  if (/boots|shoes|socks/.test(id)) return 'calcado';
  if (/pants|skirt|hose/.test(id)) return 'pernas';
  return 'torso';
}

/** as peças que cada casa de vestir oferece, já filtradas */
export function opcoesDaCasa(casa: Vestir, sexo: Sexo) {
  const lista = CATALOGO[PASTA_DA_CASA[casa]][sexo];
  if (casa !== 'pernas' && casa !== 'calcado' && casa !== 'torso') {
    return lista.map((p, i) => ({ ...p, i }));
  }
  return lista.map((p, i) => ({ ...p, i })).filter((p) => casaDaRoupa(p.id) === casa);
}

export type Traje = Partial<Record<Vestir, string>> & { sexo: Sexo };

export function caminhoPeca(casa: Vestir, sexo: Sexo, id: string) {
  return `${RAIZ}/${PASTA_DA_CASA[casa]}/${sexo}/${id}`;
}

export function caminhoPrevia(camada: Camada, sexo: Sexo) {
  return `${RAIZ}/previa/${camada}-${sexo}.png`;
}

/**
 * Achata o traje numa folha só.
 *
 * Sem isso o desenho de cada quadro do jogo custaria até onze
 * `drawImage` só para o jogador, e outros tantos para a Iara. Como o
 * traje não muda no meio da fase, ele é composto uma vez num canvas fora
 * da tela e daí em diante o jogo desenha UMA folha, igual a qualquer
 * sprite comum.
 */
export function montaTraje(traje: Traje, folhas: Record<string, HTMLImageElement>) {
  const cv = document.createElement('canvas');
  cv.width = QUADRO_L * 10;
  cv.height = QUADRO_A * 7;
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (const casa of ORDEM_CAMADAS) {
    const id = traje[casa];
    if (!id) continue;
    const img = folhas[caminhoPeca(casa, traje.sexo, id)];
    if (img?.complete && img.naturalWidth) ctx.drawImage(img, 0, 0);
  }
  return cv;
}

/** todas as folhas que um traje precisa, para carregar antes de montar */
export function folhasDoTraje(traje: Traje) {
  return ORDEM_CAMADAS
    .filter((c) => traje[c])
    .map((c) => caminhoPeca(c, traje.sexo, traje[c]!));
}

// ── inimigos, bicho e miudezas animadas ─────────────────

/** a Sentinela: 11 colunas por 5 linhas de 64x64 */
export const SENTINELA_L = 64, SENTINELA_A = 64;
export const POSES_SENTINELA = {
  parada:  { linha: 0, n: 5, fps: 6 },
  atirar:  { linha: 1, n: 11, fps: 14, uma: true },
  andar:   { linha: 2, n: 8, fps: 10 },
  ferida:  { linha: 3, n: 5, fps: 12, uma: true },
  tombo:   { linha: 4, n: 6, fps: 9, uma: true },
} as const;
export const folhaSentinela = (cor: string) =>
  `${RAIZ}/arqueiro/${cor ? `sentinela-${cor}` : 'sentinela'}.png`;

/** o bicho de estimação: 6 colunas por 2 linhas de 32x32 */
export const BICHO_L = 32, BICHO_A = 32;
export const POSES_BICHO = {
  parado: { linha: 0, n: 5, fps: 6 },
  correr: { linha: 1, n: 6, fps: 12 },
} as const;
export const BICHOS = [
  { id: 'cao', rotulo: 'Cão', url: `${RAIZ}/bicho/cao.png` },
  { id: 'cao-2', rotulo: 'Cão malhado', url: `${RAIZ}/bicho/cao-2.png` },
  { id: 'cao-3', rotulo: 'Cão preto', url: `${RAIZ}/bicho/cao-3.png` },
  { id: 'cao-4', rotulo: 'Cão ruivo', url: `${RAIZ}/bicho/cao-4.png` },
  { id: 'cao-5', rotulo: 'Cão branco', url: `${RAIZ}/bicho/cao-5.png` },
  { id: 'raposa', rotulo: 'Raposa', url: `${RAIZ}/bicho/raposa.png` },
];
/** acessórios do bicho: mesma grade, empilhados por cima */
export const BICHO_CHAPEU = `${RAIZ}/bicho/cao-chapeu.png`;
export const BICHO_MOCHILA = `${RAIZ}/bicho/cao-mochila.png`;

/** fogo-fátuo: cinco quadros de 32x32 numa fila só */
export const FOGO_FATUO = { url: `${RAIZ}/bicho/fogo-fatuo.png`, l: 32, a: 32, n: 5, fps: 8 };

/** moeda: doze quadros de 16x16 numa fila só */
export const MOEDA = { url: `${RAIZ}/hud/moeda.png`, l: 16, a: 16, n: 12, fps: 14 };

/**
 * Balão de emoção: 19 colunas de 16x16, e cada LINHA é uma emoção
 * diferente. A coluna é o quadro em que o balão infla e murcha, então
 * uma emoção mostrada por inteiro é uma linha percorrida de ponta a
 * ponta. Aqui só as linhas que o jogo usa estão nomeadas.
 */
export const EMOJI = { url: `${RAIZ}/hud/emoji.png`, l: 16, a: 16, cols: 19, fps: 22 };
export const EMOCAO = {
  duvida: 0, susto: 1, tonto: 2, caveira: 3, choro: 4, meio: 5,
  raiva: 6, chorando: 7, apaixonado: 8, sono: 9, triste: 10,
  coracao: 11, riso: 12, sorriso: 13, mudo: 14,
} as const;

/** marcador de missão: 16 colunas por 2 linhas de 32x32 */
export const MARCADOR = { url: `${RAIZ}/hud/marcador.png`, l: 32, a: 32, cols: 16, fps: 16 };

/** fogueira: 5 colunas por 8 linhas de 32x32, lidas em sequência corrida */
export const FOGUEIRA = { url: `${RAIZ}/cenario/fogueira.png`, l: 32, a: 32, cols: 5, n: 40, fps: 14 };

/** portal: dez quadros de 64x64 numa fila só */
export const PORTAL = { url: `${RAIZ}/cenario/portal.png`, l: 64, a: 64, n: 10, fps: 12 };

// ── céu ─────────────────────────────────────────────────
//
// Nuvem, pássaro, sol e balão vêm soltos no pacote, cada um num arquivo.
// Eles entram numa faixa própria entre o degradê do céu e a primeira
// linha de mata, com deslocamento quase nulo: coisa longe não anda.
export const CEU = {
  sol: `${RAIZ}/cenario/sol.png`,
  balao: `${RAIZ}/cenario/balao.png`,
  nuvens: [1, 2, 3, 4, 5, 6].map((n) => `${RAIZ}/cenario/nuvem-${n}.png`),
  /** bando de pássaros: 4 quadros de 5x20 numa fila */
  passaros: { url: `${RAIZ}/cenario/passaro-1.png`, l: 5, a: 20, n: 4, fps: 9 },
};

/** tocha de parede: 6 colunas por 4 linhas de 32x32; a linha 1 é a acesa */
export const TOCHA = { url: `${RAIZ}/cenario/tocha.png`, l: 32, a: 32, linha: 1, n: 6, fps: 10 };

/** nevasca da serra: 5 colunas por 6 linhas de 484x274, por cima de tudo */
export const NEVASCA = { url: `${RAIZ}/cenario/nevasca.png`, l: 484, a: 274, cols: 5, n: 30, fps: 12 };

/** o rio no fundo do vale: 3 quadros de 160x64, empilhados */
export const AGUA = { url: `${RAIZ}/cenario/agua.png`, l: 160, a: 64, n: 3, fps: 6 };

/** flecha da Sentinela, apontando para a direita */
export const FLECHA = `${RAIZ}/arqueiro/flecha.png`;

// ── HUD ─────────────────────────────────────────────────
//
// A moldura vem com o elmo vazio e duas calhas. As três barras entram
// POR BAIXO dela: é a moldura que desenha os gomos da barra azul e o
// aro do elmo por cima do preenchimento. Os deslocamentos abaixo são os
// da prévia que acompanha o pacote.
export const HUD = {
  moldura: `${RAIZ}/hud/moldura.png`,
  l: 116, a: 64,
  vida:  { url: `${RAIZ}/hud/barra-vida.png`, x: 1,  y: 3,  l: 56, a: 54 },
  ouro:  { url: `${RAIZ}/hud/barra-ouro.png`, x: 66, y: 47, l: 32, a: 4 },
  saber: { url: `${RAIZ}/hud/barra-ar.png`,   x: 63, y: 54, l: 49, a: 6 },
};

// ── chão ────────────────────────────────────────────────
//
// A folha de piso traz o mesmo desenho três vezes, uma por estação,
// empilhadas: verde em cima, outono no meio, neve embaixo, 12 casas cada.
// Dentro de um bloco de estação existem duas peças que interessam:
//
//   · um bloco maciço de 6x6 casas no canto (0,0), com franja em cima e
//     canto arredondado embaixo — dele saem os nove pedaços do recorte
//     de bloco grande;
//   · uma plataforma fina de 6x2 casas em (12,10), para as saliências
//     onde não cabem três casas de altura.
export const PISO = `${RAIZ}/cenario/piso-1.png`;
export const ALTURA_ESTACAO = 192;
export const OFFSET_ESTACAO = { verao: 0, outono: 192, inverno: 384 };

/** os nove pedaços do bloco maciço, em pixels dentro do bloco da estação */
export const NOVE = {
  ce: [0, 0], cm: [32, 0], cd: [80, 0],
  me: [0, 32], mm: [32, 32], md: [80, 32],
  be: [0, 80], bm: [32, 80], bd: [80, 80],
} as const;

/**
 * Terra do miolo.
 *
 * O bloco da folha de piso é quase preto por dentro: ele foi desenhado
 * para aparecer como uma faixa fina, com a terra clara do pacote atrás.
 * Empilhado em cinco casas de altura, aquele miolo vira um borrão preto
 * que come um terço da tela. Então o miolo é trocado por uma casa da
 * prancha de terra, e o recorte de nove pedaços fica só com a franja e
 * as beiradas — que é onde ele importa.
 */
export const TERRA = { url: `${RAIZ}/cenario/terra-1.png`, x: 80, y: 48 };

/** os seis pedaços da plataforma fina */
export const FINA = {
  ce: [192, 160], cm: [224, 160], cd: [272, 160],
  be: [192, 176], bm: [224, 176], bd: [272, 176],
} as const;

// ── fundo em camadas ────────────────────────────────────
//
// Cinco camadas por estação, numeradas do mais PERTO para o mais longe:
// a 1 é a mata escura rente ao chão, a 5 é só o degradê do céu. Por isso
// o desenho vai de trás para frente, da 5 para a 1, e o fator de
// deslocamento cresce no mesmo sentido.
export const FUNDO_FATOR = [0.05, 0.12, 0.22, 0.36, 0.55];
export const fundoUrl = (estacao: string, n: number) =>
  `${RAIZ}/fundo/${estacao}/camada-${n}.png`;
export const FUNDO_L = 1024, FUNDO_A = 346;

/**
 * Faixa de árvores desenhada entre o fundo e o chão.
 *
 * As quatro árvores grandes do pacote têm 256x208 e não cabem no plano
 * de jogo — encostadas no chão elas tapariam o caminho inteiro. Aqui
 * elas entram como uma faixa intermediária, andando a meio caminho entre
 * o fundo e o mundo, que é a distância em que aquele tamanho lê como
 * mata próxima em vez de obstáculo.
 */
export const FAIXA_ARVORES = {
  fator: 0.72,
  l: 256, a: 208,
  // espaçadas mais que a própria largura: encostadas, as copas fecham o
  // céu inteiro e o fundo em camadas deixa de aparecer
  /** distância entre uma árvore e a próxima, em pixels de mundo */
  passo: 370,
};

/** as quatro árvores grandes vêm pintadas por estação; cada fase usa as suas */
export const ARVORES_DA_ESTACAO: Record<string, string[]> = {
  verao: [`${RAIZ}/cenario/arvore-1.png`, `${RAIZ}/cenario/arvore-2.png`, `${RAIZ}/cenario/salgueiro-1.png`],
  outono: [`${RAIZ}/cenario/arvore-3.png`, `${RAIZ}/cenario/salgueiro-2.png`],
  inverno: [`${RAIZ}/cenario/arvore-4.png`, `${RAIZ}/cenario/salgueiro-3.png`],
};

// ── enfeites ────────────────────────────────────────────

export interface Peca {
  /** folha de onde sai; sem isso, a prancha de enfeites */
  f?: string;
  x: number; y: number; l: number; a: number;
}

const DECOR = `${RAIZ}/cenario/decor.png`;
const HORTA = `${RAIZ}/cenario/horta.png`;
const solto = (nome: string, l: number, a: number): Peca =>
  ({ f: `${RAIZ}/cenario/${nome}.png`, x: 0, y: 0, l, a });

export const PECAS: Record<string, Peca> = {
  // prancha de enfeites: acampamento e utensílio
  caixote:    { x: 34, y: 0, l: 27, a: 32 },
  barril:     { x: 73, y: 14, l: 15, a: 18 },
  tamborete:  { x: 137, y: 19, l: 14, a: 13 },
  panela:     { x: 168, y: 17, l: 18, a: 15 },
  toco:       { x: 199, y: 3, l: 18, a: 29 },
  mesa:       { x: 262, y: 21, l: 18, a: 11 },
  maca:       { x: 326, y: 21, l: 19, a: 11 },
  garrafas:   { x: 387, y: 20, l: 25, a: 12 },
  feira:      { x: 267, y: 34, l: 39, a: 30 },
  // As duas barracas foram medidas à mão, e não pela varredura de regiões
  // conexas: na prancha a barraca da esquerda encosta no fogareiro que
  // vem logo abaixo, e a varredura devolvia as duas coisas num retângulo
  // só — barraca com um caldeirão pendurado no pé.
  tendaG:     { x: 0, y: 56, l: 95, a: 40 },
  tendaP:     { x: 97, y: 56, l: 94, a: 40 },
  fogareiro:  { x: 32, y: 97, l: 32, a: 32 },
  lenha:      { x: 201, y: 75, l: 47, a: 21 },
  cesto:      { x: 328, y: 81, l: 17, a: 15 },
  // cemitério e horta
  lapide1:    { x: 197, y: 104, l: 23, a: 24 },
  lapide2:    { x: 229, y: 104, l: 21, a: 24 },
  cruz:       { x: 293, y: 101, l: 21, a: 27 },
  abobora:    { x: 390, y: 113, l: 19, a: 15 },
  juncos:     { x: 288, y: 139, l: 64, a: 53 },
  muro:       { x: 359, y: 141, l: 50, a: 51 },
  espantalho: { x: 300, y: 197, l: 40, a: 59 },
  estatua:    { x: 387, y: 265, l: 26, a: 55 },
  varal:      { x: 27, y: 354, l: 106, a: 62 },
  // as três estações da mesma miudeza
  pedraVerde:  { x: 4, y: 280, l: 88, a: 40 },
  pedraOutono: { x: 196, y: 280, l: 88, a: 40 },
  pedraNeve:   { x: 292, y: 280, l: 88, a: 40 },
  folhas:      { x: 161, y: 332, l: 93, a: 20 },
  neve:        { x: 258, y: 333, l: 93, a: 19 },
  moitaVerde:  { x: 3, y: 424, l: 57, a: 24 },
  moitaOutono: { x: 3, y: 456, l: 57, a: 24 },
  moitaNeve:   { x: 3, y: 488, l: 57, a: 24 },
  // prancha da horta
  cipreste:    { f: HORTA, x: 130, y: 26, l: 28, a: 102 },
  arvoreH:     { f: HORTA, x: 163, y: 38, l: 56, a: 90 },
  vaso:        { f: HORTA, x: 0, y: 7, l: 31, a: 57 },
  urna:        { f: HORTA, x: 35, y: 86, l: 27, a: 42 },
  estatuaNeve: { f: HORTA, x: 5, y: 83, l: 21, a: 45 },
  // arquivos avulsos
  betula1:    solto('betula-1', 80, 112),
  betula2:    solto('betula-2', 80, 112),
  betula3:    solto('betula-3', 80, 112),
  florida:    solto('florida', 96, 112),
  pinheiroG:  solto('pinheiro-g', 128, 176),
  natal:      solto('natal', 32, 64),
  capim:      solto('capim', 96, 32),
  trigo:      { f: `${RAIZ}/cenario/trigo.png`, x: 133, y: 0, l: 19, a: 32 },
  minerio:    { f: `${RAIZ}/cenario/minerio.png`, x: 6, y: 26, l: 53, a: 38 },
};

export const FOLHA_ENFEITES = DECOR;

/** todo PNG que uma fase precisa ter na memória antes do primeiro quadro */
export function folhasDaFase(estacao: string, cores: string[]): string[] {
  const urls = new Set<string>([
    PISO, TERRA.url, DECOR, HORTA, FLECHA, HUD.moldura,
    HUD.vida.url, HUD.ouro.url, HUD.saber.url,
    MOEDA.url, EMOJI.url, MARCADOR.url, FOGUEIRA.url, PORTAL.url, AGUA.url,
    TOCHA.url, CEU.sol, CEU.balao, CEU.passaros.url, ...CEU.nuvens,
    FOGO_FATUO.url,
    ...ARVORES_DA_ESTACAO[estacao],
    ...cores.map(folhaSentinela),
  ]);
  for (let n = 1; n <= 5; n++) urls.add(fundoUrl(estacao, n));
  // a nevasca pesa 270 KB e só faz sentido na serra: as outras duas
  // fases não a baixam
  if (estacao === 'inverno') urls.add(NEVASCA.url);
  for (const p of Object.values(PECAS)) if (p.f) urls.add(p.f);
  return [...urls];
}

/** carrega uma lista de PNGs e só resolve quando o último terminou */
export function carrega(urls: string[]): Promise<Record<string, HTMLImageElement>> {
  const mapa: Record<string, HTMLImageElement> = {};
  return new Promise((resolve) => {
    let faltam = urls.length;
    if (!faltam) { resolve(mapa); return; }
    const conta = () => { if (--faltam === 0) resolve(mapa); };
    for (const url of urls) {
      const img = new Image();
      img.onload = conta;
      // uma peça que falta não pode travar a fase: o desenho pula quem
      // não carregou, e o resto do mundo continua de pé
      img.onerror = conta;
      img.src = url;
      mapa[url] = img;
    }
  });
}
