import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../firebase";

const functions = getFunctions(app, "us-central1");

export async function createEmployeeAccount(data) {
  const callable = httpsCallable(functions, "createEmployeeAccount");
  const result = await callable(data);
  return result.data;
}