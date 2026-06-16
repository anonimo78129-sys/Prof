import type { GameConfig } from '../types/game';

export const DEMO_GAME: GameConfig = {
  id: 'DEMO',
  subject: 'Sistema Solar',
  level: 'Ensino Fundamental II',
  createdAt: Date.now(),
  story: {
    intro: [
      'Um portal de luz surge diante de você...',
      'Bem-vindo ao Éter — o mundo onde o conhecimento tem forma!',
      'Para abrir o Portal Cósmico você precisa dos 3 Fragmentos de Luz.',
      'Cada fragmento guarda segredos do Sistema Solar.',
      'Prove que você domina o cosmos — e volte para casa!',
    ],
    hook: 'Domine o Sistema Solar para abrir o Portal Cósmico!',
  },
  scenes: {
    forest: {
      questions: [
        {
          text: 'Qual é o maior planeta do Sistema Solar?',
          options: ['Saturno', 'Júpiter', 'Urano', 'Netuno'],
          correct: 1,
        },
        {
          text: 'Quantos planetas existem no Sistema Solar atualmente?',
          options: ['7', '8', '9', '10'],
          correct: 1,
        },
        {
          text: 'Qual planeta é conhecido como o "Planeta Vermelho"?',
          options: ['Vênus', 'Júpiter', 'Marte', 'Saturno'],
          correct: 2,
        },
      ],
      narrative: {
        prompt: 'A Árvore Anciã pergunta: O que nos conecta ao cosmos?',
        options: [
          {
            label: 'A curiosidade que nos faz olhar para o céu',
            karma: 'luz',
            reaction: 'A sabedoria da luz guia seu caminho pelas estrelas!',
          },
          {
            label: 'O mistério que nunca conseguiremos desvendar',
            karma: 'sombra',
            reaction: 'Interessante... o desconhecido também é uma força poderosa.',
          },
        ],
      },
    },
    city: {
      pairs: [
        { concept: 'Mercúrio',  definition: 'Planeta mais próximo do Sol' },
        { concept: 'Saturno',   definition: 'Planeta famoso pelos seus anéis visíveis' },
        { concept: 'Terra',     definition: 'Único planeta com vida confirmada' },
        { concept: 'Lua',       definition: 'Satélite natural da Terra' },
      ],
      narrative: {
        prompt: 'Prof. Cog pergunta: Para que serve conhecer o espaço?',
        options: [
          {
            label: 'Para entender nossa origem e proteger o planeta',
            karma: 'luz',
            reaction: 'Fantástico! O conhecimento a serviço da humanidade!',
          },
          {
            label: 'Para descobrir recursos além da Terra',
            karma: 'sombra',
            reaction: 'Hmm... a ambição cósmica também move a ciência!',
          },
        ],
      },
    },
    caves: {
      questions: [
        {
          text: 'Qual astro é o centro do Sistema Solar?',
          options: ['A Lua', 'A Terra', 'O Sol', 'Júpiter'],
          correct: 2,
        },
        {
          text: 'O que é uma "estrela cadente"?',
          options: ['Uma estrela que cai do céu', 'Fragmento de rocha que queima na atmosfera', 'Um cometa que passa perto da Terra', 'Um asteroide explodindo no espaço'],
          correct: 1,
        },
        {
          text: 'Qual a ordem correta dos primeiros 4 planetas a partir do Sol?',
          options: ['Vênus, Mercúrio, Terra, Marte', 'Mercúrio, Vênus, Terra, Marte', 'Terra, Marte, Vênus, Mercúrio', 'Mercúrio, Terra, Vênus, Marte'],
          correct: 1,
        },
        {
          text: 'Quantas luas Marte possui?',
          options: ['0', '1', '2', '4'],
          correct: 2,
        },
        {
          text: 'O que é o Big Bang?',
          options: ['Uma explosão de uma estrela', 'A teoria da origem do universo', 'Um buraco negro gigante', 'Uma colisão entre galáxias'],
          correct: 1,
        },
      ],
      narrative: {
        prompt: 'Oráculo Celene pergunta: O que é mais valioso no universo?',
        options: [
          {
            label: 'A vida e a capacidade de questionar',
            karma: 'luz',
            reaction: 'Os cristais brilham com sua resposta generosa!',
          },
          {
            label: 'O conhecimento guardado nas estrelas extintas',
            karma: 'sombra',
            reaction: 'O passado cósmico guarda segredos imensuráveis...',
          },
        ],
      },
    },
    tower: {
      questions: [
        {
          text: 'A luz do Sol leva ~8 minutos para chegar à Terra. Isso significa que estamos vendo o Sol como ele era:',
          options: ['Agora mesmo', '8 minutos atrás', '1 hora atrás', '1 dia atrás'],
          correct: 1,
        },
        {
          text: 'O que diferencia os planetas rochosos (como Terra) dos planetas gasosos (como Júpiter)?',
          options: ['O tamanho e número de luas', 'A composição: rocha/metal vs. gás/gelo', 'A distância do Sol', 'A velocidade de rotação'],
          correct: 1,
        },
        {
          text: 'O que causa as estações do ano na Terra?',
          options: ['A variação da distância Terra-Sol ao longo do ano', 'A inclinação do eixo da Terra em relação ao plano da órbita', 'A velocidade de rotação da Terra', 'As fases da Lua'],
          correct: 1,
        },
      ],
    },
  },
  assets: {},
};
