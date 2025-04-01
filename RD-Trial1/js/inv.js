// ==================== IndexedDB Setup ====================
const DB_NAME = "RDWash_UniformDB";
const STORE_NAME = "uniforms";
const ASSIGN_STORE = "assignments";
const EMPLOYEE_DB = "RDWashDB_employee";
const EMPLOYEE_STORE = "employees";

let db;

// ==================== Initialize IndexedDB ====================
function initInventoryDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "uniformId" });
        store.createIndex("uniformName", "uniformName", { unique: false });
      }
      if (!db.objectStoreNames.contains(ASSIGN_STORE)) {
        db.createObjectStore(ASSIGN_STORE, { autoIncrement: true });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };
    request.onerror = (e) => reject(e);
  });
}

// ==================== Utility ====================
function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

function getById(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

function put(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(data);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

function remove(storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e);
  });
}

// ==================== Render Stock UI ====================
function renderUniformCards() {
  const container = document.getElementById("uniformList");
  const keyword = document.getElementById("searchUniform")?.value.toLowerCase() || "";
  container.innerHTML = "";

  getAll(STORE_NAME).then((data) => {
    data.forEach((uni) => {
      const match =
        uni.uniformName.toLowerCase().includes(keyword) ||
        uni.size.toLowerCase().includes(keyword) ||
        (uni.type?.toLowerCase() || "").includes(keyword);
      if (!match) return;

      const card = document.createElement("div");
      card.className = "uniform-card";

      const warning = uni.quantity < 3 ? '<span class="badge warning">Low Stock</span>' : "";

      card.innerHTML = `
        <img src="${uni.photo}" alt="Photo" class="uniform-photo" title="${uni.uniformName}" />
        <div class="card-info">
          <h4>${uni.uniformName} ${warning}</h4>
          <p>Size: ${uni.size} | Color: ${uni.color}</p>
          <p>Type: ${uni.type || '-'}</p>
          <p><strong>Qty:</strong> ${uni.quantity}</p>
        </div>
      `;
      container.appendChild(card);
    });
  });
}

// ==================== Assignment Table ====================
function renderAssignmentTable() {
  const tbody = document.getElementById("assignmentTableBody");
  tbody.innerHTML = "";

  getAll(ASSIGN_STORE).then((assignments) => {
    assignments.forEach((a, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${a.uniformId}</td>
        <td>${a.employeeId}</td>
        <td>${a.quantity}</td>
        <td>${a.status}</td>
        <td><button onclick="returnUniform(${index})">↩️ Return</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ==================== Fetch Employee ====================
function loadEmployeesToDropdown() {
  const empSelect = document.getElementById("assignEmployeeId");
  empSelect.innerHTML = "";

  const request = indexedDB.open(EMPLOYEE_DB, 1);
  request.onsuccess = (e) => {
    const empDB = e.target.result;
    const tx = empDB.transaction([EMPLOYEE_STORE], "readonly");
    const store = tx.objectStore(EMPLOYEE_STORE);
    const getAll = store.getAll();

    getAll.onsuccess = () => {
      getAll.result.forEach((emp) => {
        const option = document.createElement("option");
        option.value = emp.employeeId;
        option.textContent = `${emp.employeeId} - ${emp.employeeName}`;
        empSelect.appendChild(option);
      });
    };
  };
}

function loadUniformsToDropdown() {
  const uniSelect = document.getElementById("assignUniformId");
  uniSelect.innerHTML = "";

  getAll(STORE_NAME).then((uniforms) => {
    uniforms.forEach((u) => {
      const option = document.createElement("option");
      option.value = u.uniformId;
      option.textContent = `${u.uniformName} (${u.size})`;
      uniSelect.appendChild(option);
    });
  });
}

// ==================== Assign Uniform ====================
document.getElementById("assignForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const uniformId = document.getElementById("assignUniformId").value;
  const employeeId = document.getElementById("assignEmployeeId").value;
  const qty = parseInt(document.getElementById("assignQty").value);

  if (!uniformId || !employeeId || isNaN(qty) || qty <= 0) {
    alert("⚠️ Please fill all fields correctly.");
    return;
  }

  const uniform = await getById(STORE_NAME, uniformId);
  if (!uniform || uniform.quantity < qty) {
    alert("❌ Not enough stock");
    return;
  }

  uniform.quantity -= qty;
  await put(STORE_NAME, uniform);

  await put(ASSIGN_STORE, {
    uniformId,
    employeeId,
    quantity: qty,
    status: "Assigned",
  });

  renderUniformCards();
  renderAssignmentTable();
  alert("✅ Uniform assigned");
});

// ==================== Return Uniform ====================
async function returnUniform(index) {
  const assignments = await getAll(ASSIGN_STORE);
  const record = assignments[index];
  if (!record || record.status !== "Assigned") return;

  const uniform = await getById(STORE_NAME, record.uniformId);
  if (uniform) {
    uniform.quantity += record.quantity;
    await put(STORE_NAME, uniform);
  }

  record.status = "Returned";
  await put(ASSIGN_STORE, record);
  renderUniformCards();
  renderAssignmentTable();
  alert("✅ Uniform returned");
}

// ==================== Export Report ====================
function exportAssignmentsToCSV() {
  getAll(ASSIGN_STORE).then((data) => {
    if (!data.length) return alert("No assignment data to export.");
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
    link.download = `assignments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  });
}

// ==================== Init ====================
document.addEventListener("DOMContentLoaded", () => {
  initInventoryDB().then(() => {
    document.getElementById("searchUniform")?.addEventListener("input", renderUniformCards);
    renderUniformCards();
    renderAssignmentTable();
    loadEmployeesToDropdown();
    loadUniformsToDropdown();

    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) exportBtn.addEventListener("click", exportAssignmentsToCSV);
  });
});
