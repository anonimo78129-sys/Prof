// ─────────────────────────────────────────────────────────
// A FONTE — ÁGUA QUE SOBE, ÁGUA QUE VOLTA
//
// A fonte que enche os poços de três povoados baixou até virar um fio.
// Iara, a aguadeira, subiu a serra atrás da nascente e não voltou. Para
// chegar lá em cima é preciso passar pelas três passagens da Ordem da
// Fonte, e as Sentinelas da Ordem só abrem caminho para quem entende a
// água — cada uma faz uma pergunta antes de baixar o arco.
//
// A virada: a nascente não secou porque a água acabou. A encosta foi
// derrubada para vender lenha, e sem raiz a chuva escorre em vez de
// entrar no chão. A água continua subindo e voltando; o que sumiu foi o
// caminho de volta. Iara ficou presa porque ia contar isso.
//
// SOBRE O CONTEÚDO
// Nove desafios, três por estação, todos em cima de uma coisa que dá
// para ver acontecer: roupa no varal, tampa de panela pingando, copo
// suando, neblina de manhã, gelo boiando, cano estourado no frio. O
// nome técnico entra depois, batizando o que o aluno já entendeu — é a
// mesma regra dos outros jogos do app.
//
// Este arquivo é só conteúdo e mapa. Quem desenha é
// components/Shell/Bosque.tsx, quem recorta as folhas é bosqueArte.ts.
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

export interface Desafio {
  id: string;
  /** o que a Sentinela conta antes de perguntar */
  fala: Fala[];
  pergunta: string;
  escolhas: Escolha[];
  /** o que ela passa a dizer depois de resolvido */
  depois: string;
}

// ── os nove desafios ─────────────────────────────────────

