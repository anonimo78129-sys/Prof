// ─────────────────────────────────────────────────────────
// Monta o grafo de cenas de CINZAS. Sem quiz do professor, devolve os
// 5 desafios padrão de biologia (radiação, água, imunidade, ecologia,
// decomposição). Com um quiz compartilhado, a MESMA narrativa é mantida,
// só as perguntas dos desafios são trocadas pelo conteúdo do professor.
// ─────────────────────────────────────────────────────────
import { defaultScenes, type Scene } from './cinzas';
import type { SharedQuiz } from './quizShare';

const CHALLENGE_IDS = [
  'desafio_radiacao', 'desafio_agua', 'desafio_imunidade',
  'desafio_ecologia', 'desafio_decomposicao',
] as const;

export function buildScenes(quiz?: SharedQuiz | null): Record<string, Scene> {
  const scenes = defaultScenes();
  const questions = quiz?.questions.filter(q => q.text?.trim()) ?? [];
  if (questions.length === 0) return scenes;

  let qi = 0;
  for (const id of CHALLENGE_IDS) {
    const scene = scenes[id];
    if (scene.kind !== 'challenge') continue;
    const q = questions[qi++ % questions.length];
    scenes[id] = { ...scene, question: { text: q.text, options: q.options, correct: q.correct } };
  }
  return scenes;
}
