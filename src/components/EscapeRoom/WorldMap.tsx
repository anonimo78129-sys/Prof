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
  forest: '#2aaa44',
  city:   '#c88f20',
  caves:  '#9933dd',
  battle: '#cc3322',
};

const KIND_HUE: Record<string, number> = { forest: 120, city: 40, caves: 270, battle: 0 };

// ─── World dimensions ────────────────────────────────────────────────────────
const WORLD_WIDTH = 5500;
const HERO_W      = 128;
const GROUND_H    = 140;
const HUD_H       = 56;

// Phase portals spread across the wide world
const PHASE_WORLD_X = [360, 960, 1640, 2420, 3200, 4400];

// ─── Zone definitions ─────────────────────────────────────────────────────────
interface ZoneDef {
  id: string; startX: number; endX: number;
  skyTop: string; skyBot: string;
  groundGrass: string; groundDirt: string;
  bgImage: string | null;
}
const ZONES: ZoneDef[] = [
  { id: 'forest', startX: 0,    endX: 1100, skyTop: '#5ab8cc', skyBot: '#a0e060', groundGrass: '#5aaa2a', groundDirt: '#4a3a18', bgImage: '/assets/pack01/BACKGROUNDS_01.png' },
  { id: 'ruins',  startX: 900,  endX: 1850, skyTop: '#b07040', skyBot: '#e0b060', groundGrass: '#8a7040', groundDirt: '#4a3010', bgImage: '/assets/bg/ruins-day.jpg' },
  { id: 'city',   startX: 1700, endX: 2600, skyTop: '#3070b0', skyBot: '#90c8f0', groundGrass: '#5080b0', groundDirt: '#2a4070', bgImage: '/assets/bg/city-scene.jpg' },
  { id: 'caves',  startX: 2400, endX: 3350, skyTop: '#080614', skyBot: '#200c48', groundGrass: '#18083a', groundDirt: '#0c0420', bgImage: '/assets/bg/caves-scene.jpg' },
  { id: 'desert', startX: 3100, endX: 4100, skyTop: '#d08020', skyBot: '#f0b840', groundGrass: '#b87830', groundDirt: '#7a4818', bgImage: '/assets/bg/waste-day.jpg' },
  { id: 'tower',  startX: 3900, endX: 5500, skyTop: '#04020c', skyBot: '#100420', groundGrass: '#140620', groundDirt: '#08020e', bgImage: '/assets/bg/ruins-night.jpg' },
];

function getZone(x: number): ZoneDef {
  const cx = x + HERO_W / 2;
  let best = ZONES[0];
  for (const z of ZONES) {
    if (cx >= z.startX && cx <= z.endX) best = z;
  }
  return best;
}

