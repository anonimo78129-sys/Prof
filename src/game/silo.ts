// ─────────────────────────────────────────────────────────
// O ÚLTIMO CICLO DO SILO
//
// Trinta anos depois do Grande Escaldão, o que sobrou da humanidade vive
// no Silo Alpha. Tudo depende do Núcleo Verde: as estufas que renovam o
// ar e produzem comida. A Dra. Mara, chefe do refúgio, foi hospitalizada
// por asfixia, e o assistente de botânica ficou sozinho com um
// ecossistema entrando em colapso.
//
// SOBRE O NÍVEL DO CONTEÚDO
// Nada de fórmula mineral (MgSO₄, KNO₃) nem de nome de tecido
// (parênquima aquífero, estômato críptico). Isso é conteúdo de faculdade
// e afasta a turma. Cada capítulo aqui se resolve olhando: a terra está
// morna, as folhas VELHAS amarelam antes das novas, a flor abre e cai
// sem fruto, a muda tomba porque nunca apanhou vento.
//
// O nome técnico entra depois da decisão, batizando o que o aluno já
// entendeu — nunca antes, cobrando o que ele ainda não viu.
// ─────────────────────────────────────────────────────────

export interface OpcaoSilo {
  label: string;
  certa: boolean;
  /** o que a biologia faz acontecer depois da escolha */
  resultado: string;
}

export interface CapituloSilo {
  id: string;
  /** onde no Núcleo Verde fica o marcador desta cena */
  x: number;
  z: number;
  rotulo: string;
  texto: string;
  opcoes: OpcaoSilo[];
  proximo: string | null;
}

