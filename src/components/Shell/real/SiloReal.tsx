import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { montaCenario, alturaEm, bloqueado, type Cenario } from './cenario';

// ─────────────────────────────────────────────────────────
// O NÚCLEO VERDE EM 3D DE PRODUÇÃO
//
// Versão paralela à de blocos. O que separa 3D profissional de 3D amador
// não é contagem de polígono — é o caminho da luz, e aqui ele está
// inteiro:
//
//   CÉU        modelo de Preetham (espalhamento atmosférico de verdade),
//              com o sol numa posição só, que manda em tudo abaixo
//   IBL        o próprio céu é pré-filtrado em mapa de ambiente, então
//              cada material recebe luz indireta vinda da direção certa.
//              É esse passo que tira o aspecto de objeto recortado
//   SOMBRA     mapa direcional 2048 com filtro suave
//   OCLUSÃO    GTAO escurece cantos e vãos, que é onde o olho procura
//              volume
//   BLOOM      só no que estoura, para a lâmpada e o vidro brilharem
//   ACES       curva filmica de cinema no lugar do corte duro; sem ela o
//              céu vira um borrão branco e o verde satura feio
//
// Quem tem GPU fraca perde a oclusão e ganha resolução menor, mas o
// caminho da luz continua o mesmo.
// ─────────────────────────────────────────────────────────

export interface Estacao { id: string; x: number; z: number; rotulo: string }

const SOL = new THREE.Vector3();

/**
 * Panorama equiretangular usado só como fonte de luz indireta.
 * Céu em cima, horizonte claro no meio, terracota do piso embaixo — é
 * essa cor de baixo que devolve calor para o lado de baixo das folhas e
 * tira o aspecto de objeto recortado e colado.
 */
