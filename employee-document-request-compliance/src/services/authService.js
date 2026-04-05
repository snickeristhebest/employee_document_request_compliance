import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";

export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logoutUser() {
  return await signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}