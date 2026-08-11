// ─────────────────────────────────────────────────────────
// Gerador de arte pixel de CINZAS.
//
// Desenha cada cenário pixel a pixel numa tela de 180x100 (2x = 360px,
// escala inteira na largura do painel do jogo) e grava PNGs em
// public/assets/cinzas/art/. Tudo é autoral e determinístico: o mesmo
// seed sempre produz a mesma imagem, então a arte fica versionada no
// repositório e não depende de nenhum pack externo.
//
//   node scripts/gen-art.mjs            gera a arte
//   node scripts/gen-art.mjs --sheet    gera também um contato 3x p/ revisão
// ─────────────────────────────────────────────────────────
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'public/assets/cinzas/art';
const W = 180, H = 100;
const GROUND_Y = 84;   // linha do chão, igual em todos os cenários

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

// dithering ordenado 4x4 (transições de céu com cara de pixel art)
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dither = (t, x, y) => t > (BAYER[y & 3][x & 3] + 0.5) / 16;

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
  rect(x, y, w, h, c, a = 1) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, a); }
  hline(x, y, w, c, a = 1) { this.rect(x, y, w, 1, c, a); }
  vline(x, y, h, c, a = 1) { this.rect(x, y, 1, h, c, a); }
  ellipse(cx, cy, rx, ry, c, a = 1) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) this.px(cx + x, cy + y, c, a);
  }
  // contorno em volta de tudo que já foi pintado numa faixa (dá leitura pixel art)
  outlineRect(x, y, w, h, c) {
    this.hline(x, y, w, c); this.hline(x, y + h - 1, w, c);
    this.vline(x, y, h, c); this.vline(x + w - 1, y, h, c);
  }
  async save(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await sharp(Buffer.from(this.d), { raw: { width: this.w, height: this.h, channels: 4 } })
      .png({ compressionLevel: 9, palette: true }).toFile(file);
  }
}

// ── céu com degradê pontilhado ───────────────────────────
function sky(c, stops, y0 = 0, y1 = c.h) {
  const cols = stops.map(s => hex(s));
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    const f = t * (cols.length - 1);
    const i = Math.min(cols.length - 2, Math.floor(f));
    const local = f - i;
    for (let x = 0; x < c.w; x++) c.px(x, y, dither(local, x, y) ? cols[i + 1] : cols[i]);
  }
}

function stars(c, r, n, yMax, col = '#ffffff') {
  const k = hex(col);
  for (let i = 0; i < n; i++) {
    const x = ri(r, 0, c.w - 1), y = ri(r, 0, yMax);
    c.px(x, y, k, r() < 0.4 ? 0.45 : 0.85);
  }
}

function sunDisc(c, cx, cy, rad, core, glow) {
  const g = hex(glow);
  for (let i = rad * 4; i > rad; i--) c.ellipse(cx, cy, i, i, g, 0.035);
  c.ellipse(cx, cy, rad, rad, hex(core));
}

// nuvens chapadas com topo claro e base sombreada
function clouds(c, r, { n, yMin, yMax, base = '#ffffff', dark = '#c9d8e6', minW = 14, maxW = 34, a = 1 }) {
  const B = hex(base), D = hex(dark);
  for (let i = 0; i < n; i++) {
    const cx = ri(r, -10, c.w + 10), cy = ri(r, yMin, yMax);
    const w = ri(r, minW, maxW), h = Math.max(3, Math.round(w * 0.22));
    const lobes = ri(r, 3, 5);
    for (let l = 0; l < lobes; l++) {
      const lx = cx - w / 2 + (w / (lobes - 1)) * l;
      const lr = ri(r, Math.max(3, h), h + 4);
      c.ellipse(Math.round(lx), cy, lr, Math.max(2, Math.round(lr * 0.62)), B, a);
    }
    c.rect(cx - w / 2, cy, w, Math.max(2, h - 1), B, a);
    for (let x = cx - w / 2; x < cx + w / 2; x++) c.px(x, cy + h - 1, D, a * 0.9);
  }
}

// silhueta de colinas
function hills(c, r, { baseY, amp, color, step = 7, a = 1 }) {
  const col = hex(color);
  let prev = baseY - ri(r, 0, amp);
  for (let x = 0; x <= c.w; x += step) {
    const next = baseY - ri(r, 0, amp);
    for (let i = 0; i < step && x + i < c.w; i++) {
      const y = Math.round(prev + (next - prev) * (i / step));
      for (let yy = y; yy < c.h; yy++) c.px(x + i, yy, col, a);
    }
    prev = next;
  }
}

// skyline de prédios, com janelas opcionais
function cityscape(c, r, { baseY, color, minH, maxH, minW = 8, maxW = 20, windows = null, a = 1, gap = 0 }) {
  const col = hex(color);
  let x = -ri(r, 0, 6);
  while (x < c.w) {
    const w = ri(r, minW, maxW), h = ri(r, minH, maxH);
    const top = baseY - h;
    c.rect(x, top, w, baseY - top, col, a);
    // detalhe de topo: caixa d'água / antena / recuo
    const d = r();
    if (d < 0.25) c.rect(x + Math.floor(w / 2) - 2, top - 4, 4, 4, col, a);
    else if (d < 0.4) c.vline(x + Math.floor(w / 2), top - 6, 6, col, a);
    if (windows) {
      const wc = hex(windows.color), lit = hex(windows.lit ?? windows.color);
      for (let wy = top + 3; wy < baseY - 3; wy += 5)
        for (let wx = x + 2; wx < x + w - 2; wx += 4)
          c.rect(wx, wy, 2, 2, r() < (windows.litChance ?? 0) ? lit : wc, a);
    }
    x += w + gap;
  }
}

// chão com textura e detritos
function ground(c, r, { y = GROUND_Y, top, body, dark, debris = [] }) {
  const T = hex(top), B = hex(body), D = hex(dark);
  c.hline(0, y, c.w, T);
  c.hline(0, y + 1, c.w, T);
  c.rect(0, y + 2, c.w, c.h - y - 2, B);
  for (let i = 0; i < 130; i++) {
    const x = ri(r, 0, c.w - 1), yy = ri(r, y + 2, c.h - 1);
    c.px(x, yy, r() < 0.5 ? D : shade(B, 0.06));
  }
  for (let i = 0; i < 18; i++) {
    const x = ri(r, 0, c.w - 3), yy = ri(r, y + 3, c.h - 2);
    c.rect(x, yy, ri(r, 1, 3), 1, hex(pick(r, debris.length ? debris : [dark])));
  }
}

