import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0382301536",
  appId: "1:997514499964:web:d4b91ee893054332b376f9",
  apiKey: "AIzaSyDeKJyEokyl1AnsWzuzOHKHy2AX7CvQS_Q",
  authDomain: "gen-lang-client-0382301536.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-81c72cbf-4707-4385-9ebe-3be30c72af10",
  storageBucket: "gen-lang-client-0382301536.firebasestorage.app",
  messagingSenderId: "997514499964",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-81c72cbf-4707-4385-9ebe-3be30c72af10");
