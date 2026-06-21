import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Beat, SceneBg, Speaker } from '../../game/types';
import { ACT1 } from '../../game/script';

const FLOOR = 300;           // faixa reservada no rodapé p/ a caixa de texto e botões
const GROUND = 34;           // altura do chão dentro do mundo (acima da faixa FLOOR)
const HERO_LIFT = -5;        // ajuste fino vertical só do herói (acima do chão)
const GATE_AHEAD = 24;       // o portão para um pouco à frente de onde o herói chega
const WALK_SPEED = 230;      // px/seg que o herói anda

// ─────────────────────────────────────────────────────────
// Áudio — "voz" da floresta (tons pentatônicos, sempre harmônicos)
// AudioContext criado preguiçosamente e retomado após um gesto do usuário.
// ─────────────────────────────────────────────────────────
let _actx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_actx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      _actx = new AC();
    }
    if (_actx.state === 'suspended') void _actx.resume();
    return _actx;
  } catch { return null; }
}
function playTone(freq: number, dur = 0.5, type: OscillatorType = 'sine', gain = 0.16) {
  const ctx = audioCtx(); if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}
// Dó maior pentatônica (C D E G A) — qualquer combinação soa agradável
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0];
function playChord(freqs: number[], dur = 1.6, gain = 0.1) {
  freqs.forEach(f => playTone(f, dur, 'triangle', gain));
}