function tint(c, x, y, w, h, color, a) { c.rect(x, y, w, h, hex(color), a); }

function vignette(c, strength = 0.35, color = '#000000') {
  const k = hex(color), cx = c.w / 2, cy = c.h / 2;
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const dx = (x - cx) / cx, dy = (y - cy) / cy;
    const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 1.25);
    if (d > 0.55) c.px(x, y, k, (d - 0.55) * strength);
  }
}

// névoa em faixas horizontais (pântano tóxico, poeira)
function fogBands(c, r, { y0, y1, color, a = 0.16, n = 5 }) {
  for (let i = 0; i < n; i++) {
    const y = ri(r, y0, y1), w = ri(r, 40, c.w), x = ri(r, -20, c.w - 10);
    c.rect(x, y, w, ri(r, 1, 3), hex(color), a);
  }
}

// ── props ────────────────────────────────────────────────
function drawSprite(c, map, pal, x, y, flip = false) {
  for (let j = 0; j < map.length; j++) {
    const row = map[j];
    for (let i = 0; i < row.length; i++) {
      const ch = row[flip ? row.length - 1 - i : i];
      if (ch === '.' || !pal[ch]) continue;
      c.px(x + i, y + j, hex(pal[ch]));
    }
  }
}

const P_OUT = '#171520';

function windmill(c, x, y, h, { body = '#8a93a8', dark = '#4a5266', blade = '#cfd8e6' } = {}) {
  const B = hex(body), D = hex(dark), L = hex(blade), O = hex(P_OUT);
  for (let j = 0; j < h; j++) {
    const w = 1 + Math.floor((j / h) * 3);
    c.rect(x - Math.floor(w / 2), y + j, w, 1, j % 4 === 0 ? D : B);
  }
  c.rect(x - 2, y - 3, 5, 4, B); c.outlineRect(x - 2, y - 3, 5, 4, O);
  // 3 pás
  const arms = [[0, -1], [1, 0.6], [-1, 0.6]];
  for (const [dx, dy] of arms) {
    for (let i = 2; i < 11; i++) c.px(x + Math.round(dx * i), y - 1 + Math.round(dy * i), L);
    for (let i = 6; i < 11; i++) c.px(x + Math.round(dx * i) + (dx ? 0 : 1), y - 1 + Math.round(dy * i) + (dx ? 1 : 0), L);
  }
}

function tank(c, x, y, w, h, { body = '#9aa3b5', dark = '#5b6478', rust = '#a8552a' } = {}) {
  const B = hex(body), D = hex(dark), R = hex(rust), O = hex(P_OUT);
  c.rect(x, y, w, h, B);
  for (let i = 0; i < w; i += 6) c.vline(x + i, y, h, D, 0.5);
  c.hline(x, y + Math.floor(h / 2), w, D, 0.7);
  for (let i = 0; i < 12; i++) c.px(x + ri(rng(x * 7 + i), 0, w - 1), y + ri(rng(y * 13 + i), 0, h - 1), R, 0.8);
  c.outlineRect(x, y, w, h, O);
  c.rect(x - 1, y - 2, w + 2, 2, D); c.outlineRect(x - 1, y - 2, w + 2, 2, O);
}

function shack(c, x, y, w, h, { wall = '#8a6a4a', roof = '#b5551e', dark = '#4a3524', lit = '#ffd98a', on = true } = {}) {
  const Wl = hex(wall), Rf = hex(roof), D = hex(dark), O = hex(P_OUT);
  c.rect(x, y, w, h, Wl);
  for (let i = 2; i < h; i += 3) c.hline(x, y + i, w, D, 0.35);
  // telhado inclinado
  for (let i = 0; i < w + 4; i++) {
    const ry = y - 1 - Math.round(Math.max(0, (Math.min(i, w + 4 - i) / (w / 2)) * 4));
    c.vline(x - 2 + i, ry, y - ry + 1, Rf);
  }
  c.outlineRect(x, y, w, h, O);
  // janela acesa
  const wx = x + Math.floor(w / 2) - 2, wy = y + Math.floor(h / 2) - 2;
  c.rect(wx, wy, 5, 4, on ? hex(lit) : D);
  c.outlineRect(wx, wy, 5, 4, O);
}

function deadTree(c, x, y, h, color = '#2a2430') {
  const K = hex(color);
  c.vline(x, y - h, h, K); c.vline(x + 1, y - h, h, K);
  const r = rng(x * 31 + h);
  for (let b = 0; b < 5; b++) {
    const by = y - h + ri(r, 1, Math.max(2, h - 4));
    const dir = r() < 0.5 ? -1 : 1, len = ri(r, 3, 7);
    for (let i = 0; i < len; i++) c.px(x + dir * i, by - Math.round(i * 0.7), K);
  }
}

function bush(c, x, y, w, h, { light = '#6ec850', mid = '#3fa34d', dark = '#1f6b39' } = {}) {
  const L = hex(light), M = hex(mid), D = hex(dark);
  c.ellipse(x, y, w, h, D);
  c.ellipse(x, y - 1, w - 1, h - 1, M);
  c.ellipse(x - Math.floor(w / 3), y - 2, Math.max(1, Math.floor(w / 2)), Math.max(1, h - 2), L);
  const r = rng(x * 17 + y);
  for (let i = 0; i < w; i++) c.px(x + ri(r, -w, w), y + ri(r, -h, h - 1), r() < 0.5 ? L : D, 0.5);
}

function lamp(c, x, y, h, { pole = '#4a5266', glow = '#ffcf6b' } = {}) {
  const P = hex(pole), G = hex(glow);
  c.vline(x, y - h, h, P);
  c.hline(x, y - h, 5, P);
  c.rect(x + 4, y - h + 1, 3, 2, G);
  for (let i = 10; i > 0; i--) c.ellipse(x + 5, y - h + 3, i, i, G, 0.028);
}

function carWreck(c, x, y, { body = '#7a3a3a', dark = '#3a1f22', glass = '#5c7a86' } = {}) {
  const B = hex(body), D = hex(dark), G = hex(glass), O = hex(P_OUT);
  c.rect(x, y - 6, 26, 6, B);
  c.rect(x + 6, y - 10, 13, 4, B);
  c.rect(x + 8, y - 9, 9, 2, G);
  c.outlineRect(x, y - 6, 26, 6, O);
  c.rect(x + 3, y, 5, 2, D); c.rect(x + 18, y, 5, 2, D);
  for (let i = 0; i < 10; i++) c.px(x + ri(rng(x + i), 0, 25), y - ri(rng(i * 3), 1, 5), D, 0.7);
}

