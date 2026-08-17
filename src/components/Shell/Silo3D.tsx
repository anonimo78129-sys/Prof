import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  texSolida, geoCruz, matPlanta,
  TRIGO, MUDA, MATO, FLOR_VERMELHA, FLOR_AZUL, FLOR_BRANCA,
} from './blocos';

// ─────────────────────────────────────────────────────────
// O Núcleo Verde em voxel.
//
// O mundo é uma grade de cubos 1x1x1, cada tipo com sua textura de 16x16
// desenhada por código e filtrada em NearestFilter — é daí que vem a
// cara de bloco, exatamente como no jogo que serviu de referência.
//
// A imagem é renderizada em resolução nativa. Existiu aqui um passo que
// rasterizava a cena em 256x192 e ampliava; ele deixava tudo grosseiro e
// escuro, e foi removido. Textura de 16 pixels sem suavização já entrega
// o visual de bloco sem precisar estragar a imagem inteira.
//
// CONTROLE (espelhando o padrão de Minecraft no celular)
// Arrastar em qualquer ponto livre da tela gira a câmera nos dois eixos,
// com o passo aplicado direto do movimento do dedo — acumular e deixar
// decair era o que dava a sensação de atraso. O passo vertical é travado
// perto de 90 graus para a câmera nunca capotar. O andar tem aceleração
// e atrito, então parte e para macio em vez de ligar e desligar.
// ─────────────────────────────────────────────────────────

// ── blocos ───────────────────────────────────────────────
// cubos inteiros
const AR = 0, CONCRETO = 1, METAL = 2, TERRA = 3, GRAMA = 4,
      LAMPADA = 7, MADEIRA = 8;
// placa fina
const VIDRO = 6;
// vegetação em cruz, e miudezas em cubo pequeno
const TIPO_CRUZ = [10, 11, 12, 13, 14, 15] as const;
const V_TRIGO = 10, V_MUDA = 11, V_MATO = 12,
      V_FLOR_R = 13, V_FLOR_A = 14, V_FLOR_B = 15;
const MIUDO = 20;

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
    poe(x, 0, z, METAL);
    poe(x, WY - 1, z, z % 6 === 0 ? VIDRO : CONCRETO);
    if (x === 0 || x === WX - 1 || z === 0 || z === WZ - 1)
      for (let y = 1; y < WY - 1; y++) poe(x, y, z, CONCRETO);
  }

  // Canteiros: caixa de madeira, terra dentro, e a cultura POR CIMA em
  // cruz. Desenhar a planta como cubo era o que deixava tudo com cara de
  // caixote empilhado.
  for (const x0 of [5, WX - 9]) {
    for (let z = 4; z < WZ - 4; z++) {
      for (let x = x0; x < x0 + 4; x++) {
        const borda = x === x0 || x === x0 + 3;
        poe(x, 1, z, MADEIRA);
        poe(x, 2, z, borda ? MADEIRA : TERRA);
        if (borda) continue;
        // trecho de cada canteiro com uma cultura diferente, e mato e
        // flor espalhados para a fileira não ficar mecânica
        const r = (x * 31 + z * 17) % 11;
        if (z % 9 === 0 && r < 4) poe(x, 3, z, V_FLOR_R + (r % 3));
        else if (r < 6) poe(x, 3, z, z < WZ / 2 ? V_TRIGO : V_MUDA);
        else if (r < 8) poe(x, 3, z, V_MATO);
      }
    }
  }

  // vasinhos e válvulas na beira do corredor: cubo pequeno, não inteiro
  for (let z = 6; z < WZ - 6; z += 7) {
    poe(4, 1, z, MIUDO);
    poe(WX - 5, 1, z + 3, MIUDO);
  }

  for (let z = 4; z < WZ - 4; z += 5) for (const x of [7, WX - 8]) poe(x, WY - 2, z, LAMPADA);
  for (let x = 2; x < WX - 2; x++) for (let y = 1; y < 5; y++) poe(x, y, 2, VIDRO);
}

function materiais() {
  const m = (cor: string, ruido?: number) =>
    new THREE.MeshLambertMaterial({ map: texSolida(cor, ruido) });
  return {
    [CONCRETO]: m('#9aa08c', 0.45),
    [METAL]: m('#7c8496', 0.3),
    [TERRA]: m('#6b4a2a', 0.55),
    [GRAMA]: [m('#6f8f3a'), m('#6f8f3a'), m('#8ec73f', 0.5), m('#6b4a2a'), m('#6f8f3a'), m('#6f8f3a')],
    [VIDRO]: new THREE.MeshLambertMaterial({ map: texSolida('#bfeaff', 0.2), transparent: true, opacity: 0.4 }),
    [LAMPADA]: new THREE.MeshBasicMaterial({ map: texSolida('#fff6c2', 0.15, false) }),
    [MADEIRA]: m('#8a6136', 0.5),
    [MIUDO]: m('#b06a3a', 0.4),
    [V_TRIGO]: matPlanta(TRIGO),
    [V_MUDA]: matPlanta(MUDA),
    [V_MATO]: matPlanta(MATO),
    [V_FLOR_R]: matPlanta(FLOR_VERMELHA),
    [V_FLOR_A]: matPlanta(FLOR_AZUL),
    [V_FLOR_B]: matPlanta(FLOR_BRANCA),
  } as Record<number, THREE.Material | THREE.Material[]>;
}