export const SILO: Record<string, CapituloSilo> = {
  mudas: {
    id: 'mudas',
    x: 0,
    z: 20,
    rotulo: 'BANCADA 1 — MUDAS',
    texto:
      'As mudas da bancada 1 estão tombadas. Não murchas: tombadas, deitadas de lado, com o caule ' +
      'fino demais para o próprio tamanho. Estão verdes, a terra está úmida, a luz está ligada ' +
      'catorze horas por dia. No diário da Dra. Mara, a última linha escrita à mão diz: ' +
      '"ventiladores do setor 1 — pedir peça".',
    opcoes: [
      {
        label: 'Amarrar as mudas em tutores para elas pararem de cair',
        certa: false,
        resultado:
          'Você amarra as sessenta. Uma semana depois, ao soltar, elas tombam de novo — e mais moles ' +
          'que antes. O tutor segurou no lugar do caule, e caule que não precisa se segurar não ' +
          'engrossa. Você resolveu o sintoma e piorou a causa.',
      },
      {
        label: 'Consertar os ventiladores antes de mexer nas mudas',
        certa: true,
        resultado:
          'O ventilador volta e as mudas passam o dia inteiro sendo empurradas de leve. Em dez dias ' +
          'os caules estão visivelmente mais grossos, e elas ficam de pé sozinhas. Planta que apanha ' +
          'vento gasta energia engrossando o caule; planta em ar parado cresce comprida e fraca. ' +
          'O ventilador do Núcleo Verde nunca foi para o ar. Era para o caule.',
      },
    ],
    proximo: 'folhas',
  },

  folhas: {
    id: 'folhas',
    x: 14,
    z: 3,
    rotulo: 'BANCADA 2 — FOLHAGEM',
    texto:
      'Na bancada 2 as folhas estão amarelando. Você repara numa coisa: são as folhas de baixo, ' +
      'as mais velhas, que amarelam primeiro. As de cima, novas, continuam verdes. ' +
      'A caixa de nutriente está vazia há três semanas e ninguém percebeu.',
    opcoes: [
      {
        label: 'Cortar as folhas amarelas para a planta não gastar energia com elas',
        certa: false,
        resultado:
          'Você poda as amarelas e, dias depois, as folhas logo acima começam a amarelar também. ' +
          'A planta não estava desistindo daquelas folhas por acaso: estava puxando o que faltava ' +
          'das velhas para dar às novas. Cortar as velhas foi tirar dela a própria reserva.',
      },
      {
        label: 'Repor o nutriente da caixa e não podar nada',
        certa: true,
        resultado:
          'Em poucos dias as folhas novas escurecem e o amarelamento para de subir. A ordem contava ' +
          'a história: quando falta alimento, a planta tira das folhas velhas para sustentar as ' +
          'novas, e por isso o amarelo começa embaixo. Se tivesse começado pelas folhas novas, ' +
          'seria outro problema, de outro tipo.',
      },
    ],
    proximo: 'flores',
  },

  flores: {
    id: 'flores',
    x: 0,
    z: -14,
    rotulo: 'BANCADA 3 — FLORAÇÃO',
    texto:
      'A bancada 3 está coberta de flores abertas, e é a coisa mais bonita do Silo. ' +
      'Também é a mais inútil: em dois meses não veio um fruto. As flores abrem, ficam três dias ' +
      'e caem inteiras no chão. Não há praga, não há mancha, não há falta de água.',
    opcoes: [
      {
        label: 'Aumentar a luz e o nutriente para forçar a frutificação',
        certa: false,
        resultado:
          'Vêm mais flores ainda, e nenhum fruto a mais. O problema nunca foi a planta ter pouca ' +
          'força para fazer fruta. Ela estava fazendo a parte dela e esperando alguém aparecer.',
      },
      {
        label: 'Passar de flor em flor com um pincel',
        certa: true,
        resultado:
          'Três semanas depois, as flores que você tocou com o pincel estão viradas em fruto, e as ' +
          'que você não tocou caíram como sempre. Flor é um convite feito para bicho: cor, cheiro e ' +
          'açúcar existem para pagar quem carrega o pólen de uma planta para outra. No Silo lacrado ' +
          'não entrou inseto nenhum em trinta anos. O pincel é o inseto que não existe aqui.',
      },
    ],
    proximo: 'solo',
  },

  solo: {
    id: 'solo',
    x: -4,
    z: -32,
    rotulo: 'CANTEIRO DE SOLO RECICLADO',
    texto:
      'O oxigênio do Silo caiu de 20,8% para 17,4% em trinta anos, e a queda não parou. ' +
      'A lavoura está viva e sadia. Você enfia a mão no canteiro de solo reciclado, o único ' +
      'canteiro com terra de verdade em todo o Núcleo Verde. A terra está morna. ' +
      'Mais morna que o ar do corredor.',
    opcoes: [
      {
        label: 'Plantar mais: mais planta, mais oxigênio',
        certa: false,
        resultado:
          'A área nova é plantada e o oxigênio continua caindo no mesmo ritmo. Planta não fabrica ' +
          'oxigênio do nada — ela devolve usando o carbono que tira do ar. Se o carbono sumiu do ar, ' +
          'plantar mais não muda nada.',
      },
      {
        label: 'Descobrir por que a terra está morna',
        certa: true,
        resultado:
          'Morno é sinal de que tem coisa viva ali trabalhando: um mundo de seres pequenos demais ' +
          'para ver, comendo restos e respirando — gastando oxigênio, exatamente como você. ' +
          'Um canteiro de terra rica é uma multidão respirando em silêncio. Eles devolvem o carbono ' +
          'ao ar, e a planta devolveria o oxigênio. O ciclo fecharia. ' +
          'Só que o concreto das paredes vem absorvendo esse carbono há trinta anos, e prendendo ' +
          'ele lá dentro. O ar não vazou do Silo: endureceu nele.',
      },
    ],
    proximo: null,
  },
};

export const SILO_PRIMEIRO = 'mudas';

/** Marcadores no mundo 3D, na ordem em que o jogador os encontra. */
export const ESTACOES = Object.values(SILO).map(c => ({
  id: c.id, x: c.x, z: c.z, rotulo: c.rotulo,
}));
