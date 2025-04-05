function toggleModal(show) {
  const modal = document.getElementById("Modal");
  modal.style.display = show ? "flex" : "none";
  if (!show) clearForm();
}

function fillFormWithData(data) {
  // เติมค่าฟอร์มด้วยข้อมูลที่ดึงมา
  document.getElementById("washId").value = data.washId || '';
  document.getElementById("employeeId").value = data.employeeId || '';
  document.getElementById("uniformCode").value = data.uniformCode || '';
  // และส่วนอื่นๆ ที่จำเป็น
}

function renderWashTable(data) {
  const tbody = document.getElementById("washTableBody");
  tbody.innerHTML = ""; // เคลียร์ข้อมูลเก่าออก

  data.forEach(wash => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${wash.washId}</td>
      <td>${wash.employeeId}</td>
      <td>${wash.uniformCode}</td>
      <td>${wash.status}</td>
      <td><button onclick="editWash('${wash.washId}')">Edit</button></td>
    `;
    tbody.appendChild(row);
  });
}

function renderWashHistoryTable(data) {
  const tableBody = document.getElementById("historyTableBody");
  tableBody.innerHTML = ""; // เคลียร์ข้อมูลเก่าออก

  data.forEach(history => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${history.washId}</td>
      <td>${history.employeeId}</td>
      <td>${history.status}</td>
      <td>${history.date}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderHistoryPagination(totalPages, currentPage) {
  const pagination = document.getElementById("historyPagination");
  pagination.innerHTML = ""; // เคลียร์ข้อมูลเก่าออก

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.innerText = i;
    pageButton.addEventListener("click", () => {
      loadHistoryPage(i); // ฟังก์ชันที่ใช้โหลดหน้าที่เลือก
    });

    if (i === currentPage) {
      pageButton.disabled = true; // กำหนดให้ปุ่มหน้าปัจจุบันไม่สามารถคลิกได้
    }

    pagination.appendChild(pageButton);
  }
}

function renderSummary(summary) {
  document.getElementById("totalWashes").innerText = summary.totalWashes;
  document.getElementById("completedWashes").innerText = summary.completedWashes;
  document.getElementById("totalHistory").innerText = summary.totalHistory;
  document.getElementById("totalFailedESD").innerText = summary.totalFailedESD;
}

function renderColorDropdown(colors) {
  const colorSelect = document.querySelector("#color");
  colorSelect.innerHTML = ""; // เคลียร์ dropdown ก่อน

  // เพิ่มตัวเลือกให้กับ dropdown
  colors.forEach(color => {
    const option = document.createElement("option");
    option.value = color;
    option.innerText = color;
    colorSelect.appendChild(option);
  });
}

function clearFormFields() {
  const colorSelect = document.querySelector("#color");
  const otherFields = document.querySelectorAll(".form-field"); // สมมติว่า .form-field คือคลาสของฟิลด์อื่นๆ ในฟอร์ม

  colorSelect.value = "";
  
  otherFields.forEach(field => {
    field.value = "";
  });
}

async function renderPagination(totalItems, current, perPage) {
  // แสดงปุ่ม First, Prev, 1..n, Next, Last
}
