import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { geoCruz, geoTapete } from './blocos';
import {
  AR, AGUA, WX, WY, WZ, ALTURA_OLHO, INICIO,
  bloco, duro, tapa, forma, materiais, montaMundo, pisoEm, alturaSolo,
} from './mundoSilo';

// ─────────────────────────────────────────────────────────
// O desenho do Núcleo Verde.
//
// Cada tipo de bloco vira uma única InstancedMesh: um punhado de chamadas
// de desenho para dezenas de milhares de blocos. Só entra na lista o cubo
// que tem ao menos uma face virada para algo que se enxerga através —
// o miolo maciço das paredes nunca é desenhado.
//
// LUZ. A versão anterior somava luz demais (ambiente 1,5 + hemisfério 1,2
// + direcional 1,5) e o mundo saía lavado, sem diferença entre a face de
// cima e a de lado. Aqui a maior parte da luz vem de uma direcional
// inclinada, que é o que devolve o contraste entre faces — é dele que
// vem a leitura de volume num mundo de cubos.
//
// CONTROLE. Arrastar em qualquer ponto livre gira a câmera nos dois
// eixos, com o passo aplicado direto do dedo. O pé segue o piso: sobe
// degrau de um bloco sozinho, desce escada e entra na água do canal.
// ─────────────────────────────────────────────────────────

export interface Estacao { id: string; x: number; z: number; rotulo: string }

// ── mundo ────────────────────────────────────────────────

function ehExposto(x: number, y: number, z: number) {
  return !tapa(bloco(x + 1, y, z)) || !tapa(bloco(x - 1, y, z))
    || !tapa(bloco(x, y + 1, z)) || !tapa(bloco(x, y - 1, z))
    || !tapa(bloco(x, y, z + 1)) || !tapa(bloco(x, y, z - 1));
}

/** Placa presa na parede: encosta na face sólida e olha para o vão. */
function viraPlaca(d: THREE.Object3D, x: number, y: number, z: number) {
  const meia = 0.44;
  if (duro(bloco(x - 1, y, z))) { d.position.x -= meia; d.rotation.y = Math.PI / 2; }
  else if (duro(bloco(x + 1, y, z))) { d.position.x += meia; d.rotation.y = -Math.PI / 2; }
  else if (duro(bloco(x, y, z - 1))) { d.position.z -= meia; d.rotation.y = 0; }
  else { d.position.z += meia; d.rotation.y = Math.PI; }
}

function Mundo() {
  const mats = useMemo(() => { montaMundo(); return materiais(); }, []);

  const malhas = useMemo(() => {
    const geos: Record<string, THREE.BufferGeometry> = {
      cubo: new THREE.BoxGeometry(1, 1, 1),
      cruz: geoCruz(0.95),
      tapete: geoTapete(),
      miudo: new THREE.BoxGeometry(0.36, 0.42, 0.36),
      placa: new THREE.BoxGeometry(0.9, 0.9, 0.12),
      liquido: geoTapete(),
      luminaria: new THREE.BoxGeometry(0.62, 0.34, 0.62),
    };

    const porTipo: Record<number, THREE.Matrix4[]> = {};
    const d = new THREE.Object3D();

    for (let z = 0; z < WZ; z++) for (let y = 0; y < WY; y++) for (let x = 0; x < WX; x++) {
      const t = bloco(x, y, z);
      if (t === AR) continue;
      const f = forma(t);
      if (f === 'cubo' && !ehExposto(x, y, z)) continue;

      const wx = x - WX / 2, wz = z - WZ / 2;
      const giro = ((x * 7 + z * 13 + y * 3) % 4) * (Math.PI / 8);
      d.rotation.set(0, 0, 0);

      if (f === 'cubo') d.position.set(wx, y + 0.5, wz);
      else if (f === 'cruz') { d.position.set(wx, y, wz); d.rotation.y = giro; }
      else if (f === 'tapete') { d.position.set(wx, y + 0.03, wz); d.rotation.y = giro * 2; }
      else if (f === 'liquido') d.position.set(wx, y + 0.9, wz);
      else if (f === 'luminaria') d.position.set(wx, y + 0.74, wz);
      else if (f === 'miudo') { d.position.set(wx, y + 0.21, wz); d.rotation.y = giro; }
      else { d.position.set(wx, y + 0.5, wz); viraPlaca(d, x, y, z); }

      d.updateMatrix();
      (porTipo[t] ??= []).push(d.matrix.clone());
    }

    return Object.entries(porTipo).map(([tipo, ms]) => {
      const n = +tipo;
      const inst = new THREE.InstancedMesh(geos[forma(n)], mats[n] as THREE.Material, ms.length);
      ms.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.instanceMatrix.needsUpdate = true;
      inst.frustumCulled = false;
      return inst;
    });
  }, [mats]);

  // a água corre devagar: é o único movimento constante do cenário
  const agua = mats[AGUA] as THREE.MeshLambertMaterial;
  useFrame((_, dt) => {
    if (agua.map) agua.map.offset.y = (agua.map.offset.y + dt * 0.06) % 1;
  });

  return <>{malhas.map((m, i) => <primitive key={i} object={m} />)}</>;
}

