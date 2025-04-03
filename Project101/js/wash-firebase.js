// ==================== Firebase Setup ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyAvJ4SgGaazPf6mY4G5-QfWcX2Yhkg-1X0",
  authDomain: "rd-wash-v2.firebaseapp.com",
  projectId: "rd-wash-v2",
  storageBucket: "rd-wash-v2.firebasestorage.app",
  messagingSenderId: "553662948172",
  appId: "1:553662948172:web:2423d7a81f2bbc9d53a5e9",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTIONS = {
  WASHES: "washJobs",
  EMPLOYEES: "employees",
  UNIFORMS: "uniformCodes",
};

async function getUniformByCode(code) {
  try {
    console.log("🔍 กำลังค้นหา uniformCode:", code);
    const uniformQuery = query(
      collection(db, COLLECTIONS.UNIFORMS),
      where("uniformCode", "==", code)
    );
    const snapshot = await getDocs(uniformQuery);

    if (snapshot.empty) {
      console.warn("⚠️ ไม่พบชุดยูนิฟอร์มที่ตรงกับรหัส:", code);
      return [];
    }

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการค้นหาข้อมูล:", error);
    return [];
  }
}

async function getOwnerByUniformCode(code) {
  try {
    const stockQuery = query(
      collection(db, COLLECTIONS.UNIFORMS),
      where("uniformCode", "==", code)
    );

    const snapshot = await getDocs(stockQuery);

    if (snapshot.empty) {
      console.warn("⚠️ ไม่พบเจ้าของชุดยูนิฟอร์มรหัส:", code);
      return [];
    }

    return snapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงเจ้าของชุด:", error);
    return [];
  }
}

async function getEmployeeById(empId) {
  try {
    const empRef = doc(db, COLLECTIONS.EMPLOYEES, empId);
    const empDoc = await getDoc(empRef);
    if (!empDoc.exists()) {
      console.warn(`⚠️ ไม่พบพนักงานรหัส: ${empId}`);
      return null;
    }
    return empDoc.data();
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน:", error);
    return null;
  }
}

async function initWashPage() {
  try {
    console.log("🚀 กำลังเริ่มโหลดหน้าระบบซักผ้า...");
    setupListeners();
    await renderTable();
    await renderHistory();
    await updateSummary();

    console.log("✅ โหลดข้อมูลทั้งหมดเรียบร้อยแล้ว");
  } catch (error) {
    console.error("❌ ล้มเหลวในการเริ่มต้นหน้า Wash:", error);
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณารีเฟรชหน้าหรือเช็คการเชื่อมต่อ");
  }
}
document.addEventListener("DOMContentLoaded", initWashPage);

async function getAll(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("❌ Error getting documents:", error);
    throw error;
  }
}

async function put(collectionName, id, data) {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data);
    console.log(`✅ Document written with ID: ${id}`);
  } catch (error) {
    console.error("❌ Error adding/updating document:", error);
    throw error;
  }
}

async function remove(collectionName, id) {
  try {
    const docRef = doc(db, collectionName, id); // สร้าง reference ไปยัง document ที่ต้องการลบ
    await deleteDoc(docRef); // ลบ document จาก Firestore
    console.log(`✅ Document with ID: ${id} has been deleted.`);
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    throw error;
  }
}

async function getById(collectionName, id) {
  console.log(`📄 Getting document from ${collectionName} with ID: ${id}`);
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    console.warn("⚠️ Document ID not found:", id);
    return null;
  }
  return docSnap.data();
}

function toggleModal(show) {
  const modal = document.getElementById("Modal");
  modal.style.display = show ? "flex" : "none";
  if (!show) clearForm();
}

