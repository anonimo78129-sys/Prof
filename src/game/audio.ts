// ─────────────────────────────────────────────────────────
// Sistema de áudio — efeitos sonoros (SFX)
//
// • Tudo é OPCIONAL: se o arquivo não existir, simplesmente não toca
//   (o jogo continua funcionando com os tons sintetizados do StoryGame).
// • Mudo + volume: persistidos no localStorage, com botão na interface.
//
// COMO ADICIONAR EFEITOS
//   public/assets/audio/sfx/<nome>.mp3   (curtos, < 2s)
//   Os nomes esperados estão no mapa SFX_FILES abaixo.
// ─────────────────────────────────────────────────────────

// ── Preferências (mudo + volume), persistidas ──
const LS_MUTED = 'jb-audio-muted';
const LS_VOL = 'jb-audio-volume';

function readMuted(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(LS_MUTED) === '1';
}
function readVolume(): number {
  if (typeof localStorage === 'undefined') return 0.7;
  const v = parseFloat(localStorage.getItem(LS_VOL) ?? '');
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.7;
}

let _muted = readMuted();
let _volume = readVolume();
const listeners = new Set<() => void>();

function notify() { listeners.forEach(fn => fn()); }

export function subscribeAudio(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isMuted(): boolean { return _muted; }
export function getVolume(): number { return _volume; }

export function setMuted(m: boolean) {
  _muted = m;
  if (typeof localStorage !== 'undefined') localStorage.setItem(LS_MUTED, m ? '1' : '0');
  notify();
}
export function toggleMuted() { setMuted(!_muted); }

export function setVolume(v: number) {
  _volume = Math.min(1, Math.max(0, v));
  if (typeof localStorage !== 'undefined') localStorage.setItem(LS_VOL, String(_volume));
  notify();
}

// O StoryGame consulta isto para silenciar também os tons sintetizados.
export function audioGain(base: number): number {
  return _muted ? 0 : base * _volume;
}

// ─────────────────────────────────────────────────────────
// Efeitos sonoros (SFX)
// ─────────────────────────────────────────────────────────
export type SfxName =
  | 'tap'        // toque/avançar diálogo
  | 'correct'    // acerto
  | 'wrong'      // erro
  | 'gate'       // portão/pedra abrindo
  | 'walk'       // passo
  | 'attack'     // ataque do jogador (combate)
  | 'hurt'       // jogador leva dano
  | 'victory'    // vitória
  | 'select';    // clique de botão/opção

const SFX_FILES: Record<SfxName, string> = {
  tap:     '/assets/audio/sfx/tap.mp3',
  correct: '/assets/audio/sfx/correct.mp3',
  wrong:   '/assets/audio/sfx/wrong.mp3',
  gate:    '/assets/audio/sfx/gate.mp3',
  walk:    '/assets/audio/sfx/walk.mp3',
  attack:  '/assets/audio/sfx/attack.mp3',
  hurt:    '/assets/audio/sfx/hurt.mp3',
  victory: '/assets/audio/sfx/victory.mp3',
  select:  '/assets/audio/sfx/select.mp3',
};

// ─────────────────────────────────────────────────────────
// Sintetizador 8-bit (fallback) — toca quando o .mp3 não existe.
// Sons curtos estilo chiptune gerados via WebAudio.
// ─────────────────────────────────────────────────────────
let _sctx: AudioContext | null = null;
function synthCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_sctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      _sctx = new AC();
    }
    if (_sctx.state === 'suspended') void _sctx.resume();
    return _sctx;
  } catch { return null; }
}

// tom simples com envelope; delay/freqEnd opcionais p/ arpejos e sweeps
function sTone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, freqEnd?: number) {
  const g0 = audioGain(gain); if (g0 <= 0) return;
  const ctx = synthCtx(); if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(g0, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}

// rajada de ruído filtrado (passos, impactos, pedra)
function sNoise(dur: number, gain: number, filterFreq: number, delay = 0) {
  const g0 = audioGain(gain); if (g0 <= 0) return;
  const ctx = synthCtx(); if (!ctx) return;
  const t = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(g0, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter); filter.connect(g); g.connect(ctx.destination);
  src.start(t); src.stop(t + dur + 0.02);
}

// Um som 8-bit para cada efeito (usado quando o arquivo .mp3 não existe)
const SYNTH_SFX: Record<SfxName, (vol: number) => void> = {
  tap:     v => sTone(660, 0.06, 'square', 0.10 * v),
  select:  v => { sTone(520, 0.05, 'square', 0.10 * v); sTone(780, 0.06, 'square', 0.09 * v, 0.05); },
  correct: v => [523.25, 659.25, 783.99].forEach((f, i) => sTone(f, 0.13, 'square', 0.11 * v, i * 0.085)),
  wrong:   v => { sTone(220, 0.18, 'sawtooth', 0.09 * v); sTone(155, 0.24, 'sawtooth', 0.09 * v, 0.13); },
  gate:    v => { sTone(90, 0.6, 'triangle', 0.14 * v, 0, 45); sNoise(0.55, 0.07 * v, 260); },
  walk:    v => sNoise(0.05, 0.05 * v, 900),
  attack:  v => sTone(700, 0.13, 'square', 0.11 * v, 0, 140),
  hurt:    v => { sNoise(0.16, 0.08 * v, 650); sTone(110, 0.2, 'sawtooth', 0.08 * v); },
  victory: v => [392, 523.25, 659.25, 783.99].forEach((f, i) => sTone(f, 0.17, 'square', 0.10 * v, i * 0.115)),
};

// Cache de "disponibilidade": evita tentar recarregar arquivos que faltam.
const sfxAvailable = new Map<SfxName, boolean>();
const sfxCache = new Map<SfxName, HTMLAudioElement>();

export function playSfx(name: SfxName, vol = 1) {
  if (_muted || typeof Audio === 'undefined') return;
  if (sfxAvailable.get(name) === false) { SYNTH_SFX[name](vol); return; } // sem arquivo → 8-bit

  let base = sfxCache.get(name);
  if (!base) {
    base = new Audio(SFX_FILES[name]);
    base.preload = 'auto';
    base.addEventListener('error', () => sfxAvailable.set(name, false), { once: true });
    sfxCache.set(name, base);
  }
  // clona para permitir sobreposição (vários disparos rápidos)
  const node = base.cloneNode(true) as HTMLAudioElement;
  node.volume = Math.min(1, Math.max(0, vol * _volume));
  node.play().then(() => sfxAvailable.set(name, true)).catch(() => {
    // arquivo ausente/bloqueado → marca e cai para o sintetizado
    sfxAvailable.set(name, false);
    SYNTH_SFX[name](vol);
  });
}

// Pré-carrega os efeitos (opcional; chamado após o 1º gesto do usuário).
export function preloadSfx() {
  if (typeof Audio === 'undefined') return;
  (Object.keys(SFX_FILES) as SfxName[]).forEach(name => {
    if (sfxCache.has(name)) return;
    const a = new Audio(SFX_FILES[name]);
    a.preload = 'auto';
    a.addEventListener('error', () => sfxAvailable.set(name, false), { once: true });
    sfxCache.set(name, a);
  });
}
