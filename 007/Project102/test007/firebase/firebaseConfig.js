// firebase/firebaseConfig.js

// 🔥 Import Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

// 🔥 Import Firestore Functions
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  increment,
  deleteField,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// 🔐 Firebase Config (จาก Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAvJ4SgGaazPf6mY4G5-QfWcX2Yhkg-1X0",
  authDomain: "rd-wash-v2.firebaseapp.com",
  projectId: "rd-wash-v2",
  storageBucket: "rd-wash-v2.firebasestorage.app",
  messagingSenderId: "553662948172",
  appId: "1:553662948172:web:2423d7a81f2bbc9d53a5e9",
};

// ⚙️ Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📁 Export ค่าคงที่ชื่อ collection ทั้งหมด (ใช้อ้างอิงได้ทั่วระบบ)
const COLLECTIONS = {
  WASHES: "washJobs",
  EMPLOYEES: "employees",
  UNIFORMCODES: "uniformCodes",
  UNIFORM: "uniforms",
  WASH_HISTORY: "washHistory",
};

// ✅ Export สำหรับใช้งาน
export {
  db,
  COLLECTIONS,
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  increment,
  deleteField
};