function barrel(c, x, y, { body = '#5f7a3a', ring = '#33471f', mark = '#c8d84a' } = {}) {
  const B = hex(body), R = hex(ring), M = hex(mark), O = hex(P_OUT);
  c.rect(x, y - 10, 8, 10, B);
  c.hline(x, y - 8, 8, R); c.hline(x, y - 3, 8, R);
  c.rect(x + 3, y - 7, 2, 3, M);
  c.outlineRect(x, y - 10, 8, 10, O);
}

function campfire(c, x, y, { log = '#5a3a22', flame = '#ff9a3c', hot = '#ffe066', glow = '#ff7a2a' } = {}) {
  const L = hex(log), F = hex(flame), Hh = hex(hot), G = hex(glow);
  for (let i = 14; i > 0; i--) c.ellipse(x, y - 2, i, Math.max(1, Math.round(i * 0.6)), G, 0.03);
  c.rect(x - 5, y - 1, 11, 2, L);
  c.px(x - 4, y - 2, L); c.px(x + 4, y - 2, L);
  c.ellipse(x, y - 5, 3, 4, F);
  c.ellipse(x, y - 6, 2, 3, Hh);
  c.px(x, y - 10, F); c.px(x + 1, y - 9, Hh);
}

function greenhouseRow(c, x, y, w, { pot = '#6a4a32', leaf = '#5fc85a', deep = '#2f8a3f' } = {}) {
  const P = hex(pot), L = hex(leaf), D = hex(deep);
  c.rect(x, y - 3, w, 3, P);
  c.outlineRect(x, y - 3, w, 3, hex(P_OUT));
  for (let i = 2; i < w - 1; i += 5) {
    c.vline(x + i, y - 7, 4, D);
    c.px(x + i - 1, y - 8, L); c.px(x + i, y - 9, L); c.px(x + i + 1, y - 8, L);
    c.px(x + i - 2, y - 6, L); c.px(x + i + 2, y - 6, L);
  }
}

function growLamp(c, x, y, { arm = '#4a5266', bulb = '#ffe7a8', beam = '#ffd36b' } = {}) {
  const A = hex(arm), B = hex(bulb);
  c.hline(x - 4, y, 9, A);
  c.rect(x - 3, y + 1, 7, 2, B);
  for (let i = 1; i < 26; i++) {
    const spread = Math.round(i * 0.55);
    c.rect(x - 3 - spread, y + 3 + i, 7 + spread * 2, 1, hex(beam), 0.045);
  }
}

// crosta da Mancha: fungo preto-esverdeado subindo por superfícies,
// com esporos claros salpicados e um brilho fraco na base
function crust(c, r, { x, y, w, h, dark = '#122417', mid = '#1f4a2a', spore = '#7fe06a', density = 0.55 }) {
  const D = hex(dark), M = hex(mid), S = hex(spore);
  for (let i = 0; i < w; i++) {
    const cx = x + i;
    // altura irregular da crosta, mais alta na base
    const hh = Math.max(0, Math.round(h * (0.45 + 0.55 * Math.abs(Math.sin(cx * 0.37 + r() * 0.4)))));
    for (let j = 0; j < hh; j++) {
      const cy = y - j;
      const t = j / Math.max(1, hh);
      if (r() > density + (1 - t) * 0.35) continue;
      c.px(cx, cy, t > 0.72 ? M : D);
      if (r() < 0.05) c.px(cx, cy, S, 0.85);
    }
  }
}

// ── protagonista (18x22) ─────────────────────────────────
const SURVIVOR_PAL = {
  o: P_OUT, h: '#2f6b57', H: '#3f8a6d', c: '#3a7f66', C: '#4f9c7f',
  m: '#d8e4de', l: '#8ff0cf', p: '#39344f', b: '#241f30', k: '#20303f',
};
const SURVIVOR = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohHHHHHHho...',
  '...ohmmmmmmho...',
  '...ohmllllmho...',
  '...ohmmmmmmho...',
  '....ohhhhhho....',
  '...oocccccoo....',
  '..occCCCCCcco...',
  '.okcccCCCcccko..',
  '.okcccccccccko..',
  '.okcccccccccko..',
  '..occccccccco...',
  '..oocccccccoo...',
  '...opppppppo....',
  '...opppppppo....',
  '...oppo.oppo....',
  '...oppo.oppo....',
  '...obbo.obbo....',
  '...oooo.oooo....',
];

function survivor(c, x, y, { shadow = true } = {}) {
  if (shadow) c.ellipse(x + 8, y + 20, 7, 2, hex('#000000'), 0.28);
  drawSprite(c, SURVIVOR, SURVIVOR_PAL, x, y);
}

// ═════════════════════════════════════════════════════════
// CENÁRIOS EM CAMADAS
//
// Cada cena vira várias PNG com transparência. Camadas com `vel` > 0
// rolam em loop (o número é o tempo em segundos para dar uma volta), e é
// a diferença entre essas velocidades que produz o parallax: o fundo
// distante quase parado, o chão passando rápido. Essas camadas são
// desenhadas em cilindro (wrap) para emendarem nelas mesmas sem costura.
//
// `fx` liga uma animação por CSS na camada: balanço de folhagem, brilho
// pulsante de lâmpada, tremeluzir de luz de emergência.
// ═════════════════════════════════════════════════════════
const SCENES = {};

// [nome, velocidade em segundos (0 = parada), efeito, desenho]
function cena(seed, defs) {
  return defs.map(([nome, vel, fx, desenha], i) => {
    const c = new Canvas(W, H, vel > 0);
    desenha(c, rng(seed + i * 131));
    return { nome, vel, fx, canvas: c };
  });
}

