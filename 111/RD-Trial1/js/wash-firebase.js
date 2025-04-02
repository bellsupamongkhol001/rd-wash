// ==================== Firebase Setup ====================
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
  where
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDs3yzXq0e8Tbp6Xvojesx-1uky2crRbEs",
  authDomain: "rd-washmanagement.firebaseapp.com",
  projectId: "rd-washmanagement",
  storageBucket: "rd-washmanagement.firebasestorage.app",
  messagingSenderId: "262212234800",
  appId: "1:262212234800:web:221f19035f49782ad487f5",
  measurementId: "G-6W7N1MME7N"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// 🔍 ดึงข้อมูลยูนิฟอร์มจาก DB
async function getUniformByCode(code) {
  try {
    const uniformDocRef = doc(db, "uniforms", code); // ดึงข้อมูลจาก collection "uniforms" โดยใช้รหัส code เป็น document ID
    const uniformDoc = await getDoc(uniformDocRef); // ดึงข้อมูลเอกสาร
    
    if (uniformDoc.exists()) {
      return uniformDoc.data(); // ถ้าเอกสารมีอยู่, ส่งข้อมูล
    } else {
      throw new Error("Uniform not found");
    }
  } catch (error) {
    console.error("❌ Error getting uniform by code:", error);
    throw error; // หากมีข้อผิดพลาด, จะโยนข้อผิดพลาดกลับไป
  }
}


// 🔍 หาพนักงานที่เป็นเจ้าของชุดนี้จาก stock
async function getOwnerByUniformCode(code) {
  try {
    const stockQuery = query(collection(db, "stock"), where("uniformCode", "==", code)); // ค้นหาจาก stock โดยใช้ uniformCode
    const querySnapshot = await getDocs(stockQuery); // ดึงข้อมูลจาก query

    if (querySnapshot.empty) {
      throw new Error("No owner found for the uniform code");
    }

    // เราจะดึงข้อมูลตัวแรกจากผลลัพธ์ที่ได้ (คาดว่าเป็นชุดเดียวกัน)
    const ownerData = querySnapshot.docs[0].data(); 
    return ownerData; // คืนค่าผลลัพธ์
  } catch (error) {
    console.error("❌ Error getting owner by uniform code:", error);
    throw error;
  }
}

// 🔍 ดึงข้อมูลพนักงานจาก Firestore ตาม Employee ID
async function getEmployeeById(empId) {
  try {
    const employeeDocRef = doc(db, "employees", empId); // ดึงข้อมูลจาก collection "employees" โดยใช้ empId เป็น document ID
    const employeeDoc = await getDoc(employeeDocRef); // ดึงข้อมูลเอกสาร
    
    if (employeeDoc.exists()) {
      return employeeDoc.data(); // ถ้าเอกสารมีอยู่ ส่งข้อมูลออกมา
    } else {
      throw new Error("Employee not found");
    }
  } catch (error) {
    console.error("❌ Error getting employee by ID:", error);
    throw error; // หากมีข้อผิดพลาด จะโยนข้อผิดพลาดออกไป
  }
}

// ==================== Initialize the Page ====================
async function initWashPage() {
  try {
    // กำหนดค่าเริ่มต้นหรือข้อมูลจาก Firestore
    setupListeners();
    await renderTable();   // ดึงข้อมูลจาก Firestore และแสดงในตาราง
    await renderHistory(); // ดึงประวัติจาก Firestore และแสดง
    await updateSummary(); // อัปเดตสรุปข้อมูลจาก Firestore
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

document.addEventListener("DOMContentLoaded", initWashPage);

// ==================== Firestore CRUD Operations ====================
async function getAll(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName)); // ดึงข้อมูลจาก collection
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // ส่งผลลัพธ์ทั้งหมด
  } catch (error) {
    console.error("❌ Error getting documents:", error);
    throw error; // หากมีข้อผิดพลาดจะโยนข้อผิดพลาดกลับ
  }
}

