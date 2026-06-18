import type { Beat, StoryScript } from './types';
import type { MCQuestion } from '../types/game';

// Pergunta de exemplo (botânica) usada enquanto o jogo não recebe um GameConfig real.
const SAMPLE_GATE_QUESTION: MCQuestion = {
  text: 'Qual parte da planta é responsável por absorver água e nutrientes do solo?',
  options: ['A raiz', 'A flor', 'O fruto', 'A folha'],
  correct: 0,
};

// ── ATO 0 + ATO 1 — Despertar e o Primeiro Portão ──
// Falas baseadas no roteiro do autor. O mistério do Projeto Amazônia II
// vai sendo revelado aos poucos nos próximos atos.
const beats: Beat[] = [
  // ── ATO 0 — Despertar ──
  { t: 'scene', bg: 'noite' },
  { t: 'say', who: 'estudante', lines: [
    'Faltam 3 dias para a prova final... e eu mal dormi essa semana.',
    'Só um cochilo rápido...',
  ] },
  { t: 'fade', text: '...' },

  // ── ATO 1 — O Jardim ──
  { t: 'scene', bg: 'floresta' },
  { t: 'say', who: 'estudante', lines: [
    'O que é este lugar...?',
    'Não lembro de como cheguei aqui.',
  ] },
  { t: 'walk', dist: 900, hint: 'Explorar →' },
  { t: 'say', who: 'estudante', lines: [
    'O que é aquilo?',
    'Ué, um portão??',
  ] },
  { t: 'question', intro: 'Há uma inscrição antiga gravada no portão de cipós...',
    q: SAMPLE_GATE_QUESTION,
    success: [
      'O portão se abriu.',
      'Que estranho...',
    ],
    hint: 'As plantas bebem pela base, escondida na terra. Pense no que as sustenta firme no solo.',
  },
  { t: 'walk', dist: 700, hint: 'Seguir →' },
  { t: 'say', who: 'estudante', lines: [
    'Não vejo ninguém aqui.',
    'Uma clareira sem saída!?',
  ] },
  { t: 'fade', text: 'Continua...' },
];

export const ACT1: StoryScript = { beats };
