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
