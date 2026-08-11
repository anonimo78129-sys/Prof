// ─────────────────────────────────────────────────────────
// CINZAS — O Último Abrigo
//
// Ficção interativa de sobrevivência pós-apocalíptica. O jogador guia
// uma sobrevivente pelos dias após "a Queda" (um desastre nuclear/
// radioativo), tomando decisões que afetam quatro recursos — ração,
// água, saúde e confiança — até um dos seis desfechos possíveis.
//
// A biologia entra DENTRO das decisões: cada capítulo tem um desafio
// (pergunta de múltipla escolha) sobre a ciência por trás da própria
// sobrevivência — radiação e dano celular, purificação de água e
// microbiologia, imunidade e contágio, fotossíntese e cultivo de
// alimento em ambiente fechado. Acertar rende bônus nos recursos;
// errar ainda ensina (o Prof. Corujão explica) e custa um pouco.
//
// Quando um professor compartilha um quiz (link/QR — ver quizShare.ts),
// as 5 perguntas padrão são substituídas pelas perguntas do professor,
// mantendo a mesma narrativa (ver buildScenes.ts).
// ─────────────────────────────────────────────────────────
import type { MCQuestion } from '../types/game';

export interface Stats {
  racao: number;
  agua: number;
  saude: number;
  confianca: number;
}

export function freshStats(): Stats {
  return { racao: 55, agua: 55, saude: 70, confianca: 30 };
}

export type StatKey = keyof Stats;
export type StatEffect = Partial<Record<StatKey, number>>;

export const clampStat = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function applyEffect(stats: Stats, effect?: StatEffect): Stats {
  if (!effect) return stats;
  const next = { ...stats };
  for (const k in effect) {
    const key = k as StatKey;
    next[key] = clampStat(next[key] + (effect[key] ?? 0));
  }
  return next;
}

// Clima da cena — escolhe o tipo de partícula e a cor de destaque da UI
export type Mood = 'dawn' | 'ash' | 'danger' | 'dusk' | 'hope' | 'bleak' | 'settle';

// Arte de fundo (PNG pixel art gerado por scripts/gen-art.mjs)
export type Art =
  | 'bunker' | 'ruins' | 'toxic' | 'cistern' | 'station' | 'settlement'
  | 'greenhouse' | 'wasteland' | 'dawn' | 'bleak' | 'lone';

// Ícones disponíveis (extraídos do protótipo — ver public/assets/cinzas/icons)
export type CinzasIcon =
  | 'bread' | 'flask' | 'medkit' | 'bandage' | 'nametag' | 'poison' | 'ablaze'
  | 'gasmask' | 'lamp' | 'busstop' | 'silo' | 'windmill' | 'sprout';

export interface Choice {
  label: string;
  effect?: StatEffect;
  next: (s: Stats) => string;
}

interface SceneBase {
  id: string;
  day: number;
  chapter: string;
  mood: Mood;
  art: Art;          // cenário pixel art de fundo
  icon?: CinzasIcon;
  wide?: boolean;   // ícone maior (prédio/estrutura) em vez de item pequeno
  title: string;
}

export interface NarrativeScene extends SceneBase {
  kind: 'narrative';
  text: string;
  choices: Choice[];
}

// Desafio: uma pergunta de biologia ligada à decisão de sobrevivência.
// `next` é fixo (linear) — o desafio não ramifica a história, só o resultado.
export interface ChallengeScene extends SceneBase {
  kind: 'challenge';
  intro: string;          // contexto antes da pergunta
  question: MCQuestion;
  correctText: string;    // reação ao acertar
  wrongText: string;      // reação ao errar (o Corujão ainda explica no hint)
  hint: string;            // explicação mostrada junto com "errado"
  effectCorrect: StatEffect;
  effectWrong: StatEffect;
  next: string;
}

export interface EndingScene extends SceneBase {
  kind: 'ending';
  text: string;
}

// Nó silencioso: decide o próximo id pelos recursos atuais, sem mostrar
// nenhuma tela — usado para ramificar o desfecho final sem uma escolha
// visível ao jogador (a decisão já foi tomada nos capítulos anteriores).
export interface RouterScene extends SceneBase {
  kind: 'router';
  next: (s: Stats) => string;
}

