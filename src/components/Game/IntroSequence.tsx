import { useCallback, useEffect, useRef, useState } from 'react';

type CueType = 'narrador' | 'protagonista' | 'voz' | 'evento';
interface Cue { type: CueType; text: string; }
interface Slide {
  frames: string[];
  frameForCue?: number[];  // frame index per cue; if absent, stays on frame 0
  cues: Cue[];
  autoDuration?: number;   // ms — for slides with no cues, auto-advance
}

const CUE_CFG: Record<CueType, { label: string | null; color: string; bg: string; italic: boolean; center: boolean }> = {
  narrador:     { label: null,             color: '#c8dce8', bg: 'rgba(6,14,22,0.92)',  italic: true,  center: false },
  protagonista: { label: 'Você',           color: '#eaf6e0', bg: 'rgba(8,24,12,0.94)',  italic: false, center: false },
  voz:          { label: 'Voz Misteriosa', color: '#40e0d0', bg: 'rgba(0,28,22,0.94)',  italic: true,  center: false },
  evento:       { label: null,             color: '#e0e0e0', bg: 'rgba(0,0,0,0.60)',    italic: true,  center: true  },
};

// Typewriter speed (ms per char)
const SPEED: Record<CueType, number> = { narrador: 28, protagonista: 28, voz: 55, evento: 32 };

const SLIDES: Slide[] = [
  // 01 — Ponto de ônibus
  {
    frames: ['/assets/intro/01-ponto-onibus.png'],
    cues: [
      { type: 'narrador',     text: 'O dia foi longo.' },
      { type: 'narrador',     text: 'Provas, trabalhos e horas de estudo consumiram quase toda a sua energia.' },
      { type: 'protagonista', text: 'Faltam apenas 3 dias para a prova final...' },
      { type: 'protagonista', text: 'Preciso revisar mais algumas coisas quando chegar em casa.' },
    ],
  },
  // 02 — Ônibus chegando
  {
    frames: ['/assets/intro/02-onibus-chegando.png'],
    cues: [
      { type: 'evento', text: 'O ônibus chega ao ponto.' },
      { type: 'evento', text: 'As portas se abrem.' },
      { type: 'evento', text: 'O protagonista embarca.' },
    ],
  },
  // 03 — Janela do ônibus (3 frames: acordado → sonolento → dormindo)
  {
    frames: [
      '/assets/intro/03-janela-f1.png',
      '/assets/intro/03-janela-f2.png',
      '/assets/intro/03-janela-f3.png',
    ],
    frameForCue: [0, 1, 2],
    cues: [
      { type: 'narrador',     text: 'O balanço constante do ônibus torna cada vez mais difícil manter os olhos abertos.' },
      { type: 'protagonista', text: 'Talvez eu possa descansar por alguns minutos...' },
      { type: 'protagonista', text: 'Só um cochilo rápido...' },
    ],
  },
  // 04 — Dormindo no ônibus → neblina (2 frames)
  {
    frames: ['/assets/intro/04-dormindo-f1.png', '/assets/intro/04-neblina.png'],
    frameForCue: [0, 0, 1],
    cues: [
      { type: 'evento', text: 'O som do motor fica distante.' },
      { type: 'evento', text: 'As luzes da cidade desaparecem.' },
      { type: 'evento', text: 'Tudo fica branco.' },
    ],
  },
  // 05 — Acordando na grama (frame 0 = dormindo, frame 1 = acordando)
  {
    frames: [
      '/assets/intro/05-grama-f1.png',
      '/assets/intro/05-grama-f2.png',
    ],
    frameForCue: [0, 0, 1, 1, 1],
    cues: [
      { type: 'voz',      text: 'Acorde...' },
      { type: 'voz',      text: 'Plante seu amanhã...' },
      { type: 'narrador', text: 'Você abre os olhos lentamente.' },
      { type: 'narrador', text: 'O assento do ônibus desapareceu.' },
      { type: 'narrador', text: 'O som do trânsito não existe mais.' },
    ],
  },
  // 06 — Protagonista confuso
  {
    frames: ['/assets/intro/06-confuso.png'],
    cues: [
      { type: 'narrador',     text: 'Um vasto jardim botânico se estende diante de você.' },
      { type: 'narrador',     text: 'Folhas gigantes filtram a luz do céu.' },
      { type: 'narrador',     text: 'O ar é úmido e silencioso.' },
      { type: 'protagonista', text: 'O quê...?' },
      { type: 'protagonista', text: 'Eu estava no ônibus...' },
      { type: 'protagonista', text: 'Como vim parar aqui?' },
      { type: 'protagonista', text: 'Estou sonhando?' },
    ],
  },
  // 06b — Visão geral (auto-avança, sem texto)
  {
    frames: ['/assets/intro/06b-visao-geral.png'],
    cues: [],
    autoDuration: 2800,
  },
  // 07 — Explorando o jardim
  {
    frames: ['/assets/intro/07-explorando.png'],
    cues: [
      { type: 'narrador', text: 'Sem encontrar respostas, você decide explorar.' },
      { type: 'narrador', text: 'Cada passo leva você para mais longe da realidade que conhecia.' },
    ],
  },
];

