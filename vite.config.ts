import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        includeAssets: ['manifest.json'],
        manifest: false,
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Os estudos de estilo são ferramenta do painel DEV, não arte do
          // jogo. Fora do precache eles não entram no download de instalação
          // de quem só vai jogar; a galeria busca sob demanda.
          globIgnores: [
            '**/assets/cinzas/estudos/**',
            // O guarda-roupa de O POÇO são 2,6 MB em 250 folhas de peça,
            // e uma partida carrega no máximo dez delas. Precachear tudo
            // dobraria o download de instalação de quem nem vai jogar. Os
            // atlas de miniatura, o cenário e os bichos continuam dentro:
            // é com eles que o criador e as três fases se desenham.
            '**/assets/poco/{corpo,cabelo,orelha,roupa,braco,chapeu,mascara,mao,amarras}/**',
          ],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.PIXABAY_API_KEY': JSON.stringify(env.PIXABAY_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
