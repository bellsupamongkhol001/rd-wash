// js/washController.js
import * as Model from "./washModel.js";
import * as View from "./washView.js";

let allWashJobs = []; // เก็บข้อมูลทั้งหมดเพื่อกรอง/ค้นหา
let historyData = []; // เก็บข้อมูลประวัติการซัก
let currentPage = 1;
const itemsPerPage = 10;
let currentESDWash = null;

async function initWashPage() {
  allWashJobs = await Model.getAllWashJobs();
  View.renderWashTable(allWashJobs);
  renderSummary(allWashJobs);

  View.bindUIEvents({
    onAdd: openAddModal,
    onEdit: openEditModal,
    onDelete: handleDeleteWash,
    onSubmit: handleSubmitWash,
    onSearch: handleSearchOrFilter,
    onFilter: handleSearchOrFilter,
  });
}

// ✅ สรุปจำนวนสถานะทั้งหมด
function renderSummary(data) {
  const summary = {
    total: data.length,
    waiting: data.filter((d) => d.status === "waiting").length,
    washing: data.filter((d) => d.status === "washing").length,
    completed: data.filter((d) => d.status === "completed").length,
    rewash: data.filter((d) => d.status === "rewash").length,
    scrap: data.filter((d) => d.status === "scrap").length,
    history: 0, // เผื่อไว้ใช้นับจาก washHistory ในอนาคต
  };
  View.renderSummaryCard(summary);
}

// ✅ เปิด modal เพิ่ม
function openAddModal() {
  View.showWashForm(); // ไม่มีค่า → เพิ่มใหม่
}

// ✅ เปิด modal แก้ไข
function openEditModal(wash) {
  View.showWashForm(wash);
}

// ✅ บันทึกข้อมูล (ทั้งเพิ่ม/แก้ไข)
async function handleSubmitWash(formData) {
  // ตรวจว่าเป็นเพิ่มหรือลบ
  if (!formData.washID) {
    // สร้างรหัสใหม่อัตโนมัติ
    const newId = await Model.generateWashId();
    formData.washID = newId;
    formData.status = "waiting";
    formData.rewashCount = 0;
    await Model.addWashJob(formData);
  } else {
    await Model.updateWashJob(formData.washID, formData);
  }

  await refreshTable();
  View.closeWashForm();
}

// ✅ ลบงานซัก
async function handleDeleteWash(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this wash job?"
  );
  if (confirmDelete) {
    await Model.deleteWashJob(id);
    await refreshTable();
  }
}

// ✅ โหลดข้อมูลใหม่
async function refreshTable() {
  const data = await Model.getAllWashJobs();
  View.renderWashTable(data);
  renderSummary(data);
}

// ✅ เริ่มโหลดเมื่อเปิดหน้า
initWashPage();

function handleSearchOrFilter() {
  const query = document.getElementById("searchWashjobs").value.toLowerCase();
  const filter = document.getElementById("filterStatusWashjobs").value;

  const filtered = allWashJobs.filter((job) => {
    const matchSearch =
      job.empID?.toLowerCase().includes(query) ||
      job.UniCode?.toLowerCase().includes(query);

    const matchStatus =
      filter === "All" || job.status?.toLowerCase() === filter.toLowerCase();

    return matchSearch && matchStatus;
  });

  View.renderWashTable(filtered);
}

// ✅ เรียก modal เพิ่ม
function openAddModal() {
  View.showAddModal();
}

// ✅ แสดง modal แก้ไข
function openEditModal(wash) {
  View.showEditModal(wash);
}

// ✅ กด Confirm ใน Add Modal
window.handleAddWash = async function () {
  const data = {
    washID: await Model.generateWashId(),
    UniCode: document.getElementById("addUniformCode").value,
    UniName: document.getElementById("addUniformName").value,
    UniSize: document.getElementById("addSize").value,
    UniColor: document.getElementById("addColor").value,
    empID: document
      .getElementById("addEmpId")
      .textContent.replace("EMPID: ", ""),
    empName: document
      .getElementById("addEmpName")
      .textContent.replace("Name: ", ""),
    empDepartment: document
      .getElementById("addEmpDept")
      .textContent.replace("Department: ", ""),
    qty: 1,
    status: "waiting",
    rewashCount: 0,
  };

  await Model.addWashJob(data);
  View.closeModal("addWashModal");
  await refreshTable();
};

// ✅ กด Save ใน Edit Modal
window.handleEditWash = async function () {
  const washId = document.getElementById("editWashModal").dataset.washId;

  const updateData = {
    UniCode: document.getElementById("editUniformCode").value,
    UniName: document.getElementById("editUniformName").value,
    UniSize: document.getElementById("editSize").value,
    UniColor: document.getElementById("editColor").value,
    qty: 1,
  };

  await Model.updateWashJob(washId, updateData);
  View.closeModal("editWashModal");
  await refreshTable();
};

