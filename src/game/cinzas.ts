// ─────────────────────────────────────────────────────────
// CINZAS: O Último Abrigo
//
// Ficção interativa de sobrevivência. A protagonista é uma guardiã de
// sementes que sai do Abrigo 7 três dias depois da Queda, com a mochila
// cheia e um protocolo decorado: queimar qualquer crescimento perto da
// porta.
//
// O protocolo está errado, e a botânica é o que revela isso. O mato que
// todos queimam (a Mancha) é uma vegetação que está tirando contaminação
// do solo pela raiz e guardando nas folhas. As cinco decisões não são
// prova: são pistas em escalada, e a última entrega a virada. A escolha
// final vira queimar ou semear.
//
// As cinco lições, todas de botânica: dormência e viabilidade de
// sementes, transpiração, órgão de reserva e defesa química (solanina),
// fotossíntese e absorção pelo solo, e fitorremediação.
//
// Referências assumidas: a Selva Tóxica de "Nausicaä do Vale do Vento"
// (o que parece matar está purificando) e a ciência real da zona de
// Chernobyl (girassóis usados em fitorremediação, porque césio imita
// potássio e estrôncio imita cálcio e a raiz absorve sem distinguir).
//
// Com um quiz de professor (link/QR, ver quizShare.ts), as 5 perguntas
// são trocadas pelas dele e a narrativa segue igual (ver buildScenes.ts).
// ─────────────────────────────────────────────────────────
// O jogo usa duas alternativas por decisão, no mesmo ritmo das escolhas
// de enredo. O quiz do professor pode trazer quatro, e o tipo aceita as
// duas formas.
export interface Pergunta {
  text: string;
  options: string[];
  correct: number;
}

export interface Stats {
  racao: number;
  agua: number;
  saude: number;
  confianca: number;
  lucidez: number;   // o quanto ela leu o mundo certo; decide o desfecho junto
}

export function freshStats(): Stats {
  return { racao: 55, agua: 55, saude: 70, confianca: 30, lucidez: 0 };
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

// Clima da cena: escolhe o tipo de partícula e a cor de destaque da UI
export type Mood = 'dawn' | 'ash' | 'danger' | 'dusk' | 'hope' | 'bleak' | 'settle';

// Arte de fundo (PNG pixel art gerado por scripts/gen-art.mjs)
export type Art =
  | 'bunker' | 'ruins' | 'toxic' | 'cistern' | 'station' | 'settlement'
  | 'greenhouse' | 'wasteland' | 'dawn' | 'bleak' | 'lone' | 'mancha';

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
  art: Art;
  icon?: CinzasIcon;
  title: string;
}

export interface NarrativeScene extends SceneBase {
  kind: 'narrative';
  text: string;
  choices: Choice[];
}

// Desafio: pergunta de biologia que funciona como pista da trama.
// `next` é fixo: o desafio não ramifica a história, só o resultado.
export interface ChallengeScene extends SceneBase {
  kind: 'challenge';
  intro: string;
  question: Pergunta;
  correctText: string;
  wrongText: string;
  hint: string;            // a explicação, mostrada acertando ou errando
  effectCorrect: StatEffect;
  effectWrong: StatEffect;
  next: string;
}

export interface EndingScene extends SceneBase {
  kind: 'ending';
  text: string;
  morte?: boolean;   // fim por morte: oferece retomar o capítulo, não recomeçar tudo
}

// Nó silencioso: decide o próximo id pelos recursos, sem mostrar tela.
export interface RouterScene extends SceneBase {
  kind: 'router';
  next: (s: Stats) => string;
}

export type Scene = NarrativeScene | ChallengeScene | EndingScene | RouterScene;

