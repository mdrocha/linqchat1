import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAAaGgwtBbsy_2WOUgQA2dDjgyPdw7zES4",
  authDomain: "linqchat-879c0.firebaseapp.com",
  projectId: "linqchat-879c0",
  storageBucket: "linqchat-879c0.firebasestorage.app",
  messagingSenderId: "1029663510307",
  appId: "1:1029663510307:web:6b25e69760ee3ac7fd8696"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);