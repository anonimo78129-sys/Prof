// ─────────────────────────────────────────────────────────
// Prepara as ilustrações para animar.
//
// TORRE (opção 2): recorta o JPG achatado em três planos — céu, meio e
// as árvores da frente — para eles rolarem em velocidades diferentes.
// Como o arquivo é achatado, atrás de cada recorte não existe pixel
// nenhum; o buraco é preenchido esticando a cor de dentro para fora, que
// funciona porque a arte é de cor chapada.
//
// ARCOS (opção 4): autora um mapa de profundidade para o deslocamento
// por shader. Não dá para extrair profundidade de um JPG achatado, então
// o mapa é desenhado à mão a partir da composição: o céu ao fundo é
// preto, o chão sob os pés é branco, e as ruínas das laterais entram
// como massa intermediária.
//
//   node scripts/gen-camadas.mjs
// ─────────────────────────────────────────────────────────
import sharp from 'sharp';
import fs from 'node:fs';

const DIR = 'public/assets/cenas';

// ── TORRE ────────────────────────────────────────────────
async function torre() {
  const src = `${DIR}/torre.jpg`;
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;

  const idx = (x, y) => (y * w + x) * c;

  // O céu é o único tom com azul muito acima do vermelho. Pedra, musgo e
  // tronco têm azul baixo, então esta única regra separa o plano de fundo
  // sem precisar de recorte à mão.
  const ehCeu = (x, y) => {
    const i = idx(x, y);
    return data[i + 2] > 150 && data[i + 2] > data[i] + 40;
  };

  // As árvores da frente são a massa escura encostada nas bordas
  // laterais. Cortar por coluna fixa deixava um talho vertical no meio do
  // tronco; em vez disso a máscara nasce nas bordas e se espalha por
  // vizinhança enquanto o pixel continuar escuro, então ela para sozinha
  // no contorno da própria árvore.
  const escuro = (x, y) => {
    const i = idx(x, y);
    return data[i] + data[i + 1] + data[i + 2] < 330;
  };
  // O verde escuro do chão encosta no pé das árvores, então a inundação
  // solta atravessa e leva a cena inteira. A faixa segura prende o
  // espalhamento às laterais, que é onde as árvores da frente vivem.
  const faixa = Math.round(w * 0.30);
  const naFaixa = (x) => x < faixa || x >= w - faixa;
  const frentePorInundacao = () => {
    const m = new Uint8Array(w * h);
    const fila = [];
    for (let y = 0; y < h; y++) for (const x of [0, w - 1]) {
      if (escuro(x, y) && !m[y * w + x]) { m[y * w + x] = 1; fila.push([x, y]); }
    }
    while (fila.length) {
      const [x, y] = fila.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (!naFaixa(nx)) continue;
        const p = ny * w + nx;
        if (m[p] || !escuro(nx, ny)) continue;
        m[p] = 1; fila.push([nx, ny]);
      }
    }
    return m;
  };

  const mascara = (teste) => {
    const m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = teste(x, y) ? 1 : 0;
    return m;
  };

  // Fecha buraquinho e come franja de compressão do JPEG: sem isso a
  // borda do recorte fica salpicada.
  const suaviza = (m, passos = 2) => {
    let a = m;
    for (let p = 0; p < passos; p++) {
      const b = new Uint8Array(w * h);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += a[(y + dy) * w + (x + dx)];
        b[y * w + x] = n >= 5 ? 1 : 0;
      }
      a = b;
    }
    return a;
  };

  const mCeu = suaviza(mascara(ehCeu));
  const mFrente = suaviza(frentePorInundacao());

  /** Escreve um RGBA com os pixels onde a máscara vale, resto transparente. */
  const camada = (m) => {
    const out = Buffer.alloc(w * h * 4);
    for (let p = 0; p < w * h; p++) {
      const i = p * c, o = p * 4;
      if (!m[p]) continue;
      out[o] = data[i]; out[o + 1] = data[i + 1]; out[o + 2] = data[i + 2]; out[o + 3] = 255;
    }
    return out;
  };

  // O meio é tudo que não é céu nem árvore da frente. Onde a árvore saiu
  // fica buraco, e como o JPG é achatado não existe pixel por baixo para
  // recuperar. O tapa-buraco vem de uma cópia bem borrada da própria
  // imagem: ela traz a média da vizinhança, então o remendo entra na cor
  // certa sem a listra que a esticada horizontal deixava.
  const borrado = await sharp(src).blur(38).raw().toBuffer();

  const meio = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    if (mCeu[p]) continue;                       // vazio do céu fica vazio
    const i = p * c, o = p * 4;
    const fonte = mFrente[p] ? borrado : data;
    meio[o] = fonte[i]; meio[o + 1] = fonte[i + 1]; meio[o + 2] = fonte[i + 2]; meio[o + 3] = 255;
  }

  const grava = (buf, nome) => sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 }).toFile(`${DIR}/torre-${nome}.png`);

  await grava(camada(mCeu), 'ceu');
  await grava(meio, 'meio');
  await grava(camada(mFrente), 'frente');

  const cobertura = (m) => (m.reduce((s, v) => s + v, 0) / (w * h) * 100).toFixed(1);
  console.log(`torre ${w}x${h}  céu ${cobertura(mCeu)}%  frente ${cobertura(mFrente)}%`);
}

// ── ARCOS ────────────────────────────────────────────────
async function arcos() {
  const src = `${DIR}/arcos.jpg`;
  const { width: w, height: h } = await sharp(src).metadata();
  const prof = Buffer.alloc(w * h);

  // Branco = perto, preto = longe.
  //
  // A composição manda: o rasgo de céu no alto do meio é o ponto mais
  // distante, o chão sob os pés do viajante é o mais próximo, e as ruínas
  // das laterais emolduram em profundidade intermediária. Um degradê
  // vertical resolve o grosso; as laterais entram por cima.
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    // sobe devagar no topo (céu e ruína distante) e acelera no chão
    const base = Math.pow(t, 1.5) * 255;
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      // proximidade das bordas: as ruínas laterais estão à frente do campo
      const borda = Math.pow(Math.max(0, 1 - Math.abs(u - 0.5) * 2.4), 2);
      const lateral = (1 - borda) * 90 * (1 - t * 0.5);
      prof[y * w + x] = Math.max(0, Math.min(255, Math.round(base + lateral)));
    }
  }

  await sharp(prof, { raw: { width: w, height: h, channels: 1 } })
    .blur(12)                       // degrau duro no mapa vira rasgo na imagem
    .png({ compressionLevel: 9 })
    .toFile(`${DIR}/arcos-prof.png`);
  console.log(`arcos ${w}x${h}  mapa de profundidade gravado`);
}

if (!fs.existsSync(DIR)) throw new Error(`falta ${DIR}`);
await torre();
await arcos();
console.log('ok');
