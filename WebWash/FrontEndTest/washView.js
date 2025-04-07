import { getAllWashes,getAllWashHistory } from "./washModel.js";
import { openEditWash, confirmDeleteWash,shiftWashDate,checkAndUpdateWashStatus } from "./washController.js";
import {} from "./washUtils.js";
// ✅ ฟังก์ชัน renderWashTable แบบรับข้อมูลจากภายนอก
export async function renderWashTable(allWashes = [], page = 1, rowsPerPage = 10) {
  const searchInput =
    document.getElementById("searchInput")?.value.toLowerCase() || "";
  const statusFilter = document.getElementById("filterStatus")?.value || "";

  // กรองข้อมูลจาก search และ filter
  const filtered = allWashes.filter((w) => {
    const searchMatch =
      w.washId?.toLowerCase().includes(searchInput) ||
      w.empId?.toLowerCase().includes(searchInput) ||
      w.empName?.toLowerCase().includes(searchInput);

    const statusMatch = statusFilter ? w.status === statusFilter : true;
    return searchMatch && statusMatch;
  });

  // แบ่งหน้า
  const startIndex = (page - 1) * rowsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);

  const tableBody = document.getElementById("washTableBody");
  tableBody.innerHTML = "";

  if (paginated.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">🚫 No data found</td></tr>`;
    return;
  }

  // ใช้ Promise.all เพื่อรอ update status ทั้งหมด ก่อน render
  const updatedWashes = await Promise.all(
    paginated.map((wash) => checkAndUpdateWashStatus(wash))
  );

  // render แถว
  updatedWashes.forEach((w) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${w.washId || "-"}</td>
      <td>${w.empName || "-"}<br><small>${w.empId || ""}</small></td>
      <td>${w.uniformCode || "-"}</td>
      <td>${w.color || "-"}</td>
      <td><span class="status ${getStatusClass(w.status)}">${w.status}</span></td>
      <td class="actions">
        <button class="delete" data-id="${w.id}">Delete</button>
        <button class="shift-date" data-id="${w.washId}">🕒</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // ปุ่มลบ
  tableBody.querySelectorAll(".delete").forEach((btn) =>
    btn.addEventListener("click", (e) =>
      confirmDeleteWash(e.target.dataset.id)
    )
  );

  // ปุ่มขยับวัน
  tableBody.querySelectorAll(".shift-date").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const washId = e.target.dataset.id;
      const days = parseInt(prompt("📅 ขยับกี่วัน? เช่น 1 หรือ -2"));
      if (isNaN(days)) return;
      await shiftWashDate(washId, days);
    })
  );

  // pagination
  renderPagination(filtered.length, page, rowsPerPage, (newPage) => {
    renderWashTable(allWashes, newPage, rowsPerPage);
  });
}

// ฟังก์ชันสำหรับ mapping สถานะ → CSS class
export function getStatusClass(status) {
  switch (status) {
    case "Waiting to Send":
    case "Waiting Rewash #1":
    case "Waiting Rewash #2":
      return "waiting";
    case "Washing":
    case "Washing #1":
      return "washing";
    case "Completed":
      return "completed";
    case "Scrap":
      return "scrap";
    default:
      return "";
  }
}

// ✅ สร้างปุ่ม pagination สำหรับตารางหลัก
export function renderPagination(totalItems, currentPage, rowsPerPage) {
  const pagination = document.getElementById("pagination");
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");

    btn.addEventListener("click", () => renderWashTable(i, rowsPerPage));
    pagination.appendChild(btn);
  }
}

// ✅ แสดงข้อมูลในตารางประวัติการซัก
export function renderWashHistory(data, currentPage = 1, rowsPerPage = 5) {
  const tbody = document.getElementById("historyTableBody");
  const pag = document.getElementById("historyPagination");

  tbody.innerHTML = "";
  pag.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const pageData = data.slice(start, start + rowsPerPage);

  if (pageData.length === 0) {
    tbody.innerHTML = `<tr><td colspan='6' style='text-align:center'>No history found</td></tr>`;
    return;
  }

  pageData.forEach((entry) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${entry.washId}</td>
        <td>${entry.uniformCode}</td>
        <td>${entry.empName} (${entry.empId})</td>
        <td>${entry.testResult}</td>
        <td>${entry.testDate}</td>
        <td>${entry.status}</td>
      `;
    tbody.appendChild(tr);
  });

  const totalPages = Math.ceil(data.length / rowsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = i === currentPage ? "active" : "";
    btn.onclick = () => renderWashHistory(data, i, rowsPerPage);
    pag.appendChild(btn);
  }
}

// ✅ แสดงยอดรวมใน dashboard
export async function renderWashSummary() {
  const summaryData = await getWashSummaryData();  // ดึงข้อมูลสรุปจากฐานข้อมูล

  const { total, waiting, washing, completed, rewash, scrap, history } = summaryData;

  document.getElementById("sumTotal").textContent = total;
  document.getElementById("sumWaiting").textContent = waiting;
  document.getElementById("sumWashing").textContent = washing;
  document.getElementById("sumCompleted").textContent = completed;
  document.getElementById("sumRewash").textContent = rewash;
  document.getElementById("sumScrap").textContent = scrap;
  document.getElementById("sumHistory").textContent = history;
}

async function getWashSummaryData() {
  const allWashes = await getAllWashes();
  const total = allWashes.length;
  const waiting = allWashes.filter(w => w.status === "Waiting to Send").length;
  const washing = allWashes.filter(w => w.status === "Washing").length;
  const completed = allWashes.filter(w => w.status === "Completed").length;
  const rewash = allWashes.filter(w => w.status.includes("Rewash")).length;
  const scrap = allWashes.filter(w => w.status === "Scrap").length;
  const history = await getAllWashHistory();

  return { total, waiting, washing, completed, rewash, scrap, history: history.length };
}
