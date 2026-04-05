import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDDGK-5o9xgABpMf7pNB3MM-MDQRndZEfM",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "roamio-e7376.firebaseapp.com",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    "https://roamio-e7376-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "roamio-e7376",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "roamio-e7376.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "343632193263",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:343632193263:web:7412fca501abbd45f25d1a",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);
export default app;
