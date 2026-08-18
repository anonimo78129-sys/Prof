import * as THREE from 'three';
import {
  TEX, matCubo, matPlanta,
  TRIGO, MUDA, MUDA_TOMBADA, FOLHA_AMARELA, MATO, ARBUSTO, SAMAMBAIA,
  FLOR_VERMELHA, FLOR_AZUL, FLOR_BRANCA, PETALAS, FOLHAS_CAIDAS, MUSGO,
} from './blocos';

// ─────────────────────────────────────────────────────────
// O NÚCLEO VERDE
//
// A primeira versão deste lugar era um corredor reto de ponta a ponta, e
// os alunos acertaram em cheio ao chamar de salão sem graça: se o mundo
// é igual em todo canto, andar nele não informa nada. Aqui o espaço faz
// parte da matéria. Cada setor tem forma, altura, luz e sujeira próprias,
// e o problema de cada bancada aparece no chão antes de aparecer no texto:
//
//   ENTRADA    eclusa de metal e um mirante alto — a primeira coisa que
//              se vê é a estufa inteira lá embaixo, não uma parede
//   SETOR 1    viveiro de mudas: bancadas de madeira com as mudas
//              TOMBADAS e os ventiladores de parede parados
//   SETOR 2    lavoura alta com as folhas de BAIXO amarelas, o tanque de
//              nutriente vazio e a tubulação seca por cima
//   SETOR 3    o canteiro bonito: espelho d'água, pergolado, flor por
//              todo lado — e pétala caída no chão, nenhum fruto
//   SETOR 4    o monte de terra de verdade, com árvore, mato e a parede
//              de concreto rachada ao fundo
//
// Tudo isso debaixo de uma abóbada de vidro com céu aberto, que é de onde
// vem a cor: sem o azul lá em cima o verde do canteiro não tem contra quê
// brilhar.
// ─────────────────────────────────────────────────────────

// ── identificação dos blocos ─────────────────────────────
export const AR = 0;
export const CONCRETO = 1, CONCRETO_RACHADO = 2, PEDRA = 3, PEDRA_MUSGO = 4,
             TIJOLO = 5, METAL = 6, CANO = 7;
export const TERRA = 10, TERRA_FERTIL = 11, GRAMA = 12, AREIA = 13, CASCALHO = 14;
export const MADEIRA = 20, TRONCO = 21, FOLHAS = 22;
export const VIDRO = 30, AGUA = 31, LANTERNA = 32;
export const P_TRIGO = 40, P_MUDA = 41, P_MUDA_TOMBADA = 42, P_MATO = 43,
             P_FOLHA_AMARELA = 44, P_FLOR_R = 45, P_FLOR_A = 46, P_FLOR_B = 47,
             P_ARBUSTO = 48, P_SAMAMBAIA = 49;
export const T_PETALAS = 55, T_FOLHAS = 56, T_MUSGO = 57;
export const M_VASO = 60, M_VALVULA = 61, M_SENSOR = 62;
export const PL_VENTILADOR = 70;

export type Forma = 'cubo' | 'cruz' | 'tapete' | 'miudo' | 'placa' | 'liquido' | 'luminaria';

interface Def {
  forma: Forma;
  /** barra o passo do jogador */
  duro: boolean;
  /** esconde a face do vizinho — falso para tudo que se vê através */
  tapa: boolean;
}

const CUBO: Def = { forma: 'cubo', duro: true, tapa: true };
const PLANTA: Def = { forma: 'cruz', duro: false, tapa: false };
const TAPETE: Def = { forma: 'tapete', duro: false, tapa: false };
const MIUDO: Def = { forma: 'miudo', duro: false, tapa: false };

