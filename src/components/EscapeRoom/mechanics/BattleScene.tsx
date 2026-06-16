import { useCallback, useEffect, useRef, useState } from 'react';
import type { EnemyDef, MCQuestion } from '../../../types/game';
import QuestionCard from './QuestionCard';
import AnimatedHero from './AnimatedHero';
import DialogBox from '../ui/DialogBox';

interface Props {
  enemy: EnemyDef;
  bg: string;
  questions: MCQuestion[];
  heroPortrait?: string;
  onVictory: (stars: number, coins: number) => void;
  onDefeat: () => void;
}

type Stage = 'intro' | 'fighting' | 'resolving' | 'won' | 'lost';

interface FloatText {
  id: number;
  text: string;
  color: string;
  big?: boolean;
  side: 'enemy' | 'hero';
  dx: number;
}

const HERO_HP = 3;

export default function BattleScene({ enemy, bg, questions, heroPortrait, onVictory, onDefeat }: Props) {
  const [stage, setStage] = useState<Stage>('intro');
  const [enemyHp, setEnemyHp] = useState(enemy.maxHp);
  const [heroHp, setHeroHp] = useState(HERO_HP);
  const [qi, setQi] = useState(0);
  const [streak, setStreak] = useState(0);
  const [coins, setCoins] = useState(0);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [enemyHurt, setEnemyHurt] = useState(false);
  const [heroHurt, setHeroHurt] = useState(false);
  const [enemyAtk, setEnemyAtk] = useState(false);
  const [slash, setSlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const floatId = useRef(0);
  const hpDamage = Math.ceil(enemy.maxHp / (enemy.isBoss ? 6 : 4));

  const pushFloat = useCallback((text: string, color: string, side: 'enemy' | 'hero', big = false) => {
    const id = floatId.current++;
    const dx = (Math.random() - 0.5) * 60;
    setFloats(f => [...f, { id, text, color, side, big, dx }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1100);
  }, []);

  const advance = () => {
    setBanner(null);
    setQi(i => (i + 1) % questions.length);
    setStage('fighting');
  };

  const handleAnswer = (answerIdx: number) => {
    if (stage !== 'fighting') return; // guard against double taps
    const correct = answerIdx === questions[qi].correct;
    setStage('resolving');

    if (correct) {
      const newStreak = streak + 1;
      const crit = newStreak >= 3;
      const dmg = crit ? Math.round(hpDamage * 1.7) : hpDamage;
      const gained = crit ? 12 : 7;
      const newHp = Math.max(0, enemyHp - dmg);

      setStreak(newStreak);
      setCoins(c => c + gained);
      setSlash(true);
      setTimeout(() => setSlash(false), 500);

      setTimeout(() => {
        setEnemyHp(newHp);
        setEnemyHurt(true);
        setShake(true);
        pushFloat(crit ? `CRÍTICO! -${dmg}` : `-${dmg}`, crit ? '#ffe14d' : '#ff5577', 'enemy', crit);
        if (crit) setBanner('GOLPE CRÍTICO!');
        setTimeout(() => { setEnemyHurt(false); setShake(false); }, 360);
        if (newHp <= 0) setTimeout(() => setStage('won'), 700);
        else setTimeout(advance, 950);
      }, 220);
    } else {
      const newHeroHp = Math.max(0, heroHp - 1);
      setStreak(0);

      setTimeout(() => {
        setEnemyAtk(true);
        setBanner(enemy.attackMsg);
        setTimeout(() => setEnemyAtk(false), 520);
        setTimeout(() => {
          setHeroHp(newHeroHp);
          setShake(true);
          setHeroHurt(true);
          pushFloat('-1 ♥', '#ff4444', 'hero');
          setTimeout(() => { setHeroHurt(false); setShake(false); }, 360);
          if (newHeroHp <= 0) setTimeout(() => setStage('lost'), 700);
          else setTimeout(advance, 950);
        }, 260);
      }, 200);
    }
  };

  useEffect(() => {
    if (stage === 'won') {
      const stars = heroHp >= 3 ? 3 : heroHp === 2 ? 2 : 1;
      const bonus = 25 + stars * 10;
      const t = setTimeout(() => onVictory(stars, coins + bonus), 1700);
      return () => clearTimeout(t);
    }
    if (stage === 'lost') {
      const t = setTimeout(() => onDefeat(), 1900);
      return () => clearTimeout(t);
    }
  }, [stage, heroHp, coins, onVictory, onDefeat]);

  const enemyPct = (enemyHp / enemy.maxHp) * 100;

  return (
    <div
      className={`fixed inset-0 scene-fade-in overflow-hidden ${shake ? 'screen-shake' : ''}`}
      style={{ background: `url(${bg}) center/cover no-repeat` }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(0,0,0,0.42)' }} />

      {/* Enemy HP bar */}
      {stage !== 'intro' && (
        <div className="absolute left-0 right-0 flex flex-col items-center px-6" style={{ top: 64 }}>
          <div className="flex items-center justify-between w-full max-w-sm mb-1">
            <span className="font-pixel" style={{ color: enemy.color, fontSize: 8, textShadow: '0 2px 0 #000' }}>
              {enemy.name}
            </span>
            <span className="font-vt" style={{ color: '#fff', fontSize: 16 }}>{enemyHp}/{enemy.maxHp}</span>
          </div>
          <div className="w-full max-w-sm" style={{ height: 14, background: '#1a0a0a', border: '2px solid #000', boxShadow: '0 0 0 2px #444' }}>
            <div style={{
              height: '100%',
              width: `${enemyPct}%`,
              background: enemyPct > 50 ? 'linear-gradient(#ff6b6b,#c92a2a)' : enemyPct > 25 ? 'linear-gradient(#ffb84d,#e67700)' : 'linear-gradient(#ff8787,#a00)',
              transition: 'width 0.45s cubic-bezier(.2,1,.3,1)',
            }} />
          </div>
        </div>
      )}

      {/* Enemy sprite */}
      <div className="absolute left-0 right-0 flex justify-center" style={{ top: enemy.isBoss ? 96 : 120 }}>
        <div className="relative" style={{ animation: stage === 'intro' ? 'enemy-enter 700ms ease-out' : undefined }}>
          <img
            src={enemy.sprite}
            alt={enemy.name}
            className={`${enemyHurt ? 'enemy-hurt' : ''} ${enemyAtk ? 'enemy-attack' : ''}`}
            style={{
              width: enemy.size,
              imageRendering: 'pixelated',
              filter: `drop-shadow(0 8px 10px rgba(0,0,0,0.6)) ${enemyHurt ? 'brightness(3) saturate(0)' : ''}`,
              animationFillMode: 'forwards',
            }}
          />
          {/* idle shadow */}
          <div className="absolute left-1/2" style={{ bottom: -6, transform: 'translateX(-50%)', width: enemy.size * 0.6, height: 10, background: 'rgba(0,0,0,0.4)', borderRadius: '50%', filter: 'blur(3px)' }} />
          {/* slash effect */}
          {slash && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="slash-fx" style={{ fontSize: enemy.size * 0.7 }}>⚔️</div>
            </div>
          )}
          {/* enemy floats */}
          {floats.filter(f => f.side === 'enemy').map(f => (
            <div key={f.id} className="absolute left-1/2 top-1/3 pointer-events-none float-dmg font-pixel"
              style={{ color: f.color, fontSize: f.big ? 13 : 10, transform: `translateX(${f.dx}px)`, textShadow: '0 2px 0 #000', whiteSpace: 'nowrap' }}>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Crit / attack banner */}
      {banner && stage === 'resolving' && (
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none" style={{ top: '46%' }}>
          <p className="font-pixel banner-pop text-center px-4" style={{ color: '#ffe14d', fontSize: 11, textShadow: '0 2px 0 #000, 0 0 12px rgba(0,0,0,0.8)' }}>
            {banner}
          </p>
        </div>
      )}

      {/* Hero area — shown during battle (fighting + resolving) */}
      {(stage === 'fighting' || stage === 'resolving') && (
        <div className="absolute left-0 right-0 flex flex-col items-center" style={{ bottom: stage === 'fighting' ? 200 : 24 }}>
          <div className="relative flex flex-col items-center">
            <div className={`relative ${heroHurt ? 'hero-hurt' : ''}`}>
              <AnimatedHero scale={2.2} hurt={heroHurt} />
              {floats.filter(f => f.side === 'hero').map(f => (
                <div key={f.id} className="absolute top-0 left-1/2 pointer-events-none float-dmg font-pixel"
                  style={{ color: f.color, fontSize: 11, textShadow: '0 2px 0 #000', transform: 'translateX(-50%)' }}>
                  {f.text}
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: HERO_HP }, (_, i) => (
                <img
                  key={i}
                  src={i < heroHp ? '/assets/ui/heart-full.png' : '/assets/ui/heart-empty.png'}
                  alt={i < heroHp ? 'coração' : 'vazio'}
                  style={{ width: 26, height: 26, imageRendering: 'pixelated' }}
                />
              ))}
            </div>
            {streak >= 2 && (
              <p className="font-pixel mt-1" style={{ color: '#ffb84d', fontSize: 7 }}>🔥 SEQUÊNCIA x{streak}</p>
            )}
          </div>
        </div>
      )}

      {/* Coins counter */}
      {stage !== 'intro' && (
        <div className="absolute flex items-center gap-1" style={{ top: 64, right: 12 }}>
          <img src="/assets/objects/coin1.png" alt="moedas" style={{ width: 18, imageRendering: 'pixelated' }} />
          <span className="font-pixel" style={{ color: '#ffd700', fontSize: 9, textShadow: '0 2px 0 #000' }}>{coins}</span>
        </div>
      )}

      {/* INTRO overlay */}
      {stage === 'intro' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 gap-5" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <img src={enemy.sprite} alt={enemy.name} className="battle-idle" style={{ width: enemy.size, imageRendering: 'pixelated', filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.7))' }} />
          <p className="font-pixel text-center" style={{ color: enemy.color, fontSize: 9, lineHeight: 1.8, textShadow: '0 2px 0 #000' }}>{enemy.title}</p>
          <p className="font-pixel text-center text-white" style={{ fontSize: 14, textShadow: '0 0 16px ' + enemy.color }}>{enemy.name}</p>
          <div className="w-full max-w-xs">
            <DialogBox
              portrait={enemy.sprite}
              name={enemy.name}
              text={`"${enemy.taunt}"`}
              accentColor={enemy.color}
            />
          </div>
          <button onClick={() => setStage('fighting')} className="btn-pixel px-8 py-4" style={{ background: enemy.color, color: '#000', fontSize: 10 }}>
            ⚔️ LUTAR
          </button>
          <p className="font-vt text-center" style={{ color: '#bbb', fontSize: 15 }}>
            Acerte para atacar. Erre e perde um coração.
          </p>
        </div>
      )}

      {/* WON overlay */}
      {stage === 'won' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 scene-fade-in" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <p className="font-pixel banner-pop" style={{ color: '#ffd700', fontSize: 18, textShadow: '0 0 20px #ffd700' }}>VITÓRIA!</p>
          <p className="font-vt text-white" style={{ fontSize: 20 }}>{enemy.name} foi derrotado!</p>
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} style={{ fontSize: 34, filter: i < (heroHp >= 3 ? 3 : heroHp === 2 ? 2 : 1) ? 'none' : 'grayscale(1) brightness(0.4)' }}>⭐</span>
            ))}
          </div>
        </div>
      )}

      {/* LOST overlay */}
      {stage === 'lost' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 scene-fade-in" style={{ background: 'rgba(40,0,0,0.78)' }}>
          <p className="font-pixel" style={{ color: '#ff4444', fontSize: 16, textShadow: '0 0 16px #ff0000' }}>DERROTADO</p>
          <p className="font-vt text-white text-center px-8" style={{ fontSize: 20 }}>O Éter te empurra de volta... tente novamente!</p>
        </div>
      )}

      {/* Question */}
      {stage === 'fighting' && questions.length > 0 && (
        <QuestionCard
          key={qi}
          question={questions[qi]}
          onAnswer={handleAnswer}
          sceneColor={enemy.color}
        />
      )}
    </div>
  );
}