// ✅ ปิด Modal ใช้งานได้แล้วจาก HTML
window.closeModal = View.closeModal;

// ✅ เมื่อกดปุ่ม ESD บนแต่ละแถว
function handleESDTest(wash) {
  currentESDWash = wash;
  document.getElementById("esdUniCode").textContent = wash.UniCode || "-";
  document.getElementById("esdModal").style.display = "block";
}
window.handleESDResult = async function (result) {
  const wash = currentESDWash;
  closeModal("esdModal");

  if (!wash) return;

  if (result === "PASS") {
    // ✅ ผ่าน → คืน stock ก่อน
    await Model.returnToStockAfterESD(wash);

    wash.esdResult = "PASS";
    wash.status = "completed";

    await Model.moveToHistory(wash);
    alert("✅ ESD ผ่าน → คืน Stock และย้ายลงประวัติแล้ว");
  } else {
    // ❌ ไม่ผ่าน → เพิ่ม rewashCount
    const count = (wash.rewashCount || 0) + 1;

    if (count >= 3) {
      wash.status = "scrap";
      wash.rewashCount = count;
      wash.esdResult = "NG";
      await Model.updateWashJob(wash.id, wash);
      alert("❌ ไม่ผ่าน 3 ครั้ง → Scrap แล้ว");
    } else {
      wash.status = "rewash";
      wash.rewashCount = count;
      wash.esdResult = "NG";
      await Model.updateWashJob(wash.id, wash);
      alert(`🔁 ไม่ผ่าน → ส่งกลับซักซ้ำครั้งที่ ${count}`);
    }
  }

  currentESDWash = null;
  await refreshTable();
};

// ✅ กรณีผ่าน → ลบออก / ย้ายไป history
async function processESDPass(washId) {
  // อัปเดต status → completed หรือ archive
  await Model.updateWashJob(washId, { status: "completed" });
  // ✳️ เสริม: ย้ายไป washHistory ได้ในอนาคต
  await refreshTable();
}

// ✅ กรณีไม่ผ่าน → เพิ่ม rewashCount หรือ scrap
async function processESDFail(wash) {
  let newCount = (wash.rewashCount || 0) + 1;

  if (newCount >= 3) {
    await Model.updateWashJob(wash.id, {
      status: "scrap",
      rewashCount: newCount,
    });
    alert(`❌ ESD ไม่ผ่าน 3 ครั้ง → ชุดนี้ถูก Scrap แล้ว`);
  } else {
    await Model.updateWashJob(wash.id, {
      status: "rewash",
      rewashCount: newCount,
    });
    alert(`🔁 ESD ไม่ผ่าน → ส่งกลับซักซ้ำ (ครั้งที่ ${newCount})`);
  }

  await refreshTable();
}

window.exportWashTableToCSV = function () {
  const rows = document.querySelectorAll("#washTableBody tr");
  if (rows.length === 0) return alert("No data to export!");

  let csv = "WashID,UniformCode,EmpID,Name,Color,Qty,Status,RewashCount\n";

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const data = [
      cells[0]?.textContent.trim(), // WashID
      cells[1]?.textContent.trim(), // UniformCode
      cells[2]?.textContent.trim(), // EmpID
      cells[3]?.textContent.trim(), // Name
      cells[4]?.textContent.trim(), // Color
      cells[5]?.textContent.trim(), // Qty
      cells[6]?.textContent.trim(), // Status
      // ถ้ามี RewashCount เพิ่มอีกคอลัมน์
      findRewashFromStatus(cells[6]?.textContent.trim()) || "0",
    ];
    csv += data.join(",") + "\n";
  });

  downloadCSV(csv, "wash-jobs.csv");
};

