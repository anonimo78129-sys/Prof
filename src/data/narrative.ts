import type { NarrativeChoice } from '../types/game';

export const INTRO_LINES = [
  'De repente, uma luz intensa invade o quarto...',
  'Um portal se abre diante de você.',
  'Você é puxado para dentro antes de poder reagir.',
  '...',
  'Você acorda em um mundo desconhecido.',
];

export const IRIS_INTRO = [
  'Olá! Eu sou Íris.',
  'Você está no Éter — uma dimensão onde o conhecimento tem forma física.',
  'Os habitantes só confiam em quem sabe responder.',
  'Colete os 3 Fragmentos de Luz e eu abrirei o Portal de Volta.',
  'Boa sorte. Você vai precisar.',
];

export const TRANSITIONS: Record<string, string[]> = {
  'intro→forest': [
    'Íris aponta para uma floresta escura ao longe.',
    '"O primeiro Fragmento está lá dentro."',
    '"Cuidado com os segredos que a floresta esconde."',
  ],
  'forest→city': [
    'O Fragmento Esmeralda brilha no seu inventário.',
    'Íris sorri: "Bem feito. O próximo fica nas nuvens."',
    '"Existe uma cidade flutuante além das montanhas."',
  ],
  'city→caves': [
    'Dois fragmentos. Falta um.',
    'Íris susurra: "Sinto o brilho vindo de baixo..."',
    '"As Cavernas de Cristal. Vá com cuidado."',
  ],
  'caves→tower': [
    'Os três fragmentos vibram juntos.',
    '"Você conseguiu!" — diz Íris, em êxtase.',
    '"A Torre do Portal está à sua frente."',
    '"Insira os fragmentos. O caminho de volta te aguarda."',
  ],
};

export const GUARDIAN_DIALOGUES = {
  tree: {
    intro: 'Criança do mundo sólido... Mostre-me que seu conhecimento ecoa verdadeiro.',
    success: 'Você brilha com o saber. Receberá o Fragmento Esmeralda.',
    fail: 'Tente novamente. A floresta é paciente.',
    karma_react_luz: 'A generosidade do saber é uma virtude rara. Lembre-se disso.',
    karma_react_sombra: 'A curiosidade ousada tem seu preço — e sua recompensa.',
  },
  cog: {
    intro: 'Oh! Um visitante tridimensional! Minha Máquina do Conhecimento está avariada!',
    success: 'FANTÁSTICO! Você reconectou tudo! Tome o Fragmento Âmbar!',
    fail: 'Hmm, essa conexão está errada. Tente outra combinação!',
    karma_react_luz: 'Resolver problemas do mundo! Que ideal nobre! Minha aprovação total!',
    karma_react_sombra: 'Os maiores mistérios do universo ainda estão por ser descobertos! Adoro sua perspectiva!',
  },
  celene: {
    intro: 'Cada cristal guarda um segredo eterno. Acende-os com o brilho do teu conhecimento.',
    success: 'O caminho está completo. O Fragmento Safira é seu.',
    fail: 'O cristal não brilhou. Tente de novo — a verdade está em você.',
    karma_react_luz: 'Compartilhar o saber... Uma escolha que o Éter jamais esquece.',
    karma_react_sombra: 'Os maiores segredos pertencem aos que ousam guardá-los. E depois revelá-los.',
  },
  guardian: {
    intro_heroi: 'Sinto a Luz em você. Mas palavras não abrem portais. Prove.',
    intro_sabio: 'A Sombra da curiosidade te guia. Interessante. Mostre-me o que aprendeu.',
    intro_explorador: 'Você caminhou entre dois mundos. Isso me diz muito. Vamos ver o resto.',
    intro_default: 'Você chegou até aqui. Agora prove que merece voltar.',
    success: 'O Portal se abre. Você está livre.',
    fail: 'Ainda não. Tente de novo.',
  },
};

export const VICTORY_TEXTS: Record<string, { title: string; text: string; color: string }> = {
  heroi: {
    title: 'O Herói da Luz',
    text: 'Sua generosidade abriu o portal. O Éter nunca te esquecerá.',
    color: '#ffd700',
  },
  sabio: {
    title: 'O Sábio das Sombras',
    text: 'Sua curiosidade ousada libertou o que ninguém mais conseguia.',
    color: '#cc44ff',
  },
  explorador: {
    title: 'O Explorador',
    text: 'Você não escolheu um caminho — você criou o seu.',
    color: '#00d4aa',
  },
  mestre: {
    title: '★ Mestre do Éter ★',
    text: 'Poucos alcançam este nível. O Éter inclina-se diante de você.',
    color: '#ffffff',
  },
};

export const DEFAULT_NARRATIVE_CHOICES: Record<'forest' | 'city' | 'caves', NarrativeChoice> = {
  forest: {
    prompt: 'Você tem o brilho do conhecimento. Mas diga: de onde ele vem?',
    options: [
      {
        label: '🌿 Do esforço e da dedicação',
        karma: 'luz',
        reaction: 'A generosidade do saber é uma virtude rara. Lembre-se disso.',
      },
      {
        label: '🌑 Da curiosidade, mesmo nos caminhos perigosos',
        karma: 'sombra',
        reaction: 'A curiosidade ousada tem seu preço — e sua recompensa.',
      },
    ],
  },
  city: {
    prompt: 'Para que serve o conhecimento?',
    options: [
      {
        label: '⚙️ Para resolver problemas do mundo',
        karma: 'luz',
        reaction: 'Que ideal nobre! Minha aprovação total!',
      },
      {
        label: '🔮 Para revelar mistérios que outros não veem',
        karma: 'sombra',
        reaction: 'Os maiores mistérios ainda estão por ser descobertos. Adoro sua perspectiva!',
      },
    ],
  },
  caves: {
    prompt: 'O que você faria com o poder do Éter?',
    options: [
      {
        label: '✨ Usaria para ajudar quem não sabe',
        karma: 'luz',
        reaction: 'Compartilhar o saber... Uma escolha que o Éter jamais esquece.',
      },
      {
        label: '🗝️ Guardaria como meu segredo mais valioso',
        karma: 'sombra',
        reaction: 'Os maiores segredos pertencem a quem ousa guardá-los.',
      },
    ],
  },
};

export const HEART_LOST_MSG = 'Não foi dessa vez...';
export const SCENE_RESTART_MSG = 'Tentando novamente...';

// Lines Iris speaks when the hero approaches each phase portal in the world
export const PHASE_ARRIVAL: Record<string, string> = {
  forest:          'A Floresta dos Ecos... As árvores aqui guardam memórias. Responda às perguntas e o Fragmento Esmeralda é seu!',
  'battle-ruins':  'As Ruínas da Sentinela! Uma guardiã mecânica bloqueia a passagem. Derrote-a com conhecimento!',
  city:            'A Cidade de Nimbra! A Máquina do Conhecimento do Prof. Cog está quebrada. Reconecte os fios!',
  caves:           'As Cavernas de Cristal... Oráculo Celene aguarda. Acenda todos os cristais para conquistar o Fragmento Safira!',
  'battle-desert': 'O Deserto das Sombras! Um caçador do vazio bloqueia seu caminho. Use tudo que aprendeu!',
  'battle-tower':  'A Torre do Portal! Este é o momento final. O Príncipe do Éter vai testar tudo. Dê tudo de si!',
};
