// ==================== Firebase Setup ====================
// 🔧 ส่วนนี้ทำหน้าที่กำหนดค่าและเริ่มต้นการเชื่อมต่อกับ Firebase และ Firestore Database

// ✅ 1. นำเข้า Firebase App SDK เพื่อใช้ในการ initialize Firebase app
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

// ✅ 2. นำเข้าเมธอดต่าง ๆ ของ Firestore (Database) เพื่อให้สามารถใช้ในการติดต่อฐานข้อมูลได้
import {
  getFirestore,     // ใช้เชื่อมต่อกับ Firestore Database
  collection,       // ใช้เรียกดู Collection (ตาราง)
  doc,              // ใช้อ้างอิงเอกสารแบบระบุ ID
  addDoc,           // ใช้เพิ่มเอกสารใหม่โดยให้ Firebase สร้าง ID ให้อัตโนมัติ
  deleteDoc,        // ใช้ลบเอกสารใน Firestore
  getDocs,          // ใช้ดึงเอกสารทั้งหมดใน Collection
  getDoc,           // ใช้ดึงเอกสารแบบระบุ ID เดียว
  setDoc,           // ใช้สร้างหรืออัปเดตเอกสารด้วย ID ที่กำหนดเอง
  updateDoc,        // ใช้แก้ไขเฉพาะบางฟิลด์ในเอกสาร
  query,            // ใช้สร้างเงื่อนไขการค้นหา
  where,            // ใช้ระบุเงื่อนไขใน query เช่น field == value
  increment,      // ✅ เพิ่มเข้ามา
  deleteField
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ✅ 3. ตั้งค่า Config ของ Firebase (ข้อมูลนี้จะได้จากหน้า Project ของ Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAvJ4SgGaazPf6mY4G5-QfWcX2Yhkg-1X0",             // 🔑 รหัส API สำหรับเข้าถึงโปรเจกต์
  authDomain: "rd-wash-v2.firebaseapp.com",                      // 🌐 โดเมนสำหรับการยืนยันตัวตน
  projectId: "rd-wash-v2",                                       // 🏷️ ชื่อ Project ID
  storageBucket: "rd-wash-v2.firebasestorage.app",               // ☁️ ใช้สำหรับเก็บรูปภาพ/ไฟล์ (Firebase Storage)
  messagingSenderId: "553662948172",                             // 📱 ใช้สำหรับ Push Notification (ยังไม่ใช้ก็ได้)
  appId: "1:553662948172:web:2423d7a81f2bbc9d53a5e9",             // 🆔 App ID สำหรับการระบุตัวใน Firebase
};

// ✅ 4. เริ่มต้น Firebase App ด้วยค่าที่กำหนดไว้ด้านบน
const app = initializeApp(firebaseConfig);

// ✅ 5. เชื่อมต่อกับ Firestore (ฐานข้อมูล) จาก Firebase App ที่เราสร้าง
const db = getFirestore(app);

// ✅ 6. ประกาศชื่อ Collection ทั้งหมดที่ใช้ในระบบนี้ เพื่อสะดวกในการอ้างอิง
const COLLECTIONS = {
  WASHES: "washJobs",          // 📁 ตารางเก็บข้อมูลงานซักทั้งหมด
  EMPLOYEES: "employees",      // 👥 ตารางพนักงาน
  UNIFORMCODES: "uniformCodes",    // 🎽 ตารางโค้ดยูนิฟอร์ม
  UNIFORM: "uniforms",
};