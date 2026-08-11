// ─────────────────────────────────────────────────────────
// CINZAS: O Último Abrigo
//
// Ficção interativa de sobrevivência. A protagonista é uma guardiã de
// sementes que sai do Abrigo 7 três dias depois da Queda, com a mochila
// cheia e um protocolo decorado: queimar qualquer crescimento perto da
// porta.
//
// O protocolo está errado, e a biologia é o que revela isso. A crosta
// preta-esverdeada que todos queimam (a Mancha) é um fungo que está
// retirando contaminação do solo. Os cinco desafios não são prova: são
// pistas em escalada, e a última entrega a virada. A escolha final vira
// queimar ou semear.
//
// Referências assumidas: a Selva Tóxica de "Nausicaä do Vale do Vento"
// (o que parece matar está purificando) e a ciência real da zona de
// Chernobyl (fungos que acumulam césio-137 e estrôncio-90; girassóis
// usados em fitorremediação porque césio e estrôncio imitam potássio e
// cálcio).
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
const Q_RADIACAO: Pergunta = {
  text: 'Você calcula quanto tempo pode ficar lá fora. O que pesa nessa conta?',
  options: [
    'O tempo somado lá fora, porque cada dose vai quebrando o DNA das células',
    'Só o que o aparelho marca agora: se não apitar forte, o dia inteiro é seguro',
  ],
  correct: 0,
};

const Q_AGUA: Pergunta = {
  text: 'Sobra pouco combustível. O que você faz com essa água?',
  options: [
    'Coar num pano limpo: se sair transparente, está boa',
    'Ferver por alguns minutos antes de encher os cantis',
  ],
  correct: 1,
};

const Q_IMUNIDADE: Pergunta = {
  text: 'O que você responde para ele?',
  options: [
    'Que não é ferida fechando: o inchaço é a defesa do corpo agindo, e a linha subindo é a infecção se espalhando',
    'Que ele tem razão, porque toda ferida esquenta enquanto cicatriza',
  ],
  correct: 0,
};

const Q_ESTUFA: Pergunta = {
  text: 'Ela pergunta o que você acha. Qual é a diferença entre os dois canteiros?',
  options: [
    'O plástico da estufa barra a radiação do céu, que é de onde vem a contaminação',
    'A luz dá a energia da fotossíntese, e a terra daqui dentro veio de fora, sem a contaminação do solo',
  ],
  correct: 1,
};