// ── céu ──────────────────────────────────────────────────

/** Nuvens em bloco, andando devagar por cima do vidro da abóbada. */
function Nuvens() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const base = useMemo(() => (
    Array.from({ length: 26 }, (_, i) => {
      const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
      return {
        x: r(1) * 360 - 180, y: 30 + r(2) * 12, z: r(3) * 260 - 130,
        sx: 16 + r(4) * 26, sz: 10 + r(5) * 18,
      };
    })
  ), []);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.getElapsedTime() * 0.5;
    const d = new THREE.Object3D();
    base.forEach((n, i) => {
      d.position.set(((n.x + t + 180) % 360) - 180, n.y, n.z);
      d.scale.set(n.sx, 2.2, n.sz);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 26]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#f4f9ff" fog={false} transparent opacity={0.92} />
    </instancedMesh>
  );
}

/**
 * Pó no ar. Estufa com sol batendo tem poeira suspensa, e é ela que faz o
 * ar parecer ar em vez de vazio. Sobre o canteiro de terra a mesma coisa
 * sobe mais depressa e mais branca: é o vapor que denuncia terra morna —
 * o sintoma do último capítulo, que sem isso não teria como ser visto.
 */
function Particulas({ n, cor, tam, opacidade, cx, cz, larg, prof, y0, y1, sobe }: {
  n: number; cor: string; tam: number; opacidade: number;
  cx: number; cz: number; larg: number; prof: number;
  y0: number; y1: number; sobe: number;
}) {
  const geo = useMemo(() => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = cx + (Math.random() - 0.5) * larg;
      pos[i * 3 + 1] = y0 + Math.random() * (y1 - y0);
      pos[i * 3 + 2] = cz + (Math.random() - 0.5) * prof;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [n, cx, cz, larg, prof, y0, y1]);

  useFrame((_, dt) => {
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    const d = Math.min(dt, 0.05);
    for (let i = 0; i < a.count; i++) {
      const y = a.getY(i) + d * sobe;
      a.setY(i, y > y1 ? y0 : y);
    }
    a.needsUpdate = true;
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        color={cor} size={tam} sizeAttenuation transparent
        opacity={opacidade} depthWrite={false}
      />
    </points>
  );
}

function Sol() {
  return (
    <mesh position={[96, 92, 66]}>
      <boxGeometry args={[16, 16, 16]} />
      <meshBasicMaterial color="#fff4cf" fog={false} />
    </mesh>
  );
}

// ── jogador ──────────────────────────────────────────────

type Camera = { yaw: number; pitch: number };
type Mover = { frente: number; lado: number };

const LIMITE = Math.PI / 2 - 0.05;   // trava perto de 90°, a câmera nunca capota
const RAIO = 0.3;

/** Pode pisar aqui? Testa os quatro cantos do corpo, não só o centro. */
function livre(x: number, z: number, peY: number) {
  let piso: number | null = null;
  for (const [ax, az] of [[RAIO, RAIO], [-RAIO, RAIO], [RAIO, -RAIO], [-RAIO, -RAIO]]) {
    const p = pisoEm(x + ax, z + az, peY);
    if (p === null || p - peY > 1.01) return null;
    if (piso === null || p > piso) piso = p;
  }
  return piso;
}

function Jogador({ mover, cam, estacoes, onPerto }: {
  mover: React.MutableRefObject<Mover>;
  cam: React.MutableRefObject<Camera>;
  estacoes: Estacao[];
  onPerto: (id: string | null) => void;
}) {
  const pos = useRef(new THREE.Vector3(INICIO.x, INICIO.y, INICIO.z));
  const yVista = useRef(INICIO.y);
  const vel = useRef({ x: 0, z: 0 });
  const passo = useRef(0);
  const perto = useRef<string | null>(null);

  useFrame(({ camera }, dt) => {
    const d = Math.min(dt, 0.05);        // aba em segundo plano dá salto
    const m = mover.current;

    const s = Math.sin(cam.current.yaw), c = Math.cos(cam.current.yaw);
    const alvoX = (-s * m.frente + c * m.lado) * 4.4;
    const alvoZ = (-c * m.frente - s * m.lado) * 4.4;
    const k = 1 - Math.pow(0.0008, d);   // suavização estável em qualquer fps
    vel.current.x += (alvoX - vel.current.x) * k;
    vel.current.z += (alvoZ - vel.current.z) * k;

    const dx = vel.current.x * d, dz = vel.current.z * d;
    const px = livre(pos.current.x + dx, pos.current.z, pos.current.y);
    if (px !== null) { pos.current.x += dx; pos.current.y = px; } else vel.current.x = 0;
    const pz = livre(pos.current.x, pos.current.z + dz, pos.current.y);
    if (pz !== null) { pos.current.z += dz; pos.current.y = pz; } else vel.current.z = 0;

    // o olho sobe e desce macio: degrau seco embrulha o estômago
    yVista.current += (pos.current.y - yVista.current) * (1 - Math.pow(0.0002, d));

    const rapidez = Math.hypot(vel.current.x, vel.current.z);
    passo.current += rapidez * d * 1.8;
    camera.position.set(
      pos.current.x,
      yVista.current + ALTURA_OLHO + Math.sin(passo.current) * 0.055 * Math.min(1, rapidez / 3),
      pos.current.z,
    );
    camera.rotation.set(cam.current.pitch, cam.current.yaw, 0, 'YXZ');

    const achou = estacoes.find(e =>
      Math.hypot(e.x - pos.current.x, e.z - pos.current.z) < 5) ?? null;
    const id = achou?.id ?? null;
    if (id !== perto.current) { perto.current = id; onPerto(id); }
  });
  return null;
}

// ── marcador de cena ─────────────────────────────────────

function Marcador({ x, z, ativo }: { x: number; z: number; ativo: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const base = useMemo(
    () => alturaSolo(Math.floor(x + WX / 2), Math.floor(z + WZ / 2), 7),
    [x, z],
  );
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.position.y = base + 2.7 + Math.sin(t * 2.2) * 0.18;
    ref.current.rotation.y = t * 1.1;
  });
  const cor = ativo ? '#ffb43c' : '#b8f05a';
  return (
    <group>
      {/* feixe: dá para achar a bancada de longe, mesmo atrás do mato */}
      <mesh position={[x, base + 3.9, z]}>
        <boxGeometry args={[0.14, 5.2, 0.14]} />
        <meshBasicMaterial color={cor} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <group ref={ref} position={[x, base + 2.7, z]}>
        <mesh>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          <meshBasicMaterial color={cor} />
        </mesh>
      </group>
    </group>
  );
}