// ─────────────────────────────────────────────────────────
// As 5 perguntas padrão. Cada uma entrega uma peça da virada.
// ─────────────────────────────────────────────────────────
const Q_SEMENTES: Pergunta = {
  text: 'O gerador morreu e o abrigo vai esquentar. O que você faz com as sementes antes de sair?',
  options: [
    'Molhar tudo antes de fechar, para elas não ressecarem dentro da mochila',
    'Levar as que couberem secas e no escuro, porque calor e umidade acordam a semente fora da terra',
  ],
  correct: 1,
};

const Q_TRANSPIRACAO: Pergunta = {
  text: 'Você amarra um saco plástico num galho cheio de folhas, ao sol. Por que isso daria água?',
  options: [
    'Porque a planta perde água pelas folhas o dia inteiro, e esse vapor condensa no plástico',
    'Porque o plástico esquenta e derrete o orvalho que fica preso na casca do galho',
  ],
  correct: 0,
};

const Q_SOLANINA: Pergunta = {
  text: 'Elias separou um punhado de batatas com a casca esverdeada. O que você diz para ele?',
  options: [
    'Que o verde é só clorofila, sinal de batata fresca, e é a parte mais nutritiva',
    'Que o verde é sinal de que ela pegou luz, e junto com a clorofila vem solanina, que é tóxica',
  ],
  correct: 1,
};

const Q_ESTUFA: Pergunta = {
  text: 'Ela pergunta o que você acha. Qual é a diferença entre os dois canteiros?',
  options: [
    'O plástico da estufa barra a radiação do céu, que é de onde vem a contaminação',
    'A luz dá a energia da fotossíntese, e a terra daqui dentro veio de fora, sem a contaminação do solo',
  ],
  correct: 1,
};

const Q_RAIZES: Pergunta = {
  text: 'Elias espera você dizer alguma coisa. O que essas plantas estão fazendo com o terreno?',
  options: [
    'A folhagem faz sombra, e a sombra segura a contaminação embaixo, impedindo que ela suba',
    'A raiz absorve o que está dissolvido no solo e guarda no caule e nas folhas, inclusive o material radioativo',
  ],
  correct: 1,
};