async function openForm(id = null) {
  clearForm();
  document.getElementById("modalTitle").innerText = id
    ? "Edit Wash"
    : "Add Wash";

  if (id) {
    try {
      const data = await getById(COLLECTIONS.WASHES, id);
      if (data) {
        document.getElementById("editIndex").value = id;
        document.getElementById("empId").value = data.empId;
        document.getElementById("empName").value = data.empName;
        document.getElementById("uniformCode").value = data.uniformCode;
        document.getElementById("qty").value = data.qty;
        document.getElementById("department").value = data.department || "";

        const colorSelect = document.getElementById("color");
        const selectedColor = data.color || "";

        let found = false;
        for (let option of colorSelect.options) {
          if (option.value === selectedColor) {
            found = true;
            break;
          }
        }

        if (!found && selectedColor) {
          const newOption = document.createElement("option");
          newOption.value = selectedColor;
          newOption.textContent = selectedColor;
          colorSelect.appendChild(newOption);
        }

        colorSelect.value = selectedColor;
      } else {
        alert("⚠️ ไม่พบข้อมูลที่ต้องการแก้ไข");
      }
    } catch (error) {
      console.error("❌ Error fetching data for edit:", error);
    }
  }

  toggleModal(true);
}

function clearForm() {
  ["empId", "empName", "uniformCode", "qty", "editIndex", "department"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    }
  );
  const colorSelect = document.getElementById("color");
  if (colorSelect) {
    colorSelect.value = "";
    colorSelect.selectedIndex = 0;
  }
}

function setupListeners() {
  document
    .getElementById("search")
    ?.addEventListener("input", debounce(renderTable, 300)); // ฟังก์ชัน debounce สำหรับการค้นหาตามตัวอักษร

  document
    .getElementById("filterStatus")
    ?.addEventListener("change", renderTable);

  document
    .getElementById("uniformCode")
    ?.addEventListener("input", debounce(autofillUniformInfo, 300));

  document.getElementById("saveBtn")?.addEventListener("click", saveWash);

  document
    .getElementById("color")
    .addEventListener("change", fetchEmployeeByColor);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      toggleModal(false);
    }
  });
}

function getStatusFromCreatedAt(
  createdAtISO, 
  rewashCount = 0,
  esdTestResult = ""
) {
  const now = new Date();
  const created = new Date(createdAtISO);

  if (isNaN(created.getTime())) {
      console.error("Invalid createdAt date passed to getStatusFromCreatedAt:", createdAtISO);
      return "Unknown Status";
  }

  const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

  if (esdTestResult === "Pass") return "Completed";
  if (rewashCount >= 3 && esdTestResult === "Fail") return "Scrap";
  if (diffDays >= 4) return "Completed";
  if (diffDays >= 1) return "Washing"; 
  return "Waiting to Send";
}

