// ─────────────────────────────────────────────────────────
// Tokens visuais de CINZAS. Um só lugar define a paleta, para que jogo,
// tela inicial, carregamento e créditos fiquem coerentes.
// ─────────────────────────────────────────────────────────

export const C = {
  // chrome / estrutura
  ink:        '#171520',
  shell:      '#221f31',
  shellHi:    '#332f47',
  shellLo:    '#12101c',
  line:       '#0d0b14',

  // papel (painéis de texto)
  paper:      '#f6f0e1',
  paperEdge:  '#b9a97e',
  paperInk:   '#241d14',
  paperSoft:  '#5d5342',

  // acentos
  // rust carrega texto branco pequeno (botões, faixas), então precisa
  // passar em contraste: 5.34 contra branco. rustGlow é só decoração.
  rust:       '#b8461a',
  rustGlow:   '#e2612f',
  rustDark:   '#8f3210',
  rustLite:   '#e2703c',
  steel:      '#3f8fb5',
  steelDark:  '#23617f',
  green:      '#4aa83a',
  greenLite:  '#6ec850',
  red:        '#d43f60',
  amber:      '#f0932b',
  bone:       '#e9dcc0',
  boneDim:    '#a89c80',
} as const;

// Cores por recurso (cartões do HUD)
export interface StatSkin {
  key: 'racao' | 'agua' | 'saude' | 'confianca';
  label: string;
  icon: string;      // nome do PNG em /assets/cinzas/icons
  bg: string;
  border: string;
  fill: string;
  text: string;
}

export const STAT_SKINS: StatSkin[] = [
  { key: 'racao',     label: 'RAÇÃO',     icon: 'bread',   bg: '#fdf0dd', border: '#f0932b', fill: '#f0932b', text: '#8a5312' },
  { key: 'agua',      label: 'ÁGUA',      icon: 'flask',   bg: '#e4f3fb', border: '#3f8fb5', fill: '#3f8fb5', text: '#175a76' },
  { key: 'saude',     label: 'SAÚDE',     icon: 'medkit',  bg: '#fde7ed', border: '#d43f60', fill: '#d43f60', text: '#8a1f3a' },
  { key: 'confianca', label: 'CONFIANÇA', icon: 'nametag', bg: '#e8f6e2', border: '#4aa83a', fill: '#4aa83a', text: '#2a6a20' },
];

export const ART = (key: string) => `/assets/cinzas/art/${key}.png`;
export const ICON = (name: string) => `/assets/cinzas/icons/${name}.png`;

// Moldura pixel: borda dura + sombra sólida (sem blur), estilo pixel art
export const bevel = (shadow = 3, color = C.line) => `${shadow}px ${shadow}px 0 ${color}`;
