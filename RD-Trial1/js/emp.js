// ==================== IndexedDB Setup ====================
const DB_NAME = "RDWashDB_employee";
const DB_VERSION = 1; // เพิ่มเวอร์ชันเพื่อหลีกเลี่ยง VersionError
const STORE_NAME = "employees";

let db;

// Initialize DB and render table on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initDB().then(() => {
    document
      .getElementById("searchEmployee")
      .addEventListener("input", renderEmployeeTable);
    renderEmployeeTable();
  });
});

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
      console.log(`✅ Opened IndexedDB: ${DB_NAME} (v${db.version})`);
      resolve();
    };

    request.onupgradeneeded = (e) => {
      db = e.target.result;

      const oldVersion = e.oldVersion;
      const newVersion = e.newVersion;
      console.log(`⚙️ Upgrading DB from v${oldVersion} → v${newVersion}`);

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "employeeId",
        });
        store.createIndex("employeeName", "employeeName", { unique: false });
        store.createIndex("department", "department", { unique: false });
      } else {
        const transaction = e.target.transaction;
        const store = transaction.objectStore(STORE_NAME);

        if (!store.indexNames.contains("employeeName")) {
          store.createIndex("employeeName", "employeeName", { unique: false });
        }

        if (!store.indexNames.contains("department")) {
          store.createIndex("department", "department", { unique: false });
        }
      }
    };
  });
}

// ==================== Validation Logic ====================
async function validateEmployeeForm() {
  const id = document.getElementById("employeeId").value.trim();
  const name = document.getElementById("employeeName").value.trim();
  const dept = document.getElementById("employeeDept").value.trim();
  const editId = document.getElementById("employeeEditIndex").value;

  const idPattern = /^[A-Z0-9]+$/;

  if (!id || !name || !dept) {
    alert("⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง");
    return false;
  }

  if (!idPattern.test(id)) {
    alert(
      "⚠️ Employee ID ต้องเป็นตัวอักษรภาษาอังกฤษหรือตัวเลขเท่านั้น (A-Z, 0-9)"
    );
    return false;
  }

  if (!editId) {
    const exists = await checkIfEmployeeExists(id);
    if (exists) {
      alert("❌ มี Employee ID นี้ในระบบแล้ว");
      return false;
    }
  }

  return true;
}

function openEmployeeForm(id = null) {
  const modal = document.getElementById("employeeFormModal");
  const title = document.getElementById("employeeModalTitle");
  const idField = document.getElementById("employeeId");
  clearForm();

  if (id) {
    title.textContent = "Edit Employee";
    document.getElementById('employeeId').disabled = true;
    getEmployee(id)
      .then((emp) => {
        if (emp) {
          idField.value = emp.employeeId;
          idField.disabled = true;
          document.getElementById("employeeName").value = emp.employeeName;
          document.getElementById("employeeDept").value = emp.employeeDept;
          document.getElementById("employeePhoto").value = "";
          document.getElementById("employeePhoto").dataset.preview =
            emp.employeePhoto;
          document.getElementById("employeeEditIndex").value = emp.employeeId;
        }
      })
      .catch(() => {
        alert("Error fetching employee details for editing");
      });
  } else {
    idField.disabled = false;
    title.textContent = "Add Employee";
    document.getElementById('employeeId').disabled = false;
  }

  modal.style.display = "flex";
}

function deleteEmployee() {
  if (!currentDeleteId) {
    alert("No employee selected for deletion");
    return;
  }

  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.delete(currentDeleteId);

  transaction.oncomplete = () => {
    toggleDeleteModal(false);
    renderEmployeeTable();
  };

  transaction.onerror = (e) => {
    console.error("Error deleting employee:", e.target.error);
    alert("Error deleting employee. Please try again.");
  };
}

function getEmployee(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Error fetching employee");
  });
}

// ==================== Save Employee with Duplicate ID Check ====================
async function saveEmployee() {
  const isValid = await validateEmployeeForm(); // ✅ ใช้ await

  if (!isValid) return;

  const id = document.getElementById("employeeId").value.trim();
  const name = document.getElementById("employeeName").value.trim();
  const dept = document.getElementById("employeeDept").value.trim();
  const photoInput = document.getElementById("employeePhoto");
  const file = photoInput.files[0];

  let employeePhoto = "";
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      employeePhoto = e.target.result;
      saveToDatabase(id, name, dept, employeePhoto);
    };
    reader.readAsDataURL(file);
  } else {
    employeePhoto =
      document.getElementById("employeePhoto").dataset.preview || "";
    saveToDatabase(id, name, dept, employeePhoto);
  }
}

function saveToDatabase(id, name, dept, employeePhoto) {
  const emp = {
    employeeId: id,
    employeeName: name,
    employeeDept: dept,
    employeePhoto: employeePhoto,
  };

  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.put(emp);

  transaction.oncomplete = () => {
    alert("✅ บันทึกข้อมูลพนักงานสำเร็จ");
    toggleEmployeeModal(false);
    renderEmployeeTable();
  };
}

