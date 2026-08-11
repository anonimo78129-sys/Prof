// ─────────────────────────────────────────────────────────
// Estudos de estilo de CINZAS.
//
// Desenha O MESMO cenário — a cidade em ruínas do Cap. 2, ao entardecer,
// com a protagonista para dar escala — em nove técnicas de ilustração
// diferentes, cada uma separada nas mesmas quatro camadas de parallax do
// jogo. Serve para escolher a direção de arte olhando as opções lado a
// lado e em movimento, não em descrição.
//
// A geometria (sol, colinas, prédios, janelas, chão, figura) é sorteada
// UMA vez em cenarioRef() e entregue pronta aos nove pintores. É isso que
// garante que os nove desenhos sejam o mesmo lugar: se cada estilo
// chamasse a função de gerar cidade, cada um sortearia uma cidade
// diferente e a comparação não valeria nada.
//
// Este script é autônomo de propósito. scripts/gen-art.mjs não exporta
// nada e apaga public/assets/cinzas/art assim que é importado, então o
// núcleo (paleta, ruído, tela) está duplicado aqui em vez de importado.
//
//   node scripts/gen-styles.mjs            gera os estudos
//   node scripts/gen-styles.mjs --sheet    gera também um contato 3x3
// ─────────────────────────────────────────────────────────
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'public/assets/cinzas/estudos';
const W = 540, H = 300;
const GY = 252;              // linha do chão, a mesma dos cenários do jogo

// Velocidades das camadas, iguais às da tela inicial do jogo: o período em
// segundos de uma volta completa. Manter idêntico é o que faz o estudo ser
// julgado no mesmo movimento que a arte de verdade.
const VEL = { sky: 0, far: 340, mid: 170, near: 85 };

// ═════════════════════════════════════════════════════════
// PALETA (a mesma de gen-art.mjs, usada pelo estilo pixel)
// ═════════════════════════════════════════════════════════
const PAL = {
  ink0: '#0b0913', ink1: '#16121f', ink2: '#241d33', ink3: '#362b4a',
  rox0: '#4a3a6b', rox1: '#664f94', rox2: '#8a68c0', rox3: '#b394e0',
  azu0: '#17244d', azu1: '#24417e', azu2: '#3568bd', azu3: '#5b9ae0', azu4: '#9ccdf2',
  cia0: '#0f5f6b', cia1: '#178f96', cia2: '#26c4bd', cia3: '#6ee9dd', cia4: '#bdfaf2',
  ver0: '#123c1e', ver1: '#1d662e', ver2: '#35983c', ver3: '#5ec74a', ver4: '#a2ee68',
  mus0: '#2a3a10', mus1: '#4d6a16', mus2: '#82a621', mus3: '#bfda3a', mus4: '#e9ff78',
  our0: '#6a3e12', our1: '#a5681a', our2: '#dd9e28', our3: '#f5ca46', our4: '#ffefa0',
  lar0: '#7a2410', lar1: '#b8461a', lar2: '#e6702a', lar3: '#ff9f4a', lar4: '#ffc98a',
  rub0: '#5c1424', rub1: '#97243c', rub2: '#d33f56', rub3: '#f4707f',
  ros0: '#7a2f4a', ros1: '#b8496a', ros2: '#e87a92', ros3: '#ffb0bc',
  mad0: '#2c1b13', mad1: '#4d321e', mad2: '#78512f', mad3: '#a67646', mad4: '#d2a36a',
  ped0: '#282a3a', ped1: '#41465e', ped2: '#626987', ped3: '#8c94b2', ped4: '#c0c7db',
  cre0: '#b5a582', cre1: '#d6c69e', cre2: '#efe2be', cre3: '#fff7df',
  bra: '#ffffff',
};

const hex = (h) => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const shade = (c, t) => (t < 0 ? mix(c, [0, 0, 0], -t) : mix(c, [255, 255, 255], t));

const RGB = {};
for (const k in PAL) RGB[k] = hex(PAL[k]);
/** Aceita nome da paleta ("ver3"), hex solto ou já um [r,g,b]. */
const P = (n) => (Array.isArray(n) ? n : RGB[n] || hex(n));
const PAL_RGB = Object.values(PAL).map(hex);

// ── ruído determinístico ─────────────────────────────────
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];

// dithering ordenado 4x4
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dither = (t, x, y) => t > (BAYER[y & 3][x & 3] + 0.5) / 16;

// ── quantização (só o estilo pixel usa) ──────────────────
const _cacheQ = new Map();
function maisProxima(r, g, b) {
  const chave = (r << 16) | (g << 8) | b;
  const memo = _cacheQ.get(chave);
  if (memo !== undefined) return memo;
  let melhor = 0, dist = Infinity;
  for (let i = 0; i < PAL_RGB.length; i++) {
    const c = PAL_RGB[i];
    const dr = r - c[0], dg = g - c[1], db = b - c[2];
    const d = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
    if (d < dist) { dist = d; melhor = i; }
  }
  _cacheQ.set(chave, PAL_RGB[melhor]);
  return PAL_RGB[melhor];
}
const ALFAS = [0, 51, 102, 153, 204, 255];
const alfaProximo = (a) => ALFAS.reduce((m, v) => (Math.abs(v - a) < Math.abs(m - a) ? v : m), 0);

// ═════════════════════════════════════════════════════════
// TELA
//
// Como gen-art.mjs, mas em ponto flutuante e com supersampling: os
// estilos de tom contínuo (aquarela, cel, riso, low poly) desenham em 3x
// e reduzem no fim, então diagonal e curva saem lisas. O estilo pixel
// desenha em 1x e reduz com "nearest", preservando o pixel duro.
//
// O wrap acontece na largura já supersamplada e o fator de redução é
// inteiro, então a emenda do cilindro sobrevive à redução.
// ═════════════════════════════════════════════════════════
class Tela {
  constructor(w, h, { wrap = false, S = 1 } = {}) {
    this.S = S;
    this.w = w * S; this.h = h * S;
    this.wrap = wrap;
    this.rgb = new Float32Array(this.w * this.h * 3);
    this.al = new Float32Array(this.w * this.h);
  }
  /** converte coordenada de projeto (540x300) para a tela supersamplada */
  s(v) { return Math.round(v * this.S); }

