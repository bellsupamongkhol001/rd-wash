async function initWashPage() {
  try {
    console.log("🚀 กำลังเริ่มโหลดหน้าระบบซักผ้า...");

    setupListeners();       // 🧩 1. ติดตั้ง event listeners สำหรับ input ต่างๆ
    await renderTable();    // 📊 2. แสดงข้อมูลตารางหลัก (washJobs)
    await renderHistory();  // 🧾 3. แสดงประวัติการทดสอบ ESD (washHistory)
    await updateSummary();  // 📌 4. อัปเดตสรุปตัวเลขใน dashboard

    console.log("✅ โหลดข้อมูลทั้งหมดเรียบร้อยแล้ว");
  } catch (error) {
    console.error("❌ ล้มเหลวในการเริ่มต้นหน้า Wash:", error);
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณารีเฟรชหน้าหรือเช็คการเชื่อมต่อ");
  }
}

async function openForm(id = null) {
  clearForm();

  document.getElementById("modalTitle").innerText = id ? "Edit Wash" : "Add Wash";

  if (id) {
    const data = await fetchWashById(id);
    if (data) {
      fillFormWithData(data); // เติมข้อมูลในฟอร์ม
    } else {
      alert("⚠️ ไม่พบข้อมูลที่ต้องการแก้ไข");
    }
  }

  toggleModal(true);
}

function setupSearchListeners() {
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(renderTable, 300));
  }
}

function setupFilterListeners() {
  const filterStatus = document.getElementById("filterStatus");
  if (filterStatus) {
    filterStatus.addEventListener("change", renderTable);
  }
}

function setupFormListeners() {
  const uniformCodeInput = document.getElementById("uniformCode");
  if (uniformCodeInput) {
    uniformCodeInput.addEventListener("input", debounce(autofillUniformInfo, 300));
  }

  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveWash);
  }

  const colorInput = document.getElementById("color");
  if (colorInput) {
    colorInput.addEventListener("change", fetchEmployeeByColor);
  }
}

function setupModalListeners() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleModal(false);
  });
}

function setupListeners() {
  setupSearchListeners();
  setupFilterListeners();
  setupFormListeners();
  setupModalListeners();
}

async function renderTable() {
  try {
    const data = await fetchAndFilterWashData();
    updateStatusIfNeeded(data);  // คำนวณสถานะหากจำเป็น
    renderWashTable(data); // แสดงข้อมูลในตาราง
  } catch (error) {
    console.error("❌ Error rendering table:", error);
  }
}

async function renderHistory(page = 1, pageSize = 10) {
  try {
    // ดึงข้อมูลและกรอง
    const historyData = await fetchWashHistory();

    // จัดเรียงข้อมูล
    const sortedData = sortWashHistory(historyData);

    // ตัดข้อมูลออกตามหน้า
    const startIndex = (page - 1) * pageSize;
    const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

    // แสดงข้อมูลในตาราง
    renderWashHistoryTable(paginatedData);

    // คำนวณจำนวนหน้าทั้งหมด
    const totalPages = Math.ceil(sortedData.length / pageSize);

    // แสดงปุ่ม pagination
    renderHistoryPagination(totalPages, page);
  } catch (error) {
    console.error("❌ Error rendering history:", error);
  }
}

async function updateSummary() {
  try {
    // ดึงข้อมูลที่จำเป็น
    const data = await fetchSummaryData();

    // คำนวณสรุปข้อมูล
    const summary = calculateWashSummary(data);

    // แสดงผลใน UI
    renderSummary(summary);
  } catch (error) {
    console.error("❌ Error updating summary:", error);
  }
}

async function autofillUniformInfo() {
  const code = document.querySelector("#uniformCode")?.value.trim();
  
  if (!code) {
    clearFormFields(); // ล้างฟอร์มถ้าไม่มีรหัสชุด
    return;
  }

  const colors = await fetchColorsByUniformCode(code);

  if (colors.length === 0) {
    clearFormFields(); // ถ้าไม่พบชุด ให้ล้างฟอร์ม
  } else {
    renderColorDropdown(colors); // แสดงสีใน dropdown
  }
}
