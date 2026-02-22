import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBC4nu3mYiOXhBX0GD-Mx-Up9neWwU5XMQ",
  authDomain: "prakruthi-mithra-ai.firebaseapp.com",
  projectId: "prakruthi-mithra-ai",
  storageBucket: "prakruthi-mithra-ai.firebasestorage.app",
  messagingSenderId: "28907819624",
  appId: "1:28907819624:web:e2364d10efc10f2cdbe1dd",
  measurementId: "G-GYS909V1LJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
