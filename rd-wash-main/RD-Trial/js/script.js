// ==================== IndexedDB Setup ====================
let db;
const DB_NAME = 'RDWash_WashDB';
const STORE_NAME = 'washes'; 
const HISTORY_STORE = 'washHistory';
const DB_VERSION = 1;

// Initialize DB and render table on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDB();
    setupListeners();
    renderTable();
    renderHistory();
    updateSummary();
  } catch (e) {
    console.error('เกิดข้อผิดพลาดขณะเปิดฐานข้อมูล:', e);
  }
});

// ==================== Initialize IndexedDB ====================
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
      console.log('📦 Stores:', Array.from(db.objectStoreNames));
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
      } else {
        const historyStore = e.currentTarget.transaction.objectStore(HISTORY_STORE);
        if (!historyStore.indexNames.contains('testResult')) {
          historyStore.createIndex('testResult', 'testResult', { unique: false });
        }
        if (!historyStore.indexNames.contains('testDate')) {
          historyStore.createIndex('testDate', 'testDate', { unique: false });
        }
      }
    };
  });
}

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

// ==================== Utility Functions ====================
function statusClass(s, rewashCount) {
  if (s === 'Waiting Rewash') return `rewash-${rewashCount}`;
  if (s.includes('Waiting')) return 'waiting';
  if (s.includes('Washing')) return 'washing';
  if (s.includes('Completed')) return 'completed';
  if (s.includes('Rewash')) return 'rewash';
  if (s.includes('Scrap')) return 'scrap';
  return '';
}

function debounce(fn, delay) {
  let t;
  return function () {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, arguments), delay);
  };
}

// ==================== Mock Data ====================
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

// ==================== Setup Listeners ====================
function setupListeners() {
  // Search input listener
  document.getElementById('search').addEventListener('input', debounce(renderTable, 300));
  // Filter status listener
  document.getElementById('filterStatus').addEventListener('change', renderTable);
  // Update table every minute
  setInterval(renderTable, 60000);
  
  // Add the event listener for the generate mock data button
  document.getElementById('generateMockDataBtn').addEventListener('click', generateMockData);
}

// ==================== Modal ====================
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
  ['empId','empName','uniformCode','qty','editIndex','department','color'].forEach(id => document.getElementById(id).value = '');
  document.querySelector('.btn-save').disabled = false;
  document.querySelector('.btn-save').innerText = 'Save';
}

function generateID() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return getAll(STORE_NAME).then(data => {
    const count = data.filter(w => w.washId.includes(ymd)).length + 1;
    return `WASH-${ymd}-${String(count).padStart(3,'0')}`;
  });
}

async function saveWash() {
  const saveBtn = document.querySelector('.btn-save');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  const id = document.getElementById('editIndex').value;
  const newWash = {
    empId: empId.value.trim(),
    empName: empName.value.trim(),
    uniformCode: uniformCode.value.trim(),
    qty: qty.value.trim(),
    department: department.value.trim(),
    color: color.value.trim(),
    status: 'Waiting to Send',
    createdAt: new Date().toISOString(),
    rewashCount: 0
  };

  if (!newWash.empId || !newWash.empName || !newWash.uniformCode || !newWash.qty) {
    alert('Please fill in all fields');
    saveBtn.disabled = false;
    saveBtn.innerHTML = 'Save';
    return;
  }

  if (!id) newWash.washId = await generateID();
  else newWash.washId = id;

  await put(STORE_NAME, newWash);
  toggleModal(false);
  renderTable();
  updateSummary();
}

function showDeleteModal(id) {
  const modal = document.createElement('div');
  modal.className = 'overlay';
  modal.innerHTML = ` 
    <div class="confirm-box">
      <h3>Delete Confirmation</h3>
      <p>Are you sure?</p>
      <div>
        <button class="btn-yes" onclick="confirmDelete('${id}', this)">Yes</button>
        <button class="btn-no" onclick="this.closest('.overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function confirmDelete(id, el) {
  await remove(STORE_NAME, id);
  el.closest('.overlay').remove();
  renderTable();
  updateSummary();
}

function showESDModal(id) {
  const modal = document.createElement('div');
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="confirm-box">
      <h3>ESD Result</h3>
      <p>Did this wash pass the ESD test?</p>
      <div>
        <button class="btn-yes" onclick="confirmESD('${id}', true, this)">Pass</button>
        <button class="btn-no" onclick="confirmESD('${id}', false, this)">Fail</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function confirmESD(id, isPass, btn) {
  const wash = await getById(STORE_NAME, id);
  if (!wash) return;

  if (isPass) {
    wash.status = 'ESD Passed';
    await put(HISTORY_STORE, { ...wash, createdAt: new Date().toISOString() });
    await remove(STORE_NAME, id);
  } else {
    if (wash.rewashCount >= 2) {
      wash.status = 'Scrap';
      await put(HISTORY_STORE, { ...wash, createdAt: new Date().toISOString() });
      await remove(STORE_NAME, id);
    } else {
      wash.rewashCount++;
      wash.status = `Waiting Rewash #${wash.rewashCount}`;
      wash.createdAt = new Date().toISOString();
      await put(STORE_NAME, wash);
    }
  }

  btn.closest('.overlay').remove();
  renderTable();
  renderHistory();
  updateSummary();
}