export default function IntroSequence({ onDone }: { onDone: () => void }) {
  const [slideIdx, setSlideIdx]   = useState(0);
  const [cueIdx,   setCueIdx]     = useState(0);
  const [shown,    setShown]      = useState('');
  const [typeDone, setTypeDone]   = useState(false);
  const [opacity,  setOpacity]    = useState(1);   // 0→1 for slide cross-fade

  const slide   = SLIDES[slideIdx];
  const cue     = slide.cues[cueIdx] ?? null;
  const frameIdx = slide.frameForCue ? (slide.frameForCue[cueIdx] ?? 0) : 0;
  const frameSrc = slide.frames[Math.min(frameIdx, slide.frames.length - 1)];

  // keep previous frame src to detect change (for within-slide frame fade)
  const prevFrame = useRef(frameSrc);
  const [imgOpacity, setImgOpacity] = useState(1);

  useEffect(() => {
    if (prevFrame.current !== frameSrc) {
      setImgOpacity(0);
      const t = setTimeout(() => { setImgOpacity(1); prevFrame.current = frameSrc; }, 80);
      return () => clearTimeout(t);
    }
  }, [frameSrc]);

  // Typewriter
  useEffect(() => {
    if (!cue) return;
    setShown(''); setTypeDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(cue.text.slice(0, i));
      if (i >= cue.text.length) { clearInterval(id); setTypeDone(true); }
    }, SPEED[cue.type]);
    return () => clearInterval(id);
  }, [cue]);

  const goNextSlide = useCallback(() => {
    const next = slideIdx + 1;
    if (next >= SLIDES.length) { onDone(); return; }
    setOpacity(0);
    setTimeout(() => {
      setSlideIdx(next);
      setCueIdx(0);
      prevFrame.current = SLIDES[next].frames[0];
      setImgOpacity(1);
      setTimeout(() => setOpacity(1), 40);
    }, 380);
  }, [slideIdx, onDone]);

  // Auto-advance for slides without cues
  useEffect(() => {
    if (slide.cues.length > 0) return;
    const id = setTimeout(goNextSlide, slide.autoDuration ?? 2500);
    return () => clearTimeout(id);
  }, [slideIdx, slide, goNextSlide]);

  // Fade in on mount
  useEffect(() => { setOpacity(0); setTimeout(() => setOpacity(1), 30); }, []);

  const advance = useCallback(() => {
    if (!cue) return;
    if (!typeDone) { setShown(cue.text); setTypeDone(true); return; }
    const next = cueIdx + 1;
    if (next < slide.cues.length) { setCueIdx(next); return; }
    goNextSlide();
  }, [cue, typeDone, cueIdx, slide, goNextSlide]);

  const cfg = cue ? CUE_CFG[cue.type] : null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', cursor: 'pointer', touchAction: 'none', userSelect: 'none' }}
      onPointerDown={(e) => { e.preventDefault(); if (slide.cues.length > 0) advance(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ilustração */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url('${frameSrc}')`,
        backgroundSize: 'cover', backgroundPosition: 'center top',
        imageRendering: 'pixelated',
        opacity: opacity * imgOpacity,
        transition: 'opacity 0.38s ease',
      }} />

      {/* gradiente embaixo para legibilidade do texto */}
      {cue && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)',
          pointerEvents: 'none',
          opacity,
          transition: 'opacity 0.38s ease',
        }} />
      )}

      {/* caixa de texto */}
      {cue && cfg && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '0 16px 36px',
          opacity, transition: 'opacity 0.38s ease',
        }}>
          {cfg.label && (
            <p className="font-pixel" style={{ color: cfg.color, fontSize: 8, marginBottom: 6 }}>
              {cfg.label}
            </p>
          )}
          <div className="panel-pixel" style={{ background: cfg.bg, padding: '14px 16px' }}>
            <p className="font-vt" style={{
              color: cfg.color,
              fontSize: 22,
              lineHeight: 1.35,
              fontStyle: cfg.italic ? 'italic' : 'normal',
              textAlign: cfg.center ? 'center' : 'left',
              minHeight: 30,
              textShadow: cue.type === 'voz' ? '0 0 14px rgba(64,224,208,0.9), 0 0 28px rgba(64,224,208,0.5)' : 'none',
            }}>
              {shown}
            </p>
          </div>
          {typeDone && (
            <p className="font-pixel" style={{ color: '#7fae7a', fontSize: 8, textAlign: 'right', marginTop: 6 }}>
              ▶ toque
            </p>
          )}
        </div>
      )}

      {/* botão pular — delay de 100ms para a sequência de eventos do toque
          completar antes do StoryGame montar (evita acionar o botão SAIR na
          mesma posição quando os eventos de click ainda estão propagando) */}
      <button
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setTimeout(onDone, 100); }}
        onContextMenu={(e) => e.preventDefault()}
        className="font-pixel"
        style={{
          position: 'absolute', top: 14, right: 14, zIndex: 10,
          fontSize: 7, color: 'rgba(200,220,200,0.6)', background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(200,220,200,0.25)', borderRadius: 4,
          padding: '6px 10px', cursor: 'pointer', touchAction: 'none',
        }}>
        PULAR
      </button>
    </div>
  );
}
