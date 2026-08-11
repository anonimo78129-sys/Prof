import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { buildScenes } from '../../game/buildScenes';
import { applyEffect, freshStats, type Mood, type Scene, type StatEffect, type Stats } from '../../game/cinzas';
import { saveCheckpoint, clearSave, recordSolved, recordError, recordEnding, getStats, recordDiscovery, getDiscoveries } from '../../game/progress';
import { playSfx, isMuted, setMuted, getVolume, setVolume, subscribeAudio } from '../../game/audio';
import { C, ART, ICON, bevel } from '../../game/theme';
import type { SharedQuiz } from '../../game/quizShare';

// Etapas da história, na ordem. Alimenta a barra de progresso: o jogador
// precisa saber onde está e quanto falta.
const ETAPAS = ['CAPÍTULO 1', 'CAPÍTULO 2', 'CAPÍTULO 3', 'CAPÍTULO 4', 'A ESCOLHA', 'EPÍLOGO'];

// Partícula ambiente por clima: cinza, brasa ou esporo
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
function Prose({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: C.paper, border: `2px solid ${C.paperEdge}`, boxShadow: bevel(3),
      padding: '13px 14px', ...style,
    }}>
      {children}
    </div>
  );
}

// Escolha da história: cartão de papel, do mesmo material do painel de
// narração, com um filete de ferrugem na lateral. Usa a MESMA fonte e o
// mesmo corpo do texto narrado, porque são frases inteiras: fonte de
// pixel serve para rótulo curto, não para texto corrido.
//
// Vale para decisão de enredo e para decisão de ciência, de propósito:
// olhando, não dá para dizer qual é qual.
function Choice({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  const [down, setDown] = useState(false);
  const [over, setOver] = useState(false);
  return (
    <button
      data-escolha
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerEnter={() => setOver(true)}
      onPointerLeave={() => { setDown(false); setOver(false); }}
      className="font-vt"
      style={{
        display: 'flex', alignItems: 'stretch', gap: 0, width: '100%', textAlign: 'left',
        background: over ? C.paper : '#ece2cc',
        border: `2px solid ${C.line}`,
        boxShadow: down ? 'none' : bevel(3),
        transform: down ? 'translate(3px, 3px)' : 'none',
        padding: 0, cursor: 'pointer', overflow: 'hidden',
        transition: 'transform 60ms, box-shadow 60ms, background 120ms',
      }}
    >
      <span style={{ flex: 'none', width: 6, background: C.rust }} />
      <span style={{
        flex: 1, padding: '10px 12px', fontSize: 17, lineHeight: 1.35, color: C.paperInk,
      }}>
        {children}
      </span>
    </button>
  );
}

// Ação de sistema (continuar, reiniciar, sair). Aqui sim cabe a fonte de
// pixel: são rótulos curtos, e o contraste separa da voz da história.
function Action({ children, onClick, tone = 'rust' }: {
  children: ReactNode; onClick: () => void; tone?: 'rust' | 'ghost';
}) {
  const [down, setDown] = useState(false);
  const bg = tone === 'rust' ? C.rust : C.shell;
  const top = tone === 'rust' ? C.rustLite : C.shellHi;
  return (
    <button
      data-acao
      onClick={onClick}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      className="font-pixel"
      style={{
        display: 'block', width: '100%', textAlign: 'center',
        fontSize: 10, letterSpacing: 1, color: '#fff', background: bg,
        border: `2px solid ${C.line}`, borderTop: `2px solid ${top}`,
        boxShadow: down ? 'none' : bevel(3),
        transform: down ? 'translate(3px, 3px)' : 'none',
        padding: '13px 10px', cursor: 'pointer',
        textShadow: '0 2px 0 rgba(0,0,0,0.4)',
        transition: 'transform 60ms, box-shadow 60ms',
      }}
    >
      {children}
    </button>
  );
}

// Painel de arte: crossfade entre cenários + partículas + protagonista
function ScenePanel({ art, mood, title, chapter, showHero, compact }: {
  art: string; mood: Mood; title: string; chapter: string; showHero: boolean; compact?: boolean;
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
      // Na hora de decidir, o cenário cede altura para as alternativas
      // caberem na tela. A cena continua visível, só mais baixa.
      position: 'relative', width: '100%', flex: 'none',
      aspectRatio: compact ? '180 / 62' : '180 / 100',
      transition: 'aspect-ratio 320ms ease',
      border: `2px solid ${C.line}`, overflow: 'hidden', background: C.shellLo,
    }}>
      {layers.map(src => (
        <img key={src} src={ART(src)} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          imageRendering: 'pixelated', objectFit: 'cover', objectPosition: 'center bottom',
          opacity: src === active ? 1 : 0, transition: 'opacity 700ms ease',
        }} />
      ))}

      {particles.map(pt => (
        <span key={pt.id} style={{
          position: 'absolute', top: '-4%', left: pt.left, width: 2, height: 2,
          background: p.color, opacity: 0.7, pointerEvents: 'none',
          animation: `scene-drift ${pt.dur} linear infinite`, animationDelay: pt.delay,
        }} />
      ))}

      {showHero && (
        <img src={ART('survivor')} alt="" style={{
          position: 'absolute', left: '50%', bottom: '10%',
          width: '8.9%', imageRendering: 'pixelated',
          transform: 'translateX(-50%)', animation: 'hero-bob 2.6s steps(2) infinite',
          filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.45))',
        }} />
      )}

      <div className="font-pixel" style={{
        position: 'absolute', top: 0, left: 0, fontSize: 7, color: '#fff',
        background: C.rust, borderRight: `2px solid ${C.line}`, borderBottom: `2px solid ${C.line}`,
        padding: '4px 8px', letterSpacing: 0.5,
      }}>
        {chapter}
      </div>

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

