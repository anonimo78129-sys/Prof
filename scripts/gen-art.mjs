// ─────────────────────────────────────────────────────────
// Gerador de arte pixel de CINZAS.
//
// Estilo: pixel art 16-bit de RPG retrô. Paleta fechada de 61 cores em
// rampas de 4 a 5 tons, contorno escuro em tudo que é objeto, luz sempre
// vindo de cima e da esquerda, e degradê só por dithering ordenado.
// Nenhum pixel sai da paleta: a gravação passa por uma quantização que
// prende qualquer cor à entrada mais próxima e trava o alfa em 6 níveis.
// É isso que dá a borda nítida e o ar de arte feita à mão em vez de
// degradê borrado.
//
// Tudo é autoral e determinístico: o mesmo seed sempre produz a mesma
// imagem, então a arte fica versionada no repositório e não depende de
// nenhum pack externo.
//
//   node scripts/gen-art.mjs            gera a arte
//   node scripts/gen-art.mjs --sheet    gera também um contato 3x p/ revisão
// ─────────────────────────────────────────────────────────
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'public/assets/cinzas/art';
// Resolução nativa: 540x300 (a capa, 540x450). Densidade suficiente para
// sombrear em quatro tons e detalhar pixel a pixel sem empastar quando a
// tela amplia.
const W = 540, H = 300;
const GROUND_Y = 252;   // linha do chão, igual em todos os cenários

// ═════════════════════════════════════════════════════════
// PALETA
//
// Rampas de 4 ou 5 tons, do escuro ao claro. Todo desenho escolhe um tom
// de uma rampa; nada de cor solta. Rampas curtas forçam decisão de valor,
// que é o que faz a leitura de forma funcionar.
// ═════════════════════════════════════════════════════════
// Paleta de desenho de traço: cor chapada, contorno preto, céu ciano
// forte e pedra creme tomada de musgo.
//
// A rampa "ink" aqui não é penumbra colorida, é tinta de contorno mesmo:
// os quatro tons ficam quase pretos de propósito, porque nesse idioma a
// linha é preta e o volume vem do recorte, não do sombreado. Rampas de
// tom continuam existindo, mas com degraus largos: dois ou três valores
// legíveis por objeto, nada de rampa suave que empasta o campo chapado.
const PAL = {
  // tinta: contorno preto e sombra recortada
  ink0: '#101010', ink1: '#1c1f18', ink2: '#2b3124', ink3: '#3d4632',
  // oliva: massa escura de mata, o enquadramento do primeiro plano
  rox0: '#4a5a24', rox1: '#5c6b2a', rox2: '#7a8c3a', rox3: '#9aad55',
  // azul: céu
  azu0: '#0f7f9c', azu1: '#17a8cc', azu2: '#2ad4f5', azu3: '#7fe6fa', azu4: '#c8f4ff',
  // ciano: vidro, água, luz de estufa
  cia0: '#0a6070', cia1: '#12909c', cia2: '#2ad4f5', cia3: '#7fe6fa', cia4: '#d0f8ff',
  // verde: folhagem viva
  ver0: '#3a5a18', ver1: '#5c7a1a', ver2: '#7ba428', ver3: '#a3d13f', ver4: '#c8e878',
  // musgo: verde ácido, contaminação, mato seco
  mus0: '#414d16', mus1: '#6b7d1e', mus2: '#95ad2a', mus3: '#c3d94a', mus4: '#e2f08a',
  // ouro: sol, trigo, luz de janela
  our0: '#8a5a10', our1: '#c08018', our2: '#f0b028', our3: '#ffd257', our4: '#fff0b0',
  // laranja: fogo, ferrugem, telhado
  lar0: '#7d4109', lar1: '#c06010', lar2: '#f7941e', lar3: '#ffb347', lar4: '#ffd699',
  // rubi: alerta, sangue, luz de emergência
  rub0: '#5c1a12', rub1: '#8f2a1c', rub2: '#c0392b', rub3: '#e0705c',
  // rosa: céu de amanhecer, carne, flor
  ros0: '#8a4030', ros1: '#c06a50', ros2: '#e89a7a', ros3: '#ffc8a8',
  // madeira: tronco, terra, couro
  mad0: '#2e2416', mad1: '#4d3d22', mad2: '#75603a', mad3: '#a08a5c', mad4: '#c9b68c',
  // pedra: o creme das ruínas, nunca cinza morto
  ped0: '#5e6252', ped1: '#8a8e78', ped2: '#b5b89c', ped3: '#d6d8ba', ped4: '#ede9d0',
  // creme: papel, névoa, nuvem
  cre0: '#b5b89c', cre1: '#d6d8ba', cre2: '#ede9d0', cre3: '#ffffff',
  bra: '#ffffff',
};

// ── cor ──────────────────────────────────────────────────
const hex = (h) => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
const shade = (c, t) => (t < 0 ? mix(c, [0, 0, 0], -t) : mix(c, [255, 255, 255], t));

const RGB = {};
for (const k in PAL) RGB[k] = hex(PAL[k]);
/** Aceita nome da paleta ("ver3"), hex solto ou já um [r,g,b]. */
const P = (n) => (Array.isArray(n) ? n : RGB[n] || hex(n));
/** Uma rampa inteira pelo prefixo: RAMP('ver') → ['ver0'…'ver4']. */
const RAMP = (p) => Object.keys(PAL).filter(k => k.startsWith(p)).sort();

// Lista da paleta em RGB, para a quantização.
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
const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));

// dithering ordenado 4x4: é o único degradê permitido
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dither = (t, x, y) => t > (BAYER[y & 3][x & 3] + 0.5) / 16;

// ── quantização ──────────────────────────────────────────
// Prende cada pixel à cor mais próxima da paleta e trava o alfa em 6
// níveis. Roda uma vez na gravação, então qualquer mistura acidental de
// cor que tenha acontecido durante o desenho volta para a paleta.
const _cacheQ = new Map();
function maisProxima(r, g, b) {
  const chave = (r << 16) | (g << 8) | b;
  const memo = _cacheQ.get(chave);
  if (memo !== undefined) return memo;
  let melhor = 0, dist = Infinity;
  for (let i = 0; i < PAL_RGB.length; i++) {
    const c = PAL_RGB[i];
    // pesos aproximando a sensibilidade do olho (verde pesa mais)
    const dr = r - c[0], dg = g - c[1], db = b - c[2];
    const d = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
    if (d < dist) { dist = d; melhor = i; }
  }
  const c = PAL_RGB[melhor];
  const val = (c[0] << 16) | (c[1] << 8) | c[2];
  _cacheQ.set(chave, val);
  return val;
}
const ALFAS = [0, 51, 102, 153, 204, 255];
const alfaProximo = (a) => ALFAS.reduce((m, v) => (Math.abs(v - a) < Math.abs(m - a) ? v : m), 0);

// ── tela ─────────────────────────────────────────────────
class Canvas {
  // wrap: desenha em cilindro. O que sai por uma borda entra pela outra,
  // então a imagem encosta nela mesma sem emenda e pode rolar em loop.
  constructor(w, h, wrap = false) { this.w = w; this.h = h; this.wrap = wrap; this.d = new Uint8Array(w * h * 4); }
  px(x, y, c, a = 1) {
    x |= 0; y |= 0;
    if (this.wrap) x = ((x % this.w) + this.w) % this.w;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = (y * this.w + x) * 4;
    if (a >= 1) { this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255; return; }
    const dA = this.d[i + 3] / 255, oA = a + dA * (1 - a);
    for (let k = 0; k < 3; k++) this.d[i + k] = Math.round((c[k] * a + this.d[i + k] * dA * (1 - a)) / oA);
    this.d[i + 3] = Math.round(oA * 255);
  }
  get(x, y) { const i = (y * this.w + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]]; }
  /** alfa com limite seguro: fora da tela conta como vazio */
  a(x, y) {
    if (this.wrap) x = ((x % this.w) + this.w) % this.w;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[((y * this.w + x) * 4) + 3];
  }
  rect(x, y, w, h, c, a = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, a); }
  hline(x, y, w, c, a = 1) { this.rect(x, y, w, 1, c, a); }
  vline(x, y, h, c, a = 1) { this.rect(x, y, 1, h, c, a); }
  ellipse(cx, cy, rx, ry, c, a = 1) {
    if (rx < 1 || ry < 1) { this.px(cx, cy, c, a); return; }
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) this.px(cx + x, cy + y, c, a);
  }
  outlineRect(x, y, w, h, c) {
    this.hline(x, y, w, c); this.hline(x, y + h - 1, w, c);
    this.vline(x, y, h, c); this.vline(x + w - 1, y, h, c);
  }
  /** Degradê vertical dentro de um retângulo, transição por dithering. */
  grad(x, y, w, h, cTopo, cBase, a = 1) {
    const A = P(cTopo), B = P(cBase);
    for (let j = 0; j < h; j++) {
      const t = j / Math.max(1, h - 1);
      for (let i = 0; i < w; i++) this.px(x + i, y + j, dither(t, x + i, y + j) ? B : A, a);
    }
  }
  async save(file) {
    // quantiza para a paleta antes de gravar
    for (let i = 0; i < this.d.length; i += 4) {
      const al = this.d[i + 3];
      if (al === 0) { this.d[i] = this.d[i + 1] = this.d[i + 2] = 0; continue; }
      const q = maisProxima(this.d[i], this.d[i + 1], this.d[i + 2]);
      this.d[i] = (q >> 16) & 255; this.d[i + 1] = (q >> 8) & 255; this.d[i + 2] = q & 255;
      this.d[i + 3] = alfaProximo(al);
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(Buffer.from(this.d), { raw: { width: this.w, height: this.h, channels: 4 } })
      .png({ compressionLevel: 9, palette: true }).toFile(file);
  }
}

// ═════════════════════════════════════════════════════════
// PRIMITIVAS DE ESTILO
// ═════════════════════════════════════════════════════════

// Desenha numa tela temporária, contorna tudo que ficou opaco e cola no
// destino. É o que garante a borda escura nítida em volta de cada objeto,
// que é a assinatura do pixel art de RPG.
function stamp(c, x, y, w, h, desenha, { out = 'ink0', luz = null } = {}) {
  const t = new Canvas(w, h);
  desenha(t);
  // No idioma de desenho de traço o contorno é preto e fecha a forma
  // inteira, então qualquer tom que o chamador peça é puxado para a
  // tinta. Sem isso cada objeto sai com um contorno de cor diferente e o
  // conjunto perde a cara de desenho.
  const O = P('ink0');
  const borda = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (t.a(i, j) > 0) continue;
    if (t.a(i - 1, j) > 0 || t.a(i + 1, j) > 0 || t.a(i, j - 1) > 0 || t.a(i, j + 1) > 0) borda.push([i, j]);
  }
  for (const [i, j] of borda) t.px(i, j, O);
  // brilho de borda: onde o objeto encosta no vazio por cima, uma linha
  // clara. Dá a impressão de luz batendo de cima sem repintar a forma.
  if (luz) {
    const L = P(luz);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (t.a(i, j) !== 255) continue;
      if (t.a(i, j - 1) === 0 && t.a(i - 1, j - 1) === 0) t.px(i, j, L);
    }
  }
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const p = t.get(i, j);
    if (p[3] > 0) c.px(x + i, y + j, [p[0], p[1], p[2]], p[3] / 255);
  }
}

// Contorna a silhueta de uma camada inteira já desenhada. Usado nas
// camadas de fundo, onde o recorte contra o céu precisa de linha firme.
function contornaCamada(c, cor = 'ink1', lado = 'topo') {
  const O = P(cor), marca = [];
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    if (c.a(x, y) !== 0) continue;
    const abaixo = c.a(x, y + 1) > 0, acima = c.a(x, y - 1) > 0;
    const lados = c.a(x - 1, y) > 0 || c.a(x + 1, y) > 0;
    if (lado === 'topo' ? (abaixo || lados) : (abaixo || acima || lados)) marca.push([x, y]);
  }
  for (const [x, y] of marca) c.px(x, y, O);
}

// Halo em anéis discretos com fronteira pontilhada. Substitui o degradê
// contínuo de alfa, que embaçava e saía da paleta.
function glow(c, cx, cy, rx, ry, cor, niveis = [0.4, 0.24, 0.12, 0.06]) {
  const K = P(cor), n = niveis.length;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    const d = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry));
    if (d > 1) continue;
    const f = d * n, i = Math.floor(f);
    if (i >= n) continue;
    const k = (dither(f - i, cx + x, cy + y) && i + 1 < n) ? i + 1 : i;
    c.px(cx + x, cy + y, K, niveis[k]);
  }
}

// Céu em degradê pontilhado entre tons da paleta.
function sky(c, stops, y0 = 0, y1 = c.h) {
  const cols = stops.map(s => P(s));
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    const f = t * (cols.length - 1);
    const i = Math.min(cols.length - 2, Math.floor(f));
    const local = f - i;
    for (let x = 0; x < c.w; x++) c.px(x, y, dither(local, x, y) ? cols[i + 1] : cols[i]);
  }
}

