import { db } from "./firebaseConfig.js";

import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  query,
  where,
  addDoc,
  increment,
  deleteField,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const WASH_COLLECTION = "WashJobs";
const HISTORY_COLLECTION = "WashHistory";
const INVENTORY_COLLECTION = "InventoryDB";
const EMPLOYEE_COLLECTION = "EmployeesDB";
const UNIFORM_COLLECTION = "UniformsDB";

// 🧺 งานซัก (washJobs)
export async function getAllWashes() {
  try {
    const snapshot = await getDocs(collection(db, WASH_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("getAllWashes error:", error);
    return [];
  }
}

export async function getWashJobById(id) {
  const ref = doc(db, WASH_COLLECTION, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addWashJob(data, id = null) {
  if (id) {
    await setDoc(doc(db, WASH_COLLECTION, id), data);
    return id;
  } else {
    const docRef = await addDoc(collection(db, WASH_COLLECTION), data);
    return docRef.id;
  }
}

export async function updateWashJob(id, data) {
  await updateDoc(doc(db, WASH_COLLECTION, id), data);
}

export async function deleteWashJob(id) {
  await deleteDoc(doc(db, WASH_COLLECTION, id));
}

// 🧾 ประวัติการซัก (washHistory)
export async function getAllWashHistory() {
  const snapshot = await getDocs(collection(db, HISTORY_COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function addToWashHistory(data, id = null) {
  if (id) {
    await setDoc(doc(db, HISTORY_COLLECTION, id), data);
    return id;
  } else {
    const docRef = await addDoc(collection(db, HISTORY_COLLECTION), data);
    return docRef.id;
  }
}

// 🎽 ยูนิฟอร์ม (InventoryDB)
export async function getUniformByCode(uniformCode, color = null) {
  const col = collection(db,INVENTORY_COLLECTION);

  let q = query(col, where("uniformCode", "==", uniformCode));
  if (color) {
    q = query(
      col,
      where("uniformCode", "==", uniformCode),
      where("color", "==", color)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}



export async function incrementRewashCount(uniformCode, color) {
  const snap = await getUniformByCode(uniformCode, color);
  if (snap.length > 0) {
    await updateDoc(doc(db, INVENTORY_COLLECTION, snap[0].id), {
      rewashCount: increment(1),
    });
  }
}

export async function setRewashCount(uniformCode, color, count) {
  const snap = await getUniformByCode(uniformCode, color);
  if (snap.length > 0) {
    await updateDoc(doc(db, INVENTORY_COLLECTION, snap[0].id), {
      rewashCount: count,
    });
  }
}

export async function getRewashCount(uniformCode, color) {
  const snap = await getUniformByCode(uniformCode, color);
  return snap.length > 0 ? snap[0].rewashCount || 0 : 0;
}

export async function updateTotalQty(uniformCode, color) {
  const snap = await getUniformByCode(uniformCode, color);
  if (snap.length === 0) return;
  const docId = snap[0].id;
  const data = snap[0];
  const totalQty =
    (data.availableQty || 0) + (data.washingQty || 0) + (data.scrapQty || 0);
  await updateDoc(doc(db, INVENTORY_COLLECTION, docId), { totalQty });
}

export async function scrapUniform(uniformCode, color) {
  const snap = await getUniformByCode(uniformCode, color);
  if (snap.length === 0) return;
  const docId = snap[0].id;
  await updateDoc(doc(db, INVENTORY_COLLECTION, docId), {
    status: "scrap",
    usageStatus: "scrap",
    "status.assign": deleteField(),
    "status.washing": deleteField(),
  });
}

export async function returnToStockAfterESD(washData) {
  const snap = await getUniformByCode(washData.uniformCode, washData.color);
  if (snap.length === 0) return;

  const docId = snap[0].id;
  let rewashCount = washData.rewashCount || 0; // ใช้ rewashCount จาก washData ถ้ามี

  // ถ้า ESD ไม่ผ่าน (สถานะ "ESD Failed") เราจะเพิ่ม rewashCount
  if (washData.status === "ESD Failed") {
    rewashCount++; // เพิ่มค่า rewashCount
  } else if (washData.status === "ESD Passed") {
    rewashCount = 0; // ถ้าผ่าน ESD ให้รีเซ็ต rewashCount เป็น 0
  }

  // อัปเดตสถานะใน Inventory ตาม rewashCount
  let newStatus = "available";
  if (rewashCount > 0) {
    newStatus = `Rewash #${rewashCount}`;
  }

  // อัปเดตสถานะใน Inventory
  await updateDoc(doc(db, INVENTORY_COLLECTION, docId), {
    status: newStatus, // ปรับสถานะตาม rewashCount
    usageStatus: newStatus === "available" ? "available" : "in-use", // ถ้าเป็น available, ใช้ available ถ้าไม่ใช่ให้เป็น in-use
    rewashCount: rewashCount, // อัปเดตค่า rewashCount
  });

  // ลบ WashJob หลังจากคืนคลัง
  await deleteWashJob(washData.washId);

  // อัปเดตจำนวนทั้งหมดในคลัง
  await updateTotalQty(washData.uniformCode, washData.color);
}



// 👤 พนักงาน
export async function getEmployeeByUniform(uniformCode, color) {
  const snap = await getUniformByCode(uniformCode, color);
  if (snap.length === 0) return null;
  const { employeeId, employeeName } = snap[0];
  return { employeeId, employeeName };
}

export async function getEmployeeById(empId) {
  const ref = doc(db, EMPLOYEE_COLLECTION, empId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}