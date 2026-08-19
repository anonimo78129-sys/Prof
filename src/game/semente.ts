// ─────────────────────────────────────────────────────────
// SEMENTE — O QUE VOLTA A CRESCER
//
// Quarenta anos depois do Colapso, Barro Alto vive de uma horta que já
// não alimenta todo mundo. A anciã manda o jogador atravessar as ruínas
// até a antiga estação agrícola, atrás das sementes guardadas no cofre.
//
// A virada: o cofre está vazio, as sementes apodreceram. Mas o chão que
// ele pisou o caminho inteiro é um banco de sementes — enterradas,
// esperando luz. Não era um cofre. Era o chão.
//
// SOBRE O CONTEÚDO
// Cada encontro é um problema de quintal, resolvido olhando: água parada
// que fede, flor que abre e cai, pão que mofa no úmido e não no seco,
// clareira onde a árvore caiu. Biologia do cotidiano, sem fórmula e sem
// nome técnico antes da hora — o nome vem depois, batizando o que o
// aluno já entendeu.
// ─────────────────────────────────────────────────────────

export interface Fala {
  quem: string;
  texto: string;
}

export interface Escolha {
  label: string;
  certa: boolean;
  resultado: string;
}

export interface Encontro {
  id: string;
  /** o que a pessoa diz antes de perguntar */
  fala: Fala[];
  pergunta: string;
  escolhas: Escolha[];
  /** o que ela passa a dizer depois de resolvido */
  depois: string;
}

export interface Npc {
  id: string;
  x: number;
  y: number;
  /** qual folha de personagem usar */
  arte: string;
  olhando: 0 | 1 | 2 | 3;
  encontro?: string;
  /** conversa solta, para quem não tem desafio */
  conversa?: string[];
}

export interface Saida {
  x: number;
  y: number;
  para: string;
  destinoX: number;
  destinoY: number;
}

export interface Objeto {
  x: number;
  y: number;
  peca: string;
}

export interface Mapa {
  id: string;
  nome: string;
  chao: string[];
  objetos: Objeto[];
  npcs: Npc[];
  saidas: Saida[];
}

// ── encontros ────────────────────────────────────────────

