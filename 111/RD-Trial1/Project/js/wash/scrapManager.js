// scrapManager.js (Firebase version)
import { db } from '../firebaseInit.js';
import { dbUtils, STORE_NAME } from './washModel.js';
import {
  collection,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

export const scrapManager = {
  async moveScrapToStore(scrapStoreName = "scrap") {
    const data = await dbUtils.getAll(STORE_NAME);
    const scraps = data.filter(item => item.status === "Scrap");

    for (let scrap of scraps) {
      const scrapId = scrap.washId || scrap.id;
      await setDoc(doc(db, scrapStoreName, scrapId), { ...scrap });
      await dbUtils.remove(STORE_NAME, scrapId);
    }

    return scraps.length;
  }
};