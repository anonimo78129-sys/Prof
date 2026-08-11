import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { buildScenes } from '../../game/buildScenes';
import { applyEffect, freshStats, type Mood, type Scene, type StatEffect, type Stats } from '../../game/cinzas';
import { saveCheckpoint, clearSave, recordSolved, recordError, recordEnding, getStats, medalFor } from '../../game/progress';
import { playSfx, isMuted, setMuted, getVolume, setVolume, subscribeAudio } from '../../game/audio';
import { C, STAT_SKINS, ART, ICON, bevel } from '../../game/theme';
import type { SharedQuiz } from '../../game/quizShare';

const LETTERS = ['A', 'B', 'C', 'D'];

// Partícula ambiente por clima: cinza cinzenta, brasa quente ou esporo tóxico
const PARTICLE: Record<Mood, { color: string; n: number }> = {
  dawn:   { color: '#e9dcc0', n: 12 },
  ash:    { color: '#d8ccae', n: 16 },
  danger: { color: '#d8ff6b', n: 18 },
  dusk:   { color: '#ffb07a', n: 12 },
  hope:   { color: '#fff0c0', n: 10 },
  bleak:  { color: '#aab3cc', n: 14 },
  settle: { color: '#ff9a3c', n: 12 },
};

// ─────────────────────────────────────────────────────────
// Peças de interface
// ─────────────────────────────────────────────────────────
function PixelPanel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: C.paper, border: `2px solid ${C.paperEdge}`, boxShadow: bevel(3),
      padding: 12, ...style,
    }}>
      {children}
    </div>
  );
}

function Button({ children, onClick, tone = 'steel', letter, disabled }: {
  children: ReactNode; onClick: () => void; tone?: 'steel' | 'rust' | 'green' | 'ghost';
  letter?: string; disabled?: boolean;
}) {
  const [down, setDown] = useState(false);
  const bg = tone === 'rust' ? C.rust : tone === 'green' ? C.green : tone === 'ghost' ? C.shellHi : C.steel;
  const dark = tone === 'rust' ? C.rustDark : tone === 'green' ? '#2f7a26' : tone === 'ghost' ? C.shellLo : C.steelDark;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      className="font-pixel"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        fontSize: 9.5, lineHeight: 1.55, color: '#fff', background: bg,
        border: `2px solid ${C.line}`, borderTop: `2px solid ${dark}`,
        boxShadow: down ? 'none' : bevel(3),
        transform: down ? 'translate(3px, 3px)' : 'none',
        padding: '11px 12px', cursor: disabled ? 'default' : 'pointer',
        transition: 'transform 60ms, box-shadow 60ms, filter 120ms',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {letter && (
        <span style={{
          flex: 'none', width: 18, height: 18, display: 'grid', placeItems: 'center',
          background: dark, border: `2px solid ${C.line}`, fontSize: 8,
        }}>{letter}</span>
      )}
      <span style={{ flex: 1 }}>{children}</span>
    </button>
  );
}