export const DESAFIOS: Record<string, Desafio> = {
  varal: {
    id: 'varal',
    fala: [
      { quem: 'BRUNA', texto: 'Para aí. Passagem da Fonte. Ninguém sobe sem responder.' },
      {
        quem: 'BRUNA',
        texto:
          'Hoje de manhã eu estendi duas camisas iguais, torcidas do mesmo jeito, na mesma hora. ' +
          'Uma no sol, outra na sombra do galpão.',
      },
      {
        quem: 'BRUNA',
        texto:
          'A do sol já está seca e dobrada. A da sombra ainda pinga no chão. ' +
          'Mesmo pano, mesma água, mesmo vento passando nas duas.',
      },
    ],
    pergunta: 'Por que a camisa do sol secou primeiro?',
    escolhas: [
      {
        label: 'O sol queima a água que está no pano',
        certa: false,
        resultado:
          'Você tira a camisa do varal e procura marca de queimado. Não tem: o algodão está ' +
          'inteiro, macio, só que seco. Se o sol tivesse queimado a água, teria comido o pano junto.\n\n' +
          'Bruna não baixa o arco. "Água não some. Água muda de lugar. Pensa de novo."',
      },
      {
        label: 'O calor faz a água do pano virar vapor mais depressa',
        certa: true,
        resultado:
          'Bruna baixa o arco e aponta o varal com o queixo.\n\n' +
          'A água do pano não sumiu: ela saiu de gota e virou vapor, que é água em pedaço tão ' +
          'pequeno que o ar carrega sem a gente ver. Isso acontece o tempo todo, na sombra ' +
          'também — só que quanto mais quente, mais depressa. O sol não gastou a água, apressou a saída.\n\n' +
          'Esse jeito de sair, aos poucos e sem ferver, tem nome: EVAPORAÇÃO.',
      },
      {
        label: 'A sombra é mais pesada e prende a água no tecido',
        certa: false,
        resultado:
          'Você põe a mão na camisa da sombra. Está fria e molhada, não pesada. Sombra é falta ' +
          'de luz, não uma coisa que encosta no pano e segura alguma coisa.\n\n' +
          'Bruna: "Sombra não faz força. O que muda ali é o calor."',
      },
    ],
    depois: 'Sobe. E olha o varal quando passar: aquilo ali é a serra inteira em miniatura.',
  },

  caldeirao: {
    id: 'caldeirao',
    fala: [
      { quem: 'BRUNA', texto: 'Segunda. Essa é da cozinha, e quase ninguém acerta de primeira.' },
      {
        quem: 'BRUNA',
        texto:
          'Ponho água no caldeirão, tampo e deixo no fogo. Quando levanto a tampa, ela está ' +
          'molhada por baixo, com gota grossa escorrendo para a borda.',
      },
      {
        quem: 'BRUNA',
        texto: 'A tampa estava seca quando eu pus. Sequinha, acabei de enxugar.',
      },
    ],
    pergunta: 'De onde veio a água que está pendurada na tampa?',
    escolhas: [
      {
        label: 'A água do caldeirão respingou até lá em cima',
        certa: false,
        resultado:
          'Você tampa de novo, sem deixar ferver, e levanta antes de borbulhar. A tampa está ' +
          'molhada do mesmo jeito, e nem chegou a haver respingo.\n\n' +
          'Bruna: "Respingo faz pinta espalhada. Isso aí é a tampa inteira suando por igual."',
      },
      {
        label: 'É o vapor que subiu, encostou na tampa fria e virou gota',
        certa: true,
        resultado:
          'Bruna deixa você tocar a tampa por cima: gelada. Por baixo, quente e escorrendo.\n\n' +
          'A água virou vapor no fundo do caldeirão e subiu. Lá em cima encontrou a tampa fria, ' +
          'perdeu calor e voltou a se juntar em gota. É o caminho do varal ao contrário: no ' +
          'varal a água esquentou e abriu; na tampa ela esfriou e fechou.\n\n' +
          'A volta tem nome: CONDENSAÇÃO. Toda gota de chuva já foi vapor, e voltou por esfriar.',
      },
      {
        label: 'O fogo faz a tampa soltar água que estava dentro do metal',
        certa: false,
        resultado:
          'Você raspa a tampa com a faca. Metal seco, sem poro, sem nada guardado dentro. ' +
          'E se fosse do metal, a tampa acabaria — dá para repetir isso a semana inteira.\n\n' +
          'Bruna: "A tampa é sempre a mesma. Quem entra e sai ali é a água do caldeirão."',
      },
    ],
    depois: 'Panela tampada é nuvem pequena. Guarda isso para quando você chegar lá em cima.',
  },

  poca: {
    id: 'poca',
    fala: [
      { quem: 'BRUNA', texto: 'Última minha. Depois daqui é a Nita que atende.' },
      {
        quem: 'BRUNA',
        texto:
          'Choveu anteontem e ficou uma poça funda no meio do caminho, dessas que molham o ' +
          'joelho. Ontem estava rasa. Hoje é uma mancha escura na terra.',
      },
      { quem: 'BRUNA', texto: 'Ninguém tirou, ninguém bebeu, e o chão embaixo dela é pedra: não infiltrou.' },
    ],
    pergunta: 'Onde está a água daquela poça agora?',
    escolhas: [
      {
        label: 'Acabou — água exposta ao sol se gasta',
        certa: false,
        resultado:
          'Bruna ri sem simpatia. "Se a água se gastasse, o mundo já teria acabado a água. ' +
          'Chove há quanto tempo? E o mar continua lá."\n\n' +
          'O arco não abaixa. Água não se gasta: ela troca de forma e de endereço.',
      },
      {
        label: 'Está no ar em volta, em vapor, misturada com o resto',
        certa: true,
        resultado:
          'Bruna finalmente sorri.\n\n' +
          'A poça não acabou: ela se espalhou. Cada pedacinho de água virou vapor e entrou no ' +
          'ar que você está respirando agora. Não dá para ver porque vapor é transparente — o ' +
          'que a gente vê e chama de "vapor" na chaleira já é a água voltando a ser gota.\n\n' +
          'E ela não fica parada. O ar sobe, esfria lá em cima, a água se junta de novo em ' +
          'gotinha e forma nuvem. Aquela poça vai virar chuva em algum lugar.',
      },
    ],
    depois: 'Passa. E lembra: o que sobe daqui cai em outro canto. Ninguém perde água sozinho.',
  },

  neblina: {
    id: 'neblina',
    fala: [
      { quem: 'NITA', texto: 'A Bruna te mandou. Então você já sabe subir e descer. Vamos ver se sabe olhar.' },
      {
        quem: 'NITA',
        texto:
          'Toda manhã, antes do sol, o rio lá embaixo aparece coberto de branco. Parece fumaça ' +
          'saindo da água. Às oito some, e o rio fica limpo o dia inteiro.',
      },
      { quem: 'NITA', texto: 'Ninguém acende fogo ali. E o branco só aparece quando a noite foi fria.' },
    ],
    pergunta: 'O que é esse branco em cima do rio de manhã?',
    escolhas: [
      {
        label: 'Fumaça: alguma coisa está queimando embaixo da água',
        certa: false,
        resultado:
          'Você desce até a margem e enfia a mão no branco. Sai molhada, fria, sem cheiro. ' +
          'Fumaça deixa cheiro e deixa fuligem no dedo.\n\n' +
          'Nita: "Molhou, né? Então não é fumaça. É a própria água."',
      },
      {
        label: 'Gotinha de água boiando: o ar esfriou de noite e não segurou mais o vapor',
        certa: true,
        resultado:
          'Nita afrouxa a corda do arco.\n\n' +
          'O rio evapora o dia inteiro, e o ar quente segura esse vapor sem aparecer. À noite o ' +
          'ar esfria, e ar frio segura menos vapor que ar quente — o que sobra tem que virar ' +
          'gota. Gota pequena demais para cair fica boiando, e é isso que você vê de branco.\n\n' +
          'Neblina é nuvem que se formou rente ao chão. Quando o sol esquenta o ar, ele volta a ' +
          'segurar aquilo tudo em vapor invisível, e a neblina "some" sem ir a lugar nenhum.',
      },
      {
        label: 'É o rio esquentando e soltando bolha de ar',
        certa: false,
        resultado:
          'Você põe a mão no rio: gelado. E o branco aparece justamente nas manhãs mais frias, ' +
          'nunca nas mornas. Se fosse calor do rio, seria o contrário.\n\n' +
          'Nita: "Errou o lado. Quem esfriou não foi a água. Foi o ar."',
      },
    ],
    depois: 'Ar quente segura vapor. Ar frio devolve. É só isso, e explica metade do céu.',
  },

  copo: {
    id: 'copo',
    fala: [
      { quem: 'NITA', texto: 'Essa aqui é a mesma pergunta com outra roupa. Cuidado para não tropeçar.' },
      {
        quem: 'NITA',
        texto:
          'Tiro um copo do poço fundo, bem gelado, e ponho na mesa num dia de calor. Em pouco ' +
          'tempo o copo está molhado por fora, e a mesa embaixo dele com uma roda de água.',
      },
      { quem: 'NITA', texto: 'O copo é de barro vidrado, sem trinca. Enche de água e não vaza nunca.' },
    ],
    pergunta: 'De onde vem a água que molha o copo por fora?',
    escolhas: [
      {
        label: 'Passa de dentro para fora, devagarinho, pela parede do copo',
        certa: false,
        resultado:
          'Nita esvazia o copo, seca por dentro e por fora e enche de pedra de gelo, sem uma ' +
          'gota de água solta. Em pouco tempo está pingando do lado de fora igual.\n\n' +
          '"Dentro não tinha água líquida nenhuma para atravessar. E mesmo assim molhou."',
      },
      {
        label: 'É o vapor do ar quente que encosta no copo gelado e vira gota',
        certa: true,
        resultado:
          'Nita baixa o arco.\n\n' +
          'O ar de um dia quente está cheio de vapor de água que você não vê. Quando esse ar ' +
          'encosta no vidro gelado, ele esfria ali na hora, deixa de segurar o vapor, e a água ' +
          'se junta em gota do lado de fora. É condensação — a mesma da tampa do caldeirão.\n\n' +
          'Repara que é sempre igual: para virar gota, alguma coisa precisa ESFRIAR. Tampa ' +
          'fria, noite fria, copo frio. O frio não cria a água; ele só obriga o ar a devolver a ' +
          'que já estava carregando.',
      },
    ],
    depois: 'Copo suado é a mesma neblina, do tamanho de uma mão. Segue.',
  },

  chuva: {
    id: 'chuva',
    fala: [
      { quem: 'NITA', texto: 'Última pergunta antes da neve. Essa é de mapa, não de cozinha.' },
      {
        quem: 'NITA',
        texto:
          'Aqui nesta encosta não tem rio, não tem lago, não tem poço. É pedra e mato. ' +
          'Mesmo assim chove, e chove muito.',
      },
      { quem: 'NITA', texto: 'A chuva que cai aqui tem que ter vindo de algum lugar. Ela não nasce na nuvem.' },
    ],
    pergunta: 'De onde saiu a água que cai de chuva aqui em cima?',
    escolhas: [
      {
        label: 'A nuvem fabrica água a partir do ar',
        certa: false,
        resultado:
          'Nita aponta o céu limpo do outro lado da serra. "Aquele ar ali é o mesmo ar. Por que ' +
          'não está fabricando nada?"\n\n' +
          'Nuvem não é fábrica. Nuvem é depósito: só devolve o que alguém entregou.',
      },
      {
        label: 'Evaporou de rio, de mar, de terra molhada, e o vento trouxe até aqui',
        certa: true,
        resultado:
          'Nita sai da frente da passagem.\n\n' +
          'A água que cai aqui evaporou longe daqui — do mar, dos rios lá embaixo, da terra ' +
          'molhada, das folhas de mata inteira. Virou vapor, subiu, o vento empurrou. Ao subir, ' +
          'o ar esfria; esfriando, o vapor vira gotinha e a nuvem aparece. Quando as gotinhas ' +
          'se juntam e ficam pesadas demais para boiar, caem.\n\n' +
          'É sempre a mesma água, dando volta: SOBE evaporando, ATRAVESSA no vento, VOLTA ' +
          'chovendo. Chamam de ciclo da água, e ele não tem começo nem fim — tem só rodada.',
      },
      {
        label: 'Vem de dentro da montanha, empurrada para cima',
        certa: false,
        resultado:
          'Você olha para o alto. A chuva cai de cima, das nuvens, e molha o topo antes do pé ' +
          'da serra. Água que viesse de dentro da pedra brotaria embaixo e desceria.\n\n' +
          'Nita: "Você inverteu o caminho. Repara de que lado ela chega."',
      },
    ],
    depois: 'Sobe logo, que lá em cima está nevando e a Vilma não gosta de esperar.',
  },

  gelo: {
    id: 'gelo',
    fala: [
      { quem: 'VILMA', texto: 'Terceira passagem. Aqui a água fica dura e as pessoas erram feio.' },
      {
        quem: 'VILMA',
        texto:
          'O açude congelou por cima. A placa de gelo está boiando: dá para ver a água escura ' +
          'correndo por baixo dela.',
      },
      {
        quem: 'VILMA',
        texto:
          'Quase tudo que a gente congela ou esfria fica mais apertado, mais denso, e afunda. ' +
          'O gelo faz o contrário: sobe e fica.',
      },
    ],
    pergunta: 'Por que o gelo boia na própria água?',
    escolhas: [
      {
        label: 'Porque gelo é mais leve: congelar tira peso da água',
        certa: false,
        resultado:
          'Vilma põe um balde na balança, marca o peso, deixa congelar a noite inteira e pesa ' +
          'de novo. Mesmo número.\n\n' +
          '"Não saiu nem entrou nada. O peso é o mesmo. Então o que mudou não foi o peso."',
      },
      {
        label: 'Porque ao congelar a mesma água passa a ocupar mais espaço',
        certa: true,
        resultado:
          'Vilma mostra o balde: o gelo subiu acima da borda, num calombo.\n\n' +
          'A água tem o mesmo peso antes e depois — o que mudou foi o TAMANHO. Ao congelar, as ' +
          'partículas de água se arrumam num desenho aberto, com vão no meio, e o conjunto ' +
          'incha. Mesmo peso espalhado em mais espaço: é isso que faz boiar.\n\n' +
          'Quase nenhuma substância faz isso, e essa esquisitice segura a vida: o gelo fica em ' +
          'cima como uma tampa, e por baixo o açude continua líquido, com bicho vivo dentro. ' +
          'Se o gelo afundasse, o açude congelaria do fundo para cima e não sobraria nada.',
      },
    ],
    depois: 'A água é esquisita, e é por ser esquisita que tem peixe vivo aí embaixo. Passa.',
  },

  cano: {
    id: 'cano',
    fala: [
      { quem: 'VILMA', texto: 'Essa é a mesma coisa que a de trás, cobrando a conta.' },
      {
        quem: 'VILMA',
        texto:
          'A bica de barro do posto rachou na noite mais fria do ano. Estava cheia de água e ' +
          'fechada nas duas pontas. De manhã estava partida ao meio.',
      },
      { quem: 'VILMA', texto: 'Ninguém encostou nela. Nenhuma pedra caiu. E o barro é grosso.' },
    ],
    pergunta: 'O que partiu a bica?',
    escolhas: [
      {
        label: 'O frio encolheu o barro até ele trincar',
        certa: false,
        resultado:
          'Vilma aponta a bica vazia do outro lado do caminho, na mesma noite, mesmo frio, ' +
          'mesmo barro. Inteira.\n\n' +
          '"A diferença entre as duas não é o barro. É o que tinha dentro."',
      },
      {
        label: 'A água de dentro congelou, cresceu e empurrou a parede de fora',
        certa: true,
        resultado:
          'Vilma junta os dois pedaços: quebraram de dentro para fora, com a borda estourada.\n\n' +
          'É a mesma coisa do açude, agora sem para onde ir. A água congelou, ocupou mais ' +
          'espaço, e como a bica estava cheia e fechada, o único jeito de arrumar lugar era ' +
          'rachar o barro. Água virando gelo empurra com força de arrebentar pedra — é assim ' +
          'que a serra vira pedrisco com o tempo.\n\n' +
          'Por isso quem mora no frio esvazia o cano antes da geada.',
      },
    ],
    depois: 'Guarda: água que congela empurra. Isso já derrubou mais parede que gente brava.',
  },

  neve: {
    id: 'neve',
    fala: [
      { quem: 'VILMA', texto: 'Última. Depois desta você entra na gruta, e o que tem lá não é pergunta minha.' },
      {
        quem: 'VILMA',
        texto:
          'A neve encostada na pedra do topo vai diminuindo dia após dia. Faz semanas que não ' +
          'passa dos zero grau: nunca derrete, nunca vira água.',
      },
      { quem: 'VILMA', texto: 'E embaixo dela a pedra está seca. Nunca escorreu nada.' },
    ],
    pergunta: 'Para onde está indo essa neve?',
    escolhas: [
      {
        label: 'O vento carrega em pó para o outro lado da serra',
        certa: false,
        resultado:
          'Vilma leva você ao lado abrigado da pedra, onde o vento não bate. A neve dali também ' +
          'está diminuindo, no mesmo ritmo.\n\n' +
          '"Sem vento e some igual. Não é o vento."',
      },
      {
        label: 'Está virando vapor direto, sem passar por água',
        certa: true,
        resultado:
          'Vilma baixa o arco pela última vez.\n\n' +
          'Não precisa derreter para sair. Do mesmo jeito que a poça solta vapor sem ferver, o ' +
          'gelo solta vapor sem virar água antes: pula a fase líquida e vai direto de sólido ' +
          'para gás. Devagar, mas sem parar.\n\n' +
          'Chama-se SUBLIMAÇÃO, e é por isso que roupa estendida em dia de geada seca dura, ' +
          'congelada, sem nunca pingar. A água sai do mesmo jeito — só que como vapor.',
      },
      {
        label: 'A pedra está bebendo a neve por baixo',
        certa: false,
        resultado:
          'Você passa a mão na pedra embaixo da neve. Seca e fria. Pedra de topo de serra é ' +
          'maciça: se ela bebesse, estaria escura de molhada.\n\n' +
          'Vilma: "Nada entrou na pedra. A água saiu por cima."',
      },
    ],
    depois: 'A gruta é ali. Vai, e traz a Iara de volta.',
  },
};

