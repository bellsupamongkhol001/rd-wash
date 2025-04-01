// ==================== IndexedDB Setup ====================
let db;
const DB_NAME = "RDWash_WashDB";
const STORE_NAME = "washes";
const HISTORY_STORE = "washHistory";
const DB_VERSION = 1;

// ==================== Initialize IndexedDB ====================
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => {
      console.error("❌ IndexedDB error:", e.target.error);
      reject(e);
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      console.log(`✅ Opened DB: ${DB_NAME} (v${db.version})`);
      resolve();
    };

    request.onupgradeneeded = (e) => {
      db = e.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "washId" });
        store.createIndex("employeeId", "employeeId", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createDate", "createDate", { unique: false });
      }

      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, {
          keyPath: "washId",
        });
        historyStore.createIndex("testResult", "testResult", { unique: false });
        historyStore.createIndex("testDate", "testDate", { unique: false });
      }
    };
  });
}

// 🔍 ดึงข้อมูลยูนิฟอร์มจาก DB
async function getUniformByCode(code) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RDWashDB_uniform", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(["uniforms"], "readonly");
      const store = tx.objectStore("uniforms");
      const getReq = store.get(code);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// 🔍 หาพนักงานที่เป็นเจ้าของชุดนี้จาก stock
async function getOwnerByUniformCode(code) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RDWashDB_stock", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(["stock"], "readonly");
      const store = tx.objectStore("stock");
      const index = store.index("uniformCode");
      const query = index.get(code);
      query.onsuccess = () => resolve(query.result);
      query.onerror = () => reject(query.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// 🔍 ดึงข้อมูลพนักงานจาก employee DB
async function getEmployeeById(empId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RDWashDB_employee", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(["employees"], "readonly");
      const store = tx.objectStore("employees");
      const getReq = store.get(empId);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== Initialize the Page ====================
function initWashPage() {
  // When the page is loaded, initialize the DB and setup listeners
  initDB()
    .then(() => {
      setupListeners();
      renderTable();
      renderHistory();
      updateSummary();
    })
    .catch((e) => console.error("Database initialization failed:", e));
}

document.addEventListener("DOMContentLoaded", initWashPage);

// ==================== CRUD Operations ====================
function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

function put(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], "readwrite");
    const store = tx.objectStore(storeName);
    store.put(data);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e);
  });
}

function remove(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], "readwrite");
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e);
  });
}