function StatCard({ skin, value, delta }: {
  skin: typeof STAT_SKINS[number]; value: number; delta?: number;
}) {
  const SEGMENTS = 8;
  const filled = Math.round((value / 100) * SEGMENTS);
  return (
    <div style={{
      position: 'relative', flex: 1, minWidth: 0,
      background: skin.bg, border: `2px solid ${skin.border}`, boxShadow: bevel(2),
      padding: '5px 5px 6px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div className="font-pixel" style={{
        fontSize: 5.5, color: skin.text, letterSpacing: 0.3, textAlign: 'center',
        whiteSpace: 'nowrap', overflow: 'hidden',
      }}>
        {skin.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <img src={ICON(skin.icon)} alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated', flex: 'none' }} />
        <span className="font-pixel" style={{ fontSize: 9, color: skin.text }}>{value}</span>
      </div>
      <div style={{ display: 'flex', gap: 1 }}>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span key={i} style={{
            flex: 1, height: 5,
            background: i < filled ? skin.fill : 'rgba(0,0,0,0.13)',
            transition: 'background 240ms ease',
          }} />
        ))}
      </div>
      {delta !== undefined && delta !== 0 && (
        <span key={`${value}-${delta}`} className="font-pixel" style={{
          position: 'absolute', top: -6, right: -2, fontSize: 8,
          color: '#fff', background: delta > 0 ? C.green : C.red,
          border: `2px solid ${C.line}`, padding: '2px 4px',
          animation: 'delta-float 1.4s ease-out forwards', pointerEvents: 'none',
        }}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
}

// Painel de arte: crossfade entre cenários + partículas + protagonista
function ScenePanel({ art, mood, title, chapter, showHero }: {
  art: string; mood: Mood; title: string; chapter: string; showHero: boolean;
}) {
  const [layers, setLayers] = useState<string[]>([art]);
  const [active, setActive] = useState(art);

  useEffect(() => {
    if (art === active) return;
    setLayers(l => (l.includes(art) ? l : [...l, art]));
    const t = window.setTimeout(() => setActive(art), 20);
    const cleanup = window.setTimeout(() => setLayers([art]), 900);
    return () => { window.clearTimeout(t); window.clearTimeout(cleanup); };
  }, [art]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = PARTICLE[mood];
  const particles = useMemo(() => Array.from({ length: p.n }, (_, i) => ({
    id: i,
    left: `${(i * 37 + 11) % 100}%`,
    dur: `${4 + ((i * 7) % 5)}s`,
    delay: `${-((i * 13) % 9)}s`,
  })), [mood]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '180 / 100', flex: 'none',
      border: `2px solid ${C.line}`, overflow: 'hidden', background: C.shellLo,
    }}>
      {layers.map(src => (
        <img key={src} src={ART(src)} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          imageRendering: 'pixelated', objectFit: 'cover',
          opacity: src === active ? 1 : 0, transition: 'opacity 700ms ease',
        }} />
      ))}

      {/* partículas ambientes */}
      {particles.map(pt => (
        <span key={pt.id} style={{
          position: 'absolute', top: '-4%', left: pt.left, width: 2, height: 2,
          background: p.color, opacity: 0.7, pointerEvents: 'none',
          animation: `scene-drift ${pt.dur} linear infinite`, animationDelay: pt.delay,
        }} />
      ))}

      {/* protagonista sobre a linha do chão (y=84 de 100) */}
      {showHero && (
        <img src={ART('survivor')} alt="" style={{
          position: 'absolute', left: '50%', bottom: '10%',
          width: '8.9%', imageRendering: 'pixelated',
          transform: 'translateX(-50%)', animation: 'hero-bob 2.6s steps(2) infinite',
          filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.45))',
        }} />
      )}

      {/* faixa do capítulo */}
      <div className="font-pixel" style={{
        position: 'absolute', top: 0, left: 0, fontSize: 7, color: '#fff',
        background: C.rust, borderRight: `2px solid ${C.line}`, borderBottom: `2px solid ${C.line}`,
        padding: '4px 8px', letterSpacing: 0.5,
      }}>
        {chapter}
      </div>

      {/* nome do local */}
      {title && (
        <div className="font-pixel" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: 7.5,
          color: C.bone, background: 'linear-gradient(to top, rgba(10,8,16,0.92), rgba(10,8,16,0))',
          padding: '12px 8px 5px', letterSpacing: 0.5,
        }}>
          {title}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
export interface SurvivalGameProps {
  onExit: () => void;
  onRestart?: () => void;
  continueFrom?: { sceneId: string; stats: Stats } | null;
  quiz?: SharedQuiz | null;
}

