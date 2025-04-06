import {  db  } from '../firebase/firebaseConfig.js';
import {
  collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc,
  doc, query, where, orderBy, Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const washJobsCol = collection(db, 'washJobs');
const washHistoryCol = collection(db, "washHistory");

export async function addWash(data) {
  await addDoc(collection(db, 'washJobs'), data);
}

export async function getAllWashJobs() {
  const q = query(washJobsCol, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getWashesByStatus(status) {
  const q = query(washJobsCol, where("status", "==", status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function updateWash(id, data) {
  const ref = doc(db, "washJobs", id);
  return await updateDoc(ref, data);
}

export async function deleteWashJob(washId) {
  try {
    const docRef = doc(db, 'washJobs', washId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("❌ Delete Error:", error);
    throw error;
  }
}

export async function addToHistory(historyData) {
  historyData.timestamp = Timestamp.now();
  return await addDoc(washHistoryCol, historyData);
}

export async function getWashHistory() {
  const q = query(washHistoryCol, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function getWashById(id) {
  const ref = doc(db, "washJobs", id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  } else {
    return null;
  }
}

//ทดสอบ
export async function shiftCreatedAt(washId, days) {
  const docRef = doc(db, 'washJobs', washId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Document not found");

  const data = docSnap.data();
  const current = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
  const newDate = new Date(current.getTime() + days * 24 * 60 * 60 * 1000);

  const now = new Date();
  const diffMs = now.getTime() - newDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let newStatus = "Waiting";
  if (diffDays >= 3) newStatus = "Completed";
  else if (diffDays >= 1) newStatus = "Washing";

  await updateDoc(docRef, {
    createdAt: newDate,
    status: newStatus
  });
}
