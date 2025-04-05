// Firebase Setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
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
  deleteField
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAvJ4SgGaazPf6mY4G5-QfWcX2Yhkg-1X0",
  authDomain: "rd-wash-v2.firebaseapp.com",
  projectId: "rd-wash-v2",
  storageBucket: "rd-wash-v2.firebasestorage.app",
  messagingSenderId: "553662948172",
  appId: "1:553662948172:web:2423d7a81f2bbc9d53a5e9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = {
  WASHES: "washJobs",
  EMPLOYEES: "employees",
  UNIFORMCODES: "uniformCodes",
  UNIFORM: "uniforms"
};

export {
  db,
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
  COLLECTIONS
};

export async function getAll(collectionName) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function put(collectionName, id, data) {
  const docRef = doc(db, collectionName, id);
  await setDoc(docRef, data);
}

export async function remove(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

export async function getById(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data();
}

export async function getUniformByCode(code) {
  const uniformQuery = query(
    collection(db, COLLECTIONS.UNIFORMCODES),
    where("uniformCode", "==", code)
  );
  const snapshot = await getDocs(uniformQuery);
  return snapshot.empty ? [] : snapshot.docs.map((doc) => doc.data());
}

export async function getOwnerByUniformCode(code) {
  const stockQuery = query(
    collection(db, COLLECTIONS.UNIFORMCODES),
    where("uniformCode", "==", code)
  );
  const snapshot = await getDocs(stockQuery);
  return snapshot.empty ? [] : snapshot.docs.map((doc) => doc.data());
}

export async function getEmployeeById(empId) {
  const empRef = doc(db, COLLECTIONS.EMPLOYEES, empId);
  const empDoc = await getDoc(empRef);
  return empDoc.exists() ? empDoc.data() : null;
}