  px(x, y, c, a = 1) {
    x |= 0; y |= 0;
    if (this.wrap) x = ((x % this.w) + this.w) % this.w;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = y * this.w + x, j = i * 3;
    const dA = this.al[i], oA = a + dA * (1 - a);
    for (let k = 0; k < 3; k++) this.rgb[j + k] = (c[k] * a + this.rgb[j + k] * dA * (1 - a)) / oA;
    this.al[i] = oA;
  }
  a(x, y) {
    if (this.wrap) x = ((x % this.w) + this.w) % this.w;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.al[y * this.w + x];
  }
  get(x, y) {
    if (this.wrap) x = ((x % this.w) + this.w) % this.w;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return [0, 0, 0];
    const j = (y * this.w + x) * 3;
    return [this.rgb[j], this.rgb[j + 1], this.rgb[j + 2]];
  }
  rect(x, y, w, h, c, a = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, a);
  }
  hline(x, y, w, c, a = 1) { this.rect(x, y, w, 1, c, a); }
  vline(x, y, h, c, a = 1) { this.rect(x, y, 1, h, c, a); }
  ellipse(cx, cy, rx, ry, c, a = 1) {
    if (rx < 1 || ry < 1) { this.px(cx, cy, c, a); return; }
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) this.px(cx + x, cy + y, c, a);
  }
  /** preenche do topo até a base da tela, para os perfis de terreno */
  coluna(x, y, c, a = 1) { for (let yy = y; yy < this.h; yy++) this.px(x, yy, c, a); }

  /** Bresenham com espessura, o que o Canvas do jogo não tem. */
  linha(x0, y0, x1, y1, c, esp = 1, a = 1) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const r = Math.max(0, Math.floor((esp - 1) / 2));
    for (;;) {
      if (esp <= 1) this.px(x0, y0, c, a);
      else this.ellipse(x0, y0, r, r, c, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  /** Preenchimento por scanline de um polígono [[x,y],…]. */
  poligono(pts, c, a = 1) {
    if (pts.length < 3) return;
    let yMin = Infinity, yMax = -Infinity;
    for (const [, y] of pts) { if (y < yMin) yMin = y; if (y > yMax) yMax = y; }
    yMin = Math.max(0, Math.floor(yMin)); yMax = Math.min(this.h - 1, Math.ceil(yMax));
    for (let y = yMin; y <= yMax; y++) {
      const cortes = [];
      for (let i = 0, n = pts.length; i < n; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n];
        if ((ay <= y && by > y) || (by <= y && ay > y))
          cortes.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
      cortes.sort((p, q) => p - q);
      for (let i = 0; i + 1 < cortes.length; i += 2) {
        const x0 = Math.round(cortes[i]), x1 = Math.round(cortes[i + 1]);
        for (let x = x0; x <= x1; x++) this.px(x, y, c, a);
      }
    }
  }

  /**
   * quantiza: prende cada pixel às 61 cores da paleta e trava o alfa em 6
   * níveis. Só o estilo pixel quer isso; nos demais destruiria a técnica.
   */
  async save(file, { quantiza = false } = {}) {
    const out = Buffer.alloc(this.w * this.h * 4);
    for (let i = 0; i < this.w * this.h; i++) {
      const j = i * 3, k = i * 4;
      let al = Math.round(Math.max(0, Math.min(1, this.al[i])) * 255);
      if (al === 0) { out[k] = out[k + 1] = out[k + 2] = out[k + 3] = 0; continue; }
      let r = Math.max(0, Math.min(255, Math.round(this.rgb[j])));
      let g = Math.max(0, Math.min(255, Math.round(this.rgb[j + 1])));
      let b = Math.max(0, Math.min(255, Math.round(this.rgb[j + 2])));
      if (quantiza) { [r, g, b] = maisProxima(r, g, b); al = alfaProximo(al); }
      out[k] = r; out[k + 1] = g; out[k + 2] = b; out[k + 3] = al;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let img = sharp(out, { raw: { width: this.w, height: this.h, channels: 4 } });
    if (this.S > 1) img = img.resize(this.w / this.S, this.h / this.S, { kernel: 'lanczos3' });
    // palette:true roda uma segunda quantização por cima; nos estilos de
    // tom contínuo isso reticula a imagem sozinho, então fica só no pixel
    await img.png({ compressionLevel: 9, palette: quantiza }).toFile(file);
  }
}

// ═════════════════════════════════════════════════════════
// GEOMETRIA COMPARTILHADA
//
// Sorteada uma única vez. Nenhum pintor chama rng(): se chamasse, os
// streams divergiriam entre estilos e cada um mostraria outra cidade.
// Todas as coordenadas estão no espaço de projeto (540x300); cada tela
// multiplica pelo próprio supersampling com tela.s().
// ═════════════════════════════════════════════════════════

/** Perfil de colina: uma altura por coluna, interpolada entre picos. */
function perfilColina(r, baseY, amp, passo) {
  const alt = new Array(W);
  let prev = baseY - ri(r, 0, amp);
  for (let x = 0; x <= W; x += passo) {
    const next = baseY - ri(r, 0, amp);
    for (let i = 0; i < passo && x + i < W; i++)
      alt[x + i] = Math.round(prev + (next - prev) * (i / passo));
    prev = next;
  }
  // fecha o cilindro: as últimas colunas voltam para a altura da coluna 0
  const costura = 30;
  for (let i = 0; i < costura; i++) {
    const t = i / costura, x = W - costura + i;
    alt[x] = Math.round(alt[x] * (1 - t) + alt[0] * t);
  }
  return alt;
}

/**
 * Fila de prédios. Cada um leva o próprio perfil de topo já com o dano
 * recortado, e a grade de janelas já sorteada — o pintor só lê.
 */
function filaPredios(r, { baseY, minH, maxH, minW, maxW, gap, dano, janelas }) {
  const lista = [];
  let x = -ri(r, 0, 40);
  while (x < W) {
    const w = ri(r, minW, maxW), h = ri(r, minH, maxH);
    const topo = baseY - h;
    const perfilTopo = new Array(w).fill(topo);
    // dano: 1 a 3 mordidas no topo, cada uma com fundo próprio
    const n = ri(r, 1, 3);
    for (let k = 0; k < n; k++) {
      if (r() > dano) continue;
      const larg = ri(r, Math.round(w * 0.18), Math.round(w * 0.55));
      const ini = ri(r, 0, Math.max(0, w - larg));
      const fundo = ri(r, 4, Math.round(h * 0.30));
      for (let i = ini; i < ini + larg && i < w; i++) perfilTopo[i] = topo + fundo;
    }
    // degrau irregular, para a borda não sair reta demais
    for (let i = 1; i < w; i++) if (r() < 0.14) perfilTopo[i] = perfilTopo[i - 1] + ri(r, -2, 2);

    const grade = [];
    if (janelas) {
      for (let wy = topo + 10; wy < baseY - 8; wy += 13) {
        for (let wx = x + 5; wx < x + w - 7; wx += 11) {
          const col = wx - x;
          if (col < 0 || col >= w) continue;
          if (wy < perfilTopo[col] + 5) continue;      // não flutua acima do dano
          grade.push({ x: wx, y: wy, w: 4, h: 6, aceso: r() < 0.20 });
        }
      }
    }
    lista.push({ x, w, h, topo, baseY, perfilTopo, janelas: grade, cobertura: pick(r, ['caixa', 'antena', null]) });
    x += w + ri(r, 0, gap);
  }
  return lista;
}

/** A cena de referência inteira, sorteada uma vez. */
function cenarioRef(seed) {
  const r = rng(seed);
  const sol = { x: 336, y: 150, r: 34 };
  const colinas = perfilColina(r, GY - 62, 40, 44);
  const longe = filaPredios(r, { baseY: GY - 16, minH: 78, maxH: 150, minW: 38, maxW: 78, gap: 14, dano: 0.7, janelas: false });
  const meio  = filaPredios(r, { baseY: GY + 2,  minH: 48, maxH: 112, minW: 30, maxW: 66, gap: 10, dano: 0.85, janelas: true });

  const pedras = [];
  for (let i = 0; i < 26; i++)
    pedras.push({ x: ri(r, 0, W - 1), y: ri(r, GY + 6, H - 4), rx: ri(r, 2, 7), ry: ri(r, 1, 4) });
  const rachaduras = [];
  for (let i = 0; i < 14; i++) {
    const passos = ri(r, 10, 30), traco = [];
    let cx = ri(r, 0, W - 1), cy = ri(r, GY + 4, H - 6);
    for (let k = 0; k < passos; k++) { traco.push([cx, cy]); cx += ri(r, -1, 1); cy += r() < 0.3 ? 1 : 0; }
    rachaduras.push(traco);
  }
  // detritos no plano de trás, para a colina não ficar pelada
  const postes = [];
  for (let i = 0; i < 5; i++) postes.push({ x: ri(r, 20, W - 20), alt: ri(r, 22, 40) });

  return {
    sol, colinas,
    predios: { longe, meio },
    chao: { y: GY, pedras, rachaduras },
    postes,
    // a protagonista fica fora das camadas que rolam; o pintor da camada
    // "near" desenha ela parada, como referência de escala
    figura: { x: 150, baseY: GY + 16, alt: 56 },
  };
}

// ═════════════════════════════════════════════════════════
// AUXILIARES DE PINTURA
// ═════════════════════════════════════════════════════════

/** Silhueta da protagonista em cor chapada — a mesma forma em todo estilo. */
function figura(t, { x, baseY, alt }, cor, a = 1) {
  const X = t.s(x), Y = t.s(baseY), A = t.s(alt), l = Math.round(A * 0.34);
  t.rect(X - Math.round(l * 0.5), Y - A, l, Math.round(A * 0.62), cor, a);                       // casaco
  t.ellipse(X, Y - A + Math.round(l * 0.12), Math.round(l * 0.44), Math.round(l * 0.44), cor, a); // capuz
  t.rect(X - Math.round(l * 0.34), Y - Math.round(A * 0.38), Math.round(l * 0.26), Math.round(A * 0.38), cor, a);
  t.rect(X + Math.round(l * 0.10), Y - Math.round(A * 0.38), Math.round(l * 0.26), Math.round(A * 0.38), cor, a);
  t.rect(X + Math.round(l * 0.42), Y - Math.round(A * 0.84), Math.round(l * 0.32), Math.round(A * 0.34), cor, a); // mochila
}

/** Pinta um perfil de alturas (uma por coluna de projeto) até a base. */
function pintaPerfil(t, alt, cor, a = 1) {
  for (let x = 0; x < t.w; x++) {
    const y = t.s(alt[Math.floor(x / t.S) % W]);
    for (let yy = y; yy < t.h; yy++) t.px(x, yy, cor, a);
  }
}

/** Silhueta de uma fila de prédios, sem detalhe: só o recorte. */
function pintaVulto(t, predios, cor, a = 1) {
  for (const p of predios) {
    for (let i = 0; i < p.w; i++) {
      const x = t.s(p.x + i), y = t.s(p.perfilTopo[i]);
      for (let k = 0; k < t.S; k++) for (let yy = y; yy < t.h; yy++) t.px(x + k, yy, cor, a);
    }
  }
}

/** Degradê vertical contínuo entre paradas de cor. */
function ceuLiso(t, stops, y0 = 0, y1 = t.h) {
  const cols = stops.map(P);
  for (let y = y0; y < y1; y++) {
    const f = ((y - y0) / Math.max(1, y1 - y0 - 1)) * (cols.length - 1);
    const i = Math.min(cols.length - 2, Math.floor(f));
    const col = mix(cols[i], cols[i + 1], f - i);
    for (let x = 0; x < t.w; x++) t.px(x, y, col);
  }
}

/** Degradê por dithering ordenado, do jeito do jogo. */
function ceuDither(t, stops, y0 = 0, y1 = t.h) {
  const cols = stops.map(P);
  for (let y = y0; y < y1; y++) {
    const f = ((y - y0) / Math.max(1, y1 - y0 - 1)) * (cols.length - 1);
    const i = Math.min(cols.length - 2, Math.floor(f));
    const local = f - i;
    for (let x = 0; x < t.w; x++) t.px(x, y, dither(local, x, y) ? cols[i + 1] : cols[i]);
  }
}

/** Céu em faixas horizontais chapadas, sem transição. */
function ceuFaixas(t, stops, y0, y1) {
  const n = stops.length, h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) t.rect(0, Math.round(y0 + h * i), t.w, Math.ceil(h) + 1, P(stops[i]));
}

/** Halo em anéis discretos, com fronteira pontilhada. */
function halo(t, cx, cy, rx, ry, cor, niveis = [0.30, 0.18, 0.10, 0.05]) {
  const K = P(cor), n = niveis.length;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry));
    if (d > 1) continue;
    const f = d * n, i = Math.floor(f);
    if (i >= n) continue;
    const k = (dither(f - i, cx + x, cy + y) && i + 1 < n) ? i + 1 : i;
    t.px(cx + x, cy + y, K, niveis[k]);
  }
}