/** ordem em que os desafios aparecem, para a barra de progresso */
export const ORDEM = Object.keys(DESAFIOS);

// ── geometria das fases ──────────────────────────────────
//
// O mundo é medido em casas de 16 pixels, com 14 casas de altura. O
// chão principal fica na casa 10, e é aí que vale a regra do
// platformer: buraco entre dois blocos é buraco de verdade, e plataforma
// solta a três casas de altura é sempre alcançável com um pulo, porque o
// pulo do boneco sobe pouco mais que três casas.
//
// Um bloco é sólido inteiro e desenhado com recorte de nove pedaços
// (canto, beirada, miolo) tirado da folha de piso — por isso a altura
// mínima é 2.

export interface Bloco {
  x: number; y: number;
  /** largura e altura em casas */
  l: number; a: number;
}

/** enfeite parado: `peca` é uma chave da tabela de recortes em bosqueArte */
export interface Adorno {
  x: number;
  /** casa em que o PÉ do enfeite encosta */
  y: number;
  peca: string;
  /** desenhado antes do chão, para árvore grande não tapar o caminho */
  fundo?: boolean;
  /** espelhado na horizontal, para a mesma árvore não se repetir igual */
  vira?: boolean;
}

export interface PostoSentinela {
  id: string;
  x: number; y: number;
  /** qual folha de arqueiro: '' é a branca original */
  cor: string;
  desafio: string;
}

