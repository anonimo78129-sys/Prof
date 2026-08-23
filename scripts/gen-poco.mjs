// ─────────────────────────────────────────────────────────
// Importador de arte de O POÇO.
//
// A arte deste jogo não é desenhada por código como a de CINZAS: são os
// pacotes de pixel art do GandalfHardcore, comprados/baixados do itch.io.
// Este script pega os .zip já descompactados, renomeia tudo para um
// esquema sem espaço e sem acento, joga em public/assets/poco e gera
// dois subprodutos que o jogo precisa e que não vêm nos pacotes:
//
//   1. as folhas de MINIATURA do criador de personagem — cada peça de
//      roupa/cabelo/chapéu recortada no quadro parado e já composta por
//      cima de um corpo, num atlas só por categoria. Sem isso o criador
//      teria que baixar 285 folhas de 800x448 para desenhar a grade de
//      escolhas;
//   2. src/game/pocoCatalogo.ts, o índice tipado das peças, com rótulo
//      em português tirado do nome do arquivo.
//
// USO
//   node scripts/gen-poco.mjs --src <pasta com os pacotes descompactados>
//
// A pasta de origem NÃO fica versionada: a licença do autor permite usar
// a arte no jogo, mas proíbe redistribuir os pacotes. O que entra no
// repositório é só o recorte que o jogo carrega.
//
// SOBRE O QUE FICA DE FORA
// Roupa de baixo e roupa de banho dos pacotes não entram no catálogo.
// O app é de sala de aula e o corpo base já vem com short desenhado, ou
// seja, essas peças não vestiriam nada que já não esteja vestido.
// ─────────────────────────────────────────────────────────
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const SRC = argv[argv.indexOf('--src') + 1];
if (!SRC || !fs.existsSync(SRC)) {
  console.error('uso: node scripts/gen-poco.mjs --src <pasta com os pacotes descompactados>');
  process.exit(1);
}

const OUT = 'public/assets/poco';
const CATALOGO = 'src/game/pocoCatalogo.ts';

// Quadro da folha de personagem: 80x64, grade de 10 colunas por 7 linhas.
// (As orelhas élficas vêm em 9 colunas — falta só o último quadro da
// morte, e como a coluna é a mesma medida o recorte não muda.)
const QL = 80, QA = 64;

// ── utilidades ──────────────────────────────────────────