/** Halo contínuo, para os estilos que não são de paleta fechada. */
function haloLiso(t, cx, cy, rad, cor, forca = 0.45) {
  const K = P(cor);
  for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
    const d = Math.sqrt(x * x + y * y) / rad;
    if (d > 1) continue;
    t.px(cx + x, cy + y, K, forca * Math.pow(1 - d, 2.2));
  }
}

/** Contorna a silhueta de uma camada inteira já desenhada. */
function contorna(t, cor, esp = 1) {
  const O = P(cor), marca = [];
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    if (t.a(x, y) !== 0) continue;
    if (t.a(x - 1, y) > 0 || t.a(x + 1, y) > 0 || t.a(x, y - 1) > 0 || t.a(x, y + 1) > 0) marca.push([x, y]);
  }
  for (const [x, y] of marca) for (let k = 0; k < esp; k++) t.px(x, y - k, O);
}

/** Névoa em faixas, mais densa no meio da altura. */
function nevoa(t, { y0, y1, cor, a = 0.2, n = 6 }) {
  const K = P(cor);
  for (let i = 0; i < n; i++) {
    const y = Math.round(y0 + ((y1 - y0) / n) * i);
    const dens = Math.sin(((i + 0.5) / n) * Math.PI);
    const alt = Math.max(1, Math.round((y1 - y0) / n * 0.7));
    for (let j = 0; j < alt; j++)
      for (let x = 0; x < t.w; x++)
        if (dither(dens * 0.85, x, y + j)) t.px(x, y + j, K, a);
  }
}

// ── ruído puro por coordenada ────────────────────────────
// Os pintores não podem chamar rng(): consumir o stream faria os estilos
// divergirem entre si. Este ruído é função pura da posição, então é
// determinístico e não tem estado.
const h1 = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const h2 = (x, y) => h1(x * 1.7 + y * 91.37);
/** ruído suave 1D, interpolado entre inteiros */
function ruido1(x, esc = 1) {
  const p = x / esc, i = Math.floor(p), f = p - i;
  const s = f * f * (3 - 2 * f);
  return h1(i) * (1 - s) + h1(i + 1) * s;
}

// ═════════════════════════════════════════════════════════
// OS NOVE ESTILOS
//
// Cada estilo declara supersampling, se quantiza na paleta, e um pintor
// por camada. Todos leem a MESMA geo — o que muda é só a técnica.
// ═════════════════════════════════════════════════════════

const ESTILOS = {};

