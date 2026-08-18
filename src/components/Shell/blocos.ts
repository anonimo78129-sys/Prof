import * as THREE from 'three';

// ─────────────────────────────────────────────────────────
// AS PEÇAS DO MUNDO
//
// Toda textura aqui é desenhada por código num quadrado de 16x16 e
// filtrada em NearestFilter — é daí que vem a cara de bloco.
//
// Duas coisas importam mais do que parecem:
//
// 1. COR. Bloco de voxel não tem sombra suave nem detalhe fino, então a
//    leitura vem quase toda da cor. Cor lavada deixa o mundo com aspecto
//    de maquete de isopor. As paletas abaixo são saturadas de propósito:
//    verde de folha nova, terra alaranjada, água azul de verdade.
//
// 2. FORMA. Nem tudo é cubo inteiro:
//      CUBO     parede, piso, terra, madeira, folhagem
//      CRUZ     planta — duas placas em X com textura recortada
//      TAPETE   quadrado rente ao chão — pétala caída, musgo
//      MIÚDO    cubo pequeno — vaso, válvula, sensor
//      PLACA    caixa fina presa na parede — ventilador, painel
//      LÍQUIDO  só a lâmina de cima da água
//    Desenhar planta como cubo é o que dá aspecto de caixote empilhado.
// ─────────────────────────────────────────────────────────

const N = 16;