const semAcento = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** "Blue Bodice Long Sleeves.png" → "blue-bodice-long-sleeves" */
function slug(nome) {
  return semAcento(path.basename(nome, path.extname(nome)))
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .replace(/(\d)([a-zA-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── rótulo em português ─────────────────────────────────
//
// O nome do arquivo é a única descrição que os pacotes trazem, então é
// dele que sai o rótulo do criador de personagem. Como são 285 peças, a
// tradução é por palavra e não por arquivo — e aí aparecem os dois
// problemas do inglês:
//
//   1. a ordem. "Blue Corset" traduzido palavra a palavra vira "Azul
//      corpete". Por isso o núcleo (a peça em si) é reconhecido e puxado
//      para a frente, o resto vem atrás e a cor vai para o fim;
//   2. a concordância. Em inglês "blue" serve para tudo; em português a
//      cor tem que casar com "meias" (femininas, plural) e com "vestido"
//      (masculino, singular). Daí a cor ter as quatro formas na tabela.

/** trechos que só fazem sentido juntos, trocados antes de separar em palavras */
const FRASES = [
  // o núcleo continua em inglês do lado direito de propósito: é ele que
  // decide o gênero e o número com que a cor vai concordar depois
  ['thigh-high-boots', 'boots-de-cano-alto'],
  ['opera-gloves', 'gloves-de-baile'],
  ['face-paint', 'paint-de-rosto'],
  ['split-hose', 'hose-bicolor'],
  ['long-sleeves', 'de-manga-longa'],
  ['mid-sleeves', 'de-manga-média'],
  ['with-horns', 'com-chifres'],
  ['tied-up', 'amarrado'],
  ['v-2', 'ii'],
];

/** cor nas quatro formas: masculino, feminino, e os dois no plural */
const CORES = {
  blue:    ['azul', 'azul', 'azuis', 'azuis'],
  green:   ['verde', 'verde', 'verdes', 'verdes'],
  red:     ['vermelho', 'vermelha', 'vermelhos', 'vermelhas'],
  purple:  ['roxo', 'roxa', 'roxos', 'roxas'],
  orange:  ['laranja', 'laranja', 'laranja', 'laranja'],
  brown:   ['marrom', 'marrom', 'marrons', 'marrons'],
  black:   ['preto', 'preta', 'pretos', 'pretas'],
  white:   ['branco', 'branca', 'brancos', 'brancas'],
  pink:    ['rosa', 'rosa', 'rosa', 'rosa'],
  yellow:  ['amarelo', 'amarela', 'amarelos', 'amarelas'],
  skyblue: ['celeste', 'celeste', 'celestes', 'celestes'],
  golden:  ['dourado', 'dourada', 'dourados', 'douradas'],
  silver:  ['prateado', 'prateada', 'prateados', 'prateadas'],
};

/** a peça em si: o que for encontrado aqui vira a primeira palavra */
const NUCLEOS = {
  hair:      ['cabelo', 'm'],
  hat:       ['chapéu', 'm'],
  cap:       ['boné', 'm'],
  helmet:    ['elmo', 'm'],
  mask:      ['máscara', 'f'],
  shirt:     ['camisa', 'f'],
  pants:     ['calça', 'f'],
  boots:     ['botas', 'fp'],
  shoes:     ['sapatos', 'mp'],
  socks:     ['meias', 'fp'],
  skirt:     ['saia', 'f'],
  dress:     ['vestido', 'm'],
  corset:    ['corpete', 'm'],
  bodice:    ['colete', 'm'],
  gloves:    ['luvas', 'fp'],
  glove:     ['luva', 'f'],
  chainmail: ['cota de malha', 'f'],
  hose:      ['calção', 'm'],
  paint:     ['pintura', 'f'],
  ears:      ['orelhas', 'fp'],
  scarf:     ['lenço', 'm'],
  sword:     ['espada', 'f'],
  axe:       ['machado', 'm'],
  pickaxe:   ['picareta', 'f'],
  hoe:       ['enxada', 'f'],
  stick:     ['graveto', 'm'],
  flower:    ['flor', 'f'],
  basket:    ['cesta', 'f'],
  skin:      ['pele', 'f'],
  blindfold: ['venda', 'f'],
};

/** todo o resto: qualificador, some do rótulo se traduzir para vazio */
const PALAVRAS = {
  short: 'curta', long: 'longo', armored: 'de placas', fancy: 'de gala',
  elven: 'élficas', bunny: 'de coelho', witch: 'de bruxa', pumpkin: 'de abóbora',
  santa: 'de papai noel', viking: 'viking', guard: 'de guarda', mining: 'de mineiro',
  farming: 'de palha', plague: 'de peste', bandit: 'de bandido',
  queen: 'de rainha', shield: 'de escudeira', maiden: '',
  wooden: 'de madeira', iron: 'de ferro', bronze: 'de bronze', diamond: 'de diamante',
  demon: 'de demônio', devil: 'de diabo', ghost: 'de fantasma',
  orc: 'de orc', zombie: 'de zumbi',
  ii: 'II',
  male: '', female: '', f: '', m: '',
};

function rotulo(nome) {
  let s = slug(nome);
  for (const [de, para] of FRASES) s = s.split(de).join(para);

  const cru = s.split('-').filter(Boolean);
  let nucleo = null, genero = 'm', numero = '', cor = null;
  const meio = [];
  for (const p of cru) {
    if (/^\d+$/.test(p)) { numero = p; continue; }
    if (!nucleo && NUCLEOS[p]) { [nucleo, genero] = NUCLEOS[p]; continue; }
    if (CORES[p]) { cor = p; continue; }
    const t = p in PALAVRAS ? PALAVRAS[p] : p;
    if (t) meio.push(t);
  }

  const forma = { m: 0, f: 1, mp: 2, fp: 3 }[genero];
  const partes = [nucleo, ...meio, cor && CORES[cor][forma], numero].filter(Boolean);
  if (!partes.length) return slug(nome);
  const texto = partes.join(' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function achar(...trechos) {
  // os pacotes trazem pastas com nome comprido e espaço; procurar pelo
  // trecho evita repetir "GandalfHardcore 43x Female Clothing" no código
  const pilha = [SRC];
  const achados = [];
  while (pilha.length) {
    const dir = pilha.pop();
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) pilha.push(p);
      else if (/\.png$/i.test(e.name)) achados.push(p);
    }
  }
  // O trecho tem que casar no comeco de uma palavra do caminho: sem isso
  // "Male Hair" acha tambem "Female Hair", que e o mesmo texto com duas
  // letras na frente, e as pastas dos pacotes se chamam exatamente assim.
  const regras = trechos.map((t) =>
    new RegExp('(^|[/\\\\ ])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  return achados
    .filter((p) => regras.every((r) => r.test(p)))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

function garante(dir) { fs.mkdirSync(dir, { recursive: true }); }

// peças que não entram: o corpo base já vem de short, então roupa de
// baixo e de banho não vestiriam nada — e o app é de sala de aula
const VETADO = /panties|bikini|underwear|swim trunks|DONT FORGET/i;

// ── 1. peças de personagem ──────────────────────────────

/**
 * Cada entrada vira uma pasta em public/assets/poco e uma lista no
 * catálogo. `fatias` diz de quais pastas de origem a peça sai, e com que
 * sexo do corpo ela casa — as folhas são desenhadas em cima de um corpo
 * específico e não servem no outro.
 */
const CAMADAS = [
  { id: 'corpo', fatias: [
      { sexo: 'm', trechos: ['Character skin colors', 'Male Skin'] },
      { sexo: 'm', trechos: ['Special skin', 'Male'] },
      { sexo: 'f', trechos: ['Character skin colors', 'Female Skin'] },
      { sexo: 'f', trechos: ['Special skin', 'Female'] },
  ] },
  { id: 'orelha', fatias: [
      { sexo: 'm', trechos: ['Elven ears', 'Male Ears'] },
      { sexo: 'f', trechos: ['Elven ears', 'Female Ears'] },
  ] },
  { id: 'cabelo', fatias: [
      { sexo: 'm', trechos: ['Character Asset Pack', 'Male Hair'] },
      { sexo: 'm', trechos: ['58x Hair', 'Male Hair'] },
      { sexo: 'f', trechos: ['Character Asset Pack', 'Female Hair'] },
      { sexo: 'f', trechos: ['58x Hair', 'Female Hair'] },
  ] },
  { id: 'roupa', fatias: [
      { sexo: 'm', trechos: ['Character Asset Pack', 'Male Clothing'] },
      { sexo: 'm', trechos: ['7x Male Clothing'] },
      { sexo: 'f', trechos: ['Character Asset Pack', 'Female Clothing'] },
      { sexo: 'f', trechos: ['43x Female Clothing'] },
  ] },
  { id: 'braco', fatias: [
      { sexo: 'm', trechos: ['Arm Layers', 'Male'] },
      { sexo: 'f', trechos: ['Arm Layers', 'Female'] },
  ] },
  { id: 'chapeu', fatias: [
      { sexo: 'm', trechos: ['39x Hats', 'Male Hat'] },
      { sexo: 'f', trechos: ['39x Hats', 'Female Hat'] },
  ] },
  { id: 'mascara', fatias: [
      { sexo: 'm', trechos: ['Masks', 'Male'] },
      { sexo: 'f', trechos: ['Masks', 'Female'] },
  ] },
  { id: 'mao', fatias: [
      { sexo: 'm', trechos: ['Character Asset Pack', 'Male Hand'] },
      { sexo: 'm', trechos: ['Hand Items', 'Male Hand'] },
      { sexo: 'f', trechos: ['Character Asset Pack', 'Female Hand'] },
      { sexo: 'f', trechos: ['Hand Items', 'Female Hand'] },
  ] },
  { id: 'amarras', fatias: [
      { sexo: 'm', trechos: ['Hostage Layers', 'Male'] },
      { sexo: 'f', trechos: ['Hostage Layers', 'Female'] },
  ] },
];

const catalogo = {};

for (const camada of CAMADAS) {
  catalogo[camada.id] = { m: [], f: [] };
  for (const fatia of camada.fatias) {
    for (const origem of achar(...fatia.trechos)) {
      if (VETADO.test(origem)) continue;
      const nome = slug(origem) + '.png';
      const destino = path.join(OUT, camada.id, fatia.sexo, nome);
      garante(path.dirname(destino));
      fs.copyFileSync(origem, destino);
      const ja = catalogo[camada.id][fatia.sexo];
      if (!ja.some((i) => i.id === nome)) ja.push({ id: nome, rotulo: rotulo(origem) });
    }
  }
  const n = catalogo[camada.id].m.length + catalogo[camada.id].f.length;
  console.log(`  ${camada.id.padEnd(9)} ${String(n).padStart(3)} peças`);
}

// ── 2. miniaturas do criador ────────────────────────────
//
// A grade de escolhas mostra a peça já vestida: peça solta no vazio (um
// cabelo boiando, uma camisa sem ninguém dentro) é ilegível. Cada célula
// é o quadro parado, recortado no busto, com um corpo por baixo.

const MINI_L = 40, MINI_A = 60, MINI_COLS = 8;
// dentro do quadro de 80x64 o boneco ocupa x 20..59 e y 4..63: o recorte
// é esse, e não o quadro inteiro, senão metade da célula é vazio
const RECORTE = { left: 20, top: 4, width: MINI_L, height: MINI_A };

// Debaixo das peças que não são roupa (cabelo, chapéu, máscara, item de
// mão) vai um corpo já vestido — camisa e calça. Sem isso a grade de
// chapéus vira uma fileira de gente de cueca, o que não ajuda ninguém a
// escolher um chapéu.
const VESTE_BASE = {
  m: ['shirt.png', 'pants.png', 'shoes.png'],
  f: ['corset.png', 'skirt.png', 'boots.png'],
};

async function quadroParado(arquivo) {
  return sharp(arquivo).extract({ left: 0, top: 0, width: QL, height: QA })
    .extract(RECORTE).png().toBuffer();
}

garante(path.join(OUT, 'previa'));

for (const camada of CAMADAS) {
  for (const sexo of ['m', 'f']) {
    const itens = catalogo[camada.id][sexo];
    if (!itens.length) continue;
    // o corpo entra por baixo de tudo que não é corpo; a veste, só por
    // baixo do que não é roupa (senão a peça escolhida some atrás dela)
    const fundo = [];
    if (camada.id !== 'corpo') {
      fundo.push(path.join(OUT, 'corpo', sexo, catalogo.corpo[sexo][0].id));
      if (camada.id !== 'roupa') {
        for (const peca of VESTE_BASE[sexo]) {
          const p = path.join(OUT, 'roupa', sexo, peca);
          if (fs.existsSync(p)) fundo.push(p);
        }
      }
    }
    const fundoPronto = await Promise.all(fundo.map(quadroParado));
    const cols = Math.min(MINI_COLS, itens.length);
    const linhas = Math.ceil(itens.length / cols);
    const camadasImg = [];
    for (let i = 0; i < itens.length; i++) {
      const left = (i % cols) * MINI_L, top = Math.floor(i / cols) * MINI_A;
      for (const input of fundoPronto) camadasImg.push({ input, left, top });
      camadasImg.push({
        input: await quadroParado(path.join(OUT, camada.id, sexo, itens[i].id)),
        left, top,
      });
    }
    await sharp({ create: {
      width: cols * MINI_L, height: linhas * MINI_A, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    } }).composite(camadasImg).png()
      .toFile(path.join(OUT, 'previa', `${camada.id}-${sexo}.png`));
  }
}
console.log('  prévias   geradas');

// ── 3. bichos, inimigos e HUD ───────────────────────────

const AVULSOS = [
  // arqueiro: 11 colunas x 5 linhas de 64x64
  ['arqueiro/sentinela.png',        ['Archer', 'Archer sheet']],
  ['arqueiro/sentinela-preta.png',  ['Archer', 'black sheet']],
  ['arqueiro/sentinela-azul.png',   ['Archer', 'blue sheet']],
  ['arqueiro/sentinela-marrom.png', ['Archer', 'brown sheet']],
  ['arqueiro/sentinela-verde.png',  ['Archer', 'green sheet']],
  ['arqueiro/sentinela-roxa.png',   ['Archer', 'purple sheet']],
  ['arqueiro/sentinela-vermelha.png', ['Archer', 'red sheet']],
  ['arqueiro/sentinela-amarela.png',['Archer', 'yellow sheet']],
  ['arqueiro/flecha.png',           ['Archer', 'arrow']],
  // companheiro: 6 colunas x 2 linhas de 32x32
  ['bicho/cao.png',           ['Pet companion', 'doggy sheet.png']],
  ['bicho/cao-2.png',         ['Pet companion', 'doggy sheet 2']],
  ['bicho/cao-3.png',         ['Pet companion', 'doggy sheet 3']],
  ['bicho/cao-4.png',         ['Pet companion', 'doggy sheet 4']],
  ['bicho/cao-5.png',         ['Pet companion', 'doggy sheet 5']],
  ['bicho/cao-chapeu.png',    ['Pet companion', 'doggy hat']],
  ['bicho/cao-mochila.png',   ['Pet companion', 'doggy backpack']],
  ['bicho/raposa.png',        ['Pet companion', 'fox.png']],
  ['bicho/fogo-fatuo.png',    ['Pet companion', 'Wisp with outline']],
  // HUD
  ['hud/moldura.png',   ['Hp bar', 'Hp bar.png']],
  ['hud/barra-vida.png',['Hp bar', 'red bar']],
  ['hud/barra-ar.png',  ['Hp bar', 'Blue bar']],
  ['hud/barra-ouro.png',['Hp bar', 'yellow bar']],
  ['hud/emoji.png',     ['Emojis and Icons', 'Emoji.png']],
  ['hud/moeda.png',     ['Emojis and Icons', 'Coin.png']],
  ['hud/marcador.png',  ['Emojis and Icons', 'Quest marker']],
];

// cenário: o pacote de plataforma inteiro, com nome traduzido
const CENARIO = [
  ['cenario/piso-1.png',    ['Floor Tiles1']],
  ['cenario/piso-2.png',    ['Floor Tiles2']],
  ['cenario/outros-1.png',  ['Other Tiles1']],
  ['cenario/outros-2.png',  ['Other Tiles2']],
  ['cenario/casa.png',      ['House Tiles']],
  ['cenario/decor.png',     ['Platformer Assets/Decor.png']],
  ['cenario/horta.png',     ['Garden Decorations']],
  ['cenario/terra-1.png',   ['BG Dirt1']],
  ['cenario/terra-2.png',   ['BG Dirt2']],
  ['cenario/minerio.png',   ['Ores']],
  ['cenario/forja.png',     ['Furnace and Sawmill']],
  ['cenario/alquimia.png',  ['Alchemy Decor']],
  ['cenario/cozinha.png',   ['Cooking area']],
  ['cenario/trigo.png',     ['Wheat']],
  ['cenario/tocha.png',     ['Torch.png']],
  ['cenario/barco.png',     ['Boat']],
  ['cenario/estatua.png',   ['Angel Statue']],
  ['cenario/bonsai.png',    ['Bonsai']],
  ['cenario/tenda-p.png',   ['Small Tent']],
  ['cenario/tenda-g.png',   ['Large Tent']],
  ['cenario/capim.png',     ['Tall Grass']],
  ['cenario/pinheiros.png', ['Pine Trees.png']],
  ['cenario/pinheiral.png', ['Pine forest sheet']],
  ['cenario/pinheiro-g.png',['Large Pine Tree']],
  ['cenario/natal.png',     ['Christmas tree']],
  ['cenario/arvore-1.png',  ['Tree1']],
  ['cenario/arvore-2.png',  ['Tree2']],
  ['cenario/arvore-3.png',  ['Tree3']],
  ['cenario/arvore-4.png',  ['Tree4']],
  ['cenario/betula-1.png',  ['Birch1']],
  ['cenario/betula-2.png',  ['Birch2']],
  ['cenario/betula-3.png',  ['Birch3']],
  ['cenario/salgueiro-1.png',['Weeping Willow1']],
  ['cenario/salgueiro-2.png',['Weeping Willow2']],
  ['cenario/salgueiro-3.png',['Weeping Willow3']],
  ['cenario/florida.png',   ['Flowering Tree']],
  ['cenario/sol.png',       ['sun.png']],
  ['cenario/balao.png',     ['hot air balloon']],
  ['cenario/nuvem-1.png',   ['cloud1']],
  ['cenario/nuvem-2.png',   ['cloud2']],
  ['cenario/nuvem-3.png',   ['cloud3']],
  ['cenario/nuvem-4.png',   ['cloud4']],
  ['cenario/nuvem-5.png',   ['cloud5']],
  ['cenario/nuvem-6.png',   ['cloud6']],
  ['cenario/passaro-1.png', ['birds1']],
  ['cenario/passaro-2.png', ['birds2']],
  ['cenario/passaro-3.png', ['birds3']],
  ['cenario/passaro-4.png', ['birds4']],
  ['cenario/fogueira.png',  ['Campfire sheet']],
  ['cenario/fogueira-comida.png', ['Campfire with food']],
  ['cenario/portal.png',    ['Portal sheet']],
  ['cenario/agua.png',      ['Water Tiles sheet']],
  ['cenario/agua-larga.png',['Animated Water Tiles']],
  ['cenario/nevasca.png',   ['Snow blizzard']],
];

const ESTACOES = [['verao', 'Normal BG'], ['outono', 'Autumn BG'], ['inverno', 'Winter BG']];

for (const [destino, trechos] of [...AVULSOS, ...CENARIO]) {
  const [origem] = achar(...trechos);
  if (!origem) { console.warn(`  ! não achei ${trechos.join(' + ')}`); continue; }
  const alvo = path.join(OUT, destino);
  garante(path.dirname(alvo));
  fs.copyFileSync(origem, alvo);
}

for (const [estacao, pasta] of ESTACOES) {
  for (let i = 1; i <= 5; i++) {
    const [origem] = achar(pasta, `layers_layer ${i}`);
    if (!origem) continue;
    const alvo = path.join(OUT, 'fundo', estacao, `camada-${i}.png`);
    garante(path.dirname(alvo));
    fs.copyFileSync(origem, alvo);
  }
  const [castelo] = achar(pasta, 'Background Castle');
  if (castelo) fs.copyFileSync(castelo, path.join(OUT, 'fundo', estacao, 'castelo.png'));
}
// ── capa do cartão da tela inicial ──────────────────────
//
// A capa é a cena montada — as cinco camadas do fundo com uma árvore
// grande na frente — e depois APAGADA: uma demão azul-escura e uma
// vinheta, os mesmos dois passos que o jogo dá em cima de cada quadro.
// Sem isso o cartão promete um passeio no mato, que é exatamente o
// contrário do que o jogo entrega.
{
  const L = 1024, A = 346;
  const camadas = [];
  for (let n = 5; n >= 1; n--) {
    const arquivo = path.join(OUT, 'fundo', 'inverno', `camada-${n}.png`);
    if (fs.existsSync(arquivo)) camadas.push({ input: arquivo, left: 0, top: 0 });
  }
  const arvore = path.join(OUT, 'cenario', 'arvore-4.png');
  if (fs.existsSync(arvore)) camadas.push({ input: arvore, left: 660, top: 138 });
  const pinheiro = path.join(OUT, 'cenario', 'pinheiro-g.png');
  if (fs.existsSync(pinheiro)) camadas.push({ input: pinheiro, left: 96, top: 170 });

  if (camadas.length) {
    const cena = await sharp({ create: {
      width: L, height: A, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 },
    } }).composite(camadas).png().toBuffer();

    const tinta = Buffer.from(
      `<svg width="${L}" height="${A}"><rect width="${L}" height="${A}" fill="#0a1230" opacity="0.52"/></svg>`);
    // a vinheta é uma elipse clara no meio de um retângulo escuro,
    // borrada — do mesmo jeito que o jogo faz com createRadialGradient
    const vinheta = Buffer.from(
      `<svg width="${L}" height="${A}">
         <defs><radialGradient id="v" cx="50%" cy="52%" r="62%">
           <stop offset="45%" stop-color="#000" stop-opacity="0"/>
           <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
         </radialGradient></defs>
         <rect width="${L}" height="${A}" fill="url(#v)"/>
       </svg>`);

    await sharp(cena)
      .composite([{ input: tinta }, { input: vinheta }])
      .png().toFile(path.join(OUT, 'capa.png'));
    console.log('  capa      gerada');
  }
}

console.log('  cenário   copiado');

// ── 4. catálogo tipado ──────────────────────────────────

const linhas = [
  '// ─────────────────────────────────────────────────────────',
  '// GERADO por scripts/gen-poco.mjs — não editar à mão.',
  '//',
  '// Índice das peças do criador de personagem de O POÇO. O rótulo sai',
  '// do nome do arquivo original, traduzido palavra por palavra pelo',
  '// dicionário do gerador.',
  '// ─────────────────────────────────────────────────────────',
  '',
  'export interface PecaCatalogo { id: string; rotulo: string }',
  'export type Sexo = \'m\' | \'f\';',
  'export type Camada = ' + CAMADAS.map((c) => `'${c.id}'`).join(' | ') + ';',
  '',
  'export const CATALOGO: Record<Camada, Record<Sexo, PecaCatalogo[]>> = {',
];
for (const camada of CAMADAS) {
  linhas.push(`  ${camada.id}: {`);
  for (const sexo of ['m', 'f']) {
    const itens = catalogo[camada.id][sexo]
      .map((i) => `      { id: '${i.id}', rotulo: ${JSON.stringify(i.rotulo)} },`);
    linhas.push(`    ${sexo}: [`, ...itens, '    ],');
  }
  linhas.push('  },');
}
linhas.push('};', '');
linhas.push('/** quantas colunas tem cada atlas de miniatura, e o tamanho da célula */');
linhas.push(`export const PREVIA = { cols: ${MINI_COLS}, l: ${MINI_L}, a: ${MINI_A} } as const;`, '');

fs.writeFileSync(CATALOGO, linhas.join('\n'));
console.log(`  catálogo  ${CATALOGO}`);
console.log('pronto.');
