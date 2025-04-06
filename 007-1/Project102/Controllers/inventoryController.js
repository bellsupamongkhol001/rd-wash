import {
    getInventoryStock,
    addInventoryStock,
    updateInventoryStock,
    deleteInventoryStock,
    getEmployeeById,
    getUniformById
  } from './inventoryModel.js';
  
  import {
    renderInventoryCards,
    renderSummary
  } from './inventoryView.js';
  
  /**
   * 🚀 Load and render inventory on page init
   */
  export async function loadInventory() {
    try {
      const data = await getInventoryStock();
      renderInventoryCards(data);
      renderSummary(data);
    } catch (err) {
      console.error('Error loading inventory:', err);
    }
  }
  
  /**
   * 🔍 Bind search input to live filter
   */
  export function bindSearchInput() {
    const input = document.getElementById('searchByUniformAndEmployee');
    input.addEventListener('input', async () => {
      const keyword = input.value.toLowerCase();
      const all = await getInventoryStock();
      const filtered = all.filter(item => {
        return (
          item.uniformCode?.toLowerCase().includes(keyword) ||
          item.employeeName?.toLowerCase().includes(keyword) ||
          item.employeeId?.toLowerCase().includes(keyword)
        );
      });
      renderInventoryCards(filtered);
      renderSummary(filtered);
    });
  }
  
  /**
   * ❌ Delete inventory record
   */
  export async function deleteInventory(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await deleteInventoryStock(id);
    await loadInventory();
  }
  
  /**
   * 📥 Export inventory as CSV
   */
  export async function exportInventoryCSV() {
    const data = await getInventoryStock();
    const headers = ['Uniform Code', 'Uniform Name', 'Size', 'Color', 'Qty', 'Employee ID', 'Employee Name', 'Status'];
    const rows = data.map(item => [
      item.uniformCode,
      item.uniformName,
      item.uniformSize,
      item.uniformColor,
      item.uniformQty,
      item.employeeId,
      item.employeeName,
      item.status
    ]);
  
    let csv = headers.join(',') + '\n';
    rows.forEach(row => { csv += row.join(',') + '\n'; });
  
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-stock.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  
  /**
   * 🔗 Bind export button
   */
  export function bindExportBtn() {
    const btn = document.getElementById('btnExportReport');
    btn.addEventListener('click', exportInventoryCSV);
  }
  
  /**
   * 📦 Init controller when DOM is ready
   */
  window.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    bindSearchInput();
    bindExportBtn();
  });
  