// ── 1. PIXEL ART 16-BIT (o estilo atual, linha de base) ──
ESTILOS.pixel = {
  nome: 'Pixel art 16-bit',
  ref: 'Chrono Trigger, Secret of Mana',
  desc: 'O estilo atual do jogo. Paleta fechada de 61 cores em rampas curtas, contorno escuro em todo objeto, luz sempre de cima e da esquerda, e o único degradê permitido é o dithering ordenado 4x4. Densidade alta de detalhe por área.',
  S: 1, quantiza: true,
  sky(t, g) {
    ceuDither(t, ['ink0', 'ink2', 'rox0', 'ros0', 'lar1', 'our2'], 0, t.h);
    for (let i = 0; i < 150; i++) {
      const x = Math.floor(h1(i * 3.1) * t.w), y = Math.floor(h1(i * 7.7) * 120);
      t.px(x, y, P('bra'), h1(i * 2.3) < 0.5 ? 0.4 : 0.85);
    }
    halo(t, g.sol.x, g.sol.y, g.sol.r * 4, g.sol.r * 4, 'lar3', [0.26, 0.16, 0.09, 0.04]);
    t.ellipse(g.sol.x, g.sol.y, g.sol.r, g.sol.r, P('our4'));
    for (let x = -g.sol.r; x <= g.sol.r; x++) {
      const dy = Math.round(Math.sqrt(Math.max(0, g.sol.r * g.sol.r - x * x)));
      t.px(g.sol.x + x, g.sol.y - dy + 1, P('cre3'));
    }
  },
  far(t, g) {
    pintaPerfil(t, g.colinas, P('rox0'));
    for (let x = 0; x < t.w; x++) { const y = g.colinas[x % W]; t.px(x, y, P('rox1')); t.px(x, y + 1, P('rox1'), 0.7); }
    pintaVulto(t, g.predios.longe, P('ink3'));
    contorna(t, 'ink1');
  },
  mid(t, g) {
    for (const p of g.predios.meio) {
      for (let i = 0; i < p.w; i++) for (let yy = p.perfilTopo[i]; yy < t.h; yy++) {
        // textura de bloco de concreto: duas colunas mais escuras a cada 7
        const bloco = ((i % 7) < 2 || (yy % 9) === 0) ? 'ink1' : 'ink2';
        t.px(p.x + i, yy, P(bloco));
      }
      // aresta iluminada na face esquerda
      for (let yy = p.perfilTopo[0]; yy < t.h; yy++) t.px(p.x, yy, P('ink3'));
      for (const j of p.janelas) t.rect(j.x, j.y, j.w, j.h, P(j.aceso ? 'our3' : 'ink0'));
    }
    contorna(t, 'ink0');
    nevoa(t, { y0: 226, y1: 252, cor: 'lar3', a: 0.1, n: 4 });
  },
  near(t, g) {
    t.rect(0, g.chao.y, t.w, 3, P('rox0'));
    for (let y = g.chao.y + 3; y < t.h; y++) {
      const k = (y - g.chao.y) / (t.h - g.chao.y);
      for (let x = 0; x < t.w; x++) t.px(x, y, dither(k, x, y) ? P('ink0') : P('ink2'));
    }
    for (const tr of g.chao.rachaduras) for (const [x, y] of tr) t.px(x, y, P('ink0'));
    for (const s of g.chao.pedras) {
      t.ellipse(s.x, s.y + 1, s.rx + 1, s.ry, P('ink0'), 0.5);
      t.ellipse(s.x, s.y, s.rx, s.ry, P('ink1'));
      t.ellipse(s.x - 1, s.y - 1, Math.max(1, s.rx - 2), Math.max(1, s.ry - 1), P('ink3'));
    }
  },
  frente(t, g) { figura(t, g.figura, P('ink0')); },
};

// ── 2. SILHUETA E LUZ ────────────────────────────────────
ESTILOS.silhueta = {
  nome: 'Silhueta e luz',
  ref: 'Limbo, Inside, Badland',
  desc: 'Tudo vira recorte quase preto contra um céu forte. Não existe detalhe dentro das formas: a profundidade vem só da névoa que se acumula na base de cada plano e do quanto cada silhueta puxa para a cor do céu. Dramático e barato de produzir, mas o cenário não consegue contar detalhe nenhum.',
  S: 3, quantiza: false,
  sky(t, g) {
    ceuLiso(t, ['#12112b', '#2b1f4d', '#7b3560', '#d2603f', '#f0aa53', '#ffd98a'], 0, t.h);
    haloLiso(t, t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r * 5), '#ffb066', 0.55);
    t.ellipse(t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r), t.s(g.sol.r), hex('#fff0c0'));
  },
  far(t, g) {
    const CEU = hex('#d2603f');
    pintaPerfil(t, g.colinas, mix(hex('#0a0812'), CEU, 0.58));
    pintaVulto(t, g.predios.longe, mix(hex('#0a0812'), CEU, 0.40));
    // névoa acumulando na base do plano: é o único marcador de distância
    for (let x = 0; x < t.w; x++) for (let k = 0; k < t.s(26); k++) {
      const y = t.s(g.colinas[Math.floor(x / t.S) % W]) + k;
      t.px(x, y, CEU, 0.34 * (1 - k / t.s(26)));
    }
  },
  mid(t, g) {
    const CEU = hex('#d2603f');
    pintaVulto(t, g.predios.meio, mix(hex('#0a0812'), CEU, 0.15));
    for (let x = 0; x < t.w; x++) for (let k = 0; k < t.s(20); k++)
      t.px(x, t.s(GY) - t.s(20) + k, CEU, 0.16 * (1 - k / t.s(20)));
  },
  near(t, g) {
    t.rect(0, t.s(g.chao.y), t.w, t.h, hex('#080610'));
    for (const p of g.postes) {
      t.rect(t.s(p.x), t.s(GY) - t.s(p.alt), t.s(2), t.s(p.alt), hex('#050408'));
      t.rect(t.s(p.x) - t.s(5), t.s(GY) - t.s(p.alt), t.s(12), t.s(2), hex('#050408'));
    }
    for (const s of g.chao.pedras) t.ellipse(t.s(s.x), t.s(s.y), t.s(s.rx), t.s(s.ry), hex('#050408'));
  },
  frente(t, g) { figura(t, g.figura, hex('#050408')); },
};

// ── 3. CAMPOS DE COR CHAPADA ─────────────────────────────
ESTILOS.cartaz = {
  nome: 'Campos de cor chapada',
  ref: 'Firewatch, cartazes do WPA',
  desc: 'Formas grandes em cor lisa, sem contorno e sem textura nenhuma. A profundidade é só perspectiva atmosférica: cada plano mais claro e mais quente que o de trás. Lê perfeito em tela pequena e envelhece bem, mas exige decisão de composição, porque não há detalhe para esconder forma fraca.',
  S: 3, quantiza: false,
  sky(t, g) {
    ceuFaixas(t, ['#f7d08a', '#f2b66d', '#e89355', '#d97246', '#c15440'], 0, t.s(GY));
    t.rect(0, t.s(GY), t.w, t.h, hex('#c15440'));
    t.ellipse(t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r * 1.15), t.s(g.sol.r * 1.15), hex('#fce9b0'));
  },
  far(t, g) {
    pintaPerfil(t, g.colinas, hex('#a8484a'));
    pintaVulto(t, g.predios.longe, hex('#8d3f4b'));
  },
  mid(t, g) {
    pintaVulto(t, g.predios.meio, hex('#6b3348'));
    // janelas como recortes chapados num tom da mesma família, sem brilho
    for (const p of g.predios.meio) for (const j of p.janelas)
      t.rect(t.s(j.x), t.s(j.y), t.s(j.w), t.s(j.h), hex(j.aceso ? '#c98a5e' : '#54294a'));
  },
  near(t, g) {
    t.rect(0, t.s(g.chao.y), t.w, t.h, hex('#4e2846'));
    t.rect(0, t.s(g.chao.y + 22), t.w, t.h, hex('#3a1d3a'));
    for (const s of g.chao.pedras)
      t.ellipse(t.s(s.x), t.s(s.y), t.s(s.rx + 1), t.s(s.ry), hex('#2b1830'));
  },
  frente(t, g) { figura(t, g.figura, hex('#241228')); },
};

