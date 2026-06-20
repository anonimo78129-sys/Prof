import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Beat, SceneBg, Speaker } from '../../game/types';
import { ACT1 } from '../../game/script';

const FLOOR = 300;           // faixa reservada no rodapé p/ a caixa de texto e botões
const GROUND = 34;           // altura do chão dentro do mundo (acima da faixa FLOOR)
const HERO_LIFT = -5;        // ajuste fino vertical só do herói (acima do chão)
const GATE_AHEAD = 24;       // o portão para um pouco à frente de onde o herói chega
const WALK_SPEED = 230;      // px/seg que o herói anda

// Pré-carrega todas as imagens dos props/layers no início para
// evitar que apareçam "achatadas" ao entrar no viewport.
function ImagePreloader() {
  const srcs = [
    '/assets/world/ground-dark.png',
    '/assets/world/cloud1.png', '/assets/world/cloud2.png', '/assets/world/cloud3.png',
    '/assets/world/gate-closed.png', '/assets/world/gate-half.png', '/assets/world/gate-open.png',
    '/assets/world/boulder.png',
    '/assets/ato3/apple.png',
    '/assets/ato3/estufa-ext.png', '/assets/ato3/estufa-light.png',
    '/assets/estufa/bg.jpg',
    '/assets/estufa/reflect-1.png', '/assets/estufa/reflect-2.png',
    '/assets/estufa/trunk-1.png', '/assets/estufa/trunk-2.png',
    '/assets/ato3/sky.png',
    '/assets/ato3/mountain-back.png', '/assets/ato3/mountain-front.png',
    '/assets/ato3/tree-teal.png', '/assets/ato3/trees-green.png',
    ...SCENERY.map(p => `/assets/${p.src}`),
    ...FOREST_LAYERS.map(l => `/assets/forest/${l.src}`),
    '/assets/forest/Layer_0002_7_c.png',
    '/assets/forest/Layer_0003_6_c.png',
    `/assets/forest/${FOREST_FOREGROUND.src}`,
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

function ParallaxWorld({ bg, worldX, gateOpen, gateFrame, landmarkAnchor, nearby, boulderState, landmarkKind, appleTreeAnchor }: { bg: SceneBg; worldX: number; gateOpen: boolean; gateFrame: number; landmarkAnchor: number | null; nearby: boolean; boulderState: BoulderState; landmarkKind: 'gate' | 'estufa-ext' | 'trunk' | 'computer'; appleTreeAnchor: number | null }) {
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
      { path: '/assets/ato3/mountain-back.png',  f: 0.08, z: 2 },
      { path: '/assets/ato3/mountain-front.png', f: 0.18, z: 3 },
      { path: '/assets/ato3/tree-teal.png',      f: 0.50, z: 4 },
      { path: '/assets/ato3/trees-green.png',    f: 0.68, z: 5 },
      { path: '/assets/forest/Layer_0001_8.png', f: 0.90, z: 6 },
    ];
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: FLOOR, overflow: 'hidden',
        background: '#7dd8de' }}>

        {ATO3.map(l => <div key={l.path} style={layer(l.path, l.f, l.z)} />)}

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

        {/* fundo interior da estufa — parallax lento com imagem única */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundImage: "url('/assets/estufa/bg.jpg')",
          backgroundSize: '100% 50%',
          backgroundPositionX: `${Math.round(-worldX * 0.12)}px`,
          backgroundPositionY: 'bottom',
          backgroundRepeat: 'repeat-x',
        }} />

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

        {/* landmarks: tronco pulsante ou computador */}
        {landmarkAnchor != null && (
          <div style={{ position: 'absolute', left: `calc(50% + ${Math.round(landmarkAnchor - worldX)}px)`, bottom: GROUND - 4, zIndex: 12, transform: 'translateX(-50%)', width: 'max-content' }}>
            {landmarkKind === 'trunk' ? (
              <>
                <div style={{ transform: 'translateY(30px)' }}><TrunkSprite height={360} /></div>
                {nearby && (
                  <div className="font-pixel" style={{ position: 'absolute', bottom: 288, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
                )}
              </>
            ) : landmarkKind === 'computer' ? (
              <>
                <div style={{
                  width: 130, height: 100,
                  background: '#060808', border: '4px solid #1a2a1a',
                  borderRadius: 4, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  boxShadow: '0 0 14px rgba(0,255,80,0.28)',
                }}>
                  <span className="font-pixel" style={{ color: '#00e050', fontSize: 7, letterSpacing: 1 }}>AMAZÔNIA II</span>
                  <span className="font-pixel" style={{ color: '#00a030', fontSize: 6 }}>SENHA: ▮</span>
                </div>
                {nearby && (
                  <div className="font-pixel" style={{ position: 'absolute', bottom: 108, left: '50%', transform: 'translateX(-50%)', color: '#ffe070', fontSize: 18, textShadow: '0 2px 4px #000', animation: 'hint-bob 1s ease-in-out infinite' }}>❗</div>
                )}
              </>
            ) : null}
          </div>
        )}

        <LightMotes />

        {/* grama de primeiro plano */}
        <div style={{ ...fxLayer(FOREST_FOREGROUND.src, FOREST_FOREGROUND.f, 20), transformOrigin: 'bottom center', animation: 'foliage-wind 4.2s ease-in-out infinite' }} />
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
      }
      // sem landmark: mantém o portão visível (sai de cena naturalmente ao rolar)
    } else if (beat?.t === 'scene') {
      // nova cena: limpa portão e âncora
      targetRef.current = null;
      setLandmarkAnchor(null);
      setLandmarkKind('gate');
      setAppleTreeAnchor(null);
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
      <ParallaxWorld bg={bg} worldX={worldX} gateOpen={gateOpen} gateFrame={gateFrame} landmarkAnchor={landmarkAnchor} nearby={nearby} boulderState={boulderState} landmarkKind={landmarkKind} appleTreeAnchor={appleTreeAnchor} />

      {(bg === 'floresta' || bg === 'clareira' || bg === 'ato3' || bg === 'estufa') && !finished && (
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
