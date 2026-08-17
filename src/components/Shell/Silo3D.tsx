import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────
// O Núcleo Verde em 3D, rasterizado como portátil antigo.
//
// A estética não vem de modelar em blocos: vem do jeito de RENDERIZAR.
// A cena é desenhada num alvo de 208x156 — resolução de portátil — e
// depois ampliada sem suavizar. Por cima passa um shader que prende cada
// pixel a uma paleta fechada, com dithering ordenado 4x4 fingindo os
// tons que a paleta não tem. É a mesma receita da pixel art 2D do
// projeto, agora aplicada a geometria 3D.
//
// Sem isso, 3D com pouca cor só parece 3D pobre. Com isso, parece
// máquina de 16 bits.
// ─────────────────────────────────────────────────────────

const LARGURA = 208, ALTURA = 156;

/** Paleta fechada. Poucas cores, decididas — não é limitação, é o estilo. */
const PALETA = [
  '#0a0d07', '#151d10', '#232f18', '#3a4a20',
  '#4a5a24', '#5c7a1a', '#7ba428', '#a3d13f',
  '#c3d94a', '#5e6252', '#8a8e78', '#b5b89c',
  '#ede9d0', '#f8f8e8', '#7d4109', '#f7941e',
].map(h => new THREE.Color(h));

const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Bayer 4x4: o desvio antes de escolher a cor da paleta é o que cria a
// ilusão de mais tons. Sem ele a imagem fica em faixas chapadas.
const FRAG = /* glsl */`
precision mediump float;
varying vec2 vUv;
uniform sampler2D tela;
uniform vec3 paleta[16];
uniform vec2 tamanho;

float bayer(vec2 p) {
  int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0));
  int i = x + y * 4;
  float m[16];
  m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
  m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
  m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
  m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
  for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0 - 0.5;
  return 0.0;
}

void main() {
  vec3 c = texture2D(tela, vUv).rgb;
  c += bayer(vUv * tamanho) * 0.07;

  float melhor = 1e9;
  vec3 saida = paleta[0];
  for (int i = 0; i < 16; i++) {
    vec3 d = c - paleta[i];
    // verde pesa mais porque o olho enxerga mais verde
    float dist = d.r*d.r*0.30 + d.g*d.g*0.59 + d.b*d.b*0.11;
    if (dist < melhor) { melhor = dist; saida = paleta[i]; }
  }
  gl_FragColor = vec4(saida, 1.0);
}`;

/**
 * Assume o desenho: renderiza a cena no alvo pequeno e depois estampa
 * esse alvo na tela passando pelo shader de paleta.
 */
function Rasterizador() {
  const { gl, scene, camera, size } = useThree();

  const { alvo, cenaTela, camTela } = useMemo(() => {
    const alvo = new THREE.WebGLRenderTarget(LARGURA, ALTURA, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    });
    const cenaTela = new THREE.Scene();
    const camTela = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          tela: { value: alvo.texture },
          paleta: { value: PALETA },
          tamanho: { value: new THREE.Vector2(LARGURA, ALTURA) },
        },
      }),
    );
    cenaTela.add(quad);
    return { alvo, cenaTela, camTela };
  }, []);

  useEffect(() => () => alvo.dispose(), [alvo]);
  useEffect(() => { gl.setPixelRatio(1); }, [gl, size]);

  useFrame(() => {
    gl.setRenderTarget(alvo);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(cenaTela, camTela);
  }, 1);   // prioridade 1: assume o laço de desenho do react-three-fiber

  return null;
}

// ── mundo ────────────────────────────────────────────────

/** Obstáculos em planta baixa, para o jogador não atravessar parede. */
const BLOQUEIOS: [number, number, number, number][] = [
  [-6, -20, -4.4, 20],   // parede esquerda
  [4.4, -20, 6, 20],     // parede direita
  [-6, -20, 6, -18.5],   // fundo
  [-6, 18.5, 6, 20],     // trás
  [-3.4, -14, -1.6, 12], // bancada esquerda
  [1.6, -14, 3.4, 12],   // bancada direita
];

function colide(x: number, z: number) {
  const r = 0.42;
  return BLOQUEIOS.some(([x0, z0, x1, z1]) =>
    x + r > x0 && x - r < x1 && z + r > z0 && z - r < z1);
}

