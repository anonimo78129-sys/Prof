import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as U from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  matConcreto, matPiso, matMadeira, matTerra, matMetal, matVidro,
  texturaFolha, texturaFlor, fbm, normalDe,
} from './materiais';

// ─────────────────────────────────────────────────────────
// O NÚCLEO VERDE, SEM BLOCO
//
// Mesma planta baixa da versão em voxel — mesmas quatro bancadas, nas
// mesmas coordenadas, para a história não mudar de lugar. O que muda é
// como o lugar é construído:
//
//   ABÓBADA   arco elíptico de verdade, com nervura tubular e casca de
//             vidro contínua, em vez de escadinha de cubos
//   CHÃO      plano subdividido e deslocado, então o monte de terra é uma
//             curva, não um degrau
//   MÓVEIS    caixas chanfradas (RoundedBoxGeometry): quina viva é o que
//             faz objeto parecer maquete
//   PLANTA    folha recortada de verdade, em cartão curvado, instanciada
//             aos milhares e balançando por shader de vértice
//
// Tudo em instância: o galpão inteiro sai em pouco mais de vinte chamadas
// de desenho, o que é o que permite ligar sombra e oclusão no celular.
// ─────────────────────────────────────────────────────────

export const MEIA_LARGURA = 21;
export const Z_FRENTE = 44, Z_FUNDO = -46;
export const PAREDE = 7, ARCO = 10;          // arco: elipse de raio 21 x 10

/** Altura do piso em cada ponto. Mezanino, escada e o monte de terra. */
export function alturaEm(x: number, z: number) {
  if (z >= 30 && Math.abs(x) <= 9) return 4.5;
  if (z >= 22 && z < 30 && Math.abs(x) <= 5.2) return 4.5 * (z - 22) / 8;
  const d = Math.hypot((x + 1) / 13, (z + 32) / 9.5);
  return d < 1 ? 1.15 * (1 - d * d) : 0;
}

/** Caixas que barram o passo. */
export interface Barreira { x0: number; x1: number; z0: number; z1: number }
const barreiras: Barreira[] = [];
const barra = (x0: number, z0: number, x1: number, z1: number) =>
  barreiras.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });

export function bloqueado(x: number, z: number) {
  if (Math.abs(x) > MEIA_LARGURA - 1 || z > Z_FRENTE - 1 || z < Z_FUNDO + 1.5) return true;
  return barreiras.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
}

// ── curva da abóbada ─────────────────────────────────────

/** Ponto do arco elíptico para t em 0..1 (de uma parede à outra). */
function noArco(t: number) {
  const a = Math.PI * (1 - t);
  return new THREE.Vector2(Math.cos(a) * MEIA_LARGURA, PAREDE + Math.sin(a) * ARCO);
}

/** Casca contínua de vidro: uma malha só, de parede a parede. */
function cascaDeVidro() {
  const nt = 48, nz = 2;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= nz; j++) {
    const z = Z_FUNDO + (Z_FRENTE - Z_FUNDO) * (j / nz);
    for (let i = 0; i <= nt; i++) {
      const p = noArco(i / nt);
      pos.push(p.x, p.y, z);
      uv.push(i / nt, j);
    }
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nt; i++) {
    const a = j * (nt + 1) + i, b = a + 1, c = a + nt + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Nervura: tubo seguindo o arco. */
function nervura() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const p = noArco(i / 40);
    pts.push(new THREE.Vector3(p.x, p.y, 0));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.17, 5, false);
}

// ── vegetação ────────────────────────────────────────────

/**
 * Cartão de folha com uma curva: folha plana lê como adesivo.
 * Três divisões no comprimento e nenhuma na largura. A versão anterior
 * tinha 3x6 e gastava 36 triângulos POR FOLHA — com milhares de folhas
 * na estufa isso sozinho passava de trezentos mil triângulos por quadro,
 * para uma curvatura que ninguém enxerga.
 */
function cartaoFolha(larg: number, alt: number, curva: number) {
  const g = new THREE.PlaneGeometry(larg, alt, 1, 3);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i) + alt / 2;
    p.setZ(i, -Math.pow(Math.max(0, y) / alt, 1.6) * curva - (x * x) / larg * 0.35);
    p.setY(i, y);
  }
  g.computeVertexNormals();
  return g;
}

