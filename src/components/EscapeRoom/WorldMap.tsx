import { useEffect, useMemo } from 'react';
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

// hue-rotate degrees to tint portal per phase kind
const KIND_HUE: Record<string, number> = {
  forest: 120,
  city:   40,
  caves:  270,
  battle: 0,
};

const WORLD_WIDTH   = 2100;
const HERO_W        = 128;
const GROUND_H      = 180;
const HUD_H         = 56;
const PHASE_WORLD_X = [240, 500, 760, 1020, 1340, 1750];

interface ZoneDef {
  id: string;
  startX: number;
  endX: number;
  skyTop: string;
  skyBot: string;
  groundGrass: string;
  groundDirt: string;
  bgImage: string | null;
}

const ZONES: ZoneDef[] = [
  { id: 'forest', startX: 0,    endX: 550,  skyTop: '#7ec8d8', skyBot: '#c8f0a0', groundGrass: '#5aaa2a', groundDirt: '#4a3a18', bgImage: null },
  { id: 'ruins',  startX: 450,  endX: 850,  skyTop: '#c08040', skyBot: '#e8b870', groundGrass: '#8a7040', groundDirt: '#4a3010', bgImage: '/assets/bg/ruins-day.jpg' },
  { id: 'city',   startX: 750,  endX: 1150, skyTop: '#4080c0', skyBot: '#a0d0f8', groundGrass: '#6090c0', groundDirt: '#304870', bgImage: '/assets/bg/city-scene.jpg' },
  { id: 'caves',  startX: 1050, endX: 1500, skyTop: '#0e0818', skyBot: '#2d1460', groundGrass: '#1a0a3a', groundDirt: '#100828', bgImage: '/assets/bg/caves-scene.jpg' },
  { id: 'desert', startX: 1400, endX: 1820, skyTop: '#e09030', skyBot: '#f8c860', groundGrass: '#c0903a', groundDirt: '#8a5820', bgImage: '/assets/bg/waste-day.jpg' },
  { id: 'tower',  startX: 1700, endX: 2100, skyTop: '#060410', skyBot: '#1c0830', groundGrass: '#1a0828', groundDirt: '#0c0418', bgImage: '/assets/bg/ruins-night.jpg' },
];

function getZone(heroX: number): ZoneDef {
  const cx = heroX + HERO_W / 2;
  // find the zone that contains heroX; prefer later zones on overlap
  let best = ZONES[0];
  for (const z of ZONES) {
    if (cx >= z.startX && cx <= z.endX) best = z;
  }
  return best;
}

const TREES: Array<{ wx: number; img: string; h: number; flip?: boolean }> = [
  { wx: 80,   img: 'tree-pine.png',   h: 88 },
  { wx: 150,  img: 'tree-birch1.png', h: 72 },
  { wx: 360,  img: 'tree-oak1.png',   h: 80 },
  { wx: 420,  img: 'tree-pine.png',   h: 96, flip: true },
  { wx: 620,  img: 'tree-birch2.png', h: 68 },
  { wx: 690,  img: 'tree-oak2.png',   h: 80 },
  { wx: 780,  img: 'tree-pine.png',   h: 100 },
  { wx: 840,  img: 'tree-birch1.png', h: 72, flip: true },
];

const CAMPFIRES: number[] = [395, 565];

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

  const zone = useMemo(() => getZone(heroWorldX), [heroWorldX]);

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

      {/* Sky — transitions per zone */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to bottom, ${zone.skyTop} 0%, ${zone.skyBot} 100%)`,
        transition: 'background 1.2s ease',
      }} />

      {/* Parallax forest layers — always present, fade near edges of forest zone */}
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
          opacity: zone.id === 'forest' ? 1 : zone.id === 'ruins' ? 0.25 : 0,
          transition: 'opacity 1.2s ease',
          zIndex: 1,
        }} />
      ))}

      {/* Zone background images — each zone's JPG strip in world coords */}
      {ZONES.filter(z => z.bgImage).map(z => {
        const stripLeft = z.startX - cameraX;
        const stripWidth = z.endX - z.startX;
        const isActive = zone.id === z.id;
        const isAdjacent = Math.abs(ZONES.indexOf(z) - ZONES.indexOf(zone)) === 1;
        return (
          <div key={z.id} style={{
            position: 'absolute',
            left: stripLeft,
            width: stripWidth,
            top: HUD_H,
            bottom: GROUND_H,
            backgroundImage: `url(${z.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isActive ? 0.82 : isAdjacent ? 0.2 : 0,
            transition: 'opacity 1.2s ease',
            zIndex: 1,
          }} />
        );
      })}

      {/* Ground — color transitions per zone */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_H,
        background: `linear-gradient(to bottom, ${zone.groundGrass} 0%, ${zone.groundGrass} 14%, ${zone.groundDirt} 14%, ${zone.groundDirt} 100%)`,
        transition: 'background 1.2s ease',
        zIndex: 2,
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: GROUND_H - 14, height: 28,
        backgroundImage: "url('/assets/world/grass.png')",
        backgroundRepeat: 'repeat-x',
        backgroundSize: 'auto 100%',
        backgroundPositionX: -(cameraX * 1.0),
        imageRendering: 'pixelated',
        opacity: zone.id === 'forest' || zone.id === 'ruins' ? 0.85 : 0.2,
        transition: 'opacity 1.2s',
        zIndex: 2,
      }} />

      {/* Trees — only forest and early ruins zone */}
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

      {/* Campfires — forest zone only */}
      {CAMPFIRES.map((wx, i) => {
        const sx = wx - cameraX;
        if (sx < -80 || sx > 470) return null;
        return (
          <div key={i} className="campfire-anim" style={{
            position: 'absolute',
            left: sx,
            bottom: GROUND_H,
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
        const hue     = KIND_HUE[phase.kind] ?? 0;

        return (
          <div key={phase.id} style={{
            position: 'absolute',
            left: sx,
            bottom: GROUND_H,
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'translateX(-50%)',
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
              opacity: locked ? 0.15 : 1,
              filter: locked
                ? 'grayscale(1)'
                : `drop-shadow(0 0 12px ${kindClr}) hue-rotate(${hue}deg)`,
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