export const DEF: Record<number, Def> = {
  [CONCRETO]: CUBO, [CONCRETO_RACHADO]: CUBO, [PEDRA]: CUBO, [PEDRA_MUSGO]: CUBO,
  [TIJOLO]: CUBO, [METAL]: CUBO, [CANO]: CUBO,
  [TERRA]: CUBO, [TERRA_FERTIL]: CUBO, [GRAMA]: CUBO, [AREIA]: CUBO, [CASCALHO]: CUBO,
  [MADEIRA]: CUBO, [TRONCO]: CUBO,
  [FOLHAS]: { forma: 'cubo', duro: true, tapa: false },
  [VIDRO]: { forma: 'cubo', duro: true, tapa: false },
  [LANTERNA]: { forma: 'luminaria', duro: false, tapa: false },
  [AGUA]: { forma: 'liquido', duro: false, tapa: false },
  [P_TRIGO]: PLANTA, [P_MUDA]: PLANTA, [P_MUDA_TOMBADA]: PLANTA, [P_MATO]: PLANTA,
  [P_FOLHA_AMARELA]: PLANTA, [P_FLOR_R]: PLANTA, [P_FLOR_A]: PLANTA,
  [P_FLOR_B]: PLANTA, [P_ARBUSTO]: PLANTA, [P_SAMAMBAIA]: PLANTA,
  [T_PETALAS]: TAPETE, [T_FOLHAS]: TAPETE, [T_MUSGO]: TAPETE,
  [M_VASO]: MIUDO, [M_VALVULA]: MIUDO, [M_SENSOR]: MIUDO,
  [PL_VENTILADOR]: { forma: 'placa', duro: false, tapa: false },
};

export const forma = (t: number): Forma => DEF[t]?.forma ?? 'cubo';
export const duro = (t: number) => t !== AR && !!DEF[t]?.duro;
export const tapa = (t: number) => t !== AR && !!DEF[t]?.tapa;

// ── a grade ──────────────────────────────────────────────
export const WX = 52, WY = 22, WZ = 96;
const grade = new Uint8Array(WX * WY * WZ);
const iv = (x: number, y: number, z: number) => x + y * WX + z * WX * WY;

export const bloco = (x: number, y: number, z: number) =>
  (x < 0 || y < 0 || z < 0 || x >= WX || y >= WY || z >= WZ) ? AR : grade[iv(x, y, z)];

const poe = (x: number, y: number, z: number, t: number) => {
  if (x >= 0 && y >= 0 && z >= 0 && x < WX && y < WY && z < WZ) grade[iv(x, y, z)] = t;
};

const caixa = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, t: number) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
    poe(x, y, z, t);
};

