import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────
// O Núcleo Verde em voxel.
//
// O mundo é uma grade de cubos de 1x1x1, cada tipo com sua textura de
// 16x16 desenhada por código e ampliada sem suavizar — o mesmo princípio
// do Minecraft. A pixelização vem da textura e de um render em baixa
// resolução; a paleta é ampla de propósito, porque prender tudo a poucos
// tons deixava a cena escura e chapada.
//
// Desempenho: um cubo por bloco seria uma chamada de desenho por bloco.
// Aqui cada TIPO de bloco é um InstancedMesh, então o mundo inteiro sai
// em meia dúzia de chamadas. E só entram na malha os blocos com pelo
// menos uma face exposta — o miolo maciço nunca é desenhado.
// ─────────────────────────────────────────────────────────

const LARGURA = 256, ALTURA = 192;

// ── blocos ───────────────────────────────────────────────
const AR = 0, CONCRETO = 1, METAL = 2, TERRA = 3, GRAMA = 4,
      FOLHA = 5, VIDRO = 6, LAMPADA = 7, MADEIRA = 8;

const WX = 26, WY = 8, WZ = 44;
const grade = new Uint8Array(WX * WY * WZ);
const iv = (x: number, y: number, z: number) => x + y * WX + z * WX * WY;
const bloco = (x: number, y: number, z: number) =>
  (x < 0 || y < 0 || z < 0 || x >= WX || y >= WY || z >= WZ) ? AR : grade[iv(x, y, z)];
const poe = (x: number, y: number, z: number, t: number) => {
  if (x >= 0 && y >= 0 && z >= 0 && x < WX && y < WY && z < WZ) grade[iv(x, y, z)] = t;
};

function montaMundo() {
  grade.fill(AR);
  for (let x = 0; x < WX; x++) for (let z = 0; z < WZ; z++) {
    poe(x, 0, z, METAL);                                  // piso
    poe(x, WY - 1, z, z % 6 === 0 ? VIDRO : CONCRETO);    // teto com clarabóia
    if (x === 0 || x === WX - 1 || z === 0 || z === WZ - 1)
      for (let y = 1; y < WY - 1; y++) poe(x, y, z, CONCRETO);
  }

  // dois canteiros longos, com borda de madeira e cultura por cima
  for (const x0 of [5, WX - 9]) {
    for (let z = 4; z < WZ - 4; z++) {
      for (let x = x0; x < x0 + 4; x++) {
        poe(x, 1, z, MADEIRA);
        poe(x, 2, z, x === x0 || x === x0 + 3 ? MADEIRA : TERRA);
        if (x > x0 && x < x0 + 3 && z % 2 === 0) poe(x, 3, z, GRAMA);
        if (x > x0 && x < x0 + 3 && z % 4 === 0) poe(x, 4, z, FOLHA);
      }
    }
  }

  // lâmpadas de cultivo penduradas no corredor
  for (let z = 4; z < WZ - 4; z += 5) {
    for (const x of [7, WX - 8]) poe(x, WY - 2, z, LAMPADA);
  }

  // parede de vidro no fundo, para a cena ter um ponto de fuga claro
  for (let x = 2; x < WX - 2; x++) for (let y = 1; y < 5; y++) poe(x, y, 2, VIDRO);
}

/** Textura 16x16 desenhada por código: base, ruído e borda escura. */
function textura(base: string, ruido = 0.35, borda = true) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, 16, 16);
  for (let i = 0; i < 256; i++) {
    if (Math.random() > ruido) continue;
    const escuro = Math.random() < 0.5;
    g.fillStyle = escuro ? `rgba(0,0,0,${Math.random() * 0.28})` : `rgba(255,255,255,${Math.random() * 0.18})`;
    g.fillRect(i % 16, Math.floor(i / 16), 1, 1);
  }
  if (borda) {
    g.fillStyle = 'rgba(0,0,0,0.22)';
    g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1);
    g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
}

function materiais() {
  const m = (cor: string, ruido?: number, extra?: THREE.MeshLambertMaterialParameters) =>
    new THREE.MeshLambertMaterial({ map: textura(cor, ruido), ...extra });

  const grama = [
    m('#6f8f3a'), m('#6f8f3a'),      // lados
    m('#8ec73f', 0.5),               // topo, mais claro
    m('#6b4a2a'),                    // base, terra
    m('#6f8f3a'), m('#6f8f3a'),
  ];

  return {
    [CONCRETO]: m('#9aa08c', 0.45),
    [METAL]: m('#7c8496', 0.3),
    [TERRA]: m('#6b4a2a', 0.55),
    [GRAMA]: grama,
    [FOLHA]: m('#7ec44a', 0.5),
    [VIDRO]: new THREE.MeshLambertMaterial({
      map: textura('#bfeaff', 0.2), transparent: true, opacity: 0.42,
    }),
    [LAMPADA]: new THREE.MeshBasicMaterial({ map: textura('#fff6c2', 0.15, false) }),
    [MADEIRA]: m('#8a6136', 0.5),
  } as Record<number, THREE.Material | THREE.Material[]>;
}

