// ==================== IndexedDB Setup ====================
let db;
const DB_NAME = 'RDWash_WashDB';
const STORE_NAME = 'washes'; 
const HISTORY_STORE = 'washHistory';
const DB_VERSION = 1;

// ==================== Initialize IndexedDB ====================
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => {
      console.error('❌ IndexedDB error:', e.target.error);
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
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'washId' });
        store.createIndex('employeeId', 'employeeId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createDate', 'createDate', { unique: false });
      }

      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'washId' });
        historyStore.createIndex('testResult', 'testResult', { unique: false });
        historyStore.createIndex('testDate', 'testDate', { unique: false });
      }
    };
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
    .catch((e) => console.error('Database initialization failed:', e));
}

document.addEventListener('DOMContentLoaded', initWashPage);

// ==================== CRUD Operations ====================
function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

function put(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(data);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e);
  });
}

function remove(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = resolve;
    tx.onerror = (e) => reject(e);
  });
}

function getById(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e);
  });
}

// ==================== Modal Handling ====================
function toggleModal(show) {
  document.getElementById('formModal').style.display = show ? 'flex' : 'none';
}

function openForm(id = null) {
  clearForm();
  document.getElementById('modalTitle').innerText = id ? 'Edit Wash' : 'Add Wash';
  if (id) {
    getById(STORE_NAME, id).then(data => {
      if (data) {
        document.getElementById('editIndex').value = id;
        document.getElementById('empId').value = data.empId;
        document.getElementById('empName').value = data.empName;
        document.getElementById('uniformCode').value = data.uniformCode;
        document.getElementById('qty').value = data.qty;
        document.getElementById('department').value = data.department || '';
        document.getElementById('color').value = data.color || '';
      }
    });
  }
  toggleModal(true);
}

function clearForm() {
  ['empId', 'empName', 'uniformCode', 'qty', 'editIndex', 'department', 'color'].forEach(id => document.getElementById(id).value = '');
}

// ==================== Setup Event Listeners ====================
function setupListeners() {
  document.getElementById('search').addEventListener('input', debounce(renderTable, 300));
  document.getElementById('filterStatus').addEventListener('change', renderTable);
  setInterval(renderTable, 60000);
  document.getElementById('generateMockDataBtn').addEventListener('click', generateMockData);
}

// ==================== Rendering Functions ====================
async function renderTable() {
  const tbody = document.getElementById('washTableBody');
  const keyword = document.getElementById('search').value.toLowerCase();
  const filterStatus = document.getElementById('filterStatus').value;
  tbody.innerHTML = '';

  const allWashes = await getAll(STORE_NAME);

  allWashes.forEach(wash => {
    const tr = document.createElement('tr');
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
  const historyTable = document.getElementById('historyTableBody');
  historyTable.innerHTML = '';
  getAll(HISTORY_STORE).then((history) => {
    history.forEach((entry) => {
      const tr = document.createElement('tr');
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
    const waiting = data.filter(item => item.status.includes('Waiting')).length;
    const washing = data.filter(item => item.status === 'Washing').length;
    const completed = data.filter(item => item.status === 'Completed').length;

    document.getElementById('sumTotal').textContent = total;
    document.getElementById('sumWaiting').textContent = waiting;
    document.getElementById('sumWashing').textContent = washing;
    document.getElementById('sumCompleted').textContent = completed;
  });
}

// ==================== Helper Functions ====================
function debounce(fn, delay) {
  let timer;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}

// ==================== Mock Data Generation ====================
async function generateMockData() {
  const now = new Date();
  const departments = ['Research and Development'];
  const colors = ['Green', 'Yellow', 'White'];

  for (let i = 0; i < 20; i++) {
    const createdDate = new Date(now - (i % 6) * 24 * 60 * 60 * 1000);
    const ymd = createdDate.toISOString().slice(0, 10).replace(/-/g, '');
    const washId = `WASH-${ymd}-${String(i + 1).padStart(3, '0')}`;

    let status = 'Waiting to Send';
    let rewashCount = 0;

    if (i % 6 === 2) status = 'Washing';
    if (i % 6 === 3) status = 'Completed';
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
      color: colors[i % colors.length]
    };

    await put(status === 'Scrap' ? HISTORY_STORE : STORE_NAME, item);
  }

  renderTable();
  renderHistory();
  updateSummary();
}