function stars(c, r, n, yMax, cor = 'bra') {
  const k = P(cor);
  for (let i = 0; i < n; i++) {
    const x = ri(r, 0, c.w - 1), y = ri(r, 0, yMax);
    const b = r();
    c.px(x, y, k, b < 0.45 ? 0.4 : b < 0.85 ? 0.8 : 1);
    // as mais fortes ganham cruz de brilho
    if (b > 0.96) { c.px(x - 1, y, k, 0.4); c.px(x + 1, y, k, 0.4); c.px(x, y - 1, k, 0.4); c.px(x, y + 1, k, 0.4); }
  }
}

// Disco solar/lunar: halo em anéis, disco chapado, aro claro em cima.
function sunDisc(c, cx, cy, rad, nucleo, halo, aro = null) {
  glow(c, cx, cy, rad * 4, rad * 4, halo, [0.26, 0.16, 0.09, 0.04]);
  c.ellipse(cx, cy, rad, rad, P(nucleo));
  if (aro) for (let x = -rad; x <= rad; x++) {
    const dy = Math.round(Math.sqrt(Math.max(0, rad * rad - x * x)));
    c.px(cx + x, cy - dy + 1, P(aro));
  }
}

// Nuvem em três valores, com barriga na sombra e topo iluminado. Forma
// feita de lóbulos, contornada, para não virar mancha.
function clouds(c, r, { n, yMin, yMax, corpo, sombra, luz, minW = 60, maxW = 150, a = 1 }) {
  for (let i = 0; i < n; i++) {
    const cx = ri(r, -40, c.w + 40), cy = ri(r, yMin, yMax);
    const w = ri(r, minW, maxW);
    // corpo baixo e muitos lóbulos: com corpo alto a nuvem vira uma laje
    // com a borda mordida em vez de volume
    const h = Math.max(7, Math.min(17, Math.round(w * 0.11)));
    const lobos = Math.max(4, Math.min(8, Math.round(w / 26)));
    const forma = [];
    for (let l = 0; l < lobos; l++) {
      const lx = Math.round(-w / 2 + (w / (lobos - 1)) * l);
      const lr = ri(r, Math.max(8, h), h + 12);
      forma.push([lx, lr, Math.max(6, Math.round(lr * 0.62))]);
    }
    const bw = w + 34, bh = h + 40;
    stamp(c, cx - bw / 2, cy - bh / 2, bw, bh, (t) => {
      const ox = Math.round(bw / 2), oy = Math.round(bh / 2);
      for (const [lx, lrx, lry] of forma) t.ellipse(ox + lx, oy, lrx, lry, P(corpo));
      t.rect(ox - w / 2, oy, w, Math.max(4, h - 1), P(corpo));
      // barriga na sombra
      for (const [lx, lrx] of forma) t.ellipse(ox + lx, oy + Math.max(3, h - 3), Math.max(3, lrx - 3), Math.max(2, Math.round(h * 0.5)), P(sombra));
      t.rect(ox - w / 2, oy + Math.max(3, h - 2), w, 3, P(sombra));
      // topo pegando luz
      for (const [lx, lrx, lry] of forma) t.ellipse(ox + lx - 2, oy - Math.round(lry * 0.45), Math.max(3, lrx - 4), Math.max(2, Math.round(lry * 0.45)), P(luz));
    }, { out: sombra });
    if (a < 1) { /* nuvem fraca: já é o tom escolhido, alfa fica no chamador */ }
  }
}

// Massa de folhagem: lóbulos em quatro valores, recorte de sombra por
// baixo, folhas soltas na borda e pontos de brilho. Contornada.
function copa(c, cx, cy, rx, ry, [d, m, l, b], seed = 0) {
  const bw = rx * 2 + 8, bh = ry * 2 + 8;
  stamp(c, cx - rx - 4, cy - ry - 4, bw, bh, (t) => {
    const r = rng(cx * 37 + cy * 17 + rx * 7 + seed);
    const ox = rx + 4, oy = ry + 4;
    const lobos = [[0, 0, Math.round(rx * 0.74), Math.round(ry * 0.84)]];
    const n = ri(r, 5, 7);
    for (let i = 0; i < n; i++) {
      const ang = Math.PI + (i / (n - 1)) * Math.PI;
      lobos.push([
        Math.round(Math.cos(ang) * rx * 0.6),
        Math.round(Math.sin(ang) * ry * 0.5),
        Math.max(3, ri(r, Math.round(rx * 0.34), Math.round(rx * 0.5))),
        Math.max(3, ri(r, Math.round(ry * 0.36), Math.round(ry * 0.54))),
      ]);
    }
    for (const [lx, ly, lrx, lry] of lobos) t.ellipse(ox + lx, oy + ly, lrx, lry, P(d));
    for (const [lx, ly, lrx, lry] of lobos) t.ellipse(ox + lx - 1, oy + ly - 2, Math.max(2, lrx - 1), Math.max(2, lry - 1), P(m));
    for (const [lx, ly, lrx, lry] of lobos) if (ly <= 0)
      t.ellipse(ox + lx - 2, oy + ly - 3, Math.max(2, lrx - 4), Math.max(2, lry - 4), P(l));
    for (const [lx, ly, lrx, lry] of lobos) if (ly > 0)
      t.ellipse(ox + lx + 1, oy + ly + 2, Math.max(2, lrx - 5), Math.max(2, lry - 4), P(d));
    // borda irregular: folha entrando e saindo da silhueta
    for (let i = 0; i < rx * 2.2; i++) {
      const ang = r() * Math.PI * 2, dd = 0.82 + r() * 0.22;
      const px = ox + Math.round(Math.cos(ang) * rx * dd), py = oy + Math.round(Math.sin(ang) * ry * dd);
      if (t.a(px, py) > 0) t.px(px, py, P(Math.sin(ang) < 0 ? l : d));
      else if (r() < 0.4) t.px(px, py, P(m));
    }
    for (let i = 0; i < Math.max(3, Math.round(rx / 3.5)); i++)
      t.px(ox + ri(r, -rx + 5, 1), oy + ri(r, -ry + 4, -2), P(b));
  }, { out: 'ink1' });
}

// Tronco: afina para cima, casca em três valores, galhos que somem.
function tronco(c, x, baseY, alt, larg, [d, m, l], { galhos = 0, seed = 0 } = {}) {
  const bw = larg + 78, bh = alt + 10;
  stamp(c, x - Math.floor(bw / 2), baseY - alt - 4, bw, bh, (t) => {
    const r = rng(x * 31 + alt * 7 + seed);
    const ox = Math.floor(bw / 2), oy = alt + 4;
    for (let j = 0; j < alt; j++) {
      const p = j / alt;
      const w = Math.max(3, Math.round(larg * (1 - p * 0.45)));
      const bx = ox - Math.floor(w / 2);
      t.rect(bx, oy - j, w, 1, P(m));
      t.px(bx, oy - j, P(l));
      t.px(bx + w - 1, oy - j, P(d));
      // casca: sulcos verticais curtos
      if (j % 3 === 0) t.px(bx + 1 + Math.floor(r() * Math.max(1, w - 2)), oy - j, P(d));
    }
    // raiz alargando na base
    for (let k = 0; k < 5; k++) {
      t.rect(ox - Math.floor(larg / 2) - k, oy - k, larg + k * 2, 1, P(m));
      t.px(ox - Math.floor(larg / 2) - k, oy - k, P(l));
      t.px(ox + Math.floor(larg / 2) + k - 1, oy - k, P(d));
    }
    for (let g = 0; g < galhos; g++) {
      const gy = oy - ri(r, Math.round(alt * 0.45), alt - 4);
      const dir = g % 2 ? 1 : -1, len = ri(r, 16, 34);
      for (let i = 0; i < len; i++) {
        const yy = gy - Math.round(i * 0.6);
        const esp = i < len * 0.45 ? 2 : 1;
        for (let k = 0; k < esp; k++) t.px(ox + dir * i, yy + k, P(k ? d : m));
      }
    }
  }, { out: 'ink1' });
}

// Árvore completa: tronco + copa.
function arvore(c, x, baseY, alt, rx, ry, folha, madeira, seed = 0) {
  tronco(c, x, baseY, alt, Math.max(6, Math.round(alt / 8)), madeira, { galhos: 4, seed });
  copa(c, x, baseY - alt - Math.round(ry * 0.35), rx, ry, folha, seed);
}

// Colina: silhueta ondulada com faixa de luz no topo e linha de copas.
function hills(c, r, { baseY, amp, cor, luz, step = 26, a = 1, copas = null }) {
  const col = P(cor), topo = P(luz ?? cor);
  const alturas = [];
  let prev = baseY - ri(r, 0, amp);
  for (let x = 0; x <= c.w; x += step) {
    const next = baseY - ri(r, 0, amp);
    for (let i = 0; i < step && x + i < c.w; i++) {
      const y = Math.round(prev + (next - prev) * (i / step));
      alturas[x + i] = y;
      for (let yy = y; yy < c.h; yy++) c.px(x + i, yy, col, a);
      c.px(x + i, y, topo, a); c.px(x + i, y + 1, topo, a * 0.7);
    }
    prev = next;
  }
  if (copas) {
    for (let x = ri(r, 0, 14); x < c.w; x += ri(r, 16, 34)) {
      const y = alturas[x] ?? baseY, h = ri(r, 9, 19);
      tronco(c, x, y + 2, h, 4, [copas[0], copas[0], copas[1]]);
      copa(c, x, y - h + 2, ri(r, 8, 14), ri(r, 6, 11), copas, x);
    }
  }
}

// Prédio: três valores de fachada, textura de concreto em blocos, topo
// danificado, janelas acesas em ouro. Cada prédio é contornado.
function cityscape(c, r, { baseY, cor, minH, maxH, minW = 30, maxW = 70, janelas = null, a = 1, gap = 0, dano = 0.4 }) {
  const corpo = P(cor), claro = shade(corpo, 0.18), escuro = shade(corpo, -0.24), sombra = shade(corpo, -0.42);
  let x = -ri(r, 0, 24);
  while (x < c.w) {
    const w = ri(r, minW, maxW), h = ri(r, minH, maxH);
    const topo = baseY - h;
    // Topo danificado: pedaços inteiros de laje faltando, com recuo
    // próprio cada um. Onda senoidal aqui virava serrilha de zíper.
    const alturaTopo = new Array(w).fill(topo);
    if (r() < dano) {
      const pedacos = ri(r, 1, 3);
      for (let k = 0; k < pedacos; k++) {
        const larg = ri(r, 6, Math.max(8, Math.round(w * 0.45)));
        const ini = ri(r, -3, w - 4);
        const fundo = ri(r, 5, 17);
        for (let i = Math.max(0, ini); i < Math.min(w, ini + larg); i++) {
          const degrau = r() < 0.22 ? ri(r, -3, 3) : 0;
          alturaTopo[i] = Math.max(alturaTopo[i], topo + fundo + degrau);
        }
      }
    }

    stamp(c, x, topo - 24, w, h + 26, (t) => {
      const oy = 24;
      for (let i = 0; i < w; i++) {
        const y0 = oy + (alturaTopo[i] - topo);
        for (let y = y0; y < oy + h; y++) t.px(i, y, corpo);
      }
      // faces laterais
      const faixa = Math.max(2, Math.round(w * 0.14));
      for (let i = 0; i < faixa; i++) for (let y = oy + (alturaTopo[i] - topo); y < oy + h; y++) t.px(i, y, claro);
      for (let i = w - faixa; i < w; i++) for (let y = oy + (alturaTopo[i] - topo); y < oy + h; y++) t.px(i, y, escuro);
      // blocos de concreto: textura estruturada, não ruído solto
      for (let y = oy + 3; y < oy + h; y += 9)
        for (let i = ((y / 9) | 0) % 2 ? 0 : 5; i < w; i += 11) {
          if (y < oy + (alturaTopo[Math.min(w - 1, i)] - topo)) continue;
          t.px(i, y, escuro); t.px(i + 1, y, escuro);
        }
      // laje: linha clara em cima do recorte
      for (let i = 0; i < w; i++) {
        const y = oy + (alturaTopo[i] - topo);
        t.px(i, y, claro); t.px(i, y + 1, shade(corpo, 0.06));
      }
      if (janelas) {
        const wc = P(janelas.cor), lit = P(janelas.acesa ?? janelas.cor);
        const passoY = janelas.passoY ?? 15, passoX = janelas.passoX ?? 13;
        for (let wy = oy + 10; wy < oy + h - 9; wy += passoY)
          for (let wx = 6; wx < w - 6; wx += passoX) {
            if (wy < oy + (alturaTopo[Math.min(w - 1, wx)] - topo) + 4) continue;
            const aceso = r() < (janelas.acende ?? 0);
            t.rect(wx, wy, 5, 7, aceso ? lit : wc);
            if (aceso) { t.px(wx, wy, P(janelas.brilho ?? 'our4')); t.px(wx + 4, wy, P(janelas.brilho ?? 'our4')); }
            else { t.hline(wx, wy, 5, sombra); t.px(wx, wy + 6, shade(wc, 0.18)); }
            t.outlineRect(wx - 1, wy - 1, 7, 9, sombra);
          }
      }
      // cobertura: caixa d'água ou antena
      const d = r();
      const meio = Math.floor(w / 2), yTopo = oy + (alturaTopo[meio] - topo);
      if (d < 0.32 && w > 26) {
        t.rect(meio - 7, yTopo - 13, 14, 13, corpo);
        t.rect(meio - 7, yTopo - 13, 3, 13, claro);
        t.hline(meio - 8, yTopo - 13, 16, claro);
        for (let k = 0; k < 3; k++) { t.px(meio - 5, yTopo + k, escuro); t.px(meio + 4, yTopo + k, escuro); }
      } else if (d < 0.5) {
        t.vline(meio, yTopo - 22, 22, escuro);
        t.hline(meio - 5, yTopo - 18, 11, escuro);
        t.hline(meio - 3, yTopo - 13, 7, escuro);
      }
    }, { out: 'ink1' });

    if (a < 1) { /* profundidade fica por conta da cor escolhida */ }
    x += w + gap;
  }
}