// ── 4. VETOR GEOMÉTRICO ──────────────────────────────────
ESTILOS.vetor = {
  nome: 'Vetor geométrico',
  ref: 'Monument Valley, ilustração editorial',
  desc: 'Formas limpas, cor saturada, duas faces por volume (uma iluminada e uma na sombra) e sombra longa projetada sempre na mesma direção. Sem textura e sem ruído. O plano do chão sobe para a camada média para as sombras andarem junto com os prédios que as projetam.',
  S: 3, quantiza: false,
  sky(t, g) {
    ceuLiso(t, ['#2e2b6b', '#5b4a9e', '#a0619e', '#e08a7a', '#f7c58a'], 0, t.h);
    t.ellipse(t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r * 1.2), t.s(g.sol.r * 1.2), hex('#ffe9b8'));
  },
  far(t, g) {
    pintaPerfil(t, g.colinas, hex('#6f5aa8'));
    for (let x = 0; x < t.w; x++) {
      const y = t.s(g.colinas[Math.floor(x / t.S) % W]);
      for (let k = 0; k < t.s(9); k++) t.px(x, y + k, hex('#8d76c4'));
    }
    pintaVulto(t, g.predios.longe, hex('#574590'));
  },
  mid(t, g) {
    // plano do chão dentro desta camada, senão a sombra projetada rolaria
    // numa velocidade e o prédio que a lança em outra
    t.rect(0, t.s(GY), t.w, t.h, hex('#3d2a52'));
    t.rect(0, t.s(GY), t.w, t.s(4), hex('#5b3f70'));
    for (const p of g.predios.meio) {
      const len = Math.round(p.h * 0.45);
      for (let i = 0; i < len; i++) {
        const yy = t.s(GY) + t.s(i * 0.34);
        if (yy >= t.h) break;
        for (let k = 0; k < t.s(p.w); k++) t.px(t.s(p.x - i) + k, yy, hex('#2a1c40'), 0.55);
      }
    }
    for (const p of g.predios.meio) {
      const faixa = Math.round(p.w * 0.3);
      for (let i = 0; i < p.w; i++) {
        const cor = i >= p.w - faixa ? hex('#c9683f') : hex('#f0a55e');
        for (let k = 0; k < t.S; k++)
          for (let yy = t.s(p.perfilTopo[i]); yy < t.h; yy++) t.px(t.s(p.x + i) + k, yy, cor);
      }
      // laje clara acompanhando o recorte do dano
      for (let i = 0; i < p.w; i++) for (let k = 0; k < t.S; k++)
        for (let d = 0; d < t.s(5); d++) t.px(t.s(p.x + i) + k, t.s(p.perfilTopo[i]) + d, hex('#ffd28a'));
      for (const j of p.janelas)
        t.rect(t.s(j.x), t.s(j.y), t.s(j.w + 2), t.s(j.h), hex(j.aceso ? '#fff3c4' : '#8a4a3e'));
    }
  },
  near(t, g) {
    // só a faixa de chão mais próxima, que é o que justifica rolar rápido
    t.rect(0, t.s(276), t.w, t.h, hex('#2a1c3c'));
    t.rect(0, t.s(276), t.w, t.s(3), hex('#452f5e'));
    for (const s of g.chao.pedras) {
      if (s.y < 272) continue;
      t.ellipse(t.s(s.x), t.s(s.y), t.s(s.rx + 1), t.s(s.ry), hex('#1d1329'));
    }
  },
  frente(t, g) { figura(t, g.figura, hex('#241634')); },
};

// ── 5. AQUARELA ──────────────────────────────────────────
ESTILOS.aquarela = {
  nome: 'Aquarela',
  ref: 'Gris, Child of Light',
  desc: 'Manchas de tinta com a borda irregular e o pigmento acumulando na beirada, granulação do papel por baixo de tudo e cor sangrando de um plano para o outro. É o estilo mais orgânico e o mais caro de manter consistente: cada cena precisa da mesma mão.',
  S: 3, quantiza: false,
  sky(t, g) {
    ceuLiso(t, ['#e8dcc6', '#f0cfae', '#e8ab96', '#cf8a90', '#9d7b9c'], 0, t.h);
    haloLiso(t, t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r * 4), '#fff2d0', 0.5);
    t.ellipse(t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r * 0.9), t.s(g.sol.r * 0.9), hex('#fffaf0'), 0.85);
    grao(t, 0.05);
  },
  far(t, g) {
    lavagem(t, (x) => g.colinas[x % W], hex('#9a8fb5'), 0.62, 9);
    lavagemVulto(t, g.predios.longe, hex('#7d7399'), 0.6);
    grao(t, 0.05);
  },
  mid(t, g) {
    lavagemVulto(t, g.predios.meio, hex('#5c5478'), 0.72);
    for (const p of g.predios.meio) for (const j of p.janelas)
      t.ellipse(t.s(j.x + 2), t.s(j.y + 3), t.s(3), t.s(4), hex(j.aceso ? '#f0c27a' : '#3f3a57'), 0.55);
    grao(t, 0.05);
  },
  near(t, g) {
    lavagem(t, () => GY + Math.round(ruido1(0, 1) * 2), hex('#4a4160'), 0.9, 7);
    for (const s of g.chao.pedras)
      t.ellipse(t.s(s.x), t.s(s.y), t.s(s.rx + 1), t.s(s.ry), hex('#332c47'), 0.55);
    grao(t, 0.07);
  },
  frente(t, g) { figura(t, g.figura, hex('#2b2440'), 0.92); },
};

/** Mancha de aquarela sobre um perfil: borda trêmula e pigmento na beira. */
function lavagem(t, perfil, cor, alfa, tremor) {
  const escuro = mix(cor, [0, 0, 0], 0.30);
  for (let x = 0; x < t.w; x++) {
    const base = t.s(perfil(Math.floor(x / t.S)));
    const y = base + Math.round((ruido1(x, t.s(14)) - 0.5) * t.s(tremor));
    for (let yy = y; yy < t.h; yy++) t.px(x, yy, cor, alfa);
    // pigmento acumulando na borda, a assinatura da técnica
    for (let k = 0; k < t.s(3); k++) t.px(x, y + k, escuro, alfa * 0.5 * (1 - k / t.s(3)));
  }
}

function lavagemVulto(t, predios, cor, alfa) {
  const escuro = mix(cor, [0, 0, 0], 0.30);
  for (const p of predios) for (let i = 0; i < p.w; i++) {
    const bx = t.s(p.x + i);
    const y = t.s(p.perfilTopo[i]) + Math.round((ruido1(bx, t.s(10)) - 0.5) * t.s(5));
    for (let k = 0; k < t.S; k++) {
      for (let yy = y; yy < t.h; yy++) t.px(bx + k, yy, cor, alfa);
      for (let d = 0; d < t.s(2); d++) t.px(bx + k, y + d, escuro, alfa * 0.45);
    }
  }
}

/** Granulação do papel por cima da camada inteira. */
function grao(t, forca) {
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    if (t.a(x, y) <= 0) continue;
    const n = h2(x, y);
    t.px(x, y, n < 0.5 ? [0, 0, 0] : [255, 255, 255], forca * Math.abs(n - 0.5) * 2);
  }
}

