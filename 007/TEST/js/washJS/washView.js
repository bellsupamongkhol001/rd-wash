let handlers = {}; // จะรับฟังก์ชันจาก controller มา bind ทีหลัง

// l✅ ฟังก์ชันแสดงตารางรายการซัก
export function renderWashTable(washList) {
  const tableBody = document.getElementById("washTableBody");
  tableBody.innerHTML = "";

  washList.forEach((wash, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${wash.washID || "-"}</td>
      <td>${wash.UniCode || "-"}</td>
      <td>${wash.empID || "-"}</td>
      <td>${wash.empName || "-"}</td>   
      <td>${wash.UniColor || "-"}</td>
      <td>${wash.qty || 1}</td>
      <td><span class="badge status-${wash.status}">${wash.status}</span></td>
      <td>
                                <button class="btn-esd" data-id="${
                                  wash.id
                                }">🧪</button>
    <button class="btn-edit" data-id="${wash.id}">✏️</button>
  <button class="btn-delete" data-id="${wash.id}">🗑️</button>
</td>
    `;

    // ผูก event ปุ่ม
    row
      .querySelector(".btn-edit")
      .addEventListener("click", () => handlers.onEdit?.(wash));
    row
      .querySelector(".btn-delete")
      .addEventListener("click", () => handlers.onDelete?.(wash.id));

    tableBody.appendChild(row);
  });
}

// ✅ แสดงฟอร์มเพิ่ม/แก้ไข
export function showWashForm(data = {}) {
  document.getElementById("washFormModal").style.display = "block";

  // ใส่ค่าในฟอร์ม (หากมี)
  document.getElementById("formWashID").value = data.washID || "";
  document.getElementById("formUniCode").value = data.UniCode || "";
  document.getElementById("formEmpID").value = data.empID || "";
  document.getElementById("formQty").value = data.qty || 1;
}

// ✅ ปิด modal form
export function closeWashForm() {
  document.getElementById("washFormModal").style.display = "none";
}

// ✅ แสดงสรุป Dashboard
export function renderSummaryCard(summary) {
  document.getElementById("summaryTotal").textContent = summary.total || 0;
  document.getElementById("summaryWaiting").textContent = summary.waiting || 0;
  document.getElementById("summaryWashing").textContent = summary.washing || 0;
  document.getElementById("summaryCompleted").textContent =
    summary.completed || 0;
}

// ✅ ผูกปุ่มและอีเวนต์ให้ Controller
export function bindUIEvents(h) {
  handlers = h;

  document
    .getElementById("btnAddWash")
    .addEventListener("click", () => handlers.onAdd?.());

  document.getElementById("washForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = {
      washID: document.getElementById("formWashID").value,
      UniCode: document.getElementById("formUniCode").value,
      empID: document.getElementById("formEmpID").value,
      qty: Number(document.getElementById("formQty").value),
    };

    handlers.onSubmit?.(formData);
  });

  document
    .getElementById("btnCancelForm")
    .addEventListener("click", closeWashForm);
  document
    .getElementById("searchWashjobs")
    ?.addEventListener("input", debounce(h.onSearch, 300));
  document
    .getElementById("filterStatusWashjobs")
    ?.addEventListener("change", h.onFilter);

  row
    .querySelector(".btn-esd")
    ?.addEventListener("click", () => handlers.onESDTest?.(wash));
  document
    .getElementById("searchWashjobs")
    ?.addEventListener("input", debounce(h.onSearch, 300));
  document
    .getElementById("filterStatusWashjobs")
    ?.addEventListener("change", h.onFilter);
  document
    .getElementById("searchHistory")
    ?.addEventListener("input", debounce(handlers.onSearchHistory, 300));
  document
    .getElementById("filterStatusHistory")
    ?.addEventListener("change", handlers.onSearchHistory);
  document
    .getElementById("historyStartDate")
    ?.addEventListener("change", handlers.onSearchHistory);
  document
    .getElementById("historyEndDate")
    ?.addEventListener("change", handlers.onSearchHistory);
  document
    .getElementById("reportRange")
    ?.addEventListener("change", handlers.onSearchHistory);
}

// ✅ Debounce Utility (ไว้ใน washView.js)
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// แสดง Modal เพิ่ม
export function showAddModal() {
  document.getElementById("addWashModal").style.display = "block";
}

// แสดง Modal แก้ไข
export function showEditModal(wash) {
  document.getElementById("editWashModal").style.display = "block";

  document.getElementById("editUniformCode").value = wash.UniCode || "";
  document.getElementById("editUniformName").value = wash.UniName || "";
  document.getElementById("editSize").value = wash.UniSize || "";
  document.getElementById("editColor").value = wash.UniColor || "";
  document.getElementById("editEmpId").textContent = `EMPID: ${
    wash.empID || "-"
  }`;
  document.getElementById("editEmpName").textContent = `Name: ${
    wash.empName || "-"
  }`;
  document.getElementById("editEmpDept").textContent = `Department: ${
    wash.empDepartment || "-"
  }`;

  // เก็บค่าไว้ให้ Controller ดึง later
  document.getElementById("editWashModal").dataset.washId = wash.id;
}

// ปิด Modal
export function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

export function renderHistoryTable(historyList) {
  const tbody = document.getElementById("historyTableBody");
  tbody.innerHTML = "";

  historyList.forEach((history) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${history.washID || "-"}</td>
        <td>${history.UniCode || "-"}</td>
        <td>${history.empName || "-"}</td>
        <td>${history.esdResult || "PASS"}</td>
        <td>${formatDate(history.movedAt)}</td>
        <td>${history.status || "-"}</td>
      `;
    tbody.appendChild(row);
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB");
}

export function bindHistoryEvents(handlers) {
  document
    .getElementById("searchHistory")
    ?.addEventListener("input", debounce(handlers.onSearchHistory, 300));
  document
    .getElementById("filterStatusHistory")
    ?.addEventListener("change", handlers.onSearchHistory);
}

export function renderHistoryPagination(totalItems, currentPage, onPageChange) {
  const container = document.getElementById("historyPagination");
  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / 10);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "page-btn active" : "page-btn";
    btn.addEventListener("click", () => onPageChange(i));
    container.appendChild(btn);
  }
}