// ==================== History & Summary ====================
async function renderHistory() {
  const historyTable = document.getElementById('historyTableBody');
  historyTable.innerHTML = ''; // Clear the table body
  const allHistory = await getAll(HISTORY_STORE);

  if (allHistory.length === 0) {
    historyTable.innerHTML = '<tr><td colspan="6">No history found.</td></tr>';
    return;
  }

  allHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (let h of allHistory) {
    const tr = document.createElement('tr');
    tr.innerHTML = ` 
      <td>${new Date(h.createdAt).toLocaleString()}</td>
      <td>${h.washId}</td>
      <td>${h.empId}</td>
      <td>${h.empName}</td>
      <td>${h.uniformCode}</td>
      <td>${h.status}</td>
    `;
    historyTable.appendChild(tr);
  }
}

async function updateSummary() {
  const all = await getAll(STORE_NAME);
  const history = await getAll(HISTORY_STORE);

  const waiting = all.filter(w => w.status.includes('Waiting')).length;
  const washing = all.filter(w => w.status === 'Washing').length;
  const completed = all.filter(w => w.status === 'Completed').length;
  const rewash = all.filter(w => w.status.includes('Rewash')).length;
  const scrap = history.filter(h => h.status === 'Scrap').length;

  document.getElementById('sumTotal').innerText = all.length;
  document.getElementById('sumWaiting').innerText = waiting;
  document.getElementById('sumWashing').innerText = washing;
  document.getElementById('sumCompleted').innerText = completed;
  document.getElementById('sumRewash').innerText = rewash;
  document.getElementById('sumScrap').innerText = scrap;
  document.getElementById('sumHistory').innerText = history.length;
}

// ==================== Render Table ====================
async function renderTable() {
  const keyword = document.getElementById('search').value.toLowerCase();  // Get search keyword
  const filterStatus = document.getElementById('filterStatus').value;  // Get selected status
  const tbody = document.getElementById('washTableBody');
  tbody.innerHTML = '';  // Clear the table body
  const now = new Date();

  const allWashes = await getAll(STORE_NAME);  // Get all wash jobs from IndexedDB

  if (allWashes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9">No current wash jobs found.</td></tr>';
    return;
  }

  for (let w of allWashes) {
    const hrs = (now - new Date(w.createdAt)) / 1000 / 60 / 60;  // Calculate the hours passed since creation
    if (w.status === 'Waiting to Send' && hrs >= 24) w.status = 'Washing';
    if (w.status === 'Washing' && hrs >= 72) w.status = 'Completed';
    await put(STORE_NAME, w);

    // Filter by keyword (search)
    const keywordMatch = w.empId.toLowerCase().includes(keyword) || w.uniformCode.toLowerCase().includes(keyword);
    
    // Filter by status (filterStatus)
    let statusMatch = !filterStatus || w.status === filterStatus;  // Apply the status filter
    
    // If filter status is "Waiting Rewash #1", "Waiting Rewash #2", "Waiting Rewash #3", match rewashCount
    if (filterStatus.includes('Waiting Rewash')) {
      const rewashCount = parseInt(filterStatus.split('#')[1]);
      statusMatch = w.status.includes('Waiting Rewash') && w.rewashCount === rewashCount;
    }

    if (!keywordMatch || !statusMatch) continue;  // Skip rows that do not match the filters

    let actions = '';
    if (w.status.includes('Waiting')) {
      actions = `<button class="edit" onclick="openForm('${w.washId}')">Edit</button>
                 <button class="delete" onclick="showDeleteModal('${w.washId}')">Del</button>`;
    } else if (w.status === 'Completed') {
      actions = `<button class="confirm" onclick="showESDModal('${w.washId}')">ESD</button>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = ` 
      <td>${w.washId}</td>
      <td>${w.empId}</td>
      <td>${w.empName}</td>
      <td>${w.department}</td>
      <td>${w.uniformCode}</td>
      <td>${w.color}</td>
      <td>${w.qty}</td>
      <td><span class="status ${statusClass(w.status, w.rewashCount)}">${w.status}</span></td>
      <td>${actions}</td>
    `;
    tbody.appendChild(tr);
  }

  updateSummary();  // Update the summary section
}