// ── 6. XILOGRAVURA ───────────────────────────────────────
const TINTA = hex('#141018'), PAPEL = hex('#efe2be');
ESTILOS.xilogravura = {
  nome: 'Xilogravura',
  ref: 'Gravura em linóleo, cartaz de propaganda',
  desc: 'Duas tintas só: preto sobre creme. O volume não vem de tom, vem de hachura — linhas mais grossas e mais juntas onde é escuro, mais finas e espaçadas onde é claro. Altíssimo contraste e leitura instantânea, mas nenhuma cor para carregar a emoção da cena.',
  S: 3, quantiza: false,
  sky(t, g) {
    t.rect(0, 0, t.w, t.h, PAPEL);
    // raios saindo do sol, afinando conforme se afastam
    const cx = t.s(g.sol.x), cy = t.s(g.sol.y);
    for (let i = 0; i < 44; i++) {
      const ang = (i / 44) * Math.PI * 2;
      const r0 = t.s(g.sol.r * 1.3), r1 = t.s(g.sol.r) * (3 + h1(i) * 4);
      t.linha(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0,
              cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1, TINTA, Math.max(1, t.s(1.2 - h1(i * 3) * 0.7)));
    }
    // hachura do céu adensando na direção do horizonte
    for (let y = 0; y < t.s(GY); y += t.s(5)) {
      const dens = y / t.s(GY);
      for (let x = 0; x < t.w; x += t.s(3))
        if (h2(x, y) < dens * 0.55) t.linha(x, y, x + t.s(2), y, TINTA, Math.max(1, t.s(dens * 1.6)));
    }
    t.ellipse(cx, cy, t.s(g.sol.r), t.s(g.sol.r), PAPEL);
    for (let i = 0; i < 60; i++) {
      const ang = (i / 60) * Math.PI * 2;
      t.linha(cx, cy, cx + Math.cos(ang) * t.s(g.sol.r), cy + Math.sin(ang) * t.s(g.sol.r), TINTA, 1, 0.18);
    }
  },
  far(t, g) {
    pintaPerfil(t, g.colinas, TINTA);
    pintaVulto(t, g.predios.longe, TINTA);
    // goivas brancas: é o corte da madeira que faz o meio-tom
    for (let x = 0; x < t.w; x += t.s(2)) {
      const y0 = t.s(g.colinas[Math.floor(x / t.S) % W]);
      for (let y = y0 + t.s(3); y < t.h; y += t.s(6))
        if (h2(x, y) < 0.6) t.linha(x, y, x + t.s(1), y, PAPEL, Math.max(1, t.s(1)));
    }
  },
  mid(t, g) {
    pintaVulto(t, g.predios.meio, TINTA);
    for (const p of g.predios.meio) {
      // hachura vertical na face, mais aberta perto da borda iluminada
      for (let i = 0; i < p.w; i += 3) {
        const claro = i < p.w * 0.35;
        if (!claro) continue;
        for (let k = 0; k < t.S; k++)
          t.linha(t.s(p.x + i) + k, t.s(p.perfilTopo[i]) + t.s(2), t.s(p.x + i) + k, t.h, PAPEL, 1, 0.9);
      }
      for (const j of p.janelas) if (j.aceso) t.rect(t.s(j.x), t.s(j.y), t.s(j.w), t.s(j.h), PAPEL);
    }
  },
  near(t, g) {
    t.rect(0, t.s(g.chao.y), t.w, t.h, TINTA);
    for (let y = t.s(g.chao.y) + t.s(3); y < t.h; y += t.s(4)) {
      const dens = 1 - (y - t.s(g.chao.y)) / (t.h - t.s(g.chao.y));
      for (let x = 0; x < t.w; x += t.s(4))
        if (h2(x, y) < 0.35 + dens * 0.4) t.linha(x, y, x + t.s(1 + Math.floor(h2(y, x) * 3)), y, PAPEL, 1);
    }
    for (const s of g.chao.pedras) {
      t.ellipse(t.s(s.x), t.s(s.y), t.s(s.rx), t.s(s.ry), PAPEL);
      t.ellipse(t.s(s.x + 1), t.s(s.y + 1), t.s(Math.max(1, s.rx - 2)), t.s(Math.max(1, s.ry - 1)), TINTA);
    }
  },
  frente(t, g) { figura(t, g.figura, TINTA); },
};

// ── 7. CEL / FUNDO DE ANIME ──────────────────────────────
ESTILOS.cel = {
  nome: 'Cel, fundo de anime',
  ref: 'Ghibli, Makoto Shinkai',
  desc: 'Céu pintado em degradê contínuo e macio, nuvens com volume, e todo o resto com sombra de borda dura em dois valores — o corte limpo entre luz e sombra que define a técnica de acetato. Bonito e legível, e o que mais depende de bom desenho de nuvem e de luz.',
  S: 3, quantiza: false,
  sky(t, g) {
    ceuLiso(t, ['#1d3a6b', '#3f6ba8', '#8aa8c9', '#e8b58a', '#f6d9a0'], 0, t.h);
    haloLiso(t, t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r * 5), '#ffe6b0', 0.6);
    t.ellipse(t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r), t.s(g.sol.r), hex('#fff6dc'));
    // nuvens: corpo, barriga na sombra, topo pegando luz — três valores duros
    for (let n = 0; n < 7; n++) {
      const cx = t.s(40 + h1(n * 5.3) * 460), cy = t.s(46 + h1(n * 9.1) * 110);
      const w = t.s(60 + h1(n * 2.7) * 90), h = t.s(9 + h1(n * 6.1) * 7);
      for (let l = 0; l < 6; l++) {
        const lx = cx - w / 2 + (w / 5) * l, lr = h * (1 + h1(n * 3 + l) * 0.7);
        t.ellipse(lx, cy, lr, lr * 0.7, hex('#f2ddc8'));
      }
      for (let l = 0; l < 6; l++) {
        const lx = cx - w / 2 + (w / 5) * l, lr = h * (0.8 + h1(n * 3 + l) * 0.5);
        t.ellipse(lx, cy + h * 0.5, lr, lr * 0.45, hex('#c9a8a8'));
        t.ellipse(lx - h * 0.2, cy - h * 0.45, lr * 0.7, lr * 0.35, hex('#fff4e0'));
      }
    }
  },
  far(t, g) {
    pintaPerfil(t, g.colinas, hex('#6b7a9e'));
    for (let x = 0; x < t.w; x++) {
      const y = t.s(g.colinas[Math.floor(x / t.S) % W]);
      for (let k = 0; k < t.s(7); k++) t.px(x, y + k, hex('#8e9bba'));
    }
    pintaVulto(t, g.predios.longe, hex('#55618a'));
  },
  mid(t, g) {
    for (const p of g.predios.meio) {
      const faixa = Math.round(p.w * 0.34);
      for (let i = 0; i < p.w; i++) {
        // corte duro entre a face na luz e a face na sombra
        const cor = i >= p.w - faixa ? hex('#2f3557') : hex('#454d78');
        for (let k = 0; k < t.S; k++)
          for (let yy = t.s(p.perfilTopo[i]); yy < t.h; yy++) t.px(t.s(p.x + i) + k, yy, cor);
      }
      for (let i = 0; i < p.w; i++) for (let k = 0; k < t.S; k++)
        for (let d = 0; d < t.s(3); d++) t.px(t.s(p.x + i) + k, t.s(p.perfilTopo[i]) + d, hex('#6f79a8'));
      for (const j of p.janelas) {
        t.rect(t.s(j.x), t.s(j.y), t.s(j.w), t.s(j.h), hex(j.aceso ? '#ffd98a' : '#252a45'));
        if (j.aceso) haloLiso(t, t.s(j.x + 2), t.s(j.y + 3), t.s(7), '#ffd98a', 0.35);
      }
    }
  },
  near(t, g) {
    t.rect(0, t.s(g.chao.y), t.w, t.h, hex('#3a3556'));
    t.rect(0, t.s(g.chao.y), t.w, t.s(5), hex('#5c5478'));
    t.rect(0, t.s(g.chao.y + 26), t.w, t.h, hex('#2a2742'));
    for (const s of g.chao.pedras) {
      t.ellipse(t.s(s.x + 2), t.s(s.y + 1), t.s(s.rx + 1), t.s(s.ry), hex('#211f35'));
      t.ellipse(t.s(s.x), t.s(s.y), t.s(s.rx), t.s(s.ry), hex('#4e4870'));
      t.ellipse(t.s(s.x - 1), t.s(s.y - 1), t.s(Math.max(1, s.rx - 2)), t.s(Math.max(1, s.ry - 1)), hex('#6f689a'));
    }
  },
  frente(t, g) { figura(t, g.figura, hex('#1e1c30')); },
};

