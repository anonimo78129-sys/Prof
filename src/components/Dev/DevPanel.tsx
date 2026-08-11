import { useState } from 'react';

// ─────────────────────────────────────────────────────────
// Painel de DEV da tela inicial.
//
// Antes ficava embutido no App e só aparecia em build de desenvolvimento
// ou com ?test na URL, o que o tornava invisível justamente na versão
// publicada, que é onde dá para testar do celular. Agora aparece sempre,
// discreto no canto.
// ─────────────────────────────────────────────────────────

export interface DevCena { label: string; id: string }

export interface DevPanelProps {
  cenas: readonly DevCena[];
  onPular: (sceneId: string) => void;
  onGaleria: () => void;
}

const CHIP = {
  background: 'rgba(0,0,0,0.7)', border: '1px solid #4C7A8C', color: '#4C7A8C',
  fontFamily: 'monospace', fontSize: 11, padding: '8px 14px', borderRadius: 4, cursor: 'pointer',
} as const;

const ITEM = {
  background: '#14121a', border: '1px solid #332A3B', color: '#C7B990',
  fontFamily: 'monospace', fontSize: 11, padding: '10px 12px', borderRadius: 4,
  cursor: 'pointer', textAlign: 'left',
} as const;

async function limpaCache() {
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  window.location.reload();
}

export default function DevPanel({ cenas, onPular, onGaleria }: DevPanelProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(a => !a)}
        style={{ ...CHIP, position: 'absolute', bottom: 12, right: 12, zIndex: 90 }}
      >
        DEV
      </button>

      {aberto && (
        <div style={{
          position: 'absolute', bottom: 48, right: 12, zIndex: 90,
          background: 'rgba(10,8,12,0.97)', border: '1px solid #4C7A8C', borderRadius: 8,
          padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
          minWidth: 260, maxHeight: '76vh', overflowY: 'auto',
        }}>
          <button
            onClick={() => { setAberto(false); onGaleria(); }}
            style={{
              ...ITEM, background: '#0d1a20', border: '1px solid #4C7A8C',
              color: '#8fd0e6', fontWeight: 'bold',
            }}
          >
            🎨 Galeria de estilos
          </button>

          <button
            onClick={limpaCache}
            style={{
              ...ITEM, background: '#1a0a00', border: '1px solid #ff6020',
              color: '#ff9060', fontWeight: 'bold',
            }}
          >
            ♻ Forçar atualização
          </button>

          <div style={{
            color: '#4C7A8C', fontFamily: 'monospace', fontSize: 10,
            letterSpacing: 2, marginTop: 4,
          }}>
            PULAR PARA
          </div>
          {cenas.map(c => (
            <button key={c.id} onClick={() => { setAberto(false); onPular(c.id); }} style={ITEM}>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
