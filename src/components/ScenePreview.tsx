import { useState } from 'react';

const PACKS = [
  {
    label: 'Floresta & Árvores',
    badge: '12 CAMADAS',
    badgeColor: '#40e0d0',
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
];

const totalScenes = PACKS.reduce((s, p) => s + p.scenes.length, 0);

export default function ScenePreview({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const allScenes = PACKS.flatMap(p => p.scenes);
  const full = selected ? allScenes.find(s => s.id === selected) : null;

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
            </div>
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
    </div>
  );
}