function Bancada({ lado, murcha }: { lado: number; murcha: boolean }) {
  const mudas = useRef<THREE.InstancedMesh>(null);
  const total = 40;

  const base = useMemo(() => {
    const arr: { z: number; alt: number; giro: number }[] = [];
    for (let i = 0; i < total; i++) {
      arr.push({
        z: -13 + i * 0.62,
        alt: 0.30 + Math.abs(Math.sin(i * 78.233)) * 0.26,
        giro: i * 0.9,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    const inst = mudas.current;
    if (!inst) return;
    const t = clock.getElapsedTime();
    const m = new THREE.Matrix4();
    for (let i = 0; i < base.length; i++) {
      const b = base[i];
      // sem vento a muda tomba; com vento ela balança e fica de pé
      const tombo = murcha ? 0.55 + Math.sin(i) * 0.12 : Math.sin(t * 1.2 + i) * 0.09;
      m.compose(
        new THREE.Vector3(lado * 2.5, 0.92 + b.alt / 2, b.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(tombo, b.giro, tombo * 0.4)),
        new THREE.Vector3(1, b.alt / 0.4, 1),
      );
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh position={[lado * 2.5, 0.8, -1]}>
        <boxGeometry args={[1.8, 0.18, 26]} />
        <meshStandardMaterial color="#8a8e78" flatShading />
      </mesh>
      <mesh position={[lado * 2.5, 0.5, -1]}>
        <boxGeometry args={[1.5, 0.6, 25.6]} />
        <meshStandardMaterial color="#5e6252" flatShading />
      </mesh>
      <mesh position={[lado * 2.5, 0.91, -1]}>
        <boxGeometry args={[1.6, 0.08, 25.7]} />
        <meshStandardMaterial color="#3a2b1a" flatShading />
      </mesh>
      <instancedMesh ref={mudas} args={[undefined, undefined, total]}>
        <coneGeometry args={[0.14, 0.4, 5]} />
        <meshStandardMaterial color={murcha ? '#8a8e78' : '#7ba428'} flatShading />
      </instancedMesh>
    </group>
  );
}

function Corredor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 40]} />
        <meshStandardMaterial color="#232f18" flatShading />
      </mesh>
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 40]} />
        <meshStandardMaterial color="#151d10" flatShading />
      </mesh>
      {[-5.2, 5.2].map(x => (
        <mesh key={x} position={[x, 2, 0]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[40, 4]} />
          <meshStandardMaterial color="#3a4a20" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 2, -19]}>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#2c3a1a" flatShading />
      </mesh>
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={i} position={[0, 2, -18 + i * 3]}>
          <torusGeometry args={[5.6, 0.16, 4, 4, Math.PI]} />
          <meshStandardMaterial color="#5e6252" flatShading />
        </mesh>
      ))}
      {/* luminárias de cultivo */}
      {Array.from({ length: 7 }, (_, i) => {
        const z = -15 + i * 5;
        return (
          <group key={z}>
            <mesh position={[0, 3.6, z]}>
              <boxGeometry args={[8, 0.14, 0.6]} />
              <meshStandardMaterial color="#c3d94a" emissive="#c3d94a" emissiveIntensity={1.5} />
            </mesh>
            <pointLight position={[0, 3.4, z]} intensity={34} distance={16} color="#c3d94a" />
          </group>
        );
      })}
      <ambientLight intensity={1.05} color="#8a8e78" />
    </>
  );
}

/** Marcadores das estações onde há algo para examinar. */
export interface Estacao { id: string; z: number; rotulo: string }

function Marcador({ z, ativo }: { z: number; ativo: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 1.9 + Math.sin(clock.getElapsedTime() * 2) * 0.12;
  });
  return (
    <mesh ref={ref} position={[0, 1.9, z]} rotation={[0, Math.PI / 4, 0]}>
      <octahedronGeometry args={[ativo ? 0.26 : 0.17]} />
      <meshStandardMaterial
        color={ativo ? '#f7941e' : '#a3d13f'}
        emissive={ativo ? '#f7941e' : '#a3d13f'}
        emissiveIntensity={ativo ? 1.4 : 0.6}
        flatShading
      />
    </mesh>
  );
}