export type Estacao = 'verao' | 'outono' | 'inverno';

export interface Fase {
  id: Estacao;
  nome: string;
  /** o que aparece na faixa de abertura */
  abertura: string;
  largura: number;
  blocos: Bloco[];
  adornos: Adorno[];
  /** posição das moedas, em casas */
  moedas: [number, number][];
  sentinelas: PostoSentinela[];
  /** fogueiras: enfeite e ponto de retorno quando o jogador cai */
  fogueiras: [number, number][];
  portal: { x: number; y: number };
  inicio: { x: number; y: number };
  /** onde a Iara está amarrada; só a última fase tem */
  refem?: { x: number; y: number };
}

// ── fase 1: bosque verde ────────────────────────────────

const VERAO: Fase = {
  id: 'verao',
  nome: 'BOSQUE VERDE',
  abertura:
    'A trilha do povoado sobe pelo bosque. Faz calor, e o caminho está marcado por poças que ' +
    'diminuem a olhos vistos.',
  largura: 182,
  inicio: { x: 3, y: 9 },
  blocos: [
    { x: -2, y: 10, l: 28, a: 4 },
    { x: 30, y: 10, l: 22, a: 4 },
    { x: 38, y: 7, l: 6, a: 2 },
    { x: 56, y: 10, l: 18, a: 4 },
    { x: 61, y: 7, l: 5, a: 2 },
    { x: 68, y: 5, l: 4, a: 2 },
    { x: 78, y: 9, l: 12, a: 5 },
    { x: 90, y: 10, l: 24, a: 4 },
    { x: 96, y: 7, l: 5, a: 2 },
    { x: 104, y: 5, l: 5, a: 2 },
    { x: 118, y: 10, l: 26, a: 4 },
    { x: 124, y: 7, l: 4, a: 2 },
    { x: 132, y: 6, l: 4, a: 2 },
    { x: 140, y: 8, l: 6, a: 6 },
    { x: 148, y: 10, l: 36, a: 4 },
  ],
  fogueiras: [[46, 10], [110, 10], [166, 10]],
  sentinelas: [
    { id: 'bruna1', x: 22, y: 10, cor: 'verde', desafio: 'varal' },
    { id: 'bruna2', x: 86, y: 9, cor: 'verde', desafio: 'caldeirao' },
    { id: 'bruna3', x: 140, y: 8, cor: 'verde', desafio: 'poca' },
  ],
  moedas: [
    [12, 9], [13, 9], [14, 9],
    [39, 6], [41, 6], [43, 6],
    [53, 8], [54, 7], [55, 7],
    [62, 6], [64, 6], [69, 4], [70, 4],
    [97, 6], [99, 6], [105, 4], [106, 4], [107, 4],
    [115, 8], [116, 7], [117, 7],
    [125, 6], [126, 6], [133, 5], [134, 5],
    [158, 9], [159, 9], [172, 9], [173, 9],
  ],
  adornos: [
    { x: -1, y: 10, peca: 'pinheiroG', fundo: true },
    { x: 6, y: 10, peca: 'arvoreH', fundo: true },
    { x: 4, y: 10, peca: 'moitaVerde' },
    { x: 9, y: 10, peca: 'capim' },
    { x: 11, y: 10, peca: 'tendaG' },
    { x: 16, y: 10, peca: 'varal' },
    { x: 15, y: 10, peca: 'caixote' },
    { x: 19, y: 10, peca: 'barril' },
    { x: 13, y: 10, peca: 'feira' },
    { x: 20, y: 10, peca: 'tamborete' },
    { x: 24, y: 10, peca: 'toco', fundo: true },
    { x: 31, y: 10, peca: 'betula1', fundo: true },
    { x: 34, y: 10, peca: 'pedraVerde' },
    { x: 45, y: 10, peca: 'panela' },
    { x: 48, y: 10, peca: 'lenha' },
    { x: 50, y: 10, peca: 'moitaVerde' },
    { x: 57, y: 10, peca: 'arvoreH', fundo: true },
    { x: 66, y: 10, peca: 'capim' },
    { x: 71, y: 10, peca: 'florida', fundo: true, vira: true },
    { x: 79, y: 9, peca: 'mesa' },
    { x: 82, y: 9, peca: 'maca' },
    { x: 84, y: 9, peca: 'cesto' },
    { x: 88, y: 9, peca: 'garrafas' },
    { x: 91, y: 10, peca: 'pinheiroG', fundo: true },
    { x: 94, y: 10, peca: 'moitaVerde' },
    { x: 101, y: 10, peca: 'estatua' },
    { x: 108, y: 10, peca: 'pedraVerde' },
    { x: 112, y: 10, peca: 'capim' },
    { x: 119, y: 10, peca: 'arvoreH', fundo: true },
    { x: 122, y: 10, peca: 'juncos' },
    { x: 130, y: 10, peca: 'espantalho' },
    { x: 137, y: 10, peca: 'trigo' },
    { x: 147, y: 10, peca: 'betula1', fundo: true, vira: true },
    { x: 152, y: 10, peca: 'tendaP' },
    { x: 150, y: 10, peca: 'vaso' },
    { x: 156, y: 10, peca: 'lenha' },
    { x: 161, y: 10, peca: 'moitaVerde' },
    { x: 164, y: 10, peca: 'capim' },
    { x: 170, y: 10, peca: 'florida', fundo: true },
    { x: 176, y: 10, peca: 'muro' },
  ],
  portal: { x: 178, y: 10 },
};

