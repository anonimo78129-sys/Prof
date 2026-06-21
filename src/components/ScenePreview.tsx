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
      { id: 'gl-free-guide',   thumb: '/assets/preview/grassland-free-guide.png',   name: 'Guia de camadas' },
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
  {
    label: 'Tall Forest',
    badge: '3 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/tallforest-back.png',   factor: 0.08 },
      { src: '/assets/preview/tallforest-far.png',    factor: 0.35 },
      { src: '/assets/preview/tallforest-middle.png', factor: 1.0  },
    ],
    scenes: [
      { id: 'tf-preview', thumb: '/assets/preview/tallforest-preview.png', name: 'Cena completa' },
      { id: 'tf-back',    thumb: '/assets/preview/tallforest-back.png',    name: 'Camada 1 — Fundo' },
      { id: 'tf-far',     thumb: '/assets/preview/tallforest-far.png',     name: 'Camada 2 — Distante' },
      { id: 'tf-middle',  thumb: '/assets/preview/tallforest-middle.png',  name: 'Camada 3 — Primeiro plano' },
    ],
  },
  {
    label: 'SunnyLand Forest — Arquivos Originais',
    badge: '3 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/sunnyland-files-bg.png',    factor: 0.12 },
      { src: '/assets/preview/sunnyland-files-mg.png',    factor: 0.5  },
      { src: '/assets/preview/sunnyland-files-props.png', factor: 1.0  },
    ],
    scenes: [
      { id: 'slf-preview', thumb: '/assets/preview/sunnyland-files-preview.png', name: 'Cena completa' },
      { id: 'slf-bg',      thumb: '/assets/preview/sunnyland-files-bg.png',      name: 'Camada 1 — Background' },
      { id: 'slf-mg',      thumb: '/assets/preview/sunnyland-files-mg.png',      name: 'Camada 2 — Middleground' },
      { id: 'slf-props',   thumb: '/assets/preview/sunnyland-files-props.png',   name: 'Camada 3 — Props' },
      { id: 'slf-player',  thumb: '/assets/preview/sunnyland-files-player.png',  name: 'Personagem — Idle' },
      { id: 'slf-bee',     thumb: '/assets/preview/sunnyland-files-bee.png',     name: 'Inimigo — Abelha' },
    ],
  },
  {
    label: 'Minifolks — Animais da Floresta',
    badge: 'SPRITES',
    badgeColor: '#ff9060',
    scenes: [
      { id: 'mf-fox',    thumb: '/assets/preview/minifolks-fox.png',    name: 'Raposa' },
      { id: 'mf-deer',   thumb: '/assets/preview/minifolks-deer.png',   name: 'Cervo' },
      { id: 'mf-bear',   thumb: '/assets/preview/minifolks-bear.png',   name: 'Urso' },
      { id: 'mf-bird',   thumb: '/assets/preview/minifolks-bird.png',   name: 'Pássaro' },
      { id: 'mf-wolf',   thumb: '/assets/preview/minifolks-wolf.png',   name: 'Lobo' },
      { id: 'mf-bunny',  thumb: '/assets/preview/minifolks-bunny.png',  name: 'Coelho' },
    ],
  },
  {
    label: 'Forest of Illusion',
    badge: '2 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/illusion-back.png',   factor: 0.1 },
      { src: '/assets/preview/illusion-middle.png', factor: 1.0 },
    ],
    scenes: [
      { id: 'ill-preview', thumb: '/assets/preview/illusion-preview.png', name: 'Preview completo' },
      { id: 'ill-back',    thumb: '/assets/preview/illusion-back.png',    name: 'Camada 1 — Fundo' },
      { id: 'ill-middle',  thumb: '/assets/preview/illusion-middle.png',  name: 'Camada 2 — Frente' },
      { id: 'ill-tiles',   thumb: '/assets/preview/illusion-tiles.png',   name: 'Tileset' },
    ],
  },
  {
    label: 'SunnyLand Winter Forest',
    badge: '4 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/slwinter-sky.png',       factor: 0.05 },
      { src: '/assets/preview/slwinter-mountains.png', factor: 0.2  },
      { src: '/assets/preview/slwinter-mida.png',      factor: 0.55 },
      { src: '/assets/preview/slwinter-midb.png',      factor: 1.0  },
    ],
    scenes: [
      { id: 'slw-sky',    thumb: '/assets/preview/slwinter-sky.png',       name: 'Camada 1 — Céu' },
      { id: 'slw-mtn',    thumb: '/assets/preview/slwinter-mountains.png', name: 'Camada 2 — Montanhas' },
      { id: 'slw-mida',   thumb: '/assets/preview/slwinter-mida.png',      name: 'Camada 3 — Meio A' },
      { id: 'slw-midb',   thumb: '/assets/preview/slwinter-midb.png',      name: 'Camada 4 — Meio B' },
      { id: 'slw-yeti',   thumb: '/assets/preview/slwinter-yeti.png',      name: 'Inimigo — Yeti' },
    ],
  },
  {
    label: 'Magic Cliffs — Godot',
    badge: '4 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/magic-sky.png',        factor: 0.05 },
      { src: '/assets/preview/magic-clouds.png',     factor: 0.2  },
      { src: '/assets/preview/magic-fargrounds.png', factor: 0.55 },
      { src: '/assets/preview/magic-sea.png',        factor: 1.0  },
    ],
    scenes: [
      { id: 'mc-sky',    thumb: '/assets/preview/magic-sky.png',        name: 'Camada 1 — Céu' },
      { id: 'mc-clouds', thumb: '/assets/preview/magic-clouds.png',     name: 'Camada 2 — Nuvens' },
      { id: 'mc-far',    thumb: '/assets/preview/magic-fargrounds.png', name: 'Camada 3 — Penhascos' },
      { id: 'mc-sea',    thumb: '/assets/preview/magic-sea.png',        name: 'Camada 4 — Mar' },
      { id: 'mc-player', thumb: '/assets/preview/magic-player-idle.png', name: 'Personagem — Idle' },
    ],
  },
  {
    label: 'Free Cute Tileset',
    badge: '3 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/cute-bg1.png', factor: 0.1  },
      { src: '/assets/preview/cute-bg2.png', factor: 0.45 },
      { src: '/assets/preview/cute-bg3.png', factor: 1.0  },
    ],
    scenes: [
      { id: 'cute-mockup',  thumb: '/assets/preview/cute-mockup.png',  name: 'Mockup — Cena completa' },
      { id: 'cute-bg1',     thumb: '/assets/preview/cute-bg1.png',     name: 'Camada 1 — Fundo' },
      { id: 'cute-bg2',     thumb: '/assets/preview/cute-bg2.png',     name: 'Camada 2 — Meio' },
      { id: 'cute-bg3',     thumb: '/assets/preview/cute-bg3.png',     name: 'Camada 3 — Frente' },
      { id: 'cute-tileset', thumb: '/assets/preview/cute-tileset.png', name: 'Tileset' },
    ],
  },
  {
    label: 'Jungle Asset Pack',
    badge: '5 CAMADAS',
    badgeColor: '#40e0d0',
    parallax: [
      { src: '/assets/preview/jungle-plx1.png', factor: 0.05 },
      { src: '/assets/preview/jungle-plx2.png', factor: 0.15 },
      { src: '/assets/preview/jungle-plx3.png', factor: 0.35 },
      { src: '/assets/preview/jungle-plx4.png', factor: 0.65 },
      { src: '/assets/preview/jungle-plx5.png', factor: 1.0  },
    ],
    scenes: [
      { id: 'jng-mockup', thumb: '/assets/preview/jungle-mockup.png',  name: 'Mockup — Cena completa' },
      { id: 'jng-plx1',   thumb: '/assets/preview/jungle-plx1.png',   name: 'Camada 1 — Fundo' },
      { id: 'jng-plx2',   thumb: '/assets/preview/jungle-plx2.png',   name: 'Camada 2' },
      { id: 'jng-plx3',   thumb: '/assets/preview/jungle-plx3.png',   name: 'Camada 3' },
      { id: 'jng-plx4',   thumb: '/assets/preview/jungle-plx4.png',   name: 'Camada 4' },
      { id: 'jng-plx5',   thumb: '/assets/preview/jungle-plx5.png',   name: 'Camada 5 — Frente' },
      { id: 'jng-ts',     thumb: '/assets/preview/jungle-tileset.png', name: 'Tileset' },
    ],
  },
  {
    label: 'Flying Forest Enemies',
    badge: 'SPRITES',
    badgeColor: '#ff9060',
    scenes: [
      { id: 'fly-idle',   thumb: '/assets/preview/flying-enemy3-idle.png',   name: 'Enemy3 — Idle' },
      { id: 'fly-fly',    thumb: '/assets/preview/flying-enemy3-fly.png',    name: 'Enemy3 — Fly' },
      { id: 'fly-attack', thumb: '/assets/preview/flying-enemy3-attack.png', name: 'Enemy3 — Attack' },
      { id: 'fly-die',    thumb: '/assets/preview/flying-enemy3-die.png',    name: 'Enemy3 — Die' },
    ],
  },
  {
    label: 'Village Props — Pixel Art',
    badge: 'TILESET',
    badgeColor: '#c080ff',
    scenes: [
      { id: 'vil-props',  thumb: '/assets/preview/village-props.png',  name: 'Props do vilarejo' },
      { id: 'vil-ground', thumb: '/assets/preview/village-ground.png', name: 'Chão / terreno' },
      { id: 'vil-chest',  thumb: '/assets/preview/village-chest.png',  name: 'Baú (animação)' },
      { id: 'vil-flame',  thumb: '/assets/preview/village-flame.png',  name: 'Chama FX' },
    ],
  },
  {
    label: 'Fonts — GB Studio',
    badge: 'FONTES',
    badgeColor: '#ffd060',
    scenes: [
      { id: 'fgb-default', thumb: '/assets/preview/fonts-gb-default.png', name: 'Default' },
      { id: 'fgb-slant',   thumb: '/assets/preview/fonts-gb-slant.png',   name: 'Slant' },
      { id: 'fgb-thick',   thumb: '/assets/preview/fonts-gb-thick.png',   name: 'Thick' },
      { id: 'fgb-tiny',    thumb: '/assets/preview/fonts-gb-tiny.png',    name: 'Tiny' },
      { id: 'fgb-frenger', thumb: '/assets/preview/fonts-gb-frenger.png', name: 'Frengertype' },
    ],
  },
  {
    label: '11 Game Boy Font Pack',
    badge: 'FONTES',
    badgeColor: '#ffd060',
    scenes: [
      { id: 'gb11-01', thumb: '/assets/preview/fonts-gb11-01.png', name: 'AccessDenied Mono' },
      { id: 'gb11-05', thumb: "/assets/preview/fonts-gb11-05.png", name: "That's Delaware" },
      { id: 'gb11-10', thumb: '/assets/preview/fonts-gb11-10.png', name: '16-bit Dreams Clean' },
      { id: 'gb11-13', thumb: '/assets/preview/fonts-gb11-13.png', name: 'DetectivesNdames' },
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
