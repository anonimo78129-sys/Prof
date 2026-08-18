import * as THREE from 'three';

// ─────────────────────────────────────────────────────────
// MATERIAIS PBR GERADOS POR CÓDIGO
//
// Nenhum arquivo de imagem entra aqui. Cada superfície nasce de ruído
// desenhado em canvas e vira três mapas:
//
//   ALBEDO     a cor, em espaço sRGB
//   RUGOSIDADE onde a superfície brilha e onde não — é o mapa que mais
//              faz diferença: superfície com rugosidade constante lê como
//              plástico, e é o que mais denuncia 3D amador
//   NORMAL     o relevo miúdo, derivado por Sobel de um mapa de altura
//
// A luz é que faz o trabalho pesado. Concreto com bom mapa de rugosidade
// sob luz indireta parece concreto; concreto com textura linda sob luz
// chapada parece papel de parede.
// ─────────────────────────────────────────────────────────

const TAM = 512;

function tela(desenha: (g: CanvasRenderingContext2D, n: number) => void, n = TAM) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  desenha(c.getContext('2d')!, n);
  return c;
}

function repetir(t: THREE.Texture, r: number) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(r, r);
  t.anisotropy = 8;
  return t;
}

function albedo(c: HTMLCanvasElement, r = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return repetir(t, r);
}

function dado(c: HTMLCanvasElement, r = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return repetir(t, r);
}

// ── ruído ────────────────────────────────────────────────

function embaralha(semente: number) {
  const p = new Uint8Array(512);
  let a = semente >>> 0;
  const sorteio = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (sorteio() * (i + 1)) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 256; i++) p[i + 256] = p[i];
  return p;
}

const suave = (t: number) => t * t * (3 - 2 * t);

/** Ruído de valor com repetição no ladrilho, para a textura poder ladrilhar. */
function ruido(p: Uint8Array, x: number, y: number, per: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const v = (a: number, b: number) => p[(p[((a % per) + per) % per] + (((b % per) + per) % per)) & 511] / 255;
  const u = suave(xf), w = suave(yf);
  return (
    v(xi, yi) * (1 - u) * (1 - w) + v(xi + 1, yi) * u * (1 - w) +
    v(xi, yi + 1) * (1 - u) * w + v(xi + 1, yi + 1) * u * w
  );
}

/** Soma de oitavas: é o que dá a textura orgânica, sem cara de degradê. */
export function fbm(semente: number, oitavas = 5, escala = 8) {
  const p = embaralha(semente);
  return (x: number, y: number) => {
    let s = 0, amp = 0.5, f = escala, norma = 0;
    for (let o = 0; o < oitavas; o++) {
      s += ruido(p, x * f, y * f, f) * amp;
      norma += amp;
      amp *= 0.5; f *= 2;
    }
    return s / norma;
  };
}

/** Normal map a partir de um mapa de altura em tons de cinza (Sobel). */
export function normalDe(altura: HTMLCanvasElement, forca = 2.2) {
  const n = altura.width;
  const src = altura.getContext('2d')!.getImageData(0, 0, n, n).data;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const img = c.getContext('2d')!.createImageData(n, n);
  const h = (x: number, y: number) => src[(((y + n) % n) * n + ((x + n) % n)) * 4] / 255;

  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = (h(x - 1, y - 1) + 2 * h(x - 1, y) + h(x - 1, y + 1))
             - (h(x + 1, y - 1) + 2 * h(x + 1, y) + h(x + 1, y + 1));
    const dy = (h(x - 1, y - 1) + 2 * h(x, y - 1) + h(x + 1, y - 1))
             - (h(x - 1, y + 1) + 2 * h(x, y + 1) + h(x + 1, y + 1));
    const vx = dx * forca, vy = dy * forca, vz = 1;
    const m = Math.hypot(vx, vy, vz);
    const i = (y * n + x) * 4;
    img.data[i] = ((vx / m) * 0.5 + 0.5) * 255;
    img.data[i + 1] = ((vy / m) * 0.5 + 0.5) * 255;
    img.data[i + 2] = ((vz / m) * 0.5 + 0.5) * 255;
    img.data[i + 3] = 255;
  }
  c.getContext('2d')!.putImageData(img, 0, 0);
  return c;
}

