// ==================== IndexedDB Setup ====================
const DB_NAME = 'RDWashDB';
const DB_VERSION = 2; // อัปเกรดเวอร์ชันเพื่อให้ onupgradeneeded ทำงาน
const UNIFORM_STORE = 'uniforms';
const CODE_STORE = 'uniformCodes';
const EMPLOYEE_STORE = 'employees';

// ==================== Init ====================
document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    document.getElementById('searchInventory').addEventListener('input', renderUniformCards);
    document.getElementById('addInventoryBtn').addEventListener('click', () => openUniformForm());
    document.getElementById('inventoryForm').addEventListener('submit', saveUniform);
    renderUniformCards();
  });
});

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject(e);

    request.onsuccess = (e) => {
      db = e.target.result;
      console.log('✅ DB opened:', DB_NAME);
      resolve();
    };

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      console.log('🔁 Upgrading DB to version', DB_VERSION);

      if (!db.objectStoreNames.contains(UNIFORM_STORE)) {
        db.createObjectStore(UNIFORM_STORE, { keyPath: 'uniformId' });
        console.log('✅ Created store:', UNIFORM_STORE);
      }

      if (!db.objectStoreNames.contains(CODE_STORE)) {
        db.createObjectStore(CODE_STORE, { keyPath: 'uniformCode' });
        console.log('✅ Created store:', CODE_STORE);
      }

      if (!db.objectStoreNames.contains(EMPLOYEE_STORE)) {
        db.createObjectStore(EMPLOYEE_STORE, { keyPath: 'employeeId' });
        console.log('✅ Created store:', EMPLOYEE_STORE);
      }
    };
  });
}

// ==================== Modal Controls ====================
function toggleModal(show) {
  document.getElementById('inventoryModal').style.display = show ? 'flex' : 'none';
}

function closeInventoryModal() {
  toggleModal(false);
}

