// firebaseInit.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDs3yzXq0e8Tbp6Xvojesx-1uky2crRbEs",
  authDomain: "rd-washmanagement.firebaseapp.com",
  projectId: "rd-washmanagement",
  storageBucket: "rd-washmanagement.firebasestorage.app",
  messagingSenderId: "262212234800",
  appId: "1:262212234800:web:221f19035f49782ad487f5",
  measurementId: "G-6W7N1MME7N"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