// Pré-carrega todas as imagens dos props/layers no início para
// evitar que apareçam "achatadas" ao entrar no viewport.
function ImagePreloader() {
  const srcs = [
    '/assets/world/ground-dark.png',
    '/assets/world/cloud1.png', '/assets/world/cloud2.png', '/assets/world/cloud3.png',
    '/assets/world/gate-closed.png', '/assets/world/gate-half.png', '/assets/world/gate-open.png',
    '/assets/tallforest/gate-closed.png', '/assets/tallforest/gate-open.png',
    '/assets/world/boulder.png',
    '/assets/ato3/apple.png',
    '/assets/ato3/estufa-ext.png', '/assets/ato3/estufa-light.png',
    '/assets/estufa/bg.jpg',
    '/assets/estufa/reflect-1.png', '/assets/estufa/reflect-2.png',
    '/assets/estufa/trunk-1.png', '/assets/estufa/trunk-2.png',
    '/assets/estufa/computer-off.png', '/assets/estufa/computer-on.png',
    '/assets/scenes/pantano.jpg', '/assets/scenes/corredor.jpg', '/assets/scenes/final.jpg',
    '/assets/ato3/sky.png',
    '/assets/ato3/mountain-back.png', '/assets/ato3/mountain-front.png',
    '/assets/ato3/tree-teal.png', '/assets/ato3/trees-green.png',
    ...SCENERY.map(p => `/assets/${p.src}`),
    ...FOREST_LAYERS.map(l => `/assets/forest/${l.src}`),
    '/assets/forest/Layer_0002_7_c.png',
    '/assets/forest/Layer_0003_6_c.png',
    `/assets/forest/${FOREST_FOREGROUND.src}`,
    '/assets/tallforest/back.png', '/assets/tallforest/far.png', '/assets/tallforest/middle.png',
    '/assets/chars/player-walk-1.png', '/assets/chars/player-walk-2.png', '/assets/chars/player-walk-3.png',
    '/assets/chars/player-idle-1.png', '/assets/chars/player-idle-2.png',
    '/assets/chars/wakeup-1.png', '/assets/chars/wakeup-2.png', '/assets/chars/wakeup-3.png', '/assets/chars/wakeup-4.png',
  ];
  return (
    <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[...new Set(srcs)].map(src => <img key={src} src={src} alt="" />)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Caixa de diálogo com efeito máquina de escrever
// ─────────────────────────────────────────────────────────
const SPEAKER_NAME: Record<Speaker, string> = {
  narrador: '',
  estudante: 'Estudante',
  corujao: 'Prof. Corujão',
};

function DialogueBox({
  who, text, onNext, last,
}: { who: Speaker; text: string; onNext: () => void; last?: boolean }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown(''); setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, 28);
    return () => clearInterval(id);
  }, [text]);

  const tap = () => { if (!done) { setShown(text); setDone(true); } else onNext(); };
  const name = SPEAKER_NAME[who];

  return (
    <div onPointerDown={(e) => { e.preventDefault(); tap(); }} onContextMenu={(e) => e.preventDefault()}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 100, zIndex: 40, cursor: 'pointer' }}>
      <div className="panel-pixel"
        style={{ margin: '0 14px 18px', background: 'rgba(8,24,12,0.94)', padding: '16px 18px', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
        {who === 'corujao' && (
          <img src="/assets/portraits/owl.png" alt="Prof. Corujão"
            style={{ position: 'absolute', top: -54, left: 8, width: 64, height: 64, imageRendering: 'pixelated' }} />
        )}
        {name && (
          <p className="font-pixel" style={{ color: who === 'corujao' ? '#ffd54a' : '#88ff66', fontSize: 9, marginBottom: 8 }}>
            {name}
          </p>
        )}
        <p className="font-vt" style={{
          color: '#eaf6e0', fontSize: 22, lineHeight: 1.35,
          fontStyle: who === 'narrador' ? 'italic' : 'normal',
          minHeight: 30,
        }}>
          {shown}
        </p>
        {done && (
          <p className="font-pixel" style={{ color: '#7fae7a', fontSize: 8, textAlign: 'right', marginTop: 6 }}>
            {last ? '✦' : '▶'} toque
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Beat de pergunta: intro → opções → (acerto: falas) / (erro: Corujão)
// ─────────────────────────────────────────────────────────
function QuestionBeat({ beat, onSolved, onCorrect }: { beat: Extract<Beat, { t: 'question' }>; onSolved: () => void; onCorrect: () => void }) {
  type Phase = 'intro' | 'asking' | 'wrong' | 'success';
  const [phase, setPhase] = useState<Phase>(beat.intro ? 'intro' : 'asking');
  const [successIdx, setSuccessIdx] = useState(0);

  if (phase === 'intro' && beat.intro) {
    return <DialogueBox who="narrador" text={beat.intro} onNext={() => setPhase('asking')} />;
  }

  if (phase === 'wrong') {
    return (
      <DialogueBox who="corujao"
        text={beat.hint ?? 'Pense com calma, jovem. A natureza sempre dá uma pista.'}
        onNext={() => setPhase('asking')} />
    );
  }

  if (phase === 'success') {
    const line = beat.success[successIdx] ?? '';
    const last = successIdx >= beat.success.length - 1;
    return (
      <DialogueBox who="estudante" text={line} last={last}
        onNext={() => { if (last) onSolved(); else setSuccessIdx(i => i + 1); }} />
    );
  }

  // phase === 'asking'
  const answer = (i: number) => {
    if (i === beat.q.correct) { setSuccessIdx(0); onCorrect(); setPhase('success'); }
    else setPhase('wrong');
  };
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 100, zIndex: 40 }}>
      <div className="panel-pixel"
        style={{ margin: '0 14px 18px', background: 'rgba(8,24,12,0.95)', padding: '16px 18px', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
        <p className="font-vt" style={{ color: '#eaf6e0', fontSize: 21, lineHeight: 1.3, marginBottom: 14 }}>
          {beat.q.text}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {beat.q.options.map((opt, i) => (
            <button key={i} onPointerDown={(e) => { e.preventDefault(); answer(i); }} onContextMenu={(e) => e.preventDefault()}
              className="font-vt"
              style={{
                textAlign: 'left', padding: '10px 14px', fontSize: 18,
                color: '#eaf6e0', background: 'rgba(30,70,38,0.9)',
                border: '2px solid #2f6b34', borderRadius: 6, cursor: 'pointer',
                touchAction: 'none',
              } as CSSProperties}>
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Beat de pareamento: dois grupos de cards para conectar
// ─────────────────────────────────────────────────────────
function MatchBeat({ beat, onSolved, onCorrect }: { beat: Extract<Beat, { t: 'match' }>; onSolved: () => void; onCorrect: () => void }) {
  type Phase = 'intro' | 'matching' | 'wrong' | 'success';
  const [phase, setPhase] = useState<Phase>(beat.intro ? 'intro' : 'matching');
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [successIdx, setSuccessIdx] = useState(0);

  // embaralha a coluna direita uma única vez
  const rightOrder = useMemo(() => {
    const idx = beat.pairs.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'intro' && beat.intro) {
    return <DialogueBox who="narrador" text={beat.intro} onNext={() => setPhase('matching')} />;
  }
  if (phase === 'wrong') {
    return (
      <DialogueBox who="corujao"
        text={beat.hint ?? 'Observe com atenção. Cada parte tem um papel único na planta.'}
        onNext={() => { setSelectedLeft(null); setPhase('matching'); }} />
    );
  }
  if (phase === 'success') {
    const line = beat.success[successIdx] ?? '';
    const last = successIdx >= beat.success.length - 1;
    return (
      <DialogueBox who="estudante" text={line} last={last}
        onNext={() => { if (last) onSolved(); else setSuccessIdx(i => i + 1); }} />
    );
  }

  const pickLeft = (i: number) => {
    if (matched.has(i)) return;
    setSelectedLeft(prev => prev === i ? null : i);
  };

  const pickRight = (rightIdx: number) => {
    const pairIdx = rightOrder[rightIdx];
    if (matched.has(pairIdx) || selectedLeft === null) return;
    if (selectedLeft === pairIdx) {
      const next = new Set(matched); next.add(pairIdx);
      setMatched(next); setSelectedLeft(null);
      if (next.size === beat.pairs.length) { onCorrect(); setSuccessIdx(0); setPhase('success'); }
    } else {
      setPhase('wrong');
    }
  };

  const cardStyle = (active: boolean, done: boolean): CSSProperties => ({
    padding: '10px 12px', fontSize: 17, textAlign: 'left', borderRadius: 6,
    cursor: done ? 'default' : 'pointer', touchAction: 'none',
    color:       done ? '#4aff88' : active ? '#ffe070' : '#eaf6e0',
    background:  done ? 'rgba(20,80,20,0.9)' : active ? 'rgba(80,60,10,0.9)' : 'rgba(30,70,38,0.9)',
    border: `2px solid ${done ? '#4aff88' : active ? '#ffe070' : '#2f6b34'}`,
    transition: 'border-color 0.15s, background 0.15s',
  });

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 100, zIndex: 40 }}>
      <div className="panel-pixel"
        style={{ margin: '0 14px 18px', background: 'rgba(8,24,12,0.95)', padding: '16px 18px', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
        <p className="font-pixel" style={{ color: '#9ad08f', fontSize: 9, marginBottom: 12, letterSpacing: 2 }}>
          CONECTE CADA PARTE À SUA FUNÇÃO
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {/* coluna esquerda — partes da planta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {beat.pairs.map((pair, i) => (
              <button key={i}
                onPointerDown={(e) => { e.preventDefault(); pickLeft(i); }}
                onContextMenu={(e) => e.preventDefault()}
                className="font-vt"
                style={cardStyle(selectedLeft === i, matched.has(i))}>
                {matched.has(i) ? '✓ ' : selectedLeft === i ? '▶ ' : ''}{pair.left}
              </button>
            ))}
          </div>
          {/* coluna direita — funções embaralhadas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rightOrder.map((pairIdx, i) => (
              <button key={i}
                onPointerDown={(e) => { e.preventDefault(); pickRight(i); }}
                onContextMenu={(e) => e.preventDefault()}
                className="font-vt"
                style={cardStyle(false, matched.has(pairIdx))}>
                {matched.has(pairIdx) ? '✓ ' : ''}{beat.pairs[pairIdx].right}
              </button>
            ))}
          </div>
        </div>
        {selectedLeft !== null && (
          <p className="font-pixel" style={{ color: '#7fae7a', fontSize: 8, marginTop: 10, textAlign: 'center' }}>
            ▶ agora toque na função correspondente →
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Beat de coleta: 5 maçãs saem de trás da árvore e flutuam na tela
// ─────────────────────────────────────────────────────────
function CollectBeat({ beat, onSolved, onCorrect }: { beat: Extract<Beat, { t: 'collect' }>; onSolved: () => void; onCorrect: () => void }) {
  type Phase = 'intro' | 'collecting' | 'wrong' | 'success';
  const [phase, setPhase] = useState<Phase>(beat.intro ? 'intro' : 'collecting');
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const collectedRef = useRef<Set<number>>(new Set());
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [successIdx, setSuccessIdx] = useState(0);

  const correctCount = beat.items.filter(i => i.correct).length;

  // Posições espalhadas na tela; ox/oy = deslocamento da pos. final até a árvore (~60% left, ~28% top)
  const appleData = useMemo(() => {
    const SLOTS = [
      { left: '9%',  top: '22%', ox: '50vw',  oy: '6vh',  floatDur: '3.8s', floatPhase: '-0.5s',  delay: '0.05s' },
      { left: '28%', top: '10%', ox: '32vw',  oy: '18vh', floatDur: '4.3s', floatPhase: '-1.8s',  delay: '0.22s' },
      { left: '50%', top: '6%',  ox: '10vw',  oy: '22vh', floatDur: '3.5s', floatPhase: '-0.9s',  delay: '0.38s' },
      { left: '72%', top: '13%', ox: '-12vw', oy: '15vh', floatDur: '4.1s', floatPhase: '-2.4s',  delay: '0.14s' },
      { left: '87%', top: '25%', ox: '-28vw', oy: '3vh',  floatDur: '3.9s', floatPhase: '-1.3s',  delay: '0.29s' },
    ];
    return beat.items.slice(0, 5).map((item, i) => ({ ...item, id: i, ...SLOTS[i] }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'intro' && beat.intro)
    return <DialogueBox who="narrador" text={beat.intro} onNext={() => setPhase('collecting')} />;
  if (phase === 'wrong')
    return <DialogueBox who="corujao"
      text={beat.hint ?? 'Dispersão é como a semente viaja longe da planta mãe.'}
      onNext={() => setPhase('collecting')} />;
  if (phase === 'success') {
    const line = beat.success[successIdx] ?? '';
    const last = successIdx >= beat.success.length - 1;
    return <DialogueBox who="estudante" text={line} last={last}
      onNext={() => { if (last) onSolved(); else setSuccessIdx(i => i + 1); }} />;
  }

  const tap = (item: typeof appleData[0]) => {
    if (collectedRef.current.has(item.id) || popped.has(item.id)) return;
    if (item.correct) {
      setPopped(p => new Set(p).add(item.id));
      setTimeout(() => {
        // Usa ref para contagem síncrona — React 18 batelha setState mesmo em setTimeout,
        // então o updater só roda no próximo render, nunca sincronamente.
        const next = new Set(collectedRef.current).add(item.id);
        collectedRef.current = next;
        setCollected(new Set(next));
        if (next.size === correctCount) {
          onCorrect();
          setSuccessIdx(0);
          setPhase('success');
        }
      }, 400);
    } else {
      setPhase('wrong');
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none' }}>
      {/* instrução na base, acima do FLOOR; texto pode quebrar em telas pequenas */}
      <div className="font-pixel" style={{
        position: 'absolute', bottom: 112, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(8,24,12,0.92)', border: '1px solid #2f6b34',
        padding: '7px 14px', borderRadius: 6, color: '#eaf6e0',
        fontSize: 9, letterSpacing: 1, textAlign: 'center', maxWidth: 320, zIndex: 35,
      }}>
        {beat.instruction}<br />{collected.size}/{correctCount}
      </div>

      {/* 5 maçãs: div externo faz o emerge da árvore; div interno flutua levemente */}
      {appleData.map(apple => {
        const done = collected.has(apple.id);
        const popping = popped.has(apple.id) && !done;
        if (done) return null;

        // flutuação começa depois que o emerge termina (0.75s + delay de stagger)
        const floatStart = `calc(0.75s + ${apple.delay} + ${apple.floatPhase})`;

        return (
          <div
            key={apple.id}
            onPointerDown={(e) => { e.preventDefault(); tap(apple); }}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: 'absolute', left: apple.left, top: apple.top,
              ['--ox' as string]: apple.ox, ['--oy' as string]: apple.oy,
              animation: popping
                ? 'apple-pop 0.4s ease-out forwards'
                : `apple-emerge 0.75s cubic-bezier(0.1,1.3,0.4,1) ${apple.delay} both`,
              pointerEvents: 'auto', cursor: 'pointer', zIndex: 32, touchAction: 'none',
            }}>
            {/* filho: flutuação independente do emerge */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              animation: popping ? undefined : `apple-float ${apple.floatDur} ease-in-out ${floatStart} infinite`,
            }}>
              <img src="/assets/ato3/apple.png" alt={apple.label}
                style={{ height: 56, width: 'auto', imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))' }} />
              <div className="font-pixel" style={{
                background: 'rgba(8,24,12,0.88)', color: '#eaf6e0',
                fontSize: 8, padding: '3px 8px', borderRadius: 4,
                border: '1px solid #2f6b34', whiteSpace: 'nowrap',
              }}>
                {apple.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ATO 5 — Sequência: ordene as etapas (ciclo de vida) p/ formar a ponte
// ─────────────────────────────────────────────────────────
function SequenceBeat({ beat, onSolved, onCorrect }: { beat: Extract<Beat, { t: 'sequence' }>; onSolved: () => void; onCorrect: () => void }) {
  type Phase = 'intro' | 'playing' | 'wrong' | 'success';
  const [phase, setPhase] = useState<Phase>(beat.intro ? 'intro' : 'playing');
  const [successIdx, setSuccessIdx] = useState(0);
  const [progress, setProgress] = useState(0);     // quantos passos já encaixados na ordem
  const [shake, setShake] = useState<number | null>(null);

  // chips embaralhados (idx = posição correta no ciclo)
  const shuffled = useMemo(() => {
    const arr = beat.steps.map((label, idx) => ({ label, idx }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [beat.steps]);

  if (phase === 'intro' && beat.intro)
    return <DialogueBox who="narrador" text={beat.intro} onNext={() => setPhase('playing')} />;
  if (phase === 'wrong')
    return <DialogueBox who="corujao" text={beat.hint ?? 'Pense na ordem do ciclo...'} onNext={() => { setProgress(0); setPhase('playing'); }} />;
  if (phase === 'success') {
    const line = beat.success[successIdx] ?? '';
    const last = successIdx >= beat.success.length - 1;
    return <DialogueBox who="estudante" text={line} last={last}
      onNext={() => { if (last) onSolved(); else setSuccessIdx(i => i + 1); }} />;
  }

  const tap = (chip: { label: string; idx: number }) => {
    if (chip.idx < progress) return;          // já encaixado
    if (chip.idx === progress) {
      const np = progress + 1;
      setProgress(np);
      if (np === beat.steps.length) { onCorrect(); setSuccessIdx(0); setTimeout(() => setPhase('success'), 700); }
    } else {
      setShake(chip.idx);
      setTimeout(() => { setShake(null); setPhase('wrong'); }, 480);
    }
  };

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 92, zIndex: 40, padding: '0 14px' }}>
      {/* trilha de vitórias-régias (pedras que acendem) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
        {beat.steps.map((_, i) => (
          <div key={i} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: i < progress ? 'radial-gradient(circle,#9dffb0,#1f9c3a)' : 'rgba(8,26,14,0.75)',
            border: i < progress ? '2px solid #d6ffe0' : '2px solid #2a5a32',
            boxShadow: i < progress ? '0 0 16px rgba(0,255,110,0.8)' : 'none',
            transition: 'all .3s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>{i < progress ? '🪷' : '·'}</div>
        ))}
      </div>
      <div className="panel-pixel" style={{ background: 'rgba(8,24,12,0.94)', padding: '12px 14px', maxWidth: 560, margin: '0 auto' }}>
        <p className="font-pixel" style={{ color: '#88ff66', fontSize: 9, marginBottom: 12, textAlign: 'center', lineHeight: 1.5 }}>{beat.instruction}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {shuffled.map(chip => {
            const placed = chip.idx < progress;
            return (
              <button key={chip.idx} onPointerDown={(e) => { e.preventDefault(); tap(chip); }} disabled={placed}
                className="font-vt"
                style={{
                  fontSize: 18, padding: '10px 14px', borderRadius: 8, cursor: placed ? 'default' : 'pointer',
                  color: placed ? '#5a8a5a' : '#eaf6e0',
                  background: placed ? 'rgba(20,50,26,0.6)' : 'rgba(30,70,38,0.95)',
                  border: shake === chip.idx ? '2px solid #ff5a5a' : '2px solid #3a8a42',
                  opacity: placed ? 0.35 : 1,
                  animation: shake === chip.idx ? 'boulder-shake 0.13s ease-in-out infinite' : undefined,
                  touchAction: 'none',
                } as CSSProperties}>
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ATO 6 — Memória (Simon): a floresta "fala" por luz e som.
// Nós em arco ligados a um núcleo (Consciência Verde) por filamentos
// de fungos que pulsam quando o sinal viaja. Cada nó tem um tom.
// ─────────────────────────────────────────────────────────
const NODE_COLORS = ['#37f0a8', '#48c6ff', '#ffd24a', '#ff7ad0', '#b78cff'];

function MemoryBeat({ beat, onSolved, onCorrect }: { beat: Extract<Beat, { t: 'memory' }>; onSolved: () => void; onCorrect: () => void }) {
  type Phase = 'intro' | 'watch' | 'repeat' | 'wrong' | 'success';
  const [phase, setPhase] = useState<Phase>(beat.intro ? 'intro' : 'watch');
  const [successIdx, setSuccessIdx] = useState(0);
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [active, setActive] = useState<number | null>(null);   // nó aceso agora (watch ou tap)
  const [fireId, setFireId] = useState(0);                     // remonta o anel a cada disparo
  const [inputIdx, setInputIdx] = useState(0);
  const [toast, setToast] = useState<string | null>(null);     // "Sinal reconhecido!"
  const LEN0 = 3;
  const N = beat.nodes.length;

  // posições dos nós num arco suave (espaço 0..100)
  const pos = useMemo(() => beat.nodes.map((_, i) => {
    const t = N === 1 ? 0.5 : i / (N - 1);
    return { x: 15 + t * 70, y: 42 - Math.sin(t * Math.PI) * 20 };
  }), [beat.nodes, N]);
  const core = { x: 50, y: 74 };

  const fire = (k: number, withSound = true) => {
    setActive(k); setFireId(f => f + 1);
    if (withSound) playTone(PENTA[k % PENTA.length], 0.5, 'sine', 0.16);
  };

  // toca a sequência da rodada quando entra em 'watch'
  useEffect(() => {
    if (phase !== 'watch') return;
    const len = LEN0 + round;
    const s = Array.from({ length: len }, () => Math.floor(Math.random() * N));
    setSeq(s); setInputIdx(0); setActive(null);
    const onMs = Math.max(300, 460 - round * 50);   // acende
    const gapMs = Math.max(360, 560 - round * 60);  // intervalo
    const timers: number[] = [];
    let i = 0;
    const step = () => {
      if (i >= s.length) { timers.push(window.setTimeout(() => { setActive(null); setPhase('repeat'); }, 320)); return; }
      fire(s[i]);
      timers.push(window.setTimeout(() => setActive(null), onMs));
      timers.push(window.setTimeout(() => { i++; step(); }, gapMs + onMs));
    };
    timers.push(window.setTimeout(step, 700));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, N]);

  if (phase === 'intro' && beat.intro)
    return <DialogueBox who="narrador" text={beat.intro} onNext={() => { audioCtx(); setPhase('watch'); }} />;
  if (phase === 'wrong')
    return <DialogueBox who="corujao" text={beat.hint ?? 'Repita na mesma ordem em que os nós acenderam.'} onNext={() => setPhase('watch')} />;
  if (phase === 'success') {
    const line = beat.success[successIdx] ?? '';
    const last = successIdx >= beat.success.length - 1;
    return <DialogueBox who="estudante" text={line} last={last}
      onNext={() => { if (last) onSolved(); else setSuccessIdx(i => i + 1); }} />;
  }

  const tapNode = (k: number) => {
    if (phase !== 'repeat') return;
    fire(k);
    if (k === seq[inputIdx]) {
      const ni = inputIdx + 1;
      if (ni === seq.length) {
        if (round + 1 >= beat.rounds) {
          onCorrect(); setSuccessIdx(0);
          playChord([PENTA[0], PENTA[2], PENTA[4]], 1.4, 0.1);
          setTimeout(() => setPhase('success'), 650);
        } else {
          setToast('✓ Sinal reconhecido');
          setTimeout(() => { setToast(null); setRound(r => r + 1); setPhase('watch'); }, 1100);
        }
      } else setInputIdx(ni);
    } else {
      playTone(120, 0.4, 'sawtooth', 0.12);
      setTimeout(() => setPhase('wrong'), 320);
    }
  };

  const watching = phase === 'watch';
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR, zIndex: 42, overflow: 'hidden' }}>
      {/* filamentos de fungo (SVG distorcido) ligando o núcleo aos nós */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {pos.map((p, k) => {
          const lit = active === k;
          return (
            <line key={k} x1={core.x} y1={core.y} x2={p.x} y2={p.y}
              stroke={lit ? NODE_COLORS[k % NODE_COLORS.length] : '#2f6b54'}
              strokeWidth={lit ? 0.8 : 0.35}
              strokeLinecap="round"
              opacity={lit ? 0.95 : 0.4}
              style={{ transition: 'all .2s', filter: lit ? `drop-shadow(0 0 3px ${NODE_COLORS[k % NODE_COLORS.length]})` : undefined }} />
          );
        })}
      </svg>

      {/* núcleo — Consciência Verde */}
      <div style={{
        position: 'absolute', left: `${core.x}%`, top: `${core.y}%`, transform: 'translate(-50%,-50%)',
        width: 46, height: 46, borderRadius: '50%',
        background: 'radial-gradient(circle, #d8ffe6, #1f9c5a 70%)',
        boxShadow: '0 0 24px rgba(40,255,150,0.7), 0 0 60px rgba(20,200,110,0.4)',
        animation: 'breathe-glow 3s ease-in-out infinite', pointerEvents: 'none',
      }} />

      {/* nós luminosos */}
      {beat.nodes.map((label, k) => {
        const lit = active === k;
        const color = NODE_COLORS[k % NODE_COLORS.length];
        return (
          <div key={k} style={{ position: 'absolute', left: `${pos[k].x}%`, top: `${pos[k].y}%`, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button onPointerDown={(e) => { e.preventDefault(); tapNode(k); }} disabled={watching}
              style={{
                position: 'relative', width: 66, height: 66, borderRadius: '50%', cursor: watching ? 'default' : 'pointer',
                background: lit ? `radial-gradient(circle, #fff, ${color})` : 'rgba(6,18,26,0.5)',
                border: `3px solid ${color}`,
                boxShadow: lit ? `0 0 30px ${color}, 0 0 64px ${color}` : `0 0 12px ${color}66`,
                transform: lit ? 'scale(1.12)' : 'scale(1)',
                transition: lit ? 'none' : 'all .25s', touchAction: 'none',
              } as CSSProperties}>
              {lit && <span key={fireId} style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `2px solid ${color}`, animation: 'node-ripple .6s ease-out forwards', pointerEvents: 'none' }} />}
            </button>
            <span className="font-pixel" style={{ fontSize: 8, color: lit ? '#fff' : '#9ad0c8', textShadow: '0 1px 3px #000' }}>{label}</span>
          </div>
        );
      })}

      {/* toast de rodada */}
      {toast && (
        <div className="font-pixel" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', color: '#37f0a8', fontSize: 13, textShadow: '0 2px 8px #000', animation: 'pop-in .4s ease-out' }}>
          {toast}
        </div>
      )}

      {/* faixa de instrução */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, display: 'flex', justifyContent: 'center' }}>
        <div className="panel-pixel" style={{ background: 'rgba(6,16,24,0.92)', padding: '11px 18px', maxWidth: 440, textAlign: 'center' }}>
          <p className="font-pixel" style={{ fontSize: 9, color: watching ? '#ffd24a' : '#40e0d0', marginBottom: 6 }}>
            {watching ? '✦ A floresta está falando... observe' : '▶ Repita o canto da floresta'}
          </p>
          <p className="font-pixel" style={{ fontSize: 8, color: '#7fae9a' }}>
            Rodada {round + 1} de {beat.rounds}{!watching && ` · ${inputIdx}/${seq.length}`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ATO 7 — Árvore da Vida: SVG que cresce por estágios (0 semente → 4 florida)
// ─────────────────────────────────────────────────────────
function GrowingTree({ stage }: { stage: number }) {
  const show = (s: number) => stage >= s;
  return (
    <svg viewBox="0 0 200 240" width="270" height="324" style={{ overflow: 'visible', filter: show(3) ? 'drop-shadow(0 0 26px rgba(60,255,150,0.55))' : 'none', transition: 'filter .8s' }}>
      <defs>
        <radialGradient id="tl-leaf" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#c8ffb6" /><stop offset="55%" stopColor="#42d156" /><stop offset="100%" stopColor="#1d8a34" />
        </radialGradient>
        <linearGradient id="tl-bark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5a3a1f" /><stop offset="50%" stopColor="#8a5a30" /><stop offset="100%" stopColor="#4f3219" />
        </linearGradient>
      </defs>
      {/* solo */}
      <ellipse cx="100" cy="228" rx="64" ry="12" fill="#241708" opacity="0.85" />
      {/* semente */}
      <ellipse cx="100" cy="214" rx="9" ry="12" fill="#d2a85e"
        style={{ opacity: stage === 0 ? 1 : 0, transition: 'opacity .4s' }} />
      {/* tronco — cresce em altura */}
      <g style={{ transform: `scaleY(${show(1) ? 1 : 0})`, transformOrigin: '100px 226px', transition: 'transform .8s cubic-bezier(.2,.8,.3,1)' }}>
        <path d="M93,226 Q96,150 100,118 Q104,150 107,226 Z" fill="url(#tl-bark)" />
        {/* galhos */}
        <g style={{ opacity: show(2) ? 1 : 0, transition: 'opacity .6s .25s' }}>
          <path d="M100,152 Q80,136 64,120" stroke="url(#tl-bark)" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M100,142 Q120,128 138,114" stroke="url(#tl-bark)" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M100,126 Q93,108 93,92" stroke="url(#tl-bark)" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </g>
      {/* copa */}
      <g style={{ opacity: show(3) ? 1 : 0, transform: show(3) ? 'scale(1)' : 'scale(0.15)', transformOrigin: '100px 96px', transition: 'all .7s cubic-bezier(.2,.9,.3,1.2)' }}>
        <circle cx="100" cy="86" r="36" fill="url(#tl-leaf)" />
        <circle cx="66" cy="108" r="25" fill="url(#tl-leaf)" />
        <circle cx="136" cy="106" r="25" fill="url(#tl-leaf)" />
        <circle cx="82" cy="72" r="21" fill="url(#tl-leaf)" />
        <circle cx="120" cy="74" r="21" fill="url(#tl-leaf)" />
      </g>
      {/* flores / frutos brilhantes */}
      <g style={{ opacity: show(4) ? 1 : 0, transition: 'opacity .6s' }}>
        {[[100, 74], [76, 96], [126, 94], [90, 62], [118, 64], [58, 106], [142, 104], [100, 100]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.2" fill={i % 2 ? '#ffd9ec' : '#fff39a'} style={{ filter: 'drop-shadow(0 0 4px #fff)' }} />
        ))}
      </g>
    </svg>
  );
}

// explosão de pétalas/luz quando a árvore floresce
function BloomBurst() {
  const s = (n: number) => { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
  const cols = ['#fff39a', '#ffd9ec', '#c8ffb6', '#bff0ff', '#fff'];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 44, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 52%, rgba(255,247,200,0.85), transparent 60%)', animation: 'flash-bloom 1.4s ease-out forwards' }} />
      {Array.from({ length: 34 }, (_, i) => {
        const ang = (i / 34) * Math.PI * 2 + s(i) * 0.6;
        const dist = 120 + s(i * 3) * 260;
        const size = 4 + s(i * 5) * 7;
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '52%', width: size, height: size, borderRadius: '50%',
            background: cols[i % cols.length], boxShadow: `0 0 8px ${cols[i % cols.length]}`,
            animation: `burst ${1.3 + s(i * 7) * 1.2}s ease-out ${s(i * 11) * 0.2}s forwards`,
            ['--bx' as string]: `${Math.cos(ang) * dist}px`,
            ['--by' as string]: `${Math.sin(ang) * dist}px`,
          } as CSSProperties} />
        );
      })}
    </div>
  );
}

// fim sombrio: escurecimento + cinzas caindo + uma última brasa de esperança
function Withering({ showEmber }: { showEmber: boolean }) {
  const s = (n: number) => { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 39, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#05060a', animation: 'fade-in-dark 4s ease forwards' }} />
      {Array.from({ length: 26 }, (_, i) => {
        const size = 2 + s(i * 3) * 4;
        return (
          <div key={i} style={{
            position: 'absolute', left: `${s(i * 7) * 100}%`, top: '-6%',
            width: size, height: size, borderRadius: '50%', background: 'rgba(150,150,150,0.5)',
            animation: `ash-fall ${6 + s(i * 11) * 6}s linear ${-s(i * 17) * 8}s infinite`,
            ['--ax' as string]: `${(s(i * 13) - 0.5) * 80}px`,
          } as CSSProperties} />
        );
      })}
      {showEmber && (
        <div style={{ position: 'absolute', left: '50%', bottom: '34%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle,#ffd9a0,#ff7a18)', boxShadow: '0 0 16px rgba(255,140,40,0.9)', animation: 'breathe-glow 2.4s ease-in-out infinite' }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ATO 7 — A Escolha: decisão final com dois desfechos cinematográficos
// ─────────────────────────────────────────────────────────
function ChoiceBeat({ beat, onSolved }: { beat: Extract<Beat, { t: 'choice' }>; onSolved: () => void }) {
  type Phase = 'intro' | 'deciding' | 'planting' | 'ending';
  const [phase, setPhase] = useState<Phase>(beat.intro ? 'intro' : 'deciding');
  const [chosen, setChosen] = useState<Extract<Beat, { t: 'choice' }>['options'][number] | null>(null);
  const [endIdx, setEndIdx] = useState(0);
  const [stage, setStage] = useState(0);      // crescimento da árvore 0..4
  const [started, setStarted] = useState(false);
  const [bloom, setBloom] = useState(false);

  if (phase === 'intro' && beat.intro)
    return <DialogueBox who="narrador" text={beat.intro} onNext={() => { audioCtx(); setPhase('deciding'); }} />;

  if (phase === 'deciding') {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 120 }}>
        {/* a última semente, flutuando */}
        <div style={{ position: 'absolute', top: '26%', left: '50%', transform: 'translateX(-50%)', fontSize: 46, filter: 'drop-shadow(0 0 18px rgba(255,230,150,0.9))', animation: 'hint-bob 2.4s ease-in-out infinite' }}>🌰</div>
        <p className="font-vt" style={{ color: '#fff', fontSize: 25, textAlign: 'center', textShadow: '0 2px 12px #000', marginBottom: 26, padding: '0 26px', lineHeight: 1.3 }}>{beat.prompt}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 340, padding: '0 24px' }}>
          {beat.options.map(opt => (
            <button key={opt.label} onPointerDown={(e) => { e.preventDefault(); audioCtx(); setChosen(opt); setEndIdx(0); setStage(0); setStarted(false); setBloom(false); setPhase(opt.tone === 'luz' ? 'planting' : 'ending'); if (opt.tone === 'sombra') playTone(110, 0.8, 'sawtooth', 0.1); }}
              className="font-pixel"
              style={{
                fontSize: 12, padding: '17px 12px', borderRadius: 10, cursor: 'pointer', lineHeight: 1.4,
                color: opt.tone === 'luz' ? '#0a2010' : '#f0dee6',
                background: opt.tone === 'luz' ? 'linear-gradient(to bottom,#7be04a,#2f9410)' : 'linear-gradient(to bottom,#5a3a4a,#2a1820)',
                border: opt.tone === 'luz' ? '3px solid #d6ffe0' : '3px solid #6a4a5a',
                boxShadow: opt.tone === 'luz' ? '0 0 22px rgba(0,255,100,0.5)' : '0 4px 0 #1a0e14',
                touchAction: 'none',
              } as CSSProperties}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'planting') {
    const plant = () => {
      if (started) return;
      setStarted(true);
      // crescimento cinemático com tons ascendentes
      const stamps: Array<[number, number]> = [[1, 200], [2, 950], [3, 1750], [4, 2550]];
      stamps.forEach(([st, ms]) => setTimeout(() => { setStage(st); playTone(PENTA[st - 1], 0.6, 'sine', 0.14); }, ms));
      setTimeout(() => { setBloom(true); playChord([PENTA[0], PENTA[2], PENTA[4], PENTA[4] * 2], 2.2, 0.1); }, 2650);
      setTimeout(() => { setEndIdx(0); setPhase('ending'); }, 5200);
    };
    return (
      <div onPointerDown={(e) => { e.preventDefault(); plant(); }}
        style={{ position: 'absolute', inset: 0, zIndex: 42, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: started ? 'default' : 'pointer' }}>
        {bloom && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(255,247,210,0.45), transparent 65%)', animation: 'sky-brighten 2.5s ease-out forwards', pointerEvents: 'none' }} />}
        <GrowingTree stage={stage} />
        {bloom && <BloomBurst />}
        <p className="font-pixel" style={{ color: '#eaffe0', fontSize: 11, marginTop: 26, textShadow: '0 2px 6px #000', zIndex: 45, animation: 'hint-bob 1.1s ease-in-out infinite', opacity: started ? (bloom ? 1 : 0) : 1, transition: 'opacity .5s' }}>
          {!started ? 'toque para plantar a última semente' : bloom ? '✦ A vida encontra um caminho ✦' : ''}
        </p>
      </div>
    );
  }

  // ending
  const sombra = chosen!.tone === 'sombra';
  const line = chosen!.ending[endIdx] ?? '';
  const last = endIdx >= chosen!.ending.length - 1;
  return (
    <>
      {sombra
        ? <Withering showEmber={endIdx >= chosen!.ending.length - 1} />
        : (
          <>
            <div style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'radial-gradient(circle at 50% 45%, rgba(255,247,210,0.28), transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '34%', zIndex: 40, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
              <GrowingTree stage={4} />
            </div>
          </>
        )}
      <DialogueBox who="narrador" text={line} last={last}
        onNext={() => { if (last) onSolved(); else setEndIdx(i => i + 1); }} />
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Partículas atmosféricas das cenas finais
// ─────────────────────────────────────────────────────────
function SceneParticles({ kind }: { kind: 'pantano' | 'final' }) {
  const cfg = kind === 'pantano'
    ? { count: 11, grad: 'radial-gradient(circle,#d4ffb0,#7ac850)', glow: 'rgba(150,255,120,0.6)' }
    : { count: 22, grad: 'radial-gradient(circle,#fff6d0,#ffcf57)', glow: 'rgba(255,200,80,0.7)' };
  const s = (n: number) => { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>
      {kind === 'pantano' && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%',
          background: 'linear-gradient(to top, rgba(110,170,120,0.4), transparent)',
          animation: 'light-pulse-dark 5s ease-in-out infinite' }} />
      )}
      {Array.from({ length: cfg.count }, (_, i) => {
        const size = 2 + s(i * 3) * 4;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${s(i * 7) * 100}%`,
            [kind === 'pantano' ? 'bottom' : 'top']: `${s(i * 23) * (kind === 'pantano' ? 42 : 90)}%`,
            width: size, height: size, borderRadius: '50%',
            background: cfg.grad, boxShadow: `0 0 8px ${cfg.glow}`,
            animation: `mote-float ${7 + s(i * 11) * 7}s ease-in-out ${-s(i * 17) * 9}s infinite`,
            ['--mx' as string]: `${(s(i * 13) > 0.5 ? 1 : -1) * (15 + s(i * 19) * 40)}px`,
          } as CSSProperties} />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Mundo com parallax
// ─────────────────────────────────────────────────────────
// Cenário espalhado pelo mundo: árvores ao fundo (atrás do herói) e
// arbustos/pedras em primeiro plano (na frente). `f` = fator de parallax.
interface Prop { src: string; wx: number; f: number; h: number; b: number; z: number; flip?: boolean; sway?: boolean; glow?: boolean }

// Flora mágica espalhada pelo mundo. `glow` adiciona um halo turquesa.
// Plantas/cogumelos da floresta encantada — algumas atrás do herói (z<14),
// outras em primeiro plano (14<z<20, na frente do herói mas atrás da grama z=20).
// Toda a flora assenta na mesma linha de chão do personagem (b ≈ GROUND - 4).
// A profundidade vem do tamanho + parallax + z (atrás/à frente do herói).
const FLORA_B = GROUND - 4;
const FLORA_B_BACK = FLORA_B + 10;  // plantas das camadas de trás ficam 10px mais altas
const SCENERY: Prop[] = [
  // ── fundo profundo (entre as camadas da floresta) ──
  { src: 'flora/glow-grass.png',    wx: 260,  f: 0.5,  h: 12, b: FLORA_B_BACK, z: 4, glow: true },
  { src: 'flora/flower-blue.png',   wx: 560,  f: 0.55, h: 14, b: FLORA_B_BACK, z: 4, glow: true },
  { src: 'flora/shroom-big.png',    wx: 900,  f: 0.6,  h: 13, b: FLORA_B_BACK, z: 5, glow: true, flip: true },
  { src: 'flora/flower-purple.png', wx: 1240, f: 0.52, h: 14, b: FLORA_B_BACK, z: 4, glow: true },
  { src: 'flora/shroom-small.png',  wx: 1560, f: 0.58, h: 10, b: FLORA_B_BACK, z: 5, glow: true },
  { src: 'flora/glow-grass.png',    wx: 1900, f: 0.5,  h: 12, b: FLORA_B_BACK, z: 4, glow: true, flip: true },

  // ── atrás do herói (mais ao fundo) ──
  { src: 'flora/glow-grass.png',    wx: 180,  f: 0.92, h: 20, b: FLORA_B_BACK, z: 8,  glow: true },
  { src: 'flora/flower-blue.png',   wx: 430,  f: 0.95, h: 28, b: FLORA_B_BACK, z: 8,  glow: true },
  { src: 'flora/shroom-big.png',    wx: 700,  f: 0.96, h: 22, b: FLORA_B_BACK, z: 9,  glow: true, flip: true },
  { src: 'flora/flower-purple.png', wx: 1020, f: 0.94, h: 26, b: FLORA_B_BACK, z: 8,  glow: true },
  { src: 'flora/glow-grass.png',    wx: 1320, f: 0.93, h: 18, b: FLORA_B_BACK, z: 9,  glow: true },
  { src: 'flora/shroom-small.png',  wx: 1600, f: 0.95, h: 14, b: FLORA_B_BACK, z: 9,  glow: true },
  { src: 'flora/flower-tulip.png',  wx: 1880, f: 0.95, h: 23, b: FLORA_B_BACK, z: 8,  glow: true },

  // ── na frente do herói (primeiro plano) ──
  { src: 'flora/shroom-big.png',    wx: 320,  f: 1.04, h: 38, b: FLORA_B, z: 16, glow: true },
  { src: 'flora/glow-grass.png',    wx: 600,  f: 1.06, h: 32, b: FLORA_B, z: 17, glow: true, flip: true },
  { src: 'flora/flower-purple.png', wx: 880,  f: 1.05, h: 42, b: FLORA_B, z: 16, glow: true },
  { src: 'flora/shroom-small.png',  wx: 1180, f: 1.05, h: 21, b: FLORA_B, z: 17, glow: true, flip: true },
  { src: 'flora/flower-blue.png',   wx: 1480, f: 1.06, h: 40, b: FLORA_B, z: 16, glow: true },
  { src: 'flora/flower-tulip.png',  wx: 1760, f: 1.05, h: 34, b: FLORA_B, z: 17, glow: true },
  { src: 'flora/glow-grass.png',    wx: 2060, f: 1.06, h: 31, b: FLORA_B, z: 16, glow: true },
];

// Camadas do pack "Free Pixel Art Forest" (Eder Muniz), de trás → frente.
// A última camada (Layer_0000_9 = grama/mato) vai NA FRENTE do herói.
const FOREST_LAYERS: { src: string; f: number }[] = [
  { src: 'Layer_0011_0.png',      f: 0.04 },  // céu (fundo)
  { src: 'Layer_0010_1.png',      f: 0.09 },
  { src: 'Layer_0009_2.png',      f: 0.15 },
  { src: 'Layer_0008_3.png',      f: 0.22 },
  { src: 'Layer_0007_Lights.png', f: 0.28 },  // raios de luz
  { src: 'Layer_0006_4.png',      f: 0.36 },
  { src: 'Layer_0005_5.png',      f: 0.46 },
  { src: 'Layer_0004_Lights.png', f: 0.54 },  // raios de luz
  { src: 'Layer_0003_6.png',      f: 0.64 },
  { src: 'Layer_0002_7.png',      f: 0.76 },
  { src: 'Layer_0001_8.png',      f: 0.90 },
];

// Variante da clareira (Ato 2): mesmas camadas com Layer_0003_6 e Layer_0002_7 trocados
const CLAREIRA_LAYERS = FOREST_LAYERS.map(l => {
  if (l.src === 'Layer_0003_6.png') return { ...l, src: 'Layer_0003_6_c.png' };
  if (l.src === 'Layer_0002_7.png') return { ...l, src: 'Layer_0002_7_c.png' };
  return l;
});
const FOREST_FOREGROUND = { src: 'Layer_0000_9.png', f: 1.06 }; // grama na frente do herói

function PropImg({ p, worldX }: { p: Prop; worldX: number }) {
  const screenX = Math.round(p.wx - worldX * p.f);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 900;
  // não renderiza se estiver completamente fora do viewport
  if (screenX > vw + p.h || screenX < -(p.h * 2)) return null;
  const glow = p.glow
    ? 'drop-shadow(0 0 4px rgba(64,224,208,0.85)) drop-shadow(0 0 10px rgba(64,224,208,0.55)) drop-shadow(0 0 18px rgba(48,200,210,0.35)) '
    : '';
  // balanço suave com duração/atraso variados por posição (sem sincronizar)
  const dur = 3.4 + (p.wx % 5) * 0.45;
  const delay = (p.wx % 7) * 0.4;
  return (
    <div style={{ position: 'absolute', left: screenX, bottom: p.b, zIndex: p.z, transform: p.flip ? 'scaleX(-1)' : undefined, transformOrigin: 'bottom center' }}>
      <img src={`/assets/${p.src}`} alt=""
        style={{
          height: p.h, width: 'auto', display: 'block', imageRendering: 'pixelated',
          filter: `${glow}drop-shadow(0 6px 6px rgba(0,0,0,0.32))`,
          transformOrigin: 'bottom center',
          animation: `flora-sway ${dur.toFixed(2)}s ease-in-out ${delay.toFixed(2)}s infinite`,
        }} />
    </div>
  );
}

function LightMotes() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 16 }, (_, i) => {
        const s = (n: number) => { const x = Math.sin((i + 1) * n) * 10000; return x - Math.floor(x); };
        const size = 2 + s(3) * 3;
        return (
          <div key={i} style={{
            position: 'absolute', left: `${s(7) * 100}%`, bottom: `${s(13) * 60}%`,
            width: size, height: size, borderRadius: 9,
            background: 'radial-gradient(circle, #b6fff4, rgba(64,224,208,0.25))',
            boxShadow: '0 0 6px 2px rgba(64,224,208,0.6)',
            ['--mx' as string]: `${(s(19) > 0.5 ? 1 : -1) * (10 + s(23) * 40)}px`,
            animation: `mote-float ${6 + s(5) * 7}s ease-in-out ${-s(11) * 8}s infinite`,
          }} />
        );
      })}
    </div>
  );
}

type BoulderState = 'idle' | 'shaking' | 'sinking' | 'gone';

function TrunkParticles({ trunkX }: { trunkX: number }) {
  // apenas os offsets aleatórios — posição X real calculada no render com trunkX
  const offsets = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const s = (n: number) => { const x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };
    const size = 2.5 + s(i * 3) * 4;
    return {
      id: i,
      spreadX: (s(i * 7) - 0.5) * 70,   // ±35px ao redor do tronco
      startBottom: `${8 + s(i * 23) * 30}%`,
      size,
      floatDur: `${4 + s(i * 11) * 6}s`,
      floatDelay: `-${s(i * 17) * 8}s`,
      glowDur: `${1.2 + s(i * 41) * 2}s`,
      glowDelay: `-${s(i * 29) * 2}s`,
      dx: `${(s(i * 13) > 0.5 ? 1 : -1) * (60 + s(i * 19) * 300)}px`,
      dy: `${-(120 + s(i * 31) * 450)}px`,
    };
  }), []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, overflow: 'hidden' }}>
      {offsets.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          bottom: p.startBottom,
          left: `calc(50% + ${Math.round(trunkX + p.spreadX)}px)`,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #e0ffe8, #00ff66)',
          animation: `trunk-particle ${p.floatDur} ease-out ${p.floatDelay} infinite, neon-glow-pulse ${p.glowDur} ease-in-out ${p.glowDelay} infinite`,
          '--dx': p.dx, '--dy': p.dy,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}

function TrunkSprite({ height }: { height: number }) {
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f === 2 ? 1 : f + 1), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <img src={`/assets/estufa/trunk-${frame}.png`} alt="tronco pulsante"
      style={{ display: 'block', height, width: 'auto', imageRendering: 'pixelated',
        filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.7))' }} />
  );
}

function ParallaxWorld({ bg, worldX, gateOpen, gateFrame, landmarkAnchor, nearby, boulderState, landmarkKind, appleTreeAnchor, trunkAnchor, computerOn }: { bg: SceneBg; worldX: number; gateOpen: boolean; gateFrame: number; landmarkAnchor: number | null; nearby: boolean; boulderState: BoulderState; landmarkKind: 'gate' | 'estufa-ext' | 'trunk' | 'computer'; appleTreeAnchor: number | null; trunkAnchor: number | null; computerOn: boolean }) {
  if (bg === 'noite') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #0a1024 0%, #131a38 60%, #1c2440 100%)' }}>
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 53) % 100}%`, top: `${(i * 37) % 70}%`,
            width: 2, height: 2, borderRadius: 9, background: '#fff',
            opacity: 0.3 + ((i * 7) % 10) / 14,
          }} />
        ))}
      </div>
    );
  }

  const fxLayer = (src: string, factor: number, z: number, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', inset: 0, zIndex: z,
    backgroundImage: `url('/assets/forest/${src}')`,
    backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
    backgroundPositionX: `${Math.round(-worldX * factor)}px`, backgroundPositionY: 'bottom',
    imageRendering: 'pixelated', ...extra,
  });

  // helper genérico (caminho completo)
  const layer = (path: string, factor: number, z: number, extra?: CSSProperties): CSSProperties => ({
    position: 'absolute', inset: 0, zIndex: z,
    backgroundImage: `url('${path}')`,
    backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
    backgroundPositionX: `${Math.round(-worldX * factor)}px`, backgroundPositionY: 'bottom',
    imageRendering: 'pixelated', ...extra,
  });

  // ── Ato 3: montanhas + árvores teal/verde + Layer_0001_8 na frente ──
  if (bg === 'ato3') {
    const ATO3 = [
      { path: '/assets/ato3/sky.png',            f: 0.03, z: 1 },
      { path: '/assets/cute/bg2.png', f: 0.08, z: 2 },
      { path: '/assets/cute/bg3.png',            f: 0.18, z: 3 },
      { path: '/assets/ato3/trees-c.png',        f: 0.30, z: 4 },
      { path: '/assets/ato3/trees-a.png',        f: 0.45, z: 5 },
      { path: '/assets/ato3/trees-e.png',        f: 0.50, z: 6, extra: { backgroundPositionY: 'bottom -10px' } },
      { path: '/assets/ato3/trees-d.png',        f: 0.55, z: 7 },
      { path: '/assets/forest/Layer_0001_8.png', f: 0.90, z: 9 },
    ];
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR, overflow: 'hidden',
        background: '#7dd8de' }}>

        {ATO3.map(l => <div key={l.path} style={layer(l.path, l.f, l.z, (l as {extra?: React.CSSProperties}).extra)} />)}

        {/* arbustos do Ato 3 */}
        {([
          { src: 'ato3/bush1.png', wx: 200,  f: 0.92, h: 80, b: GROUND - 4, z: 10 },
          { src: 'ato3/bush2.png', wx: 480,  f: 1.04, h: 55, b: GROUND - 4, z: 15 },
          { src: 'ato3/bush1.png', wx: 780,  f: 0.94, h: 72, b: GROUND - 4, z: 10, flip: true },
          { src: 'ato3/bush2.png', wx: 1050, f: 1.05, h: 50, b: GROUND - 4, z: 16 },
          { src: 'ato3/bush1.png', wx: 1350, f: 0.96, h: 76, b: GROUND - 4, z: 11, flip: true },
          { src: 'ato3/bush2.png', wx: 1620, f: 1.03, h: 52, b: GROUND - 4, z: 15 },
          { src: 'ato3/bush1.png', wx: 1900, f: 0.95, h: 70, b: GROUND - 4, z: 11 },
          { src: 'ato3/bush2.png', wx: 2180, f: 1.04, h: 48, b: GROUND - 4, z: 16, flip: true },
        ] as Prop[]).map((p, i) => <PropImg key={`ato3bush${i}`} p={p} worldX={worldX} />)}

        {/* chão texturizado */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND - 10, zIndex: 21,
          backgroundImage: `url('/assets/world/ground-dark.png')`,
          backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
          backgroundPositionX: `${Math.round(-worldX * 1.0)}px`,
          imageRendering: 'pixelated',
        }} />

        {/* macieira — posição própria, persiste mesmo depois do collect */}
        {appleTreeAnchor != null && boulderState !== 'gone' && (
          <div style={{ position: 'absolute', left: `calc(50% + ${Math.round(appleTreeAnchor - worldX)}px)`, bottom: GROUND - 4, zIndex: 12, transform: 'translateX(-50%)', width: 'max-content' }}>
            <img
              src="/assets/ato3/apple-tree.png"
              alt="macieira gigante"
              style={{
                display: 'block', height: 320, width: 'auto', imageRendering: 'pixelated',
                filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.65))',
                transformOrigin: 'bottom center',
                animation: 'tree-sway 4s ease-in-out infinite',
              }}
            />
            {nearby && landmarkKind !== 'estufa-ext' && (
              <div className="font-pixel" style={{ position: 'absolute', bottom: 328, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
            )}
          </div>
        )}

        {/* estufa exterior — aparece quando o herói caminha para ela */}
        {landmarkAnchor != null && landmarkKind === 'estufa-ext' && (
          <div style={{ position: 'absolute', left: `calc(50% + ${Math.round(landmarkAnchor - worldX)}px)`, bottom: GROUND - 4, zIndex: 12, transform: 'translateX(-50%)', width: 'max-content' }}>
            <div style={{ position: 'relative', display: 'inline-block', transform: 'translateY(15px)' }}>
              <img
                src="/assets/ato3/estufa-ext.png"
                alt="estufa"
                style={{
                  display: 'block', height: 400, width: 'auto', imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.65))',
                }}
              />
              <img
                src="/assets/ato3/estufa-light.png"
                alt=""
                style={{
                  position: 'absolute', bottom: 0, left: 0,
                  height: `calc(100vh - ${FLOOR + GROUND - 4}px)`,
                  width: '100%',
                  imageRendering: 'pixelated',
                  mixBlendMode: 'screen',
                  pointerEvents: 'none',
                  animation: 'light-pulse 2.4s ease-in-out infinite',
                }}
              />
            </div>
            {nearby && (
              <div className="font-pixel" style={{ position: 'absolute', bottom: 408, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
            )}
          </div>
        )}

        <LightMotes />

        {/* grama de primeiro plano */}
        <div style={layer('/assets/forest/Layer_0000_9.png', FOREST_FOREGROUND.f, 20,
          { transformOrigin: 'bottom center', animation: 'foliage-wind 4.2s ease-in-out infinite' })} />
      </div>
    );
  }

  if (bg === 'estufa') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR, overflow: 'hidden', background: '#060d07' }}>

        {/* fundo interior da estufa — tiles alternados espelhados para evitar costura */}
        {(() => {
          const W = window.innerWidth || 400;
          const rawX = Math.round(-worldX * 0.12);
          const firstTile = Math.floor(-rawX / W) - 1;
          return [0, 1, 2, 3].map(di => {
            const n = firstTile + di;
            const x = rawX + n * W;
            return (
              <div key={n} style={{
                position: 'absolute', bottom: 0, zIndex: 1,
                left: x, width: W, height: `calc((100vh - ${FLOOR + GROUND - 4}px) / 2 - 10px)`,
                backgroundImage: "url('/assets/estufa/bg.jpg')",
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                transform: Math.abs(n) % 2 !== 0 ? 'scaleX(-1)' : 'none',
              }} />
            );
          });
        })()}

        {/* overlay escuro pulsando suavemente sobre o fundo */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.38)',
          animation: 'light-pulse-dark 3s ease-in-out infinite',
        }} />

        {/* layer de reflexo 1 — parallax lento */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
          backgroundImage: "url('/assets/estufa/reflect-1.png')",
          backgroundSize: '100% 50%',
          backgroundPositionX: `${Math.round(-worldX * 0.18)}px`,
          backgroundPositionY: 'calc(100% - 150px)',
          backgroundRepeat: 'repeat-x',
          mixBlendMode: 'screen',
        }} />

        {/* layer de reflexo 2 — parallax levemente diferente */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
          backgroundImage: "url('/assets/estufa/reflect-2.png')",
          backgroundSize: '100% 50%',
          backgroundPositionX: `${Math.round(-worldX * 0.28)}px`,
          backgroundPositionY: 'calc(100% - 150px)',
          backgroundRepeat: 'repeat-x',
          mixBlendMode: 'screen',
        }} />

        {/* chão */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND - 10, zIndex: 21,
          backgroundImage: `url('/assets/world/ground-dark.png')`,
          backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
          backgroundPositionX: `${Math.round(-worldX * 1.0)}px`,
          imageRendering: 'pixelated',
        }} />

        {/* partículas verdes neon — nascem no tronco e vagam pela estufa */}
        <TrunkParticles trunkX={Math.round((trunkAnchor ?? landmarkAnchor ?? 0) - worldX)} />

        {/* tronco persistente — permanece visível mesmo após avançar para o computador */}
        {trunkAnchor != null && landmarkKind !== 'trunk' && (
          <div style={{ position: 'absolute', left: `calc(50% + ${Math.round(trunkAnchor - worldX)}px)`, bottom: GROUND - 4, zIndex: 11, transform: 'translateX(-50%)', width: 'max-content' }}>
            <div style={{ transform: 'translateY(30px)' }}><TrunkSprite height={330} /></div>
          </div>
        )}

        {/* landmarks: tronco pulsante ou computador */}
        {landmarkAnchor != null && (
          <div style={{ position: 'absolute', left: `calc(50% + ${Math.round(landmarkAnchor - worldX)}px)`, bottom: GROUND - 4, zIndex: 12, transform: 'translateX(-50%)', width: 'max-content' }}>
            {landmarkKind === 'trunk' ? (
              <>
                <div style={{ transform: 'translateY(30px)' }}><TrunkSprite height={330} /></div>
                {nearby && (
                  <div className="font-pixel" style={{ position: 'absolute', bottom: 288, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
                )}
              </>
            ) : landmarkKind === 'computer' ? (
              <>
                <img
                  src={computerOn ? '/assets/estufa/computer-on.png' : '/assets/estufa/computer-off.png'}
                  alt="computador"
                  style={{ display: 'block', height: 220, width: 'auto', imageRendering: 'pixelated',
                    transform: 'translateY(20px)',
                    filter: computerOn ? undefined : 'drop-shadow(0 8px 14px rgba(0,0,0,0.7))',
                    animation: computerOn ? 'computer-glow-pulse 2.5s ease-in-out infinite' : undefined, }}
                />
                {nearby && (
                  <div className="font-pixel" style={{ position: 'absolute', bottom: 228, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* grama de primeiro plano */}
        <div style={{ ...fxLayer(FOREST_FOREGROUND.src, FOREST_FOREGROUND.f, 20), transformOrigin: 'bottom center', animation: 'foliage-wind 4.2s ease-in-out infinite' }} />
      </div>
    );
  }

  // ── Atos 5-7: cenas de imagem única (pântano / corredor de luz / final) ──
  if (bg === 'pantano' || bg === 'corredor' || bg === 'final') {
    const cfg = {
      pantano:  { img: '/assets/scenes/pantano.jpg',  base: '#1a2a18', tint: 'rgba(20,45,22,0.30)', tintAnim: 'light-pulse-dark 5s ease-in-out infinite' },
      corredor: { img: '/assets/scenes/corredor.jpg', base: '#06121f', tint: 'rgba(20,120,200,0.14)', tintAnim: 'light-pulse 3s ease-in-out infinite' },
      final:    { img: '/assets/scenes/final.jpg',    base: '#1a1208', tint: 'rgba(255,210,120,0.10)', tintAnim: undefined },
    }[bg];
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR, overflow: 'hidden', background: cfg.base }}>
        {/* fundo — leve parallax */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundImage: `url('${cfg.img}')`, backgroundSize: 'cover',
          backgroundPositionX: `calc(50% + ${Math.round(-worldX * 0.08)}px)`, backgroundPositionY: 'center',
          backgroundRepeat: 'no-repeat', imageRendering: 'pixelated',
        }} />
        {/* tom de cor / clima */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: cfg.tint, pointerEvents: 'none', animation: cfg.tintAnim }} />

        {/* feixes de luz vertical (corredor azul) */}
        {bg === 'corredor' && [18, 38, 58, 78].map((lx, i) => (
          <div key={i} style={{
            position: 'absolute', top: '-10%', left: `${lx}%`, width: 60, height: '120%', zIndex: 3,
            transform: 'rotate(8deg)', transformOrigin: 'top center', pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(120,210,255,0.5), transparent 75%)',
            filter: 'blur(8px)',
            animation: `beam-pulse ${4 + i}s ease-in-out ${-i}s infinite`,
          }} />
        ))}

        {/* brilho dourado de sol no topo (final) */}
        {bg === 'final' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
            background: 'radial-gradient(circle at 50% -10%, rgba(255,240,190,0.55), transparent 55%)' }} />
        )}

        {/* atmosfera por cena */}
        {bg === 'pantano' && <SceneParticles kind="pantano" />}
        {bg === 'final' && <SceneParticles kind="final" />}
        {bg === 'corredor' && <LightMotes />}

        {/* vinheta para dar profundidade (corredor / final) */}
        {(bg === 'corredor' || bg === 'final') && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none',
            boxShadow: 'inset 0 0 160px 40px rgba(0,0,0,0.55)' }} />
        )}

        {/* chão */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND - 10, zIndex: 21,
          backgroundImage: `url('/assets/world/ground-dark.png')`,
          backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
          backgroundPositionX: `${Math.round(-worldX * 1.0)}px`,
          imageRendering: 'pixelated',
        }} />
      </div>
    );
  }

  // ── Ato 1 — Tall Forest (3 camadas parallax) ──────────────────────────────
  if (bg === 'floresta') {
    const TF = [
      { src: '/assets/jungle/plx-2.png',          f: 0.06 },
      { src: '/assets/jungle/plx-3.png',          f: 0.20 },
      { src: '/assets/jungle/plx-4.png',          f: 0.50 },
      { src: '/assets/jungle/plx-5.png',          f: 0.70 },
      { src: '/assets/tallforest/far-custom.png', f: 0.78 },
      { src: '/assets/tallforest/middle.png',     f: 0.85 },
    ];
    const BUSHES: Prop[] = [
      { src: 'tallforest/bush3.png', wx: 160,  f: 0.92, h: 72, b: GROUND - 4, z: 9,  glow: true },
      { src: 'tallforest/bush4.png', wx: 420,  f: 1.04, h: 48, b: GROUND - 4, z: 15 },
      { src: 'tallforest/bush2.png', wx: 680,  f: 0.94, h: 80, b: GROUND - 4, z: 8, flip: true },
      { src: 'tallforest/bush1.png', wx: 950,  f: 1.05, h: 70, b: GROUND - 4, z: 16 },
      { src: 'tallforest/bush3.png', wx: 1200, f: 0.96, h: 65, b: GROUND - 4, z: 11, flip: true, glow: true },
      { src: 'tallforest/bush4.png', wx: 1460, f: 1.03, h: 52, b: GROUND - 4, z: 17 },
      { src: 'tallforest/bush2.png', wx: 1720, f: 0.93, h: 75, b: GROUND - 4, z: 9  },
      { src: 'tallforest/bush1.png', wx: 1980, f: 1.06, h: 68, b: GROUND - 4, z: 15 },
      { src: 'tallforest/bush3.png', wx: 2240, f: 0.95, h: 70, b: GROUND - 4, z: 11, glow: true },
      { src: 'tallforest/bush4.png', wx: 2520, f: 1.04, h: 45, b: GROUND - 4, z: 16, flip: true },
    ];
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR, overflow: 'hidden',
        background: 'linear-gradient(to bottom, #0d1a0d 0%, #122212 40%, #1a2e18 100%)' }}>

        {/* camada 1 — céu (Grassland Free) */}
        <div style={layer('/assets/preview/legacy-bg.png', 0.03, 0, { backgroundSize: 'auto 100%', backgroundPositionY: 'bottom' })} />

        {TF.map((l, i) => (
          <div key={l.src} style={layer(l.src, l.f, i + 1, { backgroundSize: 'auto 350px' })} />
        ))}

        {/* camada 8 — subida 40px */}
        <div style={layer('/assets/tallforest/layer8-custom.png', 0.76, 12, { backgroundPositionY: 'bottom 40px' })} />
        {/* camada 9 — atrás do herói */}
        <div style={fxLayer('Layer_0001_8.png', 0.90, 13)} />

        <LightMotes />

        {/* chão */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND - 10, zIndex: 10,
          backgroundImage: `url('/assets/world/ground-dark.png')`,
          backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
          backgroundPositionX: `${Math.round(-worldX * 1.0)}px`,
          imageRendering: 'pixelated',
        }} />

        {/* arbustos — distribuídos por z-index (atrás e frente do herói) */}
        {BUSHES.map((p, i) => <PropImg key={`bush${i}`} p={p} worldX={worldX} />)}

        {/* camada 10 — grama, na frente do herói */}
        <div style={fxLayer('Layer_0000_9.png', FOREST_FOREGROUND.f, 20,
          { transformOrigin: 'bottom center', animation: 'foliage-wind 4.2s ease-in-out infinite' })} />

        {/* portão */}
        {landmarkAnchor != null && (
          <div style={{ position: 'absolute', left: `calc(50% + ${Math.round(landmarkAnchor - worldX)}px)`, bottom: GROUND - 24, zIndex: 12, transform: 'translateX(-50%)', width: 'max-content' }}>
            <img
              src={gateFrame >= 1 ? '/assets/tallforest/gate-open.png' : '/assets/tallforest/gate-closed.png'}
              alt="portão"
              style={{ display: 'block', height: 200, width: 'auto', imageRendering: 'pixelated', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.7))' }}
            />
            {nearby && !gateOpen && (
              <div className="font-pixel" style={{ position: 'absolute', bottom: 210, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (bg === 'clareira') {
    const TF = [
      { src: '/assets/jungle/plx-2.png',        f: 0.06 },
      { src: '/assets/jungle/plx-3.png',        f: 0.20 },
      { src: '/assets/jungle/plx-4.png',        f: 0.50 },
      { src: '/assets/jungle/plx-5.png',        f: 0.70 },
      { src: '/assets/tallforest/far-custom.png', f: 0.78 },
      { src: '/assets/tallforest/middle.png',   f: 0.85 },
    ];
    const BUSHES: Prop[] = [
      { src: 'tallforest/bush3.png', wx: 160,  f: 0.92, h: 72, b: GROUND - 4, z: 9,  glow: true },
      { src: 'tallforest/bush4.png', wx: 420,  f: 1.04, h: 48, b: GROUND - 4, z: 15 },
      { src: 'tallforest/bush2.png', wx: 680,  f: 0.94, h: 80, b: GROUND - 4, z: 8, flip: true },
      { src: 'tallforest/bush1.png', wx: 950,  f: 1.05, h: 70, b: GROUND - 4, z: 16 },
      { src: 'tallforest/bush3.png', wx: 1200, f: 0.96, h: 65, b: GROUND - 4, z: 11, flip: true, glow: true },
      { src: 'tallforest/bush4.png', wx: 1460, f: 1.03, h: 52, b: GROUND - 4, z: 17 },
      { src: 'tallforest/bush2.png', wx: 1720, f: 0.93, h: 75, b: GROUND - 4, z: 9  },
      { src: 'tallforest/bush1.png', wx: 1980, f: 1.06, h: 68, b: GROUND - 4, z: 15 },
      { src: 'tallforest/bush3.png', wx: 2240, f: 0.95, h: 70, b: GROUND - 4, z: 11, glow: true },
      { src: 'tallforest/bush4.png', wx: 2520, f: 1.04, h: 45, b: GROUND - 4, z: 16, flip: true },
    ];
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR, overflow: 'hidden',
        background: 'linear-gradient(to bottom, #0d1a0d 0%, #122212 40%, #1a2e18 100%)' }}>

        {/* camada 1 — céu (Grassland Free) */}
        <div style={layer('/assets/preview/legacy-bg.png', 0.03, 0, { backgroundSize: 'auto 100%', backgroundPositionY: 'bottom' })} />

        {TF.map((l, i) => (
          <div key={l.src} style={layer(l.src, l.f, i + 1, { backgroundSize: 'auto 350px' })} />
        ))}

        {/* camada 8 — subida 40px */}
        <div style={layer('/assets/tallforest/layer8-custom.png', 0.76, 12, { backgroundPositionY: 'bottom 40px' })} />
        {/* camada 9 — atrás do herói */}
        <div style={fxLayer('Layer_0001_8.png', 0.90, 13)} />

        <LightMotes />

        {/* arbustos */}
        {BUSHES.map((p, i) => <PropImg key={`bush${i}`} p={p} worldX={worldX} />)}

        {/* flora mágica */}
        {SCENERY.map((p, i) => <PropImg key={`flora${i}`} p={p} worldX={worldX} />)}

        {/* chão */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND - 10, zIndex: 10,
          backgroundImage: `url('/assets/world/ground-dark.png')`,
          backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
          backgroundPositionX: `${Math.round(-worldX * 1.0)}px`,
          imageRendering: 'pixelated',
        }} />

        {/* camada 10 — grama, na frente do herói */}
        <div style={fxLayer('Layer_0000_9.png', FOREST_FOREGROUND.f, 20,
          { transformOrigin: 'bottom center', animation: 'foliage-wind 4.2s ease-in-out infinite' })} />

        {/* pedra gigante */}
        {landmarkAnchor != null && boulderState !== 'gone' && (
          <div style={{ position: 'absolute', left: `calc(50% + ${Math.round(landmarkAnchor - worldX)}px)`, bottom: GROUND - 4, zIndex: 16, transform: 'translateX(-50%)', width: 'max-content' }}>
            <div style={{
              transform: boulderState === 'sinking' ? 'translateY(360px)' : 'translateY(0)',
              transition: boulderState === 'sinking' ? 'transform 1.4s ease-in' : 'none',
            }}>
              <img
                src="/assets/world/boulder.png"
                alt="pedra gigante"
                style={{
                  display: 'block', height: 240, width: 'auto', imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.9)) drop-shadow(0 0 8px rgba(0,0,0,0.6))',
                  animation: boulderState === 'shaking' ? 'boulder-shake 0.13s ease-in-out infinite' : 'none',
                }}
              />
            </div>
            {nearby && boulderState === 'idle' && (
              <div className="font-pixel" style={{ position: 'absolute', bottom: 248, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR, overflow: 'hidden', background: '#5a6f8c' }}>
      {/* camadas da floresta (trás → frente, atrás do herói) */}
      {(bg === 'clareira' ? CLAREIRA_LAYERS : FOREST_LAYERS).map((l, i) => (
        <div key={l.src} style={fxLayer(l.src, l.f, i + 1)} />
      ))}

      {/* nuvens — acima de todas as camadas de floresta (z=11), ficam no céu */}
      {[
        { src: 'cloud1.png', f: 0.04, topPx: 14, h: 52, offset: 0,   op: 0.75 },
        { src: 'cloud2.png', f: 0.06, topPx: 44, h: 42, offset: 340, op: 0.50 },
        { src: 'cloud3.png', f: 0.03, topPx: 72, h: 36, offset: 680, op: 0.28 },
      ].map(c => (
        <div key={c.src} style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: '45%',
          zIndex: 12,
          backgroundImage: `url('/assets/world/${c.src}')`,
          backgroundRepeat: 'repeat-x', backgroundSize: `auto ${c.h}px`,
          backgroundPositionX: `${Math.round(-worldX * c.f - c.offset)}px`,
          backgroundPositionY: `${c.topPx}px`,
          imageRendering: 'pixelated', opacity: c.op,
        }} />
      ))}

      {/* flora mágica — z-index decide quem fica atrás (z<14) ou na frente (14<z<20) do herói */}
      {SCENERY.map((p, i) => <PropImg key={`flora${i}`} p={p} worldX={worldX} />)}

      {/* chão texturizado — acima da grama de primeiro plano (z=20) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND - 10,
        zIndex: 21,
        backgroundImage: `url('/assets/world/ground-dark.png')`,
        backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
        backgroundPositionX: `${Math.round(-worldX * 1.0)}px`,
        imageRendering: 'pixelated',
      }} />

      {/* marco do mundo: pedra (clareira) ou portão (floresta) */}
      {landmarkAnchor != null && (
        <div style={{
          position: 'absolute',
          left: `calc(50% + ${Math.round(landmarkAnchor - worldX)}px)`,
          bottom: GROUND - 4, zIndex: 12, transform: 'translateX(-50%)',
          width: 'max-content',
        }}>
          {bg === 'clareira' ? (
            boulderState !== 'gone' && (
              <>
                {/* wrapper de sinking — translateY separado do shake */}
                <div style={{
                  transform: boulderState === 'sinking' ? 'translateY(360px)' : 'translateY(0)',
                  transition: boulderState === 'sinking' ? 'transform 1.4s ease-in' : 'none',
                }}>
                  <img
                    src="/assets/world/boulder.png"
                    alt="pedra gigante"
                    style={{
                      display: 'block', height: 240, width: 'auto', imageRendering: 'pixelated',
                      filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.9)) drop-shadow(0 0 8px rgba(0,0,0,0.6))',
                      animation: boulderState === 'shaking' ? 'boulder-shake 0.13s ease-in-out infinite' : 'none',
                    }}
                  />
                </div>
                {nearby && boulderState === 'idle' && (
                  <div className="font-pixel" style={{ position: 'absolute', bottom: 248, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
                )}
              </>
            )
          ) : (
            <>
              <img
                src={gateFrame === 2 ? '/assets/world/gate-open.png'
                   : gateFrame === 1 ? '/assets/world/gate-half.png'
                   : '/assets/world/gate-closed.png'}
                alt="portão"
                style={{ display: 'block', height: 200, width: 'auto', imageRendering: 'pixelated', filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.7))' }}
              />
              {nearby && !gateOpen && (
                <div className="font-pixel" style={{ position: 'absolute', bottom: 210, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
              )}
            </>
          )}
        </div>
      )}

      {/* poeira de luz mágica */}
      <LightMotes />

      {/* grama/mato em primeiro plano — NA FRENTE do herói, balança ao vento */}
      <div style={{ ...fxLayer(FOREST_FOREGROUND.src, FOREST_FOREGROUND.f, 20), transformOrigin: 'bottom center', animation: 'foliage-wind 4.2s ease-in-out infinite' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Criatura ambiente — atravessa a tela uma vez
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// Criatura ambiente (raposa de musgo) — aparece após delay, passa uma vez
// ─────────────────────────────────────────────────────────
function WalkingRabbit({ onDone }: { onDone: () => void }) {
  const [left, setLeft] = useState(-120);
  const [frame, setFrame] = useState(0);
  const posRef = useRef(-120);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // frames animam imediatamente na montagem
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % 3), 160);
    return () => clearInterval(id);
  }, []);

  // caminha da esquerda para direita uma única vez
  useEffect(() => {
    let prev = 0;
    let raf: number;
    const tick = (t: number) => {
      const dt = prev ? (t - prev) / 1000 : 0;
      prev = t;
      posRef.current += 80 * dt;
      setLeft(posRef.current);
      if (posRef.current > window.innerWidth + 120) { onDoneRef.current(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <img src={`/assets/creatures/fox-walk-${frame + 1}.png`} alt=""
      style={{
        position: 'absolute', left, bottom: FLOOR + GROUND,
        height: 70, width: 'auto', imageRendering: 'pixelated',
        zIndex: 13,
        filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.45))',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────
// Herói — normal e despertar
// ─────────────────────────────────────────────────────────
function WakeUpHero({ frame }: { frame: number }) {
  return (
    <img src={`/assets/chars/wakeup-${frame}.png`} alt="herói acordando"
      style={{
        position: 'absolute', left: '34%', bottom: FLOOR + GROUND + HERO_LIFT, zIndex: 14,
        height: 88, width: 'auto', imageRendering: 'pixelated',
        transform: 'translateX(-50%)',
        filter: 'drop-shadow(0 5px 4px rgba(0,0,0,0.5))',
      }} />
  );
}

function Hero({ moving, frame, facing }: { moving: boolean; frame: number; facing: number }) {
  const src = moving
    ? `/assets/chars/player-walk-${(frame % 3) + 1}.png`
    : `/assets/chars/player-idle-${(frame % 2) + 1}.png`;
  return (
    <img src={src} alt="herói"
      style={{
        position: 'absolute', left: '34%', bottom: FLOOR + GROUND + HERO_LIFT, zIndex: 14,
        height: 126, width: 'auto', imageRendering: 'pixelated',
        transform: `translateX(-50%) scaleX(${facing})`,
        filter: 'drop-shadow(0 5px 4px rgba(0,0,0,0.5))',
      }} />
  );
}

// ─────────────────────────────────────────────────────────
// Motor principal
// ─────────────────────────────────────────────────────────
export default function StoryGame({ onExit, startBeat = 0, startBg }: { onExit: () => void; startBeat?: number; startBg?: SceneBg }) {
  const beats = ACT1.beats;
  const [beatIndex, setBeatIndex] = useState(startBeat);
  const [bg, setBg] = useState<SceneBg>(startBg ?? 'noite');
  const [worldX, setWorldX] = useState(0);
  const [fade, setFade] = useState<{ text?: string } | null>(null);
  const [moving, setMoving] = useState(false);
  const [frame, setFrame] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateFrame, setGateFrame] = useState(0); // 0=fechado 1=entreaberto 2=aberto
  const [facing, setFacing] = useState(1);
  const [landmarkAnchor, setLandmarkAnchor] = useState<number | null>(null);
  // 1-4 = frame de despertar ativo; null = já acordou, usa hero normal
  const [wakeUpFrame, setWakeUpFrame] = useState<number | null>(null);
  const [showRabbit, setShowRabbit] = useState(false);
  const [boulderState, setBoulderState] = useState<BoulderState>('idle');
  const [landmarkKind, setLandmarkKind] = useState<'gate' | 'estufa-ext' | 'trunk' | 'computer'>('gate');
  const [appleTreeAnchor, setAppleTreeAnchor] = useState<number | null>(null);
  const [trunkAnchor, setTrunkAnchor] = useState<number | null>(null);
  const [sceneFade, setSceneFade] = useState(false);

  const beat: Beat | undefined = beats[beatIndex];
  const advance = useCallback(() => setBeatIndex(i => i + 1), []);

  // herói está perto o suficiente do portão para apertar OK
  const nearby = landmarkAnchor != null && (landmarkAnchor - worldX) < 200;

  // reseta o portão só na mudança de cena (tratado no effect de beats automáticos)
  useEffect(() => { setGateOpen(false); }, [beatIndex]);

  // animação de abertura: fechado → entreaberto → aberto
  useEffect(() => {
    if (!gateOpen) return;
    const t1 = setTimeout(() => setGateFrame(1), 400);
    const t2 = setTimeout(() => setGateFrame(2), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [gateOpen]);

  // animação dos quadros do herói
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), moving ? 180 : 700);
    return () => clearInterval(id);
  }, [moving]);

  // sequência de despertar: f1→5s, f2→0.6s, f3→0.6s, f4→0.6s, depois null
  useEffect(() => {
    if (wakeUpFrame === null) return;
    const delay = wakeUpFrame === 1 ? 5000 : 600;
    const id = setTimeout(() => {
      setWakeUpFrame(f => (f !== null && f < 4) ? f + 1 : null);
    }, delay);
    return () => clearTimeout(id);
  }, [wakeUpFrame]);

  // ativa o coelho quando a clareira começa; reseta a pedra (clareira e ato3)
  useEffect(() => {
    if (bg === 'clareira') { setShowRabbit(true); setBoulderState('idle'); }
    if (bg === 'ato3' || bg === 'estufa') setBoulderState('idle');
  }, [bg]);

  // animação da pedra: tremor → descida → desaparecimento
  const triggerBoulder = useCallback(() => {
    setBoulderState('shaking');
    setTimeout(() => setBoulderState('sinking'), 800);
    setTimeout(() => setBoulderState('gone'), 1800);
  }, []);

  // beats automáticos (cenário / fade)
  useEffect(() => {
    if (!beat) return;
    if (beat.t === 'scene') {
      setSceneFade(true);
      const t1 = setTimeout(() => {
        setBg(beat.bg);
        if (beat.bg === 'floresta') setWakeUpFrame(1);
      }, 550);
      const t2 = setTimeout(() => { setSceneFade(false); advance(); }, 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else if (beat.t === 'fade') {
      setFade({ text: beat.text });
      const id = setTimeout(() => { setFade(null); advance(); }, 1700);
      return () => clearTimeout(id);
    }
  }, [beatIndex, beat, advance]);

  // ── caminhada ──
  const targetRef = useRef<number | null>(null);
  const holdRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);
  const lastRef = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const walkStartXRef = useRef(0);

  useEffect(() => {
    if (beat?.t === 'walk') {
      walkStartXRef.current = worldX;
      targetRef.current = worldX + beat.dist;
      if (beat.landmark) {
        const anchor = worldX + beat.dist - GATE_AHEAD;
        setLandmarkAnchor(anchor);
        setLandmarkKind(beat.landmark as 'gate' | 'estufa-ext' | 'trunk' | 'computer');
        // guarda posição da macieira para ela persistir depois do collect
        if (beat.landmark === 'gate' && bg === 'ato3') setAppleTreeAnchor(anchor);
        // guarda posição do tronco para persistir depois do walk
        if (beat.landmark === 'trunk') setTrunkAnchor(anchor);
      }
      // sem landmark: mantém o portão visível (sai de cena naturalmente ao rolar)
    } else if (beat?.t === 'scene') {
      // nova cena: limpa portão e âncora
      targetRef.current = null;
      setLandmarkAnchor(null);
      setLandmarkKind('gate');
      setAppleTreeAnchor(null);
      setTrunkAnchor(null);
      setGateFrame(0);
    } else {
      targetRef.current = null;
      // say / question / fade: portão permanece no mundo
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  // chegou ao alvo sem landmark → avança automaticamente; com landmark → espera OK
  useEffect(() => {
    if (beat?.t === 'walk' && !beat.landmark && targetRef.current != null && worldX >= targetRef.current) {
      holdRef.current = false; setMoving(false);
      targetRef.current = null;
      advance();
    }
  }, [worldX, beat, advance]);

  const loop = useCallback((ts: number) => {
    const dt = lastRef.current ? (ts - lastRef.current) / 1000 : 0;
    lastRef.current = ts;
    if (holdRef.current) {
      setWorldX(x => {
        const dir = dirRef.current;
        const next = x + dir * WALK_SPEED * dt;
        if (dir === -1) return Math.max(next, walkStartXRef.current);
        if (targetRef.current != null) return Math.min(next, targetRef.current);
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    } else {
      rafRef.current = undefined; lastRef.current = 0;
    }
  }, []);

  const startWalkForward = useCallback(() => {
    if (beat?.t !== 'walk' || holdRef.current) return;
    dirRef.current = 1; setFacing(1);
    holdRef.current = true; setMoving(true); lastRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [beat, loop]);

  const startWalkBackward = useCallback(() => {
    if (beat?.t !== 'walk' || holdRef.current) return;
    dirRef.current = -1; setFacing(-1);
    holdRef.current = true; setMoving(true); lastRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [beat, loop]);

  const stopWalk = useCallback(() => {
    holdRef.current = false; setMoving(false);
  }, []);

  // teclado: segurar ← A / → D para andar
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') startWalkForward();
      if (e.key === 'ArrowLeft' || e.key === 'a') startWalkBackward();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'ArrowLeft' || e.key === 'a') stopWalk();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [startWalkForward, startWalkBackward, stopWalk]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const finished = beatIndex >= beats.length;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ touchAction: 'none', userSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}>
      <ImagePreloader />
      {/* cobre o verde do body na faixa do FLOOR (abaixo do mundo) */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: FLOOR,
        backgroundImage: "url('/assets/world/ground-dark.png')",
        backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
        backgroundPositionX: `${Math.round(-worldX)}px`,
        imageRendering: 'pixelated',
      }} />
      <ParallaxWorld bg={bg} worldX={worldX} gateOpen={gateOpen} gateFrame={gateFrame} landmarkAnchor={landmarkAnchor} nearby={nearby} boulderState={boulderState} landmarkKind={landmarkKind} appleTreeAnchor={appleTreeAnchor} trunkAnchor={trunkAnchor} computerOn={landmarkKind === 'computer' && beat?.t !== 'walk'} />

      {(bg === 'floresta' || bg === 'clareira' || bg === 'ato3' || bg === 'estufa' || bg === 'pantano' || bg === 'corredor' || bg === 'final') && !finished && (
        wakeUpFrame !== null
          ? <WakeUpHero frame={wakeUpFrame} />
          : <Hero moving={moving} frame={frame} facing={facing} />
      )}

      {/* coelho aparece 7s após a clareira começar, passa uma vez */}
      {showRabbit && !finished && <WalkingRabbit onDone={() => setShowRabbit(false)} />}

      {/* botão sair — top:48 para não sobrepor o PULAR da intro (top:14) */}
      <button onPointerDown={(e) => { e.preventDefault(); onExit(); }}
        onContextMenu={(e) => e.preventDefault()}
        className="font-pixel"
        style={{ position: 'absolute', top: 48, right: 12, zIndex: 50, fontSize: 8, color: '#cfe8c0', background: 'rgba(8,24,12,0.8)', border: '2px solid #2f6b34', borderRadius: 6, padding: '8px 10px', cursor: 'pointer', touchAction: 'none' }}>
        ✕ SAIR
      </button>

      {/* diálogo */}
      {beat?.t === 'say' && (
        <SayRunner key={beatIndex} beat={beat} onDone={advance} />
      )}

      {/* pergunta — só no ato1 (portão) */}
      {beat?.t === 'question' && (
        <QuestionBeat key={beatIndex} beat={beat} onSolved={advance}
          onCorrect={() => setGateOpen(true)} />
      )}

      {/* coleta de maçãs — ato3 */}
      {beat?.t === 'collect' && (
        <CollectBeat key={beatIndex} beat={beat} onSolved={advance}
          onCorrect={() => {}} />
      )}

      {/* pareamento — na clareira a pedra range e afunda; na floresta abre o portão */}
      {beat?.t === 'match' && (
        <MatchBeat key={beatIndex} beat={beat} onSolved={advance}
          onCorrect={bg === 'clareira' ? triggerBoulder : () => setGateOpen(true)} />
      )}

      {/* sequência — ato 5 (pântano): ordene o ciclo de vida */}
      {beat?.t === 'sequence' && (
        <SequenceBeat key={beatIndex} beat={beat} onSolved={advance} onCorrect={() => {}} />
      )}

      {/* memória — ato 6 (corredor de luz): repita os sinais da floresta */}
      {beat?.t === 'memory' && (
        <MemoryBeat key={beatIndex} beat={beat} onSolved={advance} onCorrect={() => {}} />
      )}

      {/* escolha — ato 7 (final): a decisão */}
      {beat?.t === 'choice' && (
        <ChoiceBeat key={beatIndex} beat={beat} onSolved={advance} />
      )}

      {/* D-pad de caminhada — lado esquerdo */}
      {beat?.t === 'walk' && (
        <div style={{ position: 'absolute', left: 30, bottom: FLOOR - 112, zIndex: 45, display: 'flex', gap: 10 }}>
          <button
            onPointerDown={(e) => { e.preventDefault(); startWalkBackward(); }} onPointerUp={stopWalk} onPointerLeave={stopWalk} onPointerCancel={stopWalk}
            onContextMenu={(e) => e.preventDefault()}
            className="font-pixel"
            style={{ width: 72, height: 72, borderRadius: 14, fontSize: 22, color: '#0d2a0d', background: 'linear-gradient(to bottom,#7be04a,#3a9a18)', border: '4px solid #0d2a0d', boxShadow: '0 5px 0 #0d2a0d', cursor: 'pointer', touchAction: 'none', WebkitTouchCallout: 'none' } as CSSProperties}>
            ←
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); startWalkForward(); }} onPointerUp={stopWalk} onPointerLeave={stopWalk} onPointerCancel={stopWalk}
            onContextMenu={(e) => e.preventDefault()}
            className="font-pixel"
            style={{ width: 72, height: 72, borderRadius: 14, fontSize: 22, color: '#0d2a0d', background: 'linear-gradient(to bottom,#7be04a,#3a9a18)', border: '4px solid #0d2a0d', boxShadow: '0 5px 0 #0d2a0d', cursor: 'pointer', touchAction: 'none', WebkitTouchCallout: 'none' } as CSSProperties}>
            →
          </button>
        </div>
      )}
      {/* botão OK — lado direito, aparece ao chegar no marco (portão ou pedra) */}
      {beat?.t === 'walk' && nearby && (bg === 'clareira' ? boulderState === 'idle'
        : bg === 'ato3' ? boulderState === 'idle'
        : !gateOpen) && (
        <button onPointerDown={(e) => { e.preventDefault(); advance(); }} onContextMenu={(e) => e.preventDefault()}
          className="font-pixel"
          style={{ position: 'absolute', right: 5, bottom: FLOOR - 112, zIndex: 45, width: 72, height: 72, borderRadius: 14, fontSize: 13, color: '#fff8e0', background: 'linear-gradient(to bottom,#e8c820,#a07800)', border: '4px solid #5a4000', boxShadow: '0 5px 0 #5a4000', cursor: 'pointer', animation: 'hint-bob 0.9s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', WebkitTouchCallout: 'none' } as CSSProperties}>
          OK
        </button>
      )}
      {beat?.t === 'walk' && beat.hint && (
        <div className="font-pixel" style={{ position: 'absolute', left: '50%', top: '14%', transform: 'translateX(-50%)', zIndex: 45, color: '#eaf6e0', fontSize: 10, textShadow: '0 2px 4px #000', animation: 'hint-bob 1.4s ease-in-out infinite' }}>
          {beat.hint}
        </div>
      )}

      {/* fade */}
      {/* transição entre atos — escurece e clareia a tela */}
      {sceneFade && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 58, background: '#000', pointerEvents: 'none', animation: 'scene-transition 1.2s ease-in-out forwards' }} />
      )}

      {fade && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fade-hold 1.7s ease-in-out' }}>
          {fade.text && <p className="font-vt" style={{ color: '#cfe8c0', fontSize: 26, fontStyle: 'italic' }}>{fade.text}</p>}
        </div>
      )}

      {/* fim do trecho */}
      {finished && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(4,12,6,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <p className="font-pixel" style={{ color: '#88ff66', fontSize: 14 }}>FIM DO TRECHO</p>
          <p className="font-vt" style={{ color: '#cfe8c0', fontSize: 20, textAlign: 'center', maxWidth: 320 }}>
            A jornada continua nos próximos atos do jardim.
          </p>
          <button onClick={onExit} className="btn-game font-pixel"
            style={{ background: 'linear-gradient(to bottom,#5ad22a,#2f9410)', fontSize: 10, padding: '14px 22px' }}>
            ← VOLTAR
          </button>
        </div>
      )}
    </div>
  );
}

// roda as linhas de um beat 'say' uma a uma
function SayRunner({ beat, onDone }: { beat: Extract<Beat, { t: 'say' }>; onDone: () => void }) {
  const [i, setI] = useState(0);
  const line = beat.lines[i] ?? '';
  const last = i >= beat.lines.length - 1;
  return (
    <DialogueBox who={beat.who} text={line} last={last}
      onNext={() => { if (last) onDone(); else setI(n => n + 1); }} />
  );
}