// ==================== Check if Employee ID Exists ====================
function checkIfEmployeeExists(id) {
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result !== undefined);
  });
}

// ==================== Render Employee Table ====================
function renderEmployeeTable() {
  const tbody = document.getElementById("employeeTableBody");
  const keyword = document.getElementById("searchEmployee").value.toLowerCase();
  tbody.innerHTML = "";

  getAllEmployees().then((employees) => {
    const filteredEmployees = employees.filter(
      (emp) =>
        emp.employeeId.toLowerCase().includes(keyword) ||
        emp.employeeName.toLowerCase().includes(keyword)
    );

    if (filteredEmployees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No employees found.</td></tr>';
      return;
    }

    filteredEmployees.forEach((emp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${emp.employeeId}</td>
        <td>${emp.employeeName}</td>
        <td>${emp.employeeDept}</td>
        <td><img src="${emp.employeePhoto}" alt="Photo" style="max-width:60px; border-radius:6px;"></td>
        <td class="actions">
          <button class="edit" onclick="openEmployeeForm('${emp.employeeId}')">Edit</button>
          <button class="delete" onclick="toggleDeleteModal(true, '${emp.employeeId}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}
// ==================== Fetch All Employees ====================
function getAllEmployees() {
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

// ==================== Fetch Employee by ID ====================
function getEmployee(id) {
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
  });
}

// ==================== Delete Employee ====================
function deleteEmployee() {
  if (!currentDeleteId) return;
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  store.delete(currentDeleteId);

  transaction.oncomplete = () => {
    toggleDeleteModal(false);
    renderEmployeeTable();
  };
}

// ==================== Modal Controls ====================
let currentDeleteId = null;

function toggleDeleteModal(show, id = null) {
  document.getElementById("deleteModal").style.display = show ? "flex" : "none";
  currentDeleteId = id;
}

// ==================== Mock Data for Employees ====================
async function generateMockData() {
  const departments = ["Research and Development"];
  const employeeNames = Array.from(
    { length: 20 },
    (_, i) => `EmployeeName${String(i + 1).padStart(3, "0")}`
  );
  const employeePhotos = [
    "https://cdn-icons-png.flaticon.com/512/2919/2919906.png",
  ];

  for (let i = 0; i < 20; i++) {
    const employeeId = `EMP${1000 + i}`;
    const employeeName = employeeNames[i];
    const employeeDept = departments[i % departments.length];
    const employeePhoto = employeePhotos[i % employeePhotos.length];

    const employee = { employeeId, employeeName, employeeDept, employeePhoto };

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(employee);

    transaction.oncomplete = () => {
      console.log(`Employee ${employeeId} added successfully!`);
    };
    transaction.onerror = (e) => {
      console.error("Error inserting employee:", e.target.error);
    };
  }

  renderEmployeeTable();
}

function exportEmployees() {
  getAllEmployees().then((employees) => {
    if (!employees.length) {
      alert("❗ No employee data to export.");
      return;
    }

    const csvHeader = "Employee ID,Name,Department,Photo\n";
    const csvRows = employees.map(
      (emp) =>
        `"${emp.employeeId}","${emp.employeeName}","${emp.employeeDept}","${emp.employeePhoto}"`
    );
    const csvContent = csvHeader + csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function importEmployees(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("❗ No file selected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result
      .split("\n")
      .filter((line) => line.trim() !== "");
    if (lines.length <= 1) {
      alert("❗ CSV file is empty or missing header.");
      return;
    }

    const employees = [];
    for (let i = 1; i < lines.length; i++) {
      const [id, name, dept, photo] = lines[i]
        .split(",")
        .map((cell) => cell.replace(/"/g, "").trim());
      if (!id || !name || !dept || !photo) continue;

      employees.push({
        employeeId: id,
        employeeName: name,
        employeeDept: dept,
        employeePhoto: photo,
      });
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    employees.forEach((emp) => store.put(emp));

    transaction.oncomplete = () => {
      alert("✅ Import complete!");
      renderEmployeeTable();
    };

    transaction.onerror = () => {
      console.error("❌ Import failed:", transaction.error);
      alert("❌ Failed to import some data.");
    };
  };

  reader.readAsText(file);
}

function clearForm() {
  document.getElementById("employeeId").value = "";
  document.getElementById("employeeName").value = "";
  document.getElementById("employeeDept").value = "";
  document.getElementById("employeePhoto").value = ""; // รีเซ็ตรูปถ่ายที่เลือก
  document.getElementById("employeeEditIndex").value = ""; // รีเซ็ต hidden input
}

function toggleEmployeeModal(show) {
  const modal = document.getElementById("employeeFormModal");
  modal.style.display = show ? "flex" : "none"; // เปิดหรือปิด Modal
}