// 1. Abrigo 7 — banco de sementes (interior, sem rolagem)
SCENES.bunker = () => cena(101, [
  ['bg', 0, null, (c, r) => {
    c.rect(0, 0, W, H, hex('#2b2f3d'));
    for (let y = 0; y < GROUND_Y; y += 8)
      for (let x = (y / 8) % 2 ? -6 : 0; x < W; x += 24) {
        c.rect(x, y, 23, 7, hex('#39404f'));
        c.outlineRect(x, y, 23, 7, hex('#2a303c'));
      }
    for (let i = 0; i < 220; i++) c.px(ri(r, 0, W - 1), ri(r, 0, GROUND_Y - 1), hex('#454d5e'), 0.5);
    c.rect(0, 5, W, 3, hex('#5c6577')); c.hline(0, 5, W, hex('#79839a'));
    for (let x = 8; x < W; x += 26) c.rect(x, 4, 3, 5, hex('#454d5e'));
    ground(c, r, { y: GROUND_Y, top: '#5a6274', body: '#464e5e', dark: '#333a48', debris: ['#333a48', '#6b7488'] });
  }],
  ['mid', 0, null, (c, r) => {
    // escotilha com escada
    c.rect(128, 20, 30, 64, hex('#2a303c')); c.outlineRect(128, 20, 30, 64, hex('#1c212b'));
    c.rect(133, 24, 20, 56, hex('#3a4353'));
    for (let y = 28; y < 80; y += 7) c.hline(136, y, 14, hex('#6b7488'));
    c.vline(136, 24, 56, hex('#79839a')); c.vline(149, 24, 56, hex('#79839a'));
    // estante do banco de sementes
    const SEED = ['#e8b06a', '#7fe06a', '#e2612f', '#cfd8e6', '#f0c840', '#8fd8ee'];
    c.rect(6, 44, 62, 40, hex('#3a4353')); c.outlineRect(6, 44, 62, 40, hex(P_OUT));
    for (let row = 0; row < 3; row++) {
      const sy = 48 + row * 13;
      c.hline(7, sy + 10, 60, hex('#5c6577'));
      for (let i = 0; i < 9; i++) {
        const jx = 9 + i * 6.5;
        c.rect(jx, sy + 3, 5, 7, hex('#6b7488'));
        c.rect(jx + 1, sy + 6, 3, 3, hex(SEED[(row * 3 + i) % SEED.length]));
        c.px(jx + 2, sy + 2, hex('#c9d2e0'));
      }
    }
  }],
  ['fx', 0, 'flicker', (c) => {
    // luz de emergência: camada própria para poder piscar
    for (let i = 24; i > 0; i--) c.ellipse(30, 16, i, i, hex('#ff3b30'), 0.024);
    c.rect(28, 12, 5, 4, hex('#ff6b5e')); c.outlineRect(28, 12, 5, 4, hex(P_OUT));
  }],
]);

// 2. Ruínas da cidade
SCENES.ruins = () => cena(202, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#6f6a5e', '#8f8874', '#b3a98c', '#cdbf9d'], 0, H);
    sunDisc(c, 148, 22, 5, '#f0dcae', '#e8cf96');
    clouds(c, r, { n: 5, yMin: 8, yMax: 30, base: '#c4b99e', dark: '#a2977c', a: 0.75 });
  }],
  ['far', 300, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y - 4, color: '#6a6455', minH: 26, maxH: 46, minW: 12, maxW: 24, a: 0.55 })],
  ['mid', 150, null, (c, r) => {
    cityscape(c, r, { baseY: GROUND_Y, color: '#463f38', minH: 16, maxH: 38, minW: 10, maxW: 22 });
    fogBands(c, r, { y0: 58, y1: 80, color: '#d8ccae', a: 0.14, n: 7 });
  }],
  ['near', 72, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#8d8168', body: '#6d6352', dark: '#4e463a', debris: ['#4e463a', '#a2977c', '#3a342c'] });
    for (let i = 0; i < 9; i++) {
      const x = ri(r, 0, W - 8), y = ri(r, GROUND_Y + 2, H - 4);
      c.rect(x, y, ri(r, 3, 7), ri(r, 2, 3), hex('#565042'));
    }
    carWreck(c, 12, GROUND_Y + 8, { body: '#6b4a3a', dark: '#33221c', glass: '#77837f' });
  }],
]);

// 3. Zona industrial contaminada
SCENES.toxic = () => cena(303, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#12190a', '#25330e', '#4a6216', '#8fae28', '#cfe85a'], 0, H);
    fogBands(c, r, { y0: 42, y1: 66, color: '#e8ff8a', a: 0.12, n: 9 });
  }],
  ['far', 320, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 8, amp: 14, color: '#1c2a0d', a: 0.9 })],
  ['mid', 160, null, (c, r) => {
    hills(c, r, { baseY: GROUND_Y - 1, amp: 7, color: '#101a07' });
    for (let i = 0; i < 7; i++) deadTree(c, 12 + i * 26 + ri(r, -6, 6), GROUND_Y, ri(r, 16, 30), '#0b1205');
  }],
  ['near', 80, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#3f5416', body: '#22300c', dark: '#131b06', debris: ['#131b06', '#5d7a1e'] });
    barrel(c, 22, GROUND_Y + 10); barrel(c, 140, GROUND_Y + 12);
  }],
]);

// 4. A amendoeira (transpiração)
SCENES.arvore = () => cena(404, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#5d6f8a', '#8ea3b8', '#bfcbd4', '#dcd6c2'], 0, H);
    sunDisc(c, 32, 20, 6, '#fff2c8', '#ffe08a');
    clouds(c, r, { n: 4, yMin: 10, yMax: 30, base: '#dfe6ea', dark: '#b3bfc9', a: 0.8 });
  }],
  ['far', 300, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y - 3, color: '#5a6472', minH: 16, maxH: 32, minW: 14, maxW: 26, a: 0.45 })],
  ['mid', 0, 'sway', (c, r) => {
    // a árvore fica parada: é o assunto da cena
    const tx = 118;
    c.rect(tx - 2, GROUND_Y - 30, 5, 30, hex('#4a3524'));
    for (let b = 0; b < 4; b++) {
      const by = GROUND_Y - 16 - b * 5, dir = b % 2 ? 1 : -1;
      for (let i = 0; i < 9; i++) c.px(tx + dir * i, by - Math.round(i * 0.6), hex('#4a3524'));
    }
    bush(c, tx, GROUND_Y - 36, 20, 11, { light: '#8fd86a', mid: '#4f9c42', dark: '#2c6b2c' });
    bush(c, tx - 15, GROUND_Y - 30, 12, 7, { light: '#8fd86a', mid: '#4f9c42', dark: '#2c6b2c' });
    bush(c, tx + 15, GROUND_Y - 28, 11, 7, { light: '#8fd86a', mid: '#4f9c42', dark: '#2c6b2c' });
    // saco plástico amarrado num galho
    c.rect(tx + 9, GROUND_Y - 26, 8, 9, hex('#cfe8f0'), 0.55);
    c.outlineRect(tx + 9, GROUND_Y - 26, 8, 9, hex('#eaf6fa'));
    for (let i = 0; i < 5; i++) c.px(tx + 10 + ri(r, 0, 5), GROUND_Y - 20 + ri(r, 0, 2), hex('#8fd8ee'));
  }],
  ['near', 80, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#8b8270', body: '#68604f', dark: '#484236', debris: ['#484236', '#9b917c'] });
    for (let i = 0; i < 5; i++) c.rect(ri(r, 0, W - 6), ri(r, GROUND_Y + 3, H - 3), ri(r, 3, 6), 2, hex('#55503f'));
  }],
]);