function panoramaDeAmbiente(sol: THREE.Vector3) {
  const L = 256, A = 128;
  const c = document.createElement('canvas');
  c.width = L; c.height = A;
  const g = c.getContext('2d')!;

  const faixa = g.createLinearGradient(0, 0, 0, A);
  faixa.addColorStop(0.00, '#3f7fe0');   // zênite
  faixa.addColorStop(0.34, '#79aeee');
  faixa.addColorStop(0.48, '#cfe2f2');   // horizonte
  faixa.addColorStop(0.52, '#c9a684');   // reflexo do piso de barro
  faixa.addColorStop(0.78, '#8d6b4e');
  faixa.addColorStop(1.00, '#4f3c2c');
  g.fillStyle = faixa;
  g.fillRect(0, 0, L, A);

  // clarão do sol, largo e sem estourar: dá direção à luz indireta
  const u = (0.5 + Math.atan2(sol.x, sol.z) / (Math.PI * 2)) * L;
  const v = (Math.acos(THREE.MathUtils.clamp(sol.y, -1, 1)) / Math.PI) * A;
  for (const dx of [-L, 0, L]) {
    const brilho = g.createRadialGradient(u + dx, v, 0, u + dx, v, L * 0.22);
    brilho.addColorStop(0, 'rgba(255,246,220,0.95)');
    brilho.addColorStop(0.45, 'rgba(255,238,196,0.35)');
    brilho.addColorStop(1, 'rgba(255,232,180,0)');
    g.fillStyle = brilho;
    g.fillRect(0, 0, L, A);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

/** Céu, sol e o mapa de ambiente tirado dele. Uma direção manda em tudo. */
function CeuESol({ elevacao = 34, azimute = 152 }) {
  const { scene, gl } = useThree();

  const ceu = useMemo(() => {
    const s = new Sky();
    s.scale.setScalar(40000);
    const u = s.material.uniforms;
    u.turbidity.value = 3.4;
    u.rayleigh.value = 2.6;
    u.mieCoefficient.value = 0.006;
    u.mieDirectionalG.value = 0.82;
    return s;
  }, []);

  const sol = useMemo(() => {
    const fi = THREE.MathUtils.degToRad(90 - elevacao);
    const teta = THREE.MathUtils.degToRad(azimute);
    return SOL.setFromSphericalCoords(1, fi, teta).clone();
  }, [elevacao, azimute]);

  const [semAmbiente, setSemAmbiente] = useState(false);

  useEffect(() => {
    ceu.material.uniforms.sunPosition.value.copy(sol);
    scene.add(ceu);

    // O panorama também vira o FUNDO da cena. Antes o fundo dependia só
    // da cúpula do céu; se ela não desenhasse, sobrava a cor do CSS e a
    // tela ficava azul lisa sem explicação nenhuma.
    const fundo = panoramaDeAmbiente(sol);
    scene.background = fundo;
    scene.backgroundIntensity = 1;

    // O mapa de ambiente NÃO sai do céu de Preetham. O disco solar dele
    // passa de sessenta mil, o pré-filtro trabalha em meia precisão, o
    // valor vira infinito, o borrão transforma infinito em NaN — e aí
    // TODO material iluminado sai preto, porque a irradiância entra na
    // soma. Foi exatamente o que aconteceu aqui.
    //
    // Em vez disso, o ambiente vem de um panorama pintado à mão: zênite
    // azul, horizonte claro, e um chão quente devolvendo luz por baixo.
    // Valores controlados, mesma direção do sol, e a cor fica na minha
    // mão em vez de na do modelo atmosférico.
    // O pré-filtro precisa desenhar em ponto flutuante. Onde a GPU não
    // deixa, ele devolve textura quebrada — e textura de irradiância
    // quebrada zera a cor de TODO material iluminado. Melhor não ter
    // mapa de ambiente do que ter um envenenado.
    const ctx = gl.getContext();
    const podeFlutuar = !!(ctx.getExtension('EXT_color_buffer_half_float')
      || ctx.getExtension('EXT_color_buffer_float')
      || ctx.getExtension('WEBGL_color_buffer_float'));

    let alvo: THREE.WebGLRenderTarget | null = null;
    if (podeFlutuar) {
      try {
        const pmrem = new THREE.PMREMGenerator(gl);
        alvo = pmrem.fromEquirectangular(fundo);
        scene.environment = alvo.texture;
        scene.environmentIntensity = 1.25;
        pmrem.dispose();
      } catch {
        alvo = null;
      }
    }
    if (!alvo) {
      scene.environment = null;
      setSemAmbiente(true);
    }

    return () => {
      scene.remove(ceu);
      scene.background = null;
      scene.environment = null;
      alvo?.dispose();
      fundo.dispose();
    };
  }, [ceu, sol, scene, gl]);

  return (
    <>
      {/* Sem mapa de ambiente a cena fica sem luz indireta e escurece.
          Este hemisférico não substitui o mapa, mas garante que nunca
          exista aparelho vendo um galpão preto. */}
      <hemisphereLight
        args={['#bcd9f7', '#9a7550', semAmbiente ? 1.5 : 0.35]}
      />
    <directionalLight
      position={[sol.x * 90, sol.y * 90, sol.z * 90]}
      intensity={3.1}
      color="#fff3dd"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-near={20}
      shadow-camera-far={220}
      shadow-camera-left={-52}
      shadow-camera-right={52}
      shadow-camera-top={56}
      shadow-camera-bottom={-56}
      shadow-bias={-0.0006}
      shadow-normalBias={0.035}
    />
    </>
  );
}

/** Feixe de sol descendo pela abóbada. Falso, aditivo e barato. */
function Feixes() {
  const mat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(255,244,214,0.28)');
    grad.addColorStop(0.55, 'rgba(255,240,205,0.08)');
    grad.addColorStop(1, 'rgba(255,235,195,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 8, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({
      map: t, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, opacity: 0.22,
    });
  }, []);

  const geo = useMemo(
    () => new THREE.CylinderGeometry(1.4, 5.2, 19, 10, 1, true),
    [],
  );

  return (
    <>
      {[-38, -22, -6, 10, 26, 40].map((z, i) => (
        <mesh
          key={z}
          geometry={geo}
          material={mat}
          renderOrder={5}
          position={[i % 2 ? -7.5 : 6.5, 9, z]}
          rotation={[0.26, 0, -0.34]}
        />
      ))}
    </>
  );
}

