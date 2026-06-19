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
  { t: 'fade', text: 'Continua...' },

];

export const ACT1: StoryScript = { beats };