const ehCruz = (t: number) => (TIPO_CRUZ as readonly number[]).includes(t);

// Planta e miudeza não tapam o vizinho, então quem está atrás delas
// continua com face exposta e precisa ser desenhado.
const vazado = (t: number) => t === AR || t === VIDRO || ehCruz(t) || t === MIUDO;

const exposto = (x: number, y: number, z: number) =>
  [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
    .some(([a, b, c]) => vazado(bloco(x + a, y + b, z + c)));

function Mundo() {
  const mats = useMemo(() => { montaMundo(); return materiais(); }, []);

  const malhas = useMemo(() => {
    // três formas no mesmo mundo
    const geoCubo = new THREE.BoxGeometry(1, 1, 1);
    const geoMiudo = new THREE.BoxGeometry(0.34, 0.42, 0.34);
    const geoPlanta = geoCruz(0.95);

    const porTipo: Record<number, THREE.Matrix4[]> = {};
    const d = new THREE.Object3D();
    for (let x = 0; x < WX; x++) for (let y = 0; y < WY; y++) for (let z = 0; z < WZ; z++) {
      const t = bloco(x, y, z);
      if (t === AR) continue;
      const cruz = ehCruz(t);
      if (!cruz && t !== MIUDO && !exposto(x, y, z)) continue;
      // a cruz nasce apoiada na face de cima do bloco de baixo, e leva um
      // giro por posição para a fileira não sair toda alinhada
      d.position.set(x - WX / 2, cruz ? y - 0.5 : t === MIUDO ? y + 0.2 : y, z - WZ / 2);
      d.rotation.set(0, cruz ? ((x * 7 + z * 13) % 4) * (Math.PI / 8) : 0, 0);
      d.updateMatrix();
      (porTipo[t] ??= []).push(d.matrix.clone());
    }

    return Object.entries(porTipo).map(([tipo, ms]) => {
      const n = +tipo;
      const geo = ehCruz(n) ? geoPlanta : n === MIUDO ? geoMiudo : geoCubo;
      const inst = new THREE.InstancedMesh(geo, mats[n] as THREE.Material, ms.length);
      ms.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.instanceMatrix.needsUpdate = true;
      return inst;
    });
  }, [mats]);

  return <>{malhas.map((m, i) => <primitive key={i} object={m} />)}</>;
}

// ── jogador ──────────────────────────────────────────────

function solido(x: number, z: number) {
  const bx = Math.floor(x + WX / 2), bz = Math.floor(z + WZ / 2);
  for (const y of [1, 2]) {
    const t = bloco(bx, y, bz);
    // planta e miudeza não barram: atravessar mato é esperado
    if (t !== AR && t !== VIDRO && !ehCruz(t) && t !== MIUDO) return true;
  }
  return false;
}

/** Ângulos absolutos da câmera. O arrasto escreve aqui direto. */
type Camera = { yaw: number; pitch: number };
type Mover = { frente: number; lado: number };

const LIMITE = Math.PI / 2 - 0.05;   // trava perto de 90°, como no Minecraft

function Jogador({ mover, cam, estacoes, onPerto }: {
  mover: React.MutableRefObject<Mover>;
  cam: React.MutableRefObject<Camera>;
  estacoes: Estacao[];
  onPerto: (id: string | null) => void;
}) {
  const pos = useRef(new THREE.Vector3(0, 2.6, WZ / 2 - 5));
  const vel = useRef({ x: 0, z: 0 });
  const passo = useRef(0);
  const perto = useRef<string | null>(null);

  useFrame(({ camera }, dt) => {
    const d = Math.min(dt, 0.05);        // trava o passo: aba em segundo plano dá salto
    const m = mover.current;

    // aceleração e atrito, para partir e parar macio
    const s = Math.sin(cam.current.yaw), c = Math.cos(cam.current.yaw);
    const alvoX = (-s * m.frente + c * m.lado) * 4.6;
    const alvoZ = (-c * m.frente - s * m.lado) * 4.6;
    const k = 1 - Math.pow(0.0008, d);   // suavização estável em qualquer fps
    vel.current.x += (alvoX - vel.current.x) * k;
    vel.current.z += (alvoZ - vel.current.z) * k;

    const dx = vel.current.x * d, dz = vel.current.z * d;
    if (!solido(pos.current.x + dx, pos.current.z)) pos.current.x += dx; else vel.current.x = 0;
    if (!solido(pos.current.x, pos.current.z + dz)) pos.current.z += dz; else vel.current.z = 0;

    const rapidez = Math.hypot(vel.current.x, vel.current.z);
    passo.current += rapidez * d * 1.7;
    camera.position.set(
      pos.current.x,
      2.6 + Math.sin(passo.current) * 0.05 * Math.min(1, rapidez / 3),
      pos.current.z,
    );
    camera.rotation.set(cam.current.pitch, cam.current.yaw, 0, 'YXZ');

    const achou = estacoes.find(e => Math.abs(e.z - pos.current.z) < 2.6) ?? null;
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
  const mover = useRef<Mover>({ frente: 0, lado: 0 });
  const cam = useRef<Camera>({ yaw: 0, pitch: 0 });
  const [ativa, setAtiva] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);

  // teclado
  useEffect(() => {
    const mapa: Record<string, ['frente' | 'lado', number]> = {
      w: ['frente', 1], s: ['frente', -1], a: ['lado', -1], d: ['lado', 1],
      arrowup: ['frente', 1], arrowdown: ['frente', -1],
      arrowleft: ['lado', -1], arrowright: ['lado', 1],
    };
    const t = (e: KeyboardEvent, v: number) => {
      const k = mapa[e.key.toLowerCase()];
      if (!k) return;
      e.preventDefault();
      mover.current[k[0]] = v ? k[1] : 0;
    };
    const dn = (e: KeyboardEvent) => t(e, 1), up = (e: KeyboardEvent) => t(e, 0);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  // arrastar para olhar, nos dois eixos, aplicado direto
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const SENS = 0.0032;
    let id: number | null = null, ux = 0, uy = 0;

    const desce = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('[data-dpad]')) return;
      id = e.pointerId; ux = e.clientX; uy = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      cam.current.yaw -= (e.clientX - ux) * SENS;
      cam.current.pitch = Math.max(-LIMITE, Math.min(LIMITE,
        cam.current.pitch - (e.clientY - uy) * SENS));
      ux = e.clientX; uy = e.clientY;
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
    <div
      ref={area}
      // segurar o dedo abria o menu nativo de copiar/compartilhar por
      // cima do jogo; estas quatro linhas é que desligam isso
      onContextMenu={e => e.preventDefault()}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
      }}
    >
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'low-power' }}
        camera={{ fov: 72, near: 0.1, far: 90 }}
      >
        <color attach="background" args={['#cfe6f5']} />
        <ambientLight intensity={1.5} />
        <hemisphereLight args={['#eaf6ff', '#6b5a3a', 1.2]} />
        <directionalLight position={[10, 24, 8]} intensity={1.5} />
        <Mundo />
        {estacoes.map(s => <Marcador key={s.id} z={s.z} ativo={ativa === s.id} />)}
        <Jogador mover={mover} cam={cam} estacoes={estacoes} onPerto={aviso} />
      </Canvas>

      <Dpad mover={mover} />
    </div>
  );
}