// แยกจำนวนนับจากคำว่า Rewash
function findRewashFromStatus(statusText) {
  const match = statusText.match(/Rewash\s*#?(\d)/i);
  return match ? match[1] : "0";
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  link.click();
}

async function processESDPass(washId) {
  const wash = await Model.getWashById(washId);
  wash.id = washId;

  const confirmMove = confirm("ยืนยันเก็บเข้าประวัติและลบออกจากหน้าหลัก?");
  if (confirmMove) {
    await Model.moveToHistory(wash);
    alert("📖 ย้ายไปประวัติแล้วเรียบร้อย");
  }

  await refreshTable();
}

async function loadHistoryTable() {
  historyData = await Model.getWashHistory();
  View.renderHistoryTable(historyData);
  View.bindHistoryEvents({ onSearchHistory: handleFilterHistory });
}

function handleFilterHistory() {
    const keyword = document.getElementById("searchHistory").value.toLowerCase();
    const esdFilter = document.getElementById("filterStatusHistory").value.toLowerCase();
    const start = document.getElementById("historyStartDate").value;
    const end = document.getElementById("historyEndDate").value;
    const range = document.getElementById("reportRange").value;
  
    const now = new Date();
    let startRange = null;
    let endRange = null;
  
    if (range === "today") {
      startRange = new Date(now.setHours(0, 0, 0, 0));
      endRange = new Date();
    } else if (range === "thisWeek") {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      startRange = new Date(firstDay.setHours(0, 0, 0, 0));
      endRange = new Date();
    } else if (range === "thisMonth") {
      startRange = new Date(now.getFullYear(), now.getMonth(), 1);
      endRange = new Date();
    } else if (range === "lastMonth") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startRange = lastMonth;
      endRange = new Date(now.getFullYear(), now.getMonth(), 0);
    }
  
    const filtered = historyData.filter(record => {
      const matchSearch =
        record.empID?.toLowerCase().includes(keyword) ||
        record.UniCode?.toLowerCase().includes(keyword);
  
      const matchStatus =
        esdFilter === "all" || (record.esdResult?.toLowerCase() === esdFilter);
  
      const moved = record.movedAt ? new Date(record.movedAt) : null;
      const matchDate =
        (!start || moved >= new Date(start)) &&
        (!end || moved <= new Date(end + "T23:59:59")) &&
        (!startRange || moved >= startRange) &&
        (!endRange || moved <= endRange);
  
      return matchSearch && matchStatus && matchDate;
    });
  
    currentPage = 1;
    View.renderHistorySummary?.(filtered); // หากมี dashboard
    renderPaginatedHistory(filtered);
  }

// ✅ เรียกตอนเปิดหน้า
initWashPage().then(loadHistoryTable);

window.exportHistoryToCSV = function () {
  const rows = document.querySelectorAll("#historyTableBody tr");
  if (rows.length === 0) {
    alert("No data to export.");
    return;
  }

  // ✅ หัวตาราง
  let csv = "WashID,UniformCode,Employee,ESD Result,Date,Status\n";

  // ✅ แปลงทุกแถวในตารางเป็นบรรทัด CSV
  rows.forEach((row) => {
    const cols = row.querySelectorAll("td");
    const values = Array.from(cols).map((td) => td.textContent.trim());
    csv += values.join(",") + "\n";
  });

  // ✅ ดาวน์โหลด
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", "wash-history.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function renderPaginatedHistory(data) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  View.renderHistoryTable(paginatedData);
  View.renderHistoryPagination(data.length, currentPage, (page) => {
    currentPage = page;
    renderPaginatedHistory(data);
  });
}

async function loadHistoryTable() {
  historyData = await Model.getWashHistory();
  handleFilterHistory(); // เรียกทันทีพร้อม paginate
  View.bindHistoryEvents({ onSearchHistory: handleFilterHistory });
}

window.exportHistoryToPDF = function () {
  const table = document.querySelector("#historyTableBody");
  if (!table || table.rows.length === 0) {
    alert("ไม่มีข้อมูลที่จะแปลงเป็น PDF");
    return;
  }

  // ✅ สร้าง HTML รายงาน (รวม header + ตาราง)
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
      <h3 style="text-align: center;">📄 Wash History Report</h3>
      <p style="text-align: center;">วันที่ออกรายงาน: ${new Date().toLocaleString()}</p>
      <table border="1" cellspacing="0" cellpadding="4" style="width: 100%; font-size: 12px;">
        <thead>
          <tr>
            <th>WashID</th>
            <th>Uniform Code</th>
            <th>Employee</th>
            <th>ESD Result</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from(table.rows)
            .map(
              (row) => `
            <tr>
              ${Array.from(row.cells)
                .map((cell) => `<td>${cell.textContent}</td>`)
                .join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

  // ✅ แปลง HTML → PDF
  const opt = {
    margin: 0.5,
    filename: `wash-history-${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };

  html2pdf().from(wrapper).set(opt).save();
};

window.closeModal = function (modalId) {
  document.getElementById(modalId).style.display = "none";
};

window.archiveAllCompleted = async function () {
    const confirm = window.confirm("คุณต้องการ Archive งานซักที่ 'completed' ทั้งหมดหรือไม่?");
    if (!confirm) return;
  
    const all = await Model.getAllWashJobs(); // ดึงทั้งหมด
    const completed = all.filter(w => w.status === "completed");
  
    if (completed.length === 0) return alert("ไม่มีรายการที่อยู่ในสถานะ 'completed'");
  
    for (const wash of completed) {
      wash.esdResult = "PASS";
      wash.movedAt = new Date().toISOString();
      await Model.moveToHistory(wash); // ย้ายไป history และลบออก
    }
  
    alert(`✅ ย้ายแล้วทั้งหมด ${completed.length} รายการ`);
    await refreshTable();
  };