export const ENCONTROS: Record<string, Encontro> = {
  poco: {
    id: 'poco',
    fala: [
      { quem: 'NITA', texto: 'Não bebe dessa água não, menino.' },
      {
        quem: 'NITA',
        texto:
          'Faz três semanas que ela está parada aí. Começou limpa. Hoje está esverdeada, ' +
          'com aquele cheiro de ovo velho, e tem bichinho nadando na superfície.',
      },
      {
        quem: 'NITA',
        texto:
          'O riacho lá embaixo é a mesma água, vem do mesmo lugar. Aquele você bebe e não ' +
          'acontece nada. Esse aqui derruba um homem em dois dias.',
      },
    ],
    pergunta: 'A água do poço está podre e a do riacho não. Por quê?',
    escolhas: [
      {
        label: 'Porque o poço é fundo e o fundo é sujo',
        certa: false,
        resultado:
          'Você raspa o fundo do poço e troca a água. Duas semanas depois, mesma coisa: verde, ' +
          'fedendo, com larva. O fundo não era o problema — era ficar parada. ' +
          'Nita ri: "Limpar não adianta se você não mexe."',
      },
      {
        label: 'Porque água parada perde o ar que tem dentro',
        certa: true,
        resultado:
          'Você abre um risco de terra ligando o poço ao riacho. Em poucos dias a água clareia e ' +
          'o cheiro some.\n\n' +
          'Tem ar dissolvido dentro da água, e é dele que vivem os bichos que limpam o resto. ' +
          'Água que despenca e se mistura recolhe ar o tempo todo; água parada gasta o que tinha ' +
          'e não repõe. Quando o ar acaba, quem assume são os que vivem SEM ar — e é o trabalho ' +
          'deles que faz aquele cheiro de ovo podre.\n\n' +
          'Não é sujeira que fede. É falta de ar.',
      },
    ],
    depois: 'A água corre agora. Passa a mão: está fria. Água parada é água morta, menino.',
  },

  horta: {
    id: 'horta',
    fala: [
      { quem: 'SEU DORIL', texto: 'Olha essa abobreira. Já viu coisa mais bonita?' },
      {
        quem: 'SEU DORIL',
        texto:
          'Flor amarela do tamanho da minha mão, uma atrás da outra, dois meses seguidos. ' +
          'E nem uma abóbora. Nenhuma. As flores abrem, ficam dois dias e caem inteiras.',
      },
      {
        quem: 'SEU DORIL',
        texto:
          'A terra está boa, eu rego todo dia, o sol bate a manhã inteira. Antes do Colapso meu ' +
          'avô plantava aqui e colhia carroça.',
      },
    ],
    pergunta: 'A abobreira floresce e não dá fruto. O que falta?',
    escolhas: [
      {
        label: 'Falta adubo — a planta não tem força para segurar a fruta',
        certa: false,
        resultado:
          'Você reforça o canteiro com esterco curtido. Vem MAIS flor ainda, do tamanho de um prato. ' +
          'E nenhuma abóbora.\n\n' +
          'A planta nunca esteve fraca. Ela estava fazendo a parte dela e esperando alguém aparecer.',
      },
      {
        label: 'Falta bicho — não vi uma abelha esse tempo todo aqui',
        certa: true,
        resultado:
          'Você repara: em duas horas de horta, nenhuma abelha, nenhuma mosca grande, nada. Só ' +
          'formiga no chão.\n\n' +
          'Então você faz o serviço na mão: pega o pó amarelo de uma flor com um pincel de pelo de ' +
          'cabra e passa no meio da outra. Nove dias depois há três abóboras pegando.\n\n' +
          'Flor é propaganda. A cor, o cheiro e o açúcar existem para pagar quem carrega o pó de ' +
          'uma flor até a outra. Sem esse carregador, a flor abre para ninguém.\n\n' +
          'Seu Doril fica calado um tempo. Depois: "Sumiram quando queimaram o mato do outro lado."',
      },
    ],
    depois: 'Três pegando, menino. Três! Vou plantar flor no meio da horta, pra chamar os bichos de volta.',
  },

  paiol: {
    id: 'paiol',
    fala: [
      { quem: 'VILMA', texto: 'Perdi metade do paiol esse mês. Metade.' },
      {
        quem: 'VILMA',
        texto:
          'O pão que fica no canto de baixo cria aquele veludo verde em três dias. O que fica na ' +
          'prateleira de cima, perto da telha quebrada, dura duas semanas e só resseca.',
      },
      {
        quem: 'VILMA',
        texto:
          'Mesmo pão, mesmo forno, mesmo dia. Só muda o lugar. E o canto de baixo é o mais fresco ' +
          'do paiol — eu achei que fresco fosse melhor.',
      },
    ],
    pergunta: 'Por que o pão de baixo mofa e o de cima não?',
    escolhas: [
      {
        label: 'O canto de baixo está mais frio, e o frio estraga o pão',
        certa: false,
        resultado:
          'Você sobe tudo para o canto quente, perto do forno. O pão mofa mais rápido ainda, e ' +
          'agora azeda junto.\n\n' +
          'Não era o frio. Frio de verdade — de gelo — atrasa o mofo. O que o canto de baixo tem ' +
          'a mais não é temperatura: é água no ar.',
      },
      {
        label: 'O canto de baixo é úmido, e o mofo precisa de água',
        certa: true,
        resultado:
          'Você abre a telha, deixa o vento entrar e passa o pão para a prateleira alta. O mofo para.\n\n' +
          'Mofo é um ser vivo, e todo ser vivo precisa de água para trabalhar. No úmido ele come, ' +
          'cresce e se espalha; no seco ele fica parado, esperando.\n\n' +
          'É por isso que carne salgada e peixe seco atravessam o ano: o sal e o sol tiram a água ' +
          'que o mofo usaria. Ninguém matou o bicho — só tiraram a bebida dele.\n\n' +
          'Vilma anota tudo num pedaço de saco.',
      },
    ],
    depois: 'Alto e ventilado. Escrevi na parede pra ninguém esquecer.',
  },

  clareira: {
    id: 'clareira',
    fala: [
      { quem: 'TEO', texto: 'Ó, moço. Repara nesse pedaço aqui.' },
      {
        quem: 'TEO',
        texto:
          'A árvore grande caiu no temporal do ano passado. Antes disso aqui era escuro e limpo, ' +
          'só folha seca no chão, nada crescia.',
      },
      {
        quem: 'TEO',
        texto:
          'Um ano depois está desse jeito: capim na altura do meu peito, três tipos de flor, ' +
          'aquele arbusto de fruta vermelha. Ninguém plantou nada. Ninguém regou.',
      },
    ],
    pergunta: 'Ninguém plantou. De onde veio tudo isso?',
    escolhas: [
      {
        label: 'O vento trouxe as sementes depois que a árvore caiu',
        certa: false,
        resultado:
          'Vento traz semente, é verdade. Mas em um ano ele não traria capim, flor E arbusto de ' +
          'fruta, todos brotando na mesma semana, exatamente no buraco de luz.\n\n' +
          'Teo aponta para fora da clareira: "Ali também bate vento. Ali não nasceu nada."',
      },
      {
        label: 'As sementes já estavam no chão, esperando luz',
        certa: true,
        resultado:
          'Você cava um punhado de terra na sombra, longe da clareira, e espalha num caixote ao sol. ' +
          'Em três semanas o caixote está verde. Ninguém plantou aquilo. Já estava lá.\n\n' +
          'O chão de mata guarda semente enterrada por anos, viva e parada. Falta luz. Enquanto a ' +
          'árvore grande estava de pé, ela tomava toda a luz para si e ninguém debaixo dela ' +
          'conseguia crescer. Ela caiu, abriu o buraco — e o chão descarregou o que estava guardando.\n\n' +
          'Teo: "Então a mata é um paiol." É exatamente isso.',
      },
    ],
    depois: 'Um paiol embaixo do pé da gente. Vou contar pra minha mãe.',
  },
};

