import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const getEnv = (key: string, fallback: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}
  try {
    if (typeof (import.meta as any) !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key] as string;
    }
  } catch (e) {}
  return fallback;
};

const firebaseConfig = {
  projectId: getEnv('FIREBASE_PROJECT_ID', "gen-lang-client-0382301536"),
  appId: getEnv('FIREBASE_APP_ID', "1:997514499964:web:d4b91ee893054332b376f9"),
  apiKey: getEnv('FIREBASE_API_KEY', "AIzaSyDeKJyEokyl1AnsWzuzOHKHy2AX7CvQS_Q"),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN', "gen-lang-client-0382301536.firebaseapp.com"),
  firestoreDatabaseId: getEnv('FIREBASE_DATABASE_ID', "ai-studio-81c72cbf-4707-4385-9ebe-3be30c72af10"),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET', "gen-lang-client-0382301536.firebasestorage.app"),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID', "997514499964"),
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, getEnv('FIREBASE_DATABASE_ID', "ai-studio-81c72cbf-4707-4385-9ebe-3be30c72af10"));
