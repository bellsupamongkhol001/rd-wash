import { getStatusClass } from "../Utility/washUtil.js";
import { calculateStatusFromDate } from "../Utility/dateUtil.js";
/**
 * เปิด Modal ที่มี ID ตรงกับที่กำหนด
 * @param {string} modalId - ID ของ modal ที่ต้องการเปิด (เช่น 'addWashModal')
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error(`❌ ไม่พบ modal ที่มี ID: ${modalId}`);
    return;
  }

  modal.style.display = "flex"; // ใช้ flex เพื่อจัดให้อยู่กลางจอ
  modal.classList.add("fade-in"); // เพิ่ม animation (ต้องมีใน CSS)

  // ปิด modal เมื่อคลิกพื้นหลัง (outside modal)
  modal.addEventListener("click", function handleOutsideClick(e) {
    if (e.target === modal) {
      closeModal(modalId); // เรียกจาก controller
      modal.removeEventListener("click", handleOutsideClick); // cleanup
    }
  });
}

/**
 * ปิด Modal ที่มี ID ตรงกับที่กำหนด
 * @param {string} modalId
 */
export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("fade-in");
  }
}

export function resetAddForm() {
  document.getElementById("addUniformCode").value = "";
  document.getElementById("addUniformName").value = "";
  document.getElementById("addSize").value = "";
  document.getElementById("addColor").selectedIndex = 0;

  // รีเซ็ต employee preview
  document.getElementById("addEmpPhoto").src =
    "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg";
  document.getElementById("addEmpId").textContent = "EMPID: -";
  document.getElementById("addEmpName").textContent = "Name: -";
  document.getElementById("addEmpDept").textContent = "Department: -";
}

export function showToast(message) {
  alert(message);
}

/**
 * แสดงตาราง Wash Jobs ลงใน #washTableBody
 * @param {Array} data - Array ของรายการซัก
 */
export function renderWashTable(data = []) {
  const tbody = document.getElementById("washTableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `<td colspan="8">🚫 No Wash Jobs Found</td>`;
    tbody.appendChild(emptyRow);
    return;
  }

  data.forEach((wash) => {
    const created = wash.createdAt?.toDate
      ? wash.createdAt.toDate()
      : new Date(wash.createdAt || Date.now());
    const actualStatus = calculateStatusFromDate(created);
    const row = document.createElement("tr");

    let actionButtons = `
    <button class="btn btn-sm btn-view" onclick="openViewWash('${wash.id}')">👁️</button>
    <button class="btn btn-sm btn-danger" onclick="deleteWash('${wash.id}')">🗑</button>
  `;

    if (actualStatus === "Completed") {
      actionButtons += `
      <button class="btn btn-sm btn-success" onclick="openESDModal('${wash.id}')">🧪</button>
    `;
    }

    actionButtons += `
    <button class="btn btn-sm btn-light" onclick="shiftWashDate('${wash.id}', 1)">⏩</button>
    <button class="btn btn-sm btn-light" onclick="shiftWashDate('${wash.id}', -1)">⏪</button>
  `;

    row.innerHTML = `
      <td>${wash.washId || "-"}</td>
      <td>${wash.uniformCode || "-"}</td>
      <td>(${wash.empId || "-"}) / ${wash.empName || "-"}</td>
      <td>${wash.color || "-"}</td>
      <td>${wash.qty || "-"}</td>
      <td>
          <span class="status ${getStatusClass(actualStatus)}">
            ${actualStatus}
          </span>
        </td>
      <td>${actionButtons}</td>
    `;

    tbody.appendChild(row);
  });
}

/*สำหรับเทส */
document.addEventListener("DOMContentLoaded", () => {
  const btnAddWash = document.getElementById("btnAddWash");
  if (btnAddWash) {
    btnAddWash.addEventListener("click", () => openModal("addWashModal"));
  }
});