/** Pinta uma tela inteira a partir de uma função de cor por pixel. */
function pinta(f: (u: number, v: number) => [number, number, number], n = TAM) {
  return tela((g) => {
    const img = g.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const [r, vd, b] = f(x / n, y / n);
      const i = (y * n + x) * 4;
      img.data[i] = r; img.data[i + 1] = vd; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, n);
}

const cinza = (f: (u: number, v: number) => number, n = TAM) =>
  pinta((u, v) => { const c = Math.max(0, Math.min(255, f(u, v) * 255)); return [c, c, c]; }, n);

const mistura = (a: number[], b: number[], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ── as superfícies ───────────────────────────────────────

export function matConcreto(repeticao = 6) {
  const grao = fbm(11, 6, 12), mancha = fbm(29, 3, 2.5);
  const cor = pinta((u, v) => {
    const g = grao(u, v), m = mancha(u, v);
    const base = mistura([206, 192, 166], [168, 152, 126], m * 0.7 + g * 0.3);
    return mistura(base, [138, 124, 102], Math.max(0, g - 0.62) * 1.6) as [number, number, number];
  });
  const rug = cinza((u, v) => 0.72 + grao(u, v) * 0.24 - mancha(u, v) * 0.08);
  const alt = cinza((u, v) => grao(u, v) * 0.8 + mancha(u, v) * 0.2);
  return new THREE.MeshStandardMaterial({
    map: albedo(cor, repeticao),
    roughnessMap: dado(rug, repeticao),
    normalMap: dado(normalDe(alt, 1.1), repeticao),
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 1, metalness: 0,
  });
}

export function matPiso(repeticao = 14) {
  const grao = fbm(41, 5, 16), sujo = fbm(53, 3, 3);
  // junta de ladrilho: linha escura e funda, que é o que segura a escala
  const junta = (u: number, v: number) => {
    const d = Math.min(u % 1, 1 - (u % 1), v % 1, 1 - (v % 1));
    return d < 0.022 ? 1 - d / 0.022 : 0;
  };
  const cor = pinta((u, v) => {
    const j = junta(u, v), g = grao(u, v), s = sujo(u, v);
    // terracota: piso de estufa é barro cozido, e é ele que dá calor à
    // cena inteira. Em cinza o galpão fica com cara de estacionamento.
    const base = mistura([196, 118, 78], [156, 88, 58], g * 0.5 + s * 0.5);
    return mistura(base, [92, 58, 42], j * 0.85) as [number, number, number];
  });
  const rug = cinza((u, v) => 0.34 + grao(u, v) * 0.2 + junta(u, v) * 0.42 + sujo(u, v) * 0.14);
  const alt = cinza((u, v) => 0.8 - junta(u, v) * 0.8 + grao(u, v) * 0.15);
  return new THREE.MeshStandardMaterial({
    map: albedo(cor, repeticao),
    roughnessMap: dado(rug, repeticao),
    normalMap: dado(normalDe(alt, 2.6), repeticao),
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 1, metalness: 0,
  });
}

export function matMadeira(repeticao = 3) {
  const veio = fbm(67, 5, 3), fibra = fbm(71, 4, 40);
  const g = (u: number, v: number) => veio(u * 0.18, v) * 0.75 + fibra(u * 0.1, v) * 0.25;
  const cor = pinta((u, v) => {
    const t = g(u, v);
    const base = mistura([150, 104, 58], [104, 68, 36], t);
    return mistura(base, [180, 132, 76], Math.max(0, 0.62 - t) * 1.2) as [number, number, number];
  });
  const rug = cinza((u, v) => 0.55 + g(u, v) * 0.3);
  return new THREE.MeshStandardMaterial({
    map: albedo(cor, repeticao),
    roughnessMap: dado(rug, repeticao),
    normalMap: dado(normalDe(cinza((u, v) => g(u, v)), 1.6), repeticao),
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 1, metalness: 0,
  });
}

export function matTerra(repeticao = 8) {
  const torrao = fbm(83, 6, 10), umido = fbm(97, 3, 4);
  const cor = pinta((u, v) => {
    const t = torrao(u, v), m = umido(u, v);
    return mistura([88, 62, 41], [46, 32, 21], t * 0.6 + m * 0.4) as [number, number, number];
  });
  const alt = cinza((u, v) => torrao(u, v));
  return new THREE.MeshStandardMaterial({
    map: albedo(cor, repeticao),
    roughnessMap: dado(cinza((u, v) => 0.88 + torrao(u, v) * 0.1), repeticao),
    normalMap: dado(normalDe(alt, 3), repeticao),
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughness: 1, metalness: 0,
  });
}

/**
 * Aço PINTADO, não aço polido. Metal puro só devolve o que o ambiente
 * manda, e num galpão isso vira silhueta preta: a estrutura da abóbada
 * sumia em faixas escuras contra o céu. Com pouca metalicidade e tinta
 * clara ela vira desenho, que é o que se vê em estufa de verdade.
 */
export function matMetal(cor = 0x93a0a9, rugosidade = 0.5) {
  const risco = fbm(103, 4, 30);
  return new THREE.MeshStandardMaterial({
    color: cor,
    roughnessMap: dado(cinza((u, v) => rugosidade + risco(u * 0.2, v) * 0.3), 4),
    roughness: 1, metalness: 0.3, envMapIntensity: 1.4,
  });
}

export function matVidro() {
  // vidro de estufa: sujo o bastante para aparecer, limpo o bastante para
  // deixar o sol passar. Transmissão de verdade custa caro no celular, e o
  // que vende o vidro aqui é o reflexo do céu, não a refração.
  const sujeira = fbm(109, 4, 6);
  return new THREE.MeshStandardMaterial({
    color: 0xdaeaf2,
    roughnessMap: dado(cinza((u, v) => 0.04 + sujeira(u, v) * 0.22), 3),
    roughness: 1, metalness: 0.1,
    transparent: true, opacity: 0.22,
    envMapIntensity: 2.2,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/** Flor de cinco pétalas, com miolo. É o que põe cor no canteiro. */
export function texturaFlor(petala: [number, number, number], miolo: [number, number, number]) {
  const n = 256;
  const c = tela((g) => {
    g.clearRect(0, 0, n, n);
    const cx = n / 2, cy = n * 0.34, raio = n * 0.3;
    // caule
    g.strokeStyle = 'rgb(74,124,44)';
    g.lineWidth = n * 0.035;
    g.beginPath(); g.moveTo(cx, n); g.quadraticCurveTo(cx * 1.1, n * 0.7, cx, cy); g.stroke();
    // duas folhinhas no caule
    g.fillStyle = 'rgb(86,142,52)';
    for (const lado of [-1, 1]) {
      g.beginPath();
      g.ellipse(cx + lado * n * 0.09, n * 0.72, n * 0.09, n * 0.038, lado * 0.5, 0, Math.PI * 2);
      g.fill();
    }
    // pétalas
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * raio * 0.62, py = cy + Math.sin(a) * raio * 0.62;
      const grad = g.createRadialGradient(px, py, 0, px, py, raio * 0.62);
      grad.addColorStop(0, `rgb(${petala.join(',')})`);
      grad.addColorStop(1, `rgb(${petala.map(v => Math.round(v * 0.7)).join(',')})`);
      g.fillStyle = grad;
      g.beginPath();
      g.ellipse(px, py, raio * 0.6, raio * 0.42, a, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = `rgb(${miolo.join(',')})`;
    g.beginPath(); g.arc(cx, cy, raio * 0.28, 0, Math.PI * 2); g.fill();
  }, n);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Recorte de folha, usado tanto em folhagem quanto em grama. */
export function texturaFolha(cor: [number, number, number], escuro: [number, number, number]) {
  const n = 256;
  const c = tela((g) => {
    g.clearRect(0, 0, n, n);
    const grad = g.createLinearGradient(0, n, 0, 0);
    grad.addColorStop(0, `rgb(${escuro.join(',')})`);
    grad.addColorStop(1, `rgb(${cor.join(',')})`);
    g.fillStyle = grad;
    // silhueta de folha: duas curvas espelhadas, base estreita
    g.beginPath();
    g.moveTo(n / 2, n);
    g.bezierCurveTo(n * 0.04, n * 0.72, n * 0.1, n * 0.16, n / 2, 0);
    g.bezierCurveTo(n * 0.9, n * 0.16, n * 0.96, n * 0.72, n / 2, n);
    g.fill();
    // nervura central e laterais
    g.strokeStyle = `rgba(${escuro.join(',')},0.55)`;
    g.lineWidth = n * 0.012;
    g.beginPath(); g.moveTo(n / 2, n * 0.97); g.lineTo(n / 2, n * 0.06); g.stroke();
    g.lineWidth = n * 0.006;
    for (let i = 1; i <= 6; i++) {
      const y = n - (i / 7) * n * 0.92;
      const e = Math.sin((i / 7) * Math.PI) * n * 0.3;
      g.beginPath(); g.moveTo(n / 2, y); g.lineTo(n / 2 - e, y - n * 0.09); g.stroke();
      g.beginPath(); g.moveTo(n / 2, y); g.lineTo(n / 2 + e, y - n * 0.09); g.stroke();
    }
  }, n);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
