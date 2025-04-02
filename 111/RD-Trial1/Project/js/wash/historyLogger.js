// historyLogger.js (Firebase version)
import { db } from '../firebaseInit.js'; // Adjust the path as necessary
import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const HISTORY_STORE = "washHistory";

export const historyLogger = {
  async log(washId, action, detail = "") {
    const record = {
      washId,
      action,
      detail,
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, HISTORY_STORE), record);
  },

  async getAllLogs() {
    const querySnapshot = await getDocs(collection(db, HISTORY_STORE));
    return querySnapshot.docs.map(doc => doc.data());
  },

  async getLogsByWashId(washId) {
    const q = query(collection(db, HISTORY_STORE), where("washId", "==", washId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  }
};