/** Poeira no ar: só aparece de verdade depois do bloom. */
function Poeira() {
  const geo = useMemo(() => {
    const n = 900, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 42;
      pos[i * 3 + 1] = 0.4 + Math.random() * 13;
      pos[i * 3 + 2] = -46 + Math.random() * 90;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const mat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d')!;
    const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, 'rgba(255,248,228,1)');
    r.addColorStop(1, 'rgba(255,248,228,0)');
    g.fillStyle = r; g.fillRect(0, 0, 32, 32);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.PointsMaterial({
      map: t, size: 0.085, sizeAttenuation: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.75,
    });
  }, []);

  useFrame((_, dt) => {
    const a = geo.getAttribute('position') as THREE.BufferAttribute;
    const d = Math.min(dt, 0.05);
    for (let i = 0; i < a.count; i++) {
      const y = a.getY(i) + d * 0.14;
      a.setY(i, y > 13.6 ? 0.4 : y);
      a.setX(i, a.getX(i) + d * 0.06);
    }
    a.needsUpdate = true;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

// ── o cenário e o que se move nele ───────────────────────

function Cena({ pesado }: { pesado: boolean }) {
  const cen = useRef<Cenario>(undefined);
  if (!cen.current) cen.current = montaCenario();
  const c = cen.current;

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    for (const v of c.ventos) v.value += d;
    if (c.agua.normalMap) {
      c.agua.normalMap.offset.x += d * 0.012;
      c.agua.normalMap.offset.y += d * 0.019;
    }
  });

  return (
    <>
      <primitive object={c.grupo} />
      <Feixes />
      {pesado && <Poeira />}
    </>
  );
}

// ── jogador ──────────────────────────────────────────────

type Camera = { yaw: number; pitch: number };
type Mover = { frente: number; lado: number };
const LIMITE = Math.PI / 2 - 0.05;
const OLHO = 1.68;