// Chão: faixa de luz na quebra, corpo em degradê, sulcos horizontais,
// rachaduras e pedras contornadas.
function ground(c, r, { y = GROUND_Y, topo, corpo, escuro, pedras = [] }) {
  const T = P(topo), D = P(escuro);
  c.rect(0, y, c.w, 3, T);
  c.grad(0, y + 3, c.w, c.h - y - 3, topo, corpo);
  // sulcos: textura em faixas, dá leitura de superfície em vez de granulado
  for (let j = y + 6; j < c.h; j += 7) {
    const off = ((j - y) * 13) % 11;
    for (let x = off; x < c.w; x += 19) { c.px(x, j, D, 0.45); c.px(x + 1, j, D, 0.3); }
  }
  for (let i = 0; i < 16; i++) {
    let cx = ri(r, 0, c.w - 1), cy = ri(r, y + 6, c.h - 2);
    for (let j = 0; j < ri(r, 12, 38); j++) {
      c.px(cx, cy, D, 0.75);
      cx += ri(r, -1, 1); cy += r() < 0.74 ? 0 : 1;
      if (cy >= c.h) break;
    }
  }
  const cores = pedras.length ? pedras : [escuro];
  for (let i = 0; i < 30; i++) {
    const px = ri(r, 2, c.w - 10), py = ri(r, y + 8, c.h - 5);
    const pw = ri(r, 3, 8), ph = ri(r, 2, 4), cor = pick(r, cores);
    c.ellipse(px, py + 2, pw, Math.max(1, ph - 1), D, 0.5);   // sombra projetada
    stamp(c, px - pw - 1, py - ph - 1, pw * 2 + 3, ph * 2 + 3, (t) => {
      t.ellipse(pw + 1, ph + 1, pw, ph, P(cor));
      t.ellipse(pw, ph, Math.max(1, pw - 2), Math.max(1, ph - 1), shade(P(cor), 0.22));
    }, { out: 'ink1' });
  }
}

// Névoa em faixas. As pontas afinam até sumir, senão a faixa lê como um
// risco de caneta atravessando a cena em vez de ar parado.
function fogBands(c, r, { y0, y1, cor, a = 0.2, n = 6 }) {
  const K = P(cor);
  for (let i = 0; i < n; i++) {
    const y = ri(r, y0, y1), w = ri(r, 90, Math.round(c.w * 0.7)), x = ri(r, -30, c.w - 40);
    const alt = r() < 0.55 ? 2 : 3;
    for (let j = 0; j < alt; j++)
      for (let k = 0; k < w; k++) {
        const t = k / w;
        // densidade em sino: cheia no meio, rala nas pontas
        const forca = Math.sin(t * Math.PI) * (1 - j / alt);
        if (dither(forca * 0.85, x + k, y + j)) c.px(x + k, y + j, K, a);
      }
  }
}

// Feixes de luz saindo de um ponto. Bordas pontilhadas, não esfumadas.
function godRays(c, { cx, cy, n = 7, len = 260, cor = 'our4', a = 0.12, abre = 0.55 }) {
  const K = P(cor);
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (i - (n - 1) / 2) * (abre / n);
    for (let d = 0; d < len; d++) {
      const lx = Math.round(cx + Math.cos(ang) * d), ly = Math.round(cy + Math.sin(ang) * d);
      const largura = 1 + Math.round(d / 44);
      const forca = 1 - d / len;
      for (let k = -largura; k <= largura; k++)
        if (dither(forca * 0.8, lx + k, ly)) c.px(lx + k, ly, K, a);
    }
  }
}

// Bando distante em V.
function birds(c, r, { x, y, n = 3, cor = 'ink2' }) {
  const K = P(cor);
  for (let i = 0; i < n; i++) {
    const bx = x + i * ri(r, 18, 32), by = y + ri(r, -14, 14);
    c.px(bx, by, K); c.px(bx - 1, by - 1, K); c.px(bx - 2, by - 1, K);
    c.px(bx + 1, by - 1, K); c.px(bx + 2, by - 1, K);
    if (r() < 0.4) { c.px(bx - 3, by, K); c.px(bx + 3, by, K); }
  }
}

// Tufos de mato na linha do chão, com lâmina curva e ponta clara.
function tufts(c, r, { y, n, ramp, alt = [5, 13] }) {
  const [d, m, l] = ramp;
  for (let i = 0; i < n; i++) {
    const x = ri(r, 0, c.w - 1), h = ri(r, alt[0], alt[1]);
    const lam = ri(r, 2, 4);
    for (let k = 0; k < lam; k++) {
      const dir = k % 2 ? 1 : -1, curva = 0.1 + r() * 0.3;
      const hh = h - k * 2;
      for (let j = 0; j < hh; j++) {
        const dx = Math.round(dir * curva * j);
        c.px(x + dx + k, y - j, P(j > hh - 3 ? l : j > hh / 2 ? m : d));
      }
    }
  }
}

// Poça: água chapada, aro claro, reflexo invertido pontilhado.
function puddle(c, cx, cy, rx, ry, corAgua, corAro) {
  c.ellipse(cx, cy, rx, ry, P(corAgua));
  for (let x = -rx; x <= rx; x++) {
    const dy = Math.round(ry * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx))));
    c.px(cx + x, cy - dy, P(corAro));
  }
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
    if ((x * x) / (rx * rx) + (y * y) / (ry * ry) > 1) continue;
    if (!dither(0.4, cx + x, cy + y)) continue;
    const origem = c.get(cx + x, cy - Math.abs(y) * 2 - ry);
    if (origem[3] > 0) c.px(cx + x, cy + y, [origem[0], origem[1], origem[2]], 0.4);
  }
}

// ═════════════════════════════════════════════════════════
// PROPS
// ═════════════════════════════════════════════════════════
function drawSprite(c, map, pal, x, y, flip = false) {
  for (let j = 0; j < map.length; j++) {
    const row = map[j];
    for (let i = 0; i < row.length; i++) {
      const ch = row[flip ? row.length - 1 - i : i];
      if (ch === '.' || !pal[ch]) continue;
      c.px(x + i, y + j, P(pal[ch]));
    }
  }
}

// Torre eólica: mastro cônico, nacele com volume, três pás.
function windmill(c, x, y, h, { corpo = 'ped3', escuro = 'ped1', pa = 'ped4' } = {}) {
  stamp(c, x - 40, y - h - 40, 80, h + 46, (t) => {
    const ox = 40, oy = h + 40;
    for (let j = 0; j < h; j++) {
      const w = 3 + Math.floor((j / h) * 7);
      const bx = ox - Math.floor(w / 2);
      t.rect(bx, oy - h + j, w, 1, P(corpo));
      t.px(bx, oy - h + j, P(escuro));
      t.px(bx + w - 1, oy - h + j, P(escuro));
      t.px(bx + 1, oy - h + j, P('ped4'));
    }
    const ny = oy - h - 4;
    t.rect(ox - 7, ny - 5, 15, 11, P(corpo));
    t.rect(ox - 7, ny - 5, 5, 11, P('ped4'));
    t.rect(ox + 4, ny - 5, 4, 11, P(escuro));
    for (const [dx, dy] of [[0, -1], [0.88, 0.5], [-0.88, 0.5]]) {
      for (let i = 5; i < 33; i++) {
        const larg = i < 13 ? 1 : 2;
        for (let k = 0; k < larg; k++)
          t.px(ox + Math.round(dx * i) + (dx ? 0 : k), ny + Math.round(dy * i) + (dx ? k : 0), P(i > 25 ? escuro : pa));
      }
    }
    t.ellipse(ox, ny, 2, 2, P('ped4'));
  }, { out: 'ink1' });
}

// Barracão: parede ondulada, telhado em duas águas com beiral, janela
// acesa com moldura. O aconchego do jogo mora aqui.
function shack(c, x, y, w, h, { parede = 'mad2', telhado = 'lar1', escuro = 'mad0', luz = 'our3', on = true } = {}) {
  const beiral = 8, alturaTelh = 15;
  stamp(c, x - beiral - 1, y - alturaTelh - 4, w + beiral * 2 + 2, h + alturaTelh + 6, (t) => {
    const ox = beiral + 1, oy = alturaTelh + 4;
    t.grad(ox, oy, w, h, parede, escuro);
    for (let i = 0; i < w; i += 8) {
      t.vline(ox + i, oy, h, P(escuro), 0.45);
      t.vline(ox + i + 1, oy, h, P(shade(P(parede), 0.2)), 0.4);
    }
    // telhado
    for (let i = -beiral; i < w + beiral; i++) {
      const p = Math.min(i + beiral, w + beiral - i) / ((w + beiral * 2) / 2);
      const ry = oy - 2 - Math.round(Math.max(0, p) * alturaTelh);
      for (let yy = ry; yy < oy + 2; yy++) t.px(ox + i, yy, P(telhado));
      t.px(ox + i, ry, P(shade(P(telhado), 0.3)));
      t.px(ox + i, ry + 1, P(shade(P(telhado), 0.12)));
      if (i % 6 === 0) for (let yy = ry + 2; yy < oy + 2; yy++) t.px(ox + i, yy, P(shade(P(telhado), -0.25)));
    }
    // janela
    const jw = Math.max(13, Math.round(w * 0.3)), jh = Math.max(11, Math.round(h * 0.34));
    const jx = ox + Math.floor((w - jw) / 2), jy = oy + Math.floor(h * 0.28);
    t.rect(jx, jy, jw, jh, P(on ? luz : 'ink1'));
    if (on) {
      t.rect(jx, jy, jw, 3, P('our4'));
      t.hline(jx, jy + Math.floor(jh / 2), jw, P('our1'));
      t.vline(jx + Math.floor(jw / 2), jy, jh, P('our1'));
    }
    t.outlineRect(jx - 1, jy - 1, jw + 2, jh + 2, P('mad0'));
    // porta
    const pw = Math.max(11, Math.round(w * 0.2)), ph = Math.round(h * 0.5);
    const px = ox + w - pw - 6, py = oy + h - ph;
    t.grad(px, py, pw, ph, 'mad1', 'mad0');
    t.outlineRect(px, py, pw, ph, P('mad0'));
    t.px(px + 2, py + Math.floor(ph / 2), P('our2'));
  }, { out: 'ink1' });
  if (on) glow(c, x + Math.round(w / 2), y + Math.round(h * 0.4), 34, 28, luz, [0.16, 0.1, 0.05]);
}

// Árvore morta: tronco retorcido e galhos finos. Silhueta, sem folha.
function deadTree(c, x, y, h, cor = 'ink1') {
  stamp(c, x - 30, y - h - 6, 60, h + 8, (t) => {
    const r = rng(x * 31 + h);
    const ox = 30, oy = h + 6;
    let curva = 0;
    for (let j = 0; j < h; j++) {
      curva += (r() - 0.5) * 0.22;
      curva = Math.max(-4, Math.min(4, curva));
      const w = Math.max(2, Math.round(5 - (j / h) * 3));
      const bx = ox + Math.round(curva) - Math.floor(w / 2);
      t.rect(bx, oy - j, w, 1, P(cor));
      t.px(bx, oy - j, P(shade(P(cor), 0.18)));
    }
    for (let b = 0; b < 7; b++) {
      const by = oy - ri(r, Math.round(h * 0.4), h - 3);
      const dir = r() < 0.5 ? -1 : 1, len = ri(r, 10, 26);
      for (let i = 0; i < len; i++) {
        const yy = by - Math.round(i * 0.75 + Math.sin(i * 0.3) * 2);
        t.px(ox + dir * i, yy, P(cor));
        if (i < len * 0.45) t.px(ox + dir * i, yy - 1, P(cor));
      }
    }
  }, { out: 'ink0' });
}

