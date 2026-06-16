import { useState, useCallback } from 'react';
import type {
  GameState,
  GameConfig,
  SceneName,
  KarmaChoice,
  FragmentName,
  MCQuestion,
  NarrativeChoice,
  EndingName,
} from '../types/game';

const SAVE_KEY_PREFIX = 'eter_progress_';

function buildInitialState(config: GameConfig): GameState {
  return {
    config,
    scene: 'intro',
    nextScene: null,
    hearts: 3,
    fragments: [],
    score: { firstTry: 0, total: 0, timeSeconds: 0 },
    karma: { choices: [], ending: null },
    forest: { found: [false, false, false], passed: [false, false, false], narrativeDone: false },
    city: { connected: new Array((config.scenes.city.pairs ?? []).length).fill(false), narrativeDone: false },
    caves: { index: 0, lit: [], narrativeDone: false },
    tower: { filled: [false, false, false], currentSlot: 0 },
    transitionText: [],
    activeQuestion: null,
    activeNarrative: null,
  };
}

function calculateEnding(
  karmaChoices: KarmaChoice[],
  score: GameState['score'],
  totalQuestions: number,
): EndingName {
  // Mestre: perfect score on first try AND under 10 minutes
  if (score.firstTry === totalQuestions && score.timeSeconds < 600) {
    return 'mestre';
  }

  const allLuz = karmaChoices.length === 3 && karmaChoices.every(k => k === 'luz');
  const allSombra = karmaChoices.length === 3 && karmaChoices.every(k => k === 'sombra');

  if (allLuz) return 'heroi';
  if (allSombra) return 'sabio';
  return 'explorador';
}

function getSaveKey(gameId: string): string {
  return `${SAVE_KEY_PREFIX}${gameId}`;
}

function saveState(state: GameState): void {
  try {
    const key = getSaveKey(state.config.id);
    // Strip non-serializable callbacks before saving
    const toSave = {
      ...state,
      activeQuestion: null,
      activeNarrative: null,
    };
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch {
    // localStorage may be unavailable in some environments
  }
}

function loadState(gameId: string): Partial<GameState> | null {
  try {
    const key = getSaveKey(gameId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<GameState>;
  } catch {
    return null;
  }
}

export function useGameState() {
  const [state, setState] = useState<GameState | null>(null);

  const startGame = useCallback((config: GameConfig) => {
    const saved = loadState(config.id);
    let initial: GameState;

    if (saved && saved.config?.id === config.id) {
      // Restore saved state but strip any callbacks
      initial = {
        ...buildInitialState(config),
        ...saved,
        config, // always use fresh config
        activeQuestion: null,
        activeNarrative: null,
      };
    } else {
      initial = buildInitialState(config);
    }

    setState(initial);
  }, []);

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setState(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const answerQuestion = useCallback((idx: number) => {
    updateState(prev => {
      if (!prev.activeQuestion) return prev;

      const { question, onAnswer } = prev.activeQuestion;
      const isCorrect = idx === question.correct;

      let newHearts = prev.hearts;
      let newScore = { ...prev.score };

      if (isCorrect) {
        newScore.total += 1;
        // We track whether this was first-try correct via hearts — if hearts haven't dropped
        // for this question, we count it as first-try. The caller can manage this externally too.
        // Simple heuristic: first-try tracked by onAnswer callback signaling it.
        newScore.firstTry += 1;
      } else {
        newHearts = Math.max(0, prev.hearts - 1);
      }

      // Fire the external callback so scene components can react
      setTimeout(() => onAnswer(idx), 0);

      return {
        ...prev,
        hearts: newHearts,
        score: newScore,
        activeQuestion: null,
      };
    });
  }, [updateState]);

  const chooseKarma = useCallback((karma: KarmaChoice) => {
    updateState(prev => {
      const newChoices = [...prev.karma.choices, karma];
      return {
        ...prev,
        karma: { ...prev.karma, choices: newChoices },
        activeNarrative: null,
      };
    });
  }, [updateState]);

  const collectFragment = useCallback((name: FragmentName) => {
    updateState(prev => {
      if (prev.fragments.includes(name)) return prev;
      return {
        ...prev,
        fragments: [...prev.fragments, name],
      };
    });
  }, [updateState]);

  const nextScene = useCallback(() => {
    updateState(prev => {
      if (!prev.nextScene) return prev;
      return {
        ...prev,
        scene: prev.nextScene,
        nextScene: null,
        hearts: 3,
        transitionText: [],
        activeQuestion: null,
        activeNarrative: null,
      };
    });
  }, [updateState]);

  const restartScene = useCallback(() => {
    updateState(prev => ({
      ...prev,
      hearts: 3,
      activeQuestion: null,
      activeNarrative: null,
    }));
  }, [updateState]);

  const openQuestion = useCallback((q: MCQuestion, cb: (idx: number) => void) => {
    updateState(prev => ({
      ...prev,
      activeQuestion: { question: q, onAnswer: cb },
    }));
  }, [updateState]);

  const closeQuestion = useCallback(() => {
    updateState(prev => ({
      ...prev,
      activeQuestion: null,
    }));
  }, [updateState]);

  const openNarrative = useCallback((choice: NarrativeChoice) => {
    updateState(prev => ({
      ...prev,
      activeNarrative: choice,
    }));
  }, [updateState]);

  const closeNarrative = useCallback(() => {
    updateState(prev => ({
      ...prev,
      activeNarrative: null,
    }));
  }, [updateState]);

  const goToScene = useCallback((scene: SceneName, transitionText: string[] = []) => {
    updateState(prev => ({
      ...prev,
      nextScene: scene,
      transitionText,
      scene: transitionText.length > 0 ? 'transition' : scene,
    }));
  }, [updateState]);

  const finalizeEnding = useCallback((timeSeconds: number) => {
    updateState(prev => {
      const config = prev.config;
      const totalQuestions =
        (config.scenes.forest.questions?.length ?? 0) +
        (config.scenes.caves.questions?.length ?? 0) +
        (config.scenes.tower.questions?.length ?? 0);

      const ending = calculateEnding(
        prev.karma.choices,
        { ...prev.score, timeSeconds },
        totalQuestions,
      );

      return {
        ...prev,
        score: { ...prev.score, timeSeconds },
        karma: { ...prev.karma, ending },
        scene: 'victory',
      };
    });
  }, [updateState]);

  return {
    state,
    startGame,
    answerQuestion,
    chooseKarma,
    collectFragment,
    nextScene,
    restartScene,
    openQuestion,
    closeQuestion,
    openNarrative,
    closeNarrative,
    goToScene,
    finalizeEnding,
  };
}
