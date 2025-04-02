const WashController = {
  async init() {
    this.bindEvents();
    const data = await dbUtils.getAll(STORE_NAME);
    washView.renderTable(data);
    washView.updateSummary(data);
  },

  bindEvents() {
    // ตรวจสอบว่าปุ่ม addBtn มีอยู่หรือไม่
    const addBtn = document.getElementById("addBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        washView.clearForm();
        washView.toggleModal(true);
      });
    } else {
      console.error("addBtn element not found!");
    }

    // ตรวจสอบว่า saveBtn มีอยู่ใน HTML หรือไม่
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => this.saveWash());
    } else {
      console.error("saveBtn element not found!");
    }

    // ตรวจสอบการคลิกในตาราง
    const tableBody = document.getElementById("washTableBody");
    if (tableBody) {
      tableBody.addEventListener("click", (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains("edit")) {
          this.editWash(id);
        } else if (e.target.classList.contains("delete")) {
          washView.showDeleteModal(id);
        }
      });
    } else {
      console.error("washTableBody element not found!");
    }

    // ตรวจสอบการคลิกปุ่มลบ
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", () => {
        const id = document.getElementById("confirmDeleteModal").getAttribute("data-id");
        this.deleteWash(id);
      });
    } else {
      console.error("confirmDeleteBtn element not found!");
    }

    // ตรวจสอบการคลิกปุ่มยกเลิกการลบ
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener("click", () => {
        document.getElementById("confirmDeleteModal").style.display = "none";
      });
    } else {
      console.error("cancelDeleteBtn element not found!");
    }
  },

  async saveWash() {
    const id = document.getElementById("washId").value || `wash-${Date.now()}`;
    const employeeId = document.getElementById("employeeId").value;
    const employeeName = document.getElementById("employeeName").value;
    const uniformCode = document.getElementById("uniformCode").value;
    const qty = document.getElementById("qty").value;
    const status = "กำลังรอส่งซัก";
    const createDate = new Date().toISOString();

    const data = { washId: id, employeeId, employeeName, uniformCode, qty, status, createDate };
    await dbUtils.put(STORE_NAME, data);
    const updated = await dbUtils.getAll(STORE_NAME);
    washView.renderTable(updated);
    washView.updateSummary(updated);
    washView.toggleModal(false);
  },

  async editWash(id) {
    const data = await dbUtils.getById(STORE_NAME, id);
    if (data) {
      washView.fillForm({ ...data, washId: id });
      washView.toggleModal(true);
    }
  },

  async deleteWash(id) {
    await dbUtils.remove(STORE_NAME, id);
    const updated = await dbUtils.getAll(STORE_NAME);
    washView.renderTable(updated);
    washView.updateSummary(updated);
    document.getElementById("confirmDeleteModal").style.display = "none";
  }
};

// Start controller after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => WashController.init());