import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBqukkcmadiPtKQpYmXvj2QmPyEl_4Oztg",
  authDomain: "campconnect-d428f.firebaseapp.com",
  projectId: "campconnect-d428f",
  storageBucket: "campconnect-d428f.firebasestorage.app",
  messagingSenderId: "582377072400",
  appId: "1:582377072400:web:76bef15d92a5bde8572795"
                       // From Firebase Console
};

const app = initializeApp(firebaseConfig);

let messaging: any = null;

try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.log('Firebase messaging not supported:', error);
}

export { messaging, getToken, onMessage };
export const VAPID_KEY = 'BOo-YvVBDP9ofWcGGE_5AlgFA1MnJXfBqnwivJkc1Bwm0sxoFrkDKGTTd45UEX_csOEVjPKSD35jnqxMzND-2_I'; // From Cloud Messaging → Web Push certificates
