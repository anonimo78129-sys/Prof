// ─────────────────────────────────────────────────────────
// ARCA — o ar que falta.
//
// Nave lacrada há trinta anos; o oxigênio cai devagar e não há vazamento.
// A resposta é real: na Biosfera 2, no Arizona, o O₂ caiu de 20,9% para
// 14,5% em dezesseis meses. Os microrganismos do solo consumiam oxigênio
// e devolviam gás carbônico, mas o concreto da estrutura absorvia esse
// gás e prendia o carbono. Sem carbono circulando, a planta não tinha
// como devolver o oxigênio.
//
// O ar não vazou: o carbono saiu do ciclo. É o que o aluno precisa
// descobrir, e nenhum capítulo pergunta "o que é fotossíntese".
// ─────────────────────────────────────────────────────────

export interface OpcaoArca {
  label: string;
  proximo: string | null;
  /** o que acontece por causa da biologia, mostrado depois da escolha */
  resultado: string;
  certa: boolean;
}

export interface CapituloArca {
  id: string;
  titulo: string;
  texto: string;
  opcoes: OpcaoArca[];
}

export const ARCA: Record<string, CapituloArca> = {
  convés: {
    id: 'convés',
    titulo: 'ARCA',
    texto:
      'O medidor do convés agrícola marca 17,4% de oxigênio. Quando você nasceu marcava 20,8. ' +
      'A lavoura está verde, viçosa, sem praga nenhuma, e mesmo assim o número cai todo mês. ' +
      'A chefe da manutenção quer dobrar a área plantada. O técnico do ar quer desligar metade ' +
      'das luminárias para economizar energia.',
    opcoes: [
      {
        label: 'Plantar mais: mais planta, mais oxigênio',
        proximo: 'solo',
        certa: false,
        resultado:
          'A área nova é plantada e o número continua caindo no mesmo ritmo. A planta devolve ' +
          'oxigênio usando o carbono que ela tira do ar — e se o carbono não estiver mais no ar, ' +
          'plantar mais não muda nada. O problema não é falta de planta.',
      },
      {
        label: 'Medir primeiro para onde o carbono está indo',
        proximo: 'solo',
        certa: true,
        resultado:
          'Você monta um registro por semana: oxigênio caindo, e o gás carbônico caindo junto. ' +
          'Isso é estranho. Se alguma coisa estivesse consumindo oxigênio, o carbônico teria que ' +
          'subir na mesma proporção. Os dois sumindo ao mesmo tempo significa que o carbono está ' +
          'saindo do circuito por outro caminho.',
      },
    ],
  },

  solo: {
    id: 'solo',
    titulo: 'ARCA',
    texto:
      'A terra das bancadas veio da Terra e é rica de propósito — cheia de matéria orgânica para ' +
      'as plantas terem de onde tirar alimento por décadas. Você enfia a mão: está morna. ' +
      'Mais morna que o ar do convés.',
    opcoes: [
      {
        label: 'A terra morna é sinal de lavoura saudável',
        proximo: null,
        certa: false,
        resultado:
          'Morna é sinal de atividade, e a atividade ali embaixo não é da planta. É bicho pequeno ' +
          'demais para ver, comendo matéria orgânica e respirando — consumindo oxigênio exatamente ' +
          'como você. Uma bancada de terra rica é uma multidão respirando em silêncio.',
      },
      {
        label: 'Raspar a parede de concreto atrás das bancadas',
        proximo: null,
        certa: true,
        resultado:
          'A raspa é branca por dentro e efervesce no ácido do laboratório. O concreto vinha ' +
          'absorvendo o gás carbônico e prendendo o carbono na parede, mês após mês, trinta anos. ' +
          'O ar não vazou da nave: ele endureceu nela.',
      },
    ],
  },
};

export const ARCA_PRIMEIRO = 'convés';
