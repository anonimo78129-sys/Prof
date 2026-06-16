import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBUekzKNIoj5MlYj28wb2LLWRprYRCDPik',
  authDomain: 'gen-lang-client-0986512016.firebaseapp.com',
  projectId: 'gen-lang-client-0986512016',
  storageBucket: 'gen-lang-client-0986512016.firebasestorage.app',
  messagingSenderId: '1021747797278',
  appId: '1:1021747797278:web:80b72fc58bdc23179afd0f',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'ai-studio-cd641469-33cc-4791-8019-1268615bcbc5');
