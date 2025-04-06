import { addWash, getAllWashJobs, getWashById,deleteWashJob,shiftCreatedAt } from '../models/washModel.js'
import {
  closeModal,
  resetAddForm,
  showToast,
  renderWashTable,
  openModal
} from '../washViews/washView.js'
import { generateWashId } from '../Utility/washUtil.js'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase/firebaseConfig.js';



let selectedESDWashId = null;

export async function handleAddWash () {
  try {
    const uniformCode = document.getElementById('addUniformCode').value.trim()
    const uniformName = document.getElementById('addUniformName').value.trim()
    const size = document.getElementById('addSize').value.trim()
    const color = document.getElementById('addColor').value

    if (!uniformCode || !uniformName || !size || color === 'Select...') {
      alert('⚠️ Please fill all fields.')
      return
    }

    const washData = {
      washId: generateWashId(),
      uniformCode,
      uniformName,
      size,
      color,
      empId: '-',
      empName: '-',
      department: '-',
      status: 'Waiting to Send',
      createdAt: new Date()
    }

    await addWash(washData)
    closeModal('addWashModal')
    resetAddForm()
    showToast('✅ Wash Job added!')

    loadWashData()
  } catch (err) {
    console.error('Add Wash Error:', err)
    alert('❌ Failed to add wash job')
  }
}

export function cancelAddWash () {
  resetAddForm()
  closeModal('addWashModal')
}

export async function loadWashData () {
  const washes = await getAllWashJobs()
  renderWashTable(washes)
}

export async function openViewWash (washId) {
  try {
    const wash = await getWashById(washId)
    if (!wash) {
      console.error('ไม่พบข้อมูล Wash Job ที่ต้องการ')
      return
    }

    // เติมข้อมูลลงใน modal
    document.getElementById('viewUniformCode').textContent =
      wash.uniformCode || '-'
    document.getElementById('viewUniformName').textContent =
      wash.uniformName || '-'
    document.getElementById('viewSize').textContent = wash.size || '-'
    document.getElementById('viewColor').textContent = wash.color || '-'
    document.getElementById('viewQty').textContent = wash.qty || '-'
    document.getElementById('viewStatus').textContent = wash.status || '-'

    document.getElementById('viewEmpId').textContent = `EMPID: ${
      wash.empId || '-'
    }`
    document.getElementById('viewEmpName').textContent = `Name: ${
      wash.empName || '-'
    }`
    document.getElementById('viewEmpDept').textContent = `Department: ${
      wash.department || '-'
    }`
    document.getElementById('viewEmpPhoto').src = wash.photo || 'default.jpg'

    openModal('viewWashModal')
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการเปิด modal แสดงรายละเอียด:', err)
  }
}

export async function deleteWash(washId) {
  if (!confirm("⚠️ Are you sure you want to delete this wash job?")) return;

  try {
    await deleteWashJob(washId);
    showToast("✅ Wash job deleted successfully");
    await loadWashData(); // โหลดใหม่
  } catch (err) {
    showToast("❌ Failed to delete wash job");
  }
}


export function openESDModal(washId) {
  selectedESDWashId = washId;
  openModal('esdModal');
}

export async function handleESDResult(result) {
  if (!selectedESDWashId) return;

  const docRef = doc(db, 'washJobs', selectedESDWashId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();

  if (result === 'PASS') {
    await returnToStockAfterESD(selectedESDWashId, data);
    showToast("✅ ESD Passed. Returned to Stock.");
  } else {
    await handleESDNG(selectedESDWashId, data);
  }

  selectedESDWashId = null;
  closeModal('esdModal');
  await loadWashData();
}

async function handleESDNG(washId, washData) {
  const uniformCode = washData.uniformCode;

  const uniformRef = doc(db, 'uniforms', uniformCode);
  const uniformSnap = await getDoc(uniformRef);
  const rewashCount = uniformSnap.exists() ? (uniformSnap.data().rewashCount || 0) : 0;

  if (rewashCount >= 2) {
    await markAsScrap(washId);
    return;
  }

  const newRewashData = {
    ...washData,
    createdAt: new Date(),
    status: `Waiting Rewash #${rewashCount + 1}`
  };

  await addDoc(collection(db, 'washJobs'), newRewashData);

  await updateDoc(uniformRef, {
    rewashCount: rewashCount + 1
  });

  await deleteDoc(doc(db, 'washJobs', washId));

  showToast(`🔁 Rewash #${rewashCount + 1} created.`);
}

async function markAsScrap(washId) {
  await updateDoc(doc(db, 'washJobs', washId), {
    status: "Scrap",
    usageStatus: "scrap"
  });

  showToast("🗑 Item marked as Scrap after 3 failed ESD tests.");
}

async function returnToStockAfterESD(washId, data) {
  const uniformCode = data.uniformCode;
  const uniformRef = doc(db, 'uniforms', uniformCode);

  const uniformSnap = await getDoc(uniformRef);

  if (uniformSnap.exists()) {
    await updateDoc(uniformRef, {
      usageStatus: 'available',
      rewashCount: 0
    });
  } else {
    await setDoc(uniformRef, {
      usageStatus: 'available',
      rewashCount: 0,
      createdAt: new Date()
    });
  }

  await deleteDoc(doc(db, 'washJobs', washId));

  await addDoc(collection(db, 'washHistory'), {
    ...data,
    result: 'PASS',
    completedAt: new Date()
  });

  showToast("✅ ESD Passed - Returned to Stock");
}




// ทดสอบระบบ 
export async function shiftWashDate(washId, days) {
  try {
    await shiftCreatedAt(washId, days);
    await loadWashData();
    showToast(`⏱️ Shifted ${days > 0 ? '+' : ''}${days} day(s)`);
  } catch (err) {
    console.error('Shift date error:', err);
    showToast('❌ Failed to shift date');
  }
}
window.shiftWashDate = shiftWashDate;
window.handleESDResult = handleESDResult;
window.openViewWash = openViewWash
window.handleAddWash = handleAddWash;
window.cancelAddWash = cancelAddWash
window.closeModal = closeModal
window.deleteWash = deleteWash;
window.openESDModal = openESDModal;
