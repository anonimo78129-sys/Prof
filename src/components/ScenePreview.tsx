import { useEffect, useRef, useState } from 'react';

type PackScene = { id: string; thumb: string; name: string };
type ParallaxLayer = { src: string; factor: number };

type Pack = {
  label: string;
  badge: string;
  badgeColor: string;
  scenes: PackScene[];
  parallax?: ParallaxLayer[];
};

const PACKS: Pack[] = [
  {
    label: 'Floresta & Árvores',
    badge: '12 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/forest/Layer_0000_9.png',   factor: 0.05 },
      { src: '/assets/forest/Layer_0001_8.png',   factor: 0.1  },
      { src: '/assets/forest/Layer_0002_7.png',   factor: 0.18 },
      { src: '/assets/forest/Layer_0002_7_c.png', factor: 0.18 },
      { src: '/assets/forest/Layer_0003_6.png',   factor: 0.28 },
      { src: '/assets/forest/Layer_0003_6_c.png', factor: 0.28 },
      { src: '/assets/forest/Layer_0005_5.png',   factor: 0.4  },
      { src: '/assets/forest/Layer_0006_4.png',   factor: 0.55 },
      { src: '/assets/forest/Layer_0008_3.png',   factor: 0.65 },
      { src: '/assets/forest/Layer_0009_2.png',   factor: 0.78 },
      { src: '/assets/forest/Layer_0010_1.png',   factor: 0.9  },
      { src: '/assets/forest/Layer_0011_0.png',   factor: 1.0  },
    ],
    scenes: Array.from({ length: 8 }, (_, i) => ({
      id: `forest-${i + 1}`,
      thumb: `/assets/preview/forest-${i + 1}.jpg`,
      name: `Floresta ${i + 1}`,
    })),
  },
  {
    label: 'GrassLand — Free',
    badge: '5 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/grassland-free-bg1.png', factor: 0.1 },
      { src: '/assets/preview/grassland-free-bg2.png', factor: 0.3 },
      { src: '/assets/preview/grassland-free-bg3.png', factor: 0.5 },
      { src: '/assets/preview/grassland-free-bg4.png', factor: 0.75 },
      { src: '/assets/preview/grassland-free-bg5.png', factor: 1.0 },
    ],
    scenes: [
      { id: 'gl-free-example', thumb: '/assets/preview/grassland-free-example.png', name: 'Exemplo completo' },
      { id: 'gl-free-bg1',     thumb: '/assets/preview/grassland-free-bg1.png',     name: 'Camada 1 — Céu' },
      { id: 'gl-free-bg2',     thumb: '/assets/preview/grassland-free-bg2.png',     name: 'Camada 2 — Montanhas' },
      { id: 'gl-free-bg3',     thumb: '/assets/preview/grassland-free-bg3.png',     name: 'Camada 3 — Árvores dist.' },
      { id: 'gl-free-bg4',     thumb: '/assets/preview/grassland-free-bg4.png',     name: 'Camada 4 — Arbustos' },
      { id: 'gl-free-bg5',     thumb: '/assets/preview/grassland-free-bg5.png',     name: 'Camada 5 — Chão' },
    ],
  },
  {
    label: 'GrassLand — Original',
    badge: '4 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/grassland-orig-bg1.png', factor: 0.1 },
      { src: '/assets/preview/grassland-orig-bg2.png', factor: 0.35 },
      { src: '/assets/preview/grassland-orig-bg3.png', factor: 0.65 },
      { src: '/assets/preview/grassland-orig-bg4.png', factor: 1.0 },
    ],
    scenes: [
      { id: 'gl-orig-example', thumb: '/assets/preview/grassland-orig-example.png', name: 'Exemplo completo' },
      { id: 'gl-orig-bg1',     thumb: '/assets/preview/grassland-orig-bg1.png',     name: 'Camada 1 — Céu' },
      { id: 'gl-orig-bg2',     thumb: '/assets/preview/grassland-orig-bg2.png',     name: 'Camada 2 — Montanhas' },
      { id: 'gl-orig-bg3',     thumb: '/assets/preview/grassland-orig-bg3.png',     name: 'Camada 3 — Árvores' },
      { id: 'gl-orig-bg4',     thumb: '/assets/preview/grassland-orig-bg4.png',     name: 'Camada 4 — Primeiro plano' },
    ],
  },
  {
    label: 'PixelFantasy — Cavernas',
    badge: '5 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/caves-bg1.png',  factor: 0.05 },
      { src: '/assets/preview/caves-bg2.png',  factor: 0.2  },
      { src: '/assets/preview/caves-bg3.png',  factor: 0.4  },
      { src: '/assets/preview/caves-bg4a.png', factor: 0.7  },
      { src: '/assets/preview/caves-bg4b.png', factor: 1.0  },
    ],
    scenes: [
      { id: 'caves-bg1',  thumb: '/assets/preview/caves-bg1.png',  name: 'Camada 1 — Fundo escuro' },
      { id: 'caves-bg2',  thumb: '/assets/preview/caves-bg2.png',  name: 'Camada 2 — Rochas dist.' },
      { id: 'caves-bg3',  thumb: '/assets/preview/caves-bg3.png',  name: 'Camada 3 — Stalactites' },
      { id: 'caves-bg4a', thumb: '/assets/preview/caves-bg4a.png', name: 'Camada 4a — Pilastras' },
      { id: 'caves-bg4b', thumb: '/assets/preview/caves-bg4b.png', name: 'Camada 4b — Chão' },
    ],
  },
  {
    label: 'Forest Monsters — Sprites',
    badge: 'SPRITES',
    badgeColor: '#ff9060',
    scenes: [
      { id: 'monsters-idle',   thumb: '/assets/preview/monsters-mushroom-idle.png',   name: 'Cogumelo — Idle' },
      { id: 'monsters-run',    thumb: '/assets/preview/monsters-mushroom-run.png',    name: 'Cogumelo — Run' },
      { id: 'monsters-attack', thumb: '/assets/preview/monsters-mushroom-attack.png', name: 'Cogumelo — Attack' },
      { id: 'monsters-die',    thumb: '/assets/preview/monsters-mushroom-die.png',    name: 'Cogumelo — Die' },
    ],
  },
  {
    label: 'Legacy Fantasy — High Forest',
    badge: '2 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/legacy-bg.png',       factor: 0.12 },
      { src: '/assets/preview/legacy-trees-bg.png', factor: 1.0  },
    ],
    scenes: [
      { id: 'legacy-bg',        thumb: '/assets/preview/legacy-bg.png',        name: 'Camada 1 — Céu e colinas' },
      { id: 'legacy-trees-bg',  thumb: '/assets/preview/legacy-trees-bg.png',  name: 'Camada 2 — Árvores' },
      { id: 'legacy-char-idle', thumb: '/assets/preview/legacy-char-idle.png', name: 'Personagem — Idle' },
      { id: 'legacy-mob-boar',  thumb: '/assets/preview/legacy-mob-boar.png',  name: 'Mob — Javali' },
      { id: 'legacy-mob-bee',   thumb: '/assets/preview/legacy-mob-bee.png',   name: 'Mob — Abelha' },
    ],
  },
  {
    label: 'SunnyLand Forest — Godot',
    badge: '2 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/sunnyland-godot-bg.png', factor: 0.15 },
      { src: '/assets/preview/sunnyland-godot-mg.png', factor: 1.0  },
    ],
    scenes: [
      { id: 'sl-godot-bg',      thumb: '/assets/preview/sunnyland-godot-bg.png',      name: 'Camada 1 — Background' },
      { id: 'sl-godot-mg',      thumb: '/assets/preview/sunnyland-godot-mg.png',      name: 'Camada 2 — Middleground' },
      { id: 'sl-godot-player',  thumb: '/assets/preview/sunnyland-godot-player.png',  name: 'Personagem — Idle' },
      { id: 'sl-godot-tileset', thumb: '/assets/preview/sunnyland-godot-tileset.png', name: 'Tileset — Mundo' },
    ],
  },
  {
    label: 'SunnyLand Forest — Phaser',
    badge: '2 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/phaser-bg.png', factor: 0.15 },
      { src: '/assets/preview/phaser-mg.png', factor: 1.0  },
    ],
    scenes: [
      { id: 'phaser-bg',    thumb: '/assets/preview/phaser-bg.png',    name: 'Camada 1 — Background' },
      { id: 'phaser-mg',    thumb: '/assets/preview/phaser-mg.png',    name: 'Camada 2 — Middleground' },
      { id: 'phaser-atlas', thumb: '/assets/preview/phaser-atlas.png', name: 'Atlas — Sprites' },
      { id: 'phaser-title', thumb: '/assets/preview/phaser-title.png', name: 'Tela de título' },
    ],
  },
  {
    label: 'Pixel Crawler — RPG Tileset',
    badge: 'TILESET',
    badgeColor: '#c080ff',
    scenes: [
      { id: 'crawler-dungeon',   thumb: '/assets/preview/crawler-dungeon.png',   name: 'Dungeon tiles' },
      { id: 'crawler-floors',    thumb: '/assets/preview/crawler-floors.png',    name: 'Floor tiles' },
      { id: 'crawler-walls',     thumb: '/assets/preview/crawler-walls.png',     name: 'Wall tiles' },
      { id: 'crawler-char-idle', thumb: '/assets/preview/crawler-char-idle.png', name: 'Personagem — Idle' },
    ],
  },
];

