import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDP9aD-sZAJr9ohEkMg_6pF0oeIGjQ1I64",
  authDomain: "employee-doc-req-com.firebaseapp.com",
  projectId: "employee-doc-req-com",
  storageBucket: "employee-doc-req-com.firebasestorage.app",
  messagingSenderId: "182987543446",
  appId: "1:182987543446:web:50100ef8eb1dbbfd1303b7",
  measurementId: "G-NX63HC2YKY"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;