function getById(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

// ==================== Modal Handling ====================
function toggleModal(show) {
  document.getElementById("formModal").style.display = show ? "flex" : "none";
}

function openForm(id = null) {
  clearForm();
  document.getElementById("modalTitle").innerText = id
    ? "Edit Wash"
    : "Add Wash";
  if (id) {
    getById(STORE_NAME, id).then((data) => {
      if (data) {
        document.getElementById("editIndex").value = id;
        document.getElementById("empId").value = data.empId;
        document.getElementById("empName").value = data.empName;
        document.getElementById("uniformCode").value = data.uniformCode;
        document.getElementById("qty").value = data.qty;
        document.getElementById("department").value = data.department || "";
        document.getElementById("color").value = data.color || "";
      }
    });
  }
  toggleModal(true);
}

function clearForm() {
  [
    "empId",
    "empName",
    "uniformCode",
    "qty",
    "editIndex",
    "department",
    "color",
  ].forEach((id) => (document.getElementById(id).value = ""));
}

// ==================== Setup Event Listeners ====================
function setupListeners() {
  document
    .getElementById("search")
    ?.addEventListener("input", debounce(renderTable, 300));
  document
    .getElementById("filterStatus")
    ?.addEventListener("change", renderTable);
  setInterval(renderTable, 60000);
  document
    .getElementById("generateMockDataBtn")
    ?.addEventListener("click", generateMockData);
  document
    .getElementById("uniformCode")
    ?.addEventListener("input", debounce(autofillUniformInfo, 300));
  document.getElementById("saveBtn")?.addEventListener("click", saveWash);
}

// ==================== Rendering Functions ====================
async function renderTable() {
  const tbody = document.getElementById("washTableBody");
  const keyword = document.getElementById("search").value.toLowerCase();
  const filterStatus = document.getElementById("filterStatus").value;
  tbody.innerHTML = "";

  const allWashes = await getAll(STORE_NAME);

  allWashes.forEach((wash) => {
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
}

function renderHistory() {
  const historyTable = document.getElementById("historyTableBody");
  historyTable.innerHTML = "";
  getAll(HISTORY_STORE).then((history) => {
    history.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.washId}</td>
        <td>${entry.empId}</td>
        <td>${entry.status}</td>
        <td>${entry.testResult}</td>
        <td>${entry.testDate}</td>
      `;
      historyTable.appendChild(tr);
    });
  });
}

function updateSummary() {
  getAll(STORE_NAME).then((data) => {
    const total = data.length;
    const waiting = data.filter((item) =>
      item.status.includes("Waiting")
    ).length;
    const washing = data.filter((item) => item.status === "Washing").length;
    const completed = data.filter((item) => item.status === "Completed").length;

    document.getElementById("sumTotal").textContent = total;
    document.getElementById("sumWaiting").textContent = waiting;
    document.getElementById("sumWashing").textContent = washing;
    document.getElementById("sumCompleted").textContent = completed;
  });
}

// ==================== Helper Functions ====================
function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}

async function autofillUniformInfo() {
  const code = document.getElementById("uniformCode").value.trim();
  if (!code) return;

  try {
    const empIdEl = document.getElementById("empId");
    const empNameEl = document.getElementById("empName");
    const deptEl = document.getElementById("department");

    // เคลียร์คลาสก่อนทุกครั้ง
    empNameEl.classList.remove("text-error", "text-warning");

    const uniform = await getUniformByCode(code);
    if (uniform) {
      colorEl.value = uniform.color || "Unknown";
      colorEl.style.backgroundColor = "";
    } else {
      colorEl.value = "Unknown";
      colorEl.style.backgroundColor = "#ffe5e5";
    }

    const stock = await getOwnerByUniformCode(code);
    if (stock) {
      if (stock.employeeId) {
        empIdEl.value = stock.employeeId;
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
      clearForm(); // หรือให้ reset ช่องที่เกี่ยวข้อง
      return;
    }

    empNameEl.classList.remove("text-error", "text-warning");

    document.getElementById("qty").focus();
  } catch (err) {
    console.error("❌ Error during autofill:", err);
  }
}

// 🔍 ดึงข้อมูล Uniform
async function getUniformByCode(code) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RDWashDB_uniform", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(["uniforms"], "readonly");
      const store = tx.objectStore("uniforms");
      const getReq = store.get(code);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// 🔍 ดึงเจ้าของยูนิฟอร์มจาก stock
async function getOwnerByUniformCode(code) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RDWashDB_stock", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(["stock"], "readonly");
      const store = tx.objectStore("stock");
      const index = store.index("uniformCode");
      const query = index.get(code);
      query.onsuccess = () => resolve(query.result);
      query.onerror = () => reject(query.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// 🔍 ดึงข้อมูลพนักงาน
async function getEmployeeById(empId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RDWashDB_employee", 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(["employees"], "readonly");
      const store = tx.objectStore("employees");
      const getReq = store.get(empId);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
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

    await put(status === "Scrap" ? HISTORY_STORE : STORE_NAME, item);
  }

  renderTable();
  renderHistory();
  updateSummary();
}

// ==================== Pagination ====================
let currentPage = 1;
const rowsPerPage = 10;

function renderPagination(totalItems, current, perPage) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(totalItems / perPage);

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className = i === current ? "active" : "";
    btn.onclick = () => {
      currentPage = i;
      renderTable();
    };
    pagination.appendChild(btn);
  }
}

// ==================== Modal Templates ====================
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

// ==================== Export to CSV ====================
function exportHistoryToCSV() {
  getAll(HISTORY_STORE).then((data) => {
    if (!data.length) return alert("No history data to export.");
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    for (let row of data) {
      const values = headers.map(
        (h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`
      );
      csvRows.push(values.join(","));
    }

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wash_history_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  });
}

// Auto append Export Button to DOM
document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.createElement("button");
  exportBtn.className = "btn-export";
  exportBtn.innerHTML = '<i class="fas fa-file-csv"></i> Export CSV';
  exportBtn.onclick = exportHistoryToCSV;
  document.getElementById("exportArea")?.appendChild(exportBtn);
});

function saveWash() {
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

  const tx = db.transaction([STORE_NAME], "readwrite");
  tx.objectStore(STORE_NAME).put(newWash);
  tx.oncomplete = () => {
    renderTable();
    updateSummary();
    toggleModal(false);
  };
  tx.onerror = () => {
    alert("❌ บันทึกข้อมูลไม่สำเร็จ");
  };
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