async function renderTable() {
  const tbody = document.getElementById("washTableBody");
  const keyword = document.getElementById("search").value.toLowerCase();
  const filterStatus = document.getElementById("filterStatus").value;

  tbody.innerHTML = "";

  try {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    const allWashesRaw = await getAll(COLLECTIONS.WASHES);

    const allWashes = await Promise.all(
      allWashesRaw.map(async (wash) => {
        if (!wash.status || !wash.empName) {
          console.warn("⚠️ Missing required field in wash data:", wash);
          return null;
        }

        const correctStatus =
          wash.status.charAt(0).toUpperCase() + wash.status.slice(1);
        if (wash.status !== correctStatus) {
          await updateDoc(doc(db, COLLECTIONS.WASHES, wash.washId), {
            status: correctStatus,
          });
          wash.status = correctStatus;
        }
        return wash;
      })
    );

    const filteredData = allWashes.filter(
      (wash) => wash && wash.empName && wash.status
    );

    const finalData = filteredData.filter((wash) => {
      const matchesKeyword =
        (wash.empName || "").toLowerCase().includes(keyword) ||
        (wash.washId || "").toLowerCase().includes(keyword);

      const matchesStatus =
        !filterStatus || filterStatus === "All"
          ? true
          : (wash.status || "").toLowerCase().includes(filterStatus.toLowerCase());

      return matchesKeyword && matchesStatus;
    });

    const totalItems = finalData.length;

    const pageData = finalData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
      // Display "No data found" centered when no data is available
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="9" style="text-align: center; vertical-align: middle;">No data found</td>`;
      tbody.appendChild(tr);
    } else {
      pageData.forEach((wash) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${wash.washId}</td>
          <td>${wash.empId}</td>
          <td>${wash.empName}</td>
          <td>${wash.department}</td>
          <td>${wash.uniformCode}</td>
          <td>${wash.color}</td>
          <td>${wash.qty}</td>
          <td>${wash.status}</td>
          <td>
            <button onclick="openForm('${wash.washId}')">Edit</button>
            <button onclick="showDeleteModal('${wash.washId}')">Delete</button>
            <button title="Subtract 1 day" onclick="shiftWashDate('${wash.washId}', -1)">⬅️</button>
            <button title="Add 1 day" onclick="shiftWashDate('${wash.washId}', 1)">➡️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    renderPagination(totalItems, currentPage, rowsPerPage);
  } catch (error) {
    console.error("❌ Error rendering table:", error);
    alert("❌ Error rendering table");
  }
}

let currentHistoryPage = 1;
const historyRowsPerPage = 5;

async function renderHistory() {
  const tableBody = document.getElementById("historyTableBody");
  const pagination = document.getElementById("historyPagination");

  if (!tableBody || !pagination) {
    console.error("History table body or pagination element not found.");
    return;
  }

  pagination.innerHTML = "";
  tableBody.innerHTML = ""; // Clear existing table body

  try {
    const history = await getAll("washHistory");

    if (history.length === 0) {
      // Display "No history found" when no history data is available
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="7" style="text-align: center; vertical-align: middle;">No history found</td>`;
      tableBody.appendChild(tr);
      return; // Exit the function, no need to render further
    }

    const grouped = {};
    history.forEach((entry) => {
      const key = `${entry.empName || "-"} (${entry.empId || "-"})`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });

    const allKeys = Object.keys(grouped);
    const totalPages = Math.ceil(allKeys.length / historyRowsPerPage);
    const start = (currentHistoryPage - 1) * historyRowsPerPage;
    const end = start + historyRowsPerPage;

    const pageKeys = allKeys.slice(start, end);

    pageKeys.forEach((groupKey) => {
      const groupRows = grouped[groupKey]
        .map(
          (entry) => `
            <tr>
              <td style="text-align: center; vertical-align: middle;">${entry.empName || "-"} (${entry.empId || "-"})</td>
              <td style="text-align: center; vertical-align: middle;">${entry.washId}</td>
              <td style="text-align: center; vertical-align: middle;">${entry.status}</td>
              <td style="text-align: center; vertical-align: middle;">${entry.testResult}</td>
              <td style="text-align: center; vertical-align: middle;">${entry.testDate}</td>
              <td style="text-align: center; vertical-align: middle;">${entry.uniformCode}</td>
              <td style="text-align: center; vertical-align: middle;">${entry.notes || "-"}</td>
            </tr>
          `
        )
        .join("");

      const groupTitleRow = `
        <tr>
          <td colspan="7" style="text-align: left; vertical-align: middle;"><h4>${groupKey}</h4></td>
        </tr>
      `;

      tableBody.innerHTML += groupTitleRow + groupRows;
    });

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className = i === currentHistoryPage ? "active" : "";
      btn.onclick = () => {
        currentHistoryPage = i;
        renderHistory();
      };
      pagination.appendChild(btn);
    }
  } catch (error) {
    console.error("❌ Error rendering history:", error);
  }
}

async function updateSummary() {
  try {
    const washes = await getAll(COLLECTIONS.WASHES);
    const history = await getAll("washHistory");

    const total = washes.length;
    const waiting = washes.filter((w) => w.status.includes("Waiting")).length;
    const washing = washes.filter((w) => w.status === "Washing").length;
    const completed = washes.filter((w) => w.status === "Completed").length;
    const rewash = washes.filter((w) => w.status.includes("Rewash")).length;
    const scrap = washes.filter((w) => w.status === "Scrap").length;
    const historyCount = history.length;

    document.getElementById("sumTotal").textContent = total;
    document.getElementById("sumWaiting").textContent = waiting;
    document.getElementById("sumWashing").textContent = washing;
    document.getElementById("sumCompleted").textContent = completed;
    document.getElementById("sumRewash").textContent = rewash;
    document.getElementById("sumScrap").textContent = scrap;
    document.getElementById("sumHistory").textContent = historyCount;
  } catch (error) {
    console.error("❌ Error updating summary:", error);
  }
}