function Jogador({ mover, cam, estacoes, onPerto }: {
  mover: React.MutableRefObject<Mover>;
  cam: React.MutableRefObject<Camera>;
  estacoes: Estacao[];
  onPerto: (id: string | null) => void;
}) {
  const pos = useRef(new THREE.Vector3(0, 4.5, 32.5));
  const yVista = useRef(4.5);
  const vel = useRef({ x: 0, z: 0 });
  const passo = useRef(0);
  const perto = useRef<string | null>(null);

  useFrame(({ camera }, dt) => {
    const d = Math.min(dt, 0.05);
    const m = mover.current;
    const s = Math.sin(cam.current.yaw), co = Math.cos(cam.current.yaw);
    const alvoX = (-s * m.frente + co * m.lado) * 4.6;
    const alvoZ = (-co * m.frente - s * m.lado) * 4.6;
    const k = 1 - Math.pow(0.0008, d);
    vel.current.x += (alvoX - vel.current.x) * k;
    vel.current.z += (alvoZ - vel.current.z) * k;

    const passa = (x: number, z: number) => !bloqueado(x, z);
    const nx = pos.current.x + vel.current.x * d;
    const nz = pos.current.z + vel.current.z * d;
    const r = 0.34;
    if (passa(nx + Math.sign(vel.current.x) * r, pos.current.z)) pos.current.x = nx;
    else vel.current.x = 0;
    if (passa(pos.current.x, nz + Math.sign(vel.current.z) * r)) pos.current.z = nz;
    else vel.current.z = 0;

    pos.current.y = alturaEm(pos.current.x, pos.current.z);
    yVista.current += (pos.current.y - yVista.current) * (1 - Math.pow(0.0002, d));

    const rapidez = Math.hypot(vel.current.x, vel.current.z);
    passo.current += rapidez * d * 1.9;
    camera.position.set(
      pos.current.x,
      yVista.current + OLHO + Math.sin(passo.current) * 0.05 * Math.min(1, rapidez / 3),
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

function Marcador({ x, z, ativo }: { x: number; z: number; ativo: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const y = alturaEm(x, z);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.position.y = y + 2.5 + Math.sin(t * 2) * 0.16;
    ref.current.rotation.y = t * 0.9;
  });
  const cor = ativo ? '#ffbe55' : '#9fe870';
  return (
    <group>
      <mesh ref={ref} position={[x, y + 2.5, z]}>
        <octahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial
          color={cor} emissive={cor} emissiveIntensity={ativo ? 4 : 2.2} roughness={0.3}
        />
      </mesh>
      <mesh position={[x, y + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.75, 40]} />
        <meshBasicMaterial color={cor} transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── pós-processamento ────────────────────────────────────

/**
 * Ajuste do renderizador. Fica fora do pós-processamento de propósito:
 * curva de cor, sombra e exposição são o que dá acabamento, e precisam
 * valer mesmo no aparelho que não aguentar os passos extras.
 *
 * A curva é a NEUTRAL, não a ACES: a ACES é linda em cena de filme e
 * lava a cor saturada, e aqui o verde do canteiro e a flor são o assunto.
 */
function Renderizador() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  return null;
}

function Pipeline({ pesado }: { pesado: boolean }) {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    // Meia precisão evita bandeamento no céu, mas nem toda GPU aceita
    // desenhar nesse formato — sem a extensão o quadro sai preto, e é
    // melhor bandear um pouco do que não aparecer nada.
    const ctx = gl.getContext();
    const meia = !!(ctx.getExtension('EXT_color_buffer_half_float')
      || ctx.getExtension('EXT_color_buffer_float'));
    const alvo = new THREE.WebGLRenderTarget(1, 1, {
      type: meia ? THREE.HalfFloatType : THREE.UnsignedByteType,
      samples: pesado ? 4 : 0,
    });
    const c = new EffectComposer(gl, alvo);
    c.addPass(new RenderPass(scene, camera));

    if (pesado) {
      const ao = new GTAOPass(scene, camera, 1, 1);
      ao.blendIntensity = 0.85;
      ao.updateGtaoMaterial({
        radius: 0.42, distanceExponent: 1.2, thickness: 1.4,
        scale: 1.1, samples: 10, screenSpaceRadius: false,
      });
      c.addPass(ao);
    }

    c.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.34, 0.62, 0.86));
    c.addPass(new OutputPass());
    if (!pesado) c.addPass(new ShaderPass(FXAAShader));
    return c;
  }, [gl, scene, camera, pesado]);

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio, pesado ? 2 : 1.4);
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
    for (const p of composer.passes) {
      const u = (p as ShaderPass).uniforms;
      if (u?.resolution) u.resolution.value.set(1 / (size.width * dpr), 1 / (size.height * dpr));
    }
  }, [composer, size, pesado]);


  const quebrou = useRef(false);
  useFrame((_, dt) => {
    if (quebrou.current) { gl.render(scene, camera); return; }
    try {
      composer.render(dt);
    } catch (e) {
      // GPU sem suporte a algum passo: cai para o desenho direto em vez
      // de deixar a tela vazia
      console.warn('pós-processamento desligado:', e);
      quebrou.current = true;
    }
  }, 1);
  return null;
}

// ── a tela ───────────────────────────────────────────────

/**
 * Sonda de saúde. Se a tela ficar vazia num aparelho que não está aqui,
 * a única forma de descobrir o motivo é a própria tela contar. Ela
 * aparece sozinha quando nada é desenhado, e com #diag aparece sempre.
 */
function Sonda({ aviso }: { aviso: (t: string) => void }) {
  const { gl } = useThree();
  const q = useRef(0);

  useEffect(() => {
    const tela = gl.domElement;
    const perdeu = (e: Event) => { e.preventDefault(); aviso('CONTEXTO WEBGL PERDIDO'); };
    tela.addEventListener('webglcontextlost', perdeu);
    return () => tela.removeEventListener('webglcontextlost', perdeu);
  }, [gl, aviso]);

  useFrame(() => {
    // primeiro relatório cedo, depois de tempos em tempos: num aparelho
    // que desenha dois quadros por segundo, esperar cinquenta quadros é
    // esperar meio minuto
    q.current++;
    if (q.current !== 12 && q.current % 150 !== 0) return;
    const ctx = gl.getContext();
    const info = ctx.getExtension('WEBGL_debug_renderer_info');
    const placa = info
      ? String(ctx.getParameter(info.UNMASKED_RENDERER_WEBGL)).slice(0, 40)
      : 'placa desconhecida';
    const tri = gl.info.render.triangles;
    aviso(`${tri === 0 ? 'NADA DESENHADO · ' : ''}tri ${tri} · calls ${gl.info.render.calls} · ${placa}`);
  });
  return null;
}