/** D-pad só de deslocamento. A direção do olhar vem do arrasto. */
function Dpad({ mover }: { mover: React.MutableRefObject<Mover> }) {
  const b = (rotulo: string, aplica: (v: number) => void) => (
    <button
      data-dpad
      onContextMenu={e => e.preventDefault()}
      onPointerDown={e => { e.preventDefault(); e.stopPropagation(); aplica(1); }}
      onPointerUp={() => aplica(0)}
      onPointerLeave={() => aplica(0)}
      onPointerCancel={() => aplica(0)}
      style={{
        width: 44, height: 44, display: 'grid', placeItems: 'center',
        background: 'rgba(10,13,7,0.62)', color: '#dff0b8',
        border: '2px solid rgba(142,199,63,0.85)', borderRadius: 6,
        fontFamily: 'monospace', fontSize: 16, cursor: 'pointer',
        touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
      }}
    >
      {rotulo}
    </button>
  );
  return (
    <div data-dpad style={{ position: 'absolute', left: 10, bottom: 10, zIndex: 3,
      display: 'grid', gridTemplateColumns: 'repeat(3, 44px)', gap: 4 }}>
      <div />{b('▲', v => (mover.current.frente = v))}<div />
      {b('◄', v => (mover.current.lado = -v))}
      {b('▼', v => (mover.current.frente = -v))}
      {b('►', v => (mover.current.lado = v))}
    </div>
  );
}
