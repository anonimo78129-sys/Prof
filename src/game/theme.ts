// ─────────────────────────────────────────────────────────
// Tokens visuais de CINZAS. Um só lugar define a paleta, para que jogo,
// tela inicial, carregamento e créditos fiquem coerentes.
//
// Paleta índigo noturna: base fria em roxo-azulado, cromo em linha clara
// (#5e5e91), texto narrativo em balão creme, e os acentos entram
// saturados justamente porque a base é dessaturada. Nada de gradiente,
// nada de canto arredondado, nada de blur: só campo chapado e borda dura.
// ─────────────────────────────────────────────────────────

export const C = {
  // chrome / estrutura
  ink:        '#11112f',   // vazio da página
  shell:      '#2a2a55',   // painel, botão neutro
  shellHi:    '#454568',   // aresta de cima do bisel
  shellLo:    '#171735',   // fundo do quadro de cena
  line:       '#0a0a1c',   // borda dura, sombra sólida
  lineSoft:   '#5e5e91',   // borda clara do cromo (barras, chips)

  // papel: o balão de fala. Único bloco quente da tela, de propósito,
  // porque é onde a história é lida.
  paper:      '#fff9d8',
  paperEdge:  '#d3cca4',
  paperInk:   '#22213a',
  paperSoft:  '#55547a',

  // acentos
  // rust carrega texto branco pequeno (botões, faixas), então precisa
  // passar em contraste. rustGlow e rustLite são só decoração.
  rust:       '#5f33c4',
  rustGlow:   '#7e4ee8',
  rustDark:   '#4c25b9',
  rustLite:   '#9a6ff0',
  steel:      '#237d99',
  steelDark:  '#14566b',
  green:      '#2b8f22',
  greenLite:  '#4df11c',
  red:        '#c92f55',
  amber:      '#e0aa14',
  bone:       '#d0d0e6',
  boneDim:    '#8a8ab0',
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

// Cartão escuro com preenchimento saturado: sobre a base índigo, campo
// claro salta demais e rouba a leitura da cena.
export const STAT_SKINS: StatSkin[] = [
  { key: 'racao',     label: 'RAÇÃO',     icon: 'bread',   bg: '#2a2450', border: '#e0aa14', fill: '#e0aa14', text: '#ffd96b' },
  { key: 'agua',      label: 'ÁGUA',      icon: 'flask',   bg: '#1c2c50', border: '#4cdde0', fill: '#4cdde0', text: '#9df0f2' },
  { key: 'saude',     label: 'SAÚDE',     icon: 'medkit',  bg: '#2e1d3d', border: '#c92f55', fill: '#c92f55', text: '#ff9db3' },
  { key: 'confianca', label: 'CONFIANÇA', icon: 'nametag', bg: '#1d2f42', border: '#4df11c', fill: '#4df11c', text: '#a6ff86' },
];

export const ART = (key: string) => `/assets/cinzas/art/${key}.png`;
/** Versão achatada de uma cena, para fundos que não precisam animar. */
export const CENA_FLAT = (cena: string) => `/assets/cinzas/art/${cena}/flat.png`;
export const ICON = (name: string) => `/assets/cinzas/icons/${name}.png`;

// Moldura pixel: borda dura + sombra sólida (sem blur), estilo pixel art
export const bevel = (shadow = 3, color = C.line) => `${shadow}px ${shadow}px 0 ${color}`;