// ── fase 2: mata vermelha ───────────────────────────────

const OUTONO: Fase = {
  id: 'outono',
  nome: 'MATA VERMELHA',
  abertura:
    'Acima do bosque a mata muda de cor e o ar esfria. De manhã o vale amanhece coberto de ' +
    'branco, e some antes das oito.',
  largura: 186,
  inicio: { x: 3, y: 9 },
  blocos: [
    { x: -2, y: 10, l: 24, a: 4 },
    { x: 27, y: 9, l: 6, a: 5 },
    { x: 37, y: 10, l: 20, a: 4 },
    { x: 43, y: 6, l: 5, a: 2 },
    { x: 51, y: 7, l: 4, a: 2 },
    { x: 61, y: 8, l: 8, a: 6 },
    { x: 73, y: 10, l: 22, a: 4 },
    { x: 78, y: 7, l: 4, a: 2 },
    { x: 85, y: 5, l: 4, a: 2 },
    { x: 92, y: 7, l: 4, a: 2 },
    { x: 99, y: 9, l: 10, a: 5 },
    { x: 113, y: 10, l: 28, a: 4 },
    { x: 119, y: 7, l: 5, a: 2 },
    { x: 128, y: 5, l: 5, a: 2 },
    { x: 145, y: 8, l: 7, a: 6 },
    { x: 156, y: 10, l: 32, a: 4 },
    { x: 162, y: 6, l: 4, a: 2 },
  ],
  fogueiras: [[41, 10], [104, 9], [160, 10]],
  sentinelas: [
    { id: 'nita1', x: 18, y: 10, cor: 'marrom', desafio: 'neblina' },
    { id: 'nita2', x: 90, y: 10, cor: 'marrom', desafio: 'copo' },
    { id: 'nita3', x: 148, y: 8, cor: 'marrom', desafio: 'chuva' },
  ],
  moedas: [
    [9, 9], [10, 9], [11, 9],
    [24, 8], [25, 7], [29, 7], [30, 7],
    [44, 5], [46, 5], [52, 6], [53, 6],
    [58, 7], [59, 6], [64, 6], [66, 6],
    [79, 6], [80, 6], [86, 4], [87, 4], [93, 6], [94, 6],
    [101, 8], [103, 8], [110, 8], [111, 7],
    [120, 6], [122, 6], [129, 4], [130, 4], [131, 4],
    [143, 8], [144, 7], [163, 5], [164, 5],
    [176, 9], [177, 9],
  ],
  adornos: [
    { x: -1, y: 10, peca: 'betula1', fundo: true },
    { x: 5, y: 10, peca: 'arvoreH', fundo: true },
    { x: 3, y: 10, peca: 'moitaOutono' },
    { x: 8, y: 10, peca: 'folhas' },
    { x: 12, y: 10, peca: 'tendaG' },
    { x: 15, y: 10, peca: 'lenha' },
    { x: 20, y: 10, peca: 'toco', fundo: true },
    { x: 28, y: 9, peca: 'pedraOutono' },
    { x: 38, y: 10, peca: 'betula2', fundo: true },
    { x: 40, y: 10, peca: 'panela' },
    { x: 45, y: 10, peca: 'moitaOutono' },
    { x: 55, y: 10, peca: 'abobora' },
    { x: 62, y: 8, peca: 'folhas' },
    { x: 65, y: 8, peca: 'cruz' },
    { x: 74, y: 10, peca: 'arvoreH', fundo: true, vira: true },
    { x: 76, y: 10, peca: 'lapide1' },
    { x: 82, y: 10, peca: 'lapide2' },
    { x: 79, y: 10, peca: 'urna' },
    { x: 89, y: 10, peca: 'barril' },
    { x: 96, y: 10, peca: 'moitaOutono' },
    { x: 100, y: 9, peca: 'espantalho' },
    { x: 106, y: 9, peca: 'abobora' },
    { x: 114, y: 10, peca: 'betula3', fundo: true },
    { x: 117, y: 10, peca: 'folhas' },
    { x: 125, y: 10, peca: 'cipreste', fundo: true },
    { x: 135, y: 10, peca: 'pedraOutono' },
    { x: 139, y: 10, peca: 'trigo' },
    { x: 146, y: 8, peca: 'folhas' },
    { x: 157, y: 10, peca: 'arvoreH', fundo: true },
    { x: 159, y: 10, peca: 'tendaP' },
    { x: 168, y: 10, peca: 'moitaOutono' },
    { x: 172, y: 10, peca: 'betula1', fundo: true, vira: true },
    { x: 180, y: 10, peca: 'muro' },
  ],
  portal: { x: 182, y: 10 },
};

