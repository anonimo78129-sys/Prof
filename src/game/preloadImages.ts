// ─────────────────────────────────────────────────────────
// Lista central das imagens do jogo + utilitário de pré-carregamento.
// Usada pela tela de carregamento (LoadingScreen) para baixar todas as
// artes antes do jogador começar. São PNGs pequenos de pixel art gerados
// por scripts/gen-art.mjs, então o carregamento é rápido.
// ─────────────────────────────────────────────────────────

const ICON = (p: string) => `/assets/cinzas/icons/${p}.png`;
const ART = (p: string) => `/assets/cinzas/art/${p}.png`;

export const CRITICAL_IMAGES: string[] = [
  // ícones do HUD e dos desfechos
  ...['bread', 'flask', 'medkit', 'bandage', 'nametag', 'poison', 'ablaze',
    'gasmask', 'lamp', 'busstop', 'silo', 'windmill', 'sprout'].map(ICON),
  // cenários pixel art + protagonista
  ...['bunker', 'ruins', 'toxic', 'cistern', 'station', 'settlement', 'greenhouse',
    'wasteland', 'dawn', 'bleak', 'lone', 'mancha', 'hero', 'survivor'].map(ART),
];

/**
 * Pré-carrega uma lista de imagens, reportando o progresso.
 * Nunca rejeita: imagens que falham contam como "carregadas" para não travar a tela.
 *
 * @param onProgress  chamado a cada imagem resolvida com (carregadas, total)
 * @param images      lista de URLs (padrão: CRITICAL_IMAGES)
 */
export function preloadImages(
  onProgress?: (loaded: number, total: number) => void,
  images: string[] = CRITICAL_IMAGES,
): Promise<void> {
  const unique = [...new Set(images)];
  const total = unique.length;
  let loaded = 0;

  return new Promise((resolve) => {
    if (total === 0) { resolve(); return; }

    const done = () => {
      loaded++;
      onProgress?.(loaded, total);
      if (loaded >= total) resolve();
    };

    for (const src of unique) {
      const img = new Image();
      img.onload = done;
      img.onerror = done;   // falhas não travam o jogo
      img.src = src;
    }
  });
}
