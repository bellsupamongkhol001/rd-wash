// ==================== View Functions (ใช้ Firebase) ====================

import { getAll, put } from '../models/washModels.js';
import { STORE_NAME, HISTORY_STORE } from './constants.js';
import { statusClass } from '../utility/washUtil.js';
import { updateSummary } from '../controllers/washControllers.js';

export async function renderTable() {
  const keyword = document.getElementById('search').value.toLowerCase();
  const filterStatus = document.getElementById('filterStatus').value;
  const tbody = document.getElementById('washTableBody');
  tbody.innerHTML = '';
  const now = new Date();

  const allWashes = await getAll(STORE_NAME);
  if (allWashes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9">No current wash jobs found.</td></tr>';
    return;
  }

  for (let w of allWashes) {
    const hrs = (now - new Date(w.createdAt)) / 1000 / 60 / 60;
    if (w.status === 'Waiting to Send' && hrs >= 24) w.status = 'Washing';
    if (w.status === 'Washing' && hrs >= 72) w.status = 'Completed';
    await put(STORE_NAME, w);

    const keywordMatch = w.empId.toLowerCase().includes(keyword) || w.uniformCode.toLowerCase().includes(keyword);
    let statusMatch = !filterStatus || w.status === filterStatus;
    if (filterStatus.includes('Waiting Rewash')) {
      const rewashCount = parseInt(filterStatus.split('#')[1]);
      statusMatch = w.status.includes('Waiting Rewash') && w.rewashCount === rewashCount;
    }

    if (!keywordMatch || !statusMatch) continue;

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

  updateSummary();
}

export async function renderHistory() {
  const historyTable = document.getElementById('historyTableBody');
  historyTable.innerHTML = '';
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

export async function updateSummary() {
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

export function toggleModal(show) {
  document.getElementById('formModal').style.display = show ? 'flex' : 'none';
}

export function showDeleteModal(id) {
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

export function showESDModal(id) {
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