// 5. Posto de gasolina ao entardecer
SCENES.station = () => cena(505, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#2b2438', '#5a3a55', '#a8524d', '#e0894f'], 0, H);
    stars(c, r, 26, 26);
    sunDisc(c, 26, 54, 7, '#ffd27a', '#ff9a4a');
  }],
  ['far', 300, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y, color: '#241d2e', minH: 14, maxH: 34, minW: 12, maxW: 24 })],
  ['mid', 0, null, (c) => {
    c.rect(92, 40, 62, 6, hex('#4a4358')); c.outlineRect(92, 40, 62, 6, hex(P_OUT));
    c.hline(92, 40, 62, hex('#6e6480'));
    c.rect(98, 46, 4, 38, hex('#3b3548')); c.rect(144, 46, 4, 38, hex('#3b3548'));
    c.rect(112, 66, 10, 18, hex('#5c5470')); c.outlineRect(112, 66, 10, 18, hex(P_OUT));
    c.rect(114, 69, 6, 4, hex('#ffcf6b'));
  }],
  ['fx', 0, 'glow', (c) => lamp(c, 62, GROUND_Y, 34)],
  ['near', 80, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#3d3444', body: '#2c2634', dark: '#1d1926', debris: ['#1d1926', '#4d4358'] });
    carWreck(c, 18, GROUND_Y + 9, { body: '#5a3550', dark: '#2a1728', glass: '#6b6a86' });
  }],
]);

// 6. O Cercado à noite
SCENES.settlement = () => cena(606, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#1b1730', '#33284a', '#5c3f52', '#a05a44'], 0, H);
    stars(c, r, 40, 40);
  }],
  ['far', 320, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 2, amp: 10, color: '#241f38' })],
  ['mid', 0, null, (c, r) => {
    c.rect(0, 60, W, 24, hex('#3c3348'));
    for (let x = 0; x < W; x += 7) { c.vline(x, 58 + (x % 3), 26, hex('#4b4058')); c.px(x + 3, 62, hex('#6a5c78')); }
    shack(c, 20, 52, 26, 20, { on: false });
    shack(c, 116, 56, 22, 16, { wall: '#7a5c44', roof: '#8f4a2a', on: false });
    windmill(c, 82, 30, 30);
    c.rect(146, 58, 28, 14, hex('#2e4a52')); c.outlineRect(146, 58, 28, 14, hex(P_OUT));
    for (let x = 148; x < 173; x += 5) c.vline(x, 59, 12, hex('#7fd8c0'), 0.5);
    if (r) return;
  }],
  ['fx', 0, 'glow', (c) => {
    // janelas e estufa acesas, numa camada que pulsa
    c.rect(31, 60, 5, 4, hex('#ffd98a')); c.rect(125, 63, 5, 4, hex('#ffd98a'));
    for (let i = 18; i > 0; i--) c.ellipse(160, 64, i, Math.round(i * 0.6), hex('#7fe0c0'), 0.02);
  }],
  ['near', 78, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#4a3f52', body: '#352d3e', dark: '#241f2c', debris: ['#241f2c', '#5c5070'] });
    campfire(c, 66, GROUND_Y + 8);
  }],
]);

// 7. Estufa (interior)
SCENES.greenhouse = () => cena(707, [
  ['bg', 0, null, (c, r) => {
    c.rect(0, 0, W, H, hex('#1d3a33'));
    for (let x = 0; x < W; x += 16) { c.rect(x, 0, 15, GROUND_Y, hex('#27514a')); c.vline(x + 15, 0, GROUND_Y, hex('#173029')); }
    for (let y = 0; y < GROUND_Y; y += 18) c.hline(0, y, W, hex('#173029'));
    for (let i = 0; i < 120; i++) c.px(ri(r, 0, W - 1), ri(r, 0, GROUND_Y - 1), hex('#3f7a6a'), 0.35);
    c.rect(0, 0, W, 4, hex('#152b26'));
    ground(c, r, { y: GROUND_Y, top: '#4a5f4a', body: '#37473a', dark: '#26332a', debris: ['#26332a', '#5f7a5a'] });
  }],
  ['fx', 0, 'glow', (c) => { growLamp(c, 34, 8); growLamp(c, 90, 8); growLamp(c, 146, 8); }],
  ['mid', 0, 'sway', (c) => {
    greenhouseRow(c, 10, 58, 48); greenhouseRow(c, 68, 58, 48); greenhouseRow(c, 126, 58, 46);
    greenhouseRow(c, 22, GROUND_Y, 60, { pot: '#5a3f2a', leaf: '#7fe06a', deep: '#3aa34d' });
    greenhouseRow(c, 100, GROUND_Y, 58, { pot: '#5a3f2a', leaf: '#7fe06a', deep: '#3aa34d' });
  }],
]);

// 8. Ermo à noite
SCENES.wasteland = () => cena(808, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#0c0f1c', '#141a2e', '#232a44', '#39405c'], 0, H);
    stars(c, r, 60, 55);
    c.ellipse(146, 20, 8, 8, hex('#dfe4f0')); c.ellipse(143, 18, 6, 6, hex('#171c2e'));
    for (let i = 26; i > 0; i--) c.ellipse(146, 20, i, i, hex('#aab6d8'), 0.014);
  }],
  ['far', 340, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 4, amp: 14, color: '#1a2036' })],
  ['mid', 170, null, (c, r) => {
    hills(c, r, { baseY: GROUND_Y, amp: 7, color: '#121729' });
    for (let i = 0; i < 4; i++) deadTree(c, 24 + i * 44, GROUND_Y, ri(r, 14, 24), '#0e1120');
  }],
  ['near', 85, null, (c, r) => ground(c, r, { y: GROUND_Y, top: '#2b3149', body: '#1e2336', dark: '#141828', debris: ['#141828', '#3a4260'] })],
]);