// ─── Large trees (LegacyFantasy 1344×1200, Pack01 small pixel) ───────────────
interface TreeDef {
  wx: number; src: string; h: number; flip?: boolean; zOff?: number; opacity?: number;
}
const TREES: TreeDef[] = [
  // ── Forest zone (green, lush) ─────────────────────────────────────────────
  { wx: 20,   src: '/assets/legacy/trees/Green-Tree.png',  h: 310, opacity: 0.85 },
  { wx: 80,   src: '/assets/pack01/GREEN_09.png',           h: 360, zOff: 10 },
  { wx: 200,  src: '/assets/pack01/GREEN_05.png',           h: 280 },
  { wx: 340,  src: '/assets/legacy/trees/Green-Tree.png',  h: 340 },
  { wx: 510,  src: '/assets/pack01/GREEN_03.png',           h: 300 },
  { wx: 660,  src: '/assets/pack01/GREEN_09.png',           h: 380, flip: true },
  { wx: 770,  src: '/assets/legacy/trees/Green-Tree.png',  h: 290, opacity: 0.9 },
  { wx: 880,  src: '/assets/pack01/GREEN_00.png',           h: 140, zOff: -10 },

  // ── Ruins zone (golden/orange, autumnal) ──────────────────────────────────
  { wx: 990,  src: '/assets/legacy/trees/Golden-Tree.png', h: 320 },
  { wx: 1120, src: '/assets/pack01/ORANGE_01.png',          h: 220, zOff: 6 },
  { wx: 1260, src: '/assets/legacy/trees/Red-Tree.png',    h: 300, flip: true },
  { wx: 1390, src: '/assets/pack01/ORANGE_03.png',          h: 260 },
  { wx: 1530, src: '/assets/legacy/trees/Golden-Tree.png', h: 280, opacity: 0.85 },
  { wx: 1680, src: '/assets/pack01/ORANGE_05.png',          h: 230, flip: true },

  // ── City zone (pine / blue-grey) ──────────────────────────────────────────
  { wx: 1750, src: '/assets/pack01/Pine_01.png',            h: 280, zOff: 8 },
  { wx: 1900, src: '/assets/legacy/trees/Green-Tree.png',  h: 250, opacity: 0.7 },
  { wx: 2060, src: '/assets/pack01/Pine_01.png',            h: 310, flip: true },
  { wx: 2220, src: '/assets/legacy/trees/Green-Tree.png',  h: 240, opacity: 0.65 },
  { wx: 2340, src: '/assets/pack01/Pine_01.png',            h: 260 },

  // ── Caves zone (dark, ominous pines) ──────────────────────────────────────
  { wx: 2450, src: '/assets/legacy/trees/Dark-Tree.png',   h: 360 },
  { wx: 2610, src: '/assets/pack01/Pine_01.png',            h: 260, opacity: 0.8 },
  { wx: 2780, src: '/assets/legacy/trees/Dark-Tree.png',   h: 320, flip: true },
  { wx: 2960, src: '/assets/pack01/Pine_01.png',            h: 240, opacity: 0.7 },
  { wx: 3090, src: '/assets/legacy/trees/Dark-Tree.png',   h: 300, opacity: 0.9 },

  // ── Desert zone (sparse, warm orange trees) ───────────────────────────────
  { wx: 3220, src: '/assets/pack01/ORANGE_05.png',          h: 240 },
  { wx: 3420, src: '/assets/legacy/trees/Yellow-Tree.png', h: 280 },
  { wx: 3600, src: '/assets/pack01/ORANGE_03.png',          h: 200, flip: true },
  { wx: 3780, src: '/assets/legacy/trees/Yellow-Tree.png', h: 250, opacity: 0.85 },

  // ── Tower zone (dark, imposing) ───────────────────────────────────────────
  { wx: 3950, src: '/assets/legacy/trees/Dark-Tree.png',   h: 380 },
  { wx: 4150, src: '/assets/pack01/Pine_01.png',            h: 240, opacity: 0.7 },
  { wx: 4350, src: '/assets/legacy/trees/Dark-Tree.png',   h: 340, flip: true },
  { wx: 4650, src: '/assets/legacy/trees/Dark-Tree.png',   h: 360 },
  { wx: 4900, src: '/assets/legacy/trees/Yellow-Tree.png', h: 280, opacity: 0.6 },
  { wx: 5100, src: '/assets/legacy/trees/Dark-Tree.png',   h: 350, flip: true },
  { wx: 5300, src: '/assets/pack01/Pine_01.png',            h: 200, opacity: 0.6 },
];

// ─── Rocks / props ────────────────────────────────────────────────────────────
interface PropDef { wx: number; src: string; h: number; flip?: boolean }
const PROPS: PropDef[] = [
  { wx: 155,  src: '/assets/pack01/Rock_01.png',  h: 44 },
  { wx: 450,  src: '/assets/pack01/Rock_02.png',  h: 54 },
  { wx: 620,  src: '/assets/pack01/BUSH_01.png',  h: 32 },
  { wx: 820,  src: '/assets/pack01/Rock_03.png',  h: 44 },
  { wx: 1080, src: '/assets/pack01/Rock_02.png',  h: 52 },
  { wx: 1350, src: '/assets/pack01/Rock_01.png',  h: 44, flip: true },
  { wx: 1720, src: '/assets/pack01/BUSH_02.png',  h: 36 },
  { wx: 2060, src: '/assets/pack01/Rock_02.png',  h: 50 },
  { wx: 2380, src: '/assets/pack01/Rock_01.png',  h: 44 },
  { wx: 2780, src: '/assets/pack01/Rock_03.png',  h: 42 },
  { wx: 3180, src: '/assets/pack01/Rock_02.png',  h: 52 },
  { wx: 3560, src: '/assets/pack01/Rock_01.png',  h: 44 },
  { wx: 3920, src: '/assets/pack01/Rock_03.png',  h: 46 },
  { wx: 4380, src: '/assets/pack01/Rock_01.png',  h: 44, flip: true },
  { wx: 4800, src: '/assets/pack01/Rock_02.png',  h: 50 },
];

// ─── Campfires (forest only) ──────────────────────────────────────────────────
const CAMPFIRES_WX = [290, 565, 720];

