// ==================== Export CSV Utility ====================

import { getAll } from '../models/washModels.js';
import { HISTORY_STORE } from '../constants/constants.js';

export async function exportHistoryToCSV() {
  const data = await getAll(HISTORY_STORE);
  if (!data.length) return alert('No history data to export.');

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (let row of data) {
    const values = headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}`);
    csvRows.push(values.join(','));
  }

  const csvData = csvRows.join('\n');
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `wash_history_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}