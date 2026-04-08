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
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function mapSnapshotDocs(snapshot) {
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

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
      callback(mapSnapshotDocs(snapshot));
    },
    onError
  );
}

export function subscribeToRequestById(requestId, callback, onError) {
  const requestRef = doc(db, "requests", requestId);

  return onSnapshot(
    requestRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      });
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
      callback(mapSnapshotDocs(snapshot));
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
    updates.rejectedReason = "";
  } else if (newStatus === "approved") {
    updates.approvedAt = serverTimestamp();
    updates.rejectedReason = "";
  } else if (newStatus === "requested") {
    updates.submittedAt = null;
    updates.approvedAt = null;
    updates.rejectedReason = "";
  } else if (newStatus === "rejected") {
    updates.approvedAt = null;
  }

  await updateDoc(requestRef, updates);
}

export async function submitEmployeeRequest({
  requestId,
  employeeId,
  file,
  expirationDate = null,
}) {
  if (!file) {
    throw new Error("A file is required.");
  }

  const safeFileName = `${Date.now()}-${file.name}`;
  const storagePath = `employee-documents/${employeeId}/${requestId}/${safeFileName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);

  const fileUrl = await getDownloadURL(storageRef);

  const requestRef = doc(db, "requests", requestId);

  await updateDoc(requestRef, {
    status: "submitted",
    fileUrl,
    filePath: storagePath,
    submittedAt: serverTimestamp(),
    expirationDate: expirationDate || null,
    updatedAt: serverTimestamp(),
  });

  return { fileUrl, filePath: storagePath };
}