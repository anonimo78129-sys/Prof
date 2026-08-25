// ─────────────────────────────────────────────────────────
// Créditos do que o aplicativo usa hoje.
//
// Com os quatro jogos removidos, sobraram os recursos do próprio
// aplicativo: o áudio de licença livre já verificada (efeitos CC0 da
// Kenney e música do Pixabay, com os detalhes de cada arquivo em
// public/assets/audio/*/CREDITS.txt), as fontes e a base técnica.
//
// Quando o jogo novo entrar, a arte dele volta a ter uma seção aqui.
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
      { title: 'qrcode.react e Firebase', license: 'MIT / Apache 2.0', note: 'QR code de compartilhamento do quiz e serviços de nuvem.' },
    ],
  },
];

export const CREDITS_NOTE =
  'A arte de CINZAS é desenhada por código, sem pack de terceiros. SEMENTE e ' +
  'O POÇO usam pacotes de pixel art de autores externos, com licença ' +
  'verificada para uso em jogo (CC0 no caso do Ninja Adventure, licença do ' +
  'autor no caso dos pacotes do GandalfHardcore). O áudio e as fontes vêm de ' +
  'fontes com licença livre para uso comercial (CC0, Licença de Conteúdo ' +
  'Pixabay e SIL Open Font License), verificadas antes do uso.';
