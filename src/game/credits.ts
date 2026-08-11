// ─────────────────────────────────────────────────────────
// Créditos de CINZAS: O Último Abrigo.
//
// Todo o conteúdo do jogo é autoral: a arte pixel é desenhada por código
// (scripts/gen-art.mjs), a trilha e os efeitos são sintetizados em tempo
// real, e o roteiro foi escrito para este projeto. As únicas dependências
// externas são as duas fontes e as bibliotecas de código.
// ─────────────────────────────────────────────────────────

export interface CreditItem {
  title: string;        // nome do recurso
  author?: string;      // autor(a) ou estúdio
  license?: string;     // licença ou termo de uso
  note?: string;        // onde/como é usado no jogo
  url?: string;         // fonte
}

export interface CreditSection {
  heading: string;
  items: CreditItem[];
}

export const CREDITS: CreditSection[] = [
  {
    heading: 'Arte pixel',
    items: [
      {
        title: 'Cenários',
        author: 'Original do projeto',
        license: 'Desenhado por código',
        note: 'Os 12 cenários (abrigo, ruínas, zona contaminada, cisterna, posto, assentamento, estufa, ermo, amanhecer e desfechos) são desenhados pixel a pixel por scripts/gen-art.mjs, com céus pontilhados, silhuetas em camadas e iluminação própria.',
      },
      {
        title: 'Ícones e protagonista',
        author: 'Original do projeto',
        license: 'Desenhado por código',
        note: 'Os 13 ícones de 16x16 do painel e dos desfechos, e o sprite da sobrevivente, são desenhados no mesmo script, na mesma paleta dos cenários.',
      },
    ],
  },
  {
    heading: 'Narrativa e conteúdo',
    items: [
      {
        title: 'Roteiro e desafios de biologia',
        author: 'Equipe do Prof. Corujão',
        license: 'Original do projeto',
        note: 'Os 4 capítulos, os 6 desfechos e os 5 desafios de biologia (radiação e DNA, purificação de água, imunidade, fotossíntese e decomposição) foram escritos para este jogo.',
      },
    ],
  },
  {
    heading: 'Áudio',
    items: [
      {
        title: 'Trilha e efeitos sonoros 8-bit',
        author: 'Original do projeto',
        license: 'Sintetizado em tempo real',
        note: 'A música e os efeitos são gerados via WebAudio enquanto o jogo roda, sem nenhum arquivo de áudio externo.',
      },
    ],
  },
  {
    heading: 'Tipografia',
    items: [
      {
        title: 'Press Start 2P',
        author: 'CodeMan38',
        license: 'SIL Open Font License 1.1',
        note: 'Fonte da interface, dos botões e dos títulos.',
        url: 'https://fonts.google.com/specimen/Press+Start+2P',
      },
      {
        title: 'VT323',
        author: 'Peter Hull',
        license: 'SIL Open Font License 1.1',
        note: 'Fonte dos textos narrativos, no estilo de terminal.',
        url: 'https://fonts.google.com/specimen/VT323',
      },
    ],
  },
  {
    heading: 'Tecnologia',
    items: [
      { title: 'React, Vite e TypeScript', license: 'MIT', note: 'Base da aplicação, que roda como PWA.' },
      { title: 'Tailwind CSS', license: 'MIT', note: 'Estilos utilitários da interface.' },
      { title: 'sharp', license: 'Apache 2.0', note: 'Grava em PNG a arte gerada pelo script.' },
      { title: 'qrcode.react e Firebase', license: 'MIT / Apache 2.0', note: 'QR code de compartilhamento do quiz e serviços de nuvem.' },
    ],
  },
];

export const CREDITS_NOTE =
  'Este jogo não usa nenhum pack de arte, música ou efeito sonoro de terceiros: ' +
  'a arte é desenhada por código e o áudio é sintetizado durante a partida. ' +
  'As únicas dependências externas são as duas fontes acima, ambas sob licença aberta.';
