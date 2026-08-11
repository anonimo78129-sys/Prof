// ─────────────────────────────────────────────────────────
// Monta o grafo de cenas de CINZAS.
//
// Sem quiz de professor, devolve a história padrão, em que as cinco
// perguntas de biologia são pistas da própria trama.
//
// Com um quiz compartilhado, a narrativa continua a mesma e só as
// perguntas mudam. Como o professor manda enunciado, alternativas e
// gabarito (sem explicação), as reações viram texto neutro e a
// explicação vira a alternativa correta.
// ─────────────────────────────────────────────────────────
import { defaultScenes, type Scene } from './cinzas';
import type { SharedQuiz } from './quizShare';

const CHALLENGE_IDS = [
  'desafio_sementes', 'desafio_transpiracao', 'desafio_solanina',
  'desafio_estufa', 'desafio_raizes',
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
    scenes[id] = {
      ...scene,
      question: { text: q.text, options: [...q.options], correct: q.correct },
      // o roteiro original comentava a resposta de biologia; com pergunta
      // de fora, isso não vale mais
      intro: scene.intro,
      correctText: 'Você responde sem hesitar, e acerta.',
      wrongText: 'Você responde, e não era essa a resposta.',
      hint: `A resposta certa era: ${q.options[q.correct]}`,
    };
  }
  return scenes;
}