export const ORDEM = ['poco', 'horta', 'paiol', 'clareira'];

// ── mapas ────────────────────────────────────────────────
// . grama   , grama com tufo   ; grama com pedrisco   t terra batida
// = piso de pedra   # parede (barra passagem)

export const MAPAS: Record<string, Mapa> = {
  povoado: {
    id: 'povoado',
    nome: 'BARRO ALTO',
    chao: [
      '##############################',
      '##############################',
      '##############################',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######..tttttttttttttt..######',
      '######..tttttttttttttt..######',
      '######..tttttttttttttt..######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######.tttttttttttttttt.######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '######........tt........######',
      '############tt################',
      '############tt################',
      '############tt################',
    ],
    objetos: [
      { x: 0, y: 1, peca: 'bosque' },
      { x: 13, y: 1, peca: 'bosque' },
      { x: 17, y: 1, peca: 'bosque' },
      { x: 0, y: 3, peca: 'bosqueMorto' },
      { x: 24, y: 3, peca: 'bosqueMorto' },
      { x: 0, y: 6, peca: 'bosqueMorto' },
      { x: 24, y: 6, peca: 'bosqueMorto' },
      { x: 0, y: 9, peca: 'bosqueMorto' },
      { x: 24, y: 9, peca: 'bosqueMorto' },
      { x: 0, y: 12, peca: 'bosqueMorto' },
      { x: 24, y: 12, peca: 'bosqueMorto' },
      { x: 0, y: 15, peca: 'bosqueMorto' },
      { x: 24, y: 15, peca: 'bosqueMorto' },
      { x: 0, y: 18, peca: 'bosqueMorto' },
      { x: 24, y: 18, peca: 'bosqueMorto' },
      { x: 0, y: 21, peca: 'bosqueMorto' },
      { x: 24, y: 21, peca: 'bosqueMorto' },
      { x: 0, y: 24, peca: 'bosqueMorto' },
      { x: 24, y: 24, peca: 'bosqueMorto' },
      { x: 0, y: 27, peca: 'bosqueMorto' },
      { x: 6, y: 27, peca: 'bosqueMorto' },
      { x: 18, y: 27, peca: 'bosqueMorto' },
      { x: 24, y: 27, peca: 'bosqueMorto' },
      { x: 6, y: 4, peca: 'casa' },
      { x: 16, y: 4, peca: 'casa' },
      { x: 6, y: 21, peca: 'casa' },
      { x: 9, y: 12, peca: 'varal' },
      { x: 18, y: 12, peca: 'caixotes' },
      { x: 20, y: 15, peca: 'carroca' },
      { x: 18, y: 21, peca: 'rochedo' },
      { x: 11, y: 7, peca: 'estatua' },
      { x: 7, y: 25, peca: 'altar' },
      { x: 7, y: 14, peca: 'canteiro' },
      { x: 7, y: 19, peca: 'canteiro' },
      { x: 10, y: 14, peca: 'canteiro' },
      { x: 17, y: 19, peca: 'toco' },
      { x: 13, y: 12, peca: 'poste' },
      { x: 16, y: 12, peca: 'poste' },
      { x: 16, y: 16, peca: 'pote' },
      { x: 17, y: 16, peca: 'caixote' },
      { x: 18, y: 16, peca: 'saco' },
      { x: 8, y: 23, peca: 'pote' },
      { x: 19, y: 18, peca: 'pedra' },
      { x: 11, y: 23, peca: 'pedra' },
      { x: 21, y: 8, peca: 'cruz' },
      { x: 22, y: 9, peca: 'cruz' },
      { x: 9, y: 25, peca: 'osso' },
      { x: 16, y: 23, peca: 'girassol' },
      { x: 17, y: 24, peca: 'flores' },
      { x: 7, y: 12, peca: 'margarida' },
      { x: 20, y: 5, peca: 'moita' },
      { x: 7, y: 22, peca: 'moitaSeca' },
      { x: 19, y: 24, peca: 'arbusto' },
      { x: 12, y: 20, peca: 'vaso' },
    ],
    npcs: [
      { id: 'nita', x: 13, y: 17, arte: 'p12', olhando: 3, encontro: 'poco' },
      { id: 'doril', x: 9, y: 17, arte: 'p2', olhando: 0, encontro: 'horta' },
      { id: 'vilma', x: 17, y: 14, arte: 'p4', olhando: 0, encontro: 'paiol' },
      {
        id: 'anciã',
        x: 14,
        y: 7,
        arte: 'p9',
        olhando: 0,
        conversa: [
          'Barro Alto tem cento e onze bocas e uma horta que dá para setenta.',
          'Antes do Colapso havia uma estação agrícola trilha abaixo. Diziam que guardavam ' +
            'semente de tudo num cofre frio, para o caso de um dia faltar.',
          'Um dia faltou. Desce a trilha do sul, menino. Fala com quem encontrar no caminho — ' +
            'quem ficou vivo aprendeu a olhar.',
        ],
      },
    ],
    saidas: [{ x: 12, y: 28, para: 'trilha', destinoX: 12, destinoY: 3 }],
  },

  trilha: {
    id: 'trilha',
    nome: 'TRILHA DO SUL',
    chao: [
      '############tt################',
      '############tt################',
      '############tt################',
      '######......tt..........######',
      '######......tt..........######',
      '######......tt..........######',
      '######......tt..........######',
      '######......tt..........######',
      '######......tt..........######',
      '######.ttttttt..........######',
      '######.tt...............######',
      '######.tt...............######',
      '######.tt...............######',
      '######.tt...............######',
      '######.tt...............######',
      '######.tt...............######',
      '######.tttttttttt.......######',
      '######.........tt.......######',
      '######.........tt.......######',
      '######.........tt.......######',
      '######.........tt.......######',
      '######.........tt.......######',
      '######.........tt.......######',
      '######.........tt.......######',
      '######.........ttttttt..######',
      '######..............tt..######',
      '######..............tt..######',
      '######..............tt..######',
      '######..............tt..######',
      '######..............tt..######',
      '######..............tt..######',
      '######..............tt..######',
      '######..............tt..######',
      '##################tt##########',
      '##################tt##########',
      '##################tt##########',
    ],
    objetos: [
      { x: 0, y: 1, peca: 'bosque' },
      { x: 13, y: 1, peca: 'bosque' },
      { x: 17, y: 1, peca: 'bosque' },
      { x: 0, y: 3, peca: 'bosqueMorto' },
      { x: 24, y: 3, peca: 'bosqueMorto' },
      { x: 0, y: 6, peca: 'bosqueMorto' },
      { x: 24, y: 6, peca: 'bosqueMorto' },
      { x: 0, y: 9, peca: 'bosqueMorto' },
      { x: 24, y: 9, peca: 'bosqueMorto' },
      { x: 0, y: 12, peca: 'bosqueMorto' },
      { x: 24, y: 12, peca: 'bosqueMorto' },
      { x: 0, y: 15, peca: 'bosqueMorto' },
      { x: 24, y: 15, peca: 'bosqueMorto' },
      { x: 0, y: 18, peca: 'bosqueMorto' },
      { x: 24, y: 18, peca: 'bosqueMorto' },
      { x: 0, y: 21, peca: 'bosqueMorto' },
      { x: 24, y: 21, peca: 'bosqueMorto' },
      { x: 0, y: 24, peca: 'bosqueMorto' },
      { x: 24, y: 24, peca: 'bosqueMorto' },
      { x: 0, y: 27, peca: 'bosqueMorto' },
      { x: 24, y: 27, peca: 'bosqueMorto' },
      { x: 0, y: 30, peca: 'bosqueMorto' },
      { x: 24, y: 30, peca: 'bosqueMorto' },
      { x: 0, y: 33, peca: 'bosqueMorto' },
      { x: 6, y: 33, peca: 'bosqueMorto' },
      { x: 12, y: 33, peca: 'bosqueMorto' },
      { x: 24, y: 33, peca: 'bosqueMorto' },
      { x: 9, y: 4, peca: 'rochedo' },
      { x: 17, y: 5, peca: 'bosqueMorto' },
      { x: 9, y: 12, peca: 'bosqueMorto' },
      { x: 17, y: 12, peca: 'carroca' },
      { x: 10, y: 6, peca: 'toco' },
      { x: 11, y: 20, peca: 'pedraGrande' },
      { x: 17, y: 18, peca: 'bosqueMorto' },
      { x: 7, y: 28, peca: 'bosqueMorto' },
      { x: 13, y: 26, peca: 'toco' },
      { x: 10, y: 28, peca: 'broto' },
      { x: 12, y: 29, peca: 'broto' },
      { x: 11, y: 30, peca: 'broto' },
      { x: 13, y: 29, peca: 'broto' },
      { x: 9, y: 30, peca: 'broto' },
      { x: 14, y: 31, peca: 'broto' },
      { x: 12, y: 31, peca: 'broto' },
      { x: 10, y: 26, peca: 'girassol' },
      { x: 14, y: 28, peca: 'margarida' },
      { x: 17, y: 31, peca: 'arbusto' },
      { x: 8, y: 24, peca: 'moita' },
      { x: 16, y: 30, peca: 'moitaSeca' },
      { x: 13, y: 21, peca: 'caveira' },
      { x: 11, y: 17, peca: 'osso' },
      { x: 19, y: 8, peca: 'cruz' },
      { x: 9, y: 15, peca: 'pedra' },
      { x: 18, y: 23, peca: 'pedra' },
      { x: 12, y: 11, peca: 'moitaSeca' },
      { x: 22, y: 27, peca: 'caverna' },
    ],
    npcs: [
      { id: 'teo', x: 12, y: 30, arte: 'p6', olhando: 3, encontro: 'clareira' },
      {
        id: 'andarilho',
        x: 8, y: 11, arte: 'p7', olhando: 0,
        conversa: [
          'A estação fica no fim da trilha, do lado da boca de pedra. Você não erra.',
          'Já fui lá. Não vou voltar. O que você procura não está lá dentro.',
        ],
      },
    ],
    saidas: [
      { x: 12, y: 2, para: 'povoado', destinoX: 12, destinoY: 27 },
      { x: 20, y: 34, para: 'estacao', destinoX: 9, destinoY: 14 },
    ],
  },

  estacao: {
    id: 'estacao',
    nome: 'ESTAÇÃO AGRÍCOLA',
    chao: [
      '##################',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '#================#',
      '########tt########',
    ],
    objetos: [
      { x: 7, y: 2, peca: 'altar' },
      { x: 2, y: 3, peca: 'caixotes' },
      { x: 13, y: 3, peca: 'caixotes' },
      { x: 3, y: 7, peca: 'pote' },
      { x: 14, y: 7, peca: 'saco' },
      { x: 5, y: 10, peca: 'caixote' },
      { x: 11, y: 10, peca: 'pedra' },
      { x: 8, y: 8, peca: 'broto' },
      { x: 4, y: 5, peca: 'caveira' },
      { x: 12, y: 6, peca: 'osso' },
    ],
    npcs: [],
    saidas: [{ x: 9, y: 15, para: 'trilha', destinoX: 20, destinoY: 33 }],
  },
};

export const MAPA_INICIAL = 'povoado';
export const INICIO = { x: 14, y: 20, olhando: 1 as const };
