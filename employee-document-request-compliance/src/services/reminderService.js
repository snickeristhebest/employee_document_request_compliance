import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../firebase";

const functions = getFunctions(app);

export async function runReminderScanNow() {
  const callable = httpsCallable(functions, "runReminderScanNow");
  const result = await callable({});
  return result.data;
}