export type Scene = NarrativeScene | ChallengeScene | EndingScene | RouterScene;

// ─────────────────────────────────────────────────────────
// As 5 perguntas padrão (sem quiz de professor) — biologia real,
// ancorada na cena de sobrevivência que a motiva.
// ─────────────────────────────────────────────────────────
const Q_RADIACAO: MCQuestion = {
  text: 'O contador Geiger apita mais forte perto de metais expostos ao ar livre. Por que a radiação ionizante é perigosa para o corpo?',
  options: [
    'Ela esfria demais as células, travando o metabolismo',
    'Ela danifica o DNA dentro das células, podendo causar mutações e matar células saudáveis',
    'Ela deixa a água ácida demais para beber',
    'Ela só afeta objetos de metal, não seres vivos',
  ],
  correct: 1,
};

const Q_AGUA: MCQuestion = {
  text: 'A água da cisterna está turva. Fervê-la antes de beber resolve qual problema?',
  options: [
    'Remove a radiação dissolvida na água',
    'Deixa a água mais gelada e gostosa',
    'Mata bactérias, vírus e outros microrganismos que causam doenças',
    'Evapora o sal, tornando a água mais leve',
  ],
  correct: 2,
};

const Q_IMUNIDADE: MCQuestion = {
  text: 'O outro sobrevivente tem um corte infeccionado no braço. Por que um ferimento aberto piora tão rápido num ambiente como esse?',
  options: [
    'Bactérias entram pela pele rompida e o sistema imunológico precisa combatê-las antes que se espalhem',
    'O sangue esfria e para de circular imediatamente',
    'A pele fechada nunca pode ser infectada, só a aberta',
    'Cortes não têm relação nenhuma com infecção, só com dor',
  ],
  correct: 0,
};

const Q_ECOLOGIA: MCQuestion = {
  text: 'No assentamento, uma estufa improvisada cultiva vegetais sob luz artificial. O que as plantas precisam da luz para produzir seu próprio alimento?',
  options: [
    'Fazer a fotossíntese, convertendo luz, água e CO2 em glicose e liberando oxigênio',
    'Aquecer as raízes para elas absorverem mais minerais',
    'Espantar insetos que comeriam as folhas',
    'Evaporar o excesso de água das folhas mais rápido',
  ],
  correct: 0,
};

const Q_DECOMPOSICAO: MCQuestion = {
  text: 'Ração antiga guardada no abrigo criou mofo. O que esse mofo é, biologicamente?',
  options: [
    'Um mineral que se forma com a umidade do ar',
    'Um fungo decompositor, que se alimenta da matéria orgânica e pode liberar toxinas',
    'Uma reação puramente química, sem nenhum organismo vivo envolvido',
    'Um tipo de bactéria que só existe em ambientes radioativos',
  ],
  correct: 1,
};

