import { useCallback, useEffect, useRef, useState } from 'react';
import type { Beat, SceneBg, Speaker } from '../../game/types';
import { ACT1 } from '../../game/script';

const GROUND = 132;          // altura da faixa de chão (px)
const WALK_SPEED = 230;      // px/seg que o herói anda

// Pré-carrega todas as imagens dos props/layers no início para
// evitar que apareçam "achatadas" ao entrar no viewport.
function ImagePreloader() {
  const srcs = [
    ...SCENERY.map(p => `/assets/${p.src}`),
    '/assets/world/grass.png', '/assets/world/dirt.png',
    '/assets/world/cloud1.png', '/assets/world/cloud2.png', '/assets/world/cloud3.png',
    '/assets/sunnyland/door.png',
    '/assets/sunnyland/player-idle-1.png', '/assets/sunnyland/player-idle-2.png',
    '/assets/sunnyland/player-idle-3.png', '/assets/sunnyland/player-idle-4.png',
    '/assets/sunnyland/player-run-1.png', '/assets/sunnyland/player-run-2.png',
    '/assets/sunnyland/player-run-3.png', '/assets/sunnyland/player-run-4.png',
    '/assets/sunnyland/player-run-5.png', '/assets/sunnyland/player-run-6.png',
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
    <div onClick={tap}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40, cursor: 'pointer' }}>
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
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40 }}>
      <div className="panel-pixel"
        style={{ margin: '0 14px 18px', background: 'rgba(8,24,12,0.95)', padding: '16px 18px', maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
        <p className="font-vt" style={{ color: '#eaf6e0', fontSize: 21, lineHeight: 1.3, marginBottom: 14 }}>
          {beat.q.text}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {beat.q.options.map((opt, i) => (
            <button key={i} onClick={() => answer(i)}
              className="font-vt"
              style={{
                textAlign: 'left', padding: '10px 14px', fontSize: 18,
                color: '#eaf6e0', background: 'rgba(30,70,38,0.9)',
                border: '2px solid #2f6b34', borderRadius: 6, cursor: 'pointer',
              }}>
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Mundo com parallax
// ─────────────────────────────────────────────────────────
// Cenário espalhado pelo mundo: árvores ao fundo (atrás do herói) e
// arbustos/pedras em primeiro plano (na frente). `f` = fator de parallax.
interface Prop { src: string; wx: number; f: number; h: number; b: number; z: number; flip?: boolean; sway?: boolean }

const SCENERY: Prop[] = [
  // árvores de meio-termo (atrás do herói, z < 14)
  { src: 'world/tree-oak1.png',  wx: 280,  f: 0.8,  h: 210, b: GROUND - 6, z: 5, sway: true },
  { src: 'world/tree-pine.png',  wx: 540,  f: 0.85, h: 180, b: GROUND - 2, z: 6, sway: true, flip: true },
  { src: 'pack01/Pine_01.png',   wx: 820,  f: 0.82, h: 195, b: GROUND - 2, z: 5, sway: true },
  { src: 'world/tree-birch1.png',wx: 1080, f: 0.88, h: 170, b: GROUND - 2, z: 7, sway: true },
  { src: 'world/tree-oak2.png',  wx: 1360, f: 0.8,  h: 205, b: GROUND - 6, z: 5, sway: true, flip: true },
  { src: 'world/tree-birch2.png',wx: 1640, f: 0.86, h: 168, b: GROUND - 2, z: 6, sway: true },
  { src: 'world/tree-pine.png',  wx: 1950, f: 0.84, h: 185, b: GROUND - 2, z: 5, sway: true },
  { src: 'pack01/Pine_01.png',   wx: 2240, f: 0.83, h: 190, b: GROUND - 2, z: 6, sway: true, flip: true },
  // primeiro plano (na frente do herói, z > 14)
  { src: 'pack01/BUSH_01.png',   wx: 180,  f: 1.08, h: 60,  b: GROUND - 18, z: 16 },
  { src: 'pack01/Rock_01.png',   wx: 620,  f: 1.1,  h: 64,  b: GROUND - 16, z: 16 },
  { src: 'pack01/BUSH_02.png',   wx: 1000, f: 1.12, h: 56,  b: GROUND - 18, z: 17, flip: true },
  { src: 'pack01/Rock_02.png',   wx: 1480, f: 1.1,  h: 60,  b: GROUND - 16, z: 16 },
  { src: 'pack01/BUSH_01.png',   wx: 1880, f: 1.13, h: 58,  b: GROUND - 18, z: 17 },
  // detalhes charmosos do SunnyLand (pixel art, combinam com o herói)
  { src: 'sunnyland/sign.png',    wx: 420,  f: 1.05, h: 66, b: GROUND - 12, z: 16 },
  { src: 'sunnyland/shrooms.png', wx: 880,  f: 1.1,  h: 46, b: GROUND - 12, z: 17 },
  { src: 'sunnyland/shrooms.png', wx: 1300, f: 1.12, h: 40, b: GROUND - 12, z: 16, flip: true },
  { src: 'sunnyland/bush.png',    wx: 1720, f: 1.08, h: 58, b: GROUND - 14, z: 16 },
];

const CLOUDS = [
  { src: 'world/cloud1.png', wx: 120,  top: '7%',  w: 150, cls: 'cloud-1' },
  { src: 'world/cloud2.png', wx: 560,  top: '14%', w: 120, cls: 'cloud-2' },
  { src: 'world/cloud3.png', wx: 980,  top: '9%',  w: 170, cls: 'cloud-3' },
  { src: 'world/cloud1.png', wx: 1500, top: '16%', w: 130, cls: 'cloud-2' },
  { src: 'world/cloud2.png', wx: 2000, top: '6%',  w: 140, cls: 'cloud-1' },
];

function PropImg({ p, worldX }: { p: Prop; worldX: number }) {
  const screenX = Math.round(p.wx - worldX * p.f);
  const vw = typeof window !== 'undefined' ? window.innerWidth : 900;
  // não renderiza se estiver completamente fora do viewport
  if (screenX > vw + p.h || screenX < -(p.h * 2)) return null;
  return (
    <div style={{ position: 'absolute', left: screenX, bottom: p.b, zIndex: p.z, transform: p.flip ? 'scaleX(-1)' : undefined, transformOrigin: 'bottom center' }}>
      <img src={`/assets/${p.src}`} alt="" className={p.sway ? 'tree-sway' : undefined}
        style={{ height: p.h, width: 'auto', display: 'block', imageRendering: 'pixelated', filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.32))' }} />
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
            background: 'radial-gradient(circle, #fff6c0, rgba(255,230,140,0.2))',
            boxShadow: '0 0 6px 2px rgba(255,235,150,0.5)',
            ['--mx' as string]: `${(s(19) > 0.5 ? 1 : -1) * (10 + s(23) * 40)}px`,
            animation: `mote-float ${6 + s(5) * 7}s ease-in-out ${-s(11) * 8}s infinite`,
          }} />
        );
      })}
    </div>
  );
}

