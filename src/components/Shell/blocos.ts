import * as THREE from 'three';

// ─────────────────────────────────────────────────────────
// As peças do mundo.
//
// Nem tudo é cubo inteiro, e é isso que tira a cara de caixote:
//
//   CUBO      parede, piso, terra, madeira
//   PLACA     vidro fino, tampo de bancada (cubo achatado num eixo)
//   CRUZ      planta — duas placas cruzadas em X com textura recortada,
//             que é como o jogo de referência desenha flor e mato
//   MIÚDO     cubo pequeno: torneira, válvula, vaso, sensor
//
// A cruz é o detalhe que mais muda a leitura: planta desenhada como cubo
// vira tijolo verde, e como cruz vira planta.
// ─────────────────────────────────────────────────────────

/** Textura 16x16 sólida, com ruído e borda — para cubo e placa. */
export function texSolida(base: string, ruido = 0.35, borda = true) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 256; i++) {
    if (Math.random() > ruido) continue;
    g.fillStyle = Math.random() < 0.5
      ? `rgba(0,0,0,${Math.random() * 0.26})`
      : `rgba(255,255,255,${Math.random() * 0.18})`;
    g.fillRect(i % 16, Math.floor(i / 16), 1, 1);
  }
  if (borda) {
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1);
    g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
  }
  return prontaParaBloco(c);
}

/**
 * Textura 16x16 com fundo transparente, desenhada pixel a pixel a partir
 * de um mapa de caracteres. É assim que se faz sprite de planta: o que
 * não é folha precisa ser buraco, senão a cruz vira duas placas opacas.
 */
export function texRecortada(linhas: string[], cores: Record<string, string>) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = linhas[y]?.[x];
      const cor = ch && cores[ch];
      if (!cor) continue;
      g.fillStyle = cor;
      g.fillRect(x, y, 1, 1);
    }
  }
  return prontaParaBloco(c);
}

function prontaParaBloco(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;      // pixel duro: a cara de bloco
  t.minFilter = THREE.NearestMipmapNearestFilter;
  t.generateMipmaps = true;
  return t;
}

/**
 * Duas placas cruzadas em X, de pé sobre o bloco. Construída à mão
 * porque o Three não traz essa forma pronta e ela é o alicerce de toda
 * vegetação em mundo de voxel.
 */
export function geoCruz(altura = 1) {
  const h = altura, r = 0.5;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const placa = (x0: number, z0: number, x1: number, z1: number, base: number) => {
    pos.push(x0, 0, z0,  x1, 0, z1,  x1, h, z1,  x0, h, z0);
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

/**
 * Material de planta: recorte por alphaTest em vez de transparência.
 * Transparência de verdade exigiria ordenar por profundidade e as
 * plantas piscariam uma por trás da outra.
 */
export function matPlanta(mapa: THREE.Texture) {
  return new THREE.MeshLambertMaterial({
    map: mapa, alphaTest: 0.5, side: THREE.DoubleSide,
  });
}

// ── desenhos das plantas, em mapa de caracteres ──────────
// . = vazio   c = caule   f = folha   t = topo   p = pétala   m = miolo

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
], { c: '#c8b45a', t: '#e0cf72', f: '#7a8f3a' });

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
], { c: '#5e7d2a', f: '#7ec44a' });

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
], { f: '#6f9c34' });

const florCom = (petala: string) => texRecortada([
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
], { p: petala, m: '#f2d24a', c: '#5e7d2a', f: '#7ec44a' });

export const FLOR_VERMELHA = florCom('#d4483f');
export const FLOR_AZUL = florCom('#5f86d8');
export const FLOR_BRANCA = florCom('#f0efe2');