async function put(collectionName, id, data) {
  try {
    const docRef = doc(db, collectionName, id); // สร้าง document reference โดยใช้ collectionName และ id
    await setDoc(docRef, data); // เพิ่มหรืออัปเดตข้อมูลใน Firestore
    console.log(`✅ Document written with ID: ${id}`);
  } catch (error) {
    console.error("❌ Error adding/updating document:", error);
    throw error; // หากมีข้อผิดพลาดจะโยนข้อผิดพลาดกลับ
  }
}

async function remove(collectionName, id) {
  try {
    const docRef = doc(db, collectionName, id); // สร้าง document reference โดยใช้ collectionName และ id
    await deleteDoc(docRef); // ลบเอกสารจาก Firestore
    console.log(`✅ Document with ID: ${id} has been deleted.`);
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    throw error; // หากมีข้อผิดพลาดจะโยนข้อผิดพลาดกลับ
  }
}

async function getById(collectionName, id) {
  try {
    const docRef = doc(db, collectionName, id); // สร้าง document reference โดยใช้ collectionName และ id
    const docSnap = await getDoc(docRef); // ดึงข้อมูลเอกสารจาก Firestore

    if (docSnap.exists()) {
      return docSnap.data(); // ถ้าเอกสารมีอยู่, ส่งข้อมูลออกมา
    } else {
      throw new Error("Document not found");
    }
  } catch (error) {
    console.error("❌ Error getting document by ID:", error);
    throw error; // หากมีข้อผิดพลาดจะโยนข้อผิดพลาดกลับ
  }
}

// ==================== Toggle Modal ====================
function toggleModal(show) {
  const modal = document.getElementById("Modal");
  modal.style.display = show ? "block" : "none"; // ถ้า show เป็น true, ให้แสดง modal, ถ้า false ให้ซ่อน
}

// ==================== Open Modal for Adding/Editing ====================
async function openForm(id = null) {
  clearForm(); // เคลียร์ข้อมูลในฟอร์ม
  document.getElementById("modalTitle").innerText = id ? "Edit Wash" : "Add Wash"; // เปลี่ยนหัวฟอร์ม

  if (id) {
    try {
      // ถ้ามี ID ให้ดึงข้อมูลจาก Firestore
      const data = await getById("washes", id); // เรียกใช้ฟังก์ชัน getById ที่เชื่อมกับ Firestore
      if (data) {
        // ถ้ามีข้อมูล, ให้แสดงในฟอร์ม
        document.getElementById("editIndex").value = id;
        document.getElementById("empId").value = data.empId;
        document.getElementById("empName").value = data.empName;
        document.getElementById("uniformCode").value = data.uniformCode;
        document.getElementById("qty").value = data.qty;
        document.getElementById("department").value = data.department || "";
        document.getElementById("color").value = data.color || "";
      }
    } catch (error) {
      console.error("❌ Error fetching data for edit:", error);
    }
  }

  toggleModal(true); // แสดง Modal
}

function clearForm() {
  // เคลียร์ค่าทั้งหมดในฟอร์มที่ใช้สำหรับกรอกข้อมูล
  [
    "empId",
    "empName",
    "uniformCode",
    "qty",
    "editIndex",
    "department",
    "color",
  ].forEach((id) => (document.getElementById(id).value = "")); // รีเซ็ตค่าของแต่ละฟิลด์ในฟอร์ม
}

