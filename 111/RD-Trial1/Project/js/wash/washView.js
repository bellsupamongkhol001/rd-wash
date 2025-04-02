// washView.js (พร้อมใช้กับ Firebase)

export const washView = {
  renderTable(data) {
    const tbody = document.getElementById("washTableBody");
    tbody.innerHTML = data.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.washId || item.id}</td>
        <td>${item.employeeId}</td>
        <td>${item.employeeName}</td>
        <td><span class="badge ${item.status}">${item.status}</span></td>
        <td>
          <button class="btn edit" data-id="${item.washId || item.id}">Edit</button>
          <button class="btn delete" data-id="${item.washId || item.id}">Delete</button>
        </td>
      </tr>`).join("");
  },

  updateSummary(data) {
    const total = data.length;
    const waiting = data.filter(d => d.status === 'กำลังรอส่งซัก').length;
    const washing = data.filter(d => d.status === 'กำลังซัก').length;
    const completed = data.filter(d => d.status === 'ซักเสร็จแล้ว').length;
    document.getElementById("totalCount").textContent = total;
    document.getElementById("waitingCount").textContent = waiting;
    document.getElementById("washingCount").textContent = washing;
    document.getElementById("completedCount").textContent = completed;
  },

  toggleModal(show) {
    const modal = document.getElementById("washModal");
    modal.style.display = show ? "block" : "none";
  },

  clearForm() {
    document.getElementById("washForm").reset();
    document.getElementById("washId").value = "";
  },

  fillForm(data) {
    document.getElementById("washId").value = data.washId || data.id;
    document.getElementById("employeeId").value = data.employeeId;
    document.getElementById("employeeName").value = data.employeeName;
    document.getElementById("uniformCode").value = data.uniformCode;
    document.getElementById("qty").value = data.qty;
  },

  showDeleteModal(id) {
    const confirmModal = document.getElementById("confirmDeleteModal");
    confirmModal.style.display = "block";
    confirmModal.setAttribute("data-id", id);
  },

  showESDModal(id) {
    const esdModal = document.getElementById("esdModal");
    esdModal.style.display = "block";
    esdModal.setAttribute("data-id", id);
  }
};
