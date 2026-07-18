// ─────────────────────────────────────────────────────────
// Créditos do jogo (Projeto Amazônia / Prof. Corujão).
//
// Lista revisada em conferência completa dos assets em uso no jogo
// publicado (não inclui packs avaliados só na galeria de dev/preview,
// que nunca chegam ao jogador). Atribuições reunidas a partir dos
// arquivos CREDITS.txt embutidos nos próprios packs, do README de
// áudio e da árvore de assets do projeto.
//
// Itens marcados com ⚠️ não têm comprovação de licença no repositório
// (nenhum CREDITS.txt/README anexado, ou metadados do arquivo sugerem
// origem comercial) — usados sob a responsabilidade e autorização da
// equipe do Projeto Amazônia, que forneceu os arquivos. Recomenda-se
// confirmar a licença original antes de distribuição pública/comercial
// em maior escala; o jogo funciona normalmente sem eles (cai para o
// áudio sintetizado equivalente).
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
        license: 'Uso pessoal e comercial, com crédito',
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
        license: 'Gratuito, com crédito',
        note: 'Cenário do pântano (camadas + troncos e salgueiros).',
        url: 'https://craftpix.net/file-licenses/',
      },
      {
        title: 'Tall Forest pack',
        author: 'Autoria não documentada no pack',
        license: '⚠️ Pack gratuito — licença não verificada',
        note: 'Floresta e portão do Ato 1. Fornecido pela equipe do projeto; sem CREDITS/README anexado.',
      },
      {
        title: 'Jungle Asset pack',
        author: 'Autoria não documentada no pack',
        license: '⚠️ Pack gratuito — licença não verificada',
        note: 'Camadas de parallax da Clareira e do Pântano. Fornecido pela equipe do projeto; sem CREDITS/README anexado.',
      },
      {
        title: 'Ilustrações originais',
        author: 'Equipe do Projeto Amazônia',
        license: 'Criadas para este jogo',
        note: 'Cenas de lore, intro (parada e ônibus), despertar, epílogos, retratos, a Consciência Verde, o Domo-Mãe, a árvore mágica e as maçãs, a Estufa e o Corredor de Luz.',
      },
    ],
  },
  {
    heading: 'Áudio — efeitos sonoros',
    items: [
      {
        title: 'Pixel Dungeon Sound Effects',
        author: 'watabou',
        license: '⚠️ Licença dos sons não confirmada',
        note: 'Toques de diálogo, acerto/erro, portão, ataque, dano e vitória. O LICENSE.txt do pack cobre o código-fonte do jogo Pixel Dungeon (GPLv3); não há declaração separada para os sons em si.',
      },
      {
        title: 'Sintetizador 8-bit (fallback)',
        author: 'Gerado por código no próprio jogo',
        license: 'Original do projeto',
        note: 'Toca automaticamente no lugar de qualquer efeito cujo arquivo esteja ausente.',
      },
    ],
  },
  {
    heading: 'Áudio — música',
    items: [
      {
        title: 'Tema da tela inicial',
        author: 'Não documentado',
        license: '⚠️ Licença não verificada',
        note: 'Toca em loop na tela inicial, com fade.',
      },
      {
        title: 'Tema de exploração',
        author: 'Metadados do arquivo indicam "Beau Buckley"',
        license: '⚠️ Licença não verificada — possível faixa comercial',
        note: 'Toca em loop durante a intro e a aventura.',
      },
      {
        title: '"Pixel River" — tema de combate',
        author: 'Metadados do arquivo indicam "Trevor Lentz"',
        license: '⚠️ Licença não verificada — possível faixa comercial',
        note: 'Toca durante o combate com a Consciência Verde.',
      },
      {
        title: 'Trilha chiptune sintetizada (fallback)',
        author: 'Gerada por código no próprio jogo',
        license: 'Original do projeto',
        note: 'Melodia pentatônica em Dó maior, 96 BPM, 8 compassos em loop — toca automaticamente quando um arquivo de música está ausente.',
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
        note: 'Fonte secundária, estilo terminal, usada nos diálogos.',
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
  'Recursos marcados com ⚠️ não têm comprovação de licença anexada ao pack e foram ' +
  'incluídos sob autorização e responsabilidade da equipe do Projeto Amazônia, que ' +
  'os forneceu. O jogo funciona normalmente sem eles — cada um cai automaticamente ' +
  'para uma versão sintetizada equivalente. Antes de uma distribuição pública ou ' +
  'comercial em maior escala, recomenda-se confirmar a licença original de cada ' +
  'item marcado, em especial o pack de efeitos sonoros (possível GPLv3) e as duas ' +
  'faixas de música com metadados de artista comercial.';