// Arbusto: copa pequena rente ao chão.
function bush(c, x, y, w, h, ramp = ['ver0', 'ver1', 'ver3', 'ver4']) {
  copa(c, x, y - Math.round(h * 0.4), w, h, ramp, x + y);
}

// Poste com luminária e halo em anéis.
function lamp(c, x, y, h, { poste = 'ped1', luz = 'our3' } = {}) {
  stamp(c, x - 4, y - h - 12, 30, h + 14, (t) => {
    const ox = 4, oy = h + 12;
    t.rect(ox - 1, oy - h, 4, h, P(poste));
    t.vline(ox - 1, oy - h, h, P('ped3'));
    t.vline(ox + 2, oy - h, h, P('ped0'));
    for (let i = 0; i < 16; i++) t.px(ox + 3 + i, oy - h - Math.round(Math.sqrt(i) * 2.1), P(poste));
    t.rect(ox + 14, oy - h - 8, 10, 6, P(poste));
    t.hline(ox + 14, oy - h - 8, 10, P('ped3'));
    t.rect(ox + 15, oy - h - 2, 8, 3, P(luz));
  }, { out: 'ink1' });
  glow(c, x + 19, y - h + 2, 44, 40, luz, [0.3, 0.18, 0.09, 0.04]);
}

// Carcaça de carro: capô, cabine, vidro estilhaçado, ferrugem em manchas.
function carWreck(c, x, y, { corpo = 'rub1', escuro = 'rub0', vidro = 'ped2' } = {}) {
  stamp(c, x - 2, y - 34, 84, 40, (t) => {
    const r = rng(x * 7 + 11);
    const ox = 2, oy = 34;
    t.grad(ox, oy - 18, 78, 18, corpo, escuro);
    t.rect(ox + 18, oy - 30, 39, 13, P(corpo));
    t.rect(ox + 18, oy - 30, 39, 3, P(shade(P(corpo), 0.22)));
    t.rect(ox + 22, oy - 27, 31, 8, P(vidro));
    t.rect(ox + 22, oy - 27, 31, 2, P(shade(P(vidro), 0.3)));
    for (let i = 0; i < 8; i++) {
      const sx = ri(r, 24, 50);
      for (let k = 0; k < ri(r, 3, 7); k++) t.px(ox + sx + k, oy - 26 + Math.round(k * 0.6), P('ink1'));
    }
    t.hline(ox, oy - 18, 78, P(shade(P(corpo), 0.25)));
    // ferrugem em manchas, não em chuvisco
    for (let i = 0; i < 7; i++) t.ellipse(ox + ri(r, 4, 72), oy - ri(r, 3, 15), ri(r, 2, 5), ri(r, 1, 3), P('lar1'), 0.8);
    t.ellipse(ox + 16, oy, 9, 5, P('ink1'));
    t.ellipse(ox + 60, oy, 9, 5, P('ink1'));
    t.ellipse(ox + 16, oy - 1, 5, 3, P('ped0'));
    t.ellipse(ox + 60, oy - 1, 5, 3, P('ped0'));
  }, { out: 'ink0' });
}

// Tambor: aros, marca e tampo elíptico.
function barrel(c, x, y, { corpo = 'mus1', aro = 'mus0', marca = 'mus3' } = {}) {
  stamp(c, x - 2, y - 34, 28, 36, (t) => {
    const ox = 2, oy = 34;
    t.grad(ox, oy - 30, 24, 30, corpo, shade(P(corpo), -0.35));
    t.rect(ox, oy - 30, 5, 30, P(shade(P(corpo), 0.2)));
    t.hline(ox, oy - 24, 24, P(aro)); t.hline(ox, oy - 23, 24, P(shade(P(aro), 0.2)));
    t.hline(ox, oy - 11, 24, P(aro)); t.hline(ox, oy - 10, 24, P(shade(P(aro), 0.2)));
    t.ellipse(ox + 12, oy - 30, 12, 4, P(shade(P(corpo), 0.25)));
    t.ellipse(ox + 12, oy - 30, 9, 2, P(corpo));
    t.rect(ox + 8, oy - 21, 9, 8, P(marca));
    t.rect(ox + 10, oy - 19, 5, 4, P('ink1'));
  }, { out: 'ink1' });
}

// Fogueira: brasa, chama em três valores, halo quente. O centro cozy.
function campfire(c, x, y, { lenha = 'mad1', chama = 'lar2', quente = 'our3', nucleo = 'our4' } = {}) {
  glow(c, x, y - 10, 52, 30, 'lar2', [0.28, 0.16, 0.08, 0.04]);
  stamp(c, x - 22, y - 38, 44, 42, (t) => {
    const ox = 22, oy = 38;
    for (let i = 0; i < 5; i++) {
      const dx = -15 + i * 7;
      t.rect(ox + dx, oy - 4, 11, 4, P(lenha));
      t.hline(ox + dx, oy - 4, 11, P('mad3'));
      t.px(ox + dx, oy - 3, P('mad0'));
    }
    t.ellipse(ox, oy - 5, 10, 3, P('lar0'));
    t.ellipse(ox, oy - 16, 8, 13, P(chama));
    t.ellipse(ox - 1, oy - 18, 5, 9, P(quente));
    t.ellipse(ox - 1, oy - 20, 2, 5, P(nucleo));
    t.ellipse(ox + 3, oy - 28, 2, 4, P(chama));
    t.ellipse(ox - 3, oy - 33, 1, 2, P(quente));
  }, { out: 'ink0' });
}

// Fileira de canteiro: caixa de madeira com plantas individuais.
function greenhouseRow(c, x, y, w, { caixa = 'mad2', folha = 'ver3', fundo = 'ver1' } = {}) {
  stamp(c, x - 1, y - 34, w + 2, 36, (t) => {
    const r = rng(x + w);
    const ox = 1, oy = 34;
    t.grad(ox, oy - 10, w, 10, caixa, shade(P(caixa), -0.35));
    t.hline(ox, oy - 10, w, P('mad4'));
    for (let i = 0; i < w; i += 13) t.vline(ox + i, oy - 10, 10, P('mad0'), 0.5);
    t.hline(ox, oy - 11, w, P('mad0'));
    for (let i = 6; i < w - 5; i += 15) {
      const alt = ri(r, 12, 20);
      t.vline(ox + i, oy - 11 - alt, alt, P(fundo));
      t.vline(ox + i + 1, oy - 11 - alt, alt, P('ver0'));
      for (let f = 3; f < alt; f += 4) {
        const lado = f % 8 === 3 ? 1 : -1;
        const lf = ri(r, 4, 7);
        for (let k = 1; k <= lf; k++) {
          t.px(ox + i + lado * k, oy - 11 - f - Math.round(k * 0.4), P(k > lf - 2 ? fundo : folha));
          if (k < lf - 1) t.px(ox + i + lado * k, oy - 10 - f - Math.round(k * 0.4), P('ver0'));
        }
      }
      t.px(ox + i, oy - 11 - alt, P('ver4'));
    }
  }, { out: 'ink1' });
}

// Lâmpada de cultivo com cone de luz pontilhado.
function growLamp(c, x, y, { braco = 'ped1', bulbo = 'our4', feixe = 'our3' } = {}) {
  stamp(c, x - 16, y - 2, 34, 14, (t) => {
    t.rect(2, 2, 29, 4, P(braco));
    t.hline(2, 2, 29, P('ped3'));
    t.rect(6, 6, 21, 6, P(bulbo));
    t.rect(6, 6, 21, 2, P('cre3'));
  }, { out: 'ink1' });
  const K = P(feixe);
  for (let i = 1; i < 96; i++) {
    const abre = Math.round(i * 0.62), forca = 1 - i / 110;
    for (let k = -abre; k < 21 + abre; k++)
      if (dither(forca * 0.35, x - 10 + k, y + 12 + i)) c.px(x - 10 + k, y + 12 + i, K, 0.18);
  }
}

// Crosta de vegetação subindo por superfícies, com esporos brilhando.
function crust(c, r, { x, y, w, h, escuro = 'ver0', meio = 'ver1', esporo = 'ver4', densidade = 0.6 }) {
  const D = P(escuro), M = P(meio), S = P(esporo);
  for (let i = 0; i < w; i++) {
    const cx = x + i;
    const hh = Math.max(0, Math.round(h * (0.42 + 0.58 * Math.abs(Math.sin(cx * 0.11) * Math.cos(cx * 0.037)))));
    for (let j = 0; j < hh; j++) {
      const cy = y - j, t = j / Math.max(1, hh);
      if (r() > densidade + (1 - t) * 0.34) continue;
      c.px(cx, cy, t > 0.7 ? M : D);
      if (t > 0.85 && r() < 0.1) c.px(cx, cy, S);
    }
  }
}

// ═════════════════════════════════════════════════════════
// PROTAGONISTA
//
// 42x62, contornada, quatro valores por peça de roupa. Capuz, máscara
// com lente acesa, casaco comprido, mochila e botas.
// ═════════════════════════════════════════════════════════
function survivorFrame(c, respira) {
  const dy = respira;
  stamp(c, 0, 0, 42, 62, (t) => {
    // mochila atrás do ombro, encostando no casaco para não ler solta
    t.rect(6, 24 + dy, 12, 19, P('mad1'));
    t.rect(6, 24 + dy, 3, 19, P('mad3'));
    t.hline(6, 24 + dy, 12, P('mad3'));
    t.hline(6, 32 + dy, 12, P('mad0'));
    t.rect(8, 34 + dy, 7, 5, P('mad2'));
    t.px(9, 36 + dy, P('our2'));

    // capuz
    t.ellipse(24, 15 + dy, 11, 10, P('ver1'));
    t.ellipse(22, 12 + dy, 8, 7, P('ver2'));
    t.ellipse(20, 10 + dy, 5, 4, P('ver3'));
    t.ellipse(25, 19 + dy, 10, 6, P('ver0'));

    // máscara com lente acesa
    t.rect(18, 14 + dy, 14, 10, P('ped4'));
    t.rect(18, 14 + dy, 14, 3, P('cre3'));
    t.rect(19, 17 + dy, 12, 5, P('cia1'));
    t.rect(19, 17 + dy, 12, 2, P('cia3'));
    t.px(29, 18 + dy, P('cia4')); t.px(30, 18 + dy, P('cia4'));
    t.rect(18, 23 + dy, 14, 2, P('ped1'));

    // casaco
    t.grad(14, 25 + dy, 21, 22, 'ver2', 'ver1');
    t.rect(14, 25 + dy, 4, 22, P('ver3'));
    t.rect(31, 25 + dy, 4, 22, P('ver0'));
    t.hline(14, 25 + dy, 21, P('ver3'));
    t.vline(24, 27 + dy, 19, P('ver0'));
    t.hline(14, 35 + dy, 21, P('ver0'));
    t.hline(14, 36 + dy, 21, P('ver3'), 0.5);
    // fivela
    t.rect(22, 35 + dy, 5, 3, P('our2'));

    // pernas e botas
    t.rect(17, 47 + dy, 7, 10, P('ink3'));
    t.rect(17, 47 + dy, 2, 10, P('rox0'));
    t.rect(26, 47 + dy, 7, 10, P('ink3'));
    t.rect(26, 47 + dy, 2, 10, P('rox0'));
    t.rect(16, 57 + dy, 9, 4, P('ink2'));
    t.rect(25, 57 + dy, 9, 4, P('ink2'));
    t.hline(16, 57 + dy, 9, P('ink3'));
    t.hline(25, 57 + dy, 9, P('ink3'));
  }, { out: 'ink0' });
}

// ═════════════════════════════════════════════════════════
// CENÁRIOS EM CAMADAS
//
// Cada cena vira várias PNG com transparência. Camadas com `vel` > 0
// rolam em loop (o número é o tempo em segundos para dar uma volta), e é
// a diferença entre essas velocidades que produz o parallax. Essas
// camadas são desenhadas em cilindro (wrap) para emendarem sem costura.
//
// `fx` liga uma animação por CSS: balanço de folhagem, brilho pulsante,
// tremeluzir de luz de emergência.
// ═════════════════════════════════════════════════════════
const SCENES = {};

function cena(seed, defs) {
  return defs.map(([nome, vel, fx, desenha], i) => {
    const c = new Canvas(W, H, vel > 0);
    desenha(c, rng(seed + i * 131));
    return { nome, vel, fx, canvas: c };
  });
}

// rampas reutilizadas
const FOLHA_VIVA = ['ver0', 'ver1', 'ver3', 'ver4'];
const FOLHA_ESCURA = ['ink1', 'ver0', 'ver1', 'ver2'];
const FOLHA_SECA = ['mus0', 'mus1', 'mus2', 'mus3'];
const MADEIRA = ['mad0', 'mad2', 'mad3'];
const MADEIRA_ESCURA = ['ink1', 'mad1', 'mad2'];

