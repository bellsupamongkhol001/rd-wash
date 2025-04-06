import { db } from '../firebase/config.js';
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const inventoryStockCol = collection(db, 'inventoryStock');
const uniformBaseCol = collection(db, 'uniformBase');
const employeeBaseCol = collection(db, 'employeeBase');

/**
 * 🔍 Get all inventory stock
 */
export async function getInventoryStock() {
  const snapshot = await getDocs(inventoryStockCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * 🧩 Get all uniforms from UniformBase
 */
export async function getUniformBase() {
  const snapshot = await getDocs(uniformBaseCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * 🧍 Get all employees from EmployeeBase
 */
export async function getEmployeeBase() {
  const snapshot = await getDocs(employeeBaseCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * ➕ Add new inventory stock (with auto timestamp)
 */
export async function addInventoryStock(data) {
  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await addDoc(inventoryStockCol, payload);
}

/**
 * ✏️ Update inventory stock by ID
 */
export async function updateInventoryStock(id, data) {
  const ref = doc(inventoryStockCol, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * ❌ Delete inventory record
 */
export async function deleteInventoryStock(id) {
  const ref = doc(inventoryStockCol, id);
  await deleteDoc(ref);
}

/**
 * 📦 Get uniform by ID (from UniformBase)
 */
export async function getUniformById(uniformId) {
  const ref = doc(uniformBaseCol, uniformId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * 👤 Get employee by ID (from EmployeeBase)
 */
export async function getEmployeeById(employeeId) {
  const ref = doc(employeeBaseCol, employeeId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}