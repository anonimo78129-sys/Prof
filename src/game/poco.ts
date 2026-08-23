// ─────────────────────────────────────────────────────────
// O POÇO — as três descidas.
//
// Este arquivo é o MAPA: onde tem chão, onde tem buraco, onde estão as
// Vigias e o que enfeita cada trecho. O roteiro e as nove paradas ficam
// em pocoTexto.ts, e quem desenha é components/Shell/Poco.tsx.
//
// As três fases usam as três estações da folha de piso, mas nenhuma
// delas é uma estação de verdade: é tudo o mesmo dia de inverno, visto
// de fundos diferentes do poço. O verão da primeira fase é o verão que
// Água Preta lembra de ter, não o que está lá fora.
// ─────────────────────────────────────────────────────────
export type { Fala, Escolha, Desafio, Final } from './pocoTexto';
export { DESAFIOS, ORDEM, ABERTURA, DESFECHO, FINAIS } from './pocoTexto';

// ── geometria das fases ──────────────────────────────────
//
// O mundo é medido em casas de 16 pixels, com 14 casas de altura. O
// chão principal fica na casa 10, e é aí que vale a regra do
// platformer: buraco entre dois blocos é buraco de verdade, e plataforma
// solta a três casas de altura é sempre alcançável com um pulo, porque o
// pulo do boneco sobe pouco mais que três casas.
//
// Um bloco é sólido inteiro e desenhado com recorte de nove pedaços
// (canto, beirada, miolo) tirado da folha de piso — por isso a altura
// mínima é 2.

export interface Bloco {
  x: number; y: number;
  /** largura e altura em casas */
  l: number; a: number;
}

/** enfeite parado: `peca` é uma chave da tabela de recortes em pocoArte */
export interface Adorno {
  x: number;
  /** casa em que o PÉ do enfeite encosta */
  y: number;
  peca: string;
  /** desenhado antes do chão, para árvore grande não tapar o caminho */
  fundo?: boolean;
  /** espelhado na horizontal, para a mesma árvore não se repetir igual */
  vira?: boolean;
}

export interface PostoSentinela {
  id: string;
  x: number; y: number;
  /** qual folha de arqueiro: '' é a branca original */
  cor: string;
  desafio: string;
}

export type Estacao = 'verao' | 'outono' | 'inverno';

/**
 * O clima da fase.
 *
 * Os pacotes de arte são alegres: céu azul, maçã vermelha, capim verde.
 * Do jeito que vêm, a primeira fase parece passeio de domingo. `tinta` é
 * uma demão de cor por cima do mundo inteiro, `vinheta` escurece as
 * bordas e `lanterna` apaga tudo o que estiver longe do jogador — é essa
 * última que transforma a terceira fase em outra coisa.
 */
export interface Clima {
  /** o quanto a cor é drenada antes de tudo, de 0 a 1 */
  lavagem: number;
  /** a cor que multiplica o mundo: é ela que escurece de verdade */
  tinta: string;
  /** o quanto as bordas escurecem, de 0 a 1 */
  vinheta: number;
  /** raio de luz em volta do jogador; 0 desliga */
  lanterna?: number;
  /** neve por cima de tudo */
  nevando?: boolean;
  /** o sol no céu; some quando a descida começa */
  sol?: boolean;
}

export interface Fase {
  id: Estacao;
  nome: string;
  /** o que aparece na faixa de abertura */
  abertura: string;
  largura: number;
  blocos: Bloco[];
  adornos: Adorno[];
  /** posição das moedas, em casas */
  moedas: [number, number][];
  sentinelas: PostoSentinela[];
  /** fogueiras: enfeite e ponto de retorno quando o jogador cai */
  fogueiras: [number, number][];
  portal: { x: number; y: number };
  inicio: { x: number; y: number };
  /** onde a Iara está amarrada; só a última fase tem */
  refem?: { x: number; y: number };
  clima: Clima;
}

// ── fase 1: Água Preta ─────────────────────────────────
//
// O povoado, num verão que não bate com o calendário. Tudo aqui está
// arrumado demais: banca posta, roupa no varal, feira montada. E não tem
// ninguém, tirando a Bruna, que está sempre à sua frente.