function debounce(fn, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, arguments), delay);
  };
}

async function autofillUniformInfo(event) {
  const code = document.getElementById("uniformCode").value.trim();
  const colorSelect = document.getElementById("color");

  if (event.key !== "Enter") return;

  if (!code) {
    alert("⚠️ กรุณากรอกรหัสยูนิฟอร์มก่อน!");
    return;
  }

  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.UNIFORMS),
        where("uniformCode", "==", code)
      )
    );
    if (querySnapshot.empty) {
      alert("❌ ไม่พบรหัส Uniform นี้ในระบบ");
      colorSelect.innerHTML = '<option value="">No Color Available</option>';
      colorSelect.disabled = true;
      clearForm();
      return;
    }

    const colors = querySnapshot.docs.map((doc) => doc.data().color);
    const uniqueColors = [...new Set(colors)];

    colorSelect.innerHTML = '<option value="">Select Color</option>';
    uniqueColors.forEach((color) => {
      const option = document.createElement("option");
      option.value = color;
      option.textContent = color;
      colorSelect.appendChild(option);
    });

    colorSelect.disabled = false;
    document.getElementById("empId").value = "";
    document.getElementById("empName").value = "";
    document.getElementById("department").value = "";
    document.getElementById("qty").value = 1;

    colorSelect.focus();
  } catch (err) {
    console.error("❌ Error during autofill:", err);
    alert("⚠️ เกิดข้อผิดพลาดขณะโหลดข้อมูล Uniform");
  }
}

document.getElementById("uniformCode").addEventListener("keypress", autofillUniformInfo);


let currentPage = 1;
const rowsPerPage = 10;

async function renderPagination(totalItems, current, perPage) {
  const pagination = document.getElementById("pagination");

  if (!pagination) {
    console.error("Pagination element not found.");
    return;
  }

  pagination.innerHTML = "";
  const totalPages = Math.ceil(totalItems / perPage);

  if (totalPages <= 1) return;

  const firstPageBtn = document.createElement("button");
  firstPageBtn.innerText = "First";
  firstPageBtn.className = current === 1 ? "disabled" : "";
  firstPageBtn.onclick = async () => {
    currentPage = 1;
    await renderTable();
  };
  pagination.appendChild(firstPageBtn);

  const prevPageBtn = document.createElement("button");
  prevPageBtn.innerText = "Previous";
  prevPageBtn.className = current === 1 ? "disabled" : "";
  prevPageBtn.onclick = async () => {
    if (current > 1) currentPage--;
    await renderTable();
  };
  pagination.appendChild(prevPageBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.className = i === current ? "active" : "";

    btn.onclick = async () => {
      currentPage = i;
      await renderTable();
    };

    pagination.appendChild(btn);

    if (totalPages > 5 && i > 3 && i < totalPages - 2) {
      if (i !== current) {
        btn.style.display = "none";
      }
    }
  }

  const nextPageBtn = document.createElement("button");
  nextPageBtn.innerText = "Next";
  nextPageBtn.className = current === totalPages ? "disabled" : "";
  nextPageBtn.onclick = async () => {
    if (current < totalPages) currentPage++;
    await renderTable();
  };
  pagination.appendChild(nextPageBtn);

  const lastPageBtn = document.createElement("button");
  lastPageBtn.innerText = "Last";
  lastPageBtn.className = current === totalPages ? "disabled" : "";
  lastPageBtn.onclick = async () => {
    currentPage = totalPages;
    await renderTable();
  };
  pagination.appendChild(lastPageBtn);
}

