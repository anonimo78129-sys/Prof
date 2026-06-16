/**
 * Caixa de diálogo estilo JRPG clássico.
 * Retrato flutua à esquerda fora da caixa, aba com nome acima dele.
 * Caixa bege com texto grande e indicador de tap no canto inferior direito.
 */

interface Props {
  portrait?: string;
  name: string;
  text: string;
  accentColor?: string;
  tapHint?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function DialogBox({
  portrait,
  name,
  text,
  accentColor = '#4a8ec8',
  tapHint,
  onClick,
  children,
}: Props) {
  return (
    <div className="w-full px-3 pb-3" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <div className="relative max-w-md mx-auto">

        {/* ── Portrait + name (floats left, overlaps dialog top) ── */}
        <div
          className="absolute"
          style={{ left: 0, bottom: '100%', marginBottom: -6, zIndex: 2 }}
        >
          {/* Name tab */}
          <div
            style={{
              background: accentColor,
              border: `2px solid rgba(0,0,0,0.35)`,
              boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
              padding: '2px 8px',
              marginBottom: 0,
              display: 'inline-block',
            }}
          >
            <span className="font-pixel" style={{ color: '#fff', fontSize: 6, textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}>
              {name}
            </span>
          </div>

          {/* Portrait frame */}
          <div
            style={{
              width: 64,
              height: 64,
              background: '#d8e8f8',
              border: `3px solid ${accentColor}`,
              boxShadow: `3px 3px 0 rgba(0,0,0,0.35)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {portrait ? (
              <img
                src={portrait}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
              />
            ) : (
              <span style={{ fontSize: 32 }}>👤</span>
            )}
          </div>
        </div>

        {/* ── Dialog box (bege / cream) ── */}
        <div
          style={{
            background: 'linear-gradient(160deg, #f5ead0 0%, #e8d8b0 100%)',
            border: `3px solid ${accentColor}`,
            boxShadow: '4px 4px 0 rgba(0,0,0,0.35)',
            padding: '10px 12px 10px 78px', // left space for portrait
            minHeight: 80,
            position: 'relative',
          }}
        >
          {/* Text */}
          <p
            className="font-vt"
            style={{
              color: '#1a0c00',
              fontSize: 21,
              lineHeight: 1.35,
            }}
          >
            {text}
          </p>

          {/* Extra content (buttons, etc.) */}
          {children && (
            <div className="mt-2">{children}</div>
          )}

          {/* Tap indicator dot */}
          {tapHint && (
            <div className="absolute bottom-2 right-3 flex items-center gap-1">
              <span className="font-vt" style={{ color: '#8a6a30', fontSize: 14 }}>{tapHint}</span>
              <div
                className="sparkle"
                style={{ width: 8, height: 8, background: accentColor, borderRadius: '50%', animationDuration: '0.9s' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