const AGUA_PRETA: Fase = {
  id: 'verao',
  nome: 'ÁGUA PRETA',
  abertura:
    'O povoado está do jeito que sempre esteve, e é isso o que incomoda. A feira montada, a ' +
    'roupa no varal, e ninguém.',
  clima: { lavagem: 0.42, tinta: 'rgba(150, 128, 96, 0.88)', vinheta: 0.62, sol: true },
  largura: 182,
  inicio: { x: 3, y: 9 },
  blocos: [
    { x: -2, y: 10, l: 28, a: 4 },
    { x: 30, y: 10, l: 22, a: 4 },
    { x: 38, y: 7, l: 6, a: 2 },
    { x: 56, y: 10, l: 18, a: 4 },
    { x: 61, y: 7, l: 5, a: 2 },
    { x: 68, y: 5, l: 4, a: 2 },
    { x: 78, y: 9, l: 12, a: 5 },
    { x: 90, y: 10, l: 24, a: 4 },
    { x: 96, y: 7, l: 5, a: 2 },
    { x: 104, y: 5, l: 5, a: 2 },
    { x: 118, y: 10, l: 26, a: 4 },
    { x: 124, y: 7, l: 4, a: 2 },
    { x: 132, y: 6, l: 4, a: 2 },
    { x: 140, y: 8, l: 6, a: 6 },
    { x: 148, y: 10, l: 36, a: 4 },
  ],
  fogueiras: [[46, 10], [110, 10], [166, 10]],
  sentinelas: [
    { id: 'bruna1', x: 22, y: 10, cor: 'marrom', desafio: 'cerca' },
    { id: 'bruna2', x: 86, y: 9, cor: 'marrom', desafio: 'feira' },
    { id: 'bruna3', x: 140, y: 8, cor: 'marrom', desafio: 'ano' },
  ],
  moedas: [
    [12, 9], [13, 9], [14, 9],
    [39, 6], [41, 6], [43, 6],
    [53, 8], [54, 7], [55, 7],
    [62, 6], [64, 6], [69, 4], [70, 4],
    [97, 6], [99, 6], [105, 4], [106, 4], [107, 4],
    [115, 8], [116, 7], [117, 7],
    [125, 6], [126, 6], [133, 5], [134, 5],
    [158, 9], [159, 9], [172, 9], [173, 9],
  ],
  adornos: [
    { x: -1, y: 10, peca: 'pinheiroG', fundo: true },
    { x: 6, y: 10, peca: 'arvoreH', fundo: true },
    { x: 4, y: 10, peca: 'moitaVerde' },
    { x: 6, y: 10, peca: 'capim' },
    { x: 11, y: 10, peca: 'tendaG' },
    { x: 16, y: 10, peca: 'varal' },
    { x: 18, y: 10, peca: 'caixote' },
    { x: 20, y: 10, peca: 'barril' },

    { x: 21, y: 10, peca: 'tamborete' },
    { x: 8, y: 10, peca: 'feira' },
    { x: 24, y: 10, peca: 'toco', fundo: true },
    { x: 31, y: 10, peca: 'betula1', fundo: true },
    { x: 34, y: 10, peca: 'pedraVerde' },
    { x: 28, y: 10, peca: 'cruz' },
    { x: 32, y: 10, peca: 'lapide1' },
    { x: 45, y: 10, peca: 'panela' },
    { x: 43, y: 10, peca: 'cesto' },
    { x: 48, y: 10, peca: 'lenha' },
    { x: 50, y: 10, peca: 'moitaVerde' },
    { x: 57, y: 10, peca: 'arvoreH', fundo: true },
    { x: 66, y: 10, peca: 'capim' },
    { x: 63, y: 10, peca: 'lapide2' },
    { x: 71, y: 10, peca: 'florida', fundo: true, vira: true },
    { x: 79, y: 9, peca: 'mesa' },
    { x: 82, y: 9, peca: 'maca' },
    { x: 83, y: 9, peca: 'fogareiro' },
    { x: 88, y: 9, peca: 'garrafas' },
    { x: 91, y: 10, peca: 'pinheiroG', fundo: true },
    { x: 94, y: 10, peca: 'moitaVerde' },
    { x: 101, y: 10, peca: 'estatua' },
    { x: 108, y: 10, peca: 'pedraVerde' },
    { x: 111, y: 10, peca: 'cruz' },
    { x: 112, y: 10, peca: 'capim' },
    { x: 119, y: 10, peca: 'arvoreH', fundo: true },
    { x: 122, y: 10, peca: 'juncos' },
    { x: 130, y: 10, peca: 'espantalho' },
    { x: 137, y: 10, peca: 'trigo' },
    { x: 147, y: 10, peca: 'betula1', fundo: true, vira: true },
    { x: 152, y: 10, peca: 'tendaP' },
    { x: 150, y: 10, peca: 'vaso' },
    { x: 156, y: 10, peca: 'lenha' },
    { x: 161, y: 10, peca: 'moitaVerde' },
    { x: 158, y: 10, peca: 'lapide1' },
    { x: 168, y: 10, peca: 'lapide2' },
    { x: 164, y: 10, peca: 'capim' },
    { x: 170, y: 10, peca: 'florida', fundo: true },
    { x: 176, y: 10, peca: 'muro' },
  ],
  portal: { x: 178, y: 10 },
};

// ── fase 2: mata vermelha ───────────────────────────────