// ── 8. RISOGRAFIA ────────────────────────────────────────
ESTILOS.riso = {
  nome: 'Risografia',
  ref: 'Impressão riso, fanzine',
  desc: 'Três tintas impressas uma sobre a outra em retícula de pontos, cada chapa num ângulo diferente e com um desregistro de um ou dois pixels — o defeito da impressora é a graça da técnica. Textura viva e cor forte, mas o ponto sempre aparece e come o detalhe fino.',
  S: 3, quantiza: false,
  sky(t, g) {
    t.rect(0, 0, t.w, t.h, hex('#f2ece0'));
    const A = chapa(t), B = chapa(t);
    for (let y = 0; y < t.h; y++) {
      const k = y / t.h;
      A.rect(0, y, t.w, 1, [255, 255, 255], 0.85 - k * 0.8);       // azul no alto
      B.rect(0, y, t.w, 1, [255, 255, 255], Math.max(0, k * 0.9 - 0.1)); // rosa embaixo
    }
    coberturaDisco(B, t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r * 3), 0.8);
    imprime(t, A, '#2b4ea8', { ang: 0.26, dx: 0, dy: 0 });
    imprime(t, B, '#f0508c', { ang: 1.31, dx: t.s(1), dy: t.s(-1) });
    const C = chapa(t);
    coberturaDisco(C, t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r * 1.6), 1);
    imprime(t, C, '#f5c542', { ang: 0.79, dx: t.s(-1), dy: t.s(1) });
  },
  far(t, g) {
    const A = chapa(t);
    for (let x = 0; x < t.w; x++) A.coluna(x, t.s(g.colinas[Math.floor(x / t.S) % W]), [255, 255, 255], 0.55);
    coberturaVulto(A, t, g.predios.longe, 0.75);
    imprime(t, A, '#2b4ea8', { ang: 0.26, dx: 0, dy: 0 });
    const B = chapa(t);
    coberturaVulto(B, t, g.predios.longe, 0.35);
    imprime(t, B, '#f0508c', { ang: 1.31, dx: t.s(2), dy: t.s(-1) });
  },
  mid(t, g) {
    const A = chapa(t), B = chapa(t);
    coberturaVulto(A, t, g.predios.meio, 0.95);
    coberturaVulto(B, t, g.predios.meio, 0.55);
    imprime(t, A, '#2b4ea8', { ang: 0.26, dx: 0, dy: 0 });
    imprime(t, B, '#f0508c', { ang: 1.31, dx: t.s(2), dy: t.s(-2) });
    const C = chapa(t);
    for (const p of g.predios.meio) for (const j of p.janelas)
      if (j.aceso) C.rect(t.s(j.x), t.s(j.y), t.s(j.w), t.s(j.h), [255, 255, 255], 1);
    imprime(t, C, '#f5c542', { ang: 0.79, dx: 0, dy: 0, passo: 5 });
  },
  near(t, g) {
    const A = chapa(t), B = chapa(t);
    A.rect(0, t.s(g.chao.y), t.w, t.h, [255, 255, 255], 1);
    B.rect(0, t.s(g.chao.y), t.w, t.h, [255, 255, 255], 0.7);
    for (const s of g.chao.pedras) B.ellipse(t.s(s.x), t.s(s.y), t.s(s.rx + 1), t.s(s.ry), [255, 255, 255], 1);
    imprime(t, A, '#2b4ea8', { ang: 0.26, dx: 0, dy: 0 });
    imprime(t, B, '#f0508c', { ang: 1.31, dx: t.s(1), dy: t.s(2) });
  },
  frente(t, g) {
    const A = chapa(t);
    figura(A, g.figura, [255, 255, 255]);
    imprime(t, A, '#1c2f66', { ang: 0.26, dx: 0, dy: 0, passo: 5 });
  },
};

/** Chapa de cobertura: uma tela usada só pelo canal de alfa. */
function chapa(t) {
  const c = new Tela(t.w / t.S, t.h / t.S, { wrap: t.wrap, S: t.S });
  return c;
}
function coberturaDisco(c, cx, cy, rad, forca) {
  for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
    const d = Math.sqrt(x * x + y * y) / rad;
    if (d > 1) continue;
    c.px(cx + x, cy + y, [255, 255, 255], forca * (1 - d * d));
  }
}
function coberturaVulto(c, t, predios, forca) {
  for (const p of predios) for (let i = 0; i < p.w; i++) for (let k = 0; k < t.S; k++)
    c.coluna(t.s(p.x + i) + k, t.s(p.perfilTopo[i]), [255, 255, 255], forca);
}
/**
 * Imprime uma chapa como retícula: o raio do ponto cresce com a
 * cobertura, a grade vai num ângulo próprio e dx/dy dão o desregistro.
 */
function imprime(t, cov, cor, { ang, dx = 0, dy = 0, passo = null }) {
  const K = P(cor), ca = Math.cos(ang), sa = Math.sin(ang);
  const p = passo ? t.s(passo) : t.s(3);
  for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) {
    const c = cov.a(x - dx, y - dy);
    if (c <= 0.02) continue;
    const u = (x * ca - y * sa) / p, v = (x * sa + y * ca) / p;
    const fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5;
    const d = Math.sqrt(fu * fu + fv * fv) / 0.7071;
    if (d < Math.sqrt(Math.min(1, c))) t.px(x, y, K, 1);
  }
}