// 1. Abrigo 7 — banco de sementes (interior, sem rolagem)
SCENES.bunker = () => cena(101, [
  ['bg', 0, null, (c, r) => {
    c.grad(0, 0, W, GROUND_Y, 'ped1', 'ped0');
    // blocos de concreto com junta funda
    for (let y = 0; y < GROUND_Y; y += 26)
      for (let x = (y / 26) % 2 ? -38 : 0; x < W; x += 76) {
        c.grad(x, y, 74, 24, 'ped2', 'ped1');
        c.hline(x, y, 74, P('ped3'));
        c.outlineRect(x, y, 74, 24, P('ink2'));
        // desgaste no canto do bloco
        if ((x + y) % 3 === 0) { c.px(x + 3, y + 21, P('ink2')); c.px(x + 4, y + 22, P('ink2')); }
      }
    // manchas de umidade descendo da laje
    for (let i = 0; i < 14; i++) {
      const x = ri(r, 0, W - 1), h = ri(r, 34, 120);
      for (let j = 0; j < h; j++) if (dither(0.6, x, j)) c.px(x + ri(r, -1, 1), j, P('ink2'), 0.4);
    }
    // dutos no teto
    c.rect(0, 14, W, 12, P('ped1'));
    c.hline(0, 14, W, P('ped3')); c.hline(0, 15, W, P('ped2'));
    c.hline(0, 25, W, P('ink2'));
    for (let x = 24; x < W; x += 80) {
      stamp(c, x, 8, 12, 22, (t) => { t.grad(0, 0, 12, 22, 'ped2', 'ped0'); t.vline(0, 0, 22, P('ped3')); }, { out: 'ink1' });
    }
    ground(c, r, { y: GROUND_Y, topo: 'ped3', corpo: 'ped1', escuro: 'ink2', pedras: ['ped0', 'ped2'] });
  }],
  ['mid', 0, null, (c, r) => {
    // escotilha com escada
    c.rect(384, 46, 94, 206, P('ink1'));
    c.outlineRect(384, 46, 94, 206, P('ink0'));
    c.grad(396, 58, 70, 182, 'ped1', 'ink2');
    for (let y = 72; y < 238; y += 22) {
      stamp(c, 406, y, 48, 6, (t) => { t.rect(0, 0, 48, 6, P('ped3')); t.hline(0, 0, 48, P('ped4')); }, { out: 'ink1' });
    }
    c.rect(402, 58, 6, 182, P('ped3')); c.vline(402, 58, 182, P('ped4'));
    c.rect(452, 58, 6, 182, P('ped2')); c.vline(457, 58, 182, P('ink2'));

    // estante do banco de sementes: potes em toda a rampa de cor
    const SEED = ['our3', 'ver3', 'lar2', 'cia3', 'our2', 'azu3', 'rox2', 'ros2', 'mus3'];
    stamp(c, 18, 124, 194, 128, (t) => {
      t.grad(0, 0, 194, 128, 'mad2', 'mad1');
      for (let i = 0; i < 194; i += 11) t.vline(i, 0, 128, P('mad0'), 0.3);
      t.hline(0, 0, 194, P('mad3'));
      t.vline(0, 0, 128, P('mad3'));
      t.vline(193, 0, 128, P('mad0'));
    }, { out: 'ink0' });
    for (let row = 0; row < 4; row++) {
      const sy = 132 + row * 30;
      // prateleira
      stamp(c, 20, sy + 24, 190, 6, (t) => { t.rect(0, 0, 190, 6, P('mad3')); t.hline(0, 0, 190, P('mad4')); t.hline(0, 5, 190, P('mad0')); }, { out: 'ink1' });
      for (let i = 0; i < 11; i++) {
        const jx = 25 + i * 16, cor = SEED[(row * 4 + i) % SEED.length];
        stamp(c, jx, sy + 2, 12, 23, (t) => {
          t.grad(0, 3, 12, 21, 'ped4', 'ped2');       // vidro
          t.rect(2, 10, 8, 13, P(cor));               // sementes
          t.rect(2, 10, 8, 3, P(shade(P(cor), 0.3)));
          t.rect(1, 0, 10, 4, P('cre1'));             // tampa de pano
          t.hline(1, 0, 10, P('cre3'));
          t.vline(2, 5, 18, P('bra'), 0.5);           // reflexo no vidro
        }, { out: 'ink0' });
      }
    }
    // etiquetas manuscritas
    for (let i = 0; i < 4; i++) {
      const ey = 152 + i * 30;
      c.rect(28, ey, 36, 5, P('cre2'));
      c.hline(28, ey, 36, P('cre3'));
      for (let k = 30; k < 62; k += 4) c.px(k, ey + 2, P('ink2'));
    }
  }],
  ['fx', 0, 'flicker', (c) => {
    glow(c, 92, 44, 90, 90, 'rub2', [0.16, 0.09, 0.05, 0.02]);
    stamp(c, 80, 30, 26, 22, (t) => {
      t.rect(4, 6, 18, 14, P('rub2'));
      t.rect(4, 6, 18, 4, P('rub3'));
      t.rect(0, 0, 26, 6, P('ped1'));
      t.hline(0, 0, 26, P('ped3'));
    }, { out: 'ink0' });
  }],
]);

// 2. Ruínas da cidade — hora dourada
SCENES.ruins = () => cena(202, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['azu2', 'azu3', 'cre0', 'cre1', 'our4'], 0, H);
    sunDisc(c, 446, 62, 17, 'cre3', 'our3', 'bra');
    godRays(c, { cx: 446, cy: 62, n: 6, len: 220, cor: 'our4', a: 0.1, abre: 1.1 });
    clouds(c, r, { n: 6, yMin: 26, yMax: 100, corpo: 'cre1', sombra: 'cre0', luz: 'cre3' });
    birds(c, r, { x: 120, y: 78, n: 4, cor: 'mad1' });
  }],
  ['far', 300, null, (c, r) => {
    cityscape(c, r, { baseY: GROUND_Y, cor: 'ped2', minH: 80, maxH: 150, minW: 40, maxW: 78, janelas: { cor: 'ped1', passoY: 16, passoX: 14 } });
  }],
  ['mid', 150, null, (c, r) => {
    cityscape(c, r, { baseY: GROUND_Y, cor: 'mad1', minH: 52, maxH: 124, minW: 34, maxW: 70, janelas: { cor: 'mad0', acesa: 'our2', acende: 0.06 } });
    fogBands(c, r, { y0: 172, y1: 244, cor: 'cre2', a: 0.2, n: 9 });
  }],
  ['near', 72, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'cre0', corpo: 'mad2', escuro: 'mad0', pedras: ['mad1', 'cre1', 'ped2'] });
    for (let i = 0; i < 9; i++) {
      const x = ri(r, 0, W - 40), y = ri(r, GROUND_Y + 8, H - 16);
      const w = ri(r, 16, 36), h = ri(r, 8, 15);
      stamp(c, x, y, w, h, (t) => { t.grad(0, 0, w, h, 'ped2', 'ped0'); t.hline(0, 0, w, P('ped4')); }, { out: 'ink1' });
    }
    carWreck(c, 34, GROUND_Y + 28, { corpo: 'lar1', escuro: 'lar0', vidro: 'cia0' });
    tufts(c, r, { y: GROUND_Y + 6, n: 30, ramp: ['mus0', 'mus1', 'mus2'], alt: [5, 14] });
    bush(c, 476, GROUND_Y + 20, 22, 12, FOLHA_SECA);
  }],
]);

// 3. Zona industrial contaminada — verde ácido
SCENES.toxic = () => cena(303, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['ink1', 'mus0', 'mus1', 'mus2', 'mus4'], 0, H);
    godRays(c, { cx: 270, cy: 252, n: 9, len: 240, cor: 'mus4', a: 0.1, abre: 2.2 });
    fogBands(c, r, { y0: 122, y1: 204, cor: 'mus4', a: 0.16, n: 12 });
  }],
  ['far', 320, null, (c, r) => {
    // chaminés primeiro: assim a colina cobre a base delas e elas ficam
    // atrás da paisagem em vez de flutuarem sobre ela
    for (let i = 0; i < 4; i++) {
      const x = 60 + i * 130, h = ri(r, 74, 120);
      stamp(c, x, GROUND_Y - 14 - h, 15, h + 14, (t) => {
        t.grad(0, 0, 15, h + 14, 'ink2', 'ink1');
        t.vline(0, 0, h + 14, P('mus0'));
        t.hline(0, 0, 15, P('mus1'));
        for (let y = 8; y < h; y += 15) t.hline(0, y, 15, P('ink0'), 0.6);
      }, { out: 'ink0' });
    }
    hills(c, r, { baseY: GROUND_Y - 22, amp: 42, cor: 'ver0', luz: 'mus0', copas: FOLHA_ESCURA });
  }],
  ['mid', 160, null, (c, r) => {
    hills(c, r, { baseY: GROUND_Y + 4, amp: 26, cor: 'ink1', luz: 'ver0' });
    for (let i = 0; i < 11; i++) deadTree(c, 24 + i * 52 + ri(r, -16, 16), GROUND_Y + 4, ri(r, 56, 108), 'ink0');
  }],
  ['near', 80, null, (c, r) => {
    // chão bem mais escuro que o clarão do céu: sem isso a silhueta some
    ground(c, r, { y: GROUND_Y, topo: 'mus1', corpo: 'ink1', escuro: 'ink0', pedras: ['ink0', 'mus0'] });
    tufts(c, r, { y: GROUND_Y + 4, n: 32, ramp: ['ink1', 'mus0', 'mus1'], alt: [5, 16] });
    barrel(c, 62, GROUND_Y + 32);
    barrel(c, 94, GROUND_Y + 27, { corpo: 'mus0', aro: 'ink1', marca: 'mus2' });
    barrel(c, 420, GROUND_Y + 34);
    puddle(c, 262, GROUND_Y + 33, 54, 10, 'mus1', 'mus3');
    // pontos de esporo pairando
    for (let i = 0; i < 26; i++) c.px(ri(r, 0, W - 1), ri(r, 180, H - 6), P('mus4'), r() < 0.5 ? 0.4 : 1);
  }],
]);

// 4. A amendoeira (transpiração) — dia claro
SCENES.arvore = () => cena(404, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['azu1', 'azu2', 'azu3', 'azu4', 'cre2'], 0, H);
    sunDisc(c, 92, 52, 19, 'cre3', 'our4', 'bra');
    godRays(c, { cx: 92, cy: 52, n: 7, len: 260, cor: 'our4', a: 0.09, abre: 1.3 });
    clouds(c, r, { n: 5, yMin: 30, yMax: 104, corpo: 'cre2', sombra: 'azu4', luz: 'bra' });
    birds(c, r, { x: 300, y: 60, n: 4, cor: 'azu1' });
  }],
  ['far', 300, null, (c, r) => {
    cityscape(c, r, { baseY: GROUND_Y - 10, cor: 'ped3', minH: 46, maxH: 104, minW: 42, maxW: 80, janelas: { cor: 'ped2', passoY: 18 } });
    hills(c, r, { baseY: GROUND_Y - 4, amp: 16, cor: 'ver1', luz: 'ver2', copas: ['ver0', 'ver1', 'ver2', 'ver3'] });
  }],
  ['mid', 0, 'sway', (c, r) => {
    const tx = 352;
    arvore(c, tx, GROUND_Y, 96, 62, 36, FOLHA_VIVA, MADEIRA, 3);
    copa(c, tx - 50, GROUND_Y - 102, 38, 23, FOLHA_VIVA, 9);
    copa(c, tx + 50, GROUND_Y - 96, 34, 21, FOLHA_VIVA, 12);
    // segunda árvore, menor, para a composição não pender só de um lado
    arvore(c, 126, GROUND_Y, 56, 38, 23, FOLHA_VIVA, MADEIRA, 21);
    copa(c, 98, GROUND_Y - 66, 22, 14, FOLHA_VIVA, 33);
    // o saco plástico amarrado, com gotas condensadas
    stamp(c, tx + 24, GROUND_Y - 90, 32, 38, (t) => {
      t.rect(2, 4, 27, 31, P('cia4'), 0.5);
      t.outlineRect(2, 4, 27, 31, P('cia3'));
      t.rect(5, 27, 21, 7, P('cia2'), 0.85);
      t.hline(5, 27, 21, P('cia3'));
      const rv = rng(5);
      for (let i = 0; i < 18; i++) t.px(4 + ri(rv, 0, 23), 6 + ri(rv, 0, 24), P('cia4'));
      t.rect(0, 0, 32, 4, P('cre1'));                 // barbante
      t.hline(0, 0, 32, P('cre3'));
    }, { out: 'ink1' });
  }],
  ['near', 80, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'cre1', corpo: 'mad2', escuro: 'mad0', pedras: ['mad1', 'ped2', 'cre0'] });
    tufts(c, r, { y: GROUND_Y + 4, n: 60, ramp: ['ver0', 'ver1', 'ver3'], alt: [5, 17] });
    for (let i = 0; i < 7; i++) {
      const x = ri(r, 0, W - 30), y = ri(r, GROUND_Y + 12, H - 14);
      const w = ri(r, 14, 28), h = ri(r, 6, 11);
      stamp(c, x, y, w, h, (t) => { t.grad(0, 0, w, h, 'ped3', 'ped1'); t.hline(0, 0, w, P('ped4')); }, { out: 'ink1' });
    }
    // asfalto rachado pela raiz
    for (let i = 0; i < 6; i++) {
      let cx = 300 + ri(r, -70, 70), cy = GROUND_Y + ri(r, 2, 10);
      for (let j = 0; j < 42; j++) { c.px(cx, cy, P('ink2'), 0.7); cx += ri(r, -2, 2); cy += r() < 0.6 ? 0 : 1; }
    }
    bush(c, 40, GROUND_Y + 26, 26, 14, FOLHA_VIVA);
  }],
]);

