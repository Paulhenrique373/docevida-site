
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBHZIkTyopTSTOlMFy5cHSLit1fSCo1TqQ",
  authDomain: "doce-vida-8421b.firebaseapp.com",
  projectId: "doce-vida-8421b",
  storageBucket: "doce-vida-8421b.firebasestorage.app",
  messagingSenderId: "897772461493",
  appId: "1:897772461493:web:d0a3aef59d048787990dfc",
  measurementId: "G-FT6MQWYTSJ"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;