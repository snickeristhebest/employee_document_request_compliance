import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export async function createEmployee({ firstName, lastName, email, clinic }) {
  return await addDoc(collection(db, "employees"), {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    clinic: clinic.trim(),
    isActive: true,
    createdAt: serverTimestamp(),
  });
}