// ==================== Generate Mock Data ====================

import { put } from './firebase_model.js';
import { renderTable, renderHistory, updateSummary } from './view_firebase.js';
import { STORE_NAME, HISTORY_STORE } from './constants.js';

export async function generateMockData() {
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