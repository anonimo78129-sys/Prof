import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, Suspense } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────
// Cena 3D do convés agrícola.
//
// Toda a geometria nasce de código: caixa, cilindro, esfera e plano.
// Não há modelo, textura nem esqueleto — nada que precise de um artista
// 3D. É o que dá para produzir sozinho, e o acabamento low-poly de face
// chapada é escolha de estilo, não limitação disfarçada.
//
// A regra de desempenho é o número de chamadas de desenho, não o número
// de triângulos: celular fraco aguenta muito polígono e sofre com muito
// objeto solto. Por isso as plantas repetidas usam InstancedMesh, que
// desenha as 96 mudas numa chamada só.
// ─────────────────────────────────────────────────────────

const VERDE = '#7ba428';
const VERDE_ESCURO = '#4a5a24';
const METAL = '#8a8e78';
const METAL_ESCURO = '#5e6252';
const LUZ_ESTUFA = '#c3d94a';

/** As bancadas de cultivo, em duas fileiras ao longo do corredor. */
function Bancadas() {
  return (
    <>
      {[-1.9, 1.9].map(x => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.16, 15]} />
            <meshStandardMaterial color={METAL} flatShading />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.2, 0.35, 14.6]} />
            <meshStandardMaterial color={METAL_ESCURO} flatShading />
          </mesh>
          {/* terra */}
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[1.3, 0.06, 14.7]} />
            <meshStandardMaterial color="#3d2f22" flatShading />
          </mesh>
        </group>
      ))}
    </>
  );
}

/**
 * As mudas. Um cone por planta seria uma chamada de desenho por planta;
 * instanciado, as 96 saem numa chamada só e o celular nem sente.
 */
function Mudas() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const total = 96;

  const matrizes = useMemo(() => {
    const m = new THREE.Matrix4();
    const saida: THREE.Matrix4[] = [];
    let i = 0;
    for (const lado of [-1.9, 1.9]) {
      for (let z = -6.8; z <= 6.8; z += 0.6) {
        const jitter = Math.sin(i * 12.9898) * 0.12;
        const alt = 0.34 + Math.abs(Math.sin(i * 78.233)) * 0.22;
        m.compose(
          new THREE.Vector3(lado + jitter, 0.55 + alt / 2, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i * 0.7, 0)),
          new THREE.Vector3(1, alt / 0.4, 1),
        );
        saida.push(m.clone());
        i++;
      }
    }
    return saida.slice(0, total);
  }, []);

  useFrame(({ clock }) => {
    const inst = ref.current;
    if (!inst) return;
    // balanço lento: sem isso a estufa parece foto, não lugar
    const t = clock.getElapsedTime();
    for (let i = 0; i < matrizes.length; i++) {
      const m = matrizes[i].clone();
      const bal = Math.sin(t * 0.6 + i * 0.4) * 0.05;
      m.multiply(new THREE.Matrix4().makeRotationZ(bal));
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, total]} castShadow>
      <coneGeometry args={[0.16, 0.4, 5]} />
      <meshStandardMaterial color={VERDE} flatShading />
    </instancedMesh>
  );
}

/** Casco: piso, teto e as duas paredes do corredor. */
function Casco() {
  return (
    <>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 30]} />
        <meshStandardMaterial color="#2f3128" flatShading />
      </mesh>
      <mesh position={[0, 3.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 30]} />
        <meshStandardMaterial color="#23261f" flatShading />
      </mesh>
      {[-4.2, 4.2].map(x => (
        <mesh key={x} position={[x, 1.8, 0]} rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[30, 3.6]} />
          <meshStandardMaterial color="#3a3d32" flatShading />
        </mesh>
      ))}
      {/* cavernas estruturais: dão ritmo e leitura de profundidade */}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[0, 1.8, -9 + i * 1.8]}>
          <torusGeometry args={[4.6, 0.13, 4, 4, Math.PI]} />
          <meshStandardMaterial color={METAL_ESCURO} flatShading />
        </mesh>
      ))}
    </>
  );
}

/** Luminárias de cultivo: é delas que vem a cor da cena. */
function Luzes() {
  return (
    <>
      <ambientLight intensity={0.35} color="#9fb5c8" />
      {[-5, 0, 5].map(z => (
        <group key={z}>
          <mesh position={[0, 3.2, z]}>
            <boxGeometry args={[7, 0.12, 0.5]} />
            <meshStandardMaterial color={LUZ_ESTUFA} emissive={LUZ_ESTUFA} emissiveIntensity={1.6} />
          </mesh>
          <pointLight position={[0, 3, z]} intensity={22} distance={12} color={LUZ_ESTUFA} />
        </group>
      ))}
      <directionalLight position={[3, 6, 4]} intensity={0.5} color="#dfe8c0" />
    </>
  );
}

/** Câmera andando pelo corredor devagar, sem o jogador dirigir. */
function Camera({ avanco }: { avanco: number }) {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.set(
      Math.sin(t * 0.25) * 0.35,
      1.55 + Math.sin(t * 0.8) * 0.03,   // respiração do passo
      6.5 - avanco,
    );
    camera.lookAt(0, 1.45, -6);
  });
  return null;
}

export default function Cena3D({ avanco = 0 }: { avanco?: number }) {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, 2]}                       // acima de 2 não melhora e custa caro
      gl={{ antialias: false, powerPreference: 'low-power' }}
      camera={{ fov: 62, near: 0.1, far: 60 }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#151d10']} />
        <fog attach="fog" args={['#151d10', 8, 24]} />
        <Luzes />
        <Casco />
        <Bancadas />
        <Mudas />
        <Camera avanco={avanco} />
      </Suspense>
    </Canvas>
  );
}
