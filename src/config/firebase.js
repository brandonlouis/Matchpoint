import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCupY08ruHrFZrbNHDYHZc3ndZB9pk9YIM",
  authDomain: "matchpoint-7e1f1.firebaseapp.com",
  projectId: "matchpoint-7e1f1",
  storageBucket: "matchpoint-7e1f1.appspot.com",
  messagingSenderId: "728455225432",
  appId: "1:728455225432:web:23b74ac7073acbcc5daa2d",
  measurementId: "G-2CNS0EB8E2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);