// ─────────────────────────────────────────────────────────
// Grafo de cenas: 4 capítulos + 5 desafios + a escolha + 6 desfechos
// ─────────────────────────────────────────────────────────
export function defaultScenes(): Record<string, Scene> {
  return {
    // ── CAPÍTULO 1 ──────────────────────────────────────
    abrigo: {
      id: 'abrigo', kind: 'narrative', art: 'bunker', day: 1, chapter: 'CAPÍTULO 1', mood: 'dawn',
      icon: 'silo', title: 'Abrigo 7',
      text: 'O Abrigo 7 guardava dezoito mil variedades de semente e uma pessoa: você. Fazem três dias desde a Queda e o rádio não repete nada além de estática. Na parede, o protocolo que você decorou aos onze anos: manter os potes selados, racionar a água e queimar qualquer crescimento a menos de cinquenta metros da porta.',
      choices: [
        { label: 'Sair agora, enquanto ainda há luz', effect: { agua: -5 }, next: () => 'desafio_sementes' },
        { label: 'Esperar mais um dia e economizar energia', effect: { racao: -10, saude: 5 }, next: () => 'desafio_sementes' },
      ],
    },

    desafio_sementes: {
      id: 'desafio_sementes', kind: 'challenge', art: 'bunker', day: 1, chapter: 'CAPÍTULO 1', mood: 'dawn',
      icon: 'sprout', title: 'O Banco de Sementes',
      intro: 'O gerador parou de madrugada. Sem refrigeração, a temperatura do abrigo sobe todo dia, e você conhece de cor o que isso faz com um banco de sementes: o que está guardado ali só continua vivo porque está frio, seco e no escuro.',
      question: Q_SEMENTES,
      correctText: 'Você escolhe os envelopes menores, fecha com fita e enfia no fundo da mochila, longe do sol. Dezoito mil variedades não cabem. Setecentas cabem.',
      wrongText: 'Você molha os envelopes achando que protege. Duas semanas depois, quase tudo que germinou dentro da mochila apodreceu antes de ver terra.',
      hint: 'Semente guardada está em dormência: viva, mas com o metabolismo quase parado. Umidade e calor são justamente os sinais que quebram essa dormência e mandam germinar. Se ela germina dentro da mochila, gasta a reserva que tinha e morre sem solo. É por isso que banco de semente é frio, seco e escuro.',
      effectCorrect: { saude: 5, lucidez: 15 },
      effectWrong: { saude: -10 },
      next: 'ruinas',
    },

    // ── CAPÍTULO 2 ──────────────────────────────────────
    ruinas: {
      id: 'ruinas', kind: 'narrative', art: 'ruins', day: 2, chapter: 'CAPÍTULO 2', mood: 'ash',
      icon: 'busstop', title: 'As Ruínas',
      text: 'A cidade virou esqueleto de concreto. Você reconhece a padaria pela placa torta e não reconhece mais nada. Num estacionamento inteiro cresceu um emaranhado baixo e escuro, folha grossa e caule roxo, do tipo que o protocolo manda queimar. Você passa longe. O contador, que apitava firme na rua, fica mais quieto perto do canteiro. Você anota e não pensa mais nisso.',
      choices: [
        { label: 'Entrar no hospital atrás de remédios', effect: { saude: 15, agua: -10 }, next: () => 'desafio_transpiracao' },
        { label: 'Cortar pela zona industrial até o mercado', effect: { racao: 15 }, next: () => 'perigo' },
      ],
    },

    perigo: {
      id: 'perigo', kind: 'narrative', art: 'toxic', day: 2, chapter: 'CAPÍTULO 2', mood: 'danger',
      icon: 'gasmask', title: 'Zona Industrial',
      text: 'A poeira esverdeada só aparece contra a luz, e quando você percebe já está respirando. Não é a Mancha: é pó de concreto misturado com o que sobrou do incêndio dos galpões. O contador dispara aqui, e não há um pé de mato vivo em lugar nenhum deste quarteirão.',
      choices: [
        { label: 'Amarrar o pano no rosto e atravessar correndo', effect: { saude: -22, agua: -10 }, next: () => 'rota_travessia' },
        { label: 'Voltar e fazer o contorno, mais longo e mais seguro', effect: { racao: -15, agua: -5 }, next: () => 'desafio_transpiracao' },
      ],
    },

    rota_travessia: {
      id: 'rota_travessia', kind: 'router', art: 'toxic', day: 2, chapter: 'CAPÍTULO 2', mood: 'danger', title: '',
      next: (s) => (s.saude <= 22 ? 'final_dose' : 'desafio_transpiracao'),
    },
    rota_agua: {
      id: 'rota_agua', kind: 'router', art: 'cistern', day: 3, chapter: 'CAPÍTULO 3', mood: 'ash', title: '',
      next: (s) => (s.saude <= 22 ? 'final_sede' : 'encontro'),
    },

    desafio_transpiracao: {
      id: 'desafio_transpiracao', kind: 'challenge', art: 'cistern', day: 2, chapter: 'CAPÍTULO 2', mood: 'ash',
      icon: 'flask', title: 'Sede',
      intro: 'A caixa d’água do prédio secou faz tempo. O que sobrou vivo no quarteirão é uma amendoeira teimosa rachando o asfalto, cheia de folha verde. Na mochila você tem sacos plásticos e barbante.',
      question: Q_TRANSPIRACAO,
      correctText: 'Você amarra três sacos nos galhos mais folhudos e volta ao fim da tarde. Não é muito, mas é água limpa, e saiu de dentro da árvore.',
      wrongText: 'Você raspa a casca atrás de orvalho e junta quase nada. Segue com os cantis leves, e a boca já está seca antes do meio-dia.',
      hint: 'A planta puxa água do solo pela raiz e perde quase toda ela como vapor pelas folhas, pelos estômatos. É a transpiração, e é ela que mantém a coluna de água subindo pelo caule. Fechando um galho com folhas dentro de um saco, esse vapor condensa no plástico e escorre. A água sai filtrada pela própria planta.',
      effectCorrect: { agua: 10, saude: 5, lucidez: 15 },
      effectWrong: { saude: -26 },
      next: 'rota_agua',
    },

    // ── CAPÍTULO 3 ──────────────────────────────────────
    encontro: {
      id: 'encontro', kind: 'narrative', art: 'station', day: 3, chapter: 'CAPÍTULO 3', mood: 'dusk',
      icon: 'lamp', title: 'Um Rosto na Poeira',
      text: 'Perto de um posto sem telhado, um homem magro põe a mochila no chão bem devagar, para você ver que está largando. Diz que se chama Elias. O braço direito está enfaixado com pano de cortina, e a mancha vermelha no pano é maior do que ele admite.',
      choices: [
        { label: 'Oferecer parte das provisões em troca de conversa', effect: { racao: -10, confianca: 25 }, next: () => 'desafio_solanina' },
        { label: 'Manter distância e seguir sozinha', effect: { confianca: -10 }, next: (s) => s.confianca < 10 ? 'final_lobo' : 'desafio_solanina' },
      ],
    },

    desafio_solanina: {
      id: 'desafio_solanina', kind: 'challenge', art: 'station', day: 3, chapter: 'CAPÍTULO 3', mood: 'dusk',
      icon: 'bread', title: 'O Achado de Elias',
      intro: 'Ele abre a mochila e mostra o motivo do bom humor: batatas, tiradas de um fundo de quintal. Metade está com a casca puxando para o verde, do tempo que passaram expostas na sacola dele.',
      question: Q_SOLANINA,
      correctText: 'Ele reclama do desperdício, mas descasca fundo e joga fora o que estava verde. Naquela noite vocês comem sem passar mal. Antes de dormir ele pergunta: então a planta se defende? E você diz que sim, quase toda planta se defende de algum jeito.',
      wrongText: 'Vocês comem tudo, casca e verde. A queimação na garganta começa em uma hora, e a noite inteira é vômito e dor de cabeça, para os dois.',
      hint: 'A batata é um caule subterrâneo modificado, um tubérculo, e serve de reserva de amido para a planta. Exposta à luz, ela produz clorofila e fica verde, e junto vem a solanina, uma substância de defesa contra quem quer comê-la. O verde não é o veneno: é o aviso de que o veneno subiu junto. Por isso se corta fundo a parte esverdeada, ou se descarta.',
      effectCorrect: { confianca: 10, saude: 3, lucidez: 15 },
      effectWrong: { confianca: -8, saude: -24 },
      next: 'rota_batata',
    },

    rota_batata: {
      id: 'rota_batata', kind: 'router', art: 'station', day: 3, chapter: 'CAPÍTULO 3', mood: 'dusk', title: '',
      next: (s) => (s.saude <= 22 ? 'final_solanina' : 'mancha'),
    },

    mancha: {
      id: 'mancha', kind: 'narrative', art: 'mancha', day: 3, chapter: 'CAPÍTULO 3', mood: 'bleak',
      icon: 'poison', title: 'A Mancha',
      text: 'Elias dorme mal e acorda antes do sol firmar. Leva você dois quarteirões e para diante de um terreno tomado pelo mato, que de perto é uma vegetação só, folha larga e cheiro forte de verde. Ele diz que passou três semanas dormindo a vinte metros dali. Você procura nele os sinais que a radiação deixa e não acha nenhum. Então ele estende o contador na direção do chão do terreno, e o ponteiro cai.',
      choices: [
        { label: 'Arrancar uma planta inteira, com raiz, e guardar', effect: { confianca: 5 }, next: () => 'assentamento' },
        { label: 'Anotar tudo no caderno e seguir para as luzes', next: () => 'assentamento' },
      ],
    },

    // ── CAPÍTULO 4 ──────────────────────────────────────
    assentamento: {
      id: 'assentamento', kind: 'narrative', art: 'settlement', day: 4, chapter: 'CAPÍTULO 4', mood: 'settle',
      icon: 'windmill', title: 'O Cercado',
      text: 'O Cercado é uma muralha de chapas com fumaça saindo por cima. Dentro, sob plástico translúcido e lâmpadas puxadas de um moinho, fileiras de alface. Do lado de fora, o canteiro que eles abriram direto na terra deu um palmo de folha amarela e travou. Toda lua nova eles saem em turma, com tochas, e queimam o mato que chegou perto do muro.',
      choices: [
        { label: 'Se aproximar e pedir abrigo', effect: { confianca: 10 }, next: () => 'desafio_estufa' },
        { label: 'Observar de longe antes de se entregar', effect: { agua: -5 }, next: () => 'desafio_estufa' },
      ],
    },

    desafio_estufa: {
      id: 'desafio_estufa', kind: 'challenge', art: 'greenhouse', day: 4, chapter: 'CAPÍTULO 4', mood: 'settle',
      icon: 'sprout', title: 'A Estufa',
      intro: 'Dona Neide cuida da estufa desde o primeiro mês e deixa você entrar. Ela quer encerrar uma discussão antiga do Cercado: a alface vinga sob as lâmpadas e morre no canteiro a dez metros dali, mesmo clima, mesma água, mesma semente.',
      question: Q_ESTUFA,
      correctText: 'Ela bate na quina do canteiro. A terra veio de caminhão, de um sítio a quarenta quilômetros. E é por isso, ela diz, que o Cercado nunca passou da estufa.',
      wrongText: 'Ela corrige você sem constrangimento, porque quase todo mundo ali erra a mesma coisa.',
      hint: 'A luz, do sol ou de lâmpada, entra na fotossíntese como energia: a planta transforma gás carbônico e água em glicose e solta oxigênio. Só que ela também tira água e sais minerais do solo, e aí está o problema do canteiro de fora. Césio e estrôncio se parecem quimicamente com potássio e cálcio, e a raiz absorve os dois sem distinguir.',
      effectCorrect: { confianca: 8, racao: 5, lucidez: 15 },
      effectWrong: { confianca: -4 },
      next: 'desafio_raizes',
    },

    desafio_raizes: {
      id: 'desafio_raizes', kind: 'challenge', art: 'mancha', day: 4, chapter: 'CAPÍTULO 4', mood: 'bleak',
      icon: 'sprout', title: 'O Que a Mancha Faz',
      intro: 'Você volta ao terreno com Elias e Dona Neide. Arranca uma das plantas inteira, com raiz e tudo, e passa o contador nela: o aparelho dispara na planta arrancada. Depois você mede o chão de onde ela saiu, e ali o número é baixo.',
      question: Q_RAIZES,
      correctText: 'Você entende antes de conseguir explicar direito. A Mancha não está envenenando o terreno: está puxando o veneno de dentro dele pela raiz e guardando nas folhas. E o Cercado queima isso toda lua nova.',
      wrongText: 'Não é a sombra, e Dona Neide chega ao fim do raciocínio antes de você: se a planta arrancada mede alto e o chão mede baixo, a contaminação saiu do chão e está dentro dela. E eles queimam aquilo todo mês.',
      hint: 'A raiz absorve água e sais minerais dissolvidos, e sobe tudo pelo xilema até folhas e caule. O problema é que ela não distingue: césio se parece quimicamente com potássio e estrôncio com cálcio, então entram pelo mesmo caminho e ficam acumulados na planta. Usar planta para tirar contaminante do solo tem nome, fitorremediação, e girassol foi plantado em Chernobyl exatamente para isso. Só que colher e retirar a planta limpa o terreno. Queimar devolve tudo para o ar.',
      effectCorrect: { confianca: 12, lucidez: 40 },
      effectWrong: { confianca: -8 },
      next: 'escolha',
    },

    // ── A ESCOLHA ───────────────────────────────────────
    escolha: {
      id: 'escolha', kind: 'narrative', art: 'mancha', day: 5, chapter: 'A ESCOLHA', mood: 'bleak',
      icon: 'sprout', title: 'Lua Nova',
      text: 'A turma das tochas sai amanhã. Queimar devolve para o ar e para a cinza tudo o que aquelas plantas tiraram do chão, e o terreno recomeça do zero, de novo, como vem acontecendo a cada lua nova. Deixar viver é apostar numa limpeza que leva anos, e ninguém ali chegou perto de ver o fim disso. Você tem dezoito mil variedades de semente na mochila e uma noite para decidir.',
      choices: [
        { label: 'Queimar com eles, como manda o protocolo', effect: { confianca: 5 }, next: () => 'rota_queima' },
        { label: 'Semear girassol na borda e defender a Mancha', effect: { racao: -5 }, next: () => 'rota_semeia' },
      ],
    },

    rota_queima: {
      id: 'rota_queima', kind: 'router', art: 'settlement', day: 5, chapter: 'EPÍLOGO', mood: 'settle', title: '',
      next: (s) => {
        if (s.saude <= 22) return 'final_perdida';
        // quem não entendeu o que as folhas guardavam fica na fumaça
        if (s.lucidez < 70) return 'final_fumaca';
        return s.confianca >= 35 ? 'final_fogueira' : 'final_lobo';
      },
    },
    rota_semeia: {
      id: 'rota_semeia', kind: 'router', art: 'dawn', day: 5, chapter: 'EPÍLOGO', mood: 'hope', title: '',
      next: (s) => {
        if (s.saude <= 22) return 'final_perdida';
        if (s.lucidez >= 80 && s.confianca >= 50 && s.racao >= 25 && s.agua >= 25) return 'final_colheita';
        return s.confianca >= 30 ? 'final_lenta' : 'final_herege';
      },
    },

    // ── DESFECHOS ───────────────────────────────────────
    final_colheita: {
      id: 'final_colheita', kind: 'ending', art: 'dawn', day: 5, chapter: 'EPÍLOGO', mood: 'hope', icon: 'sprout',
      title: 'A Primeira Colheita',
      text: 'Você gastou três noites convencendo o Cercado a adiar uma única queimada. Levou dois anos para o girassol da borda virar rotina, e para a colheita da Mancha, cortada e levada para longe em vez de queimada, virar trabalho de todo mês. No terceiro inverno mediram o canteiro velho, e o número tinha caído o bastante para plantar direto na terra. A alface daquele ano foi a primeira que não veio de caminhão.',
    },
    final_lenta: {
      id: 'final_lenta', kind: 'ending', art: 'lone', day: 5, chapter: 'EPÍLOGO', mood: 'settle', icon: 'sprout',
      title: 'A Aposta Lenta',
      text: 'O Cercado não mudou de ideia, mas três pessoas foram com você. Semearam a borda leste e marcaram cada ponto num mapa de papel, com a data e o número do contador. Você não viu o terreno abrir. Quem veio depois viu, e ainda usa o seu mapa.',
    },
    final_herege: {
      id: 'final_herege', kind: 'ending', art: 'wasteland', day: 5, chapter: 'EPÍLOGO', mood: 'bleak', icon: 'nametag',
      title: 'Herege',
      text: 'Chamaram você de louca, e um deles cuspiu no chão quando você falou em não queimar. Saiu do Cercado com menos comida do que tinha ao chegar. Semeou a borda sozinha, sem plateia, e seguiu marcando os muros a giz: a data, o número do contador, uma seta. Daqui a uma década alguém vai ler as marcas e entender o que elas eram.',
    },
    final_fogueira: {
      id: 'final_fogueira', kind: 'ending', art: 'settlement', day: 5, chapter: 'EPÍLOGO', mood: 'settle', icon: 'ablaze',
      title: 'A Fogueira',
      text: 'Você entrou na fila com uma tocha e queimou junto. O Cercado te recebeu como uma dos seus e a comida daquela semana foi boa. Na primavera seguinte o canteiro de fora deu o mesmo palmo de folha amarela e travou no mesmo ponto. Ninguém ali achou aquilo estranho, e você não falou nada.',
    },
    final_lobo: {
      id: 'final_lobo', kind: 'ending', art: 'bleak', day: 5, chapter: 'EPÍLOGO', mood: 'bleak', icon: 'bread',
      title: 'Lobo Solitário',
      text: 'Você queimou o que mandaram queimar e mesmo assim não confiaram em você. Saiu antes do amanhecer, com pouca água e sem explicação para ninguém. Sobrevive, e por enquanto é só isso que dá para dizer.',
    },
    final_dose: {
      id: 'final_dose', kind: 'ending', art: 'toxic', day: 2, chapter: 'FIM', mood: 'danger', icon: 'gasmask',
      title: 'Dose Demais', morte: true,
      text: 'Um pano no rosto segura poeira, e o que havia naquele quarteirão não era só poeira. O enjoo começa antes de você sair da zona. À noite vem a febre, e depois o resto. Você atravessou correndo para poupar duas horas de caminhada, e a conta que o contador estava fazendo não era sobre pressa: era sobre quanto do estrago se soma.',
    },
    final_solanina: {
      id: 'final_solanina', kind: 'ending', art: 'station', day: 3, chapter: 'FIM', mood: 'dusk', icon: 'poison',
      title: 'O Verde da Batata', morte: true,
      text: 'A queimação virou vômito, o vômito virou desidratação, e nenhum dos dois tinha soro. Elias aguenta melhor porque comeu menos. Você não. A planta avisou com a cor, e o aviso estava do lado de fora da casca, onde dava para ver.',
    },
    final_sede: {
      id: 'final_sede', kind: 'ending', art: 'bleak', day: 3, chapter: 'FIM', mood: 'bleak', icon: 'flask',
      title: 'Sede', morte: true,
      text: 'Você andou o dia inteiro raspando casca atrás de umidade, e passou por dezenas de árvores carregadas de folha sem entender que cada uma delas estava soltando água no ar o tempo todo. No segundo dia a cabeça já não fecha uma conta simples. Um saco plástico e um galho custariam uma tarde de espera.',
    },
    final_fumaca: {
      id: 'final_fumaca', kind: 'ending', art: 'toxic', day: 5, chapter: 'FIM', mood: 'danger', icon: 'ablaze',
      title: 'O Que Subiu com a Fumaça', morte: true,
      text: 'Você entrou na fila com a tocha sem entender o que estava queimando. Anos de contaminação que aquelas plantas tinham puxado do solo voltaram ao ar em uma noite, e o Cercado inteiro respirou aquilo de perto. Os primeiros sintomas aparecem na semana seguinte, em você e em mais gente. Ninguém liga uma coisa à outra, porque ninguém ali sabia o que a Mancha guardava nas folhas.',
    },
    final_perdida: {
      id: 'final_perdida', kind: 'ending', art: 'bleak', day: 5, chapter: 'FIM', mood: 'bleak', icon: 'poison',
      title: 'Perdida nas Ruínas', morte: true,
      text: 'O corpo desiste antes da vontade. Em algum ponto entre o Cercado e o terreno tomado de mato, sua história para de ser contada por você. A mochila com dezoito mil sementes fica encostada num poste, ainda fechada, esperando alguém que saiba o que fazer com ela.',
    },
  };
}
