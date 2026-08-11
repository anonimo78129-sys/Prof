// ─────────────────────────────────────────────────────────
// Progresso do jogador — save/continuar + estatísticas
//
// • Checkpoint: salvo a cada cena narrativa (capítulo), guarda o id da
//   cena e os recursos (ração/água/saúde/confiança) daquele momento.
//   "CONTINUAR" na tela inicial retoma exatamente dali.
// • Estatísticas: desafios de biologia respondidos certo/errado e o
//   desfecho alcançado, usados na tela de resultado final.
// Tudo em localStorage — sobrevive a fechar o app (é um PWA).
// ─────────────────────────────────────────────────────────
import type { Stats } from './cinzas';

const LS_SAVE = 'cinzas-save';
const LS_STATS = 'cinzas-stats';

export interface SaveData {
  sceneId: string;
  stats: Stats;
  at: string;   // ISO timestamp (informativo)
}

export interface GameStats {
  errors: number;    // desafios respondidos errado
  solved: number;    // desafios respondidos certo
  ending: string | null;   // id da cena de final alcançada
}

const EMPTY_STATS: GameStats = { errors: 0, solved: 0, ending: null };

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch { return null; }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* indisponível */ }
}

// ── Save/checkpoint ──
export function getSave(): SaveData | null {
  const s = readJson<SaveData>(LS_SAVE);
  return s && typeof s.sceneId === 'string' && s.stats ? s : null;
}
export function saveCheckpoint(sceneId: string, stats: Stats) {
  writeJson(LS_SAVE, { sceneId, stats, at: new Date().toISOString() } satisfies SaveData);
}
export function clearSave() {
  try { localStorage.removeItem(LS_SAVE); } catch { /* indisponível */ }
}

// ── Estatísticas ──
export function getStats(): GameStats {
  return readJson<GameStats>(LS_STATS) ?? { ...EMPTY_STATS };
}
export function resetStats() {
  writeJson(LS_STATS, EMPTY_STATS);
}
export function recordError() {
  const s = getStats();
  writeJson(LS_STATS, { ...s, errors: s.errors + 1 });
}
export function recordSolved() {
  const s = getStats();
  writeJson(LS_STATS, { ...s, solved: s.solved + 1 });
}
export function recordEnding(ending: string) {
  const s = getStats();
  writeJson(LS_STATS, { ...s, ending });
}

// ── Medalha pela jornada (menos erros nos desafios = melhor) ──
export type Medal = 'ouro' | 'prata' | 'bronze';
export function medalFor(stats: GameStats): Medal {
  if (stats.errors === 0) return 'ouro';
  if (stats.errors <= 2) return 'prata';
  return 'bronze';
}