/** Ruído reprodutível: a mesma textura em toda partida. */
function prng(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pincel = CanvasRenderingContext2D;

function tela(semente: number, desenhar: (g: Pincel, r: () => number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  desenhar(g, prng(semente));
  return pronta(c);
}

function pronta(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;          // pixel duro
  t.minFilter = THREE.NearestMipmapNearestFilter;
  t.generateMipmaps = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;   // água precisa correr
  return t;
}

function fundo(g: Pincel, cor: string) {
  g.fillStyle = cor;
  g.fillRect(0, 0, N, N);
}

/** Granulado por cima: o que impede o bloco de virar cor chapada. */
function salpica(g: Pincel, r: () => number, dens: number, tons: string[]) {
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (r() > dens) continue;
    g.fillStyle = tons[(r() * tons.length) | 0];
    g.fillRect(x, y, 1, 1);
  }
}

function linhaH(g: Pincel, y: number, cor: string) {
  g.fillStyle = cor; g.fillRect(0, y, N, 1);
}

function linhaV(g: Pincel, x: number, y0: number, y1: number, cor: string) {
  g.fillStyle = cor; g.fillRect(x, y0, 1, y1 - y0);
}

// ── texturas de cubo ─────────────────────────────────────

export const TEX = {
  concreto: tela(11, (g, r) => {
    fundo(g, '#c6bfab');
    salpica(g, r, 0.55, ['#b6ae99', '#d3ccb9', '#aaa28c', '#cec7b4']);
  }),

  concretoRachado: tela(12, (g, r) => {
    fundo(g, '#9d9583');
    salpica(g, r, 0.5, ['#8b8371', '#aaa290', '#7c7563']);
    g.fillStyle = '#5f5949';
    // uma rachadura descendo torta, sem simetria
    let x = 4;
    for (let y = 0; y < N; y++) {
      g.fillRect(x, y, 1, 1);
      if (r() < 0.45) x += r() < 0.5 ? 1 : -1;
      x = Math.max(1, Math.min(N - 2, x));
      if (y === 7) { g.fillRect(x + 1, y, 4, 1); }
    }
  }),

  pedra: tela(21, (g, r) => {
    fundo(g, '#8f8f8f');
    salpica(g, r, 0.6, ['#7d7d7d', '#9e9e9e', '#727272', '#a8a8a8']);
  }),

  pedraMusgo: tela(22, (g, r) => {
    fundo(g, '#868a80');
    salpica(g, r, 0.6, ['#767a70', '#95998e', '#6b6f66']);
    salpica(g, r, 0.3, ['#5d8a3c', '#4d7530', '#6d9c46']);
  }),

  tijolo: tela(23, (g, r) => {
    fundo(g, '#ab9f8c');
    salpica(g, r, 0.45, ['#9b9080', '#bbb09d', '#8d8374']);
    const junta = '#7d7365';
    linhaH(g, 0, junta); linhaH(g, 8, junta);
    linhaV(g, 0, 0, 8, junta); linhaV(g, 8, 8, 16, junta);
  }),

  metal: tela(31, (g, r) => {
    fundo(g, '#aeb6c2');
    salpica(g, r, 0.4, ['#9ba3ae', '#c2c9d4', '#8d95a0']);
    linhaH(g, 0, '#828a95'); linhaH(g, 15, '#828a95');
    // rebites nos cantos
    g.fillStyle = '#7b838e';
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) g.fillRect(x, y, 1, 1);
  }),

  cano: tela(32, (g, r) => {
    fundo(g, '#9aa6b4');
    salpica(g, r, 0.35, ['#8b97a5', '#adb8c5']);
    linhaH(g, 3, '#77828f'); linhaH(g, 4, '#c3ccd6');
    linhaH(g, 11, '#77828f'); linhaH(g, 12, '#c3ccd6');
  }),

  terra: tela(41, (g, r) => {
    fundo(g, '#96603a');
    salpica(g, r, 0.65, ['#84532f', '#a76e45', '#754826', '#b07a4e']);
  }),

  terraFertil: tela(42, (g, r) => {
    fundo(g, '#5b3f27');
    salpica(g, r, 0.65, ['#4c3420', '#6d4d31', '#3f2b1a', '#7a583a']);
  }),

  gramaTopo: tela(43, (g, r) => {
    fundo(g, '#79b23c');
    salpica(g, r, 0.7, ['#6aa233', '#8bc44a', '#5f9430', '#96cf55']);
  }),

  gramaLado: tela(44, (g, r) => {
    fundo(g, '#96603a');
    salpica(g, r, 0.6, ['#84532f', '#a76e45', '#754826']);
    // franja verde irregular na borda de cima
    for (let x = 0; x < N; x++) {
      const h = 3 + ((r() * 3) | 0);
      for (let y = 0; y < h; y++) {
        g.fillStyle = ['#6aa233', '#79b23c', '#8bc44a'][(r() * 3) | 0];
        g.fillRect(x, y, 1, 1);
      }
    }
  }),

  areia: tela(45, (g, r) => {
    fundo(g, '#e2d5a0');
    salpica(g, r, 0.55, ['#d3c692', '#eee2b0', '#c7ba86']);
  }),

  cascalho: tela(46, (g, r) => {
    fundo(g, '#9b948a');
    salpica(g, r, 0.7, ['#877f75', '#aca69c', '#79726a', '#b8b2a8']);
  }),

  madeira: tela(51, (g, r) => {
    fundo(g, '#b98b52');
    salpica(g, r, 0.45, ['#a97c47', '#c99a5f', '#9c703e']);
    for (const y of [0, 4, 8, 12]) linhaH(g, y, '#8a6337');
    // emenda de cada tábua em posição diferente, senão vira xadrez
    const emendas = [6, 11, 3, 9];
    emendas.forEach((x, i) => linhaV(g, x, i * 4 + 1, i * 4 + 4, '#8a6337'));
  }),

  troncoLado: tela(52, (g, r) => {
    fundo(g, '#6d5334');
    salpica(g, r, 0.5, ['#5d4629', '#7d613f', '#513c23']);
    for (const x of [3, 8, 13]) linhaV(g, x, 0, N, '#54401f');
  }),

  troncoTopo: tela(53, (g, r) => {
    fundo(g, '#ab8450');
    salpica(g, r, 0.35, ['#9a7645', '#bb945e']);
    g.strokeStyle = '#7d5f37';
    g.lineWidth = 1;
    for (const raio of [2.5, 5, 7]) {
      g.beginPath(); g.arc(8, 8, raio, 0, Math.PI * 2); g.stroke();
    }
  }),

  folhas: tela(54, (g, r) => {
    fundo(g, '#4f9c31');
    salpica(g, r, 0.75, ['#418127', '#5fb03c', '#377020', '#6cc248']);
    // furos: é o que separa copa de árvore de bloco verde
    for (let i = 0; i < 26; i++) g.clearRect((r() * N) | 0, (r() * N) | 0, 1, 1);
  }),

  vidro: tela(61, (g) => {
    g.clearRect(0, 0, N, N);
    g.fillStyle = 'rgba(214,240,255,0.16)';
    g.fillRect(0, 0, N, N);
    g.fillStyle = 'rgba(226,246,255,0.85)';
    g.fillRect(0, 0, N, 1); g.fillRect(0, 15, N, 1);
    g.fillRect(0, 0, 1, N); g.fillRect(15, 0, 1, N);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(3, 3, 1, 5); g.fillRect(4, 3, 1, 2);
  }),

  agua: tela(62, (g, r) => {
    fundo(g, '#3f76dc');
    salpica(g, r, 0.5, ['#3568cc', '#4d86ea', '#2f5ec0']);
    linhaH(g, 5, '#5b93f2'); linhaH(g, 12, '#5b93f2');
  }),

  lanterna: tela(63, (g, r) => {
    fundo(g, '#ffe08a');
    salpica(g, r, 0.4, ['#ffefb8', '#f7cd66']);
    g.fillStyle = '#c98f38';
    g.fillRect(0, 0, N, 2); g.fillRect(0, 14, N, 2);
    g.fillStyle = '#fff8d8';
    g.fillRect(5, 5, 6, 6);
  }),

  ventilador: tela(64, (g, r) => {
    fundo(g, '#5c646e');
    salpica(g, r, 0.3, ['#525a63', '#6b737d']);
    g.fillStyle = '#3a4048';
    g.beginPath(); g.arc(8, 8, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8d96a1';
    // quatro pás paradas
    g.fillRect(7, 2, 2, 5); g.fillRect(7, 9, 2, 5);
    g.fillRect(2, 7, 5, 2); g.fillRect(9, 7, 5, 2);
    g.fillStyle = '#c6ced8';
    g.fillRect(7, 7, 2, 2);
  }),
};

// ── recortes: planta e tapete ────────────────────────────

/**
 * Textura de fundo transparente, desenhada a partir de um mapa de
 * caracteres. O que não é folha precisa ser buraco, senão a cruz vira
 * duas placas opacas.
 */
export function texRecortada(linhas: string[], cores: Record<string, string>) {
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const ch = linhas[y]?.[x];
    const cor = ch && cores[ch];
    if (!cor) continue;
    g.fillStyle = cor;
    g.fillRect(x, y, 1, 1);
  }
  return pronta(c);
}