// ─────────────────────────────────────────────────────────
// Grafo de cenas — 4 capítulos narrativos + 5 desafios de biologia
// intercalados + 6 desfechos, ramificados pelos 4 recursos.
// ─────────────────────────────────────────────────────────
export function defaultScenes(): Record<string, Scene> {
  return {
    abrigo: {
      id: 'abrigo', art: 'bunker', kind: 'narrative', day: 1, chapter: 'CAPÍTULO 1', mood: 'dawn',
      icon: 'silo', wide: true, title: 'O Abrigo',
      text: 'Você acorda no chão de concreto de um abrigo subterrâneo. As luzes de emergência piscam fracamente. Fazem três dias desde a Queda, e as provisões no armário de metal não vão durar muito. Lá fora, o contador Geiger na parede apita baixo, talvez seguro pra sair.',
      choices: [
        { label: 'Sair agora, enquanto ainda há luz do dia', effect: { agua: -5 }, next: () => 'desafio_radiacao' },
        { label: 'Esperar mais um dia, economizando energia', effect: { racao: -10, saude: 5 }, next: () => 'desafio_radiacao' },
      ],
    },

    desafio_radiacao: {
      id: 'desafio_radiacao', art: 'bunker', kind: 'challenge', day: 1, chapter: 'CAPÍTULO 1', mood: 'dawn',
      icon: 'ablaze', title: 'O Contador Geiger',
      intro: 'Antes de destrancar a escotilha, você para diante do contador Geiger, lembrando o que aprendeu na escola sobre por que esse aviso importa de verdade.',
      question: Q_RADIACAO,
      correctText: 'Você lembra certo: a radiação quebra ligações no DNA. Reconhecer os sinais de risco pode salvar sua vida lá fora.',
      wrongText: 'Não é bem isso, mas entender o motivo real ajuda a se proteger melhor.',
      hint: 'Radiação ionizante tem energia suficiente para romper as ligações químicas do DNA dentro das células. Isso pode causar mutações, matar células ou, em doses altas, causar a doença da radiação.',
      effectCorrect: { saude: 5 },
      effectWrong: { saude: -3 },
      next: 'ruinas',
    },

    ruinas: {
      id: 'ruinas', art: 'ruins', kind: 'narrative', day: 2, chapter: 'CAPÍTULO 2', mood: 'ash',
      icon: 'busstop', title: 'As Ruínas',
      text: 'A cidade que você conhecia agora é um esqueleto de concreto e vidro quebrado. Dois caminhos se abrem: as portas arrombadas de um hospital abandonado, ou as prateleiras de um mercado já saqueado, mas talvez não completamente vazio.',
      choices: [
        { label: 'Ir ao hospital, atrás de remédios', effect: { saude: 15, agua: -10 }, next: (s) => s.saude < 40 ? 'perigo' : 'desafio_agua' },
        { label: 'Ir ao mercado, atrás de comida e água', effect: { racao: 15, confianca: -5 }, next: (s) => s.saude < 40 ? 'perigo' : 'desafio_agua' },
      ],
    },

    perigo: {
      id: 'perigo', art: 'toxic', kind: 'narrative', day: 2, chapter: 'CAPÍTULO 2', mood: 'danger',
      icon: 'gasmask', title: 'Zona Contaminada',
      text: 'Fraca e exausta, você só percebe a poeira esverdeada suspensa no ar quando a garganta começa a arder. Radiação residual. É preciso decidir rápido.',
      choices: [
        { label: 'Colocar a máscara improvisada e atravessar correndo', effect: { saude: -10, agua: -10 }, next: (s) => s.saude < 15 ? 'final_perdida' : 'desafio_agua' },
        { label: 'Voltar e procurar um caminho mais longo, porém seguro', effect: { racao: -15, saude: 5 }, next: () => 'desafio_agua' },
      ],
    },

    desafio_agua: {
      id: 'desafio_agua', art: 'cistern', kind: 'challenge', day: 2, chapter: 'CAPÍTULO 2', mood: 'ash',
      icon: 'flask', title: 'A Cisterna',
      intro: 'Você encontra uma cisterna com água turva. Está com sede, mas sabe que beber água contaminada pode ser tão perigoso quanto não beber nada.',
      question: Q_AGUA,
      correctText: 'Você ferve a água antes de guardá-la. É mais trabalho, mas a garantia vale a pena.',
      wrongText: 'Você guarda a água sem ferver, vai ter que arriscar, ou desperdiçar o pouco combustível que sobrou.',
      hint: 'Ferver a água a 100°C por alguns minutos mata a maioria das bactérias, vírus e protozoários causadores de doenças. Isso não remove radiação nem metais pesados, só o risco microbiológico.',
      effectCorrect: { agua: 10, saude: 5 },
      effectWrong: { saude: -8 },
      next: 'encontro',
    },

    encontro: {
      id: 'encontro', art: 'station', kind: 'narrative', day: 3, chapter: 'CAPÍTULO 3', mood: 'dusk',
      icon: 'lamp', title: 'Um Rosto na Poeira',
      text: 'Perto de um posto de gasolina destruído, você avista outro sobrevivente, magro, carregando uma mochila cheia. Ele te encara, hesitante, a mão perto do cinto. Você repara num curativo mal feito no braço dele, com uma mancha vermelha se espalhando.',
      choices: [
        { label: 'Oferecer parte das provisões em troca de informação', effect: { racao: -10, confianca: 25 }, next: () => 'desafio_imunidade' },
        { label: 'Manter distância e seguir seu caminho sozinha', effect: { confianca: -10 }, next: (s) => s.confianca < 10 ? 'final_lobo' : 'desafio_imunidade' },
      ],
    },

    desafio_imunidade: {
      id: 'desafio_imunidade', art: 'station', kind: 'challenge', day: 3, chapter: 'CAPÍTULO 3', mood: 'dusk',
      icon: 'bandage', title: 'O Curativo',
      intro: 'Se você quer ajudar, ou pelo menos entender o risco de ficar perto dele, precisa saber o que está em jogo com aquele ferimento.',
      question: Q_IMUNIDADE,
      correctText: 'Você troca o curativo dele com cuidado, explicando o que aprendeu. Ele relaxa um pouco, agradecido.',
      wrongText: 'Você ajuda como pode, mesmo sem entender direito o motivo, mas a explicação certa teria ajudado os dois.',
      hint: 'Quando a pele se rompe, ela deixa de ser uma barreira contra micro-organismos. Bactérias podem entrar e se multiplicar no tecido, e o sistema imunológico entra em ação para combatê-las. É isso que causa a vermelhidão, o calor e o inchaço de uma infecção.',
      effectCorrect: { confianca: 10, saude: 3 },
      effectWrong: { confianca: -3 },
      next: 'assentamento',
    },

    assentamento: {
      id: 'assentamento', art: 'settlement', kind: 'narrative', day: 4, chapter: 'CAPÍTULO 4', mood: 'settle',
      icon: 'windmill', wide: true, title: 'Luzes ao Longe',
      text: 'No topo de uma colina de escombros, você avista luzes: um pequeno assentamento cercado por placas de metal reaproveitadas. Fumaça de uma fogueira comunitária sobe no ar frio, e ao lado dela, sob painéis de plástico translúcido, fileiras verdes crescem sob lâmpadas.',
      choices: [
        { label: 'Se aproximar e pedir abrigo', effect: { confianca: 10 }, next: () => 'desafio_ecologia' },
        { label: 'Observar de longe e seguir sozinha', effect: { agua: -5, racao: -5 }, next: () => 'desafio_decomposicao' },
      ],
    },

    desafio_ecologia: {
      id: 'desafio_ecologia', art: 'greenhouse', kind: 'challenge', day: 4, chapter: 'CAPÍTULO 4', mood: 'settle',
      icon: 'sprout', title: 'A Estufa',
      intro: 'Antes de bater na porta, você observa a estufa improvisada: fileiras de plantas crescendo sob luzes, mesmo sem sol de verdade.',
      question: Q_ECOLOGIA,
      correctText: 'Você reconhece o princípio: luz artificial pode substituir o sol na fotossíntese, e é assim que aquele lugar consegue cultivar comida.',
      wrongText: 'Você não sabe explicar por que aquilo funciona, mas funciona, e isso já é motivo de esperança.',
      hint: 'A fotossíntese usa a energia da luz (solar ou artificial) para transformar água e gás carbônico em glicose (o "alimento" da planta), liberando oxigênio como subproduto. É por isso que estufas com iluminação artificial conseguem produzir comida mesmo em ambientes fechados.',
      effectCorrect: { confianca: 8, racao: 5 },
      effectWrong: {},
      next: 'final_por_confianca',
    },

    desafio_decomposicao: {
      id: 'desafio_decomposicao', art: 'wasteland', kind: 'challenge', day: 4, chapter: 'CAPÍTULO 4', mood: 'bleak',
      icon: 'bread', title: 'A Última Ração',
      intro: 'Sozinha, longe das luzes do assentamento, você abre a última embalagem de ração da mochila e encontra manchas esverdeadas crescendo por dentro.',
      question: Q_DECOMPOSICAO,
      correctText: 'Você reconhece o mofo e descarta a ração estragada, evitando adoecer por muito pouco.',
      wrongText: 'Você quase come a ração mofada, mas por sorte o cheiro forte te faz desistir a tempo.',
      hint: 'O mofo é formado por fungos decompositores. Eles se alimentam da matéria orgânica do alimento e, ao crescer, podem liberar micotoxinas, substâncias que causam intoxicação alimentar mesmo em pequenas quantidades.',
      effectCorrect: { saude: 5 },
      effectWrong: { saude: -10, racao: -10 },
      next: 'final_por_recursos',
    },

    final_por_confianca: {
      id: 'final_por_confianca', art: 'dawn', kind: 'router', day: 5, chapter: 'EPÍLOGO', mood: 'hope', title: '',
      next: (s) => {
        if (s.saude < 20) return 'final_perdida';
        if (s.confianca >= 50 && s.racao >= 30 && s.agua >= 30) return 'final_novocomeco';
        if (s.confianca >= 30) return 'final_resgatada';
        return 'final_traida';
      },
    },
    final_por_recursos: {
      id: 'final_por_recursos', art: 'wasteland', kind: 'router', day: 5, chapter: 'EPÍLOGO', mood: 'hope', title: '',
      next: (s) => {
        if (s.saude < 20) return 'final_perdida';
        if (s.racao >= 40 && s.agua >= 40 && s.saude >= 50) return 'final_guardia';
        return 'final_lobo';
      },
    },

    final_novocomeco: {
      id: 'final_novocomeco', art: 'dawn', kind: 'ending', day: 5, chapter: 'EPÍLOGO', mood: 'hope', icon: 'sprout',
      title: 'Novo Começo',
      text: 'Você é recebida com cautela, mas logo prova seu valor. Semanas depois, já tem um lugar à mesa do assentamento, e um nome gravado na placa de metal da entrada: "sobrevivemos juntos". Não é o mundo de antes, mas é um começo.',
    },
    final_resgatada: {
      id: 'final_resgatada', art: 'dawn', kind: 'ending', day: 5, chapter: 'EPÍLOGO', mood: 'hope', icon: 'medkit',
      title: 'Resgatada',
      text: 'Fraca e com poucos recursos, ainda assim você é levada para dentro. Os primeiros dias são difíceis, cuidada por estranhos que também perderam tudo. Aos poucos, a confiança cresce dos dois lados.',
    },
    final_traida: {
      id: 'final_traida', art: 'bleak', kind: 'ending', day: 5, chapter: 'EPÍLOGO', mood: 'bleak', icon: 'nametag',
      title: 'Traída',
      text: 'Eles aceitam sua ajuda com um sorriso fácil demais. Na primeira noite, você acorda sozinha, sem metade do que carregava. A lição dói, mas você segue viva, e mais desconfiada do próximo rosto na poeira.',
    },
    final_guardia: {
      id: 'final_guardia', art: 'lone', kind: 'ending', day: 5, chapter: 'EPÍLOGO', mood: 'settle', icon: 'silo',
      title: 'Guardiã das Ruínas',
      text: 'Você decide que confiar é um luxo que ainda não pode pagar. Constrói um abrigo próprio entre os escombros, aprende a racionar cada gota, cada grão. Sozinha, mas de pé: a guardiã silenciosa das ruínas.',
    },
    final_lobo: {
      id: 'final_lobo', art: 'wasteland', kind: 'ending', day: 5, chapter: 'EPÍLOGO', mood: 'bleak', icon: 'bread',
      title: 'Lobo Solitário',
      text: 'Sem provisões suficientes e sem ninguém por perto, os dias ficam mais curtos e mais frios. Você sobrevive, mas por pouco: cada amanhecer é uma vitória pequena e solitária.',
    },
    final_perdida: {
      id: 'final_perdida', art: 'bleak', kind: 'ending', day: 5, chapter: 'EPÍLOGO', mood: 'bleak', icon: 'poison',
      title: 'Perdida nas Ruínas',
      text: 'O corpo cede antes da vontade. Em algum lugar entre os escombros, sua história para de ser contada por você, e vira só mais um nome riscado numa parede de placas esquecidas.',
    },
  };
}
