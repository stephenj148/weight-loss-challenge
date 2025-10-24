import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZG4SxwWExDzJnjs3wbWboAvkmbAJQYU8",
  authDomain: "weight-loss-challenge-ap-6c2fb.firebaseapp.com",
  projectId: "weight-loss-challenge-ap-6c2fb",
  storageBucket: "weight-loss-challenge-ap-6c2fb.firebasestorage.app",
  messagingSenderId: "886097951337",
  appId: "1:886097951337:web:ce5725a0f62249366c80f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Firebase emulators already connected or not available');
  }
}

export default app;
