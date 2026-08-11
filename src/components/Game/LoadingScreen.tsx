import { useEffect, useRef, useState } from 'react';
import { preloadImages } from '../../game/preloadImages';
import { C, CENA_FLAT, bevel } from '../../game/theme';

// Tempo mínimo em tela para o carregamento não "piscar" quando as imagens
// já estão em cache (evita um flash desconfortável).
const MIN_MS = 900;

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const start = Date.now();
    let raf = 0;

    // progresso real das imagens (0..1)
    let target = 0;
    // progresso exibido, que persegue o alvo suavemente
    let shown = 0;

    const tick = () => {
      shown += (target - shown) * 0.18;
      setPct(Math.min(100, Math.round(shown * 100)));
      if (!doneRef.current) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      window.setTimeout(() => {
        doneRef.current = true;
        cancelAnimationFrame(raf);
        setPct(100);
        onDone();
      }, wait);
    };

    preloadImages((loaded, total) => {
      target = total ? loaded / total : 1;
    }).then(finish);

    return () => { doneRef.current = true; cancelAnimationFrame(raf); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden', background: C.ink,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      touchAction: 'none', userSelect: 'none',
    }}>
      {/* mesma arte da tela inicial, escurecida */}
      <img src={CENA_FLAT('hero')} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center 38%',
        imageRendering: 'pixelated', pointerEvents: 'none', filter: 'brightness(0.45) saturate(0.9)',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,5,14,0.55)' }} />

      <div style={{
        position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 18, padding: '0 28px', width: '100%', maxWidth: 340,
      }}>
        <p className="font-pixel" style={{
          color: C.bone, fontSize: 15, letterSpacing: 5, textAlign: 'center',
          textShadow: `0 3px 0 ${C.line}`, margin: 0,
        }}>
          CINZAS
        </p>

        {/* barra segmentada, combinando com os cartões de recurso */}
        <div style={{
          width: '100%', background: C.shell, border: `2px solid ${C.line}`,
          boxShadow: bevel(3), padding: 4, display: 'flex', gap: 2,
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} style={{
              flex: 1, height: 12,
              background: i < Math.round((pct / 100) * 16) ? C.rust : 'rgba(0,0,0,0.4)',
              transition: 'background 160ms linear',
            }} />
          ))}
        </div>

        <p className="font-pixel" style={{ color: C.boneDim, fontSize: 8, letterSpacing: 1, margin: 0 }}>
          {pct}%  ·  LIGANDO OS SISTEMAS DO ABRIGO
        </p>
      </div>
    </div>
  );
}
