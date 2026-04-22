import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export async function createEmployee({ firstName, lastName, email, clinic, role = "employee" }) {
  const normalizedEmail = normalizeEmail(email);
  const employeeRef = doc(db, "employees", normalizedEmail);

  const existingDoc = await getDoc(employeeRef);

  if (existingDoc.exists()) {
    throw new Error("An employee with that email already exists.");
  }

  await setDoc(employeeRef, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    clinic: clinic.trim().toLowerCase(),
    role,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return employeeRef;
}

export function subscribeToEmployees(callback, onError) {
  const q = query(
    collection(db, "employees"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const employees = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(employees);
    },
    onError
  );
}

export function subscribeToInactiveEmployees(callback, onError) {
  const q = query(
    collection(db, "employees"),
    where("isActive", "==", false),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const employees = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(employees);
    },
    onError
  );
}

export async function deactivateEmployee(employeeId) {
  const employeeRef = doc(db, "employees", employeeId);

  await updateDoc(employeeRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
}

export async function reactivateEmployee(employeeId) {
  const employeeRef = doc(db, "employees", employeeId);

  await updateDoc(employeeRef, {
    isActive: true,
    updatedAt: serverTimestamp(),
  });
}

export async function permanentlyDeleteEmployee(employeeId) {
  const employeeRef = doc(db, "employees", employeeId);
  await deleteDoc(employeeRef);
}