// ── cena ─────────────────────────────────────────────────

export interface Silo3DProps {
  estacoes: Estacao[];
  onPerto?: (id: string | null) => void;
}

export default function Silo3D({ estacoes, onPerto }: Silo3DProps) {
  const mover = useRef<Mover>({ frente: 0, lado: 0 });
  const cam = useRef<Camera>({ yaw: 0, pitch: -0.05 });
  const [ativa, setAtiva] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);

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
      // segurar o dedo abria o menu nativo de copiar por cima do jogo
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
        camera={{ fov: 74, near: 0.1, far: 400 }}
      >
        <color attach="background" args={['#79a6ff']} />
        <fog attach="fog" args={['#a9c9f2', 58, 205]} />
        <ambientLight intensity={0.42} />
        <hemisphereLight args={['#bcd8ff', '#6b5433', 0.4]} />
        <directionalLight position={[96, 92, 66]} intensity={1.4} color="#fff2cf" />
        <Sol />
        <Nuvens />
        <Mundo />
        <Particulas n={240} cor="#fff2cf" tam={0.09} opacidade={0.5}
          cx={0} cz={-4} larg={44} prof={86} y0={2.2} y1={15} sobe={0.17} />
        <Particulas n={70} cor="#e6f4ff" tam={0.42} opacidade={0.13}
          cx={-4} cz={-32} larg={24} prof={20} y0={5.5} y1={13} sobe={0.55} />
        {estacoes.map(s => <Marcador key={s.id} x={s.x} z={s.z} ativo={ativa === s.id} />)}
        <Jogador mover={mover} cam={cam} estacoes={estacoes} onPerto={aviso} />
      </Canvas>

      {/* mira: sem ela não dá para saber para onde a câmera aponta */}
      <div aria-hidden style={{
        position: 'absolute', left: '50%', top: '50%', width: 12, height: 12,
        marginLeft: -6, marginTop: -6, pointerEvents: 'none', opacity: 0.55,
        background:
          'linear-gradient(#fff,#fff) center/2px 12px no-repeat,'
          + 'linear-gradient(#fff,#fff) center/12px 2px no-repeat',
        mixBlendMode: 'difference',
      }} />

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
        width: 46, height: 46, display: 'grid', placeItems: 'center',
        background: 'rgba(10,13,7,0.6)', color: '#dff0b8',
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
      display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gap: 4 }}>
      <div />{b('▲', v => (mover.current.frente = v))}<div />
      {b('◄', v => (mover.current.lado = -v))}
      {b('▼', v => (mover.current.frente = -v))}
      {b('►', v => (mover.current.lado = v))}
    </div>
  );
}