/** Ruído estável por posição: mesma sujeira, mesma flor, toda partida. */
const acaso = (a: number, b: number, c = 0) => {
  let n = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

/** Altura do chão numa coluna: y do topo sólido mais alto até o limite. */
export function alturaSolo(gx: number, gz: number, ate = WY - 1) {
  for (let y = Math.min(ate, WY - 1); y >= 0; y--) if (duro(bloco(gx, y, gz))) return y + 1;
  return 0;
}

// ── a abóbada ────────────────────────────────────────────
const CX = (WX - 1) / 2;
const ALTO = 20, CURVA = 8;
/** Arco de vidro: alto no meio, descendo até as paredes laterais. */
export const yArco = (gx: number) => Math.round(ALTO - ((gx - CX) / CX) ** 2 * CURVA);

const Z_FUNDO = 4, Z_TOPO = 94;   // trecho coberto pela abóbada

// ── construção ───────────────────────────────────────────

export function montaMundo() {
  grade.fill(AR);
  casca();
  chao();
  estrutura();
  entrada();
  setorMudas();
  setorFolhas();
  setorFlores();
  setorSolo();
  paredeFundo();
  acabamento();
}

/** Paredes laterais, tampas de ponta e o vidro do arco. */
function casca() {
  for (let gz = Z_FUNDO; gz <= Z_TOPO; gz++) {
    for (let gx = 0; gx < WX; gx++) {
      const alto = yArco(gx);
      const lateral = gx <= 2 || gx >= WX - 3;
      if (lateral) {
        for (let y = 0; y < alto; y++) {
          const a = acaso(gx, y, gz);
          poe(gx, y, gz,
            y < 3 ? (a < 0.28 ? PEDRA_MUSGO : PEDRA)
              : gz % 8 === 0 ? METAL
                : a < 0.12 ? CONCRETO_RACHADO : CONCRETO);
        }
      }
      // a casca do arco: nervura de madeira de seis em seis, vidro no resto.
      // Em metal, o teto ocupava quase metade da tela em cinza — de madeira
      // ele esquenta a cena inteira e casa com as vigas lá embaixo.
      const teto = Math.max(yArco(gx - 1), yArco(gx + 1));
      for (let y = alto; y <= Math.max(alto, teto - 1); y++)
        poe(gx, y, gz, gz % 6 === 0 ? MADEIRA : VIDRO);
    }
  }
  // tampas: fundo de concreto (é nele que o carbono ficou preso) e topo
  for (let gz = 0; gz < Z_FUNDO; gz++)
    for (let gx = 0; gx < WX; gx++)
      for (let y = 0; y <= yArco(gx); y++)
        poe(gx, y, gz, acaso(gx, y, gz) < 0.35 ? PEDRA : CONCRETO_RACHADO);
  for (let gz = Z_TOPO + 1; gz < WZ; gz++)
    for (let gx = 0; gx < WX; gx++)
      for (let y = 0; y <= yArco(gx); y++) poe(gx, y, gz, CONCRETO);
}

/** A parede que fecha o Núcleo Verde. É nela que o carbono ficou preso, e
 *  é o ponto de fuga de todo o galpão — chapada, virava um borrão cinza. */
function paredeFundo() {
  for (let gx = 3; gx < WX - 3; gx++) for (let y = 2; y <= 13; y++)
    if (acaso(gx, y, 777) < 0.22) poe(gx, y, 3, CONCRETO_RACHADO);
  for (let gx = 5; gx < WX - 4; gx += 6) caixa(gx, 2, 3, gx + 1, 12, 3, METAL);
  caixa(3, 13, 3, WX - 4, 13, 3, METAL);
  // o portão para o resto do Silo, aceso: o fundo do galpão precisa de um
  // ponto para onde o olho vá, senão vira um borrão claro no horizonte
  caixa(22, 2, 3, 29, 9, 3, METAL);
  caixa(23, 3, 3, 28, 8, 3, PEDRA);
  for (const gx of [24, 27]) for (const y of [4, 7]) poe(gx, y, 3, LANTERNA);
  poe(21, 4, 4, M_VALVULA);
}

/** Piso do jardim em y=0 e y=1, com o canal d'água correndo do lado oeste. */
function chao() {
  for (let gz = Z_FUNDO; gz <= Z_TOPO; gz++) for (let gx = 3; gx < WX - 3; gx++) {
    poe(gx, 0, gz, CASCALHO);
    const a = acaso(gx, gz, 5);
    const meio = gx >= 8 && gx <= 43;
    poe(gx, 1, gz, meio ? (a < 0.08 ? CASCALHO : TIJOLO) : (a < 0.2 ? PEDRA_MUSGO : PEDRA));
  }

  // canal: a lâmina d'água fica rente ao piso, dá para entrar dentro
  for (let gz = 10; gz <= 78; gz++) for (let gx = 3; gx <= 7; gx++) {
    poe(gx, 1, gz, AGUA);
    poe(gx, 0, gz, gx === 3 || gx === 7 ? PEDRA : AREIA);
  }
  for (const gz of [22, 42, 62]) caixa(3, 1, gz - 1, 7, 1, gz, MADEIRA);
}

/** Pilares e vigas: o ritmo que faz o galpão ter tamanho legível. */
function estrutura() {
  for (let gz = 12; gz <= 76; gz += 8) {
    for (const gx of [8, 43]) caixa(gx, 2, gz, gx, 11, gz, PEDRA);
    // a viga é um braço curto para dentro, não uma travessa de ponta a
    // ponta: atravessando o vão inteiro ela ficava na linha do olho e
    // tapava o jardim de quem chega no mirante
    caixa(8, 12, gz, 14, 12, gz, MADEIRA);
    caixa(37, 12, gz, 43, 12, gz, MADEIRA);
    for (const gx of [13, 38]) poe(gx, 11, gz, LANTERNA);
  }
}

/** Eclusa de metal lá em cima, mirante de madeira e a escada de descida. */
function entrada() {
  // laje do mirante e da eclusa
  caixa(19, 8, 80, 32, 8, 94, MADEIRA);
  caixa(19, 8, 88, 32, 8, 94, METAL);
  for (const gx of [19, 32]) for (const gz of [80, 87, 94]) caixa(gx, 2, gz, gx, 7, gz, PEDRA);

  // eclusa fechada, com lanterna e uma janela para o jardim
  caixa(19, 9, 88, 19, 13, 94, METAL);
  caixa(32, 9, 88, 32, 13, 94, METAL);
  caixa(19, 13, 88, 32, 13, 94, METAL);
  caixa(19, 9, 94, 32, 12, 94, METAL);
  caixa(19, 9, 88, 32, 12, 88, METAL);
  caixa(20, 10, 88, 23, 12, 88, VIDRO);
  caixa(28, 10, 88, 31, 12, 88, VIDRO);
  caixa(24, 9, 88, 27, 12, 88, AR);          // a porta
  for (const gx of [21, 30]) poe(gx, 12, 91, LANTERNA);

  // guarda-corpo do mirante, aberto só onde começa a escada
  for (let gx = 19; gx <= 32; gx++) if (gx < 23 || gx > 28) poe(gx, 9, 80, MADEIRA);
  for (let gz = 80; gz <= 87; gz++) { poe(19, 9, gz, MADEIRA); poe(32, 9, gz, MADEIRA); }
  for (const gx of [19, 32]) for (const gz of [80, 84, 87]) poe(gx, 10, gz, LANTERNA);

  // escada de pedra descendo do mirante até o piso do jardim
  for (let gz = 79; gz >= 72; gz--) {
    const h = 9 - (79 - gz);
    caixa(23, 0, gz, 28, h - 1, gz, PEDRA);
  }
  for (let gz = 72; gz <= 79; gz++) {
    const h = 9 - (79 - gz);
    for (const gx of [22, 29]) caixa(gx, 0, gz, gx, h - 1, gz, TIJOLO);
  }
}

/** Bancada por bancada, o miolo de cada setor. */

function bancada(x0: number, x1: number, z0: number, z1: number, borda: number, dentro: number) {
  for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
    const nabordo = gx === x0 || gx === x1 || gz === z0 || gz === z1;
    poe(gx, 2, gz, nabordo ? borda : dentro);
  }
}