// ── fase 3: serra branca ────────────────────────────────

const INVERNO: Fase = {
  id: 'inverno',
  nome: 'SERRA BRANCA',
  abertura:
    'Do meio da serra para cima é neve. O açude do posto amanheceu com uma placa de gelo ' +
    'boiando, e a bica de barro está partida ao meio.',
  largura: 190,
  inicio: { x: 3, y: 9 },
  blocos: [
    { x: -2, y: 10, l: 22, a: 4 },
    { x: 26, y: 10, l: 16, a: 4 },
    { x: 32, y: 6, l: 5, a: 2 },
    { x: 46, y: 9, l: 8, a: 5 },
    { x: 58, y: 10, l: 18, a: 4 },
    { x: 63, y: 7, l: 4, a: 2 },
    { x: 70, y: 5, l: 4, a: 2 },
    { x: 80, y: 8, l: 10, a: 6 },
    { x: 94, y: 10, l: 20, a: 4 },
    { x: 99, y: 7, l: 4, a: 2 },
    { x: 106, y: 5, l: 5, a: 2 },
    { x: 118, y: 9, l: 12, a: 5 },
    { x: 134, y: 10, l: 22, a: 4 },
    { x: 139, y: 7, l: 5, a: 2 },
    { x: 148, y: 5, l: 4, a: 2 },
    { x: 160, y: 8, l: 8, a: 6 },
    { x: 172, y: 10, l: 20, a: 4 },
  ],
  fogueiras: [[38, 10], [96, 10], [152, 10]],
  sentinelas: [
    { id: 'vilma1', x: 16, y: 10, cor: 'azul', desafio: 'gelo' },
    { id: 'vilma2', x: 86, y: 8, cor: 'azul', desafio: 'cano' },
    { id: 'vilma3', x: 164, y: 8, cor: 'azul', desafio: 'neve' },
  ],
  moedas: [
    [8, 9], [9, 9], [10, 9],
    [23, 8], [24, 7], [28, 9], [29, 9],
    [33, 5], [35, 5], [43, 8], [44, 7],
    [48, 8], [50, 8], [56, 8], [57, 7],
    [64, 6], [65, 6], [71, 4], [72, 4],
    [82, 7], [84, 7], [91, 8], [92, 7],
    [100, 6], [101, 6], [107, 4], [108, 4], [109, 4],
    [120, 8], [122, 8], [131, 8], [132, 7],
    [140, 6], [142, 6], [149, 4], [150, 4],
    [158, 7], [159, 7], [180, 9], [181, 9],
  ],
  adornos: [
    { x: -1, y: 10, peca: 'pinheiroG', fundo: true },
    { x: 5, y: 10, peca: 'cipreste', fundo: true },
    { x: 3, y: 10, peca: 'moitaNeve' },
    { x: 8, y: 10, peca: 'neve' },
    { x: 11, y: 10, peca: 'tendaG' },
    { x: 14, y: 10, peca: 'lenha' },
    { x: 18, y: 10, peca: 'toco', fundo: true },
    { x: 27, y: 10, peca: 'cipreste', fundo: true, vira: true },
    { x: 30, y: 10, peca: 'pedraNeve' },
    { x: 40, y: 10, peca: 'panela' },
    { x: 47, y: 9, peca: 'neve' },
    { x: 51, y: 9, peca: 'natal' },
    { x: 59, y: 10, peca: 'pinheiroG', fundo: true },
    { x: 62, y: 10, peca: 'moitaNeve' },
    { x: 74, y: 10, peca: 'estatuaNeve' },
    { x: 81, y: 8, peca: 'barril' },
    { x: 84, y: 8, peca: 'caixote' },
    { x: 88, y: 8, peca: 'neve' },
    { x: 95, y: 10, peca: 'cipreste', fundo: true },
    { x: 103, y: 10, peca: 'moitaNeve' },
    { x: 111, y: 10, peca: 'pedraNeve' },
    { x: 108, y: 10, peca: 'minerio' },
    { x: 119, y: 9, peca: 'neve' },
    { x: 124, y: 9, peca: 'natal' },
    { x: 135, y: 10, peca: 'pinheiroG', fundo: true, vira: true },
    { x: 145, y: 10, peca: 'moitaNeve' },
    { x: 154, y: 10, peca: 'tendaP' },
    { x: 161, y: 8, peca: 'neve' },
    { x: 173, y: 10, peca: 'cipreste', fundo: true },
    { x: 176, y: 10, peca: 'estatuaNeve' },
    { x: 185, y: 10, peca: 'muro' },
  ],
  portal: { x: 187, y: 10 },
  refem: { x: 182, y: 10 },
};