// ── 9. LOW POLY ──────────────────────────────────────────
ESTILOS.lowpoly = {
  nome: 'Low poly',
  ref: 'Ilustração facetada, Superbrothers',
  desc: 'A cena inteira é triangulada e cada faceta recebe uma cor chapada tirada de um degradê base, com pequena variação por face. Dá um acabamento moderno e uniforme e é o mais fácil de manter consistente entre 14 cenas, mas apaga qualquer detalhe pequeno.',
  S: 3, quantiza: false,
  sky(t, g) {
    ceuLiso(t, ['#20244f', '#3d3a72', '#7d5590', '#cd7a76', '#f0b06e'], 0, t.h);
    // malha triangulada por cima, cada face na cor do próprio centro
    const passo = t.s(38);
    for (let y = -passo; y < t.h + passo; y += passo) {
      for (let x = -passo; x < t.w + passo; x += passo) {
        const j = (a, b) => [a + (h2(a, b) - 0.5) * passo * 0.55, b + (h2(b, a) - 0.5) * passo * 0.55];
        const A = j(x, y), B = j(x + passo, y), C = j(x, y + passo), D = j(x + passo, y + passo);
        for (const tri of [[A, B, C], [B, D, C]]) {
          const cx = Math.round((tri[0][0] + tri[1][0] + tri[2][0]) / 3);
          const cy = Math.round((tri[0][1] + tri[1][1] + tri[2][1]) / 3);
          const base = t.get(Math.max(0, Math.min(t.w - 1, cx)), Math.max(0, Math.min(t.h - 1, cy)));
          t.poligono(tri, shade(base, (h2(cx, cy) - 0.5) * 0.24));
        }
      }
    }
    t.ellipse(t.s(g.sol.x), t.s(g.sol.y), t.s(g.sol.r), t.s(g.sol.r), hex('#ffe6ae'));
  },
  far(t, g) {
    // a colina vira uma tira de triângulos apoiados no perfil
    const passo = 30;
    for (let x = 0; x < W; x += passo) {
      const x1 = Math.min(W, x + passo);
      const y0 = g.colinas[x % W], y1 = g.colinas[x1 % W];
      const A = [t.s(x), t.s(y0)], B = [t.s(x1), t.s(y1)];
      t.poligono([A, B, [t.s(x1), t.h], [t.s(x), t.h]], shade(hex('#5b4f80'), (h1(x) - 0.5) * 0.22));
      t.poligono([A, B, [t.s((x + x1) / 2), t.s(Math.min(y0, y1) + 14)]], shade(hex('#75689e'), (h1(x * 3) - 0.5) * 0.2));
    }
    for (const p of g.predios.longe) facetaPredio(t, p, hex('#463d66'), 0.18);
  },
  mid(t, g) {
    for (const p of g.predios.meio) facetaPredio(t, p, hex('#8a5a7e'), 0.22);
    for (const p of g.predios.meio) for (const j of p.janelas)
      if (j.aceso) t.poligono([[t.s(j.x), t.s(j.y)], [t.s(j.x + j.w), t.s(j.y)], [t.s(j.x + j.w / 2), t.s(j.y + j.h)]], hex('#ffd08a'));
  },
  near(t, g) {
    const passo = 36;
    for (let x = 0; x < W; x += passo) {
      const x1 = x + passo;
      const y = GY + Math.round(h1(x) * 5), y1 = GY + Math.round(h1(x1) * 5);
      t.poligono([[t.s(x), t.s(y)], [t.s(x1), t.s(y1)], [t.s(x1), t.h], [t.s(x), t.h]],
        shade(hex('#3b3050'), (h1(x * 7) - 0.5) * 0.26));
    }
    for (const s of g.chao.pedras)
      t.poligono([[t.s(s.x - s.rx), t.s(s.y + s.ry)], [t.s(s.x), t.s(s.y - s.ry)], [t.s(s.x + s.rx), t.s(s.y + s.ry)]],
        shade(hex('#544672'), (h1(s.x) - 0.5) * 0.3));
  },
  frente(t, g) { figura(t, g.figura, hex('#241d3a')); },
};

/** Prédio facetado: duas faces triangulares por volume. */
function facetaPredio(t, p, cor, variacao) {
  const topoEsq = p.perfilTopo[0], topoDir = p.perfilTopo[p.w - 1];
  const meio = p.perfilTopo[Math.floor(p.w / 2)];
  const c1 = shade(cor, (h1(p.x) - 0.5) * variacao * 2);
  const c2 = shade(cor, -variacao);
  t.poligono([[t.s(p.x), t.s(topoEsq)], [t.s(p.x + p.w / 2), t.s(meio)], [t.s(p.x + p.w / 2), t.h], [t.s(p.x), t.h]], c1);
  t.poligono([[t.s(p.x + p.w / 2), t.s(meio)], [t.s(p.x + p.w), t.s(topoDir)], [t.s(p.x + p.w), t.h], [t.s(p.x + p.w / 2), t.h]], c2);
}

// ═════════════════════════════════════════════════════════
// EXECUÇÃO
// ═════════════════════════════════════════════════════════
const CAMADAS = [
  // nome     velocidade   rola em cilindro
  ['sky',   VEL.sky,  false],
  ['far',   VEL.far,  true],
  ['mid',   VEL.mid,  true],
  ['near',  VEL.near, true],
  // a protagonista fica numa camada parada: dentro de uma que rola, ela
  // apareceria duas vezes quando a tira dá a volta
  ['frente', 0, false],
];

const args = process.argv.slice(2);
fs.rmSync(OUT, { recursive: true, force: true });

// A geometria é sorteada uma única vez, fora do laço de estilos.
const geo = cenarioRef(20250811);

const manifesto = {};
for (const [slug, est] of Object.entries(ESTILOS)) {
  const camadas = [];
  for (const [nome, vel, rola] of CAMADAS) {
    const t = new Tela(W, H, { wrap: rola, S: est.S });
    est[nome](t, geo);
    await t.save(path.join(OUT, slug, `${nome}.png`), { quantiza: est.quantiza });
    camadas.push({ n: nome, v: vel, fx: null });
  }
  const dir = path.join(OUT, slug);
  await sharp(path.join(dir, 'sky.png'))
    .composite(camadas.slice(1).map(c => ({ input: path.join(dir, `${c.n}.png`) })))
    .png({ compressionLevel: 9 }).toFile(path.join(dir, 'flat.png'));
  manifesto[slug] = { nome: est.nome, ref: est.ref, desc: est.desc, camadas };
  const peso = camadas.reduce((s, c) => s + fs.statSync(path.join(dir, `${c.n}.png`)).size, 0);
  console.log(`✓ ${slug.padEnd(12)} ${camadas.length} camadas  ${(peso / 1024).toFixed(0)} kB`);
}

fs.writeFileSync('src/game/styleStudies.json', JSON.stringify(manifesto, null, 1));
console.log(`\n${Object.keys(manifesto).length} estudos em ${OUT}`);
console.log('→ manifesto em src/game/styleStudies.json');

// contato 3x3 para conferir de relance que os nove são o mesmo lugar
if (args.includes('--sheet')) {
  const slugs = Object.keys(manifesto);
  const cols = 3, cw = W, ch = H + 22;
  const comps = [];
  for (let i = 0; i < slugs.length; i++) {
    const rot = Buffer.from(
      `<svg width="${cw}" height="22"><rect width="${cw}" height="22" fill="#111"/>` +
      `<text x="8" y="15" font-family="monospace" font-size="13" fill="#ddd">${i + 1}  ${slugs[i]}  —  ${manifesto[slugs[i]].nome}</text></svg>`);
    comps.push({ input: rot, left: (i % cols) * cw, top: Math.floor(i / cols) * ch });
    comps.push({ input: path.join(OUT, slugs[i], 'flat.png'), left: (i % cols) * cw, top: Math.floor(i / cols) * ch + 22 });
  }
  const rows = Math.ceil(slugs.length / cols);
  await sharp({ create: { width: cw * cols, height: ch * rows, channels: 3, background: '#111' } })
    .composite(comps).png().toFile('/tmp/cinzas-estilos.png');
  console.log('→ contato em /tmp/cinzas-estilos.png');
}