function setorMudas() {
  for (const x0 of [13, 31]) {
    bancada(x0, x0 + 8, 61, 77, MADEIRA, TERRA);
    for (let gx = x0 + 1; gx < x0 + 8; gx++) for (let gz = 62; gz < 77; gz++) {
      const a = acaso(gx, gz, 11);
      // a maioria caída: é o que o texto da bancada 1 vai cobrar
      if (a < 0.62) poe(gx, 3, gz, P_MUDA_TOMBADA);
      else if (a < 0.82) poe(gx, 3, gz, P_MUDA);
    }
    // pé de madeira embaixo da bancada, para não parecer terra flutuando
    for (let gz = 62; gz < 77; gz += 4) { poe(x0, 2, gz, MADEIRA); poe(x0 + 8, 2, gz, MADEIRA); }
  }

  // Os ventiladores parados. Ficavam na parede lateral, longe demais para
  // alguém reparar; presos nos pilares do corredor eles entram no mesmo
  // enquadramento das mudas caídas, que é onde a pergunta se resolve.
  for (const gz of [60, 68, 76]) {
    poe(9, 5, gz, PL_VENTILADOR);
    poe(42, 5, gz, PL_VENTILADOR);
  }
  poe(3, 6, 70, PL_VENTILADOR);
  poe(WX - 4, 6, 66, PL_VENTILADOR);

  // caixotaria e vasos derrubados no corredor
  for (const [gx, gz] of [[23, 64], [28, 69], [24, 74], [27, 62], [22, 71]])
    poe(gx, 2, gz, M_VASO);
  caixa(41, 2, 66, 42, 3, 68, MADEIRA);
}

