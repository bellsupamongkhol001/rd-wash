// ==================== IndexedDB Setup ====================
const DB_NAME = 'RDWashDB_Inventory';
const DB_VERSION = 1;
let db;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('Inventory')) {
        const store = db.createObjectStore('Inventory', { keyPath: 'uniformId' });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains('assignments')) {
        db.createObjectStore('assignments', { keyPath: 'assignId', autoIncrement: true });
      }
    };
  });
}

// ==================== Inventory Functions ====================
function addUniform(uniform) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readwrite');
    const store = transaction.objectStore('Inventory');
    const request = store.put(uniform);  // ใช้ put แทน add เพื่ออัปเดตข้อมูล

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

function getAllUniforms() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readonly');
    const store = transaction.objectStore('Inventory');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getUniformById(uniformId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readonly');
    const store = transaction.objectStore('Inventory');
    const request = store.get(uniformId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteUniform(uniformId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readwrite');
    const store = transaction.objectStore('Inventory');
    const request = store.delete(uniformId);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

function updateUniform(uniform) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readwrite');
    const store = transaction.objectStore('Inventory');
    const request = store.put(uniform);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Assignment Functions ====================
function addAssignment(assignment) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readwrite');
    const store = transaction.objectStore('assignments');
    const request = store.add(assignment);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

function getAllAssignments() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readonly');
    const store = transaction.objectStore('assignments');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAssignmentById(assignId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readonly');
    const store = transaction.objectStore('assignments');
    const request = store.get(assignId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function updateAssignment(assignment) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readwrite');
    const store = transaction.objectStore('assignments');
    const request = store.put(assignment);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

function deleteAssignment(assignId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readwrite');
    const store = transaction.objectStore('assignments');
    const request = store.delete(assignId);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Mock Data + Dashboard ====================
async function generateMockData() {
  const sampleUniforms = [
    { uniformId: 'UNI-001', name: 'Cleanroom Jacket', size: 'M', color: 'White', qty: 20, photo: '', status: 'available' },
    { uniformId: 'UNI-002', name: 'Anti-static Coat', size: 'L', color: 'Blue', qty: 15, photo: '', status: 'available' },
    { uniformId: 'UNI-003', name: 'Dust-free Pants', size: 'XL', color: 'Gray', qty: 10, photo: '', status: 'available' }
  ];

  for (const uniform of sampleUniforms) {
    await addUniform(uniform);
  }

  await renderUniformCards();
  alert('✅ Mock data added');
}

async function loadInitialData() {
  const uniforms = await getAllUniforms();
  const assignments = await getAllAssignments();
  renderUniformCards(uniforms);
  renderDashboard(uniforms, assignments);
}

function renderDashboard(uniforms, assignments) {
  const summary = {
    inUse: assignments.filter(a => a.status === 'in-use').length,
    available: uniforms.filter(u => u.status === 'available').length,
    other: uniforms.filter(u => u.status === 'other').length,
    total: uniforms.length
  };

  document.getElementById('summaryInUse').textContent = summary.inUse;
  document.getElementById('summaryActual').textContent = summary.available;
  document.getElementById('summaryOther').textContent = summary.other;
  document.getElementById('summaryTotal').textContent = summary.total;
}


// ==================== UI Rendering ====================
async function renderUniformCards() {
  const listEl = document.getElementById('uniformCardList');
  const uniforms = await getAllUniforms();
  listEl.innerHTML = '';  // Clear existing cards

  uniforms.forEach((u) => {
    const card = document.createElement('div');
    card.className = 'inventory-card';
    card.innerHTML = `
      <div class="actions">
        <button class="edit" onclick="editUniform('${u.uniformId}')"><i class="fas fa-pen"></i></button>
        <button class="delete" onclick="deleteUniform('${u.uniformId}')"><i class="fas fa-trash"></i></button>
        <button class="detail" onclick="openDetail('${u.uniformId}')"><i class="fas fa-eye"></i></button>
      </div>
           <img src="${u.photo || 'https://placekitten.com/240/140'}" alt="Uniform Image" />
      <p>Size: ${u.size} | Color: ${u.color}</p>
      <div class="qty"><i class="fas fa-box"></i> ${u.qty}</div>
    `;
    listEl.appendChild(card);
  });
}

// ==================== Handle Add/Edit Uniform ====================
document.getElementById('formAddUniform').addEventListener('submit', async (e) => {
  e.preventDefault();

  const uniformId = document.getElementById('uniformId').value || `UNI-${Date.now()}`;
  const name = document.getElementById('uniformName').value.trim();
  const size = document.getElementById('uniformSize').value.trim();
  const color = document.getElementById('uniformColor').value.trim();
  const qty = parseInt(document.getElementById('uniformQty').value.trim());
  const photoInput = document.getElementById('uniformPhoto');
  const photo = photoInput.files[0] ? await toBase64(photoInput.files[0]) : '';

  const uniform = { uniformId, name, size, color, qty, photo, status: 'available' };
  await updateUniform(uniform);

  closeModal('modalAddUniform');
  renderUniformCards();
  e.target.reset();
});

// 🖼 Convert Image File to Base64
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== Handle Assignment Submit ====================
async function handleAssignSubmit(e) {
  e.preventDefault();

  const uniformCode = document.getElementById('assignUniformCode').value;
  const size = document.getElementById('assignSize').value;
  const color = document.getElementById('assignColor').value;
  const qty = parseInt(document.getElementById('assignQty').value);
  const employeeId = document.getElementById('assignEmployeeId').value.trim();
  const employeeName = document.getElementById('assignEmployeeName').value.trim();
  const department = document.getElementById('assignDepartment').value.trim();

  if (!uniformCode || !employeeId || !employeeName || !department) {
    alert("Please complete all required fields.");
    return;
  }

  const assignment = {
    assignId: `ASG-${Date.now()}`,
    uniformCode,
    size,
    color,
    qty,
    employeeId,
    employeeName,
    department,
    status: 'in-use',
    createdAt: new Date().toISOString()
  };

  await addAssignment(assignment);
  closeModal('modalAssignUniform');
  alert('✅ Uniform assigned successfully');
}


// ==================== Handle Uniform Return ====================
async function returnAssignedUniform(assignId) {
  const assignment = await getAssignmentById(assignId);
  if (!assignment || assignment.status === 'returned') {
    alert('❌ Assignment not found or already returned');
    return;
  }

  // อัปเดตสถานะ assignment
  assignment.status = 'returned';
  assignment.returnDate = new Date().toISOString();
  await updateAssignment(assignment);

  // คืนจำนวนเข้า Inventory
  const uniform = await getUniformById(assignment.uniformCode);
  if (uniform) {
    uniform.qty += assignment.qty;
    await updateUniform(uniform);
  }

  await renderUniformCards();
  alert('✅ Uniform returned to stock');
}

document.getElementById('searchUniform').addEventListener('input', async function() {
  const searchQuery = this.value.toLowerCase();
  const uniforms = await getAllUniforms();
  const filteredUniforms = uniforms.filter(u => u.name.toLowerCase().includes(searchQuery) || u.color.toLowerCase().includes(searchQuery));
  renderUniformCards(filteredUniforms);  // แสดงผลยูนิฟอร์มที่กรองแล้ว
});

// ฟังก์ชันกรองยูนิฟอร์ม
document.getElementById('filterStatus').addEventListener('change', async function() {
  const filterStatus = this.value;
  const uniforms = await getAllUniforms();
  const filteredUniforms = uniforms.filter(u => {
    return filterStatus === '' || u.status === filterStatus;
  });
  renderUniformCards(filteredUniforms);  // แสดงผลยูนิฟอร์มที่กรองแล้ว
});

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // เปิดฐานข้อมูลให้เสร็จก่อน
    await openDatabase(); 
    loadInitialData();
    document.getElementById('formAssignUniform').addEventListener('submit', handleAssignSubmit);
  } catch (error) {
    console.error("Database failed to open: ", error);
  }
});

// เปิดรายละเอียดของ Uniform
async function openDetail(uniformId) {
  const uniform = await getUniformById(uniformId);
  if (!uniform) return alert("Uniform not found");

  // แสดงข้อมูลใน modal
  const header = document.getElementById('uniformDetailHeader');
  header.textContent = `${uniform.name} | Size: ${uniform.size} | Color: ${uniform.color} | Qty: ${uniform.qty}`;

  const tbody = document.getElementById('uniformDetailBody');
  tbody.innerHTML = '';

  const assignments = await getAllAssignments();
  const filtered = assignments.filter(a => a.uniformCode === uniformId);

  filtered.forEach(assign => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${assign.uniformCode}</td>
      <td>${assign.employeeId}</td>
      <td>${assign.employeeName}</td>
      <td>${assign.department}</td>
      <td>${assign.qty}</td>
      <td><span class="status ${assign.status}">${assign.status}</span></td>
      <td>
        <button class="edit" onclick="editAssignment('${assign.assignId}')"><i class="fas fa-pen"></i></button>
        <button class="delete" onclick="removeAssignment('${assign.assignId}')"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById('modalUniformDetail').style.display = 'flex';
}

// แก้ไขข้อมูลของ Uniform
async function editUniform(uniformId) {
  const data = await getUniformById(uniformId);
  if (!data) return alert('Uniform not found');

  document.getElementById('uniformId').value = data.uniformId;
  document.getElementById('uniformName').value = data.name;
  document.getElementById('uniformSize').value = data.size;
  document.getElementById('uniformColor').value = data.color;
  document.getElementById('uniformQty').value = data.qty;

  document.getElementById('modalAddUniform').style.display = 'flex';
}
