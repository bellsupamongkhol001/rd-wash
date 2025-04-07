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
  await updateDoc(doc(db, INVENTORY_COLLECTION, docId), {
    availableQty: increment(washData.qty || 1),
    washingQty: increment(-1 * (washData.qty || 1)),
    "status.assign": deleteField(),
    "status.washing": deleteField(),
  });
  await deleteWashJob(washData.washId);
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

export async function markAsESDFail(washData) {
  const { washId, uniformCode, color } = washData;

  await addToWashHistory({
    ...washData,
    testResult: "FAIL",
    testDate: new Date().toISOString(),
    status: "ESD Failed",
  });

  await deleteWashJob(washId);

  const currentCount = await getRewashCount(uniformCode, color);
  const newCount = currentCount + 1;

  await setRewashCount(uniformCode, color, newCount);

  if (newCount > 3) {
    await scrapUniform(uniformCode, color);
  }
}