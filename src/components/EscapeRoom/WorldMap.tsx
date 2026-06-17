import { useEffect } from 'react';
import type { PhaseDef, PhaseProgress, FragmentName } from '../../types/game';
import AnimatedHero from './mechanics/AnimatedHero';
import DPad from './ui/DPad';
import DialogBox from './ui/DialogBox';
import { useHeroMovement } from '../../hooks/useHeroMovement';
import { PHASE_ARRIVAL } from '../../data/narrative';

interface Props {
  phases: PhaseDef[];
  progress: Record<string, PhaseProgress>;
  currentIndex: number;
  fragments: FragmentName[];
  coins: number;
  freePlay?: boolean;
  onEnterPhase: (index: number) => void;
}

const FRAG_META: Record<FragmentName, { color: string; img: string; label: string }> = {
  esmeralda: { color: '#00cc66', img: '/assets/frags/frag-esmeralda.png', label: 'Esmeralda' },
  ambar:     { color: '#ffc800', img: '/assets/frags/frag-ambar.png',     label: 'Âmbar' },
  safira:    { color: '#3399ff', img: '/assets/frags/frag-safira.png',    label: 'Safira' },
};

const KIND_COLOR: Record<string, string> = {
  forest: '#2a8c2a',
  city:   '#c88f20',
  caves:  '#8833cc',
  battle: '#cc3322',
};

const WORLD_WIDTH   = 2100;
const HERO_W        = 128;
const GROUND_H      = 180;
const HUD_H         = 56;
const PHASE_WORLD_X = [240, 500, 760, 1020, 1340, 1750];

const TREES: Array<{ wx: number; img: string; h: number; flip?: boolean }> = [
  { wx: 80,   img: 'tree-pine.png',   h: 88 },
  { wx: 150,  img: 'tree-birch1.png', h: 72 },
  { wx: 360,  img: 'tree-oak1.png',   h: 80 },
  { wx: 420,  img: 'tree-pine.png',   h: 96, flip: true },
  { wx: 620,  img: 'tree-birch2.png', h: 68 },
  { wx: 690,  img: 'tree-oak2.png',   h: 80 },
  { wx: 870,  img: 'tree-pine.png',   h: 100 },
  { wx: 940,  img: 'tree-birch1.png', h: 72, flip: true },
  { wx: 1130, img: 'tree-oak1.png',   h: 80 },
  { wx: 1200, img: 'tree-pine.png',   h: 88 },
  { wx: 1460, img: 'tree-birch2.png', h: 68 },
  { wx: 1535, img: 'tree-pine.png',   h: 96, flip: true },
  { wx: 1600, img: 'tree-oak2.png',   h: 80 },
  { wx: 1900, img: 'tree-pine.png',   h: 100 },
  { wx: 1980, img: 'tree-birch1.png', h: 72 },
];

const CAMPFIRES: number[] = [395, 655, 955, 1260];

const BG_LAYERS = [
  { src: '/assets/world/bg-castle.png', factor: 0.04 },
  { src: '/assets/world/bg-layer4.png', factor: 0.10 },
  { src: '/assets/world/bg-layer3.png', factor: 0.22 },
  { src: '/assets/world/bg-layer2.png', factor: 0.42 },
  { src: '/assets/world/bg-layer1.png', factor: 0.62 },
];

