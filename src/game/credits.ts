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
        title: 'Cenários em camadas',
        author: 'Original do projeto',
        license: 'Desenhado por código',
        note: 'As 14 cenas são desenhadas pixel a pixel por scripts/gen-art.mjs, cada uma separada em camadas (céu, fundo distante, plano médio e chão) que rolam em velocidades diferentes para dar profundidade. As camadas que rolam são desenhadas em cilindro, então emendam nelas mesmas sem costura.',
      },
      {
        title: 'Estilo 16-bit e paleta fechada',
        author: 'Original do projeto',
        license: 'Desenhado por código',
        note: 'Paleta única de 61 cores organizada em rampas de 4 a 5 tons, no espírito dos consoles de 16 bits. Todo objeto sai com contorno escuro e luz vindo de cima e da esquerda, e o único degradê permitido é o dithering ordenado 4x4. A gravação passa por uma quantização que prende cada pixel à paleta, então nenhuma cor escapa dela.',
      },
      {
        title: 'Sprites do SEMENTE',
        author: 'Kenmi — pacote Cute Fantasy (versão gratuita)',
        license: 'Uso livre em projeto sem fins comerciais · permite alteração',
        note: 'O mundo de SEMENTE é montado sobre o pacote Cute Fantasy: grama, trilha, água, canteiro, carvalhos, casa, cerca, ponte, galinhas e a folha de personagem com seis quadros por direção. A licença gratuita libera uso e alteração em projeto sem fins comerciais, que é o caso deste aplicativo — ele é gratuito e feito para sala de aula. O que o pacote não trazia foi derivado dele aqui mesmo, repintando o que já existia: o mato alto e o concreto da estação saem da mesma silhueta da trilha, as árvores secas e a mata fechada são o carvalho com a copa em outra paleta, e cada morador do povoado é a folha do protagonista com outro cabelo, outra roupa e outro tom de pele.',
      },
      {
        title: 'Sprites de O POÇO',
        author: 'GandalfHardcore',
        license: 'Licença de uso em jogo do autor',
        note: 'Água Preta e o poço são montados com dezesseis pacotes de pixel art do mesmo autor, comprados/baixados no itch.io: o cenário de plataforma (fundo em cinco camadas nas três estações, chão, árvores, acampamento, fogueira, portal e água), as Vigias arqueiras, o cão e a raposa de companhia, o elmo do HUD, os balões de emoção e as nove pastas de personagem que alimentam o criador — pele, cabelo, orelhas, roupa, braços, chapéu, máscara, item de mão e as amarras da Iara. São 388 arquivos e mais de 250 peças vestíveis. A licença permite uso em jogo comercial e modificação; proíbe revender ou redistribuir os pacotes, e é por isso que só o recorte usado pelo jogo está no repositório.',
        url: 'https://gandalfhardcore.itch.io/',
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
        title: 'Roteiro e virada de O POÇO',
        author: 'Equipe do Prof. Corujão',
        license: 'Original do projeto',
        note: 'História de terror rural escrita para este jogo, sem conteúdo de aula: um povoado que troca uma pessoa por ano pela única água do vale, e finge que não. As nove paradas não são prova — são leitura de pessoa, e a resposta que abre a passagem está sempre dita pela própria Vigia ou plantada no cenário. A virada: o poço não leva ninguém, ele devolve, e o que sobe tem a cara de quem desceu. O fim tem duas saídas e nenhuma delas é limpa.',
      },
      {
        title: 'Roteiro e virada',
        author: 'Equipe do Prof. Corujão',
        license: 'Original do projeto',
        note: 'Os 4 capítulos, a escolha final e os 9 desfechos, três deles por morte, foram escritos para este jogo. A botânica aparece como decisão da personagem, não como prova: dormência e viabilidade de sementes, transpiração, órgão de reserva e defesa química da batata, fotossíntese e contaminação do solo, e fitorremediação pela raiz.',
      },
    ],
  },
  {
    heading: 'Referências da história',
    items: [
      {
        title: 'A troca no folclore',
        author: 'Tradição oral europeia e brasileira',
        license: 'Referência criativa',
        note: 'A ideia de que uma criatura pode ocupar o lugar de alguém, com a mesma cara e a mesma voz, atravessa o folclore de meio mundo — do changeling das ilhas britânicas às histórias de gente que volta do mato "diferente". O POÇO usa isso do jeito mais cruel: quem volta é convincente o bastante para a família preferir não perguntar.',
      },
      {
        title: 'Nausicaä do Vale do Vento',
        author: 'Hayao Miyazaki, 1984',
        license: 'Referência criativa',
        note: 'A Selva Tóxica parece estar matando o mundo e na verdade o purifica. A Mancha de CINZAS parte da mesma ideia, e daí vem o erro do protocolo que a protagonista carrega.',
      },
      {
        title: 'Fitorremediação na zona de Chernobyl',
        author: 'Pesquisa publicada',
        license: 'Base científica',
        note: 'Plantas absorvem pela raiz o que está dissolvido no solo e acumulam no caule e nas folhas. É exatamente o que a Mancha faz no jogo.',
      },
      {
        title: 'Girassóis e fitorremediação',
        author: 'Chernobyl e Fukushima',
        license: 'Base científica',
        note: 'Césio e estrôncio imitam potássio e cálcio, então a raiz absorve os dois sem distinguir. Funcionou na água em Chernobyl e falhou no solo de Fukushima, onde o césio ficou preso na argila. Daí sai o problema do canteiro do Cercado.',
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
  'A arte de CINZAS é desenhada por código, sem pack de terceiros. SEMENTE e ' +
  'O POÇO usam pacotes de pixel art de autores externos, com licença ' +
  'verificada para uso em jogo (CC0 no caso do Ninja Adventure, licença do ' +
  'autor no caso dos pacotes do GandalfHardcore). O áudio e as fontes vêm de ' +
  'fontes com licença livre para uso comercial (CC0, Licença de Conteúdo ' +
  'Pixabay e SIL Open Font License), verificadas antes do uso.';
