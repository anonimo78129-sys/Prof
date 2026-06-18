import { useCallback, useEffect, useRef, useState } from 'react';
import type { Beat, SceneBg, Speaker } from '../../game/types';
import { ACT1 } from '../../game/script';

const GROUND = 132;          // altura da faixa de chão (px)
const WALK_SPEED = 230;      // px/seg que o herói anda

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
function QuestionBeat({ beat, onSolved }: { beat: Extract<Beat, { t: 'question' }>; onSolved: () => void }) {
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
    if (i === beat.q.correct) { setSuccessIdx(0); setPhase('success'); }
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
function ParallaxWorld({ bg, worldX, showGate }: { bg: SceneBg; worldX: number; showGate: boolean }) {
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
    backgroundPositionX: `${-worldX * factor}px`, backgroundPositionY: 'bottom',
    imageRendering: 'pixelated', ...extra,
  });

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* céu */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('/assets/world/bg-layer5.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
      {/* montanhas distantes */}
      <div style={layer('/assets/world/bg-layer4.png', 0.12, '40vh', GROUND + 30, { opacity: 0.92 })} />
      {/* pinheiros — longe → perto */}
      <div style={layer('/assets/world/bg-layer3.png', 0.28, '32vh', GROUND)} />
      <div style={layer('/assets/world/bg-layer2.png', 0.5, '38vh', GROUND)} />
      <div style={layer('/assets/world/bg-layer1.png', 0.78, '44vh', GROUND - 6)} />

      {/* portão (placeholder em CSS) aparece centralizado quando há desafio */}
      {showGate && (
        <div style={{ position: 'absolute', left: '50%', bottom: GROUND - 8, transform: 'translateX(-50%)', zIndex: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, filter: 'drop-shadow(0 6px 6px rgba(0,0,0,0.5))' }}>
            <div style={{ width: 16, height: 150, background: 'linear-gradient(#5b3b1e,#3a2412)', borderRadius: 3 }} />
            <div style={{ width: 96, height: 130, background: 'repeating-linear-gradient(90deg,#6a4524 0 8px,#4a2f17 8px 16px)', border: '3px solid #3a2412', borderRadius: '6px 6px 0 0', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(80,160,60,0.5), transparent 60%)' }} />
            </div>
            <div style={{ width: 16, height: 150, background: 'linear-gradient(#5b3b1e,#3a2412)', borderRadius: 3 }} />
          </div>
        </div>
      )}

      {/* chão */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: GROUND, background: 'linear-gradient(#3a5a24 0 10px, #2c3f1a 10px)', boxShadow: 'inset 0 6px 12px rgba(0,0,0,0.35)' }} />
      {/* grama em primeiro plano */}
      <div style={layer('/assets/world/grass.png', 1.1, '54px', GROUND - 26, { zIndex: 12 })} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Herói
// ─────────────────────────────────────────────────────────
function Hero({ moving, frame }: { moving: boolean; frame: number }) {
  const src = moving
    ? `/assets/hero/walk${(frame % 6) + 1}.png`
    : `/assets/hero/idle${(frame % 5) + 1}.png`;
  return (
    <img src={src} alt="herói"
      style={{
        position: 'absolute', left: '34%', bottom: GROUND - 10, zIndex: 14,
        height: 104, width: 'auto', imageRendering: 'pixelated',
        transform: 'translateX(-50%)',
        filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.45))',
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

  const beat: Beat | undefined = beats[beatIndex];
  const advance = useCallback(() => setBeatIndex(i => i + 1), []);

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
      <ParallaxWorld bg={bg} worldX={worldX} showGate={beat?.t === 'question'} />

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
        <QuestionBeat key={beatIndex} beat={beat} onSolved={advance} />
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
