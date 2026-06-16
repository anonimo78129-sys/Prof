import { useState } from 'react';
import type { GameConfig, KarmaChoice, FragmentName, KarmaState } from '../../types/game';
import { TRANSITIONS } from '../../data/narrative';
import { useTimer } from '../../hooks/useTimer';
import IntroScene from './IntroScene';
import TransitionScene from './TransitionScene';
import ForestScene from './ForestScene';
import CityScene from './CityScene';
import CavesScene from './CavesScene';
import TowerScene from './TowerScene';
import VictoryScene from './VictoryScene';

type Scene = 'intro' | 'transition' | 'forest' | 'city' | 'caves' | 'tower' | 'victory';

interface GameShellProps {
  config: GameConfig;
  onExit?: () => void;
}

export default function GameShell({ config, onExit }: GameShellProps) {
  const [scene, setScene] = useState<Scene>('intro');
  const [nextScene, setNextScene] = useState<Scene>('forest');
  const [transitionLines, setTransitionLines] = useState<string[]>([]);

  const [hearts, setHearts] = useState(3);
  const [fragments, setFragments] = useState<FragmentName[]>([]);
  const [karma, setKarma] = useState<KarmaState>({ choices: [], ending: null });
  const [score, setScore] = useState({ firstTry: 0, total: 0 });

  // Reset keys — increment to force scene component remount (resets internal state)
  const [forestKey, setForestKey] = useState(0);
  const [cityKey, setCityKey] = useState(0);
  const [cavesKey, setCavesKey] = useState(0);
  const [towerKey, setTowerKey] = useState(0);

  const isPlaying = scene !== 'intro' && scene !== 'victory' && scene !== 'transition';
  const { seconds, formatted } = useTimer(isPlaying);

  const goToScene = (next: Scene, transKey?: string) => {
    const lines = transKey ? (TRANSITIONS[transKey] ?? []) : [];
    if (lines.length > 0) {
      setTransitionLines(lines);
      setNextScene(next);
      setScene('transition');
    } else {
      setHearts(3);
      setScene(next);
    }
  };

  const handleTransitionComplete = () => {
    setHearts(3);
    setScene(nextScene);
  };

  const handleCorrect = () => {
    setScore(s => ({ ...s, firstTry: s.firstTry + 1, total: s.total + 1 }));
  };

  const handleWrong = (currentScene: Scene) => {
    setScore(s => ({ ...s, total: s.total + 1 }));
    const newHearts = hearts - 1;
    if (newHearts <= 0) {
      setHearts(3);
      // Reset scene via key
      if (currentScene === 'forest') setForestKey(k => k + 1);
      else if (currentScene === 'city') setCityKey(k => k + 1);
      else if (currentScene === 'caves') setCavesKey(k => k + 1);
      else if (currentScene === 'tower') setTowerKey(k => k + 1);
    } else {
      setHearts(newHearts);
    }
  };

  const handleSceneComplete = (next: Scene, transKey: string, fragment: FragmentName, karmaChoice: KarmaChoice) => {
    setFragments(f => [...f, fragment]);
    const newChoices = [...karma.choices, karmaChoice];
    setKarma(k => ({ ...k, choices: newChoices }));
    goToScene(next, transKey);
  };

  const handleVictory = () => {
    // Calculate ending
    const choices = karma.choices;
    let ending: KarmaState['ending'] = 'explorador';
    const totalQ = (config.scenes.forest.questions?.length ?? 0) +
      (config.scenes.caves.questions?.length ?? 0) +
      (config.scenes.tower.questions?.length ?? 0);

    if (score.firstTry >= totalQ && seconds < 600) {
      ending = 'mestre';
    } else if (choices.length === 3 && choices.every(c => c === 'luz')) {
      ending = 'heroi';
    } else if (choices.length === 3 && choices.every(c => c === 'sombra')) {
      ending = 'sabio';
    }

    setKarma(k => ({ ...k, ending }));
    setScene('victory');
  };

  const assets = config.assets ?? {};

  return (
    <div className="fixed inset-0 bg-black">
      {/* HUD */}
      {scene !== 'intro' && scene !== 'victory' && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2"
          style={{ background: 'rgba(0,0,0,0.7)', borderBottom: '2px solid #222' }}>
          {/* Hearts */}
          <div className="flex gap-1">
            {Array.from({ length: 3 }, (_, i) => (
              <img
                key={i}
                src={i < hearts ? '/assets/ui/heart-full.png' : '/assets/ui/heart-empty.png'}
                alt={i < hearts ? 'vida' : 'vida perdida'}
                style={{ width: 20, height: 20, imageRendering: 'pixelated', filter: i >= hearts ? 'grayscale(1) brightness(0.5)' : undefined }}
              />
            ))}
          </div>

          {/* Fragments */}
          <div className="flex gap-2">
            {(['esmeralda', 'ambar', 'safira'] as FragmentName[]).map(frag => {
              const has = fragments.includes(frag);
              const filters: Record<FragmentName, string> = {
                esmeralda: 'hue-rotate(120deg) saturate(2)',
                ambar: 'hue-rotate(200deg) saturate(2) brightness(1.3)',
                safira: 'hue-rotate(240deg) saturate(1.5)',
              };
              return (
                <img
                  key={frag}
                  src="/assets/frags/frag-esmeralda.png"
                  alt={frag}
                  style={{
                    width: 18,
                    height: 18,
                    imageRendering: 'pixelated',
                    filter: has ? filters[frag] : 'grayscale(1) brightness(0.25)',
                  }}
                />
              );
            })}
          </div>

          {/* Timer */}
          <span className="font-vt text-white" style={{ fontSize: 20 }}>⏱ {formatted}</span>
        </div>
      )}

      {/* Scenes */}
      {scene === 'intro' && (
        <IntroScene
          bgImg={undefined}
          irisImg={assets.iris ? `/assets/chars/char-iris.png` : undefined}
          onComplete={() => goToScene('forest', 'intro→forest')}
        />
      )}

      {scene === 'transition' && (
        <TransitionScene
          lines={transitionLines}
          irisImg={assets.iris ? `/assets/chars/char-iris.png` : undefined}
          onComplete={handleTransitionComplete}
        />
      )}

      {scene === 'forest' && (
        <ForestScene
          key={forestKey}
          bgImg={assets.forest}
          treeImg="/assets/chars/char-tree.png"
          questions={config.scenes.forest.questions}
          narrative={config.scenes.forest.narrative}
          onCorrect={handleCorrect}
          onWrong={() => handleWrong('forest')}
          onComplete={(k) => handleSceneComplete('city', 'forest→city', 'esmeralda', k)}
        />
      )}

      {scene === 'city' && (
        <CityScene
          key={cityKey}
          bgImg={assets.city}
          cogImg="/assets/chars/char-cog.png"
          pairs={config.scenes.city.pairs}
          narrative={config.scenes.city.narrative}
          onCorrect={handleCorrect}
          onWrong={() => handleWrong('city')}
          onComplete={(k) => handleSceneComplete('caves', 'city→caves', 'ambar', k)}
        />
      )}

      {scene === 'caves' && (
        <CavesScene
          key={cavesKey}
          bgImg={assets.caves}
          celeneImg="/assets/chars/char-celene.png"
          questions={config.scenes.caves.questions}
          narrative={config.scenes.caves.narrative}
          onCorrect={handleCorrect}
          onWrong={() => handleWrong('caves')}
          onComplete={(k) => handleSceneComplete('tower', 'caves→tower', 'safira', k)}
        />
      )}

      {scene === 'tower' && (
        <TowerScene
          key={towerKey}
          bgImg={assets.tower}
          guardianImg="/assets/chars/char-guardian.png"
          questions={config.scenes.tower.questions}
          fragments={fragments}
          karma={karma}
          onCorrect={handleCorrect}
          onWrong={() => handleWrong('tower')}
          onComplete={handleVictory}
        />
      )}

      {scene === 'victory' && (
        <VictoryScene
          score={{ ...score, timeSeconds: seconds }}
          karma={karma}
          onPlayAgain={() => {
            setScene('intro');
            setHearts(3);
            setFragments([]);
            setKarma({ choices: [], ending: null });
            setScore({ firstTry: 0, total: 0 });
            setForestKey(k => k + 1);
            setCityKey(k => k + 1);
            setCavesKey(k => k + 1);
            setTowerKey(k => k + 1);
          }}
        />
      )}
    </div>
  );
}