// Caderno de campo: guarda cada descoberta assim que ela acontece, para
// o jogador reler quando quiser. As que ainda não vieram aparecem como
// páginas em branco, o que mostra quanto falta sem entregar nada.
function Caderno({ scenes, onClose }: { scenes: Record<string, Scene>; onClose: () => void }) {
  const vistas = getDiscoveries();
  const paginas = Object.values(scenes).filter((sc): sc is Extract<Scene, { kind: 'challenge' }> => sc.kind === 'challenge');

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(6,5,10,0.82)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      zIndex: 60, padding: '16px 12px', overflowY: 'auto',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.paper, border: `2px solid ${C.line}`, boxShadow: bevel(4),
        width: '100%', maxWidth: 420,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.rust, borderBottom: `2px solid ${C.line}`, padding: '9px 10px',
        }}>
          <span className="font-pixel" style={{ fontSize: 9, color: '#fff', letterSpacing: 1 }}>
            CADERNO DE CAMPO
          </span>
          <div style={{ flex: 1 }} />
          <span className="font-pixel" style={{ fontSize: 8, color: '#fff', opacity: 0.85 }}>
            {vistas.length}/{paginas.length}
          </span>
          <IconBtn label="✕" onClick={onClose} title="Fechar o caderno" />
        </div>

        <div style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginas.map((pg, i) => {
            const aberta = vistas.includes(pg.id);
            return (
              <div key={pg.id} style={{
                border: `2px solid ${aberta ? C.paperEdge : 'rgba(93,83,66,0.3)'}`,
                background: aberta ? '#ece2cc' : 'transparent',
                padding: '9px 11px',
              }}>
                <div className="font-pixel" style={{
                  fontSize: 8, letterSpacing: 0.5, marginBottom: aberta ? 7 : 0,
                  color: aberta ? C.rust : 'rgba(93,83,66,0.55)',
                }}>
                  {aberta ? pg.title.toUpperCase() : `PÁGINA ${i + 1} EM BRANCO`}
                </div>
                {aberta && (
                  <p className="font-vt" style={{ fontSize: 17, lineHeight: 1.4, color: C.paperInk, margin: 0 }}>
                    {pg.hint}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
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

// Avisa que há conteúdo abaixo da dobra e some ao chegar ao fim. Sem
// isso, numa tela curta o jogador não vê a quarta alternativa e nem
// desconfia que ela existe.
function useTemMais(ref: React.RefObject<HTMLDivElement | null>, dep: unknown) {
  const [temMais, setTemMais] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setTemMais(el.scrollTop + el.clientHeight < el.scrollHeight - 28);
    medir();
    el.addEventListener('scroll', medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    const t = window.setTimeout(medir, 400);   // depois das transições
    return () => { el.removeEventListener('scroll', medir); ro.disconnect(); window.clearTimeout(t); };
  }, [ref, dep]);
  return temMais;
}

export default function SurvivalGame({ onExit, onRestart, continueFrom, quiz }: SurvivalGameProps) {
  const scenes = useMemo(() => buildScenes(quiz), [quiz]);
  const [sceneId, setSceneId] = useState(continueFrom?.sceneId ?? 'abrigo');
  // Os recursos continuam existindo e decidem o desfecho, mas ficam
  // ESCONDIDOS: quem joga sente a consequência na história, não numa barra.
  const [stats, setStats] = useState<Stats>(continueFrom?.stats ?? freshStats());
  const [showSettings, setShowSettings] = useState(false);
  const [showCaderno, setShowCaderno] = useState(false);
  const [muted, setMutedUi] = useState(isMuted());
  const [volume, setVolumeUi] = useState(getVolume());

  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeAudio(() => { setMutedUi(isMuted()); setVolumeUi(getVolume()); }), []);

  // Teclado, para quem joga no computador: 1 a 4 escolhem, Enter avança,
  // C abre o caderno e Esc fecha o que estiver aberto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowCaderno(false); setShowSettings(false); return; }
      if (showCaderno || showSettings) return;
      if (e.key.toLowerCase() === 'c') { setShowCaderno(true); return; }
      const n = Number(e.key);
      if (n >= 1 && n <= 4) {
        const alvo = document.querySelectorAll<HTMLButtonElement>('[data-escolha]')[n - 1];
        alvo?.click();
      }
      if (e.key === 'Enter') {
        document.querySelector<HTMLButtonElement>('[data-acao]')?.click();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCaderno, showSettings]);

  const resolve = (id: string, s: Stats): string => {
    let guard = 0;
    let cur = scenes[id], next = id;
    while (cur?.kind === 'router' && guard++ < 20) { next = cur.next(s); cur = scenes[next]; }
    return next;
  };

  const goTo = (id: string, s: Stats) => {
    setAnswered(false); setWasCorrect(false);
    setSceneId(resolve(id, s));
  };

  const scene: Scene = scenes[sceneId] ?? scenes.abrigo;

  useEffect(() => {
    if (scene.kind === 'narrative') saveCheckpoint(sceneId, statsRef.current);
    if (scene.kind === 'ending') { recordEnding(sceneId); clearSave(); }
  }, [sceneId]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = (effect: StatEffect | undefined, base: Stats) => {
    const next = applyEffect(base, effect);
    setStats(next);
    return next;
  };

  const handleChoice = (i: number) => {
    if (scene.kind !== 'narrative') return;
    playSfx('select');
    const choice = scene.choices[i];
    const next = apply(choice.effect, stats);
    goTo(choice.next(next), next);
  };

  const handleAnswer = (i: number) => {
    if (scene.kind !== 'challenge' || answered) return;
    const correct = i === scene.question.correct;
    playSfx(correct ? 'correct' : 'wrong');
    if (correct) recordSolved(); else recordError();
    recordDiscovery(scene.id);   // a explicação vai para o caderno, errando ou acertando
    apply(correct ? scene.effectCorrect : scene.effectWrong, stats);
    setWasCorrect(correct);
    setAnswered(true);
  };

  const restart = () => {
    clearSave();
    const fresh = freshStats();
    setStats(fresh);
    goTo('abrigo', fresh);
    onRestart?.();
  };

  const temMais = useTemMais(scrollRef, `${sceneId}-${answered}`);

  return (
    <div ref={scrollRef} style={{
      position: 'fixed', inset: 0, overflowY: 'auto', background: C.ink,
      display: 'flex', justifyContent: 'center', padding: '10px 10px 28px',
    }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* barra superior */}
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
          <IconBtn label="✎" onClick={() => setShowCaderno(true)} title="Caderno de campo" />
          <IconBtn label="⚙" onClick={() => setShowSettings(true)} title="Ajustes" />
          <IconBtn label="✕" onClick={onExit} title="Sair" />
        </div>

        {/* onde estou na história e quanto falta */}
        <div style={{ display: 'flex', gap: 3 }} aria-hidden>
          {ETAPAS.map((etapa, i) => {
            const atual = ETAPAS.indexOf(scene.chapter);
            return (
              <span key={etapa} style={{
                flex: 1, height: 4, border: `1px solid ${C.line}`,
                background: i <= atual ? C.rustGlow : 'rgba(255,255,255,0.08)',
                transition: 'background 400ms ease',
              }} />
            );
          })}
        </div>

        <ScenePanel
          art={scene.art}
          mood={scene.mood}
          chapter={scene.chapter}
          title={scene.title}
          showHero={scene.kind !== 'ending'}
          compact={scene.kind === 'narrative' || (scene.kind === 'challenge' && !answered)}
        />

        {scene.kind === 'ending' ? (
          <EndingCard scene={scene} onRestart={restart} onExit={onExit} />
        ) : scene.kind === 'challenge' ? (
          !answered ? (
            <>
              <Prose>
                <p className="font-vt" style={{
                  fontSize: 17, lineHeight: 1.35, color: C.paperSoft, margin: '0 0 9px',
                }}>
                  {scene.intro}
                </p>
                <p className="font-vt" style={{
                  fontSize: 19, lineHeight: 1.35, color: C.paperInk, margin: 0,
                  paddingTop: 9, borderTop: `2px solid ${C.paperEdge}`,
                }}>
                  {scene.question.text}
                </p>
              </Prose>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {scene.question.options.map((opt, i) => (
                  <Choice key={i} onClick={() => handleAnswer(i)}>{opt}</Choice>
                ))}
              </div>
            </>
          ) : (
            <>
              <Prose>
                <p className="font-vt" style={{ fontSize: 19, lineHeight: 1.4, color: C.paperInk, margin: '0 0 10px' }}>
                  {wasCorrect ? scene.correctText : scene.wrongText}
                </p>
                {/* a explicação entra como continuação da narração, sem
                    rótulo de matéria nem cara de gabarito */}
                <p className="font-vt" style={{
                  fontSize: 18, lineHeight: 1.45, color: C.paperSoft, margin: 0,
                  paddingLeft: 10, borderLeft: `3px solid ${wasCorrect ? C.green : C.rust}`,
                }}>
                  {scene.hint}
                </p>
              </Prose>
              <Action onClick={() => goTo(scene.next, statsRef.current)}>CONTINUAR</Action>
            </>
          )
        ) : scene.kind === 'narrative' ? (
          <>
            <Prose>
              <p className="font-vt" style={{ fontSize: 19, lineHeight: 1.4, color: C.paperInk, margin: 0 }}>
                {scene.text}
              </p>
            </Prose>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {scene.choices.map((c, i) => (
                <Choice key={i} onClick={() => handleChoice(i)}>{c.label}</Choice>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* dobra: puxa o olho para baixo enquanto sobrar conteúdo */}
      {temMais && (
        <button
          aria-label="Ver o resto da tela"
          onClick={() => scrollRef.current?.scrollBy({ top: 260, behavior: 'smooth' })}
          style={{
            position: 'fixed', left: '50%', bottom: 10, transform: 'translateX(-50%)',
            zIndex: 40, display: 'flex', alignItems: 'center', gap: 6,
            background: C.rust, color: '#fff', border: `2px solid ${C.line}`,
            boxShadow: bevel(3), padding: '6px 12px', cursor: 'pointer',
            animation: 'hint-bounce 1.6s ease-in-out infinite',
          }}
          className="font-pixel"
        >
          <span style={{ fontSize: 7, letterSpacing: 1 }}>MAIS ABAIXO</span>
          <span style={{ fontSize: 10, lineHeight: 1 }}>▾</span>
        </button>
      )}

      {showCaderno && <Caderno scenes={scenes} onClose={() => setShowCaderno(false)} />}

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

// ── epílogo ──────────────────────────────────────────────
function EndingCard({ scene, onRestart, onExit }: {
  scene: Extract<Scene, { kind: 'ending' }>; onRestart: () => void; onExit: () => void;
}) {
  const g = getStats();
  const total = g.solved + g.errors;

  return (
    <>
      <Prose style={{ textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, margin: '0 auto 8px', display: 'grid', placeItems: 'center',
          background: C.rust, border: `2px solid ${C.line}`, boxShadow: bevel(3),
        }}>
          {scene.icon && <img src={ICON(scene.icon)} alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />}
        </div>
        <h2 className="font-pixel" style={{ fontSize: 13, color: C.paperInk, margin: '8px 0 12px', lineHeight: 1.6 }}>
          {scene.title}
        </h2>
        <p className="font-vt" style={{ fontSize: 19, lineHeight: 1.45, color: C.paperInk, margin: 0, textAlign: 'left' }}>
          {scene.text}
        </p>
      </Prose>

      {/* único momento em que o jogo fala de acerto: a tela de resultado */}
      {total > 0 && (
        <div className="font-pixel" style={{
          background: C.shell, border: `2px solid ${C.line}`, boxShadow: bevel(3),
          padding: '10px 12px', fontSize: 7.5, color: C.boneDim, lineHeight: 1.9,
        }}>
          VOCÊ LEU CERTO {g.solved} DE {total} SINAIS DO MUNDO
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <Action onClick={onRestart}>JOGAR DE NOVO</Action>
        <Action tone="ghost" onClick={onExit}>VOLTAR AO INÍCIO</Action>
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
          <Action tone="ghost" onClick={onRestart}>REINICIAR HISTÓRIA</Action>
          <Action onClick={onClose}>FECHAR</Action>
        </div>
      </div>
    </div>
  );
}
