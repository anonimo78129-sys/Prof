// Minimal service worker for PWA
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
