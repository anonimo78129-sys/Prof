// ─────────────────────────────────────────────────────────
// Tokens visuais de CINZAS. Um só lugar define a paleta, para que jogo,
// tela inicial, carregamento e créditos fiquem coerentes.
//
// Duas referências, cada uma mandando numa metade:
//
// O chassi vem do RPG de Game Boy: janela da cena em cima, caixa de texto
// embaixo, e a caixa de respostas abaixo dela. Caixa é sempre off-white
// com moldura preta grossa, filete claro e linha interna — nada de
// gradiente, canto arredondado ou sombra borrada.
//
// A ilustração vem do desenho de traço: cor chapada com contorno preto,
// céu ciano forte, pedra creme tomada de musgo, e laranja como único
// acento quente.
// ─────────────────────────────────────────────────────────

export const C = {
  // chrome / estrutura
  ink:        '#0e1410',   // vazio fora do quadro
  shell:      '#33421f',   // painel, botão neutro (oliva)
  shellHi:    '#4d6130',   // aresta de cima do bisel
  shellLo:    '#1b2415',   // fundo do quadro de cena
  line:       '#101010',   // contorno preto: moldura, sombra sólida
  lineSoft:   '#7ba428',   // filete de musgo no cromo

  // caixa de texto do Game Boy
  paper:      '#f8f8e8',
  paperEdge:  '#c9c9b0',
  paperInk:   '#101010',
  paperSoft:  '#4a5240',

  // acentos
  // rust carrega texto branco pequeno, então precisa passar em contraste;
  // o laranja da ilustração é claro demais para isso e fica só em rustLite.
  rust:       '#a85a10',
  rustGlow:   '#f7941e',
  rustDark:   '#7d4109',
  rustLite:   '#ffb347',
  steel:      '#0f7f9c',
  steelDark:  '#0a5566',
  green:      '#5c7a1a',
  greenLite:  '#a3d13f',
  red:        '#c0392b',
  amber:      '#e8a020',
  bone:       '#ede9d0',
  boneDim:    '#a8a890',
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

export const ICON = (name: string) => `/assets/cinzas/icons/${name}.png`;

// Moldura pixel: borda dura + sombra sólida (sem blur), estilo pixel art
export const bevel = (shadow = 3, color = C.line) => `${shadow}px ${shadow}px 0 ${color}`;