function clearForm() {
  ['inventoryId', 'UniformName', 'UniformSize', 'UniformColor', 'UniformQty', 'UniformPicture'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('UniformOwner').innerHTML = '<option value="">-- None --</option>';
}

// ==================== Open Add/Edit ====================
function openUniformForm(id = null) {
  clearForm();
  populateEmployeeSelect();
  toggleModal(true);
  const title = document.getElementById('modalTitle');
  title.textContent = id ? 'Edit Uniform' : 'Add Uniform';

  if (id) {
    getUniform(id).then((uni) => {
      document.getElementById('inventoryId').value = uni.uniformId;
      document.getElementById('UniformName').value = uni.uniformName;
      document.getElementById('UniformSize').value = uni.uniformSize;
      document.getElementById('UniformColor').value = uni.uniformColor;
      document.getElementById('UniformQty').value = uni.uniformQty;

      const select = document.getElementById('UniformOwner');
      if (uni.employeeId) select.value = uni.employeeId;
    });
  } else {
    document.getElementById('inventoryId').value = 'UNI-' + Math.floor(Math.random() * 10000);
  }
}

// ==================== Save ====================
function saveUniform(e) {
  e.preventDefault();

  const id = document.getElementById('inventoryId').value.trim();
  const name = document.getElementById('UniformName').value.trim();
  const size = document.getElementById('UniformSize').value.trim();
  const color = document.getElementById('UniformColor').value.trim();
  const qty = parseInt(document.getElementById('UniformQty').value.trim());
  const empId = document.getElementById('UniformOwner').value;
  const file = document.getElementById('UniformPicture').files[0];

  if (!id || !name || !size || !color || !qty) {
    alert('Please fill in all fields.');
    return;
  }

  const saveData = (imageBase64 = '') => {
    if (empId) {
      getEmployee(empId).then((emp) => {
        storeUniform({
          uniformId: id,
          uniformName: name,
          uniformSize: size,
          uniformColor: color,
          uniformQty: qty,
          photo: imageBase64,
          status: 'Owned',
          employeeId: emp.employeeId,
          employeeName: emp.employeeName
        });
      });
    } else {
      storeUniform({
        uniformId: id,
        uniformName: name,
        uniformSize: size,
        uniformColor: color,
        uniformQty: qty,
        photo: imageBase64,
        status: 'Available',
        employeeId: '',
        employeeName: ''
      });
    }
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = e => saveData(e.target.result);
    reader.readAsDataURL(file);
  } else {
    getUniform(id).then(data => saveData(data?.photo || ''));
  }
}

function storeUniform(data) {
  const tx = db.transaction(STORE_UNIFORMS, 'readwrite');
  const store = tx.objectStore(STORE_UNIFORMS);
  store.put(data);
  tx.oncomplete = () => {
    toggleModal(false);
    renderUniformCards();
  };
}

// ==================== Employees ====================
function getAllEmployees() {
  return new Promise(resolve => {
    const tx = db.transaction(STORE_EMPLOYEES, 'readonly');
    const store = tx.objectStore(STORE_EMPLOYEES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

function getEmployee(id) {
  return new Promise(resolve => {
    const tx = db.transaction(STORE_EMPLOYEES, 'readonly');
    const store = tx.objectStore(STORE_EMPLOYEES);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
  });
}

function populateEmployeeSelect() {
  const select = document.getElementById('UniformOwner');
  select.innerHTML = '<option value="">-- None --</option>';

  getAllEmployees().then(employees => {
    employees.forEach(emp => {
      const option = document.createElement('option');
      option.value = emp.employeeId;
      option.textContent = `${emp.employeeId} - ${emp.employeeName}`;
      select.appendChild(option);
    });
  });
}

function generateEmployeeMock() {
  const employees = [
    { employeeId: 'EMP001', employeeName: 'John Doe' },
    { employeeId: 'EMP002', employeeName: 'Alice Smith' },
    { employeeId: 'EMP003', employeeName: 'Bob Johnson' },
    { employeeId: 'EMP004', employeeName: 'Mary Lee' },
    { employeeId: 'EMP005', employeeName: 'David Kim' }
  ];

  const tx = db.transaction(STORE_EMPLOYEES, 'readwrite');
  const store = tx.objectStore(STORE_EMPLOYEES);
  employees.forEach(emp => store.put(emp));
  tx.oncomplete = () => {
    alert('Mock employees added!');
    populateEmployeeSelect();
  };
}

// ==================== Render ====================
function renderUniformCards() {
  const container = document.getElementById('inventoryList');
  const keyword = document.getElementById('searchInventory')?.value.toLowerCase() || '';
  container.innerHTML = '';

  getAllUniforms().then(uniforms => {
    if (!uniforms.length) {
      container.innerHTML = '<p>No uniforms found.</p>';
      return;
    }

    uniforms.forEach((u) => {
      if (!u.uniformName.toLowerCase().includes(keyword) && !u.uniformColor.toLowerCase().includes(keyword)) return;

      const card = document.createElement('div');
      card.className = 'inventory-card';
      const badge = u.status === 'Owned' ? '<span class="badge owned">Owned</span>' : '<span class="badge available">Available</span>';
      const owner = u.employeeName ? `<div class="owner">👤 ${u.employeeName}</div>` : '';

      card.innerHTML = `
        <div class="actions">
          <button class="edit" onclick="openUniformForm('${u.uniformId}')"><i class="fas fa-edit"></i></button>
          <button class="delete" onclick="toggleDeleteModal(true, '${u.uniformId}')"><i class="fas fa-trash-alt"></i></button>
          <button class="detail" onclick="showDetail('${u.uniformId}')"><i class="fas fa-eye"></i></button>
        </div>
        <img src="${u.photo || 'https://via.placeholder.com/240x140?text=No+Image'}" alt="Uniform">
        <h4>${u.uniformName}</h4>
        <p>Size: ${u.uniformSize} | Color: ${u.uniformColor}</p>
        <div class="qty">Qty: ${u.uniformQty}</div>
        ${owner}
        ${badge}
      `;
      container.appendChild(card);
    });
  });
}

function getAllUniforms() {
  return new Promise(resolve => {
    const tx = db.transaction(STORE_UNIFORMS, 'readonly');
    const store = tx.objectStore(STORE_UNIFORMS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

// ==================== Restore Detail + Delete ====================
function showDetail(id) {
  getUniform(id).then((u) => {
    if (!u) return;

    const tbody = document.getElementById('uniformDetailTableBody');
    if (!tbody) return;

    document.getElementById('uniformDetails').style.display = 'block';
    tbody.innerHTML = '';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${u.uniformId}</td>
      <td>${u.uniformSize}</td>
      <td>${u.uniformColor}</td>
      <td>${u.uniformQty}</td>
      <td>${u.employeeId || '—'}</td>
      <td>${u.employeeName || '—'}</td>
      <td>${u.status || 'Available'}</td>
    `;
    tbody.appendChild(row);
  });
}

function toggleDeleteModal(show, id = null) {
  const modal = document.getElementById('deleteModal');
  modal.style.display = show ? 'flex' : 'none';
  modal.dataset.id = id;
}

function deleteUniform() {
  const id = document.getElementById('deleteModal').dataset.id;
  if (!id) return;

  const tx = db.transaction(STORE_UNIFORMS, 'readwrite');
  const store = tx.objectStore(STORE_UNIFORMS);
  store.delete(id);
  tx.oncomplete = () => {
    toggleDeleteModal(false);
    renderUniformCards();
  };
}

function getUniform(id) {
  return new Promise(resolve => {
    const tx = db.transaction(STORE_UNIFORMS, 'readonly');
    const store = tx.objectStore(STORE_UNIFORMS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
  });
}

window.returnUniform = async function (code, uniformId) {
  await updateDoc(doc(db, "uniformCodes", code), {
    status: "In Stock",
    employeeId: null,
    employeeName: null
  });

  window.viewDetail(uniformId);
  renderTemplates();
};

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
