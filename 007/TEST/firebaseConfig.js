import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  query, where, increment
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAvJ4SgGaazPf6mY4G5-QfWcX2Yhkg-1X0",  
    authDomain: "rd-wash-v2.firebaseapp.com",           
    projectId: "rd-wash-v2",                            
    storageBucket: "rd-wash-v2.firebasestorage.app",    
    messagingSenderId: "553662948172",                  
    appId: "1:553662948172:web:2423d7a81f2bbc9d53a5e9", 
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = {
  WASH: "washBase",
  HISTORY: "washHistory"
};

export {
  db, collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  query, where, increment,
  COLLECTIONS
};