// ─── NPCs standing in the world ───────────────────────────────────────────────
interface NpcDef { wx: number; src: string; h: number; flip?: boolean; phaseIdx: number }
const WORLD_NPCS: NpcDef[] = [
  { wx: 310,  src: '/assets/chars/char-tree.png',     h: 80, phaseIdx: 0 },
  { wx: 1500, src: '/assets/chars/char-cog.png',       h: 80, phaseIdx: 2 },
  { wx: 2380, src: '/assets/chars/char-celene.png',    h: 80, phaseIdx: 3 },
  { wx: 4360, src: '/assets/chars/char-guardian.png',  h: 80, phaseIdx: 5 },
];

// ─── Parallax mid-ground layers (forest zone) ─────────────────────────────────
const BG_LAYERS = [
  { src: '/assets/world/bg-castle.png',  factor: 0.03 },
  { src: '/assets/world/bg-layer4.png',  factor: 0.08 },
  { src: '/assets/world/bg-layer3.png',  factor: 0.18 },
  { src: '/assets/world/bg-layer2.png',  factor: 0.36 },
  { src: '/assets/world/bg-layer1.png',  factor: 0.55 },
];

// ─── Phase entrance landmark renderer ─────────────────────────────────────────
function PhaseMarker({ kind, locked, isNear, kindClr, hue }: {
  kind: string; locked: boolean; isNear: boolean; kindClr: string; hue: number
}) {
  const glow = `drop-shadow(0 0 ${isNear ? 20 : 10}px ${kindClr})`;

  if (locked) {
    return (
      <div style={{ width: 60, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 32, filter: 'grayscale(1) brightness(0.4)' }}>🔒</span>
      </div>
    );
  }

  if (kind === 'forest') {
    return (
      <svg viewBox="0 0 40 80" width={60} height={120} style={{ imageRendering: 'pixelated', filter: glow }}>
        <rect x="17" y="0" width="6" height="65" fill="#666" />
        <rect x="14" y="2" width="2" height="8" fill="#888" />
        <rect x="24" y="6" width="2" height="6" fill="#888" />
        <rect x="10" y="25" width="20" height="2" fill="#888" />
        <rect x="14" y="65" width="12" height="8" fill="#555" />
        {[0,1,2,3,4,5].map(i => (
          <rect key={i} x={8+Math.cos(i*1.05)*10} y={20+Math.sin(i*1.05)*8} width="3" height="3" fill={kindClr} opacity="0.9" />
        ))}
      </svg>
    );
  }

  if (kind === 'caves') {
    return (
      <svg viewBox="0 0 60 70" width={80} height={100} style={{ imageRendering: 'pixelated', filter: glow }}>
        <path d="M0 70 L0 30 Q30 0 60 30 L60 70 Z" fill="#1a0a3a" />
        <path d="M5 70 L5 33 Q30 8 55 33 L55 70 Z" fill="#080618" />
        <rect x="20" y="10" width="3" height="16" fill="#4a2880" />
        <rect x="35" y="6" width="3" height="20" fill="#4a2880" />
        <rect x="26" y="8" width="3" height="12" fill="#3a1c60" />
        {[0,1,2].map(i => (
          <rect key={i} x={22+i*8} y={55} width="4" height={10+i*3} fill="#240c50" />
        ))}
      </svg>
    );
  }

  if (kind === 'city') {
    return (
      <svg viewBox="0 0 50 70" width={70} height={100} style={{ imageRendering: 'pixelated', filter: glow }}>
        <rect x="5" y="20" width="40" height="6" fill="#8060e0" />
        <rect x="0" y="24" width="50" height="8" fill="#6040c0" rx="2" />
        <rect x="5" y="18" width="40" height="4" fill="#a080f0" />
        <rect x="10" y="10" width="6" height="10" fill="#4030a0" />
        <rect x="22" y="6" width="6" height="14" fill="#4030a0" />
        <rect x="34" y="10" width="6" height="10" fill="#4030a0" />
        <rect x="18" y="32" width="14" height="30" fill="#302060" />
        <rect x="21" y="35" width="8" height="8" fill={kindClr} opacity="0.7" />
        <rect x="24" y="45" width="2" height="17" fill="#201040" />
        <rect x="8" y="2" width="8" height="8" rx="4" fill={kindClr} opacity="0.8" />
        <rect x="34" y="2" width="8" height="8" rx="4" fill={kindClr} opacity="0.8" />
      </svg>
    );
  }

  if (kind === 'battle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="campfire-anim" style={{ marginBottom: 4 }} />
        <svg viewBox="0 0 40 30" width={50} height={38} style={{ imageRendering: 'pixelated', filter: glow }}>
          <rect x="5" y="10" width="30" height="4" fill="#cc4422" />
          <rect x="18" y="0" width="4" height="30" fill="#cc4422" />
          <rect x="12" y="12" width="16" height="2" fill="#ff6644" />
        </svg>
      </div>
    );
  }

  // Default (portal sheet animation for any unspecified kind)
  return (
    <div className="portal-anim" style={{
      filter: `hue-rotate(${hue}deg) drop-shadow(0 0 12px ${kindClr})`,
    }} />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WorldMap({
  phases, progress, currentIndex, fragments, coins, freePlay = false, onEnterPhase,
}: Props) {
  const initX = Math.max(0, PHASE_WORLD_X[Math.min(currentIndex, phases.length - 1)] - HERO_W / 2 - 60);

  const { heroWorldX, cameraX, isWalking, facingLeft, nearNodeIdx, startWalking, stopWalking } =
    useHeroMovement({
      worldWidth: WORLD_WIDTH,
      heroWidth: HERO_W,
      nodeWorldX: PHASE_WORLD_X,
      nodeTriggerDist: 90,
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
  const isForest = zone.id === 'forest';
  const isRuins  = zone.id === 'ruins';

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ touchAction: 'none' }}>

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
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

      {/* ── Sky (zone-adaptive) ──────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to bottom, ${zone.skyTop} 0%, ${zone.skyBot} 100%)`,
        transition: 'background 1.4s ease',
        zIndex: 0,
      }} />

      {/* ── Parallax forest layers ───────────────────────────────────────── */}
      {BG_LAYERS.map(({ src, factor }) => (
        <div key={src} style={{
          position: 'absolute', left: 0, right: 0,
          bottom: GROUND_H,
          height: `calc(100% - ${HUD_H}px - ${GROUND_H}px)`,
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          backgroundPosition: `${-(cameraX * factor).toFixed(1)}px bottom`,
          imageRendering: 'pixelated',
          opacity: isForest ? 1 : isRuins ? 0.2 : 0,
          transition: 'opacity 1.4s ease',
          zIndex: 1,
        }} />
      ))}

      {/* ── Pack01 forest background (for forest zone) ───────────────────── */}
      {isForest && (
        <div style={{
          position: 'absolute', left: 0, right: 0,
          bottom: GROUND_H,
          height: `calc(100% - ${HUD_H}px - ${GROUND_H}px)`,
          backgroundImage: "url('/assets/pack01/BACKGROUNDS_01.png')",
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          backgroundPosition: `${-(cameraX * 0.25).toFixed(1)}px bottom`,
          imageRendering: 'pixelated',
          opacity: 0.6,
          zIndex: 1,
        }} />
      )}

      {/* ── Zone background images (each zone's JPG strip in world space) ── */}
      {ZONES.filter(z => z.bgImage && z.id !== 'forest').map(z => {
        const stripLeft = z.startX - cameraX;
        const stripWidth = z.endX - z.startX;
        const isActive = zone.id === z.id;
        const isAdj = Math.abs(ZONES.indexOf(z) - ZONES.indexOf(zone)) === 1;
        return (
          <div key={z.id} style={{
            position: 'absolute',
            left: stripLeft, width: stripWidth,
            top: HUD_H, bottom: GROUND_H,
            backgroundImage: `url(${z.bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isActive ? 0.78 : isAdj ? 0.18 : 0,
            transition: 'opacity 1.4s ease',
            zIndex: 1,
          }} />
        );
      })}

      {/* ── Ground ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND_H,
        background: `linear-gradient(to bottom, ${zone.groundGrass} 0%, ${zone.groundGrass} 14%, ${zone.groundDirt} 14%, ${zone.groundDirt} 100%)`,
        transition: 'background 1.4s ease',
        zIndex: 2,
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: GROUND_H - 14, height: 28,
        backgroundImage: "url('/assets/world/grass.png')",
        backgroundRepeat: 'repeat-x',
        backgroundSize: 'auto 100%',
        backgroundPositionX: -(cameraX),
        imageRendering: 'pixelated',
        opacity: isForest || isRuins ? 0.9 : 0.25,
        transition: 'opacity 1.4s',
        zIndex: 3,
      }} />

      {/* ── Large trees ──────────────────────────────────────────────────── */}
      {TREES.map((t, i) => {
        const sx = t.wx - cameraX;
        if (sx < -500 || sx > 1100) return null;
        return (
          <img key={i} src={t.src}
            style={{
              position: 'absolute',
              left: sx,
              bottom: GROUND_H + (t.zOff ?? 0),
              height: t.h,
              width: 'auto',
              imageRendering: 'pixelated',
              opacity: t.opacity ?? 1,
              transform: t.flip ? 'scaleX(-1)' : undefined,
              zIndex: 4,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* ── Props (rocks, bushes) ────────────────────────────────────────── */}
      {PROPS.map((p, i) => {
        const sx = p.wx - cameraX;
        if (sx < -200 || sx > 1100) return null;
        return (
          <img key={i} src={p.src}
            style={{
              position: 'absolute',
              left: sx,
              bottom: GROUND_H,
              height: p.h,
              width: 'auto',
              imageRendering: 'pixelated',
              transform: p.flip ? 'scaleX(-1)' : undefined,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* ── Campfires (forest zone) ──────────────────────────────────────── */}
      {CAMPFIRES_WX.map((wx, i) => {
        const sx = wx - cameraX;
        if (sx < -80 || sx > 1100) return null;
        return (
          <div key={i} className="campfire-anim" style={{ position: 'absolute', left: sx, bottom: GROUND_H, zIndex: 5 }} />
        );
      })}

      {/* ── NPCs standing in the world ───────────────────────────────────── */}
      {WORLD_NPCS.map((npc, i) => {
        const sx = npc.wx - cameraX;
        if (sx < -120 || sx > 1100) return null;
        const heroCenter = heroWorldX + HERO_W / 2;
        const npcFacingLeft = heroCenter > npc.wx;
        return (
          <img key={i} src={npc.src}
            style={{
              position: 'absolute',
              left: sx,
              bottom: GROUND_H,
              height: npc.h,
              width: 'auto',
              imageRendering: 'pixelated',
              transform: npcFacingLeft ? 'scaleX(-1)' : undefined,
              zIndex: 5,
              pointerEvents: 'none',
              filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.7))',
            }}
          />
        );
      })}

      {/* ── Phase portals ────────────────────────────────────────────────── */}
      {phases.map((phase, i) => {
        const sx = PHASE_WORLD_X[i] - cameraX;
        if (sx < -300 || sx > 1100) return null;
        const locked   = freePlay ? false : i > currentIndex;
        const done     = progress[phase.id]?.completed ?? false;
        const isNear   = nearNodeIdx === i;
        const stars    = progress[phase.id]?.stars ?? 0;
        const kindClr  = KIND_COLOR[phase.kind] ?? '#888';
        const hue      = KIND_HUE[phase.kind] ?? 0;

        return (
          <div key={phase.id} style={{
            position: 'absolute',
            left: sx,
            bottom: GROUND_H,
            zIndex: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: 'translateX(-50%)',
            filter: isNear && !locked ? `drop-shadow(0 0 6px ${kindClr})` : undefined,
          }}>
            {/* Phase label */}
            <div style={{ textAlign: 'center', marginBottom: 4, pointerEvents: 'none' }}>
              <span style={{ fontSize: 20, filter: locked ? 'grayscale(1)' : `drop-shadow(0 0 8px ${kindClr})` }}>
                {locked ? '🔒' : phase.icon}
              </span>
              <p className="font-pixel" style={{ color: locked ? '#666' : '#f7ead5', fontSize: 5, textShadow: '1px 1px 0 #000', marginTop: 2 }}>
                {phase.title}
              </p>
              {done && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  {Array.from({ length: 3 }, (_, s) => (
                    <span key={s} style={{ fontSize: 9, filter: s < stars ? 'none' : 'grayscale(1) brightness(0.4)' }}>⭐</span>
                  ))}
                </div>
              )}
            </div>

            {/* Zone-appropriate landmark */}
            <PhaseMarker kind={phase.kind} locked={locked} isNear={isNear} kindClr={kindClr} hue={hue} />

            {/* Enter button */}
            {isNear && !locked && (
              <button
                onClick={() => onEnterPhase(i)}
                className="btn-rpg font-pixel"
                style={{ fontSize: 7, padding: '5px 12px', marginTop: 6, zIndex: 7 }}
              >
                {done ? 'JOGAR DE NOVO' : '▶ ENTRAR'}
              </button>
            )}
          </div>
        );
      })}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        left: heroScreenX,
        bottom: GROUND_H,
        zIndex: 8,
        pointerEvents: 'none',
      }}>
        <AnimatedHero scale={2} walking={isWalking} facingLeft={facingLeft} />
      </div>

      {/* ── Iris dialog when near phase ──────────────────────────────────── */}
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

      {/* ── D-Pad ────────────────────────────────────────────────────────── */}
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