function ParallaxWorld({ bg, worldX, gateOpen }: { bg: SceneBg; worldX: number; gateOpen: boolean }) {
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

  const layer = (src: string, factor: number, height: string, bottom: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute', left: 0, right: 0, bottom,
    height, backgroundImage: `url('${src}')`,
    backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
    backgroundPositionX: `${Math.round(-worldX * factor)}px`, backgroundPositionY: 'bottom',
    imageRendering: 'pixelated', ...extra,
  });

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* céu */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/assets/world/bg-layer5.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
      {/* nuvens */}
      {CLOUDS.map((c, i) => (
        <img key={i} src={`/assets/${c.src}`} alt="" className={c.cls}
          style={{ position: 'absolute', left: c.wx - worldX * 0.06, top: c.top, width: c.w, imageRendering: 'pixelated', opacity: 0.85, zIndex: 1 }} />
      ))}
      {/* montanhas distantes */}
      <div style={layer('/assets/world/bg-layer4.png', 0.12, '40vh', GROUND + 30, { opacity: 0.92 })} />
      {/* silhueta de selva ao fundo */}
      <div style={layer('/assets/pack01/BACKGROUNDS_01.png', 0.2, '30vh', GROUND + 6, { opacity: 0.55 })} />
      {/* pinheiros — longe → perto */}
      <div style={layer('/assets/world/bg-layer3.png', 0.28, '32vh', GROUND)} />
      <div style={layer('/assets/world/bg-layer2.png', 0.5, '38vh', GROUND)} />
      <div style={layer('/assets/world/bg-layer1.png', 0.78, '44vh', GROUND - 6)} />

      {/* árvores de meio-termo (atrás do herói) */}
      {SCENERY.filter(p => p.z < 14).map((p, i) => <PropImg key={`b${i}`} p={p} worldX={worldX} />)}

      {/* portão — fixo no mundo, aparece conforme o herói se aproxima */}
      {!gateOpen && (
        <div style={{
          position: 'absolute',
          left: Math.round(880 - worldX * 0.98),
          bottom: GROUND - 4, zIndex: 8,
          transformOrigin: 'bottom center',
        }}>
          <div style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', width: 120, height: 160, background: 'radial-gradient(circle, rgba(120,220,120,0.28), transparent 65%)', filter: 'blur(4px)' }} />
          <img src="/assets/sunnyland/door.png" alt="portão"
            style={{ position: 'relative', height: 168, width: 'auto', imageRendering: 'pixelated', filter: 'drop-shadow(0 8px 8px rgba(0,0,0,0.55))' }} />
          {[-30, -10, 12, 30].map(x => (
            <div key={x} style={{ position: 'absolute', top: 2, left: `calc(50% + ${x}px)`, width: 4, height: 26 + ((x + 40) % 22), background: '#3f7a2e', borderRadius: 3, zIndex: 9 }} />
          ))}
        </div>
      )}

      {/* chão — textura de terra com movimento */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND,
        backgroundImage: "url('/assets/world/dirt.png')",
        backgroundRepeat: 'repeat-x', backgroundSize: 'auto 100%',
        backgroundPositionX: `${-worldX * 1.0}px`,
        imageRendering: 'pixelated',
        boxShadow: 'inset 0 6px 14px rgba(0,0,0,0.45)',
      }} />
      {/* grama em primeiro plano */}
      <div style={layer('/assets/world/grass.png', 1.1, '54px', GROUND - 11, { zIndex: 12 })} />

      {/* arbustos e pedras em primeiro plano (na frente do herói) */}
      {SCENERY.filter(p => p.z >= 14).map((p, i) => <PropImg key={`f${i}`} p={p} worldX={worldX} />)}

      {/* poeira de luz mágica */}
      <LightMotes />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Herói