export default function SurvivalGame({ onExit, onRestart, continueFrom, quiz }: SurvivalGameProps) {
  const scenes = useMemo(() => buildScenes(quiz), [quiz]);
  const [sceneId, setSceneId] = useState(continueFrom?.sceneId ?? 'abrigo');
  const [stats, setStats] = useState<Stats>(continueFrom?.stats ?? freshStats());
  const [deltas, setDeltas] = useState<StatEffect>({});
  const [showSettings, setShowSettings] = useState(false);
  const [muted, setMutedUi] = useState(isMuted());
  const [volume, setVolumeUi] = useState(getVolume());

  // desafio
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => subscribeAudio(() => { setMutedUi(isMuted()); setVolumeUi(getVolume()); }), []);

  // atravessa nós 'router' (invisíveis) até a próxima cena de verdade
  const resolve = (id: string, s: Stats): string => {
    let guard = 0;
    let cur = scenes[id], next = id;
    while (cur?.kind === 'router' && guard++ < 20) { next = cur.next(s); cur = scenes[next]; }
    return next;
  };

  const goTo = (id: string, s: Stats) => {
    setAnswered(false); setSelected(null); setWasCorrect(false);
    setSceneId(resolve(id, s));
  };

  const scene: Scene = scenes[sceneId] ?? scenes.abrigo;

  useEffect(() => {
    if (scene.kind === 'narrative') saveCheckpoint(sceneId, statsRef.current);
    if (scene.kind === 'ending') { recordEnding(sceneId); clearSave(); }
  }, [sceneId]); // eslint-disable-line react-hooks/exhaustive-deps

  // aplica efeito nos recursos e mostra os "+5 / -3" flutuando nos cartões
  const applyWithFeedback = (effect: StatEffect | undefined, base: Stats) => {
    const next = applyEffect(base, effect);
    setStats(next);
    setDeltas(effect ?? {});
    window.setTimeout(() => setDeltas({}), 1500);
    return next;
  };

  const handleChoice = (i: number) => {
    if (scene.kind !== 'narrative') return;
    playSfx('select');
    const choice = scene.choices[i];
    const next = applyWithFeedback(choice.effect, stats);
    goTo(choice.next(next), next);
  };

  const handleAnswer = (i: number) => {
    if (scene.kind !== 'challenge' || answered) return;
    const correct = i === scene.question.correct;
    playSfx(correct ? 'correct' : 'wrong');
    if (correct) recordSolved(); else recordError();
    applyWithFeedback(correct ? scene.effectCorrect : scene.effectWrong, stats);
    setSelected(i); setWasCorrect(correct); setAnswered(true);
  };

  const restart = () => {
    clearSave();
    const fresh = freshStats();
    setStats(fresh);
    setDeltas({});
    goTo('abrigo', fresh);
    onRestart?.();
  };

  const showHero = scene.kind !== 'ending';

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: C.ink,
      display: 'flex', justifyContent: 'center', padding: '10px 10px 28px',
    }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* ── barra superior ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.shell, border: `2px solid ${C.line}`, boxShadow: bevel(3),
          padding: '7px 8px',
        }}>
          <span className="font-pixel" style={{ fontSize: 10, color: C.rustLite, letterSpacing: 1 }}>CINZAS</span>
          <span className="font-pixel" style={{
            fontSize: 7, color: '#fff', background: C.rust, border: `2px solid ${C.line}`, padding: '3px 6px',
          }}>
            DIA {String(scene.day).padStart(2, '0')}
          </span>
          <div style={{ flex: 1 }} />
          <IconBtn label="⚙" onClick={() => setShowSettings(true)} title="Ajustes" />
          <IconBtn label="✕" onClick={onExit} title="Sair" />
        </div>

        {/* ── recursos ── */}
        <div style={{ display: 'flex', gap: 5 }}>
          {STAT_SKINS.map(skin => (
            <StatCard key={skin.key} skin={skin} value={stats[skin.key]} delta={deltas[skin.key]} />
          ))}
        </div>

        {/* ── cenário ── */}
        <ScenePanel
          art={scene.art}
          mood={scene.mood}
          chapter={scene.chapter}
          title={scene.title}
          showHero={showHero}
        />

        {/* ── conteúdo ── */}
        {scene.kind === 'ending' ? (
          <EndingCard scene={scene} stats={stats} onRestart={restart} onExit={onExit} />
        ) : scene.kind === 'challenge' ? (
          <ChallengeCard
            scene={scene} answered={answered} selected={selected} wasCorrect={wasCorrect}
            onAnswer={handleAnswer}
            onContinue={() => goTo(scene.next, statsRef.current)}
          />
        ) : scene.kind === 'narrative' ? (
          <>
            <PixelPanel>
              <p className="font-vt" style={{ fontSize: 19, lineHeight: 1.4, color: C.paperInk, margin: 0 }}>
                {scene.text}
              </p>
            </PixelPanel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {scene.choices.map((c, i) => (
                <Button key={i} onClick={() => handleChoice(i)} letter={LETTERS[i]}>{c.label}</Button>
              ))}
            </div>
          </>
        ) : null}

        <p className="font-pixel" style={{ fontSize: 6.5, color: C.boneDim, textAlign: 'center', lineHeight: 1.8, marginTop: 2 }}>
          FICÇÃO INTERATIVA · BIOLOGIA
        </p>
      </div>

      {showSettings && (
        <Settings
          muted={muted} volume={volume}
          onClose={() => setShowSettings(false)}
          onRestart={() => { setShowSettings(false); restart(); }}
        />
      )}
    </div>
  );
}

