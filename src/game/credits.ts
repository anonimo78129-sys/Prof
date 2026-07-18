// ─────────────────────────────────────────────────────────
// Créditos do jogo (Projeto Amazônia / Prof. Corujão).
// Atribuições reunidas a partir dos arquivos CREDITS.txt dos packs,
// do README de áudio e do histórico do projeto. Packs sob CC0 não
// exigem crédito, mas são citados por cortesia; os demais exigem
// atribuição pela licença.
// ─────────────────────────────────────────────────────────

export interface CreditItem {
  title: string;        // nome do recurso / pack / faixa
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
    heading: 'Arte e cenários — pixel art',
    items: [
      {
        title: 'SunnyLand',
        author: 'Ansimuz',
        license: 'CC0 (domínio público)',
        note: 'Raposa companheira, portões, árvores e arbustos.',
        url: 'https://ansimuz.itch.io/sunny-land-pixel-game-art',
      },
      {
        title: 'Free Pixel Art Forest',
        author: 'Eder Muniz',
        license: 'Uso pessoal e comercial com crédito',
        note: 'Camadas de parallax da floresta.',
        url: 'https://edermunizz.itch.io/free-pixel-art-forest',
      },
      {
        title: 'Legacy Fantasy — High Forest',
        author: 'Anokolisa',
        license: 'Pack gratuito (itch.io)',
        note: 'Céu, colinas e sprites do bosque (Atos 1 a 3).',
        url: 'https://anokolisa.itch.io/sidescroller-pixelart-sprites-asset-pack-forest-16x16',
      },
      {
        title: 'Free Swamp 2D Tileset',
        author: 'Craftpix.net',
        license: 'Gratuito com crédito',
        note: 'Cenário do pântano (camadas + troncos e salgueiros).',
        url: 'https://craftpix.net/file-licenses/',
      },
      {
        title: 'Tall Forest pack',
        author: 'Pack gratuito (itch.io)',
        license: 'Confirmar autoria e licença antes de publicar',
        note: 'Floresta e portão do Ato 1.',
      },
      {
        title: 'Jungle Asset pack',
        author: 'Pack gratuito (itch.io)',
        license: 'Confirmar autoria e licença antes de publicar',
        note: 'Camadas de fundo dos Atos 1 e 2.',
      },
      {
        title: 'Ilustrações originais',
        author: 'Equipe do Projeto Amazônia',
        license: 'Criadas para este jogo',
        note: 'Cenas de lore, intro (parada e ônibus), despertar, epílogos, retratos, a Consciência Verde, a árvore mágica e as maçãs.',
      },
    ],
  },
  {
    heading: 'Áudio — música e efeitos',
    items: [
      {
        title: 'Efeitos sonoros — Pixel Dungeon SFX',
        author: 'watabou',
        license: 'Confirmar termos de uso antes de publicar',
        note: 'Toques de diálogo, acerto/erro, portão, combate e vitória.',
      },
      {
        title: 'Música de exploração',
        author: 'Beau Buckley',
        license: 'Confirmar licença de uso antes de publicar',
        note: 'Trilha em loop da intro e da aventura.',
      },
      {
        title: '"Pixel River" — música de combate',
        author: 'Trevor Lentz',
        license: 'Confirmar licença de uso antes de publicar',
        note: 'Trilha do combate com a Consciência Verde.',
      },
      {
        title: 'Trilha chiptune 8-bit sintetizada',
        author: 'Gerada por código no próprio jogo',
        license: 'Original do projeto',
        note: 'Toca como alternativa quando um arquivo de áudio está ausente.',
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
        note: 'Fonte principal da interface do jogo.',
        url: 'https://fonts.google.com/specimen/Press+Start+2P',
      },
      {
        title: 'VT323',
        author: 'Peter Hull',
        license: 'SIL Open Font License 1.1',
        note: 'Fonte secundária, estilo terminal.',
        url: 'https://fonts.google.com/specimen/VT323',
      },
    ],
  },
  {
    heading: 'Tecnologia',
    items: [
      {
        title: 'React, Vite e TypeScript',
        license: 'MIT',
        note: 'Base da aplicação (PWA).',
      },
      {
        title: 'Tailwind CSS · Motion',
        license: 'MIT',
        note: 'Estilo e animações.',
      },
      {
        title: 'qrcode.react · Firebase',
        license: 'MIT / Apache 2.0',
        note: 'QR code de compartilhamento e serviços de nuvem.',
      },
    ],
  },
];

// Aviso de licenças mostrado ao final da página.
export const CREDITS_NOTE =
  'Alguns packs de arte e áudio são gratuitos apenas para determinados usos. ' +
  'Antes de publicar o jogo comercialmente ou em larga escala, confirme os ' +
  'termos de cada recurso marcado acima.';