function setorFolhas() {
  for (const x0 of [11, 30]) {
    bancada(x0, x0 + 9, 45, 58, TIJOLO, TERRA);
    for (let gx = x0 + 1; gx < x0 + 9; gx++) for (let gz = 46; gz < 58; gz++) {
      const a = acaso(gx, gz, 13);
      // amarelão começa pelas beiradas e pelas folhas de baixo
      const beira = gx <= x0 + 2 || gx >= x0 + 7;
      if (a < (beira ? 0.55 : 0.22)) poe(gx, 3, gz, P_FOLHA_AMARELA);
      else if (a < 0.86) poe(gx, 3, gz, P_TRIGO);
    }
  }

  // tanque de nutriente, com visor de vidro mostrando que está vazio
  caixa(43, 2, 49, 47, 8, 55, METAL);
  caixa(43, 3, 51, 43, 7, 53, VIDRO);
  poe(42, 3, 52, M_VALVULA);

  // tubulação seca cruzando o setor por cima
  for (const gz of [47, 56]) {
    caixa(10, 9, gz, 43, 9, gz, CANO);
    for (const gx of [10, 42]) caixa(gx, 3, gz, gx, 8, gz, CANO);
    poe(21, 10, gz, M_VALVULA);
  }

  // folha caída acumulada em volta das bancadas
  for (let gx = 9; gx <= 42; gx++) for (let gz = 44; gz <= 59; gz++) {
    if (bloco(gx, 2, gz) !== AR) continue;
    if (acaso(gx, gz, 17) < 0.34) poe(gx, 2, gz, T_FOLHAS);
  }
}

function setorFlores() {
  // espelho d'água rebaixado, com areia na beirada
  for (let gx = 16; gx <= 35; gx++) for (let gz = 28; gz <= 40; gz++) {
    const dentro = gx >= 17 && gx <= 34 && gz >= 29 && gz <= 39;
    poe(gx, 1, gz, dentro ? AGUA : AREIA);
  }
  caixa(24, 1, 28, 27, 1, 40, MADEIRA);      // a ponte por cima da água

  // canteiros floridos dos dois lados
  for (const x0 of [11, 35]) {
    for (let gx = x0; gx <= x0 + 5; gx++) for (let gz = 28; gz <= 41; gz++) {
      poe(gx, 2, gz, GRAMA);
      const a = acaso(gx, gz, 19);
      if (a < 0.30) poe(gx, 3, gz, P_FLOR_R);
      else if (a < 0.52) poe(gx, 3, gz, P_FLOR_A);
      else if (a < 0.72) poe(gx, 3, gz, P_FLOR_B);
      else if (a < 0.82) poe(gx, 3, gz, P_MATO);
    }
  }

  // pergolado de madeira sobre a ponte
  for (const gx of [20, 31]) for (const gz of [28, 41]) caixa(gx, 2, gz, gx, 6, gz, TRONCO);
  for (const gz of [28, 41]) caixa(20, 6, gz, 31, 6, gz, MADEIRA);
  for (const gx of [20, 31]) caixa(gx, 6, 28, gx, 6, 41, MADEIRA);
  for (const gz of [31, 34, 38]) { poe(20, 5, gz, LANTERNA); poe(31, 5, gz, LANTERNA); }

  // pétala caída: a flor abre, fica três dias e cai inteira
  for (let gx = 9; gx <= 42; gx++) for (let gz = 26; gz <= 43; gz++) {
    if (bloco(gx, 2, gz) !== AR) continue;
    if (acaso(gx, gz, 23) < 0.4) poe(gx, 2, gz, T_PETALAS);
  }
}

