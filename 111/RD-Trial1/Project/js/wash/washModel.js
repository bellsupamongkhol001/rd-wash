// washModel.js (Firebase version)
import { db } from '../firebaseInit.js'; // ต้องสร้างไฟล์ firebaseInit.js แยกต่างหาก
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const STORE_NAME = "washes";
const HISTORY_STORE = "washHistory";

export const dbUtils = {
  // ดึงข้อมูลทั้งหมดใน collection
  async getAll(storeName) {
    const querySnapshot = await getDocs(collection(db, storeName));
    return querySnapshot.docs.map(doc => doc.data());
  },

  // เพิ่มหรืออัปเดตข้อมูลใน collection
  async put(storeName, data) {
    const id = data.washId || data.id || crypto.randomUUID();
    await setDoc(doc(db, storeName, id), { ...data });
  },

  // ลบข้อมูลจาก collection
  async remove(storeName, key) {
    await deleteDoc(doc(db, storeName, key));
  },

  // ดึงข้อมูลรายตัวจาก collection
  async getById(storeName, id) {
    const docSnap = await getDoc(doc(db, storeName, id));
    return docSnap.exists() ? docSnap.data() : null;
  }
};

export { STORE_NAME, HISTORY_STORE };