function IconBtn({ label, onClick, title }: { label: string; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} style={{
      width: 24, height: 24, display: 'grid', placeItems: 'center',
      background: C.shellHi, border: `2px solid ${C.line}`, color: C.bone,
      fontSize: 12, lineHeight: 1, cursor: 'pointer', padding: 0,
    }}>
      {label}
    </button>
  );
}

// ── desafio de biologia ──────────────────────────────────
function ChallengeCard({ scene, answered, selected, wasCorrect, onAnswer, onContinue }: {
  scene: Extract<Scene, { kind: 'challenge' }>;
  answered: boolean; selected: number | null; wasCorrect: boolean;
  onAnswer: (i: number) => void; onContinue: () => void;
}) {
  return (
    <>
      {/* faixa do desafio */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: answered ? (wasCorrect ? C.green : C.red) : C.steel,
        border: `2px solid ${C.line}`, boxShadow: bevel(3), padding: '7px 9px',
      }}>
        {scene.icon && <img src={ICON(scene.icon)} alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />}
        <span className="font-pixel" style={{ fontSize: 8, color: '#fff', letterSpacing: 0.5 }}>
          {answered ? (wasCorrect ? 'RESPOSTA CORRETA' : 'NÃO FOI DESSA VEZ') : 'DESAFIO DE BIOLOGIA'}
        </span>
      </div>

      {!answered ? (
        <>
          <PixelPanel>
            <p className="font-vt" style={{ fontSize: 17, lineHeight: 1.35, color: C.paperSoft, margin: '0 0 9px', fontStyle: 'italic' }}>
              {scene.intro}
            </p>
            <p className="font-vt" style={{ fontSize: 20, lineHeight: 1.35, color: C.paperInk, margin: 0, fontWeight: 'bold' }}>
              {scene.question.text}
            </p>
          </PixelPanel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {scene.question.options.map((opt, i) => (
              <Button key={i} onClick={() => onAnswer(i)} letter={LETTERS[i]}>{opt}</Button>
            ))}
          </div>
        </>
      ) : (
        <>
          <PixelPanel>
            <p className="font-vt" style={{ fontSize: 19, lineHeight: 1.4, color: C.paperInk, margin: '0 0 10px' }}>
              {wasCorrect ? scene.correctText : scene.wrongText}
            </p>
            <div style={{ borderTop: `2px dashed ${C.paperEdge}`, paddingTop: 9 }}>
              <span className="font-pixel" style={{ fontSize: 7, color: C.steelDark, letterSpacing: 0.5 }}>
                POR QUE
              </span>
              <p className="font-vt" style={{ fontSize: 18, lineHeight: 1.4, color: C.paperSoft, margin: '6px 0 0' }}>
                {scene.hint}
              </p>
            </div>
          </PixelPanel>

          {/* gabarito: mostra a certa e, se errou, a marcada */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {scene.question.options.map((opt, i) => {
              const isRight = i === scene.question.correct;
              const isPicked = i === selected;
              if (!isRight && !isPicked) return null;
              return (
                <div key={i} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  background: isRight ? 'rgba(74,168,58,0.16)' : 'rgba(212,63,96,0.16)',
                  border: `2px solid ${isRight ? C.green : C.red}`, padding: '7px 8px',
                }}>
                  <span className="font-pixel" style={{
                    flex: 'none', fontSize: 6, letterSpacing: 0.4, color: '#fff',
                    background: isRight ? C.green : C.red, padding: '3px 5px',
                  }}>
                    {isRight ? 'CERTA' : 'SUA'}
                  </span>
                  <span className="font-vt" style={{
                    fontSize: 16, lineHeight: 1.3, color: isRight ? '#bdf0b0' : '#ffb3c0',
                  }}>{opt}</span>
                </div>
              );
            })}
          </div>

          <Button onClick={onContinue} tone="rust">CONTINUAR</Button>
        </>
      )}
    </>
  );
}