const totalScenes = PACKS.reduce((s, p) => s + p.scenes.length, 0);

// ── Parallax demo modal ──────────────────────────────────────────────────────
function ParallaxDemo({ pack, onClose }: { pack: Pack; onClose: () => void }) {
  const scrollRef = useRef(0);
  const rafRef = useRef<number>(0);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const speed = 0.6; // px per frame at 60fps
    const width = 800;

    function tick() {
      scrollRef.current = (scrollRef.current + speed) % width;
      const x = scrollRef.current;
      layerRefs.current.forEach((el, i) => {
        if (!el || !pack.parallax) return;
        const factor = pack.parallax[i]?.factor ?? 0;
        el.style.backgroundPositionX = `${-Math.round(x * factor)}px`;
      });
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pack]);

  const layers = pack.parallax ?? [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10, cursor: 'pointer',
      }}
    >
      {/* scene container */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 600, aspectRatio: '2/1', overflow: 'hidden' }}>
        {layers.map((layer, i) => (
          <div
            key={layer.src}
            ref={el => { layerRefs.current[i] = el; }}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${layer.src})`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: 'auto 100%',
              backgroundPositionX: '0px',
              imageRendering: 'pixelated',
            }}
          />
        ))}
      </div>

      <p style={{ fontSize: 10, letterSpacing: 2, color: '#40e0d0', fontFamily: 'monospace' }}>
        {pack.label.toUpperCase()} — {layers.length} CAMADAS EM PARALLAX
      </p>

      {/* layer indicators */}
      <div style={{ display: 'flex', gap: 6 }}>
        {layers.map((l, i) => (
          <div key={i} style={{
            width: 20, height: 4, borderRadius: 2,
            background: `rgba(64,224,208,${0.2 + (i / (layers.length - 1)) * 0.8})`,
          }} />
        ))}
      </div>

      <p style={{ fontSize: 8, color: '#4a7a4a', fontFamily: 'monospace' }}>toque para fechar</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ScenePreview({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [demoPackLabel, setDemoPackLabel] = useState<string | null>(null);

  const allScenes = PACKS.flatMap(p => p.scenes);
  const full = selected ? allScenes.find(s => s.id === selected) : null;
  const demoPack = demoPackLabel ? PACKS.find(p => p.label === demoPackLabel) : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#060d07', overflow: 'auto',
      fontFamily: 'monospace', color: '#cfe8c0',
    }}>
      {/* topo */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(6,13,7,0.97)', borderBottom: '1px solid #1a3a1a',
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: '1px solid #2f6b34', color: '#88ff66', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 11 }}>
          ← VOLTAR
        </button>
        <span style={{ fontSize: 11, letterSpacing: 2, color: '#88ff66' }}>CENÁRIOS — PREVIEW</span>
        <span style={{ fontSize: 10, color: '#4a7a4a', marginLeft: 'auto' }}>{totalScenes} itens · {PACKS.length} packs</span>
      </div>

      {/* galeria */}
      <div style={{ padding: '16px 12px 40px' }}>
        {PACKS.map(pack => (
          <div key={pack.label} style={{ marginBottom: 32 }}>
            {/* pack header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 2 }}>
              <p style={{ fontSize: 9, letterSpacing: 2, color: '#40e0d0', margin: 0 }}>
                {pack.label.toUpperCase()}
              </p>
              <span style={{
                fontSize: 8,
                background: `${pack.badgeColor}22`,
                border: `1px solid ${pack.badgeColor}`,
                color: pack.badgeColor,
                borderRadius: 4, padding: '2px 6px', letterSpacing: 1,
              }}>
                {pack.badge}
              </span>

              {/* parallax demo button */}
              {pack.parallax && (
                <button
                  onClick={e => { e.stopPropagation(); setDemoPackLabel(pack.label); }}
                  style={{
                    marginLeft: 'auto',
                    background: 'rgba(64,224,208,0.12)', border: '1px solid #40e0d0',
                    color: '#40e0d0', borderRadius: 4, padding: '3px 10px',
                    fontSize: 8, letterSpacing: 1, cursor: 'pointer',
                  }}>
                  ▶ DEMO PARALLAX
                </button>
              )}
            </div>

            {/* thumbnails grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {pack.scenes.map(scene => (
                <div
                  key={scene.id}
                  onClick={() => setSelected(scene.id)}
                  style={{
                    borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                    border: '2px solid #1a3a1a',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#40e0d0')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#1a3a1a')}
                >
                  <img
                    src={scene.thumb}
                    alt={scene.name}
                    style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }}
                  />
                  <div style={{ background: 'rgba(8,20,10,0.9)', padding: '4px 8px', fontSize: 8, color: '#9ad08f', letterSpacing: 1 }}>
                    {scene.name.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* lightbox */}
      {full && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: 16, cursor: 'pointer',
          }}>
          <img
            src={full.thumb}
            alt={full.name}
            style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8, imageRendering: 'pixelated', border: '2px solid #40e0d0' }}
          />
          <p style={{ fontSize: 10, letterSpacing: 2, color: '#40e0d0' }}>{full.name.toUpperCase()}</p>
          <p style={{ fontSize: 8, color: '#4a7a4a' }}>toque para fechar</p>
        </div>
      )}

      {/* parallax demo */}
      {demoPack && (
        <ParallaxDemo pack={demoPack} onClose={() => setDemoPackLabel(null)} />
      )}
    </div>
  );
}