/** Sujeira solta no chão: manchinhas esparsas sobre nada. */
function texEsparsa(semente: number, dens: number, tons: string[]) {
  return tela(semente, (g, r) => {
    g.clearRect(0, 0, N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (r() > dens) continue;
      g.fillStyle = tons[(r() * tons.length) | 0];
      g.fillRect(x, y, 1, 1);
    }
  });
}

// . vazio · c caule · f folha · t espiga · y amarelo · p pétala · m miolo

export const TRIGO = texRecortada([
  '................',
  '.......t........',
  '......ttt.......',
  '.....ttttt......',
  '......ccc.......',
  '.....tcttt......',
  '....ttcttt......',
  '.....tcttt......',
  '......ccc.......',
  '.....tcttt......',
  '....ttcttt......',
  '.....tcttt......',
  '......ccc.......',
  '......ccc.......',
  '.....fcccf......',
  '................',
], { c: '#cbb44e', t: '#e6d268', f: '#87a03c' });

export const MUDA = texRecortada([
  '................',
  '................',
  '................',
  '................',
  '.......c........',
  '....fffcfff.....',
  '...ffffcffff....',
  '....fffcfff.....',
  '......fcf.......',
  '.......c........',
  '.....ffcff......',
  '......fcf.......',
  '.......c........',
  '.......c........',
  '......ccc.......',
  '................',
], { c: '#5e8a26', f: '#82cf46' });

/** Muda tombada: caule deitado. É o sintoma da bancada 1. */
export const MUDA_TOMBADA = texRecortada([
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.........fff....',
  '........fffff...',
  '.......ffcfff...',
  '......ffcff.....',
  '.....ffcf.......',
  '....ffcf........',
  '...ffcf.........',
  '..fccf..........',
  '..ccc...........',
  '................',
], { c: '#6b9a2e', f: '#8ed44f' });

/** Folha velha amarelando de baixo para cima. É o sintoma da bancada 2. */
export const FOLHA_AMARELA = texRecortada([
  '................',
  '.......c........',
  '.....fffff......',
  '....fffcfff.....',
  '.....fffff......',
  '.......c........',
  '....yyycyyy.....',
  '...yyyycyyyy....',
  '....yyycyyy.....',
  '.......c........',
  '...yyyycyyyy....',
  '..yyyyycyyyyy...',
  '...yyyycyyyy....',
  '.......c........',
  '......ccc.......',
  '................',
], { c: '#7d8a3a', f: '#79bf42', y: '#d9c24a' });

