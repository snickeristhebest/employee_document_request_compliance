import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export async function createRequest({
  employeeId,
  employeeEmail,
  employeeName,
  documentType,
  title,
  description,
  dueDate,
  expirationRequired,
}) {
  return await addDoc(collection(db, "requests"), {
    employeeId,
    employeeEmail,
    employeeName,
    documentType: documentType.trim(),
    title: title.trim(),
    description: description.trim(),
    status: "requested",
    dueDate,
    expirationRequired,
    expirationDate: null,
    fileUrl: null,
    submittedAt: null,
    approvedAt: null,
    rejectedReason: "",
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToRequests(callback, onError) {
  const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(requests);
    },
    onError
  );
}

export function subscribeToEmployeeRequests(employeeId, callback, onError) {
  const q = query(
    collection(db, "requests"),
    where("employeeId", "==", employeeId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(requests);
    },
    onError
  );
}

export async function deleteRequest(requestId) {
  const requestRef = doc(db, "requests", requestId);
  await deleteDoc(requestRef);
}

export async function updateRequestStatus(requestId, newStatus) {
  const requestRef = doc(db, "requests", requestId);

  const updates = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };

  if (newStatus === "submitted") {
    updates.submittedAt = serverTimestamp();
    updates.approvedAt = null;
  } else if (newStatus === "approved") {
    updates.approvedAt = serverTimestamp();
  } else if (newStatus === "requested") {
    updates.submittedAt = null;
    updates.approvedAt = null;
  } else if (newStatus === "rejected") {
    updates.approvedAt = null;
  }

  await updateDoc(requestRef, updates);
}