function showDeleteModal(id) {
  const modal = document.createElement("div");
  modal.className = "overlay";
  modal.innerHTML = `
    <div class="confirm-box">
      <h3>Delete Confirmation</h3>
      <p>Are you sure you want to delete this wash job?</p>
      <div>
        <button class="btn-yes" onclick="confirmDelete('${id}', this, true)">Yes</button>
        <button class="btn-no" id="cancelButton">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cancelButton").addEventListener("click", function() {
    closeModal(this);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(e.target);
    }
  });
}


function closeModal(modalElement) {
  const overlay = modalElement.closest(".overlay");
  if (overlay) {
    overlay.remove();
  } else {
    console.error("Overlay element not found.");
  }
}

async function confirmDelete(id, button, confirmed = false) {
  try {
    if (!confirmed) return; // ถ้า confirmed เป็น false (ไม่ได้กดปุ่ม Yes) ให้จบการทำงาน

    const washDocRef = doc(db, COLLECTIONS.WASHES, id);
    console.log(`กำลังลบเอกสารด้วย ID: ${id}`);

    await deleteDoc(washDocRef);

    console.log(`✅ เอกสาร ID: ${id} ถูกลบแล้ว.`);

    closeModal(button);

    await renderTable();
    await updateSummary();

    showNotificationModal("ข้อมูลถูกลบเรียบร้อยแล้ว!");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการลบเอกสาร:", error);
    showNotificationModal("❌ การลบข้อมูลล้มเหลว. กรุณาลองใหม่อีกครั้ง.");
  }
}

function showESDModal(id) {
  const modal = document.createElement("div");
  modal.className = "overlay";

  modal.innerHTML = `
    <div class="confirm-box">
      <h3>ESD Result Confirmation</h3>
      <p>Did this uniform pass the ESD test?</p>
      <div>
        <button class="btn-yes" onclick="confirmESD('${id}', true, this)">Pass</button>
        <button class="btn-no" onclick="confirmESD('${id}', false, this)">Fail</button>
        <button class="btn-cancel" onclick="closeModal(this)">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal(e.target);
    }
  });
}
async function confirmESD(id, passed, button) {
  try {
    const washDocRef = doc(db, COLLECTIONS.WASHES, id);
    const washDoc = await getDoc(washDocRef);

    if (!washDoc.exists()) {
      console.error("❌ Document not found!");
      return;
    }

    const washData = washDoc.data();
    const uniformCode = washData.uniformCode;

    if (passed) {
      const uniformSnap = await getDocs(
        query(
          collection(db, COLLECTIONS.UNIFORMS),
          where("uniformCode", "==", uniformCode)
        )
      );

      if (!uniformSnap.empty) {
        const uniformDocId = uniformSnap.docs[0].id;
        await updateDoc(doc(db, COLLECTIONS.UNIFORMS, uniformDocId), {
          status: "Available",
          lastReturned: new Date().toISOString(),
        });
      } else {
        console.warn("⚠️ ไม่พบ UniformCode ในระบบ:", uniformCode);
      }
    }

    const rewashCount = washData.rewashCount || 0;
    let newStatus = "Completed";

    if (rewashCount >= 3) {
      newStatus = "Scrap";
      const historyData = {
        ...washData,
        testResult: "Fail",
        testDate: new Date().toISOString(),
      };
      await addDoc(collection(db, "washHistory"), historyData);
      await deleteDoc(washDocRef);
    } else if (!passed) {
      newStatus = `Waiting Rewash #${rewashCount + 1}`;
    }

    await updateDoc(washDocRef, {
      esdTestResult: passed ? "Pass" : "Fail",
      status: newStatus,
      rewashCount: passed ? 0 : rewashCount + 1,
    });

    console.log(`✅ ESD test result for Wash ID: ${id} has been updated.`);

    button.closest(".overlay").remove();

    renderTable();
    updateSummary();
  } catch (error) {
    console.error("❌ Error updating ESD test result:", error);
  }
}