export const MATO = texRecortada([
  '................',
  '................',
  '................',
  '..f..........f..',
  '..f....f.....f..',
  '..ff...f....ff..',
  '...f..ff....f...',
  '...f..ff...ff...',
  '...ff.ff...f....',
  '....f.ff..ff....',
  '....ff.f..f.....',
  '.....f.ff.f.....',
  '.....ffffff.....',
  '......ffff......',
  '......ffff......',
  '................',
], { f: '#74a835' });

export const ARBUSTO = texRecortada([
  '................',
  '................',
  '.....ffff.......',
  '....ffffff......',
  '...ffffffff.....',
  '..ffffffffff....',
  '..ffffddffff....',
  '.fffddffddfff...',
  '.ffffffffffff...',
  '..ffffddffff....',
  '..ffffffffff....',
  '...ffffffff.....',
  '.....fccf.......',
  '......cc........',
  '......cc........',
  '................',
], { f: '#4d8f2c', d: '#3d7322', c: '#5f4327' });

export const SAMAMBAIA = texRecortada([
  '................',
  '................',
  '....f.....f.....',
  '...ff..c..ff....',
  '..ff..fcf..ff...',
  '..f..ffcff..f...',
  '.ff..fffff..ff..',
  '.f..fffcfff..f..',
  'ff..ffcccff..ff.',
  'f...fffcfff...f.',
  'ff...ffcff...ff.',
  '.ff...fcf...ff..',
  '..ff...c...ff...',
  '...fff.c.fff....',
  '......ccc.......',
  '................',
], { f: '#5aa130', c: '#47761f' });

const florCom = (petala: string, semente: string) => texRecortada([
  '................',
  '................',
  '.....p...p......',
  '....ppp.ppp.....',
  '....ppmmmpp.....',
  '.....pmmmp......',
  '....ppmmmpp.....',
  '....ppp.ppp.....',
  '.....p.c.p......',
  '.......c........',
  '.......c........',
  '......fcf.......',
  '.....ffcff......',
  '.......c........',
  '......ccc.......',
  '................',
], { p: petala, m: semente, c: '#5e8a26', f: '#82cf46' });

export const FLOR_VERMELHA = florCom('#e0483c', '#f7d94e');
export const FLOR_AZUL = florCom('#5f86d8', '#f7d94e');
export const FLOR_BRANCA = florCom('#f4f2e2', '#f2b23a');

export const PETALAS = texEsparsa(71, 0.16, ['#e0483c', '#f4f2e2', '#e88b83', '#5f86d8']);
export const FOLHAS_CAIDAS = texEsparsa(72, 0.2, ['#d9c24a', '#b9963a', '#8a6337', '#c9ae44']);
export const MUSGO = texEsparsa(73, 0.42, ['#4d7530', '#5d8a3c', '#6d9c46', '#3f6326']);

// ── geometrias ───────────────────────────────────────────

/**
 * Duas placas cruzadas em X, de pé sobre o bloco. Feita à mão porque o
 * Three não traz essa forma pronta e ela é o alicerce da vegetação.
 * A base fica em y=0, então basta posicionar no topo do bloco de baixo.
 */
export function geoCruz(altura = 1) {
  const h = altura, r = 0.5;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const placa = (x0: number, z0: number, x1: number, z1: number, base: number) => {
    pos.push(x0, 0, z0, x1, 0, z1, x1, h, z1, x0, h, z0);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  placa(-r, -r, r, r, 0);
  placa(-r, r, r, -r, 4);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Quadrado deitado, rente ao chão. */
export function geoTapete() {
  return new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
}

// ── materiais ────────────────────────────────────────────

/** Recorte por alphaTest, não por transparência: transparência de
 *  verdade exigiria ordenar por profundidade e as plantas piscariam. */
export function matPlanta(mapa: THREE.Texture) {
  return new THREE.MeshLambertMaterial({
    map: mapa, alphaTest: 0.5, side: THREE.DoubleSide,
  });
}

export function matCubo(mapa: THREE.Texture) {
  return new THREE.MeshLambertMaterial({ map: mapa });
}