/** Movimento em primeira pessoa, com colisão e balanço de passo. */
function Jogador({ entrada, estacoes, onPerto }: {
  entrada: React.MutableRefObject<{ frente: number; lado: number; giro: number }>;
  estacoes: Estacao[];
  onPerto: (id: string | null) => void;
}) {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(0, 1.5, 14));
  // rotação Y igual a zero já olha para -Z, que é o fundo do corredor
  const ang = useRef(0);
  const passo = useRef(0);
  const perto = useRef<string | null>(null);

  useFrame((_, dt) => {
    const e = entrada.current;
    ang.current -= e.giro * dt * 1.8;
    e.giro *= 0.82;

    // frente da câmera é (-sen, 0, -cos); a direita é (cos, 0, -sen).
    // Com o sinal trocado o boneco andava para trás olhando para a frente.
    const vel = 3.4 * dt;
    const s = Math.sin(ang.current), c = Math.cos(ang.current);
    const dx = (-s * e.frente + c * e.lado) * vel;
    const dz = (-c * e.frente - s * e.lado) * vel;

    // testa cada eixo separado: raspar na parede não trava o movimento
    if (!colide(pos.current.x + dx, pos.current.z)) pos.current.x += dx;
    if (!colide(pos.current.x, pos.current.z + dz)) pos.current.z += dz;

    const andando = Math.abs(e.frente) + Math.abs(e.lado) > 0.01;
    if (andando) passo.current += dt * 7;
    camera.position.set(
      pos.current.x,
      1.5 + (andando ? Math.sin(passo.current) * 0.045 : 0),
      pos.current.z,
    );
    camera.rotation.set(0, ang.current, andando ? Math.sin(passo.current * 0.5) * 0.008 : 0, 'YXZ');

    const achou = estacoes.find(s => Math.abs(s.z - pos.current.z) < 2.2) ?? null;
    const id = achou?.id ?? null;
    if (id !== perto.current) { perto.current = id; onPerto(id); }
  });

  return null;
}

export interface Silo3DProps {
  estacoes: Estacao[];
  /** as mudas ficam tombadas até o ventilador voltar */
  murcha?: boolean;
  onPerto?: (id: string | null) => void;
}

export default function Silo3D({ estacoes, murcha = true, onPerto }: Silo3DProps) {
  const entrada = useRef({ frente: 0, lado: 0, giro: 0 });
  const [ativa, setAtiva] = useState<string | null>(null);

  // teclado no computador
  useEffect(() => {
    const mapa: Record<string, [keyof typeof entrada.current, number]> = {
      w: ['frente', 1], s: ['frente', -1], a: ['lado', -1], d: ['lado', 1],
      arrowup: ['frente', 1], arrowdown: ['frente', -1],
      arrowleft: ['giro', -1], arrowright: ['giro', 1],
    };
    const tecla = (e: KeyboardEvent, v: number) => {
      const m = mapa[e.key.toLowerCase()];
      if (!m) return;
      e.preventDefault();
      if (m[0] === 'giro') { if (v) entrada.current.giro = m[1] * 0.9; }
      else entrada.current[m[0]] = v ? m[1] : 0;
    };
    const dn = (e: KeyboardEvent) => tecla(e, 1);
    const up = (e: KeyboardEvent) => tecla(e, 0);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  const aviso = (id: string | null) => { setAtiva(id); onPerto?.(id); };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Canvas
        style={{ position: 'absolute', inset: 0, imageRendering: 'pixelated' }}
        gl={{ antialias: false, powerPreference: 'low-power' }}
        camera={{ fov: 68, near: 0.1, far: 50 }}
      >
        <color attach="background" args={['#151d10']} />
        <fog attach="fog" args={['#151d10', 16, 44]} />
        <Corredor />
        <Bancada lado={-1} murcha={murcha} />
        <Bancada lado={1} murcha={murcha} />
        {estacoes.map(s => <Marcador key={s.id} z={s.z} ativo={ativa === s.id} />)}
        <Jogador entrada={entrada} estacoes={estacoes} onPerto={aviso} />
        <Rasterizador />
      </Canvas>

      <ControlesToque entrada={entrada} />
    </div>
  );
}

/** D-pad de toque. Sem isso o jogo não anda em celular, que é o alvo. */
function ControlesToque({ entrada }: { entrada: React.MutableRefObject<{ frente: number; lado: number; giro: number }> }) {
  const botao = (rotulo: string, aplica: (v: number) => void) => (
    <button
      onPointerDown={e => { e.preventDefault(); aplica(1); }}
      onPointerUp={() => aplica(0)}
      onPointerLeave={() => aplica(0)}
      onPointerCancel={() => aplica(0)}
      style={{
        width: 38, height: 38, display: 'grid', placeItems: 'center',
        background: 'rgba(10,13,7,0.82)', color: '#a3d13f',
        border: '2px solid #5c7a1a', fontFamily: 'monospace', fontSize: 15,
        cursor: 'pointer', touchAction: 'none',
      }}
    >
      {rotulo}
    </button>
  );

  return (
    <div style={{
      position: 'absolute', left: 8, bottom: 8, zIndex: 3,
      display: 'grid', gridTemplateColumns: 'repeat(3, 38px)', gap: 3,
    }}>
      <div />{botao('▲', v => (entrada.current.frente = v))}<div />
      {botao('◄', v => (entrada.current.giro = -v * 0.9))}
      {botao('▼', v => (entrada.current.frente = -v))}
      {botao('►', v => (entrada.current.giro = v * 0.9))}
    </div>
  );
}