async function exportHistoryToCSV() {
  try {
    const querySnapshot = await getDocs(collection(db, "washHistory"));

    if (querySnapshot.empty) {
      return alert("No history data to export.");
    }

    const data = querySnapshot.docs.map((doc) => doc.data());

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    data.forEach((row) => {
      const values = headers.map(
        (header) => `"${(row[header] || "").toString().replace(/"/g, '""')}"`
      );
      csvRows.push(values.join(","));
    });

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" }); 
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wash_history_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  } catch (error) {
    console.error("❌ Error exporting history to CSV:", error);
    alert("❌ Error exporting history. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.createElement("button");
  exportBtn.className = "btn-export";
  exportBtn.innerHTML = '<i class="fas fa-file-csv"></i> Export CSV';
  exportBtn.onclick = exportHistoryToCSV;
  document.getElementById("exportArea")?.appendChild(exportBtn);
});

async function saveWash() {
  const color = document.getElementById("color").value;
  const uniformCode = document.getElementById("uniformCode").value;
  const empId = document.getElementById("empId").value;
  const qty = parseInt(document.getElementById("qty").value) || 1;
  const department = document.getElementById("department").value;

  if (!empId || !uniformCode || !qty || !color) {
    alert("⚠️ กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }
  if (color === "Unknown") {
    alert("⚠️ ไม่พบ Uniform นี้ในระบบ กรุณาตรวจสอบอีกครั้ง");
    return;
  }

  const washId = `WASH-${Date.now()}`;
  try {
    const uniformQuery = query(
      collection(db, COLLECTIONS.WASHES),
      where("uniformCode", "==", uniformCode),
      where("empId", "==", empId)
    );
    const snapshot = await getDocs(uniformQuery);

    if (!snapshot.empty) {
      alert("⚠️ ข้อมูล Wash นี้ซ้ำกับที่มีอยู่แล้วสำหรับพนักงานนี้");
      return;
    }

    const newWash = {
      washId,
      empId,
      empName: document.getElementById("empName").value,
      uniformCode,
      qty,
      status: "Waiting to Send",
      createdAt: new Date().toISOString(),
      department,
      color,
    };

    await setDoc(doc(db, COLLECTIONS.WASHES, washId), newWash);

    const uniformQuerySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.UNIFORMS),
        where("uniformCode", "==", uniformCode)
      )
    );
    if (!uniformQuerySnapshot.empty) {
      const uniformDocId = uniformQuerySnapshot.docs[0].id;
      await updateDoc(doc(db, COLLECTIONS.UNIFORMS, uniformDocId), {
        status: "In Wash",
        lastWash: new Date().toISOString(),
      });
    }

    console.log("✅ Wash job saved with ID:", washId);
    toggleModal(false);
    renderTable();
    updateSummary();
  } catch (error) {
    console.error("❌ Failed to save wash job:", error);
    alert("❌ บันทึกข้อมูลไม่สำเร็จ");
  }
}

async function loadColorsForUniform() {
  const uniformCode = document.getElementById("uniformCode").value.trim();
  const colorSelect = document.getElementById("color");

  if (!uniformCode) {
    colorSelect.innerHTML = '<option value="">Select Color</option>';
    colorSelect.disabled = true;
    return;
  }

  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.UNIFORMS),
        where("uniformCode", "==", uniformCode)
      )
    );

    if (!querySnapshot.empty) {
      const colors = querySnapshot.docs.map((doc) => doc.data().color);
      const uniqueColors = [...new Set(colors)]; 

      colorSelect.innerHTML = '<option value="">Select Color</option>';

      uniqueColors.forEach((color) => {
        const option = document.createElement("option");
        option.value = color;
        option.textContent = color;
        colorSelect.appendChild(option);
      });

      colorSelect.disabled = false;
    } else {
      alert("❌ ไม่พบ UniformCode นี้ในระบบ");
      colorSelect.innerHTML = '<option value="">No Color Available</option>';
      colorSelect.disabled = true;
    }
  } catch (err) {
    console.error("❌ Error loading colors:", err);
    alert("❌ เกิดข้อผิดพลาดในการดึงข้อมูลสี");
  }
}