const Q_FUNGO: Pergunta = {
  text: 'Elias espera você dizer alguma coisa. O que está acontecendo naquela parede?',
  options: [
    'A crosta é um fungo, e fungo acumula no corpo o que está dissolvido em volta, inclusive material radioativo',
    'O fungo solta oxigênio, e isso dilui a radiação do ar em volta',
  ],
  correct: 0,
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
        { label: 'Sair agora, enquanto ainda há luz', effect: { agua: -5 }, next: () => 'desafio_radiacao' },
        { label: 'Esperar mais um dia e economizar energia', effect: { racao: -10, saude: 5 }, next: () => 'desafio_radiacao' },
      ],
    },

    desafio_radiacao: {
      id: 'desafio_radiacao', kind: 'challenge', art: 'bunker', day: 1, chapter: 'CAPÍTULO 1', mood: 'dawn',
      icon: 'ablaze', title: 'O Contador Geiger',
      intro: 'Antes de girar a trava da escotilha, você para diante do contador. O ponteiro treme baixo, e o treinamento volta inteiro: o perigo não é o barulho do aparelho num instante, é o que a dose faz por dentro ao longo dos dias.',
      question: Q_RADIACAO,
      correctText: 'Você anota a hora da saída no pulso, a caneta. Vai contar cada minuto lá fora.',
      wrongText: 'Você sai sem marcar a hora. Só à noite, deitada, vai lembrar que o treinamento falava em dose somada, não em susto de um dia.',
      hint: 'Radiação ionizante carrega energia suficiente para romper ligações químicas do DNA. A célula pode morrer, parar de se dividir ou se dividir errado, e o estrago se soma a cada exposição. Por isso quem trabalha com isso conta minutos, não sustos.',
      effectCorrect: { saude: 5, lucidez: 15 },
      effectWrong: { saude: -10 },
      next: 'ruinas',
    },

    // ── CAPÍTULO 2 ──────────────────────────────────────
    ruinas: {
      id: 'ruinas', kind: 'narrative', art: 'ruins', day: 2, chapter: 'CAPÍTULO 2', mood: 'ash',
      icon: 'busstop', title: 'As Ruínas',
      text: 'A cidade virou esqueleto de concreto. Você reconhece a padaria pela placa torta e não reconhece mais nada. Numa parede inteira de estacionamento cresce uma crosta preta e esverdeada, do tipo que o protocolo manda queimar. Você passa longe. O contador, que apitava firme na rua, fica mais quieto perto dela. Você anota e não pensa mais nisso.',
      choices: [
        { label: 'Entrar no hospital atrás de remédios', effect: { saude: 15, agua: -10 }, next: () => 'desafio_agua' },
        { label: 'Cortar pela zona industrial até o mercado', effect: { racao: 15 }, next: () => 'perigo' },
      ],
    },

    perigo: {
      id: 'perigo', kind: 'narrative', art: 'toxic', day: 2, chapter: 'CAPÍTULO 2', mood: 'danger',
      icon: 'gasmask', title: 'Zona Industrial',
      text: 'A poeira esverdeada só aparece contra a luz, e quando você percebe já está respirando. Não é a Mancha: é pó de concreto misturado com o que sobrou do incêndio dos galpões. O contador dispara aqui, e não há parede coberta de crosta em lugar nenhum deste quarteirão.',
      choices: [
        { label: 'Amarrar o pano no rosto e atravessar correndo', effect: { saude: -22, agua: -10 }, next: () => 'rota_travessia' },
        { label: 'Voltar e fazer o contorno, mais longo e mais seguro', effect: { racao: -15, agua: -5 }, next: () => 'desafio_agua' },
      ],
    },

    rota_travessia: {
      id: 'rota_travessia', kind: 'router', art: 'toxic', day: 2, chapter: 'CAPÍTULO 2', mood: 'danger', title: '',
      next: (s) => (s.saude <= 22 ? 'final_dose' : 'desafio_agua'),
    },
    rota_agua: {
      id: 'rota_agua', kind: 'router', art: 'cistern', day: 3, chapter: 'CAPÍTULO 3', mood: 'ash', title: '',
      next: (s) => (s.saude <= 22 ? 'final_disenteria' : 'encontro'),
    },

    desafio_agua: {
      id: 'desafio_agua', kind: 'challenge', art: 'cistern', day: 2, chapter: 'CAPÍTULO 2', mood: 'ash',
      icon: 'flask', title: 'A Cisterna',
      intro: 'A caixa d’água do prédio ficou de pé e ainda tem quase um palmo de água no fundo, turva e parada há três dias. Você está com sede o bastante para considerar beber assim.',
      question: Q_AGUA,
      correctText: 'Você junta madeira e ferve. Custa combustível que não estava sobrando, e é a escolha certa.',
      wrongText: 'Você enche os cantis do jeito que estão. Passa a noite esperando para ver no que dá, e não dorme direito.',
      hint: 'Ferver mata bactérias, vírus e protozoários, que é o risco imediato de uma água parada há dias. Coar tira a sujeira visível e não tira micro-organismo nenhum. E fervura não resolve o resto: contaminação química e radioativa continua ali depois.',
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
        { label: 'Oferecer parte das provisões em troca de conversa', effect: { racao: -10, confianca: 25 }, next: () => 'desafio_imunidade' },
        { label: 'Manter distância e seguir sozinha', effect: { confianca: -10 }, next: (s) => s.confianca < 10 ? 'final_lobo' : 'desafio_imunidade' },
      ],
    },

    desafio_imunidade: {
      id: 'desafio_imunidade', kind: 'challenge', art: 'station', day: 3, chapter: 'CAPÍTULO 3', mood: 'dusk',
      icon: 'bandage', title: 'O Braço de Elias',
      intro: 'Ele deixa você trocar o pano. Por baixo, a pele em volta do corte está quente ao toque, e o vermelho avança numa linha fina em direção ao cotovelo. Elias diz que é só a ferida fechando.',
      question: Q_IMUNIDADE,
      correctText: 'Ele para de brincar. Você lava com água fervida, amarra frouxo e diz que ele precisa de antibiótico em dias, não em semanas. Depois ele fica quieto um tempo e pergunta: se o corpo cerca o que envenena ele, por que o mundo não faria igual?',
      wrongText: 'Ele aceita a explicação e agradece. Mais tarde, sozinha, você repara que a linha vermelha subiu mais um dedo desde a manhã.',
      hint: 'Pele rompida deixa de ser barreira e bactéria entra. O corpo manda sangue e células de defesa para o local, e é isso que produz calor, vermelhidão e inchaço. A linha vermelha subindo pelo braço é sinal de que a infecção saiu do ponto do corte e está seguindo pelos vasos.',
      effectCorrect: { confianca: 10, saude: 3, lucidez: 15 },
      effectWrong: { confianca: -8 },
      next: 'mancha',
    },

    mancha: {
      id: 'mancha', kind: 'narrative', art: 'mancha', day: 3, chapter: 'CAPÍTULO 3', mood: 'bleak',
      icon: 'poison', title: 'A Mancha',
      text: 'Elias dorme mal e acorda antes do sol firmar. Leva você dois quarteirões e para diante de um muro tomado pela crosta, que de perto tem fios finos e cheiro de terra molhada. Ele diz que passou três semanas dormindo a vinte metros dali. Você olha o braço dele, uma infecção comum de quem se corta em metal enferrujado, e nenhum dos sinais que a radiação deixa. Então ele estende o contador na direção do muro, e o ponteiro cai.',
      choices: [
        { label: 'Raspar uma amostra da crosta e guardar', effect: { confianca: 5 }, next: () => 'assentamento' },
        { label: 'Anotar tudo no caderno e seguir para as luzes', next: () => 'assentamento' },
      ],
    },

    // ── CAPÍTULO 4 ──────────────────────────────────────
    assentamento: {
      id: 'assentamento', kind: 'narrative', art: 'settlement', day: 4, chapter: 'CAPÍTULO 4', mood: 'settle',
      icon: 'windmill', title: 'O Cercado',
      text: 'O Cercado é uma muralha de chapas com fumaça saindo por cima. Dentro, sob plástico translúcido e lâmpadas puxadas de um moinho, fileiras de alface. Do lado de fora, o canteiro que eles abriram direto na terra deu um palmo de folha amarela e travou. Toda lua nova eles saem em turma, com tochas, e queimam a Mancha que chegou perto do muro.',
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
      next: 'desafio_fungo',
    },

    desafio_fungo: {
      id: 'desafio_fungo', kind: 'challenge', art: 'mancha', day: 4, chapter: 'CAPÍTULO 4', mood: 'bleak',
      icon: 'poison', title: 'O Que a Mancha Faz',
      intro: 'Você volta ao muro com Elias e Dona Neide. Raspa a crosta com a faca, encosta o contador na parede descoberta e depois afasta dois passos. O número sobe quando você se afasta da Mancha.',
      question: Q_FUNGO,
      correctText: 'Você entende antes de conseguir explicar direito. A Mancha não está envenenando o terreno: está puxando o veneno de dentro dele e prendendo em si mesma. E o Cercado queima isso toda lua nova.',
      wrongText: 'Não é bem assim, e Dona Neide chega ao fim do raciocínio antes de você. A conta que sobra é pior: alguma coisa naquela parede está tirando contaminação de onde ela estava, e eles queimam aquilo todo mês.',
      hint: 'Fungos decompositores absorvem o que está dissolvido no substrato e acumulam no próprio corpo. Na zona de Chernobyl, espécies coletadas concentraram césio-137 e estrôncio-90 em níveis até mil vezes maiores que o ambiente em volta, e algumas usam melanina para lidar com a radiação, mais ou menos como a clorofila lida com a luz. Tirar o contaminante do solo e prender num organismo tem nome: biorremediação. Queimar devolve tudo para o ar.',
      effectCorrect: { confianca: 12, lucidez: 40 },
      effectWrong: { confianca: -8 },
      next: 'escolha',
    },

    // ── A ESCOLHA ───────────────────────────────────────
    escolha: {
      id: 'escolha', kind: 'narrative', art: 'mancha', day: 5, chapter: 'A ESCOLHA', mood: 'bleak',
      icon: 'sprout', title: 'Lua Nova',
      text: 'A turma das tochas sai amanhã. Queimar a crosta devolve para o ar e para a cinza tudo o que ela recolheu, e o terreno recomeça do zero, de novo, como vem acontecendo a cada lua nova. Deixar viver é apostar numa limpeza que leva anos, e ninguém ali chegou perto de ver o fim disso. Você tem dezoito mil variedades de semente na mochila e uma noite para decidir.',
      choices: [
        { label: 'Queimar com eles, como manda o protocolo', effect: { confianca: 5 }, next: () => 'rota_queima' },
        { label: 'Semear girassol na borda e defender a Mancha', effect: { racao: -5 }, next: () => 'rota_semeia' },
      ],
    },

    rota_queima: {
      id: 'rota_queima', kind: 'router', art: 'settlement', day: 5, chapter: 'EPÍLOGO', mood: 'settle', title: '',
      next: (s) => {
        if (s.saude <= 22) return 'final_perdida';
        // quem não entendeu o que a crosta guardava fica na fumaça
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
      text: 'Você gastou três noites convencendo o Cercado a adiar uma única queimada. Levou dois anos para o girassol da borda virar rotina e para a crosta avançar sem que ninguém corresse atrás de tocha. No terceiro inverno mediram o canteiro velho, e o número tinha caído o bastante para plantar direto na terra. A alface daquele ano foi a primeira que não veio de caminhão.',
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
    final_disenteria: {
      id: 'final_disenteria', kind: 'ending', art: 'bleak', day: 3, chapter: 'FIM', mood: 'bleak', icon: 'flask',
      title: 'A Água da Caixa', morte: true,
      text: 'A água estava limpa aos olhos e nenhum olho enxerga bactéria. A cólica chega de madrugada, e o resto vem rápido demais para uma pessoa sozinha, sem soro e sem ninguém para buscar ajuda. Ferver custaria um galho de madeira e vinte minutos.',
    },
    final_fumaca: {
      id: 'final_fumaca', kind: 'ending', art: 'toxic', day: 5, chapter: 'FIM', mood: 'danger', icon: 'ablaze',
      title: 'O Que Subiu com a Fumaça', morte: true,
      text: 'Você entrou na fila com a tocha sem entender o que estava queimando. Anos de contaminação que a crosta tinha puxado do solo voltaram ao ar em uma noite, e o Cercado inteiro respirou aquilo de perto. Os primeiros sintomas aparecem na semana seguinte, em você e em mais gente. Ninguém liga uma coisa à outra, porque ninguém ali sabia o que a Mancha guardava.',
    },
    final_perdida: {
      id: 'final_perdida', kind: 'ending', art: 'bleak', day: 5, chapter: 'FIM', mood: 'bleak', icon: 'poison',
      title: 'Perdida nas Ruínas', morte: true,
      text: 'O corpo desiste antes da vontade. Em algum ponto entre o Cercado e o muro tomado de crosta, sua história para de ser contada por você. A mochila com dezoito mil sementes fica encostada num poste, ainda fechada, esperando alguém que saiba o que fazer com ela.',
    },
  };
}
