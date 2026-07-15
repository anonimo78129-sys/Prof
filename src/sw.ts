// Minimal service worker for PWA
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// A tela de registro (registerSW.js) não envia SKIP_WAITING nem recarrega a
// página sozinha — sem isto, cada novo deploy ficava "esperando" enquanto o
// worker antigo (com JS/assets antigos) continuava servindo o jogo
// indefinidamente, mesmo depois de o jogador recarregar a página. Isso fazia
// mudanças (áudio, ilustrações, roteiro) "sumirem" para quem já tinha
// visitado o jogo antes.
self.skipWaiting();
// @ts-ignore
self.addEventListener('activate', (event) => {
  // @ts-ignore
  event.waitUntil(self.clients.claim());
});