// 5. Posto de gasolina ao entardecer
SCENES.station = () => cena(505, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['ink2', 'rox0', 'ros0', 'lar1', 'lar3'], 0, H);
    stars(c, r, 70, 88);
    sunDisc(c, 74, 158, 22, 'our4', 'lar3', 'cre3');
    godRays(c, { cx: 74, cy: 158, n: 7, len: 210, cor: 'lar3', a: 0.1, abre: 1.4 });
    clouds(c, r, { n: 5, yMin: 40, yMax: 122, corpo: 'ros1', sombra: 'rox0', luz: 'ros2' });
  }],
  ['far', 300, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y, cor: 'ink2', minH: 46, maxH: 110, minW: 36, maxW: 76, janelas: { cor: 'ink1', acesa: 'our3', acende: 0.09 } })],
  ['mid', 0, null, (c, r) => {
    // loja do posto, primeiro: dá massa embaixo da cobertura para ela não
    // ficar boiando no céu
    stamp(c, 396, 168, 128, 84, (t) => {
      t.grad(0, 6, 128, 78, 'ped1', 'ink2');
      for (let x = 4; x < 126; x += 16) t.vline(x, 8, 74, P('ink1'), 0.4);
      // telhado em vermelho profundo: se ficar laranja, funde com a
      // testeira da cobertura e com a placa numa mancha só
      t.grad(0, 0, 128, 8, 'rub1', 'rub0');
      t.hline(0, 0, 128, P('rub2'));
      // vitrine com o pouco de luz que sobrou
      t.rect(12, 22, 46, 30, P('ink0'));
      t.rect(14, 24, 42, 26, P('rox0'), 0.7);
      t.outlineRect(11, 21, 48, 32, P('ped0'));
      t.rect(74, 30, 26, 54, P('ink0'));
      t.outlineRect(73, 29, 28, 55, P('ped0'));
      t.px(78, 56, P('our2'));
    }, { out: 'ink0' });
    // colunas, depois cobertura por cima: a ordem faz a estrutura encaixar
    for (const px of [286, 386]) {
      stamp(c, px, 150, 15, 102, (t) => {
        t.grad(0, 0, 15, 102, 'ped2', 'ink2');
        t.vline(0, 0, 102, P('ped3'));
        t.vline(14, 0, 102, P('ink1'));
        t.rect(-3, 96, 21, 6, P('ped1'));
      }, { out: 'ink0' });
    }
    stamp(c, 262, 128, 200, 28, (t) => {
      t.grad(0, 0, 200, 17, 'ped3', 'ped1');
      t.hline(0, 0, 200, P('ped4'));
      t.rect(0, 17, 200, 6, P('lar1'));
      t.hline(0, 17, 200, P('lar2'));
      t.rect(0, 23, 200, 5, P('ink1'));      // sombra da própria cobertura
    }, { out: 'ink0' });
    // bomba de combustível, embaixo da cobertura
    stamp(c, 320, 194, 32, 58, (t) => {
      t.grad(0, 0, 32, 58, 'ped2', 'ped0');
      t.vline(0, 0, 58, P('ped3'));
      t.rect(5, 10, 20, 14, P('our3'));
      t.rect(5, 10, 20, 4, P('our4'));
      t.outlineRect(4, 9, 22, 16, P('ink1'));
      t.rect(6, 32, 18, 3, P('ink1'));
      t.rect(6, 39, 12, 3, P('ink1'));
      t.rect(26, 14, 5, 22, P('ped0'));
    }, { out: 'ink0' });
    // placa da rua, torta
    stamp(c, 118, 150, 9, 102, (t) => { t.rect(0, 0, 9, 102, P('ped1')); t.vline(0, 0, 102, P('ped3')); }, { out: 'ink0' });
    stamp(c, 88, 132, 68, 32, (t) => {
      t.grad(0, 0, 68, 32, 'lar2', 'lar1');
      t.hline(0, 0, 68, P('lar3'));
      t.rect(7, 9, 54, 7, P('cre2'));
      t.rect(7, 20, 36, 5, P('cre1'));
    }, { out: 'ink0' });
  }],
  ['fx', 0, 'glow', (c) => lamp(c, 168, GROUND_Y, 104)],
  ['near', 80, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'rox0', corpo: 'ink2', escuro: 'ink0', pedras: ['ink1', 'rox0'] });
    carWreck(c, 44, GROUND_Y + 28, { corpo: 'rox1', escuro: 'ink2', vidro: 'ped1' });
    tufts(c, r, { y: GROUND_Y + 5, n: 24, ramp: ['ink1', 'mus0', 'mus1'], alt: [4, 12] });
  }],
]);

// 6. O Cercado à noite — a cena mais aconchegante do jogo
SCENES.settlement = () => cena(606, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['ink0', 'ink2', 'rox0', 'ros0', 'lar1'], 0, H);
    stars(c, r, 140, 130);
    clouds(c, r, { n: 4, yMin: 40, yMax: 112, corpo: 'rox0', sombra: 'ink2', luz: 'rox1' });
  }],
  ['far', 320, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 6, amp: 32, cor: 'ink1', luz: 'ink3', copas: ['ink0', 'ink1', 'ink2', 'ink3'] })],
  ['mid', 0, null, (c, r) => {
    // muralha de chapas costuradas
    c.grad(0, 176, W, 76, 'ped1', 'ink2');
    for (let x = 0; x < W; x += 22) {
      const desl = (x % 4) * 2;
      c.vline(x, 172 + desl, 82, P('ped2'));
      c.vline(x + 1, 172 + desl, 82, P('ink1'));
      c.hline(x, 172 + desl, 22, P('ped3'), 0.7);
      c.px(x + 10, 192, P('ped4')); c.px(x + 10, 228, P('ped4'));
      // remendo de ferrugem
      if ((x / 22) % 3 === 0) c.ellipse(x + 12, ri(r, 190, 240), 5, 3, P('lar1'), 0.7);
    }
    c.hline(0, 176, W, P('ped3'));
    shack(c, 56, 140, 84, 64, { on: true });
    shack(c, 342, 152, 70, 52, { parede: 'mad1', telhado: 'rub1', on: true });
    windmill(c, 246, 72, 98);
    // estufa do assentamento
    stamp(c, 434, 166, 90, 50, (t) => {
      t.grad(0, 0, 90, 50, 'cia0', 'ink2');
      for (let x = 4; x < 88; x += 15) t.vline(x, 2, 46, P('cia2'), 0.5);
      for (let y = 8; y < 48; y += 14) t.hline(2, y, 86, P('cia2'), 0.35);
      t.hline(0, 0, 90, P('cia3'));
    }, { out: 'ink0' });
  }],
  ['fx', 0, 'glow', (c) => {
    for (const [x, y] of [[86, 166], [366, 174]]) glow(c, x + 11, y + 8, 40, 34, 'our3', [0.3, 0.18, 0.09, 0.04]);
    glow(c, 479, 190, 62, 36, 'cia3', [0.2, 0.12, 0.06, 0.03]);
    for (let x = 438; x < 522; x += 15) c.vline(x, 168, 46, P('cia3'), 0.4);
  }],
  ['near', 78, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'rox0', corpo: 'ink2', escuro: 'ink0', pedras: ['ink1', 'rox0'] });
    campfire(c, 196, GROUND_Y + 28);
    tufts(c, r, { y: GROUND_Y + 4, n: 22, ramp: ['ink1', 'ink3', 'rox0'], alt: [4, 11] });
    // vaga-lumes: o toque aconchegante
    for (let i = 0; i < 14; i++) {
      const x = ri(r, 0, W - 1), y = ri(r, 190, H - 10);
      c.px(x, y, P('our4'));
      glow(c, x, y, 4, 4, 'our3', [0.28, 0.12]);
    }
  }],
]);

// 7. Estufa (interior) — vidro, luz quente e verde vivo
SCENES.greenhouse = () => cena(707, [
  ['bg', 0, null, (c, r) => {
    c.grad(0, 0, W, GROUND_Y, 'cia0', 'ink2');
    for (let x = 0; x < W; x += 50) {
      c.grad(x, 0, 48, GROUND_Y, 'cia1', 'cia0');
      c.vline(x + 48, 0, GROUND_Y, P('ink2'));
      c.vline(x + 49, 0, GROUND_Y, P('ink1'));
      c.vline(x + 1, 0, GROUND_Y, P('cia2'), 0.4);
    }
    for (let y = 0; y < GROUND_Y; y += 56) {
      c.hline(0, y, W, P('ink1'));
      c.hline(0, y + 1, W, P('cia2'), 0.45);
    }
    // condensação escorrendo pelo plástico
    for (let i = 0; i < 70; i++) {
      const x = ri(r, 0, W - 1), y0 = ri(r, 0, 160), h = ri(r, 16, 64);
      for (let j = 0; j < h; j++) if (dither(0.55, x, y0 + j)) c.px(x, y0 + j, P('cia3'), 0.3);
      c.px(x, y0 + h, P('cia4'), 0.7);
    }
    // vigas do teto
    c.rect(0, 0, W, 13, P('ink1'));
    c.hline(0, 13, W, P('cia1'));
    for (let x = 12; x < W; x += 60) {
      stamp(c, x, 0, 8, 26, (t) => { t.grad(0, 0, 8, 26, 'ped2', 'ped0'); t.vline(0, 0, 26, P('ped3')); }, { out: 'ink0' });
    }
    ground(c, r, { y: GROUND_Y, topo: 'mad3', corpo: 'mad1', escuro: 'mad0', pedras: ['mad0', 'mad2'] });
  }],
  ['fx', 0, 'glow', (c) => { growLamp(c, 100, 18); growLamp(c, 270, 18); growLamp(c, 440, 18); }],
  ['mid', 0, 'sway', (c) => {
    greenhouseRow(c, 18, 170, 162);
    greenhouseRow(c, 190, 170, 158);
    greenhouseRow(c, 358, 170, 164);
    greenhouseRow(c, 34, GROUND_Y + 2, 216, { caixa: 'mad1', folha: 'ver4', fundo: 'ver2' });
    greenhouseRow(c, 282, GROUND_Y + 2, 224, { caixa: 'mad1', folha: 'ver4', fundo: 'ver2' });
    // trepadeiras descendo da estrutura, para o ar não ficar vazio
    const rv = rng(77);
    for (let x = 16; x < W; x += ri(rv, 28, 58)) {
      const h = ri(rv, 26, 80);
      for (let j = 0; j < h; j++) {
        const dx = Math.round(Math.sin(j * 0.18) * 3);
        c.px(x + dx, 13 + j, P('ver1'));
        c.px(x + dx + 1, 13 + j, P('ver0'));
        if (j % 7 === 3) {
          c.px(x + dx + 3, 13 + j, P('ver3')); c.px(x + dx + 2, 12 + j, P('ver2'));
          c.px(x + dx - 2, 13 + j, P('ver3')); c.px(x + dx - 1, 12 + j, P('ver2'));
        }
      }
      c.px(x + Math.round(Math.sin(h * 0.18) * 3), 13 + h, P('ver4'));
    }
  }],
]);

