/*
* 🎯 Render inventory cards to the grid
 * @param {Array} data - Array of inventory stock objects
 */
export function renderInventoryCards(data) {
  const grid = document.getElementById('inventoryList');
  grid.innerHTML = '';

  if (!data || data.length === 0) {
    grid.innerHTML = '<p>No inventory found.</p>';
    return;
  }

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'inventory-card';

    card.innerHTML = `
      <img src="${item.employeeIMG || 'https://via.placeholder.com/100x140'}" alt="${item.employeeName}" />
      <h4>${item.uniformCode}</h4>
      <p><strong>${item.uniformName}</strong> - ${item.uniformSize}</p>
      <p>Color: ${item.uniformColor}</p>
      <p>Owner: ${item.employeeName || '-'} (${item.employeeId || '-'})</p>
      <p>Status: <span class="badge badge-${item.status}">${item.status}</span></p>
      <div class="actions">
        <button onclick="openAssignModal('${item.id}')">🎯 Assign</button>
        <button onclick="openCodeListModal('${item.uniformId}')">📄 Codes</button>
        <button onclick="deleteInventory('${item.id}')">🗑️ Delete</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

/**
 * 📊 Render summary cards (status count)
 * @param {Array} data - Array of inventory stock objects
 */
export function renderSummary(data) {
  const summary = document.getElementById('summaryCards');
  summary.innerHTML = '';

  const counts = {
    available: 0,
    'in-use': 0,
    'in-wash': 0,
    scrap: 0,
  };

  data.forEach(item => {
    if (counts[item.status] !== undefined) {
      counts[item.status]++;
    }
  });

  for (const status in counts) {
    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
      <h4>${status.replace('-', ' ').toUpperCase()}</h4>
      <p>${counts[status]}</p>
    `;
    summary.appendChild(card);
  }
}