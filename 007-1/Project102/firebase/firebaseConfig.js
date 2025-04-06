import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAvJ4SgGaazPf6mY4G5-QfWcX2Yhkg-1X0",             // 🔑 รหัส API สำหรับเข้าถึงโปรเจกต์
  authDomain: "rd-wash-v2.firebaseapp.com",                      // 🌐 โดเมนสำหรับการยืนยันตัวตน
  projectId: "rd-wash-v2",                                       // 🏷️ ชื่อ Project ID
  storageBucket: "rd-wash-v2.firebasestorage.app",               // ☁️ ใช้สำหรับเก็บรูปภาพ/ไฟล์ (Firebase Storage)
  messagingSenderId: "553662948172",                             // 📱 ใช้สำหรับ Push Notification (ยังไม่ใช้ก็ได้)
  appId: "1:553662948172:web:2423d7a81f2bbc9d53a5e9",             // 🆔 App ID สำหรับการระบุตัวใน Firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }