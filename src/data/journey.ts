import type { EnemyDef, PhaseDef } from '../types/game';

// ──────────────────────────────────────────────────────────────
// Inimigos (Battlers) — usados nas fases de batalha por turnos.
// O HP é dimensionado para durar ~4 acertos (chefe ~6).
// ──────────────────────────────────────────────────────────────
export const ENEMIES: Record<string, EnemyDef> = {
  scout: {
    id: 'scout',
    name: 'Sentinela de Sucata',
    title: 'GUARDIÃO DAS RUÍNAS',
    sprite: '/assets/enemies/scout.png',
    maxHp: 100,
    size: 150,
    color: '#ff7733',
    taunt: 'Ninguém passa pelas ruínas sem provar o que sabe!',
    attackMsg: 'A Sentinela dispara uma rajada de energia!',
  },
  outlaw: {
    id: 'outlaw',
    name: 'Caçador do Deserto',
    title: 'FORAGIDO DO ÉTER',
    sprite: '/assets/enemies/outlaw.png',
    maxHp: 120,
    size: 170,
    color: '#ffcc33',
    taunt: 'O deserto engole os tolos. Mostre que vale a poeira que pisa.',
    attackMsg: 'O Caçador saca a arma e atira!',
  },
  witch: {
    id: 'witch',
    name: 'Bruxa das Brumas',
    title: 'SENHORA DAS SOMBRAS',
    sprite: '/assets/enemies/witch.png',
    maxHp: 110,
    size: 165,
    color: '#cc44ff',
    taunt: 'Seu conhecimento é fraco. Vou dissolvê-lo em névoa.',
    attackMsg: 'A Bruxa lança uma maldição!',
  },
  drone: {
    id: 'drone',
    name: 'Drone Laser',
    title: 'VIGIA MECÂNICO',
    sprite: '/assets/enemies/drone.png',
    maxHp: 90,
    size: 130,
    color: '#33ddff',
    taunt: 'ERRO DETECTADO: humano sem credenciais de saber.',
    attackMsg: 'O Drone carrega e dispara o laser!',
  },
  prince: {
    id: 'prince',
    name: 'Príncipe Lamentoso',
    title: '★ GUARDIÃO DO PORTAL ★',
    sprite: '/assets/enemies/prince.png',
    maxHp: 180,
    size: 230,
    color: '#ff3355',
    taunt: 'Eu guardo o Portal há eras. Palavras não bastam — prove tudo o que aprendeu!',
    attackMsg: 'O Guardião invoca uma tempestade do Éter!',
    isBoss: true,
  },
};

// ──────────────────────────────────────────────────────────────
// A Jornada — sequência de fases. Mistura mecânicas:
//  puzzle (floresta / cidade / cavernas) + batalha por turnos.
// ──────────────────────────────────────────────────────────────
export const JOURNEY: PhaseDef[] = [
  {
    id: 'forest',
    kind: 'forest',
    title: 'Floresta dos Ecos',
    subtitle: 'Encontre os segredos entre os vaga-lumes',
    icon: '🌲',
    reward: 'esmeralda',
  },
  {
    id: 'battle-ruins',
    kind: 'battle',
    title: 'Ruínas da Sentinela',
    subtitle: 'Uma guardiã bloqueia o caminho',
    icon: '⚔️',
    bg: '/assets/bg/ruins-day.jpg',
    enemyId: 'scout',
    questionBank: 'caves',
  },
  {
    id: 'city',
    kind: 'city',
    title: 'Cidade Flutuante',
    subtitle: 'Reconecte a Máquina do Conhecimento',
    icon: '🏙️',
    reward: 'ambar',
  },
  {
    id: 'caves',
    kind: 'caves',
    title: 'Cavernas de Cristal',
    subtitle: 'Acenda os cristais do saber',
    icon: '💎',
    reward: 'safira',
  },
  {
    id: 'battle-desert',
    kind: 'battle',
    title: 'Deserto das Sombras',
    subtitle: 'O Caçador do Éter espreita',
    icon: '🏜️',
    bg: '/assets/bg/waste-day.jpg',
    enemyId: 'outlaw',
    questionBank: 'forest',
  },
  {
    id: 'battle-tower',
    kind: 'battle',
    title: 'Torre do Portal',
    subtitle: 'O confronto final pela volta para casa',
    icon: '👑',
    bg: '/assets/bg/ruins-night.jpg',
    enemyId: 'prince',
    questionBank: 'tower',
  },
];

export const HERO_PORTRAIT = '/assets/portraits/hero.png';