// 8. Ermo à noite — azul profundo e lua
SCENES.wasteland = () => cena(808, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['ink0', 'azu0', 'azu1', 'rox0'], 0, H);
    stars(c, r, 210, 172);
    glow(c, 438, 60, 84, 84, 'azu4', [0.18, 0.1, 0.05, 0.02]);
    stamp(c, 412, 34, 52, 52, (t) => {
      t.ellipse(26, 26, 25, 25, P('cre2'));
      t.ellipse(23, 22, 21, 21, P('cre3'));
      const rv = rng(9);
      for (let i = 0; i < 9; i++) t.ellipse(26 + ri(rv, -16, 16), 26 + ri(rv, -16, 16), ri(rv, 2, 5), ri(rv, 2, 4), P('cre1'));
      t.ellipse(18, 17, 8, 7, P('bra'));
    }, { out: 'ink1' });
  }],
  ['far', 340, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 12, amp: 44, cor: 'azu0', luz: 'azu1' })],
  ['mid', 170, null, (c, r) => {
    hills(c, r, { baseY: GROUND_Y, amp: 22, cor: 'ink1', luz: 'azu0' });
    for (let i = 0; i < 5; i++) deadTree(c, 70 + i * 118, GROUND_Y, ri(r, 46, 80), 'ink0');
  }],
  ['near', 85, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'azu1', corpo: 'ink1', escuro: 'ink0', pedras: ['ink0', 'azu0', 'ink2'] });
    tufts(c, r, { y: GROUND_Y + 4, n: 18, ramp: ['ink0', 'ink2', 'azu0'], alt: [4, 11] });
  }],
]);

// 9. Amanhecer sobre o assentamento — o mais quente do jogo
SCENES.dawn = () => cena(909, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['azu1', 'azu2', 'ros1', 'lar3', 'our3', 'our4'], 0, H);
    sunDisc(c, 384, 172, 28, 'cre3', 'our4', 'bra');
    godRays(c, { cx: 384, cy: 172, n: 8, len: 240, cor: 'our4', a: 0.11, abre: 1.6 });
    clouds(c, r, { n: 6, yMin: 30, yMax: 122, corpo: 'lar4', sombra: 'ros1', luz: 'cre3' });
    birds(c, r, { x: 140, y: 70, n: 5, cor: 'mad1' });
  }],
  ['far', 300, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 14, amp: 30, cor: 'ver1', luz: 'ver2', copas: ['ver0', 'ver1', 'ver2', 'ver3'] })],
  ['mid', 0, null, (c) => {
    shack(c, 62, 156, 86, 64, { parede: 'mad3', telhado: 'lar2', on: true });
    shack(c, 176, 176, 64, 46, { parede: 'mad2', telhado: 'rub1', on: true });
    windmill(c, 470, 80, 98, { pa: 'cre3' });
  }],
  ['near', 70, 'sway', (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'ver4', corpo: 'ver2', escuro: 'ver0', pedras: ['ver1', 'mad2'] });
    tufts(c, r, { y: GROUND_Y + 4, n: 96, ramp: ['ver1', 'ver3', 'ver4'], alt: [6, 19] });
    bush(c, 486, GROUND_Y + 16, 40, 21, FOLHA_VIVA);
    bush(c, 26, GROUND_Y + 24, 30, 17, FOLHA_VIVA);
    // florzinhas no capim
    for (let i = 0; i < 22; i++) {
      const x = ri(r, 0, W - 1), y = ri(r, GROUND_Y + 6, H - 8);
      c.px(x, y, P(pick(r, ['our3', 'ros2', 'cre3'])));
    }
  }],
]);

// 10. Ruínas sombrias — índigo
SCENES.bleak = () => cena(1010, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['ink0', 'azu0', 'azu1', 'rox0'], 0, H);
    stars(c, r, 96, 120, 'azu4');
    glow(c, 120, 70, 70, 70, 'azu3', [0.14, 0.08, 0.04]);
    c.ellipse(120, 70, 22, 22, P('ped3'));
    c.ellipse(117, 66, 18, 18, P('ped4'));
    fogBands(c, r, { y0: 92, y1: 172, cor: 'azu2', a: 0.14, n: 8 });
  }],
  ['far', 320, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y, cor: 'azu0', minH: 70, maxH: 150, minW: 34, maxW: 70 })],
  ['mid', 160, null, (c, r) => {
    cityscape(c, r, { baseY: GROUND_Y, cor: 'ink1', minH: 44, maxH: 108, minW: 38, maxW: 74, janelas: { cor: 'ink0', acesa: 'azu3', acende: 0.03 } });
    fogBands(c, r, { y0: 182, y1: 248, cor: 'azu2', a: 0.16, n: 8 });
  }],
  ['near', 82, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'azu1', corpo: 'ink1', escuro: 'ink0', pedras: ['ink0', 'ink2'] });
    tufts(c, r, { y: GROUND_Y + 4, n: 14, ramp: ['ink0', 'ink2', 'azu0'], alt: [3, 9] });
  }],
]);

// 11. Abrigo solitário — violeta com fogo
SCENES.lone = () => cena(1111, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['ink1', 'ink3', 'rox0', 'ros0', 'lar1'], 0, H);
    stars(c, r, 62, 84);
    clouds(c, r, { n: 4, yMin: 40, yMax: 112, corpo: 'rox0', sombra: 'ink2', luz: 'ros1' });
  }],
  ['far', 300, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y, cor: 'ink2', minH: 48, maxH: 116, minW: 36, maxW: 74 })],
  ['mid', 0, null, (c, r) => {
    // galpão de chapas
    stamp(c, 154, 148, 148, 104, (t) => {
      t.grad(12, 14, 132, 90, 'ped1', 'ink2');
      for (let x = 14; x < 144; x += 18) { t.vline(x, 16, 86, P('ped2'), 0.7); t.vline(x + 1, 16, 86, P('ink1'), 0.5); }
      const rv = rng(3);
      for (let i = 0; i < 9; i++) t.ellipse(ri(rv, 20, 138), ri(rv, 22, 96), ri(rv, 3, 7), ri(rv, 2, 4), P('lar1'), 0.55);
      // telhado saliente
      t.grad(0, 0, 148, 15, 'lar1', 'lar0');
      t.hline(0, 0, 148, P('lar2'));
      // porta escura
      t.rect(52, 56, 36, 48, P('ink0'));
      t.outlineRect(50, 54, 40, 50, P('ped0'));
    }, { out: 'ink0' });
  }],
  ['near', 80, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'rox0', corpo: 'ink2', escuro: 'ink0', pedras: ['ink1', 'rox0'] });
    campfire(c, 372, GROUND_Y + 26);
    tufts(c, r, { y: GROUND_Y + 4, n: 20, ramp: ['ink1', 'ink3', 'rox0'], alt: [4, 11] });
  }],
]);

// 12. A Mancha tomando as ruínas — bioluminescência
SCENES.mancha = () => cena(1313, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['ink0', 'ink2', 'rox0', 'ros0', 'lar1'], 0, H);
    stars(c, r, 50, 74);
    clouds(c, r, { n: 4, yMin: 34, yMax: 106, corpo: 'rox0', sombra: 'ink1', luz: 'ros1' });
  }],
  ['far', 300, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y, cor: 'ink2', minH: 72, maxH: 140, minW: 36, maxW: 72 })],
  ['mid', 150, 'sway', (c, r) => {
    cityscape(c, r, { baseY: GROUND_Y, cor: 'ink1', minH: 44, maxH: 100, minW: 34, maxW: 66 });
    crust(c, r, { x: 0, y: GROUND_Y, w: W, h: 86, densidade: 0.64 });
  }],
  ['near', 70, 'sway', (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'ver1', corpo: 'ver0', escuro: 'ink0', pedras: ['ink1', 'ver1'] });
    // touceiras altas com caule, folhas e ponta luminosa
    for (let i = 0; i < 60; i++) {
      const x = ri(r, 4, W - 5), base = ri(r, GROUND_Y + 2, GROUND_Y + 30), alt = ri(r, 18, 44);
      const caule = r() < 0.5 ? 'ver1' : 'ver0';
      for (let j = 0; j < alt; j++) {
        const dx = Math.round(Math.sin(j * 0.15) * 2.6);
        c.px(x + dx, base - j, P(caule));
        c.px(x + dx + 1, base - j, P('ink1'));
      }
      for (let f = 5; f < alt; f += 8) {
        const y = base - f, lado = f % 16 === 5 ? 1 : -1;
        const folha = r() < 0.4 ? 'ver3' : 'ver2';
        const lf = ri(r, 5, 12);
        for (let k = 1; k <= lf; k++) {
          c.px(x + lado * k, y - Math.round(k * 0.5), P(folha));
          if (k < lf - 2) c.px(x + lado * k, y - Math.round(k * 0.5) + 1, P('ver0'));
        }
      }
      c.px(x, base - alt, P('ver4'));
      glow(c, x, base - alt, 4, 4, 'ver4', [0.3, 0.12]);
    }
    // esporos pairando
    for (let i = 0; i < 60; i++) c.px(ri(r, 0, W - 1), ri(r, 122, H - 1), P('ver4'), r() < 0.5 ? 0.4 : 1);
  }],
]);

// 13. Campo de girassóis — o desfecho luminoso
SCENES.campo = () => cena(1414, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['azu1', 'azu2', 'azu3', 'azu4', 'cre2'], 0, H);
    sunDisc(c, 118, 60, 32, 'cre3', 'our4', 'bra');
    godRays(c, { cx: 118, cy: 60, n: 8, len: 270, cor: 'our4', a: 0.1, abre: 1.5 });
    clouds(c, r, { n: 7, yMin: 26, yMax: 120, corpo: 'bra', sombra: 'azu4', luz: 'bra' });
    birds(c, r, { x: 330, y: 66, n: 5, cor: 'azu1' });
  }],
  ['far', 300, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 22, amp: 26, cor: 'ver2', luz: 'ver3', copas: ['ver0', 'ver1', 'ver2', 'ver3'] })],
  ['mid', 150, 'sway', (c, r) => {
    for (let x = 4; x < W; x += 18) {
      const alt = ri(r, 30, 46), base = GROUND_Y - 4;
      stamp(c, x - 12, base - alt - 18, 24, alt + 20, (t) => {
        const ox = 12, oy = alt + 18;
        t.vline(ox, oy - alt, alt, P('ver2'));
        t.vline(ox + 1, oy - alt, alt, P('ver1'));
        t.ellipse(ox, oy - alt - 7, 9, 8, P('our3'));
        for (let p = 0; p < 10; p++) {
          const ang = (p / 10) * Math.PI * 2;
          t.ellipse(ox + Math.round(Math.cos(ang) * 9), oy - alt - 7 + Math.round(Math.sin(ang) * 8), 2, 2, P('our4'));
        }
        t.ellipse(ox, oy - alt - 7, 4, 4, P('mad1'));
      }, { out: 'ink1' });
    }
  }],
  ['near', 68, 'sway', (c, r) => {
    ground(c, r, { y: GROUND_Y, topo: 'ver4', corpo: 'ver2', escuro: 'ver0', pedras: ['ver1', 'mad2'] });
    tufts(c, r, { y: GROUND_Y + 6, n: 76, ramp: ['ver1', 'ver3', 'ver4'], alt: [6, 17] });
    for (let x = -10; x < W + 24; x += 34) {
      const alt = ri(r, 56, 80), base = GROUND_Y + ri(r, 14, 34);
      // caule com folhas
      stamp(c, x - 20, base - alt - 4, 46, alt + 6, (t) => {
        const ox = 20, oy = alt + 4;
        t.rect(ox, oy - alt, 5, alt, P('ver1'));
        t.vline(ox, oy - alt, alt, P('ver2'));
        t.vline(ox + 4, oy - alt, alt, P('ver0'));
        for (let f = 12; f < alt; f += 18) {
          const lado = f % 36 === 12 ? 1 : -1;
          for (let k = 1; k <= 15; k++) {
            const yy = oy - f - Math.round(k * 0.55);
            t.px(ox + 2 + lado * k, yy, P('ver2'));
            t.px(ox + 2 + lado * k, yy + 1, P('ver1'));
            if (k < 9) t.px(ox + 2 + lado * k, yy - 1, P('ver3'));
          }
        }
      }, { out: 'ink1' });
      // flor: duas fileiras de pétalas e miolo texturizado
      const fx = x + 2, fy = base - alt - 10;
      stamp(c, fx - 30, fy - 28, 60, 56, (t) => {
        const ox = 30, oy = 28;
        for (let p = 0; p < 16; p++) {
          const ang = (p / 16) * Math.PI * 2;
          t.ellipse(ox + Math.round(Math.cos(ang) * 22), oy + Math.round(Math.sin(ang) * 20), 6, 5, P('our2'));
        }
        for (let p = 0; p < 16; p++) {
          const ang = (p / 16) * Math.PI * 2 + 0.19;
          t.ellipse(ox + Math.round(Math.cos(ang) * 17), oy + Math.round(Math.sin(ang) * 15), 5, 5, P('our3'));
          t.ellipse(ox + Math.round(Math.cos(ang) * 17), oy + Math.round(Math.sin(ang) * 15) - 1, 3, 2, P('our4'));
        }
        t.ellipse(ox, oy, 14, 12, P('mad1'));
        t.ellipse(ox - 1, oy - 1, 12, 10, P('mad0'));
        const rv = rng(fx);
        for (let i = 0; i < 70; i++) {
          const px = ox + ri(rv, -10, 10), py = oy + ri(rv, -8, 8);
          t.px(px, py, P(rv() < 0.5 ? 'mad1' : 'mad2'));
        }
        t.ellipse(ox - 5, oy - 4, 4, 3, P('mad3'), 0.6);
      }, { out: 'ink1' });
    }
  }],
]);

