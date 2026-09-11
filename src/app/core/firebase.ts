import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBr6Q2ryP7yN6FthW9U3o7UN_ELbspxuQc',
  authDomain: 'cinema-master-4946d.firebaseapp.com',
  projectId: 'cinema-master-4946d',
  storageBucket: 'cinema-master-4946d.firebasestorage.app',
  messagingSenderId: '1032646540712',
  appId: '1:1032646540712:web:73c47c2df116b29c8cf19d'
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  // Avoid long-lived streaming responses on browsers or networks that block them.
  experimentalForceLongPolling: true
});
export const auth = getAuth(app);
