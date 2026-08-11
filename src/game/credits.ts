// ─────────────────────────────────────────────────────────
// Créditos de CINZAS: O Último Abrigo.
//
// A arte pixel e o roteiro são autorais: a arte é desenhada por código
// (scripts/gen-art.mjs). O áudio vem de fontes com licença livre já
// verificada (efeitos CC0 da Kenney e música do Pixabay), com os detalhes
// de cada arquivo em public/assets/audio/*/CREDITS.txt.
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
        title: 'Efeitos sonoros',
        author: 'Kenney Vleugels',
        license: 'CC0 1.0 (domínio público)',
        note: 'Toque de escolha, acerto e erro, dos packs Interface Sounds, RPG Audio, Impact Sounds, Digital Audio e Music Jingles. Ver public/assets/audio/sfx/CREDITS.txt para a origem de cada arquivo.',
        url: 'https://kenney.nl',
      },
      {
        title: '"That Game Arcade (Medium)", tema da tela inicial',
        author: 'moodmode',
        license: 'Licença de Conteúdo Pixabay',
        note: 'Toca em loop na tela inicial, com fade ao entrar no jogo.',
        url: 'https://pixabay.com/music/',
      },
      {
        title: '"Mystery Vintage Recordings", tema da jornada',
        author: 'EchoWaveMutawe',
        license: 'Licença de Conteúdo Pixabay',
        note: 'Toca em loop durante os capítulos.',
        url: 'https://pixabay.com/music/',
      },
      {
        title: 'Trilha e efeitos 8-bit sintetizados',
        author: 'Original do projeto',
        license: 'Sintetizado em tempo real',
        note: 'Gerados via WebAudio e usados automaticamente caso algum arquivo de áudio esteja ausente, para o jogo nunca ficar mudo.',
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
  'Toda a arte deste jogo é desenhada por código, sem nenhum pack de terceiros. ' +
  'O áudio e as fontes vêm de fontes com licença livre para uso comercial ' +
  '(CC0, Licença de Conteúdo Pixabay e SIL Open Font License), verificadas antes do uso.';
