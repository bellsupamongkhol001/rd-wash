// ==================== Firebase Firestore Model (แทน IndexedDB) ====================

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

// ==================== Firebase Config ====================
const firebaseConfig = {
  apiKey: "AIzaSyDs3yzXq0e8Tbp6Xvojesx-1uky2crRbEs",
  authDomain: "rd-washmanagement.firebaseapp.com",
  projectId: "rd-washmanagement",
  storageBucket: "rd-washmanagement.firebasestorage.app",
  messagingSenderId: "262212234800",
  appId: "1:262212234800:web:221f19035f49782ad487f5",
  measurementId: "G-6W7N1MME7N"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ==================== CRUD Functions ====================

// ดึงข้อมูลทั้งหมดจาก collection
export async function getAll(storeName) {
  const snapshot = await getDocs(collection(db, storeName));
  return snapshot.docs.map(doc => doc.data());
}

// ดึงข้อมูลตาม ID
export async function getById(storeName, id) {
  const docRef = doc(db, storeName, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

// เพิ่มหรืออัปเดตข้อมูล (ตาม ID)
export async function put(storeName, data) {
  const docRef = doc(db, storeName, data.washId);
  await setDoc(docRef, data);
}

// ลบข้อมูล
export async function remove(storeName, id) {
  const docRef = doc(db, storeName, id);
  await deleteDoc(docRef);
}