async function fetchEmployeeByColor() {
  const uniformCode = document.getElementById("uniformCode").value.trim();
  const color = document.getElementById("color").value;

  if (!uniformCode || !color) return;
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.UNIFORMS),
        where("uniformCode", "==", uniformCode),
        where("color", "==", color)
      )
    );

    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data();
      document.getElementById("empId").value = data.employeeId || "-";
      document.getElementById("empName").value = data.employeeName || "-";
      document.getElementById("department").value = data.department || "-";
      document.getElementById("qty").value = data.qty || 1;
    } else {
      
      alert("⚠️ ไม่พบข้อมูลเจ้าของชุดนี้ในระบบ");
      
      document.getElementById("empId").value = "";
      document.getElementById("empName").value = "";
      document.getElementById("department").value = "";
      document.getElementById("qty").value = 1;
    }
  } catch (err) {
    console.error("❌ Error fetching employee:", err);
    alert("❌ เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน");
  }
}

async function shiftWashDate(washId, dayOffset) {
  try {
    const washRef = doc(db, COLLECTIONS.WASHES, washId);
    const snap = await getDoc(washRef);
    if (!snap.exists()) {
      alert("❌ ไม่พบข้อมูล Wash");
      return;
    }

    const washData = snap.data();
    const currentStatus = washData.status || "Waiting to Send"; // ดึงสถานะปัจจุบัน
    const currentCreatedAt = new Date(washData.createdAt || new Date());
    const originalDate = new Date(currentCreatedAt); // เก็บวันที่เดิมไว้แสดง

    const newDate = new Date(currentCreatedAt);
    newDate.setDate(newDate.getDate() + dayOffset);
    const newDateISO = newDate.toISOString(); // แปลงเป็น ISO String สำหรับเก็บและคำนวณ

    const formattedNewDate = newDate.toLocaleDateString("th-TH");

    const confirmChange = confirm(
      `คุณต้องการเลื่อนวันที่จาก ${originalDate.toLocaleDateString(
        "th-TH"
      )} ไปเป็น ${formattedNewDate} หรือไม่?\n(สถานะอาจมีการเปลี่ยนแปลงหากปัจจุบันคือ 'Waiting to Send' หรือ 'Washing')` // แจ้งเตือนเรื่องสถานะ
    );
    if (!confirmChange) {
      return;
    }

    let newStatus = currentStatus; 
    const nonDateBasedStatuses = ["Completed", "Scrap"];
    const isRewashStatus = currentStatus.includes("Waiting Rewash"); 

    if (!nonDateBasedStatuses.includes(currentStatus) && !isRewashStatus) {
         newStatus = getStatusFromCreatedAt( 
            newDateISO,                     
            washData.rewashCount || 0,
            washData.esdTestResult || ""
         );
         console.log(`Calculated new status based on new date: ${newStatus}`);
    } else {
         console.log(`Status '${currentStatus}' will be preserved.`);
    }

    await updateDoc(washRef, {
      createdAt: newDateISO,
      status: newStatus
    });

    alert(`✅ วันที่ถูกเลื่อนเป็น ${formattedNewDate} ${newStatus !== currentStatus ? `และสถานะอัปเดตเป็น '${newStatus}'` : '(สถานะไม่เปลี่ยนแปลง)'}`);
    renderTable();    
    updateSummary(); 
  } catch (error) {
    console.error("❌ Error shifting wash date and updating status:", error);
    alert("❌ ไม่สามารถเลื่อนเวลาและอัปเดตสถานะได้");
  }
}


// ==================== Expose Functions to Global Scope ====================
window.openForm = openForm;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.showESDModal = showESDModal;
window.confirmESD = confirmESD;
window.saveWash = saveWash;
window.exportHistoryToCSV = exportHistoryToCSV;
window.toggleModal = toggleModal;
window.shiftWashDate = shiftWashDate;
window.loadColorsForUniform = loadColorsForUniform;