// 9. Amanhecer sobre o assentamento
SCENES.dawn = () => cena(909, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#2a3f6b', '#5f6f9c', '#c98a63', '#f4c07a', '#ffe0a3'], 0, H);
    sunDisc(c, 128, 58, 9, '#fff0c0', '#ffcf7a');
    clouds(c, r, { n: 5, yMin: 10, yMax: 32, base: '#ffd9a8', dark: '#d69a6e', a: 0.8 });
  }],
  ['far', 300, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 4, amp: 10, color: '#4a6a52', a: 0.9 })],
  ['mid', 0, null, (c) => {
    shack(c, 22, 56, 26, 20, { wall: '#9a7550', roof: '#c85a2a', on: true });
    shack(c, 62, 62, 20, 14, { wall: '#8a6a4a', roof: '#b5551e', on: true });
    windmill(c, 100, 34, 28, { blade: '#f0f6ff' });
  }],
  ['near', 70, 'sway', (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#6ec850', body: '#3fa34d', dark: '#26773a', debris: ['#26773a', '#a8e05f'] });
    for (let i = 0; i < 40; i++) c.vline(ri(r, 0, W - 1), ri(r, GROUND_Y + 2, H - 2) - 2, 2, hex('#a8e05f'), 0.7);
    bush(c, 158, GROUND_Y + 4, 12, 6); bush(c, 8, GROUND_Y + 7, 9, 5);
  }],
]);

// 10. Ruínas sombrias
SCENES.bleak = () => cena(1010, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#16192a', '#232840', '#3a4059', '#565d78'], 0, H);
    stars(c, r, 30, 40, '#c8cfe4');
    for (let i = 20; i > 0; i--) c.ellipse(40, 24, i, i, hex('#8f9ab8'), 0.016);
    c.ellipse(40, 24, 7, 7, hex('#9aa4c0'), 0.5);
  }],
  ['far', 320, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y, color: '#2b3048', minH: 22, maxH: 48, minW: 10, maxW: 22, a: 0.75 })],
  ['mid', 160, null, (c, r) => {
    cityscape(c, r, { baseY: GROUND_Y, color: '#171b2b', minH: 14, maxH: 34, minW: 12, maxW: 24 });
    fogBands(c, r, { y0: 60, y1: 82, color: '#7a83a0', a: 0.13, n: 6 });
  }],
  ['near', 82, null, (c, r) => ground(c, r, { y: GROUND_Y, top: '#39405c', body: '#252a3e', dark: '#171b28', debris: ['#171b28', '#454c68'] })],
]);

// 11. Abrigo solitário
SCENES.lone = () => cena(1111, [
  ['sky', 0, null, (c, r) => { sky(c, ['#211a2e', '#3d2c44', '#6b4450', '#a8623f'], 0, H); stars(c, r, 24, 30); }],
  ['far', 300, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y - 2, color: '#251d30', minH: 16, maxH: 38, minW: 12, maxW: 24, a: 0.85 })],
  ['mid', 0, null, (c, r) => {
    c.rect(52, 54, 44, 30, hex('#4a4054')); c.outlineRect(52, 54, 44, 30, hex(P_OUT));
    for (let x = 54; x < 96; x += 6) c.vline(x, 55, 28, hex('#5c5068'), 0.7);
    for (let i = 0; i < 46; i++) c.px(52 + ri(r, 0, 43), 54 + ri(r, 0, 29), hex('#8a5a3a'), 0.35);
    c.rect(46, 50, 56, 5, hex('#7a4a2a')); c.outlineRect(46, 50, 56, 5, hex(P_OUT));
    c.rect(68, 68, 10, 16, hex('#241f2c')); c.outlineRect(68, 68, 10, 16, hex(P_OUT));
  }],
  ['near', 80, null, (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#463a48', body: '#332a36', dark: '#231d26', debris: ['#231d26', '#584a5e'] });
    campfire(c, 120, GROUND_Y + 8);
  }],
]);

// 12. A Mancha tomando as ruínas
SCENES.mancha = () => cena(1313, [
  ['sky', 0, null, (c, r) => { sky(c, ['#241a2e', '#3d2c40', '#6b4a44', '#a8724a'], 0, H); stars(c, r, 18, 26); }],
  ['far', 300, null, (c, r) => cityscape(c, r, { baseY: GROUND_Y, color: '#2b2033', minH: 24, maxH: 46, minW: 12, maxW: 24, a: 0.7 })],
  ['mid', 150, 'sway', (c, r) => {
    cityscape(c, r, { baseY: GROUND_Y, color: '#1a1422', minH: 14, maxH: 32, minW: 10, maxW: 20 });
    crust(c, r, { x: 0, y: GROUND_Y, w: W, h: 26, density: 0.6 });
  }],
  ['near', 70, 'sway', (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#2a3a26', body: '#1d2a1c', dark: '#121a11', debris: ['#121a11', '#2f5c33'] });
    for (let i = 0; i < 26; i++) {
      const x = ri(r, 4, W - 5), base = ri(r, GROUND_Y + 1, GROUND_Y + 9), alt = ri(r, 5, 13);
      const caule = r() < 0.5 ? hex('#2f6b34') : hex('#1f4a2a');
      for (let j = 0; j < alt; j++) c.px(x + Math.round(Math.sin(j * 0.5) * 0.8), base - j, caule);
      for (let f = 2; f < alt; f += 3) {
        const y = base - f, lado = f % 6 === 2 ? 1 : -1;
        const folha = r() < 0.4 ? hex('#7fe06a') : hex('#3f8a43');
        for (let k = 1; k <= ri(r, 2, 4); k++) c.px(x + lado * k, y - Math.round(k * 0.4), folha);
      }
      c.px(x, base - alt, hex('#9fffa0'), 0.9);
    }
  }],
]);

