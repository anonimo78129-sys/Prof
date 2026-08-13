import { CREDITS, CREDITS_NOTE } from '../../game/credits';
import { C } from '../../game/theme';

// ─────────────────────────────────────────────────────────
// Tela de créditos — cartão rolável sobre o céu de cinzas, no estilo
// pixel do jogo. Reúne as atribuições de arte, áudio, fontes e tecnologia.
// ─────────────────────────────────────────────────────────
export default function Credits({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: C.ink }}>
      <div style={{ position: 'absolute', inset: 0, background: C.shellLo, pointerEvents: 'none' }} />

      {/* botão voltar */}
      <button onClick={onBack} className="font-pixel" style={{
        position: 'absolute', top: 16, left: 14, zIndex: 20, fontSize: 9,
        color: C.bone, background: C.shell, border: `2px solid ${C.line}`,
        padding: '9px 12px', cursor: 'pointer',
      }}>
        ← VOLTAR
      </button>

      {/* conteúdo rolável */}
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '68px 16px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <h1 className="font-pixel" style={{
            fontSize: 16, color: C.rust, textAlign: 'center', lineHeight: 1.6,
            textShadow: `0 3px 0 ${C.line}`, marginBottom: 6,
          }}>
            CRÉDITOS
          </h1>
          <p className="font-pixel" style={{
            fontSize: 8, color: C.boneDim, textAlign: 'center', lineHeight: 1.7, marginBottom: 22,
          }}>
            CINZAS · O Último Abrigo · Prof. Corujão
          </p>

          {CREDITS.map(section => (
            <section key={section.heading} style={{ marginBottom: 22 }}>
              <h2 className="font-pixel" style={{
                fontSize: 10, color: C.steel, letterSpacing: 1, marginBottom: 10,
                paddingBottom: 6, borderBottom: `2px solid ${C.shellHi}`,
                textShadow: `0 2px 0 ${C.line}`,
              }}>
                {section.heading}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {section.items.map(item => (
                  <div key={item.title} style={{
                    background: 'rgba(27,22,32,0.9)', border: `2px solid ${C.shellHi}`, padding: '10px 12px',
                  }}>
                    <div className="font-pixel" style={{ fontSize: 9, color: C.bone, lineHeight: 1.5 }}>
                      {item.title}
                      {item.author && (
                        <span style={{ color: C.boneDim }}>{'  ·  '}{item.author}</span>
                      )}
                    </div>
                    {item.note && (
                      <div style={{ fontSize: 11, color: '#c9c0b0', lineHeight: 1.5, marginTop: 5 }}>
                        {item.note}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 6 }}>
                      {item.license && (
                        <span className="font-pixel" style={{
                          fontSize: 7, color: C.rust, background: 'rgba(0,0,0,0.35)',
                          border: '1px solid rgba(217,122,62,0.4)', borderRadius: 4, padding: '3px 6px',
                        }}>
                          {item.license}
                        </span>
                      )}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" style={{
                          fontSize: 11, color: '#7fc4e0', textDecoration: 'underline', wordBreak: 'break-all',
                        }}>
                          {item.url.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <p style={{
            fontSize: 11, color: C.boneDim, lineHeight: 1.6, textAlign: 'center',
            marginTop: 8, padding: '0 6px', fontStyle: 'italic',
          }}>
            {CREDITS_NOTE}
          </p>

          <p className="font-pixel" style={{
            fontSize: 8, color: C.boneDim, textAlign: 'center', lineHeight: 1.7, marginTop: 20,
          }}>
            Feito com carinho para a educação.
          </p>
        </div>
      </div>
    </div>
  );
}