export const FASES: Fase[] = [VERAO, OUTONO, INVERNO];

// ── abertura e desfecho ─────────────────────────────────

export const ABERTURA: Fala[] = [
  {
    quem: 'DORIL',
    texto:
      'A fonte não secou de um dia para o outro. Foi baixando. Primeiro o poço de baixo, ' +
      'depois o do meio. Hoje a bica do largo dá um fio que não enche um balde em uma hora.',
  },
  {
    quem: 'DORIL',
    texto:
      'A Iara subiu a serra faz nove dias para ver a nascente com os próprios olhos. Ela é a ' +
      'aguadeira: sabe achar veia de água só de olhar o mato que cresce em cima.',
  },
  {
    quem: 'DORIL',
    texto:
      'Não voltou. E os Encapuzados desceram a trilha três vezes essa semana com carroça ' +
      'carregada de lenha.',
  },
  {
    quem: 'DORIL',
    texto:
      'Você vai ter que passar pelas três passagens da Ordem da Fonte. As Sentinelas não deixam ' +
      'subir quem não entende a água — dizem que gente que não entende a água estraga a serra. ' +
      'Depois do que os Encapuzados fizeram, eu não discordo mais.',
  },
];

export const DESFECHO: Fala[] = [
  {
    quem: 'IARA',
    texto:
      'Tira essa venda primeiro. Nove dias no escuro e eu ainda sei onde estou pelo barulho ' +
      'da água. Escuta: continua pingando. A nascente não morreu.',
  },
  {
    quem: 'IARA',
    texto:
      'Foi isso que eu vim ver e foi por isso que eles me amarraram. A fonte não secou por ' +
      'falta de chuva. Chove igual, você mesmo passou na neblina e no gelo.',
  },
  {
    quem: 'IARA',
    texto:
      'Olha a encosta pela boca da gruta. Estava coberta de mata até o ano passado. Os ' +
      'Encapuzados derrubaram tudo para vender lenha.',
  },
  {
    quem: 'IARA',
    texto:
      'Chuva que cai em mata bate na folha, escorre devagar pelo tronco, encontra raiz e ' +
      'entra no chão. Lá dentro ela caminha meses até sair aqui, filtrada e limpa. É disso ' +
      'que a fonte vive: não da chuva de ontem, da chuva do ano passado que ficou guardada.',
  },
  {
    quem: 'IARA',
    texto:
      'Chuva que cai em barranco pelado não tem em que se segurar. Escorre por cima, leva a ' +
      'terra junto, chega no rio de uma vez e vai embora em dois dias. Passa pela serra sem ' +
      'nunca entrar nela.',
  },
  {
    quem: 'IARA',
    texto:
      'A água continua subindo e voltando, do jeito que as Sentinelas te ensinaram. Quem ' +
      'cortaram foi o caminho de volta para dentro do chão.\n\n' +
      'Desce comigo. Vamos replantar aquela encosta, e o poço do largo vai voltar a encher — ' +
      'não neste inverno, nem no próximo. Mas volta.',
  },
];
