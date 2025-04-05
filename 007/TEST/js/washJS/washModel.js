
import {
    db, collection, doc, getDocs, getDoc,
    addDoc, updateDoc, deleteDoc,
    COLLECTIONS
  } from '.../firebaseConfig.js';
  
  const washCollection = collection(db, COLLECTIONS.WASH);
  
  export async function getAllWashJobs() {
    const snapshot = await getDocs(washCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
  
  export async function getWashById(washId) {
    const docRef = doc(db, COLLECTIONS.WASH, washId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  }
  
  export async function addWashJob(data) {
    return await addDoc(washCollection, data);
  }
  
  export async function updateWashJob(washId, updateData) {
    const docRef = doc(db, COLLECTIONS.WASH, washId);
    return await updateDoc(docRef, updateData);
  }
  
  export async function deleteWashJob(washId) {
    const docRef = doc(db, COLLECTIONS.WASH, washId);
    return await deleteDoc(docRef);
  }
  
  export async function generateWashId() {
    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, ''); // "240405"
  
    // ดึงข้อมูลของวันนี้ทั้งหมด
    const q = query(washCollection, where("washID", ">=", `WASH-${yymmdd}`));
    const snapshot = await getDocs(q);
  
    const todayWashes = snapshot.docs
      .map(doc => doc.data().washID)
      .filter(id => id.startsWith(`WASH-${yymmdd}`));
  
    // หาค่าลำดับล่าสุด
    const serials = todayWashes.map(id => parseInt(id.split("-")[2])).filter(n => !isNaN(n));
    const lastSerial = serials.length ? Math.max(...serials) : 0;
    const nextSerial = (lastSerial + 1).toString().padStart(3, "0");
  
    return `WASH-${yymmdd}-${nextSerial}`;
  }

  const washHistoryCollection = collection(db, COLLECTIONS.HISTORY);

// ✅ ฟังก์ชันย้ายข้อมูลไป washHistory
export async function moveToHistory(wash) {
  // เพิ่มเข้า history
  await addDoc(washHistoryCollection, {
    ...wash,
    movedAt: new Date().toISOString(),
    esdResult: "PASS"  // หรือระบุจริงจาก UI
  });

  // ลบจาก washBase
  await deleteDoc(doc(db, COLLECTIONS.WASH, wash.id));
}

export async function getWashHistory() {
    const snapshot = await getDocs(collection(db, COLLECTIONS.HISTORY));
    return snapshot.docs.map(doc => doc.data());
  }

  // คืน Stock
export async function returnToStockAfterESD(wash) {
    const q = query(collection(db, COLLECTIONS.UNIFORMCODES), where("uniCode", "==", wash.UniCode));
    const snap = await getDocs(q);
    if (snap.empty) return;
  
    const docRef = snap.docs[0].ref;
  
    await updateDoc(docRef, {
      qty: increment(1),
      empID: deleteField(),
      empName: deleteField(),
      usageStatus: "available"
    });
  }
  
  export async function getAllWashJobs() {
    const snapshot = await getDocs(collection(db, COLLECTIONS.WASH));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
  