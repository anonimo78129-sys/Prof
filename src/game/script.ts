import type { Beat, StoryScript } from './types';

const beats: Beat[] = [

  // ── ATO 1 — O Portão (a intro ilustrada cobre o Ato 0) ──
  { t: 'scene', bg: 'floresta' },
  { t: 'say', who: 'estudante', lines: [
    'O que é este lugar...?',
    'Não lembro de como cheguei aqui.',
  ] },
  { t: 'walk', dist: 900, hint: 'Explore a floresta', landmark: 'gate' },
  { t: 'say', who: 'estudante', lines: [
    'O que é aquilo?',
    'Ué, um portão??',
  ] },
  { t: 'question',
    intro: 'Há uma inscrição antiga gravada no portão de cipós...',
    q: {
      text: 'Qual parte da planta é responsável por absorver água e nutrientes do solo?',
      options: ['A raiz', 'A flor', 'O fruto', 'A folha'],
      correct: 0,
    },
    success: [
      'O portão se abriu.',
      'Que estranho...',
    ],
    hint: 'As plantas bebem pela base, escondida na terra. Pense no que as sustenta firme no solo.',
  },
  { t: 'walk', dist: 700, hint: 'Siga em frente' },
  { t: 'say', who: 'estudante', lines: [
    'Não vejo ninguém aqui.',
    'Uma clareira sem saída!?',
  ] },

  // ── ATO 2 — A Clareira ──
  { t: 'scene', bg: 'clareira' },
  { t: 'say', who: 'estudante', lines: [
    'Espera... o jardim mudou quando eu acertei.',
    'As plantas... elas reagiram.',
  ] },
  { t: 'say', who: 'narrador', lines: [
    'A clareira pulsa suavemente, como se respirasse.',
  ] },
  { t: 'walk', dist: 850, hint: 'Atravesse a clareira', landmark: 'gate' },
  { t: 'say', who: 'estudante', lines: [
    'Uma pedra gigante bloqueia o caminho!',
    'Coberta de musgo... parece antiga demais.',
  ] },
  { t: 'match',
    intro: 'Raízes de luz se entrelaçam na névoa, formando pares de palavras...',
    pairs: [
      { left: 'Raiz',  right: 'Absorve água e sais minerais' },
      { left: 'Folha', right: 'Realiza fotossíntese' },
      { left: 'Flor',  right: 'Atrai polinizadores' },
      { left: 'Caule', right: 'Transporta seiva pela planta' },
    ],
    success: [
      'A pedra tremeu e afundou na terra!',
      'O jardim me ouviu de novo.',
    ],
    hint: 'Cada parte da planta tem um papel único. Pense no que cada uma faz para a planta sobreviver.',
  },
  { t: 'walk', dist: 800, hint: 'Siga em frente' },
  { t: 'say', who: 'estudante', lines: [
    'A névoa está ficando mais densa...',
    'Para onde será que vai esse caminho?',
  ] },

  // ── ATO 3 — A Macieira ──
  { t: 'scene', bg: 'ato3' },
  { t: 'walk', dist: 700, hint: 'Siga pela floresta' },
  { t: 'say', who: 'estudante', lines: [
    'Caramba, que alto...',
    'Nunca vi uma macieira assim.',
  ] },
  { t: 'say', who: 'narrador', lines: [
    'O tronco parece pulsar — como se algo dentro dele estivesse acordando.',
  ] },
  { t: 'walk', dist: 900, hint: 'Explore a macieira', landmark: 'gate' },
  { t: 'say', who: 'estudante', lines: [
    'Essa macieira está bloqueando tudo!',
    'Nunca vi uma árvore assim, ela parece viva...',
  ] },
  { t: 'collect',
    intro: 'As maçãs da árvore começam a cair... algo nelas guarda um segredo.',
    instruction: 'Toque nas formas de dispersão de sementes',
    items: [
      { label: 'Pelo vento',    correct: true  },
      { label: 'Por animais',   correct: true  },
      { label: 'Pela água',     correct: true  },
      { label: 'Fotossíntese',  correct: false },
      { label: 'Absorção',      correct: false },
    ],
    success: [
      'A macieira balançou e abriu caminho!',
      'A semente precisa ir longe para a espécie sobreviver.',
      'O fruto é a embalagem que garante essa viagem.',
    ],
    hint: 'Dispersão é como a semente viaja para longe da planta mãe. Pense em ventos, rios e animais.',
  },
  // ── ATO 4 — A Estufa ──
  // Still in ato3 — player walks, estufa building enters from the right
  { t: 'walk', dist: 700, hint: 'Siga em frente', landmark: 'estufa-ext' },
  // Say before entering
  { t: 'say', who: 'estudante', lines: ['Parece ser uma estufa.', 'O que é aquilo?'] },
  // Enter estufa
  { t: 'scene', bg: 'estufa' },
  // Inside estufa — find tronco pulsante
  { t: 'walk', dist: 500, hint: 'Explore a estufa', landmark: 'trunk' },
  { t: 'say', who: 'estudante', lines: [
    'Esse tronco... está vivo, como um coração pulsante!',
    'Esse lugar parece ter vida própria!',
  ] },
  // Find the computer
  { t: 'walk', dist: 600, hint: 'Encontre o computador', landmark: 'computer' },
  { t: 'say', who: 'estudante', lines: [
    'Um dos computadores... ligou sozinho.',
    'O sistema pede uma senha.',
  ] },
  { t: 'question',
    intro: 'A tela exibe uma pergunta...',
    q: {
      text: 'Qual processo nas folhas das plantas contribui para o ciclo da água na atmosfera?',
      options: ['Transpiração', 'Fotossíntese', 'Germinação', 'Polinização'],
      correct: 0,
    },
    success: [
      'Acesso autorizado.',
      'Projeto Amazônia II — desbloqueado.',
    ],
    hint: 'As plantas também "suam". Pense no que sai pelas folhas para o ar.',
  },
  { t: 'say', who: 'narrador', lines: [
    'Os arquivos revelam: cientistas criaram uma Amazônia artificial.',
    'As plantas se comunicavam por fungos e sinais elétricos.',
    'O sistema conseguia se autorregular sozinho.',
  ] },
  { t: 'say', who: 'estudante', lines: [
    'As raízes... invadem os equipamentos.',
    'A estufa e a floresta se tornaram uma só coisa.',
  ] },
  { t: 'say', who: 'narrador', lines: [
    'Uma passagem se abre entre as raízes, levando para fora da estufa.',
  ] },
  { t: 'walk', dist: 900, hint: 'Saia pela passagem' },
  { t: 'say', who: 'estudante', lines: [
    'Que lugar estranho... o ar é completamente diferente aqui.',
  ] },

  // ── ATO 5 — O Pântano Encantado ──
  { t: 'scene', bg: 'pantano' },
  { t: 'say', who: 'estudante', lines: [
    'O ar aqui é pesado... cheira a terra molhada.',
    'Um pântano! E a água parece... viva.',
  ] },
  { t: 'walk', dist: 166, hint: 'Avance pelo pântano' },
  { t: 'say', who: 'estudante', lines: [
    'A água tóxica bloqueia a passagem.',
    'Há pedras afundando... só vão me sustentar na ordem certa.',
  ] },
  { t: 'say', who: 'narrador', lines: [
    'Símbolos brilham nas vitórias-régias: o ciclo de vida de uma planta.',
  ] },
  { t: 'sequence',
    intro: 'Para formar a ponte, reviva o ciclo na ordem correta...',
    instruction: 'Toque nas etapas na ordem do ciclo de vida da planta',
    steps: ['Semente', 'Germinação', 'Plântula', 'Planta adulta', 'Flor e fruto'],
    success: [
      'As pedras acenderam e formaram um caminho!',
      'Cada etapa nasce da anterior — é um ciclo sem fim.',
      'A vida sempre recomeça pela semente.',
    ],
    hint: 'Tudo começa pequeno e escondido na terra. Pense em como uma planta cresce, do zero até dar frutos.',
  },
  { t: 'say', who: 'estudante', lines: [
    'Consegui atravessar!',
    'Uma luz estranha vem lá da frente...',
  ] },
  { t: 'walk', dist: 850, hint: 'Siga a luz ao fundo' },
  { t: 'say', who: 'estudante', lines: [
    'A luz fica mais intensa a cada passo...',
  ] },

  // ── ATO 6 — O Corredor de Luz ──
  { t: 'scene', bg: 'corredor' },
  { t: 'say', who: 'narrador', lines: [
    'Os troncos brilham em azul. A floresta inteira parece respirar luz.',
  ] },
  { t: 'walk', dist: 480, hint: 'Siga a luz', landmark: 'consciencia' },
  { t: 'say', who: 'corujao', lines: [
    'Então você chegou até aqui, jovem.',
    'Esta é a Consciência Verde — a mente da floresta.',
    'Ela se comunica por pulsos de luz e pela rede de fungos sob a terra.',
    'Ela vai te testar. Não a decepcione.',
  ] },
  { t: 'say', who: 'consciencia', lines: [
    '... intruso.',
    'Você pisa onde poucos ousam. Prove que merece continuar.',
    'A floresta não abre passagem para quem não a entende.',
  ] },
  { t: 'battle',
    intro: 'A Consciência Verde bloqueia o caminho com pulsos de energia...',
    success: [
      'A floresta reconheceu você.',
      'As plantas trocam açúcar e avisos de perigo pela rede de fungos.',
      'Uma floresta inteira pode ser um só organismo, conectado sob a terra.',
    ],
    hint: 'Use REDE DE FUNGOS para dano alto. TRANSPIRAÇÃO cura você. ESPORA enfraquece o próximo ataque inimigo.',
  },
  { t: 'say', who: 'consciencia', lines: [
    'Você... entende a vida.',
    'Passe. O que você busca está além desta floresta.',
  ] },
  { t: 'say', who: 'estudante', lines: [
    'Eu me comuniquei com a floresta.',
    'Ela está me abrindo caminho para algo...',
  ] },
  { t: 'walk', dist: 900, hint: 'Siga o chamado', landmark: 'lab' },
  { t: 'say', who: 'estudante', lines: [
    'Um prédio... aqui no meio da floresta?',
    'Parece um laboratório. Preciso entrar.',
  ] },

  // ── ATO 7 — O Laboratório Final / A Escolha ──
  { t: 'scene', bg: 'final' },
  { t: 'say', who: 'narrador', lines: [
    'O céu se abre em ouro. Aqui termina — e começa — tudo.',
    'Este é o Domo-Mãe: o último refúgio de vida da Terra.',
  ] },
  { t: 'say', who: 'corujao', lines: [
    'Lá fora, o mundo entrou em colapso: desmatamento, poluição, calor.',
    'Selamos este domo como uma arca, esperando alguém que entendesse.',
    'Você provou que entende a vida. Agora, a decisão é sua.',
  ] },
  { t: 'choice',
    intro: 'O jardim coloca o futuro nas suas mãos...',
    prompt: 'O que você faz com a última semente da Terra?',
    options: [
      {
        label: '🌱 Plantar o recomeço',
        tone: 'luz',
        ending: [
          'Você abre a mão e deposita a semente na terra fértil.',
          'Uma raiz desce, um broto sobe — e a floresta explode em verde.',
          'O domo se abre. A vida transborda para o mundo lá fora.',
          'A Terra terá uma segunda chance. E tudo começou com você.',
        ],
      },
      {
        label: '🥀 Deixar tudo terminar',
        tone: 'sombra',
        ending: [
          'Você fecha a mão. A semente esfria entre seus dedos.',
          'As luzes do domo se apagam, uma a uma.',
          'O silêncio toma conta do último jardim.',
          'Talvez algum dia, alguém escolha diferente...',
        ],
      },
    ],
  },
  { t: 'say', who: 'narrador', lines: [
    'Toda escolha sobre a natureza é, também, uma escolha sobre o nosso futuro.',
    'E você... o que faria, com a última semente nas mãos?',
  ] },
  { t: 'fade', text: 'Fim.' },

];

export const ACT1: StoryScript = { beats };
