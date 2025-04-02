// inv.js (Updated full version with UI consistency and improvements)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDs3yzXq0e8Tbp6Xvojesx-1uky2crRbEs",
  authDomain: "rd-washmanagement.firebaseapp.com",
  projectId: "rd-washmanagement",
  storageBucket: "rd-washmanagement.appspot.com",
  messagingSenderId: "262212234800",
  appId: "1:262212234800:web:221f19035f49782ad487f5",
  measurementId: "G-6W7N1MME7N",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const uniformRef = collection(db, "uniforms");
const codeRef = collection(db, "uniformCodes");
const employeeRef = collection(db, "employees");
const washRef = collection(db, "washJobs");

// 🔄 Update all assigned codes to calculate used stock
async function calculateUsedStock(uniformId) {
  const q = query(codeRef, where("uniformId", "==", uniformId), where("status", "==", "Assigned"));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("codeForm")?.addEventListener("submit", saveUniformCode);
  document.getElementById("searchByUniformAndEmployee")?.addEventListener("input", searchAll);
  document.getElementById("btnExportReport")?.addEventListener("click", exportReport);
  styleSearchBox();
  renderTemplates();
});

async function getAll(ref) {
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getById(ref, id) {
  const snap = await getDoc(doc(db, ref, id));
  return snap.exists() ? snap.data() : null;
}

async function renderTemplates() {
  const container = document.getElementById("inventoryList");
  container.innerHTML = "";

  const uniforms = await getAll(uniformRef);
  const codes = await getAll(codeRef);

  for (const u of uniforms) {
    const used = await calculateUsedStock(u.uniformId);
    const total = codes.filter(c => c.uniformId === u.uniformId).length;

    const card = document.createElement("div");
    card.className = "inventory-card";
    card.innerHTML = `
      <img src="${u.photo}" alt="${u.uniformName}" />
      <h4>${u.uniformName}</h4>
      <p><strong>Size:</strong> ${u.size}</p>
      <p><strong>Color:</strong> ${u.color}</p>
      <p><strong>Used:</strong> ${used} / ${total}</p>
      <div class="actions">
        <button class="btn" onclick="window.openAddCodeModal('${u.uniformId}')">➕ Add Code</button>
        <button class="btn" onclick="window.viewDetail('${u.uniformId}')">🔍 View</button>
      </div>
    `;
    container.appendChild(card);
  }
}

window.saveUniformCode = async function (e) {
  e.preventDefault();
  const uniformId = document.getElementById("addCodeUniformId").value;
  const code = document.getElementById("addUniformCode").value.trim();

  if (!code || !uniformId) return showAlert("⚠️ กรุณากรอกข้อมูลให้ครบ");

  const existing = await getById("uniformCodes", code);
  if (existing) return showAlert("❌ รหัสนี้มีอยู่แล้ว");

  await setDoc(doc(db, "uniformCodes", code), {
    uniformCode: code,
    uniformId,
    status: "Available",
    employeeId: null,
    employeeName: null
  });

  window.closeAddCodeModal();
  renderTemplates();
  showAlert("✅ เพิ่ม Uniform Code สำเร็จ");
};

window.closeAddCodeModal = function () {
  document.getElementById("codeModal").style.display = "none";
  document.getElementById("codeForm").reset();
};

window.openAddCodeModal = function (uniformId) {
  document.getElementById("addCodeUniformId").value = uniformId;
  document.getElementById("codeModal").style.display = "flex";
};

window.assignUniform = async function (code, uniformId) {
  const current = await getById("uniformCodes", code);
  if (!current || current.status === "Assigned") return showAlert("❌ โค้ดนี้ถูกใช้แล้ว กรุณาใช้ Transfer หากต้องการเปลี่ยนเจ้าของ");

  const employeeId = prompt("🔒 Enter Employee ID to assign:");
  if (!employeeId) return showAlert("⚠️ กรุณาระบุรหัสพนักงาน");

  const empSnap = await getDoc(doc(db, "employees", employeeId));
  if (!empSnap.exists()) return showAlert("❌ ไม่พบรหัสพนักงานนี้ในระบบ");

  const employeeData = empSnap.data();
  const employeeName = employeeData.employeeName;

  await updateDoc(doc(db, "uniformCodes", code), {
    status: "Assigned",
    employeeId,
    employeeName
  });

  const uniformData = await getById("uniforms", uniformId);
  const washCode = `WASH-${Date.now()}`;
  await setDoc(doc(db, "washJobs", washCode), {
    washCode,
    employeeId,
    employeeName,
    uniformCode: code,
    uniformName: uniformData.uniformName,
    size: uniformData.size,
    color: uniformData.color,
    status: "waiting",
    createdAt: new Date().toISOString()
  });

  showAlert("✅ Assigned and wash job created");
  window.viewDetail(uniformId);
  renderTemplates();
};

window.returnUniform = async function (code, uniformId) {
  await updateDoc(doc(db, "uniformCodes", code), {
    status: "In Stock",
    employeeId: null,
    employeeName: null
  });

  window.viewDetail(uniformId);
  renderTemplates();
};

window.exportReport = async function () {
  const codes = await getAll(codeRef);
  const csv = ["Code,Status,EmployeeID,EmployeeName,UniformID"];
  codes.forEach(c => {
    csv.push(`${c.uniformCode},${c.status},${c.employeeId || "-"},${c.employeeName || "-"},${c.uniformId}`);
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "uniform_report.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("✅ Export complete");
};

window.viewDetail = async function (uniformId) {
  const modal = document.getElementById("codeListModal");
  const tbody = document.getElementById("codeListBody");
  tbody.innerHTML = "";

  const codes = await getAll(codeRef);
  codes.filter(c => c.uniformId === uniformId).forEach(code => {
    const showAssign = code.status !== "Assigned";
    const showReturn = code.status === "Assigned";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${code.uniformCode}</td>
      <td>${code.employeeId || '-'}</td>
      <td>${code.employeeName || '-'}</td>
      <td>${code.status}</td>
      <td>
        ${showAssign ? `<button onclick="window.assignUniform('${code.uniformCode}', '${code.uniformId}')">📝 Assign</button>` : ''}
        ${showReturn ? `<button onclick="window.returnUniform('${code.uniformCode}', '${code.uniformId}')">🔄 Return</button>` : ''}
        <button onclick="window.deleteCode('${code.uniformCode}', '${code.uniformId}')">🗑️ Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  modal.style.display = "flex";
};

window.deleteCode = async function (code, uniformId) {
  if (!confirm(`❌ Delete code ${code}?`)) return;
  await deleteDoc(doc(db, "uniformCodes", code));
  showAlert("✅ Deleted");
  window.viewDetail(uniformId);
  renderTemplates();
};

function showAlert(message, type = 'success') {
  const alertBox = document.createElement("div");
  alertBox.textContent = message;
  alertBox.className = `popup-alert ${type}`;
  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 2500);
}

function styleSearchBox() {
  const box = document.getElementById("searchByUniformAndEmployee");
  if (box) {
    box.style.background = "#ffffff";
    box.style.padding = "4px";
    box.style.border = "1px solid #ccc";
    box.style.borderRadius = "12px";
    box.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
    box.style.width = "300px";
    box.style.maxWidth = "500px";
    box.style.fontSize = "1rem";
  }
}

window.searchAll = async function (e) {
  const keyword = e.target.value.toLowerCase();
  const list = document.getElementById("searchForEverything");
  if (!list) return;
  list.innerHTML = "";

  const uniforms = await getAll(uniformRef);
  const codes = await getAll(codeRef);
  const employees = await getAll(employeeRef);

  const results = [
    ...uniforms.filter(u => u.uniformName.toLowerCase().includes(keyword)).map(u => `🎽 ${u.uniformName}`),
    ...codes.filter(c => c.uniformCode.toLowerCase().includes(keyword)).map(c => `🎫 ${c.uniformCode} (${c.status})`),
    ...employees.filter(e => e.employeeId.toLowerCase().includes(keyword) || e.employeeName.toLowerCase().includes(keyword)).map(e => `👤 ${e.employeeName} (${e.employeeId})`)
  ];

  if (results.length > 0) {
    results.forEach(txt => {
      const li = document.createElement("li");
      li.textContent = txt;
      list.appendChild(li);
    });
  } else {
    list.innerHTML = "<li>No matches found</li>";
  }
};