// ── epílogo ──────────────────────────────────────────────
function EndingCard({ scene, stats, onRestart, onExit }: {
  scene: Extract<Scene, { kind: 'ending' }>; stats: Stats; onRestart: () => void; onExit: () => void;
}) {
  const g = getStats();
  const medal = medalFor(g);
  const medalColor = medal === 'ouro' ? '#f0c840' : medal === 'prata' ? '#cfd8e6' : '#c98a5a';

  return (
    <>
      <PixelPanel style={{ textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, margin: '0 auto 8px', display: 'grid', placeItems: 'center',
          background: C.rust, border: `2px solid ${C.line}`, boxShadow: bevel(3),
        }}>
          {scene.icon && <img src={ICON(scene.icon)} alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />}
        </div>
        <h2 className="font-pixel" style={{ fontSize: 13, color: C.paperInk, margin: '8px 0 10px', lineHeight: 1.6 }}>
          {scene.title}
        </h2>
        <p className="font-vt" style={{ fontSize: 19, lineHeight: 1.4, color: C.paperInk, margin: 0 }}>
          {scene.text}
        </p>
      </PixelPanel>

      {/* balanço final */}
      <div style={{ background: C.shell, border: `2px solid ${C.line}`, boxShadow: bevel(3), padding: '10px 11px' }}>
        <div className="font-pixel" style={{ fontSize: 7, color: C.boneDim, letterSpacing: 0.5, marginBottom: 9 }}>
          BALANÇO FINAL
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {STAT_SKINS.map(skin => (
            <div key={skin.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <img src={ICON(skin.icon)} alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated', flex: 'none' }} />
              <span className="font-pixel" style={{ fontSize: 6, color: C.boneDim, width: 58, flex: 'none' }}>{skin.label}</span>
              <span style={{ flex: 1, height: 7, background: 'rgba(0,0,0,0.35)', border: `1px solid ${C.line}` }}>
                <span style={{ display: 'block', height: '100%', width: `${stats[skin.key]}%`, background: skin.fill }} />
              </span>
              <span className="font-pixel" style={{ fontSize: 8, color: C.bone, width: 20, textAlign: 'right', flex: 'none' }}>
                {stats[skin.key]}
              </span>
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 11, paddingTop: 9, borderTop: `2px solid ${C.shellHi}`,
        }}>
          <span className="font-pixel" style={{ fontSize: 7, color: C.boneDim }}>
            BIOLOGIA {g.solved}/{g.solved + g.errors}
          </span>
          <span className="font-pixel" style={{ fontSize: 8, color: medalColor }}>
            MEDALHA {medal.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <Button onClick={onRestart} tone="rust">JOGAR DE NOVO</Button>
        <Button onClick={onExit} tone="ghost">VOLTAR AO INÍCIO</Button>
      </div>
    </>
  );
}

// ── ajustes ──────────────────────────────────────────────
function Settings({ muted, volume, onClose, onRestart }: {
  muted: boolean; volume: number; onClose: () => void; onRestart: () => void;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(6,5,10,0.78)',
      display: 'grid', placeItems: 'center', zIndex: 50, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.shell, border: `2px solid ${C.line}`, boxShadow: bevel(4),
        padding: 18, width: '100%', maxWidth: 300,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="font-pixel" style={{ fontSize: 11, color: C.rustLite, margin: 0 }}>AJUSTES</h3>
          <div style={{ flex: 1 }} />
          <IconBtn label="✕" onClick={onClose} title="Fechar" />
        </div>

        <label className="font-pixel" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 8, color: C.bone, marginBottom: 8, cursor: 'pointer',
        }}>
          <span>SOM</span>
          <input type="checkbox" checked={!muted} onChange={e => setMuted(!e.target.checked)} />
        </label>
        <input
          type="range" min={0} max={1} step={0.05} value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          style={{ width: '100%', marginBottom: 18 }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <Button onClick={onRestart} tone="ghost">REINICIAR HISTÓRIA</Button>
          <Button onClick={onClose} tone="rust">FECHAR</Button>
        </div>
      </div>
    </div>
  );
}