const A_BOCA: Fase = {
  id: 'outono',
  nome: 'A BOCA',
  abertura:
    'A mata em volta da boca do poço está cheia de marcos de pedra. São onze, e não tem nome ' +
    'em nenhum.',
  clima: { lavagem: 0.6, tinta: 'rgba(92, 104, 124, 0.92)', vinheta: 0.76 },
  largura: 186,
  inicio: { x: 3, y: 9 },
  blocos: [
    { x: -2, y: 10, l: 24, a: 4 },
    { x: 27, y: 9, l: 6, a: 5 },
    { x: 37, y: 10, l: 20, a: 4 },
    { x: 43, y: 6, l: 5, a: 2 },
    { x: 51, y: 7, l: 4, a: 2 },
    { x: 61, y: 8, l: 8, a: 6 },
    { x: 73, y: 10, l: 22, a: 4 },
    { x: 78, y: 7, l: 4, a: 2 },
    { x: 85, y: 5, l: 4, a: 2 },
    { x: 92, y: 7, l: 4, a: 2 },
    { x: 99, y: 9, l: 10, a: 5 },
    { x: 113, y: 10, l: 28, a: 4 },
    { x: 119, y: 7, l: 5, a: 2 },
    { x: 128, y: 5, l: 5, a: 2 },
    { x: 145, y: 8, l: 7, a: 6 },
    { x: 156, y: 10, l: 32, a: 4 },
    { x: 162, y: 6, l: 4, a: 2 },
  ],
  fogueiras: [[41, 10], [104, 9], [160, 10]],
  sentinelas: [
    { id: 'nita1', x: 18, y: 10, cor: 'preta', desafio: 'conta' },
    { id: 'nita2', x: 90, y: 10, cor: 'preta', desafio: 'nome' },
    { id: 'nita3', x: 148, y: 8, cor: 'preta', desafio: 'corda' },
  ],
  moedas: [
    [9, 9], [10, 9], [11, 9],
    [24, 8], [25, 7], [29, 7], [30, 7],
    [44, 5], [46, 5], [52, 6], [53, 6],
    [58, 7], [59, 6], [64, 6], [66, 6],
    [79, 6], [80, 6], [86, 4], [87, 4], [93, 6], [94, 6],
    [101, 8], [103, 8], [110, 8], [111, 7],
    [120, 6], [122, 6], [129, 4], [130, 4], [131, 4],
    [143, 8], [144, 7], [163, 5], [164, 5],
    [176, 9], [177, 9],
  ],
  adornos: [
    { x: -1, y: 10, peca: 'betula1', fundo: true },
    { x: 5, y: 10, peca: 'arvoreH', fundo: true },
    { x: 3, y: 10, peca: 'moitaOutono' },
    { x: 8, y: 10, peca: 'folhas' },
    { x: 12, y: 10, peca: 'tendaG' },
    { x: 15, y: 10, peca: 'lenha' },
    { x: 20, y: 10, peca: 'toco', fundo: true },
    { x: 28, y: 9, peca: 'pedraOutono' },
    { x: 38, y: 10, peca: 'betula2', fundo: true },
    { x: 40, y: 10, peca: 'panela' },
    { x: 45, y: 10, peca: 'moitaOutono' },
    { x: 55, y: 10, peca: 'abobora' },
    { x: 62, y: 8, peca: 'folhas' },
    { x: 65, y: 8, peca: 'cruz' },
    { x: 74, y: 10, peca: 'arvoreH', fundo: true, vira: true },
    { x: 76, y: 10, peca: 'lapide1' },
    { x: 82, y: 10, peca: 'lapide2' },
    { x: 79, y: 10, peca: 'urna' },
    { x: 89, y: 10, peca: 'barril' },
    { x: 96, y: 10, peca: 'moitaOutono' },
    { x: 100, y: 9, peca: 'espantalho' },
    { x: 106, y: 9, peca: 'abobora' },
    { x: 114, y: 10, peca: 'betula3', fundo: true },
    { x: 117, y: 10, peca: 'folhas' },
    { x: 125, y: 10, peca: 'cipreste', fundo: true },
    { x: 135, y: 10, peca: 'pedraOutono' },
    { x: 139, y: 10, peca: 'trigo' },
    { x: 146, y: 8, peca: 'folhas' },
    { x: 157, y: 10, peca: 'arvoreH', fundo: true },
    { x: 159, y: 10, peca: 'tendaP' },
    { x: 168, y: 10, peca: 'moitaOutono' },
    { x: 172, y: 10, peca: 'betula1', fundo: true, vira: true },
    { x: 180, y: 10, peca: 'muro' },
  ],
  portal: { x: 182, y: 10 },
};

// ── fase 3: serra branca ────────────────────────────────