// 13. Campo de girassóis (o melhor desfecho)
SCENES.campo = () => cena(1414, [
  ['sky', 0, null, (c, r) => {
    sky(c, ['#3f6fa8', '#7fa8cc', '#bfd8e0', '#f0e0b0'], 0, H);
    sunDisc(c, 40, 22, 10, '#fffbe0', '#ffe89a');
    clouds(c, r, { n: 6, yMin: 8, yMax: 34, base: '#ffffff', dark: '#c9d8e6', a: 0.9 });
  }],
  ['far', 300, null, (c, r) => hills(c, r, { baseY: GROUND_Y - 6, amp: 9, color: '#5f8f5a', a: 0.85 })],
  ['mid', 150, 'sway', (c, r) => {
    // fileira distante de girassóis
    for (let x = 2; x < W; x += 7) {
      const alt = ri(r, 9, 14), base = GROUND_Y - 1;
      c.vline(x, base - alt, alt, hex('#3f7a34'));
      c.ellipse(x, base - alt - 2, 3, 3, hex('#f0b429'));
      c.px(x, base - alt - 2, hex('#6b4a1a'));
    }
  }],
  ['near', 68, 'sway', (c, r) => {
    ground(c, r, { y: GROUND_Y, top: '#7fc850', body: '#4aa33f', dark: '#2c7330', debris: ['#2c7330', '#a8e05f'] });
    for (let x = -4; x < W + 6; x += 11) {
      const alt = ri(r, 16, 24), base = GROUND_Y + ri(r, 4, 10);
      c.rect(x, base - alt, 2, alt, hex('#2f6b2c'));
      for (let f = 4; f < alt; f += 6) {
        const lado = f % 12 === 4 ? 1 : -1;
        for (let k = 1; k <= 4; k++) c.px(x + lado * k, base - f - Math.round(k * 0.5), hex('#4f9c42'));
      }
      c.ellipse(x + 1, base - alt - 4, 6, 5, hex('#f4c430'));
      c.ellipse(x + 1, base - alt - 4, 3, 3, hex('#7a4a12'));
      for (let p = 0; p < 8; p++) {
        const ang = (p / 8) * Math.PI * 2;
        c.px(x + 1 + Math.round(Math.cos(ang) * 7), base - alt - 4 + Math.round(Math.sin(ang) * 6), hex('#ffdc5c'));
      }
    }
  }],
]);

// 14. Tela inicial — panorama (mais alto)
SCENES.hero = () => {
  const HH = 150, gy = 128;
  const mk = (vel, fx, desenha, i) => {
    const c = new Canvas(W, HH, vel > 0);
    desenha(c, rng(1212 + i * 91));
    return { nome: ['sky', 'far', 'mid', 'near'][i], vel, fx, canvas: c };
  };
  return [
    mk(0, null, (c, r) => {
      sky(c, ['#171334', '#33265a', '#7a3f63', '#c95f4a', '#f0954e', '#ffcf82'], 0, gy);
      stars(c, r, 55, 46);
      sunDisc(c, 96, 96, 13, '#ffe9a8', '#ff9a4a');
      clouds(c, r, { n: 7, yMin: 22, yMax: 62, base: '#e2a06e', dark: '#a86a4c', a: 0.7, minW: 20, maxW: 46 });
    }, 0),
    mk(340, null, (c, r) => cityscape(c, r, { baseY: gy, color: '#4a2f4a', minH: 34, maxH: 62, minW: 14, maxW: 26, a: 0.6 }), 1),
    mk(170, null, (c, r) => {
      cityscape(c, r, { baseY: gy, color: '#241a30', minH: 22, maxH: 52, minW: 10, maxW: 22, windows: { color: '#1a1224', lit: '#ffb85c', litChance: 0.14 } });
      fogBands(c, r, { y0: 100, y1: 126, color: '#e0a070', a: 0.1, n: 6 });
    }, 2),
    mk(85, null, (c, r) => {
      ground(c, r, { y: gy, top: '#3f3348', body: '#2b2434', dark: '#1b1724', debris: ['#1b1724', '#544665'] });
      deadTree(c, 24, gy, 26, '#181322');
      carWreck(c, 132, gy + 10, { body: '#4a2f42', dark: '#221624', glass: '#5f5c78' });
    }, 3),
  ];
};

// ═════════════════════════════════════════════════════════
// ÍCONES 16x16 — desenhados no mesmo estilo dos cenários, para ficarem
// nítidos no HUD (os packs externos de 128px viravam borrão ao reduzir).
// ═════════════════════════════════════════════════════════
const IPAL = {
  o: '#171520',                                        // contorno
  // ração (pão)
  a: '#c98a4a', A: '#e8b06a', b: '#8a5a2a',
  // água (frasco)
  c: '#3f8fb5', C: '#8fd8ee', d: '#23617f', g: '#d8f0fa',
  // saúde (kit médico)
  e: '#d43f60', E: '#ff7a94', f: '#ffffff',
  // confiança (crachá)
  h: '#4aa83a', H: '#8fe07a', i: '#e9dcc0',
  // radiação / fogo
  j: '#f0932b', J: '#ffd45c', k: '#e2612f',
  // curativo
  l: '#e8d0a8', L: '#fff0d8',
  // veneno
  m: '#7fd06a', M: '#2a6a20',
  // estrutura / metal
  n: '#8a93a8', N: '#cfd8e6', p: '#4a5266',
};

