import { useMemo, useState } from 'react';
import type { GameConfig, KarmaChoice, FragmentName, KarmaState, MCQuestion, PhaseProgress, EndingName } from '../../types/game';
import { useTimer } from '../../hooks/useTimer';
import { JOURNEY, ENEMIES, HERO_PORTRAIT } from '../../data/journey';
import IntroScene from './IntroScene';
import ForestScene from './ForestScene';
import CityScene from './CityScene';
import CavesScene from './CavesScene';
import BattleScene from './mechanics/BattleScene';
import WorldMap from './WorldMap';
import VictoryScene from './VictoryScene';

type Mode = 'intro' | 'map' | 'phase' | 'victory';

interface GameShellProps {
  config: GameConfig;
  onExit?: () => void;
}

const FALLBACK_Q: MCQuestion = {
  text: 'O conhecimento é a chave para vencer este desafio. Pronto para seguir?',
  options: ['Sim, vamos!', 'Talvez', 'Não sei', 'Depois'],
  correct: 0,
};

function validQuestions(qs: MCQuestion[] | undefined): MCQuestion[] {
  return (qs ?? []).filter(q => q && q.text.trim() && q.options.every(o => o.trim()));
}

export default function GameShell({ config, onExit }: GameShellProps) {
  const [mode, setMode] = useState<Mode>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePhase, setActivePhase] = useState(0);
  const [phaseKey, setPhaseKey] = useState(0);

  const [hearts, setHearts] = useState(3);
  const [fragments, setFragments] = useState<FragmentName[]>([]);
  const [coins, setCoins] = useState(0);
  const [karma, setKarma] = useState<KarmaState>({ choices: [], ending: null });
  const [score, setScore] = useState({ firstTry: 0, total: 0 });
  const [progress, setProgress] = useState<Record<string, PhaseProgress>>({});

  const isPlaying = mode === 'phase';
  const { seconds, formatted } = useTimer(isPlaying);

  // Modo demo/teste: todas as fases ficam liberadas para o professor explorar.
  const freePlay = config.id === 'DEMO';

  // Combined fallback pool from all banks (used when a battle bank is empty)
  const allQ = useMemo(() => {
    const pool = [
      ...validQuestions(config.scenes.forest.questions),
      ...validQuestions(config.scenes.caves.questions),
      ...validQuestions(config.scenes.tower.questions),
    ];
    return pool.length ? pool : [FALLBACK_Q];
  }, [config]);

  const bankQuestions = (bank?: 'forest' | 'caves' | 'tower'): MCQuestion[] => {
    const map = {
      forest: config.scenes.forest.questions,
      caves: config.scenes.caves.questions,
      tower: config.scenes.tower.questions,
    };
    const qs = bank ? validQuestions(map[bank]) : [];
    return qs.length ? qs : allQ;
  };

  const enterPhase = (index: number) => {
    setActivePhase(index);
    setHearts(3);
    setPhaseKey(k => k + 1);
    setMode('phase');
  };

  const goToVictory = (prog: Record<string, PhaseProgress>, choices: KarmaChoice[]) => {
    const allThree = JOURNEY.every(p => (prog[p.id]?.stars ?? 0) >= 3);
    let ending: EndingName = 'explorador';
    if (allThree && seconds < 720) ending = 'mestre';
    else if (choices.length >= 3 && choices.every(c => c === 'luz')) ending = 'heroi';
    else if (choices.length >= 3 && choices.every(c => c === 'sombra')) ending = 'sabio';
    setKarma(k => ({ ...k, ending }));
    setMode('victory');
  };

  const completePhase = (stars: number, gainedCoins: number, reward?: FragmentName, karmaChoice?: KarmaChoice) => {
    const phaseId = JOURNEY[activePhase].id;
    const alreadyDone = progress[phaseId]?.completed;
    const prevStars = progress[phaseId]?.stars ?? 0;
    const newProgress: Record<string, PhaseProgress> = {
      ...progress,
      [phaseId]: { completed: true, stars: Math.max(prevStars, stars), coins: gainedCoins },
    };
    // Only record a karma choice the first time a phase is cleared (avoid double-counting on replays)
    const newChoices = karmaChoice && !alreadyDone ? [...karma.choices, karmaChoice] : karma.choices;

    setProgress(newProgress);
    setCoins(c => c + gainedCoins);
    if (reward) setFragments(f => (f.includes(reward) ? f : [...f, reward]));
    if (karmaChoice && !alreadyDone) setKarma(k => ({ ...k, choices: newChoices }));

    const isLast = activePhase >= JOURNEY.length - 1;
    if (activePhase === currentIndex && !isLast) {
      setCurrentIndex(i => Math.min(JOURNEY.length - 1, i + 1));
    }

    if (isLast) {
      setTimeout(() => goToVictory(newProgress, newChoices), 40);
    } else {
      setMode('map');
    }
  };

  const handleCorrect = () => setScore(s => ({ firstTry: s.firstTry + 1, total: s.total + 1 }));
  const handleWrong = () => {
    setScore(s => ({ ...s, total: s.total + 1 }));
    setHearts(h => {
      const nv = h - 1;
      if (nv <= 0) { setPhaseKey(k => k + 1); return 3; }
      return nv;
    });
  };

  const handlePuzzleComplete = (karmaChoice: KarmaChoice, reward?: FragmentName) => {
    const stars = hearts >= 3 ? 3 : hearts === 2 ? 2 : 1;
    completePhase(stars, 20 + stars * 8, reward, karmaChoice);
  };

  const resetAll = () => {
    setMode('intro');
    setCurrentIndex(0);
    setHearts(3);
    setFragments([]);
    setCoins(0);
    setKarma({ choices: [], ending: null });
    setScore({ firstTry: 0, total: 0 });
    setProgress({});
    setPhaseKey(k => k + 1);
  };

  // ── INTRO ──
  if (mode === 'intro') {
    return <IntroScene irisImg="/assets/chars/char-iris.png" lines={config.story?.intro} onComplete={() => setMode('map')} />;
  }

  // ── MAP ──
  if (mode === 'map') {
    return (
      <div className="fixed inset-0">
        <button onClick={onExit} className="fixed z-30 btn-rpg font-pixel" style={{ top: 8, left: 8, fontSize: 6, padding: '6px 10px' }}>
          ✕ SAIR
        </button>
        <WorldMap
          phases={JOURNEY}
          progress={progress}
          currentIndex={currentIndex}
          fragments={fragments}
          coins={coins}
          freePlay={freePlay}
          onEnterPhase={enterPhase}
        />
      </div>
    );
  }

  // ── VICTORY ──
  if (mode === 'victory') {
    return (
      <VictoryScene
        score={{ ...score, timeSeconds: seconds }}
        karma={karma}
        coins={coins}
        onPlayAgain={resetAll}
      />
    );
  }

  // ── PHASE ──
  const phase = JOURNEY[activePhase];

  return (
    <div className="fixed inset-0 bg-black">
      {/* HUD (puzzle phases only) */}
      {phase.kind !== 'battle' && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 bar-wood">
          <button onClick={() => setMode('map')} className="font-pixel" style={{ color: '#f7ead5', fontSize: 7, background: 'none', border: 'none', cursor: 'pointer' }}>← MAPA</button>
          <div className="flex gap-1 items-center">
            {Array.from({ length: 3 }, (_, i) => (
              <img
                key={i}
                src={i < hearts ? '/assets/ui/heart-full.png' : '/assets/ui/heart-empty.png'}
                alt={i < hearts ? 'vida' : 'vazio'}
                style={{ width: 24, height: 24, imageRendering: 'pixelated' }}
              />
            ))}
          </div>
          <span className="font-pixel" style={{ color: '#ffd700', fontSize: 8, textShadow: '1px 2px 0 #000' }}>⏱ {formatted}</span>
        </div>
      )}

      {phase.kind === 'forest' && (
        <ForestScene
          key={phaseKey}
          treeImg="/assets/chars/char-tree.png"
          questions={config.scenes.forest.questions}
          narrative={config.scenes.forest.narrative}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onComplete={(k) => handlePuzzleComplete(k, phase.reward)}
        />
      )}

      {phase.kind === 'city' && (
        <CityScene
          key={phaseKey}
          cogImg="/assets/chars/char-cog.png"
          pairs={config.scenes.city.pairs}
          narrative={config.scenes.city.narrative}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onComplete={(k) => handlePuzzleComplete(k, phase.reward)}
        />
      )}

      {phase.kind === 'caves' && (
        <CavesScene
          key={phaseKey}
          celeneImg="/assets/chars/char-celene.png"
          questions={config.scenes.caves.questions}
          narrative={config.scenes.caves.narrative}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onComplete={(k) => handlePuzzleComplete(k, phase.reward)}
        />
      )}

      {phase.kind === 'battle' && phase.enemyId && (
        <BattleScene
          key={phaseKey}
          enemy={ENEMIES[phase.enemyId]}
          bg={phase.bg!}
          questions={bankQuestions(phase.questionBank)}
          heroPortrait={HERO_PORTRAIT}
          onVictory={(stars, c) => completePhase(stars, c)}
          onDefeat={() => setPhaseKey(k => k + 1)}
        />
      )}
    </div>
  );
}
