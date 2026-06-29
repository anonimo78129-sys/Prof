// ─────────────────────────────────────────────────────────
// Sistema de áudio — música de fundo + efeitos sonoros (SFX)
//
// • Tudo é OPCIONAL: se o arquivo não existir, simplesmente não toca
//   (o jogo continua funcionando com os tons sintetizados do StoryGame).
// • Música por cena: troca automática com crossfade ao mudar de cenário.
// • SFX: sons curtos disparados em eventos (acerto, erro, portão, combate…).
// • Mudo + volume: persistidos no localStorage, com botão na interface.
//
// COMO ADICIONAR ARQUIVOS
//   Música  → public/assets/audio/music/<nome>.mp3   (loop, ~1-3 min)
//   Efeitos → public/assets/audio/sfx/<nome>.mp3     (curtos, < 2s)
//   Os nomes esperados estão nos mapas MUSIC_FILES e SFX_FILES abaixo.
// ─────────────────────────────────────────────────────────

import type { SceneBg } from './types';

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
  applyMusicVolume();
  notify();
}
export function toggleMuted() { setMuted(!_muted); }

export function setVolume(v: number) {
  _volume = Math.min(1, Math.max(0, v));
  if (typeof localStorage !== 'undefined') localStorage.setItem(LS_VOL, String(_volume));
  applyMusicVolume();
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

// Cache de "disponibilidade": evita tentar recarregar arquivos que faltam.
const sfxAvailable = new Map<SfxName, boolean>();
const sfxCache = new Map<SfxName, HTMLAudioElement>();

export function playSfx(name: SfxName, vol = 1) {
  if (_muted || typeof Audio === 'undefined') return;
  if (sfxAvailable.get(name) === false) return; // já sabemos que falta

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
  node.play().then(() => sfxAvailable.set(name, true)).catch(() => {/* arquivo ausente ou bloqueado */});
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

// ─────────────────────────────────────────────────────────
// Música de fundo por cena (com crossfade)
// ─────────────────────────────────────────────────────────
// Cada cenário aponta para uma faixa. Cenários que compartilham clima
// podem reusar o mesmo arquivo.
const MUSIC_FILES: Partial<Record<SceneBg, string>> = {
  noite:    '/assets/audio/music/intro.mp3',
  floresta: '/assets/audio/music/floresta.mp3',
  clareira: '/assets/audio/music/floresta.mp3',
  ato3:     '/assets/audio/music/floresta.mp3',
  estufa:   '/assets/audio/music/estufa.mp3',
  pantano:  '/assets/audio/music/pantano.mp3',
  corredor: '/assets/audio/music/corredor.mp3',
  final:    '/assets/audio/music/final.mp3',
};

let currentTrack: string | null = null;
let currentAudio: HTMLAudioElement | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
const TARGET_MUSIC_GAIN = 0.55; // música mais baixa que SFX

function applyMusicVolume() {
  if (!currentAudio) return;
  currentAudio.volume = _muted ? 0 : TARGET_MUSIC_GAIN * _volume;
}

// Toca a faixa do cenário dado. Se já for a mesma, não faz nada.
export function playMusicFor(bg: SceneBg) {
  const src = MUSIC_FILES[bg];
  if (!src) return;
  if (src === currentTrack) return;
  if (typeof Audio === 'undefined') return;
  crossfadeTo(src);
}

function crossfadeTo(src: string) {
  currentTrack = src;
  const oldAudio = currentAudio;

  const next = new Audio(src);
  next.loop = true;
  next.preload = 'auto';
  next.volume = 0;

  let missing = false;
  next.addEventListener('error', () => { missing = true; }, { once: true });

  next.play().then(() => {
    if (missing) return;
    currentAudio = next;
    if (fadeTimer) clearInterval(fadeTimer);
    const targetVol = _muted ? 0 : TARGET_MUSIC_GAIN * _volume;
    const fromVol = oldAudio ? oldAudio.volume : 0;
    let k = 0;                       // 0 → 1 ao longo de ~1.2s
    fadeTimer = setInterval(() => {
      k = Math.min(1, k + 0.05);
      next.volume = targetVol * k;            // fade in
      if (oldAudio) oldAudio.volume = fromVol * (1 - k); // fade out
      if (k >= 1) {
        if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
        if (oldAudio) { oldAudio.pause(); oldAudio.src = ''; }
      }
    }, 60);
  }).catch(() => {
    // arquivo ausente ou autoplay bloqueado — mantém a faixa anterior
    if (currentTrack === src) currentTrack = oldAudio ? oldAudio.src : null;
  });
}

export function stopMusic() {
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
  currentTrack = null;
}