const ICONS = {
  // pão / ração
  bread: [
    '................', '................', '.....oooooo.....', '...ooAAAAAAoo...',
    '..oAAAAAAAAAAo..', '.oAAAaaaaaAAAAo.', '.oAAaaaaaaaAAAo.', '.oAaaaaaaaaaaAo.',
    '.oAaaaaaaaaaaAo.', '.oaaaaaaaaaaaao.', '.obaaaaaaaaaabo.', '.obbaaaaaaaabbo.',
    '..obbbbbbbbbbo..', '...oobbbbbboo...', '.....oooooo.....', '................',
  ],
  // frasco de água
  flask: [
    '................', '.....oooooo.....', '.....oggggo.....', '.....ogccgo.....',
    '.....occccо.....', '....occccccо....', '....occccccо....', '...occCCcccco...',
    '...ocCCcccccco..', '..occcccccccco..', '..occccccccccо..', '..ocdccccccdco..',
    '..occdddddddco..', '...occcccccco...', '....oooooooo....', '................',
  ],
  // kit médico
  medkit: [
    '................', '..oooooooooooo..', '..oEEEEEEEEEEo..', '..oeeeeeeeeeeo..',
    '..oeeeffffeeeo..', '..oeeeffffeeeo..', '..oeffffffffeo..', '..oeffffffffeo..',
    '..oeffffffffeo..', '..oeeeffffeeeo..', '..oeeeffffeeeo..', '..oeeeeeeeeeeo..',
    '..oeeeeeeeeeeo..', '..oooooooooooo..', '................', '................',
  ],
  // crachá (confiança)
  nametag: [
    '................', '................', '..oooooooooooo..', '..oiiiiiiiiiio..',
    '..oihhhhhhhhio..', '..oihHHHHHHhio..', '..oihhhhhhhhio..', '..oiiiiiiiiiio..',
    '..oihhhhhhhhio..', '..oihhhhhhhhio..', '..oiiiiiiiiiio..', '..oihhhhhhhhio..',
    '..oiiiiiiiiiio..', '..oooooooooooo..', '................', '................',
  ],
  // radiação / calor (chama)
  ablaze: [
    '................', '.......oo.......', '......oJJo......', '.....oJJJJo.....',
    '.....oJJJJo.....', '....oJJjjJJo....', '....oJjjjjJo....', '...oJjjjjjjJo...',
    '...ojjjjjjjjo...', '..ojjjjJJjjjjo..', '..ojjjJJJJjjjo..', '..okjjJJJJjjko..',
    '..okkjjjjjjkko..', '...okkkjjkkko...', '....ookkkkoo....', '......oooo......',
  ],
  // curativo (band-aid)
  bandage: [
    '................', '................', '................', '..oooooooooooo..',
    '..ollllllllllo..', '..ollLLLLLLllo..', '..ollLoLLoLllo..', '..ollLLLLLLllo..',
    '..ollLoLLoLllo..', '..ollLLLLLLllo..', '..ollllllllllo..', '..oooooooooooo..',
    '................', '................', '................', '................',
  ],
  // veneno / perigo (caveira simplificada)
  poison: [
    '................', '.....oooooo.....', '....oMMMMMMo....', '...oMmmmmmmMo...',
    '..oMmmmmmmmmMo..', '..oMmoommoommo..', '..oMmoommoommo..', '..oMmmmmmmmmMo..',
    '..oMmmmoommmMo..', '...oMmmmmmmMo...', '....oMmomomMo...', '.....oMmomoMo...',
    '.....oMMMMMMo...', '......oooooo....', '................', '................',
  ],
  // máscara de gás (zona contaminada)
  gasmask: [
    '................', '................', '...oooooooooo...', '..oNNNNNNNNNNo..',
    '..oNppppppppNo..', '..oNpggppggpNo..', '..oNpggppggpNo..', '..oNppppppppNo..',
    '..oNpppoopppNo..', '..oNppppppppNo..', '...oNppppppNo...', '....oNppppNo....',
    '.....oNooNo.....', '......oooo......', '................', '................',
  ],
  // broto (fotossíntese / recomeço)
  sprout: [
    '................', '.....oo....oo...', '....oMMo..oMMo..', '...oMmmMooMmmMo.',
    '...oMmmmMMmmmMo.', '....oMmmmmmmMo..', '.....oMmmmmMo...', '......oMmmMo....',
    '.......omo......', '.......omo......', '.......omo......', '.....oooooooo...',
    '....obbbbbbbbo..', '....obbbbbbbbo..', '.....oooooooo...', '................',
  ],
  // moinho (assentamento)
  windmill: [
    '................', '.......oo.......', '......oNNo......', '.o....oNNo....o.',
    '.oNo..oNNo..oNo.', '..oNNooNNooNNo..', '...oNNNNNNNNo...', '.....oNNNNo.....',
    '......oppo......', '......oppo......', '......oppo......', '......oppo......',
    '.....opppo......', '....oppppppo....', '...oooooooooo...', '................',
  ],
  // silo / abrigo
  silo: [
    '................', '......oooo......', '....ooNNNNoo....', '...oNNNNNNNNo...',
    '..oNnnnnnnnnNo..', '..oNnnnnnnnnNo..', '..oNnnppppnnNo..', '..oNnnppppnnNo..',
    '..oNnnnnnnnnNo..', '..oNnnnnnnnnNo..', '..oNnnppppnnNo..', '..oNnnppppnnNo..',
    '..oNnnnnnnnnNo..', '..oNNNNNNNNNNo..', '..oooooooooooo..', '................',
  ],
  // lampião (encontro)
  lamp: [
    '................', '.......oo.......', '......oppo......', '.....oppppo.....',
    '....oooooooo....', '...oJJJJJJJJo...', '...oJjjjjjjJo...', '...oJjjJJjjJo...',
    '...oJjjJJjjJo...', '...oJjjjjjjJo...', '...oJJJJJJJJo...', '....oooooooo....',
    '.....oppppo.....', '....oppppppo....', '....oooooooo....', '................',
  ],
  // ponto de ônibus (ruínas)
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
  // versão achatada, para fundo de créditos/carregamento e como reserva
  const dir = path.join(OUT, chave);
  await sharp(path.join(dir, camadas[0].nome + '.png'))
    .composite(camadas.slice(1).map(cam => ({ input: path.join(dir, cam.nome + '.png') })))
    .png({ compressionLevel: 9, palette: true }).toFile(path.join(dir, 'flat.png'));
  console.log(`✓ ${chave.padEnd(11)} ${camadas.length} camadas  ${camadas.map(c => c.nome).join(' ')}`);
}
fs.writeFileSync(path.join(OUT, 'manifesto.json'), JSON.stringify(manifesto, null, 1));
// o componente importa o manifesto direto do código, então mantém a cópia junta
fs.writeFileSync('src/game/artManifest.json', JSON.stringify(manifesto, null, 1));

// protagonista: dois quadros de respiração
for (const [nome, desloca] of [['survivor-1', 0], ['survivor-2', 1]]) {
  const c = new Canvas(16, 20);
  drawSprite(c, SURVIVOR, SURVIVOR_PAL, 0, desloca);
  await c.save(path.join(OUT, `${nome}.png`));
}
console.log('✓ survivor    2 quadros');

await saveIcons();

if (args.includes('--sheet')) {
  const S = 3;
  const chaves = Object.keys(manifesto);
  const comps = [];
  const cw = W * S, chh = 150 * S, cols = 3;
  for (let i = 0; i < chaves.length; i++) {
    // achata as camadas de cada cena para revisão
    const camadas = manifesto[chaves[i]];
    let base = sharp(path.join(OUT, chaves[i], camadas[0].n + '.png'));
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