const O_FUNDO: Fase = {
  id: 'inverno',
  nome: 'O FUNDO',
  abertura:
    'A corda acabou a cinquenta braças e você continuou descendo mais um tanto. Aqui embaixo ' +
    'tem uma serra nevada, com céu, e isso não pode.',
  clima: { lavagem: 0.72, tinta: 'rgba(58, 72, 122, 0.95)', vinheta: 0.84, lanterna: 168, nevando: true },
  largura: 190,
  inicio: { x: 3, y: 9 },
  blocos: [
    { x: -2, y: 10, l: 22, a: 4 },
    { x: 26, y: 10, l: 16, a: 4 },
    { x: 32, y: 6, l: 5, a: 2 },
    { x: 46, y: 9, l: 8, a: 5 },
    { x: 58, y: 10, l: 18, a: 4 },
    { x: 63, y: 7, l: 4, a: 2 },
    { x: 70, y: 5, l: 4, a: 2 },
    { x: 80, y: 8, l: 10, a: 6 },
    { x: 94, y: 10, l: 20, a: 4 },
    { x: 99, y: 7, l: 4, a: 2 },
    { x: 106, y: 5, l: 5, a: 2 },
    { x: 118, y: 9, l: 12, a: 5 },
    { x: 134, y: 10, l: 22, a: 4 },
    { x: 139, y: 7, l: 5, a: 2 },
    { x: 148, y: 5, l: 4, a: 2 },
    { x: 160, y: 8, l: 8, a: 6 },
    { x: 172, y: 10, l: 20, a: 4 },
  ],
  fogueiras: [[38, 10], [96, 10], [152, 10]],
  sentinelas: [
    { id: 'vilma1', x: 16, y: 10, cor: 'roxa', desafio: 'saida' },
    { id: 'vilma2', x: 86, y: 8, cor: 'roxa', desafio: 'olhar' },
    { id: 'vilma3', x: 164, y: 8, cor: 'roxa', desafio: 'troca' },
  ],
  moedas: [
    [8, 9], [9, 9], [10, 9],
    [23, 8], [24, 7], [28, 9], [29, 9],
    [33, 5], [35, 5], [43, 8], [44, 7],
    [48, 8], [50, 8], [56, 8], [57, 7],
    [64, 6], [65, 6], [71, 4], [72, 4],
    [82, 7], [84, 7], [91, 8], [92, 7],
    [100, 6], [101, 6], [107, 4], [108, 4], [109, 4],
    [120, 8], [122, 8], [131, 8], [132, 7],
    [140, 6], [142, 6], [149, 4], [150, 4],
    [158, 7], [159, 7], [180, 9], [181, 9],
  ],
  adornos: [
    { x: -1, y: 10, peca: 'pinheiroG', fundo: true },
    { x: 5, y: 10, peca: 'cipreste', fundo: true },
    { x: 3, y: 10, peca: 'moitaNeve' },
    { x: 8, y: 10, peca: 'neve' },
    { x: 11, y: 10, peca: 'tendaG' },
    { x: 14, y: 10, peca: 'lenha' },
    { x: 18, y: 10, peca: 'toco', fundo: true },
    { x: 27, y: 10, peca: 'cipreste', fundo: true, vira: true },
    { x: 30, y: 10, peca: 'pedraNeve' },
    { x: 40, y: 10, peca: 'panela' },
    { x: 47, y: 9, peca: 'neve' },
    { x: 51, y: 9, peca: 'natal' },
    { x: 59, y: 10, peca: 'pinheiroG', fundo: true },
    { x: 62, y: 10, peca: 'moitaNeve' },
    { x: 74, y: 10, peca: 'estatuaNeve' },
    { x: 81, y: 8, peca: 'barril' },
    { x: 84, y: 8, peca: 'caixote' },
    { x: 88, y: 8, peca: 'neve' },
    { x: 95, y: 10, peca: 'cipreste', fundo: true },
    { x: 103, y: 10, peca: 'moitaNeve' },
    { x: 111, y: 10, peca: 'pedraNeve' },
    { x: 108, y: 10, peca: 'minerio' },
    { x: 119, y: 9, peca: 'neve' },
    { x: 124, y: 9, peca: 'natal' },
    { x: 135, y: 10, peca: 'pinheiroG', fundo: true, vira: true },
    { x: 145, y: 10, peca: 'moitaNeve' },
    { x: 154, y: 10, peca: 'tendaP' },
    { x: 161, y: 8, peca: 'neve' },
    { x: 173, y: 10, peca: 'cipreste', fundo: true },
    { x: 176, y: 10, peca: 'estatuaNeve' },
    { x: 185, y: 10, peca: 'muro' },
  ],
  portal: { x: 187, y: 10 },
  refem: { x: 182, y: 10 },
};

export const FASES: Fase[] = [AGUA_PRETA, A_BOCA, O_FUNDO];