// ─────────────────────────────────────────────────────────
function Hero({ moving, frame }: { moving: boolean; frame: number }) {
  const src = moving
    ? `/assets/sunnyland/player-run-${(frame % 6) + 1}.png`
    : `/assets/sunnyland/player-idle-${(frame % 4) + 1}.png`;
  return (
    <img src={src} alt="herói"
      style={{
        position: 'absolute', left: '34%', bottom: GROUND - 6, zIndex: 14,
        height: 92, width: 'auto', imageRendering: 'pixelated',
        transform: 'translateX(-50%)',
        filter: 'drop-shadow(0 5px 4px rgba(0,0,0,0.4))',
      }} />
  );
}

// ─────────────────────────────────────────────────────────
// Motor principal
// ─────────────────────────────────────────────────────────
export default function StoryGame({ onExit }: { onExit: () => void }) {
  const beats = ACT1.beats;
  const [beatIndex, setBeatIndex] = useState(0);
  const [bg, setBg] = useState<SceneBg>('noite');
  const [worldX, setWorldX] = useState(0);
  const [fade, setFade] = useState<{ text?: string } | null>(null);
  const [moving, setMoving] = useState(false);
  const [frame, setFrame] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);

  const beat: Beat | undefined = beats[beatIndex];
  const advance = useCallback(() => setBeatIndex(i => i + 1), []);

  // reseta o portão a cada novo beat
  useEffect(() => { setGateOpen(false); }, [beatIndex]);

  // animação dos quadros do herói
  useEffect(() => {
    const id = setInterval(() => setFrame(f => f + 1), moving ? 95 : 240);
    return () => clearInterval(id);
  }, [moving]);

  // beats automáticos (cenário / fade)
  useEffect(() => {
    if (!beat) return;
    if (beat.t === 'scene') { setBg(beat.bg); advance(); }
    else if (beat.t === 'fade') {
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

  useEffect(() => {
    if (beat?.t === 'walk') targetRef.current = worldX + beat.dist;
    else targetRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIndex]);

  // chegou ao alvo → avança
  useEffect(() => {
    if (beat?.t === 'walk' && targetRef.current != null && worldX >= targetRef.current) {
      holdRef.current = false; setMoving(false);
      targetRef.current = null;
      advance();
    }
  }, [worldX, beat, advance]);

  const loop = useCallback((ts: number) => {
    const dt = lastRef.current ? (ts - lastRef.current) / 1000 : 0;
    lastRef.current = ts;
    if (holdRef.current && targetRef.current != null) {
      setWorldX(x => Math.min(x + WALK_SPEED * dt, targetRef.current!));
      rafRef.current = requestAnimationFrame(loop);
    } else {
      rafRef.current = undefined; lastRef.current = 0;
    }
  }, []);

  const startWalk = useCallback(() => {
    if (beat?.t !== 'walk' || holdRef.current) return;
    holdRef.current = true; setMoving(true); lastRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [beat, loop]);

  const stopWalk = useCallback(() => {
    holdRef.current = false; setMoving(false);
  }, []);

  // teclado: segurar → / D para andar
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === 'd') startWalk(); };
    const up = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === 'd') stopWalk(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [startWalk, stopWalk]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const finished = beatIndex >= beats.length;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ touchAction: 'none', userSelect: 'none' }}>
      <ImagePreloader />
      <ParallaxWorld bg={bg} worldX={worldX} gateOpen={gateOpen} />

      {bg === 'floresta' && !finished && <Hero moving={moving} frame={frame} />}

      {/* botão sair */}
      <button onClick={onExit}
        className="font-pixel"
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 50, fontSize: 8, color: '#cfe8c0', background: 'rgba(8,24,12,0.8)', border: '2px solid #2f6b34', borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}>
        ✕ SAIR
      </button>

      {/* diálogo */}
      {beat?.t === 'say' && (
        <SayRunner key={beatIndex} beat={beat} onDone={advance} />
      )}

      {/* pergunta */}
      {beat?.t === 'question' && (
        <QuestionBeat key={beatIndex} beat={beat} onSolved={advance} onCorrect={() => setGateOpen(true)} />
      )}

      {/* controle de caminhada */}
      {beat?.t === 'walk' && (
        <button
          onPointerDown={startWalk} onPointerUp={stopWalk} onPointerLeave={stopWalk} onPointerCancel={stopWalk}
          className="font-pixel"
          style={{
            position: 'absolute', right: 22, bottom: 28, zIndex: 45,
            width: 92, height: 92, borderRadius: 18, fontSize: 24,
            color: '#0d2a0d', background: 'linear-gradient(to bottom,#7be04a,#3a9a18)',
            border: '4px solid #0d2a0d', boxShadow: '0 6px 0 #0d2a0d', cursor: 'pointer',
            touchAction: 'none',
          }}>
          →
        </button>
      )}
      {beat?.t === 'walk' && beat.hint && (
        <div className="font-pixel" style={{ position: 'absolute', left: '50%', top: '14%', transform: 'translateX(-50%)', zIndex: 45, color: '#eaf6e0', fontSize: 10, textShadow: '0 2px 4px #000', animation: 'hint-bob 1.4s ease-in-out infinite' }}>
          {beat.hint}
        </div>
      )}

      {/* fade */}
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