/** Faz a folhagem balançar sem custo de CPU: o vento mora no vértice. */
function comVento(mat: THREE.Material, forca: number) {
  const relogio = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTempo = relogio;
    shader.vertexShader = 'uniform float uTempo;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float fase = instanceMatrix[3].x * 0.6 + instanceMatrix[3].z * 0.45;
       float balanco = sin(uTempo * 1.15 + fase) * 0.6 + sin(uTempo * 2.3 + fase * 1.7) * 0.4;
       float peso = max(0.0, transformed.y);
       transformed.x += balanco * ${forca.toFixed(3)} * peso;
       transformed.z += balanco * ${(forca * 0.55).toFixed(3)} * peso;`,
    );
  };
  mat.needsUpdate = true;
  return relogio;
}

const acaso = (() => {
  let s = 20260818;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
})();

interface Semeadura {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  poses: THREE.Matrix4[];
  /** folhagem não projeta sombra: são milhares de cartões, e desenhar
   *  todos de novo no mapa de sombra dobrava o custo do quadro inteiro
   *  em troca de um rendilhado que ninguém repara */
  sombra?: boolean;
}

function instancia(s: Semeadura) {
  const m = new THREE.InstancedMesh(s.geo, s.mat, s.poses.length);
  s.poses.forEach((p, i) => m.setMatrixAt(i, p));
  m.instanceMatrix.needsUpdate = true;
  m.castShadow = s.sombra ?? true;
  m.receiveShadow = true;
  m.frustumCulled = false;
  return m;
}

// ── o cenário ────────────────────────────────────────────

export interface Cenario {
  grupo: THREE.Group;
  /** relógios de vento, avançados a cada quadro */
  ventos: { value: number }[];
  agua: THREE.MeshStandardMaterial;
  lampadas: THREE.Object3D[];
}

export function montaCenario(): Cenario {
  barreiras.length = 0;
  const grupo = new THREE.Group();
  const ventos: { value: number }[] = [];
  const lampadas: THREE.Object3D[] = [];

  const concreto = matConcreto(8);
  const piso = matPiso(18);
  const madeira = matMadeira(2);
  const terra = matTerra(6);
  const aco = matMetal(0x9fadb6, 0.48);
  const acoEscuro = matMetal(0x55616b, 0.6);
  const vidro = matVidro();

  const põe = (m: THREE.Object3D, sombra = true) => {
    m.castShadow = sombra; m.receiveShadow = true;
    grupo.add(m); return m;
  };

  // ── chão: plano deslocado, então o monte é curva e não degrau ──
  // divisão só o bastante para o monte ficar liso: 120x200 dava quarenta
  // e oito mil triângulos num chão que é quase todo plano
  const chaoGeo = new THREE.PlaneGeometry(
    MEIA_LARGURA * 2, Z_FRENTE - Z_FUNDO, 34, 64,
  ).rotateX(-Math.PI / 2);
  chaoGeo.translate(0, 0, (Z_FRENTE + Z_FUNDO) / 2);
  {
    const p = chaoGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const d = Math.hypot((x + 1) / 13, (z + 32) / 9.5);
      p.setY(i, d < 1 ? 1.15 * (1 - d * d) : 0);
    }
    chaoGeo.computeVertexNormals();
  }
  const chao = new THREE.Mesh(chaoGeo, piso);
  chao.receiveShadow = true;
  grupo.add(chao);

  // terra por cima do monte, um pouco menor que ele
  const monteGeo = new THREE.CircleGeometry(12.6, 64).rotateX(-Math.PI / 2);
  {
    const p = monteGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) - 1, z = p.getZ(i) - 32;
      const d = Math.hypot((x + 1) / 13, (z + 32) / 9.5);
      p.setY(i, (d < 1 ? 1.15 * (1 - d * d) : 0) + 0.02);
    }
    monteGeo.computeVertexNormals();
  }
  const monte = new THREE.Mesh(monteGeo, terra);
  monte.position.set(-1, 0, -32);
  monte.receiveShadow = true;
  grupo.add(monte);

  // ── paredes laterais, com pilastra a cada oito metros ──
  for (const lado of [-1, 1]) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, PAREDE, Z_FRENTE - Z_FUNDO), concreto,
    );
    p.position.set(lado * (MEIA_LARGURA + 0.6), PAREDE / 2, (Z_FRENTE + Z_FUNDO) / 2);
    põe(p);
    for (let z = Z_FUNDO + 5; z < Z_FRENTE; z += 8) {
      const pil = new THREE.Mesh(new RoundedBoxGeometry(1.1, PAREDE + 0.4, 1.6, 2, 0.08), concreto);
      pil.position.set(lado * (MEIA_LARGURA - 0.4), (PAREDE + 0.4) / 2, z);
      põe(pil);
    }
  }

  // parede do fundo, com o portão para o resto do Silo
  const fundo = new THREE.Mesh(new THREE.BoxGeometry(MEIA_LARGURA * 2 + 2, PAREDE + ARCO, 1.4), concreto);
  fundo.position.set(0, (PAREDE + ARCO) / 2, Z_FUNDO - 0.7);
  põe(fundo);
  const portal = new THREE.Mesh(new RoundedBoxGeometry(7.4, 5.2, 1.1, 2, 0.12), acoEscuro);
  portal.position.set(0, 2.6, Z_FUNDO + 0.2);
  põe(portal);

  // janelão redondo por cima do portão: sem ele o fundo era um paredão
  // bege de vinte metros e o olho não tinha para onde ir
  const rosacea = new THREE.Mesh(new THREE.CircleGeometry(5.2, 48), vidro);
  rosacea.position.set(0, 11, Z_FUNDO + 0.1);
  grupo.add(rosacea);
  const aroGeo = new THREE.TorusGeometry(5.3, 0.22, 8, 48);
  const aro = new THREE.Mesh(aroGeo, aco);
  aro.position.set(0, 11, Z_FUNDO + 0.15);
  põe(aro);
  for (let i = 0; i < 6; i++) {
    const raio = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 10.4, 6), aco);
    raio.position.set(0, 11, Z_FUNDO + 0.15);
    raio.rotation.z = (i / 6) * Math.PI;
    põe(raio);
  }
  // recorte de céu atrás da rosácea, para ela ler como abertura
  const ceuFundo = new THREE.Mesh(
    new THREE.CircleGeometry(5.1, 48),
    new THREE.MeshBasicMaterial({ color: 0x9cc4ee }),
  );
  ceuFundo.position.set(0, 11, Z_FUNDO - 0.1);
  grupo.add(ceuFundo);

  // ── abóbada ──
  const casca = new THREE.Mesh(cascaDeVidro(), vidro);
  casca.renderOrder = 3;
  grupo.add(casca);

  const nerv = nervura();
  const posesNerv: THREE.Matrix4[] = [];
  for (let z = Z_FUNDO; z <= Z_FRENTE; z += 4.5)
    posesNerv.push(new THREE.Matrix4().makeTranslation(0, 0, z));
  const nervuras = instancia({ geo: nerv, mat: aco, poses: posesNerv });
  nervuras.castShadow = true;
  grupo.add(nervuras);

  // longarinas ligando as nervuras
  for (const t of [0.16, 0.32, 0.5, 0.68, 0.84]) {
    const p = noArco(t);
    const l = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, Z_FRENTE - Z_FUNDO, 6).rotateX(Math.PI / 2), aco,
    );
    l.position.set(p.x, p.y, (Z_FRENTE + Z_FUNDO) / 2);
    põe(l);
  }

  // ── colunas da nave ──
  for (const lado of [-1, 1]) for (let z = Z_FUNDO + 8; z < Z_FRENTE - 8; z += 9) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, PAREDE + 1.6, 12), aco);
    c.position.set(lado * 14.5, (PAREDE + 1.6) / 2, z);
    põe(c);
    barra(lado * 14.5 - 0.5, z - 0.5, lado * 14.5 + 0.5, z + 0.5);
    // consolo curvo ligando a coluna à parede
    const braco = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.14, 6, 12, Math.PI / 2), aco);
    braco.position.set(lado * 14.5, PAREDE + 1.6, z);
    braco.rotation.z = lado > 0 ? Math.PI : Math.PI / 2;
    braco.rotation.y = Math.PI / 2;
    põe(braco);
  }

  // ── luminárias suspensas ──
  const cupula = new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)
    .rotateX(Math.PI);
  const luzMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d0, emissive: 0xffd89a, emissiveIntensity: 3.2, roughness: 0.4,
  });
  for (const lado of [-1, 1]) for (let z = Z_FUNDO + 8; z < Z_FRENTE - 8; z += 9) {
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 5), acoEscuro);
    haste.position.set(lado * 9.5, PAREDE + 1.2, z);
    grupo.add(haste);
    const l = new THREE.Mesh(cupula, luzMat);
    l.position.set(lado * 9.5, PAREDE + 0.4, z);
    grupo.add(l);
    lampadas.push(l);
  }

  // ── mezanino de chegada e escada ──
  const laje = new THREE.Mesh(new RoundedBoxGeometry(18.4, 0.5, 14.4, 2, 0.06), madeira);
  laje.position.set(0, 4.25, 37);
  põe(laje);
  for (const x of [-8.4, 8.4]) for (const z of [30.8, 43.2]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 10), aco);
    c.position.set(x, 2, z);
    põe(c);
    barra(x - 0.4, z - 0.4, x + 0.4, z + 0.4);
  }
  // degraus
  for (let i = 0; i < 16; i++) {
    const z = 22 + (i * 8) / 16;
    const y = 4.5 * (i / 16);
    const d = new THREE.Mesh(new THREE.BoxGeometry(10.4, y + 0.3, 0.55), concreto);
    d.position.set(0, (y + 0.3) / 2, z + 0.27);
    põe(d);
  }
  // guarda-corpo do mezanino: montante e dois corrimãos
  const corrimao = (x0: number, z0: number, x1: number, z1: number) => {
    const dx = x1 - x0, dz = z1 - z0, comp = Math.hypot(dx, dz);
    for (const h of [1.05, 0.6]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, comp, 6), aco);
      t.position.set((x0 + x1) / 2, 4.5 + h, (z0 + z1) / 2);
      t.rotation.z = Math.PI / 2;
      t.rotation.y = -Math.atan2(dz, dx);
      põe(t);
    }
    const n = Math.max(2, Math.round(comp / 1.6));
    for (let i = 0; i <= n; i++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 6), aco);
      m.position.set(x0 + (dx * i) / n, 5.05, z0 + (dz * i) / n);
      põe(m);
    }
  };
  corrimao(-9, 30.2, -5.4, 30.2);
  corrimao(5.4, 30.2, 9, 30.2);
  corrimao(-9, 30.2, -9, 43.6);
  corrimao(9, 30.2, 9, 43.6);
  corrimao(-9, 43.6, 9, 43.6);
  barra(-9.4, 43.4, 9.4, 44.4);

  // ── canteiro: moldura chanfrada, terra rebaixada ──
  const canteiro = (x0: number, z0: number, x1: number, z1: number, alturaBorda = 0.75) => {
    const lx = x1 - x0, lz = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const e = 0.34;
    for (const [w, d, ox, oz] of [
      [lx, e, 0, -lz / 2 + e / 2], [lx, e, 0, lz / 2 - e / 2],
      [e, lz, -lx / 2 + e / 2, 0], [e, lz, lx / 2 - e / 2, 0],
    ]) {
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, alturaBorda, d, 2, 0.05), madeira);
      m.position.set(cx + ox, alturaBorda / 2, cz + oz);
      põe(m);
    }
    const solo = new THREE.Mesh(new THREE.BoxGeometry(lx - e * 2, 0.5, lz - e * 2), terra);
    solo.position.set(cx, alturaBorda - 0.3, cz);
    solo.receiveShadow = true;
    grupo.add(solo);
    barra(x0, z0, x1, z1);
    return { cx, cz, lx: lx - e * 2, lz: lz - e * 2, y: alturaBorda - 0.05 };
  };

  const leitos = [
    canteiro(-16, 12, -6, 28), canteiro(6, 12, 16, 28),        // mudas
    canteiro(-16, -6, -6, 11), canteiro(4, -6, 12, 11),        // folhagem
    canteiro(-17, -23, -10, -7, 0.6), canteiro(10, -23, 17, -7, 0.6),  // floração
  ];

  // ── vegetação ──
  const folhaClara = texturaFolha([132, 208, 68], [44, 112, 32]);
  const folhaAmarela = texturaFolha([228, 204, 70], [140, 116, 34]);
  const matFolha = (mapa: THREE.Texture, brilho = 0.62) => new THREE.MeshStandardMaterial({
    map: mapa, alphaTest: 0.42, side: THREE.DoubleSide,
    roughness: brilho, metalness: 0,
  });

  const verde = matFolha(folhaClara);
  const amarelo = matFolha(folhaAmarela);
  ventos.push(comVento(verde, 0.055), comVento(amarelo, 0.05));

  const geoFolha = cartaoFolha(0.5, 0.95, 0.3);
  const posesVerde: THREE.Matrix4[] = [], posesAmarela: THREE.Matrix4[] = [];

  /** Uma planta é uma roseta de folhas em volta de um ponto. */
  const planta = (
    destino: THREE.Matrix4[], x: number, y: number, z: number,
    escala: number, tombada = false,
  ) => {
    const n = 5 + ((acaso() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + acaso() * 0.6;
      const inclina = tombada ? 1.15 + acaso() * 0.35 : 0.42 + acaso() * 0.5;
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(inclina, a, 0, 'YXZ'));
      m.compose(
        new THREE.Vector3(x + Math.cos(a) * 0.06, y, z + Math.sin(a) * 0.06),
        q,
        new THREE.Vector3(escala, escala * (0.85 + acaso() * 0.4), escala),
      );
      destino.push(m);
    }
  };

  // bancada 1: as mudas tombadas
  for (const b of leitos.slice(0, 2))
    for (let i = 0; i < 82; i++) {
      const x = b.cx + (acaso() - 0.5) * b.lx, z = b.cz + (acaso() - 0.5) * b.lz;
      planta(posesVerde, x, b.y, z, 0.5 + acaso() * 0.18, acaso() < 0.72);
    }

  // bancada 2: folha de baixo amarela, verde em cima
  for (const b of leitos.slice(2, 4))
    for (let i = 0; i < 76; i++) {
      const x = b.cx + (acaso() - 0.5) * b.lx, z = b.cz + (acaso() - 0.5) * b.lz;
      planta(posesAmarela, x, b.y, z, 0.62 + acaso() * 0.2);
      planta(posesVerde, x, b.y + 0.5, z, 0.5 + acaso() * 0.15);
    }

  // bancada 3 e o monte: folhagem solta
  for (const b of leitos.slice(4))
    for (let i = 0; i < 58; i++)
      planta(posesVerde, b.cx + (acaso() - 0.5) * b.lx, b.y, b.cz + (acaso() - 0.5) * b.lz, 0.42 + acaso() * 0.2);

  for (let i = 0; i < 150; i++) {
    const a = acaso() * Math.PI * 2, r = Math.sqrt(acaso()) * 12;
    const x = -1 + Math.cos(a) * r, z = -32 + Math.sin(a) * r * 0.78;
    planta(posesVerde, x, alturaEm(x, z), z, 0.3 + acaso() * 0.3);
  }

  grupo.add(instancia({ geo: geoFolha, mat: verde, poses: posesVerde, sombra: false }));
  grupo.add(instancia({ geo: geoFolha, mat: amarelo, poses: posesAmarela, sombra: false }));

  // ── flores: o setor 3 é o lugar bonito e inútil do Núcleo Verde ──
  const geoFlor = cartaoFolha(0.62, 0.8, 0.12);
  const flores: [string, [number, number, number], [number, number, number]][] = [
    ['vermelha', [222, 74, 62], [248, 214, 84]],
    ['azul', [98, 122, 226], [250, 226, 96]],
    ['branca', [246, 243, 232], [244, 176, 58]],
    ['laranja', [242, 146, 48], [126, 74, 22]],
  ];
  for (const [, petala, miolo] of flores) {
    const mat = new THREE.MeshStandardMaterial({
      map: texturaFlor(petala, miolo), alphaTest: 0.42,
      side: THREE.DoubleSide, roughness: 0.66,
    });
    ventos.push(comVento(mat, 0.05));
    const poses: THREE.Matrix4[] = [];
    for (const b of leitos.slice(4)) for (let i = 0; i < 62; i++) {
      const m = new THREE.Matrix4();
      m.compose(
        new THREE.Vector3(
          b.cx + (acaso() - 0.5) * b.lx, b.y,
          b.cz + (acaso() - 0.5) * b.lz,
        ),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, acaso() * Math.PI, (acaso() - 0.5) * 0.3)),
        new THREE.Vector3(1, 0.9 + acaso() * 0.35, 1),
      );
      poses.push(m);
    }
    // e algumas espalhadas pelo monte de terra
    for (let i = 0; i < 28; i++) {
      const a = acaso() * Math.PI * 2, r = Math.sqrt(acaso()) * 11;
      const x = -1 + Math.cos(a) * r, z = -32 + Math.sin(a) * r * 0.78;
      const m = new THREE.Matrix4();
      m.compose(
        new THREE.Vector3(x, alturaEm(x, z), z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, acaso() * Math.PI, 0)),
        new THREE.Vector3(0.8, 0.8, 0.8),
      );
      poses.push(m);
    }
    grupo.add(instancia({ geo: geoFlor, mat, poses, sombra: false }));
  }

  // pétala caída no chão da passarela: a flor abre e cai sem fruto
  {
    const mat = new THREE.MeshStandardMaterial({
      map: texturaFlor([232, 120, 108], [244, 214, 96]), alphaTest: 0.42,
      side: THREE.DoubleSide, roughness: 0.8,
    });
    const poses: THREE.Matrix4[] = [];
    for (let i = 0; i < 130; i++) {
      const x = (acaso() - 0.5) * 20, z = -24 + acaso() * 20;
      if (Math.abs(x) > 1.7 && x > -8.3 && x < 8.3 && z > -22.4 && z < -7.6) continue;
      const m = new THREE.Matrix4();
      m.compose(
        new THREE.Vector3(x, alturaEm(x, z) + 0.16, z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, acaso() * Math.PI * 2)),
        new THREE.Vector3(0.34, 0.34, 0.34),
      );
      poses.push(m);
    }
    grupo.add(instancia({ geo: geoFlor, mat, poses, sombra: false }));
  }

  // ── árvores do canteiro de solo ──
  const cascaMat = matMadeira(1.4);
  const copaMat = matFolha(folhaClara, 0.7);
  ventos.push(comVento(copaMat, 0.07));
  const posesCopa: THREE.Matrix4[] = [];
  const geoCopa = cartaoFolha(1.5, 2.4, 0.55);

  for (const [x, z, h] of [[-4, -33, 6.4], [6, -28, 5.2], [-11, -36, 4.6]] as const) {
    const y = alturaEm(x, z);
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, h, 10), cascaMat);
    tronco.position.set(x, y + h / 2, z);
    põe(tronco);
    barra(x - 0.6, z - 0.6, x + 0.6, z + 0.6);
    for (let i = 0; i < 30; i++) {
      const a = acaso() * Math.PI * 2;
      const r = 0.4 + acaso() * 2.1;
      const alt = y + h - 0.6 + (acaso() - 0.45) * 2.2;
      const m = new THREE.Matrix4();
      m.compose(
        new THREE.Vector3(x + Math.cos(a) * r, alt, z + Math.sin(a) * r),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.9 + acaso() * 0.8, a, acaso() * 0.6, 'YXZ')),
        new THREE.Vector3(1, 0.85 + acaso() * 0.4, 1),
      );
      posesCopa.push(m);
    }
  }
  grupo.add(instancia({ geo: geoCopa, mat: copaMat, poses: posesCopa, sombra: false }));

  // ── espelho d'água do setor de floração ──
  const alturaAgua = fbm(131, 4, 9);
  const normalAgua = new THREE.CanvasTexture(normalDe((() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const v = alturaAgua(x / 256, y / 256) * 255;
      const i = (y * 256 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  })(), 1.6));
  normalAgua.wrapS = normalAgua.wrapT = THREE.RepeatWrapping;
  normalAgua.repeat.set(5, 5);

  const agua = new THREE.MeshStandardMaterial({
    color: 0x2f5f74, roughness: 0.07, metalness: 0.15,
    normalMap: normalAgua, normalScale: new THREE.Vector2(0.35, 0.35),
    transparent: true, opacity: 0.9, envMapIntensity: 1.8,
  });
  const tanque = new THREE.Mesh(new THREE.BoxGeometry(17, 1.1, 15), concreto);
  tanque.position.set(0, -0.55, -15);
  põe(tanque);
  const lamina = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 14.4).rotateX(-Math.PI / 2), agua);
  lamina.position.set(0, -0.12, -15);
  grupo.add(lamina);
  // a passarela por cima da água
  const passarela = new THREE.Mesh(new RoundedBoxGeometry(3.4, 0.28, 15.4, 2, 0.05), madeira);
  passarela.position.set(0, 0.05, -15);
  põe(passarela);
  barra(-8.3, -22.4, -1.75, -7.6);
  barra(1.75, -22.4, 8.3, -7.6);

  // ── tanque de nutriente do setor 2 ──
  const cilindro = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5.4, 24), aco);
  cilindro.position.set(17.4, 2.7, 1);
  põe(cilindro);
  barra(15, -1.5, 19.8, 3.5);
  for (const y of [0.9, 4.5]) {
    const anel = new THREE.Mesh(new THREE.TorusGeometry(2.28, 0.09, 6, 24).rotateX(Math.PI / 2), acoEscuro);
    anel.position.set(17.4, y, 1);
    põe(anel);
  }
  // visor: mostra que está vazio
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.4, 0.5), vidro);
  visor.position.set(15.2, 2.7, 1);
  grupo.add(visor);
  // tubulação seca correndo pela nave
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(17.4, 5.5, 1), new THREE.Vector3(17.4, 6.4, 1),
    new THREE.Vector3(12, 6.6, 1), new THREE.Vector3(0, 6.7, 4),
    new THREE.Vector3(-11, 6.6, 8), new THREE.Vector3(-15.5, 6.4, 20),
    new THREE.Vector3(-15.5, 6.4, 27),
  ]);
  põe(new THREE.Mesh(new THREE.TubeGeometry(curva, 90, 0.16, 8, false), aco));

  // ── ventiladores parados do setor 1 ──
  for (const [x, z] of [[-14.5, 16], [-14.5, 25], [14.5, 16], [14.5, 25]] as const) {
    const caixa = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.4, 20).rotateZ(Math.PI / 2), acoEscuro);
    caixa.position.set(x + Math.sign(x) * -0.6, 4.2, z);
    põe(caixa);
    const pa = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.7, 0.32), aco);
    for (let i = 0; i < 4; i++) {
      const p = pa.clone();
      p.position.copy(caixa.position);
      p.rotation.x = (i * Math.PI) / 4;
      põe(p);
    }
  }

  // ── caixotaria solta, para o chão não ficar limpo demais ──
  for (let i = 0; i < 14; i++) {
    const x = (acaso() - 0.5) * 22, z = Z_FUNDO + 8 + acaso() * 60;
    if (bloqueado(x, z)) continue;
    const c = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.72, 0.9, 2, 0.05), madeira);
    c.position.set(x, alturaEm(x, z) + 0.36, z);
    c.rotation.y = acaso() * Math.PI;
    põe(c);
  }

  grupo.traverse(o => { if ((o as THREE.Mesh).isMesh) o.receiveShadow = true; });
  compactar(grupo);
  return { grupo, ventos, agua, lampadas };
}

/**
 * Junta num só objeto tudo que é parado e divide o mesmo material.
 *
 * O galpão nasce com mais de duzentas malhas soltas — cada pilastra,
 * cada degrau, cada montante do guarda-corpo. Duzentas malhas são
 * duzentas conversas com a placa de vídeo por quadro, e é isso que trava
 * celular, não a quantidade de triângulo. Depois disto sobra cerca de uma
 * dúzia de chamadas de desenho, com a mesma imagem na tela.
 *
 * Fica de fora o que precisa continuar separado: instâncias, material
 * transparente (que depende de ordem de desenho) e a lâmina d'água.
 */
function compactar(grupo: THREE.Group) {
  const baldes = new Map<THREE.Material, THREE.BufferGeometry[]>();

  for (const o of [...grupo.children]) {
    const m = o as THREE.Mesh;
    const mat = m.material as THREE.Material;
    const junta = m.isMesh
      && !(m as unknown as THREE.InstancedMesh).isInstancedMesh
      && !Array.isArray(m.material)
      && mat && !mat.transparent
      && !!m.geometry?.attributes?.position
      && !!m.geometry.attributes.normal
      && !!m.geometry.attributes.uv;
    if (!junta) continue;

    o.updateMatrix();
    // sem índice para todas: geometria indexada não se junta com
    // geometria sem índice, e as duas formas aparecem aqui
    const g = m.geometry.toNonIndexed().applyMatrix4(o.matrix);
    for (const nome of Object.keys(g.attributes))
      if (nome !== 'position' && nome !== 'normal' && nome !== 'uv') g.deleteAttribute(nome);

    const lista = baldes.get(mat);
    if (lista) lista.push(g); else baldes.set(mat, [g]);
    grupo.remove(o);
  }

  for (const [mat, geos] of baldes) {
    const g = U.mergeGeometries(geos, false);
    geos.forEach(x => x.dispose());
    if (!g) continue;
    const malha = new THREE.Mesh(g, mat);
    malha.castShadow = true;
    malha.receiveShadow = true;
    grupo.add(malha);
  }
}

/** Junta geometrias iguais quando vale a pena. */
export const juntar = U.mergeGeometries;