function arvore(gx: number, gz: number, altura: number, semente: number) {
  const base = alturaSolo(gx, gz, 8);
  caixa(gx, base, gz, gx, base + altura - 1, gz, TRONCO);
  const topo = base + altura - 1;
  for (let dy = -2; dy <= 1; dy++) {
    const r = dy === 1 ? 1 : dy === -2 ? 2 : 3;
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx === 0 && dz === 0 && dy <= 0) continue;
      if (Math.abs(dx) === r && Math.abs(dz) === r && acaso(gx + dx, gz + dz, semente) < 0.7) continue;
      poe(gx + dx, topo + dy, gz + dz, FOLHAS);
    }
  }
}

function setorSolo() {
  // um monte de terra de verdade — a única no Núcleo Verde
  for (let gx = 9; gx <= 42; gx++) for (let gz = 6; gz <= 25; gz++) {
    const d = Math.hypot((gx - 25.5) / 16, (gz - 16) / 9.5);
    if (d > 1.05) continue;
    const h = Math.max(1, Math.round(3.8 * (1 - d * d) + acaso(gx, gz, 29) * 0.8));
    for (let y = 2; y < 2 + h; y++) poe(gx, y, gz, TERRA_FERTIL);
    poe(gx, 1 + h, gz, GRAMA);
  }

  arvore(25, 14, 8, 31);
  arvore(34, 21, 4, 37);
  arvore(15, 11, 4, 41);

  // mato, samambaia e flor por cima do monte
  for (let gx = 9; gx <= 42; gx++) for (let gz = 6; gz <= 25; gz++) {
    const y = alturaSolo(gx, gz, 8);
    if (bloco(gx, y - 1, gz) !== GRAMA || bloco(gx, y, gz) !== AR) continue;
    const a = acaso(gx, gz, 43);
    if (a < 0.26) poe(gx, y, gz, P_MATO);
    else if (a < 0.36) poe(gx, y, gz, P_SAMAMBAIA);
    else if (a < 0.42) poe(gx, y, gz, P_ARBUSTO);
    else if (a < 0.48) poe(gx, y, gz, a < 0.45 ? P_FLOR_B : P_FLOR_A);
    else if (a < 0.56) poe(gx, y, gz, T_MUSGO);
  }

  // o sensor fincado na terra morna, ao lado do ponto da cena
  poe(22, alturaSolo(22, 16, 8), 16, M_SENSOR);
  poe(21, alturaSolo(21, 17, 8), 17, M_VASO);
}

/** Sujeira miúda que quebra a regularidade do piso. */
function acabamento() {
  for (let gx = 8; gx <= 43; gx++) for (let gz = 26; gz <= 79; gz++) {
    if (bloco(gx, 2, gz) !== AR) continue;
    if (acaso(gx, gz, 53) < 0.05) poe(gx, 2, gz, T_MUSGO);
  }
  // canteiro corrido rente às laterais, ligando um setor ao outro
  for (let gz = 26; gz <= 79; gz++) for (const gx of [9, 10, 41, 42]) {
    if (bloco(gx, 2, gz) !== AR) continue;
    poe(gx, 2, gz, GRAMA);
    const a = acaso(gx, gz, 61);
    if (a < 0.34) poe(gx, 3, gz, P_MATO);
    else if (a < 0.48) poe(gx, 3, gz, P_SAMAMBAIA);
    else if (a < 0.56) poe(gx, 3, gz, P_ARBUSTO);
    else if (a < 0.62) poe(gx, 3, gz, P_FLOR_B);
  }

  // musgo subindo pelo pé das paredes: o lugar tem trinta anos
  for (let gz = Z_FUNDO; gz <= Z_TOPO; gz++) for (const gx of [2, WX - 3])
    for (let y = 2; y <= 5; y++)
      if (acaso(gx, y, gz) < 0.3) poe(gx, y, gz, PEDRA_MUSGO);
}

// ── materiais ────────────────────────────────────────────