// 14. Tela inicial — panorama
SCENES.hero = () => {
  const HH = 450, gy = 384;
  const mk = (vel, fx, desenha, i) => {
    const c = new Canvas(W, HH, vel > 0);
    desenha(c, rng(1212 + i * 91));
    return { nome: ['sky', 'far', 'mid', 'near'][i], vel, fx, canvas: c };
  };
  return [
    mk(0, null, (c, r) => {
      sky(c, ['ink0', 'ink3', 'rox1', 'ros1', 'lar2', 'our3'], 0, gy);
      stars(c, r, 200, 150);
      // o sol precisa nascer acima da linha dos telhados, senão o skyline
      // engole ele inteiro
      sunDisc(c, 300, 236, 44, 'our4', 'lar3', 'cre3');
      godRays(c, { cx: 300, cy: 236, n: 9, len: 320, cor: 'lar3', a: 0.09, abre: 1.8 });
      clouds(c, r, { n: 9, yMin: 60, yMax: 200, corpo: 'ros1', sombra: 'rox0', luz: 'ros2', minW: 80, maxW: 180 });
      birds(c, r, { x: 380, y: 130, n: 6, cor: 'ink2' });
    }, 0),
    mk(340, null, (c, r) => cityscape(c, r, { baseY: gy, cor: 'rox0', minH: 100, maxH: 190, minW: 42, maxW: 84 }), 1),
    mk(170, null, (c, r) => {
      cityscape(c, r, { baseY: gy, cor: 'ink2', minH: 66, maxH: 158, minW: 34, maxW: 70, janelas: { cor: 'ink1', acesa: 'our3', acende: 0.2 } });
      // névoa rente ao chão: mais alto que isso ela vira risco atravessando
      // as fachadas
      fogBands(c, r, { y0: 356, y1: 380, cor: 'lar3', a: 0.1, n: 4 });
    }, 2),
    mk(85, null, (c, r) => {
      ground(c, r, { y: gy, topo: 'rox0', corpo: 'ink2', escuro: 'ink0', pedras: ['ink1', 'rox0', 'ink3'] });
      deadTree(c, 72, gy, 80, 'ink0');
      carWreck(c, 396, gy + 32, { corpo: 'rox1', escuro: 'ink2', vidro: 'ped1' });
      tufts(c, r, { y: gy + 6, n: 32, ramp: ['ink1', 'ink3', 'rox0'], alt: [5, 15] });
    }, 3),
  ];
};

// ═════════════════════════════════════════════════════════
// ÍCONES 16x16 — mesma paleta dos cenários, contorno em ink0.
// ═════════════════════════════════════════════════════════
const IPAL = {
  o: 'ink0',
  // ração (pão)
  a: 'mad3', A: 'mad4', b: 'mad1',
  // água (frasco)
  c: 'cia1', C: 'cia3', d: 'cia0', g: 'cia4',
  // saúde (kit médico)
  e: 'rub2', E: 'rub3', f: 'bra',
  // confiança (crachá)
  h: 'ver2', H: 'ver4', i: 'cre2',
  // radiação / fogo
  j: 'lar2', J: 'our3', k: 'lar1',
  // curativo
  l: 'cre1', L: 'cre3',
  // veneno
  m: 'mus2', M: 'mus0',
  // estrutura / metal
  n: 'ped2', N: 'ped4', p: 'ped1',
};

const ICONS = {
  bread: [
    '................', '................', '.....oooooo.....', '...ooAAAAAAoo...',
    '..oAAAAAAAAAAo..', '.oAAAaaaaaAAAAo.', '.oAAaaaaaaaAAAo.', '.oAaaaaaaaaaaAo.',
    '.oAaaaaaaaaaaAo.', '.oaaaaaaaaaaaao.', '.obaaaaaaaaaabo.', '.obbaaaaaaaabbo.',
    '..obbbbbbbbbbo..', '...oobbbbbboo...', '.....oooooo.....', '................',
  ],
  flask: [
    '................', '.....oooooo.....', '.....oggggo.....', '.....ogccgo.....',
    '.....occcco.....', '....occcccco....', '....occcccco....', '...occCCcccco...',
    '...ocCCcccccco..', '..occcccccccco..', '..occcccccccco..', '..ocdccccccdco..',
    '..occdddddddco..', '...occcccccco...', '....oooooooo....', '................',
  ],
  medkit: [
    '................', '..oooooooooooo..', '..oEEEEEEEEEEo..', '..oeeeeeeeeeeo..',
    '..oeeeffffeeeo..', '..oeeeffffeeeo..', '..oeffffffffeo..', '..oeffffffffeo..',
    '..oeffffffffeo..', '..oeeeffffeeeo..', '..oeeeffffeeeo..', '..oeeeeeeeeeeo..',
    '..oeeeeeeeeeeo..', '..oooooooooooo..', '................', '................',
  ],
  nametag: [
    '................', '................', '..oooooooooooo..', '..oiiiiiiiiiio..',
    '..oihhhhhhhhio..', '..oihHHHHHHhio..', '..oihhhhhhhhio..', '..oiiiiiiiiiio..',
    '..oihhhhhhhhio..', '..oihhhhhhhhio..', '..oiiiiiiiiiio..', '..oihhhhhhhhio..',
    '..oiiiiiiiiiio..', '..oooooooooooo..', '................', '................',
  ],
  ablaze: [
    '................', '.......oo.......', '......oJJo......', '.....oJJJJo.....',
    '.....oJJJJo.....', '....oJJjjJJo....', '....oJjjjjJo....', '...oJjjjjjjJo...',
    '...ojjjjjjjjo...', '..ojjjjJJjjjjo..', '..ojjjJJJJjjjo..', '..okjjJJJJjjko..',
    '..okkjjjjjjkko..', '...okkkjjkkko...', '....ookkkkoo....', '......oooo......',
  ],
  bandage: [
    '................', '................', '................', '..oooooooooooo..',
    '..ollllllllllo..', '..ollLLLLLLllo..', '..ollLoLLoLllo..', '..ollLLLLLLllo..',
    '..ollLoLLoLllo..', '..ollLLLLLLllo..', '..ollllllllllo..', '..oooooooooooo..',
    '................', '................', '................', '................',
  ],
  poison: [
    '................', '.....oooooo.....', '....oMMMMMMo....', '...oMmmmmmmMo...',
    '..oMmmmmmmmmMo..', '..oMmoommoommo..', '..oMmoommoommo..', '..oMmmmmmmmmMo..',
    '..oMmmmoommmMo..', '...oMmmmmmmMo...', '....oMmomomMo...', '.....oMmomoMo...',
    '.....oMMMMMMo...', '......oooooo....', '................', '................',
  ],
  gasmask: [
    '................', '................', '...oooooooooo...', '..oNNNNNNNNNNo..',
    '..oNppppppppNo..', '..oNpggppggpNo..', '..oNpggppggpNo..', '..oNppppppppNo..',
    '..oNpppoopppNo..', '..oNppppppppNo..', '...oNppppppNo...', '....oNppppNo....',
    '.....oNooNo.....', '......oooo......', '................', '................',
  ],
  sprout: [
    '................', '.....oo....oo...', '....oMMo..oMMo..', '...oMmmMooMmmMo.',
    '...oMmmmMMmmmMo.', '....oMmmmmmmMo..', '.....oMmmmmMo...', '......oMmmMo....',
    '.......omo......', '.......omo......', '.......omo......', '.....oooooooo...',
    '....obbbbbbbbo..', '....obbbbbbbbo..', '.....oooooooo...', '................',
  ],
  windmill: [
    '................', '.......oo.......', '......oNNo......', '.o....oNNo....o.',
    '.oNo..oNNo..oNo.', '..oNNooNNooNNo..', '...oNNNNNNNNo...', '.....oNNNNo.....',
    '......oppo......', '......oppo......', '......oppo......', '......oppo......',
    '.....opppo......', '....oppppppo....', '...oooooooooo...', '................',
  ],
  silo: [
    '................', '......oooo......', '....ooNNNNoo....', '...oNNNNNNNNo...',
    '..oNnnnnnnnnNo..', '..oNnnnnnnnnNo..', '..oNnnppppnnNo..', '..oNnnppppnnNo..',
    '..oNnnnnnnnnNo..', '..oNnnnnnnnnNo..', '..oNnnppppnnNo..', '..oNnnppppnnNo..',
    '..oNnnnnnnnnNo..', '..oNNNNNNNNNNo..', '..oooooooooooo..', '................',
  ],
  lamp: [
    '................', '.......oo.......', '......oppo......', '.....oppppo.....',
    '....oooooooo....', '...oJJJJJJJJo...', '...oJjjjjjjJo...', '...oJjjJJjjJo...',
    '...oJjjJJjjJo...', '...oJjjjjjjJo...', '...oJJJJJJJJo...', '....oooooooo....',
    '.....oppppo.....', '....oppppppo....', '....oooooooo....', '................',
  ],
  busstop: [
    '................', '..oooooooooooo..', '..oNNNNNNNNNNo..', '..oooooooooooo..',
    '...op......po...', '...op......po...', '...op......po...', '...op......po...',
    '...op..oo..po...', '...op.oNNo.po...', '...op.oNNo.po...', '...op.oNNo.po...',
    '...op.oNNo.po...', '..ooo.oooo.ooo..', '................', '................',
  ],
};

async function saveIcons() {
  const dir = 'public/assets/cinzas/icons';
  fs.rmSync(dir, { recursive: true, force: true });
  for (const [name, map] of Object.entries(ICONS)) {
    const c = new Canvas(16, 16);
    drawSprite(c, map, IPAL, 0, 0);
    await c.save(path.join(dir, `${name}.png`));
  }
  console.log(`✓ ${Object.keys(ICONS).length} ícones 16x16`);
}

// ── execução ─────────────────────────────────────────────
const args = process.argv.slice(2);
fs.rmSync(OUT, { recursive: true, force: true });

const manifesto = {};
for (const [chave, fn] of Object.entries(SCENES)) {
  const camadas = fn();
  for (const cam of camadas) await cam.canvas.save(path.join(OUT, chave, `${cam.nome}.png`));
  manifesto[chave] = camadas.map(cam => ({ n: cam.nome, v: cam.vel, fx: cam.fx ?? null }));
  const dir = path.join(OUT, chave);
  await sharp(path.join(dir, camadas[0].nome + '.png'))
    .composite(camadas.slice(1).map(cam => ({ input: path.join(dir, cam.nome + '.png') })))
    .png({ compressionLevel: 9, palette: true }).toFile(path.join(dir, 'flat.png'));
  console.log(`✓ ${chave.padEnd(11)} ${camadas.length} camadas  ${camadas.map(c => c.nome).join(' ')}`);
}
fs.writeFileSync(path.join(OUT, 'manifesto.json'), JSON.stringify(manifesto, null, 1));
fs.writeFileSync('src/game/artManifest.json', JSON.stringify(manifesto, null, 1));

for (const [nome, desloca] of [['survivor-1', 0], ['survivor-2', 1]]) {
  const c = new Canvas(42, 62);
  survivorFrame(c, desloca);
  await c.save(path.join(OUT, `${nome}.png`));
}
console.log('✓ survivor    2 quadros 42x62');

await saveIcons();
console.log(`✓ paleta      ${Object.keys(PAL).length} cores, ${ALFAS.length} níveis de alfa`);

if (args.includes('--sheet')) {
  const S = 3;
  const chaves = Object.keys(manifesto);
  const comps = [];
  const cw = W * S, chh = 150 * S, cols = 3;
  for (let i = 0; i < chaves.length; i++) {
    const camadas = manifesto[chaves[i]];
    const base = sharp(path.join(OUT, chaves[i], camadas[0].n + '.png'));
    const over = [];
    for (let j = 1; j < camadas.length; j++) over.push({ input: path.join(OUT, chaves[i], camadas[j].n + '.png') });
    const buf = await base.composite(over).png().toBuffer();
    const up = await sharp(buf).resize((await sharp(buf).metadata()).width * S, null, { kernel: 'nearest' }).toBuffer();
    comps.push({ input: up, left: (i % cols) * cw, top: Math.floor(i / cols) * chh });
  }
  const rows = Math.ceil(chaves.length / cols);
  await sharp({ create: { width: cw * cols, height: chh * rows, channels: 4, background: '#101014' } })
    .composite(comps).png().toFile('/tmp/cinzas-sheet.png');
  console.log('→ contato em /tmp/cinzas-sheet.png');
}

console.log(`\n${Object.keys(manifesto).length} cenas em camadas geradas em ${OUT}`);
