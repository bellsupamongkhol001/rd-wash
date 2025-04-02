// ==================== Controller Functions (ใช้ Firebase) ====================

import { getAll, getById, put, remove } from './firebase_model.js';
import { renderTable, renderHistory, updateSummary, toggleModal } from './view.js';
import { debounce } from './utils.js';
import { HISTORY_STORE, STORE_NAME } from './constants.js';

export function setupListeners() {
  document.getElementById('search').addEventListener('input', debounce(renderTable, 300));
  document.getElementById('filterStatus').addEventListener('change', renderTable);
  setInterval(renderTable, 60000);
  document.getElementById('generateMockDataBtn').addEventListener('click', generateMockData);
}

export function openForm(id = null) {
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

export function clearForm() {
  ['empId','empName','uniformCode','qty','editIndex','department','color'].forEach(id => document.getElementById(id).value = '');
  document.querySelector('.btn-save').disabled = false;
  document.querySelector('.btn-save').innerText = 'Save';
}

export function generateID() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return getAll(STORE_NAME).then(data => {
    const count = data.filter(w => w.washId.includes(ymd)).length + 1;
    return `WASH-${ymd}-${String(count).padStart(3,'0')}`;
  });
}

export async function saveWash() {
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

  newWash.washId = id || await generateID();
  await put(STORE_NAME, newWash);
  toggleModal(false);
  renderTable();
  updateSummary();
}

export async function confirmDelete(id, el) {
  await remove(STORE_NAME, id);
  el.closest('.overlay').remove();
  renderTable();
  updateSummary();
}

export async function confirmESD(id, isPass, btn) {
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

// Export CSV button setup (optional)
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn-export';
  exportBtn.innerHTML = '<i class="fas fa-file-csv"></i> Export CSV';
  exportBtn.onclick = exportHistoryToCSV;
  document.getElementById('exportArea')?.appendChild(exportBtn);
});
