import type { Beat, StoryScript } from './types';

const beats: Beat[] = [

  // ── ATO 0 — Despertar ──
  { t: 'scene', bg: 'noite' },
  { t: 'say', who: 'estudante', lines: [
    'Faltam 3 dias para a prova final... e eu mal dormi essa semana.',
    'Só um cochilo rápido...',
  ] },
  { t: 'fade', text: '...' },

  // ── ATO 1 — O Portão ──
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
  { t: 'say', who: 'corujao', lines: [
    'Bem-vindo, jovem.',
    'Pode me chamar de Prof. Corujão.',
    'Reparou que o jardim reagiu quando você respondeu certo?',
  ] },
  { t: 'say', who: 'estudante', lines: [
    'Reagiu? As plantas... elas me ouviram?',
    'Como isso é possível?',
  ] },
  { t: 'say', who: 'corujao', lines: [
    'Este lugar é diferente de tudo que você conhece.',
    'Cada resposta certa revela um fragmento do que aconteceu aqui.',
    'Continue. Ainda há muito pela frente.',
  ] },
  { t: 'walk', dist: 850, hint: 'Atravesse a clareira', landmark: 'gate' },
  { t: 'say', who: 'estudante', lines: [
    'Outro portão!',
    'O que essa floresta quer de mim?',
  ] },
  { t: 'question',
    intro: 'Raízes de luz se entrelaçam e formam palavras na névoa...',
    q: {
      text: 'Qual processo permite que as plantas produzam seu próprio alimento usando a luz solar?',
      options: ['Fotossíntese', 'Fermentação', 'Respiração celular', 'Osmose'],
      correct: 0,
    },
    success: [
      'A clareira inteira ficou mais brilhante!',
      'O jardim me ouviu de novo.',
    ],
    hint: 'As plantas capturam energia da luz solar com água e CO₂ para produzir glicose e oxigênio. É a base de toda a vida.',
  },

  // ── ATO 3 — A Macieira ──
  { t: 'walk', dist: 700, hint: 'Siga pela floresta' },
  { t: 'say', who: 'estudante', lines: [
    'Caramba, que alto...',
    'Nunca vi uma macieira assim.',
  ] },
  { t: 'say', who: 'corujao', lines: [
    'Ela tem quase duzentos anos.',
    'E ainda produz frutos. Sabe por que isso importa?',
  ] },
  { t: 'say', who: 'estudante', lines: [
    'Os frutos... servem para alimentação?',
  ] },
  { t: 'say', who: 'corujao', lines: [
    'Muito mais do que isso.',
    'O fruto é o veículo. A semente é a mensagem.',
    'Cada planta encontrou um modo de enviar sua herança para longe.',
  ] },
  { t: 'walk', dist: 900, hint: 'Explore a macieira', landmark: 'gate' },
  { t: 'say', who: 'estudante', lines: [
    'Mais um portão coberto de raízes.',
    'Esse lugar é um labirinto vivo.',
  ] },
  { t: 'question',
    intro: 'Folhas douradas formam palavras no tronco enorme da macieira...',
    q: {
      text: 'Qual é a principal função do fruto nas plantas com sementes?',
      options: [
        'Proteger e ajudar a dispersar a semente',
        'Realizar fotossíntese',
        'Absorver água e sais minerais do solo',
        'Conduzir a seiva pelo caule',
      ],
      correct: 0,
    },
    success: [
      'A semente precisa ir longe para a espécie sobreviver.',
      'O fruto é a embalagem que garante essa viagem.',
    ],
    hint: 'O fruto envolve e protege a semente, e muitas vezes atrai animais que a carregam para longe, garantindo a dispersão.',
  },
  { t: 'walk', dist: 600, hint: 'Continue adiante' },
  { t: 'say', who: 'estudante', lines: [
    'Esse tronco... está vivo, como um coração pulsante!',
    'Esse lugar parece ter vida própria!',
  ] },
  { t: 'say', who: 'corujao', lines: [
    'Você está começando a entender.',
    'As árvores daqui não estão apenas vivas.',
    'Elas estão... conectadas.',
  ] },
  { t: 'fade', text: 'Continua...' },

];

export const ACT1: StoryScript = { beats };