export default function WorldMap({
  phases, progress, currentIndex, fragments, coins, freePlay = false, onEnterPhase,
}: Props) {
  const initX = Math.max(0, PHASE_WORLD_X[Math.min(currentIndex, phases.length - 1)] - HERO_W / 2 - 60);

  const { heroWorldX, cameraX, isWalking, facingLeft, nearNodeIdx, startWalking, stopWalking } =
    useHeroMovement({
      worldWidth: WORLD_WIDTH,
      heroWidth: HERO_W,
      nodeWorldX: PHASE_WORLD_X,
      nodeTriggerDist: 80,
      initialX: initX,
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && nearNodeIdx !== null) {
        const locked = freePlay ? false : nearNodeIdx > currentIndex;
        if (!locked) onEnterPhase(nearNodeIdx);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nearNodeIdx, freePlay, currentIndex, onEnterPhase]);

  const heroScreenX = heroWorldX - cameraX;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ touchAction: 'none' }}>

      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 z-20 bar-wood flex items-center justify-between px-4 py-2" style={{ height: HUD_H }}>
        <div className="flex gap-2 items-center">
          {(['esmeralda', 'ambar', 'safira'] as FragmentName[]).map(f => {
            const has = fragments.includes(f);
            const m = FRAG_META[f];
            return (
              <div key={f} title={m.label} style={{ width: 22, height: 22, opacity: has ? 1 : 0.3, filter: has ? `drop-shadow(0 0 6px ${m.color})` : 'grayscale(1)' }}>
                <img src={m.img} alt={m.label} style={{ width: '100%', imageRendering: 'pixelated' }} />
              </div>
            );
          })}
        </div>
        <p className="font-pixel" style={{ color: '#f7ead5', fontSize: 8, textShadow: '1px 2px 0 #1a0c04' }}>ÉTER</p>
        <div className="flex items-center gap-1">
          <img src="/assets/objects/coin1.png" alt="moedas" style={{ width: 18, imageRendering: 'pixelated' }} />
          <span className="font-pixel" style={{ color: '#ffd700', fontSize: 8, textShadow: '1px 2px 0 #000' }}>{coins}</span>
        </div>
      </div>

      {freePlay && (
        <div className="fixed z-20 left-0 right-0 flex justify-center" style={{ top: HUD_H + 4 }}>
          <div className="panel-parchment px-3 py-1 text-center" style={{ background: 'linear-gradient(160deg,#fff4d0,#f0d890)' }}>
            <p className="font-pixel" style={{ color: '#8b5e00', fontSize: 6 }}>🔓 MODO TESTE — TUDO LIBERADO</p>
          </div>
        </div>
      )}

      {/* Sky */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, #7ec8d8 0%, #b4e8f4 45%, #c8f0a0 72%, #5a9a2a 100%)',
      }} />

      {/* Parallax BG layers */}
      {BG_LAYERS.map(({ src, factor }) => (
        <div key={src} style={{
          position: 'absolute',
          left: 0, right: 0,
          bottom: GROUND_H,
          height: `calc(100% - ${HUD_H}px - ${GROUND_H}px)`,
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          backgroundPosition: `${-(cameraX * factor).toFixed(1)}px bottom`,
          imageRendering: 'pixelated',
        }} />
      ))}

      {/* Ground */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_H,
        background: 'linear-gradient(to bottom, #5aaa2a 0%, #5aaa2a 14%, #4a3a18 14%, #3a2a0e 100%)',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: GROUND_H - 14, height: 28,
        backgroundImage: "url('/assets/world/grass.png')",
        backgroundRepeat: 'repeat-x',
        backgroundSize: 'auto 100%',
        backgroundPositionX: -(cameraX * 1.0),
        imageRendering: 'pixelated',
        opacity: 0.85,
      }} />

      {/* Trees */}
      {TREES.map((t, i) => {
        const sx = t.wx - cameraX;
        if (sx < -160 || sx > 590) return null;
        return (
          <img key={i} src={`/assets/world/${t.img}`}
            style={{
              position: 'absolute',
              left: sx,
              bottom: GROUND_H,
              height: t.h,
              imageRendering: 'pixelated',
              transform: t.flip ? 'scaleX(-1)' : undefined,
              zIndex: 3,
            }}
          />
        );
      })}

      {/* Campfires */}
      {CAMPFIRES.map((wx, i) => {
        const sx = wx - cameraX;
        if (sx < -80 || sx > 470) return null;
        return (
          <div key={i} className="campfire-anim" style={{
            position: 'absolute',
            left: sx,
            bottom: GROUND_H,
            width: 40,
            height: 64,
            zIndex: 3,
          }} />
        );
      })}

      {/* Phase portals */}
      {phases.map((phase, i) => {
        const sx = PHASE_WORLD_X[i] - cameraX;
        if (sx < -200 || sx > 590) return null;
        const locked  = freePlay ? false : i > currentIndex;
        const done    = progress[phase.id]?.completed ?? false;
        const isNear  = nearNodeIdx === i;
        const stars   = progress[phase.id]?.stars ?? 0;
        const kindClr = KIND_COLOR[phase.kind] ?? '#888';

        return (
          <div key={phase.id} style={{
            position: 'absolute',
            left: sx - 64,
            bottom: GROUND_H,
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 2, pointerEvents: 'none' }}>
              <span style={{ fontSize: 24, filter: locked ? 'grayscale(1)' : `drop-shadow(0 0 6px ${kindClr})` }}>
                {locked ? '🔒' : phase.icon}
              </span>
              <p className="font-pixel" style={{ color: locked ? '#888' : '#f7ead5', fontSize: 5, textShadow: '1px 1px 0 #000', marginTop: 2 }}>
                {phase.title}
              </p>
              {done && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  {Array.from({ length: 3 }, (_, s) => (
                    <span key={s} style={{ fontSize: 10, filter: s < stars ? 'none' : 'grayscale(1) brightness(0.4)' }}>⭐</span>
                  ))}
                </div>
              )}
            </div>

            <div className={locked ? undefined : 'portal-anim'} style={{
              width: 128, height: 128,
              opacity: locked ? 0.2 : 1,
              filter: locked ? 'grayscale(1)' : (isNear ? `drop-shadow(0 0 16px ${kindClr})` : undefined),
              imageRendering: 'pixelated',
            }} />

            {isNear && !locked && (
              <button
                onClick={() => onEnterPhase(i)}
                className="btn-rpg font-pixel"
                style={{ fontSize: 7, padding: '5px 10px', marginTop: 4, zIndex: 5 }}
              >
                {done ? 'JOGAR DE NOVO' : '▶ ENTRAR'}
              </button>
            )}
          </div>
        );
      })}

      {/* Hero */}
      <div style={{
        position: 'absolute',
        left: heroScreenX,
        bottom: GROUND_H,
        zIndex: 6,
        pointerEvents: 'none',
      }}>
        <AnimatedHero scale={2} walking={isWalking} facingLeft={facingLeft} />
      </div>

      {/* Iris dialog near phase */}
      {nearNodeIdx !== null && (
        <div className="fixed left-0 right-0" style={{ bottom: 72, zIndex: 25 }}>
          <DialogBox
            portrait="/assets/chars/char-iris.png"
            name="ÍRIS"
            text={PHASE_ARRIVAL[phases[nearNodeIdx].id] ?? 'Toque em ENTRAR para jogar esta fase!'}
            accentColor="#00a88a"
          />
        </div>
      )}

      {/* D-Pad */}
      <DPad
        onStart={startWalking}
        onStop={stopWalking}
        onAction={() => {
          if (nearNodeIdx !== null) {
            const locked = freePlay ? false : nearNodeIdx > currentIndex;
            if (!locked) onEnterPhase(nearNodeIdx);
          }
        }}
      />
    </div>
  );
}