// ==================== Setup Event Listeners ====================
function setupListeners() {
  // ตั้งค่า listener สำหรับ input ค้นหาชื่อพนักงาน หรือรหัสยูนิฟอร์ม
  document
    .getElementById("search")
    ?.addEventListener("input", debounce(renderTable, 300)); // ฟังก์ชัน debounce สำหรับการค้นหาตามตัวอักษร
  document
    .getElementById("filterStatus")
    ?.addEventListener("change", renderTable); // กรองตามสถานะ
  setInterval(renderTable, 60000); // รีเฟรชข้อมูลทุกๆ 60 วินาที

  // ตั้งค่าปุ่มเพื่อสร้าง Mock Data (ถ้าต้องการ)
  document
    .getElementById("generateMockDataBtn")
    ?.addEventListener("click", generateMockData); 

  // ตั้งค่าฟังก์ชัน autofill เมื่อกรอกรหัสยูนิฟอร์ม
  document
    .getElementById("uniformCode")
    ?.addEventListener("input", debounce(autofillUniformInfo, 300));

  // ตั้งค่าปุ่มบันทึกข้อมูล
  document.getElementById("saveBtn")?.addEventListener("click", saveWash);
}

// ==================== Rendering Functions ====================
async function renderTable() {
  const tbody = document.getElementById("washTableBody");
  const keyword = document.getElementById("search").value.toLowerCase();
  const filterStatus = document.getElementById("filterStatus").value;

  tbody.innerHTML = ""; // ลบข้อมูลเก่าใน tbody

  try {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    // ดึงข้อมูลทั้งหมดจาก Firestore
    const allWashes = await getAll("washes");

    // ฟิลเตอร์ข้อมูลตามคำค้นหาหรือสถานะ
    const filteredData = allWashes.filter((wash) => {
      return (
        wash.empName.toLowerCase().includes(keyword) ||
        wash.washId.toLowerCase().includes(keyword) ||
        wash.status.toLowerCase().includes(filterStatus.toLowerCase())
      );
    });

    // คำนวณจำนวนทั้งหมด
    const totalItems = filteredData.length;

    // เรียงข้อมูลตามหน้า
    const pageData = filteredData.slice(startIndex, endIndex);

    // สร้างแถวข้อมูลในตาราง
    pageData.forEach((wash) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${wash.washId}</td>
        <td>${wash.empId}</td>
        <td>${wash.empName}</td>
        <td>${wash.department}</td>
        <td>${wash.uniformCode}</td>
        <td>${wash.color}</td>
        <td>${wash.qty}</td>
        <td>${wash.status}</td>
        <td><button onclick="openForm('${wash.washId}')">Edit</button></td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination(totalItems, currentPage, rowsPerPage); // เรียก pagination เมื่อข้อมูลโหลดเสร็จ
  } catch (error) {
    console.error("❌ Error rendering table:", error);
  }
}

// ==================== Render History from Firestore ====================
async function renderHistory() {
  const historyTable = document.getElementById("historyTableBody");
  historyTable.innerHTML = ""; // ลบข้อมูลเก่าใน tbody

  try {
    // ดึงข้อมูลทั้งหมดจาก Firestore collection "washHistory"
    const history = await getAll("washHistory");

    history.forEach((entry) => {
      // สร้างแถวสำหรับข้อมูลในตาราง
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.washId}</td>
        <td>${entry.empId}</td>
        <td>${entry.status}</td>
        <td>${entry.testResult}</td>
        <td>${entry.testDate}</td>
      `;
      historyTable.appendChild(tr); // เพิ่มแถวข้อมูลในตาราง
    });
  } catch (error) {
    console.error("❌ Error rendering history:", error);
  }
}

// ==================== Update Summary from Firestore ====================
async function updateSummary() {
  try {
    const data = await getAll("washes"); // ดึงข้อมูลทั้งหมดจาก Firestore collection "washes"

    const total = data.length;
    const waiting = data.filter((item) =>
      item.status.includes("Waiting")
    ).length;
    const washing = data.filter((item) => item.status === "Washing").length;
    const completed = data.filter((item) => item.status === "Completed").length;

    // แสดงผลลัพธ์ใน summary
    document.getElementById("sumTotal").textContent = total;
    document.getElementById("sumWaiting").textContent = waiting;
    document.getElementById("sumWashing").textContent = washing;
    document.getElementById("sumCompleted").textContent = completed;
  } catch (error) {
    console.error("❌ Error updating summary:", error);
  }
}

// ==================== Helper Functions ====================
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}

// ==================== Autofill Uniform Info ====================
async function autofillUniformInfo() {
  const code = document.getElementById("uniformCode").value.trim();
  if (!code) return; // ถ้าไม่มีรหัสยูนิฟอร์ม ไม่ทำอะไร

  try {
    const empIdEl = document.getElementById("empId");
    const empNameEl = document.getElementById("empName");
    const deptEl = document.getElementById("department");

    // เคลียร์คลาสก่อนทุกครั้ง
    empNameEl.classList.remove("text-error", "text-warning");

    // ดึงข้อมูลยูนิฟอร์มจาก Firestore
    const uniform = await getUniformByCode(code);
    if (uniform) {
      document.getElementById("color").value = uniform.color || "Unknown";
      document.getElementById("color").style.backgroundColor = "";
    } else {
      document.getElementById("color").value = "Unknown";
      document.getElementById("color").style.backgroundColor = "#ffe5e5";
    }

    // ดึงข้อมูลจาก stock ใน Firestore
    const stock = await getOwnerByUniformCode(code);
    if (stock) {
      if (stock.employeeId) {
        empIdEl.value = stock.employeeId;
        // ดึงข้อมูลพนักงานจาก Firestore
        const emp = await getEmployeeById(stock.employeeId);
        if (emp) {
          empNameEl.value = emp.employeeName || "Unknown";
          deptEl.value = emp.employeeDept || "Unknown";
        } else {
          empNameEl.value = "Employee Not Found";
          deptEl.value = "Employee Not Found";
          empNameEl.classList.add("text-warning");
        }
      } else {
        // ✅ มีชุดใน stock แต่ไม่มีเจ้าของ
        empIdEl.value = "-";
        empNameEl.value = "ไม่มีเจ้าของ";
        deptEl.value = "-";
      }
    } else {
      // ❌ ไม่เจอใน stock เลย → ห้ามซัก
      alert("⚠️ ชุดนี้ไม่มีในระบบ Stock กรุณาตรวจสอบรหัส Uniform");
      clearForm(); // รีเซ็ตฟอร์ม
      return;
    }

    empNameEl.classList.remove("text-error", "text-warning");

    document.getElementById("qty").focus();
  } catch (err) {
    console.error("❌ Error during autofill:", err);
  }
}

// ==================== Mock Data Generation ====================
async function generateMockData() {
  const now = new Date();
  const departments = ["Research and Development"];
  const colors = ["Green", "Yellow", "White"];

  for (let i = 0; i < 20; i++) {
    const createdDate = new Date(now - (i % 6) * 24 * 60 * 60 * 1000);
    const ymd = createdDate.toISOString().slice(0, 10).replace(/-/g, "");
    const washId = `WASH-${ymd}-${String(i + 1).padStart(3, "0")}`;

    let status = "Waiting to Send";
    let rewashCount = 0;

    if (i % 6 === 2) status = "Washing";
    if (i % 6 === 3) status = "Completed";
    if (i % 6 === 4) {
      rewashCount = 1;
      status = `Waiting Rewash #${rewashCount}`;
    }
    if (i % 6 === 5) {
      rewashCount = 2;
      status = `Waiting Rewash #${rewashCount}`;
    }

    if (rewashCount > 2) {
      rewashCount++;
      status = `Waiting Rewash #${rewashCount}`;
    }

    const item = {
      washId,
      empId: `EMP${1000 + i}`,
      empName: `Employee ${i + 1}`,
      uniformCode: `UNI-${100 + i}`,
      qty: 1 + (i % 3),
      status,
      createdAt: createdDate.toISOString(),
      rewashCount: rewashCount,
      department: departments[i % departments.length],
      color: colors[i % colors.length],
    };

    // ใช้ setDoc หรือ addDoc สำหรับการเพิ่มข้อมูลใน Firestore
    const collectionRef = status === "Scrap" ? "washHistory" : "washes";
    await addDoc(collection(db, collectionRef), item); // เพิ่มข้อมูลไปยัง collection ที่เหมาะสม
  }

  // รีเฟรชการแสดงผลข้อมูล
  renderTable();
  renderHistory();
  updateSummary();
}

let currentPage = 1;  // ประกาศตัวแปร currentPage ที่จุดเริ่มต้น
const rowsPerPage = 10;  // กำหนดจำนวนแถวที่แสดงต่อหน้า

async function renderPagination(totalItems, current, perPage) {
  const pagination = document.getElementById("pagination");

  // ตรวจสอบว่า pagination มีอยู่ใน DOM
  if (!pagination) {
    console.error("Pagination element not found.");
    return;
  }

  pagination.innerHTML = "";  // เคลียร์เนื้อหาก่อน
  const totalPages = Math.ceil(totalItems / perPage);

  if (totalPages <= 1) return;

  // สร้างปุ่ม pagination
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className = i === current ? "active" : "";
    
    // เมื่อคลิกปุ่ม, เปลี่ยนหน้าและเรียกฟังก์ชัน renderTable
    btn.onclick = async () => {
      currentPage = i;  // เปลี่ยนค่า currentPage
      await renderTable();  // รีเฟรชข้อมูลเมื่อเปลี่ยนหน้า
    };

    pagination.appendChild(btn);
  }
}