export interface SiloRealProps {
  estacoes: Estacao[];
  onPerto?: (id: string | null) => void;
}

export default function SiloReal({ estacoes, onPerto }: SiloRealProps) {
  const mover = useRef<Mover>({ frente: 0, lado: 0 });
  const cam = useRef<Camera>({ yaw: 0, pitch: -0.08 });
  const [ativa, setAtiva] = useState<string | null>(null);
  const [saude, setSaude] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);

  // Aparelho fraco perde oclusão e resolução, nunca o caminho da luz.
  // #leve e #pesado no endereço forçam um dos dois, para dar para testar
  // o modo do celular fraco num aparelho bom.
  const pesado = useMemo(() => {
    const h = typeof location !== 'undefined' ? location.hash : '';
    if (h.includes('leve')) return false;
    if (h.includes('pesado')) return true;
    const n = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;
    return n >= 6 && mem >= 4;
  }, []);

  // Bloom e oclusão entram por cima, e nem toda GPU dá conta de desenhar
  // fora da tela em meia precisão. Ficam atrás de #pos até dar para
  // conferir num aparelho de verdade.
  const comPos = useMemo(
    () => typeof location !== 'undefined' && location.hash.includes('pos'),
    [],
  );

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
      onContextMenu={e => e.preventDefault()}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden', background: '#8fb4d8',
        touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
      }}
    >
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 62, near: 0.15, far: 500 }}
        shadows
      >
        <fogExp2 attach="fog" args={['#c3d8ec', 0.0055]} />
        <CeuESol />
        <ambientLight intensity={0.18} />
        <Cena pesado={pesado} />
        {estacoes.map(s => <Marcador key={s.id} x={s.x} z={s.z} ativo={ativa === s.id} />)}
        <Jogador mover={mover} cam={cam} estacoes={estacoes} onPerto={aviso} />
        <Renderizador />
        {comPos && <Pipeline pesado={pesado} />}
        <Sonda aviso={setSaude} />
      </Canvas>

      <div aria-hidden style={{
        position: 'absolute', left: '50%', top: '50%', width: 10, height: 10,
        marginLeft: -5, marginTop: -5, pointerEvents: 'none', opacity: 0.5,
        border: '1.5px solid #fff', borderRadius: '50%',
        mixBlendMode: 'difference',
      }} />

      {saude && (/NADA DESENHADO|PERDIDO/.test(saude)
        || (typeof location !== 'undefined' && location.hash.includes('diag'))) && (
        <div style={{
          position: 'absolute', left: 8, right: 8, top: 8, zIndex: 6,
          background: 'rgba(8,12,16,0.84)', color: '#d6ecff', padding: '6px 8px',
          font: '11px/1.4 ui-monospace, monospace', borderRadius: 4,
          pointerEvents: 'none', wordBreak: 'break-word',
        }}>
          {saude}
        </div>
      )}

      <Dpad mover={mover} />
    </div>
  );
}

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
        background: 'rgba(12,18,24,0.5)', color: '#e8f2f8',
        border: '1px solid rgba(232,242,248,0.5)', borderRadius: 23,
        backdropFilter: 'blur(6px)',
        fontFamily: 'system-ui, sans-serif', fontSize: 15, cursor: 'pointer',
        touchAction: 'none', userSelect: 'none',
        WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
      }}
    >
      {rotulo}
    </button>
  );
  return (
    <div data-dpad style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 3,
      display: 'grid', gridTemplateColumns: 'repeat(3, 46px)', gap: 5 }}>
      <div />{b('▲', v => (mover.current.frente = v))}<div />
      {b('◄', v => (mover.current.lado = -v))}
      {b('▼', v => (mover.current.frente = -v))}
      {b('►', v => (mover.current.lado = v))}
    </div>
  );
}
