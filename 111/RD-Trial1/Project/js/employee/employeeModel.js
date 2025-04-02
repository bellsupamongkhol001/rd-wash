import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

import { firebaseConfig, COLLECTION_EMP } from './constants.js';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const EMP_COLLECTION = collection(db, COLLECTION_EMP);

export async function getAllEmployees() {
  const snapshot = await getDocs(EMP_COLLECTION);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getEmployee(id) {
  const empDoc = await getDoc(doc(db, COLLECTION_EMP, id));
  return empDoc.exists() ? empDoc.data() : null;
}

export async function saveEmployeeToDB(id, name, dept, photo) {
  await setDoc(doc(db, COLLECTION_EMP, id), {
    employeeId: id,
    employeeName: name,
    employeeDept: dept,
    employeePhoto: photo,
  });
}

export async function deleteEmployeeFromDB(id) {
  await deleteDoc(doc(db, COLLECTION_EMP, id));
}