export function materiais(): Record<number, THREE.Material | THREE.Material[]> {
  const lado = matCubo(TEX.gramaLado);
  const troncoLado = matCubo(TEX.troncoLado);
  return {
    [CONCRETO]: matCubo(TEX.concreto),
    [CONCRETO_RACHADO]: matCubo(TEX.concretoRachado),
    [PEDRA]: matCubo(TEX.pedra),
    [PEDRA_MUSGO]: matCubo(TEX.pedraMusgo),
    [TIJOLO]: matCubo(TEX.tijolo),
    [METAL]: matCubo(TEX.metal),
    [CANO]: matCubo(TEX.cano),
    [TERRA]: matCubo(TEX.terra),
    [TERRA_FERTIL]: matCubo(TEX.terraFertil),
    // topo verde, lado com franja, base de terra: é o que dá volume ao monte
    [GRAMA]: [lado, lado, matCubo(TEX.gramaTopo), matCubo(TEX.terra), lado, lado],
    [AREIA]: matCubo(TEX.areia),
    [CASCALHO]: matCubo(TEX.cascalho),
    [MADEIRA]: matCubo(TEX.madeira),
    [TRONCO]: [troncoLado, troncoLado, matCubo(TEX.troncoTopo), matCubo(TEX.troncoTopo), troncoLado, troncoLado],
    [FOLHAS]: new THREE.MeshLambertMaterial({ map: TEX.folhas, alphaTest: 0.5, side: THREE.DoubleSide }),
    [VIDRO]: new THREE.MeshLambertMaterial({ map: TEX.vidro, transparent: true, opacity: 0.5, depthWrite: false }),
    [LANTERNA]: new THREE.MeshBasicMaterial({ map: TEX.lanterna }),
    [AGUA]: new THREE.MeshLambertMaterial({
      map: TEX.agua, transparent: true, opacity: 0.82, side: THREE.DoubleSide,
    }),
    [P_TRIGO]: matPlanta(TRIGO),
    [P_MUDA]: matPlanta(MUDA),
    [P_MUDA_TOMBADA]: matPlanta(MUDA_TOMBADA),
    [P_MATO]: matPlanta(MATO),
    [P_FOLHA_AMARELA]: matPlanta(FOLHA_AMARELA),
    [P_FLOR_R]: matPlanta(FLOR_VERMELHA),
    [P_FLOR_A]: matPlanta(FLOR_AZUL),
    [P_FLOR_B]: matPlanta(FLOR_BRANCA),
    [P_ARBUSTO]: matPlanta(ARBUSTO),
    [P_SAMAMBAIA]: matPlanta(SAMAMBAIA),
    [T_PETALAS]: matPlanta(PETALAS),
    [T_FOLHAS]: matPlanta(FOLHAS_CAIDAS),
    [T_MUSGO]: matPlanta(MUSGO),
    [M_VASO]: matCubo(TEX.terra),
    [M_VALVULA]: matCubo(TEX.cano),
    [M_SENSOR]: matCubo(TEX.metal),
    [PL_VENTILADOR]: matCubo(TEX.ventilador),
  };
}

// ── consultas do jogador ─────────────────────────────────

/** Onde o pé para: converte mundo em grade e procura o topo sólido.
 *  A busca começa um bloco acima do pé, e é isso que permite subir
 *  degrau de um bloco andando, como no jogo de referência. */
export function pisoEm(wx: number, wz: number, peY: number): number | null {
  const gx = Math.floor(wx + WX / 2), gz = Math.floor(wz + WZ / 2);
  if (gx < 0 || gz < 0 || gx >= WX || gz >= WZ) return null;
  const de = Math.min(WY - 2, Math.floor(peY) + 1);
  for (let y = de; y >= 0; y--) {
    if (!duro(bloco(gx, y, gz))) continue;
    const topo = y + 1;
    // cabeça precisa caber: dois blocos livres acima do piso
    if (duro(bloco(gx, topo, gz)) || duro(bloco(gx, topo + 1, gz))) return null;
    return topo;
  }
  return null;
}

export const INICIO = { x: 0, y: 9, z: 34 };
export const ALTURA_OLHO = 1.62;