/** Só desenha bloco com face exposta: o miolo maciço não aparece nunca. */
function exposto(x: number, y: number, z: number) {
  return bloco(x + 1, y, z) === AR || bloco(x - 1, y, z) === AR
      || bloco(x, y + 1, z) === AR || bloco(x, y - 1, z) === AR
      || bloco(x, y, z + 1) === AR || bloco(x, y, z - 1) === AR
      || bloco(x + 1, y, z) === VIDRO || bloco(x, y + 1, z) === VIDRO;
}

function Mundo() {
  const mats = useMemo(() => { montaMundo(); return materiais(); }, []);

  const malhas = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const porTipo: Record<number, THREE.Matrix4[]> = {};
    const dummy = new THREE.Object3D();
    for (let x = 0; x < WX; x++) for (let y = 0; y < WY; y++) for (let z = 0; z < WZ; z++) {
      const t = bloco(x, y, z);
      if (t === AR || !exposto(x, y, z)) continue;
      dummy.position.set(x - WX / 2, y, z - WZ / 2);
      dummy.updateMatrix();
      (porTipo[t] ??= []).push(dummy.matrix.clone());
    }
    return Object.entries(porTipo).map(([tipo, ms]) => {
      const inst = new THREE.InstancedMesh(geo, mats[+tipo] as THREE.Material, ms.length);
      ms.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.instanceMatrix.needsUpdate = true;
      return inst;
    });
  }, [mats]);

  return <>{malhas.map((m, i) => <primitive key={i} object={m} />)}</>;
}

// ── rasterizador de baixa resolução ──────────────────────

const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Só pixeliza e dá um leve degrau de cor. A quantização dura, presa a
// poucos tons, apagava as texturas e deixava tudo escuro e chapado.
const FRAG = /* glsl */`
precision mediump float;
varying vec2 vUv;
uniform sampler2D tela;
void main() {
  vec3 c = texture2D(tela, vUv).rgb;
  c = floor(c * 22.0 + 0.5) / 22.0;   // degraus largos, cor ainda viva
  gl_FragColor = vec4(c, 1.0);
}`;

function Rasterizador() {
  const { gl, scene, camera } = useThree();
  const { alvo, cenaTela, camTela } = useMemo(() => {
    const alvo = new THREE.WebGLRenderTarget(LARGURA, ALTURA, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true,
    });
    const cenaTela = new THREE.Scene();
    const camTela = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cenaTela.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        uniforms: { tela: { value: alvo.texture } },
      }),
    ));
    return { alvo, cenaTela, camTela };
  }, []);

  useEffect(() => { gl.setPixelRatio(1); return () => alvo.dispose(); }, [gl, alvo]);
  useFrame(() => {
    gl.setRenderTarget(alvo);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(cenaTela, camTela);
  }, 1);
  return null;
}

// ── jogador ──────────────────────────────────────────────

function solido(x: number, z: number) {
  const bx = Math.floor(x + WX / 2), bz = Math.floor(z + WZ / 2);
  for (const y of [1, 2]) {
    const t = bloco(bx, y, bz);
    if (t !== AR && t !== VIDRO) return true;
  }
  return false;
}

type Entrada = { frente: number; lado: number; giro: number; olhar: number };

function Jogador({ entrada, estacoes, onPerto }: {
  entrada: React.MutableRefObject<Entrada>;
  estacoes: Estacao[];
  onPerto: (id: string | null) => void;
}) {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(0, 2.6, WZ / 2 - 5));
  // zero olha para -Z, que é o fundo do corredor; com PI o jogador
  // nascia encarando a parede das costas
  const ang = useRef(0);
  const passo = useRef(0);
  const perto = useRef<string | null>(null);

  useFrame((_, dt) => {
    const e = entrada.current;
    ang.current -= (e.giro * 1.8 + e.olhar * 2.6) * dt;
    e.olhar = 0;

    const vel = 4.2 * dt;
    const s = Math.sin(ang.current), c = Math.cos(ang.current);
    const dx = (-s * e.frente + c * e.lado) * vel;
    const dz = (-c * e.frente - s * e.lado) * vel;
    if (!solido(pos.current.x + dx, pos.current.z)) pos.current.x += dx;
    if (!solido(pos.current.x, pos.current.z + dz)) pos.current.z += dz;

    const andando = Math.abs(e.frente) + Math.abs(e.lado) > 0.01;
    if (andando) passo.current += dt * 7.5;
    camera.position.set(
      pos.current.x,
      2.6 + (andando ? Math.sin(passo.current) * 0.06 : 0),
      pos.current.z,
    );
    camera.rotation.set(0, ang.current, 0, 'YXZ');

    const achou = estacoes.find(sx => Math.abs(sx.z - pos.current.z) < 2.6) ?? null;
    const id = achou?.id ?? null;
    if (id !== perto.current) { perto.current = id; onPerto(id); }
  });
  return null;
}