// ==================== Show Delete Modal and Confirm Deletion ====================
function showDeleteModal(id) {
  const modal = document.createElement("div");
  modal.className = "overlay";
  modal.innerHTML = `
    <div class="confirm-box">
      <h3>Delete Confirmation</h3>
      <p>Are you sure you want to delete this wash job?</p>
      <div>
        <button class="btn-yes" onclick="confirmDelete('${id}', this)">Yes</button>
        <button class="btn-no" onclick="this.closest('.overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ==================== Confirm Delete (using Firestore) ====================
async function confirmDelete(id, button) {
  try {
    // ลบข้อมูลจาก Firestore
    const washDocRef = doc(db, "washes", id); // สร้าง reference ไปยังเอกสารที่ต้องการลบ
    await deleteDoc(washDocRef); // ลบเอกสารจาก Firestore

    console.log(`✅ Document with ID: ${id} has been deleted.`);

    // ลบ modal เมื่อการลบเสร็จ
    button.closest('.overlay').remove();

    // รีเฟรชข้อมูลหลังการลบ
    renderTable();
    updateSummary();
  } catch (error) {
    console.error("❌ Error deleting document:", error);
  }
}

// ==================== Show ESD Result Modal ====================
function showESDModal(id) {
  const modal = document.createElement("div");
  modal.className = "overlay";
  modal.innerHTML = `
    <div class="confirm-box">
      <h3>ESD Result Confirmation</h3>
      <p>Did this uniform pass the ESD test?</p>
      <div>
        <button class="btn-yes" onclick="confirmESD('${id}', true, this)">Pass</button>
        <button class="btn-no" onclick="confirmESD('${id}', false, this)">Fail</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ==================== Confirm ESD Result (using Firestore) ====================
async function confirmESD(id, passed, button) {
  try {
    const washDocRef = doc(db, "washes", id); // Reference to the wash document in Firestore
    const washDoc = await getDoc(washDocRef); // Get the current wash job document

    if (!washDoc.exists()) {
      console.error("❌ Document not found!");
      return;
    }

    // Update the ESD test result in Firestore
    await updateDoc(washDocRef, {
      esdTestResult: passed ? "Pass" : "Fail",
      status: passed ? "Completed" : "Waiting Rewash #1" // Update status based on test result
    });

    console.log(`✅ ESD test result for Wash ID: ${id} has been updated.`);

    // Close the modal after the update
    button.closest('.overlay').remove();

    // Refresh data after the update
    renderTable();
    updateSummary();
  } catch (error) {
    console.error("❌ Error updating ESD test result:", error);
  }
}

// ==================== Export History to CSV (using Firestore) ====================
async function exportHistoryToCSV() {
  try {
    const querySnapshot = await getDocs(collection(db, "washHistory")); // ดึงข้อมูลจาก collection "washHistory"
    
    if (querySnapshot.empty) {
      return alert("No history data to export.");
    }

    const data = querySnapshot.docs.map(doc => doc.data()); // แปลงข้อมูลเอกสารเป็น array

    const headers = Object.keys(data[0]); // หาหัวข้อ (keys) จากข้อมูลเอกสาร
    const csvRows = [headers.join(",")]; // สร้าง header ของ CSV

    // เพิ่มข้อมูลแต่ละแถวใน CSV
    for (let row of data) {
      const values = headers.map(
        (h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"` // Escape " เพื่อป้องกันปัญหาในการอ่านไฟล์
      );
      csvRows.push(values.join(","));
    }

    const csvData = csvRows.join("\n"); // รวมข้อมูลทั้งหมด
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" }); // สร้าง Blob สำหรับไฟล์ CSV
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wash_history_${new Date().toISOString().slice(0, 10)}.csv`; // ตั้งชื่อไฟล์
    link.click(); // เริ่มดาวน์โหลด
  } catch (error) {
    console.error("❌ Error exporting history to CSV:", error);
  }
}

// ==================== Auto append Export Button to DOM ====================
document.addEventListener("DOMContentLoaded", () => {
  // สร้างปุ่มส่งออก CSV
  const exportBtn = document.createElement("button");
  exportBtn.className = "btn-export"; // กำหนดคลาสสำหรับปุ่ม
  exportBtn.innerHTML = '<i class="fas fa-file-csv"></i> Export CSV'; // กำหนดเนื้อหาปุ่ม (รวมไอคอน CSV)
  
  // เมื่อคลิกที่ปุ่ม จะเรียกฟังก์ชัน exportHistoryToCSV
  exportBtn.onclick = exportHistoryToCSV; 
  
  // เพิ่มปุ่มเข้าไปในส่วนที่มี ID "exportArea"
  document.getElementById("exportArea")?.appendChild(exportBtn);
});

// ==================== Save Wash (using Firestore) ====================
async function saveWash() {
  const color = document.getElementById("color").value;
  if (color === "Unknown") {
    alert("⚠️ ไม่พบ Uniform นี้ในระบบ กรุณาตรวจสอบอีกครั้ง");
    return;
  }

  const newWash = {
    washId: `WASH-${Date.now()}`,
    empId: document.getElementById("empId").value,
    empName: document.getElementById("empName").value,
    uniformCode: document.getElementById("uniformCode").value,
    qty: parseInt(document.getElementById("qty").value) || 0,
    department: document.getElementById("department").value,
    color,
    status: "Waiting to Send",
    createdAt: new Date().toISOString(),
  };

  try {
    // ใช้ addDoc เพื่อเพิ่มข้อมูลใหม่ใน Firestore
    await addDoc(collection(db, "washes"), newWash);

    console.log("✅ New wash job saved successfully.");

    // รีเฟรชข้อมูลหลังการบันทึก
    renderTable();
    updateSummary();

    // ปิด modal หลังจากบันทึกสำเร็จ
    toggleModal(false);
  } catch (error) {
    console.error("❌ Failed to save wash job:", error);
    alert("❌ บันทึกข้อมูลไม่สำเร็จ");
  }
}

// ==================== Expose Functions to Global Scope ====================
window.openForm = openForm;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.showESDModal = showESDModal;
window.confirmESD = confirmESD;
window.saveWash = saveWash;
window.generateMockData = generateMockData;
window.exportHistoryToCSV = exportHistoryToCSV;