export interface Estacao { id: string; z: number; rotulo: string }

function Marcador({ z, ativo }: { z: number; ativo: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.position.y = 3.4 + Math.sin(t * 2.2) * 0.18;
    ref.current.rotation.y = t * 1.2;
  });
  return (
    <mesh ref={ref} position={[0, 3.4, z]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color={ativo ? '#ffb43c' : '#9ff05a'} />
    </mesh>
  );
}

export interface Silo3DProps {
  estacoes: Estacao[];
  onPerto?: (id: string | null) => void;
}

export default function Silo3D({ estacoes, onPerto }: Silo3DProps) {
  const entrada = useRef<Entrada>({ frente: 0, lado: 0, giro: 0, olhar: 0 });
  const [ativa, setAtiva] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mapa: Record<string, ['frente' | 'lado' | 'giro', number]> = {
      w: ['frente', 1], s: ['frente', -1], a: ['lado', -1], d: ['lado', 1],
      arrowup: ['frente', 1], arrowdown: ['frente', -1],
      arrowleft: ['giro', -1], arrowright: ['giro', 1],
    };
    const t = (e: KeyboardEvent, v: number) => {
      const m = mapa[e.key.toLowerCase()];
      if (!m) return;
      e.preventDefault();
      entrada.current[m[0]] = v ? m[1] : 0;
    };
    const dn = (e: KeyboardEvent) => t(e, 1), up = (e: KeyboardEvent) => t(e, 0);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  // arrastar na tela para virar — é assim que se olha em volta no celular
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    let id: number | null = null, ultimoX = 0;
    const desce = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-dpad]')) return;
      id = e.pointerId; ultimoX = e.clientX;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      entrada.current.olhar += (e.clientX - ultimoX) * 0.012;
      ultimoX = e.clientX;
    };
    const sobe = (e: PointerEvent) => { if (e.pointerId === id) id = null; };
    el.addEventListener('pointerdown', desce);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', sobe);
    window.addEventListener('pointercancel', sobe);
    return () => {
      el.removeEventListener('pointerdown', desce);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', sobe);
      window.removeEventListener('pointercancel', sobe);
    };
  }, []);

  const aviso = (id: string | null) => { setAtiva(id); onPerto?.(id); };

  return (
    <div ref={area} style={{ position: 'absolute', inset: 0, overflow: 'hidden', touchAction: 'none' }}>
      <Canvas
        style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
        gl={{ antialias: false, powerPreference: 'low-power' }}
        camera={{ fov: 70, near: 0.1, far: 90 }}
      >
        <color attach="background" args={['#cfe6f5']} />
        {/* claro de propósito: cena de estufa iluminada, não porão */}
        <ambientLight intensity={1.5} />
        <hemisphereLight args={['#eaf6ff', '#6b5a3a', 1.2]} />
        <directionalLight position={[10, 24, 8]} intensity={1.5} />
        <Mundo />
        {estacoes.map(s => <Marcador key={s.id} z={s.z} ativo={ativa === s.id} />)}
        <Jogador entrada={entrada} estacoes={estacoes} onPerto={aviso} />
        <Rasterizador />
      </Canvas>

      <Dpad entrada={entrada} />
    </div>
  );
}

/** D-pad de toque. O arrastar cuida da direção; aqui é só andar. */
function Dpad({ entrada }: { entrada: React.MutableRefObject<Entrada> }) {
  const b = (rotulo: string, aplica: (v: number) => void) => (
    <button
      data-dpad
      onPointerDown={e => { e.preventDefault(); e.stopPropagation(); aplica(1); }}
      onPointerUp={() => aplica(0)}
      onPointerLeave={() => aplica(0)}
      onPointerCancel={() => aplica(0)}
      style={{
        width: 42, height: 42, display: 'grid', placeItems: 'center',
        background: 'rgba(10,13,7,0.7)', color: '#cfe6a0',
        border: '2px solid #8ec73f', fontFamily: 'monospace', fontSize: 16,
        cursor: 'pointer', touchAction: 'none',
      }}
    >
      {rotulo}
    </button>
  );
  return (
    <div data-dpad style={{
      position: 'absolute', left: 10, bottom: 10, zIndex: 3,
      display: 'grid', gridTemplateColumns: 'repeat(3, 42px)', gap: 3,
    }}>
      <div />{b('▲', v => (entrada.current.frente = v))}<div />
      {b('◄', v => (entrada.current.lado = -v))}
      {b('▼', v => (entrada.current.frente = -v))}
      {b('►', v => (entrada.current.lado = v))}
    </div>
  );
}
