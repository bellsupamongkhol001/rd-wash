// ==================== IndexedDB Setup ====================
const DB_NAME = 'RDWash_UniformDB';
const DB_VERSION = 1;
const STORE_NAME = 'uniforms';

let db;
let currentPhoto = null;

// Initialize DB and render table on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    const searchBox = document.getElementById('searchUniform');
    if (searchBox) {
      searchBox.addEventListener('input', renderUniformTable);
    }
    renderUniformTable();
  }).catch((e) => console.error('Error initializing DB:', e));
});

// ==================== Initialize IndexedDB ====================
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => {
      console.error('❌ IndexedDB error:', e.target.error);
      reject(e);
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      console.log(`✅ Opened IndexedDB: ${DB_NAME} (v${db.version})`);
      resolve();
    };

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'uniformId' });
        store.createIndex('uniformName', 'uniformName', { unique: false });
      }
    };
  });
}

// ==================== Modal Controls ====================
function toggleUniformModal(show) {
  document.getElementById('uniformModal').style.display = show ? 'flex' : 'none';
}

let currentDeleteId = null;
function toggleDeleteModal(show, id = null) {
  document.getElementById('deleteModal').style.display = show ? 'flex' : 'none';
  currentDeleteId = id;
}

// ==================== Generate New Uniform ID ====================
function generateNewUniformId() {
  return getAllUniforms().then((uniforms) => {
    const prefix = 'RD-Uniform-';
    let max = 0;
    uniforms.forEach(u => {
      const match = u.uniformId?.match(/RD-Uniform-(\d{4})/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > max) max = num;
      }
    });
    const next = (max + 1).toString().padStart(4, '0');
    return prefix + next;
  });
}

// ==================== CRUD Operations ====================
function openUniformForm(id = null) {
  clearForm();
  toggleUniformModal(true);

  const modalTitle = document.getElementById('uniformModalTitle');

  if (id) {
    modalTitle.textContent = 'Edit Uniform';
    getUniform(id).then((uni) => {
      if (uni) {
        document.getElementById('uniformId').value = uni.uniformId;
        document.getElementById('uniformName').value = uni.uniformName;
        document.getElementById('size').value = uni.size;
        document.getElementById('color').value = uni.color;

        currentPhoto = uni.photo;
      }
    });
  } else {
    modalTitle.textContent = 'Add Uniform';
    generateNewUniformId().then(newId => {
      document.getElementById('uniformId').value = newId;
    });
    currentPhoto = null;
  }
}

function clearForm() {
  ['uniformId', 'uniformName', 'size', 'color', 'uniformPhoto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  currentPhoto = null;
}

function saveUniform(event) {
  event.preventDefault();

  const id = document.getElementById('uniformId')?.value.trim();
  const name = document.getElementById('uniformName')?.value.trim();
  const size = document.getElementById('size')?.value.trim();
  const color = document.getElementById('color')?.value.trim();
  const file = document.getElementById('uniformPhoto')?.files[0];

  if (!id || !name || !size || !color) {
    alert('Please fill in all fields.');
    return;
  }

  const saveToDB = (photoDataUrl) => {
    const uniform = {
      uniformId: id,
      uniformName: name,
      size,
      color,
      photo: photoDataUrl
    };

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(uniform);

    transaction.oncomplete = () => {
      toggleUniformModal(false);
      renderUniformTable();
    };
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => saveToDB(e.target.result);
    reader.readAsDataURL(file);
  } else {
    if (!currentPhoto) {
      alert('Please upload a photo.');
      return;
    }
    saveToDB(currentPhoto);
  }
}

function deleteUniform() {
  if (!currentDeleteId) return;
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.delete(currentDeleteId);

  transaction.oncomplete = () => {
    toggleDeleteModal(false);
    renderUniformTable();
  };
}

function getUniform(id) {
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllUniforms() {
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

// ==================== Render Table ====================
function renderUniformTable() {
  const tbody = document.getElementById('uniformTableBody');
  const keyword = document.getElementById('searchUniform')?.value.toLowerCase() || '';
  tbody.innerHTML = '';

  getAllUniforms().then((uniforms) => {
    if (uniforms.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No uniforms found.</td></tr>';
      return;
    }

    uniforms.forEach((uni) => {
      const matchKeyword =
        uni.uniformName.toLowerCase().includes(keyword) ||
        uni.size.toLowerCase().includes(keyword) ||
        uni.color.toLowerCase().includes(keyword);

      if (!matchKeyword) return;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${uni.uniformName}</td>
        <td>${uni.size}</td>
        <td>${uni.color}</td>
        <td><img src="${uni.photo}" alt="Uniform Photo" style="max-width:60px; border-radius:6px;"></td>
        <td class="actions">
          <button class="edit" onclick="openUniformForm('${uni.uniformId}')">Edit</button>
          <button class="delete" onclick="toggleDeleteModal(true, '${uni.uniformId}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// ==================== Mock Data ====================
function generateUniformMock() {
  const sizes = ['S', 'M', 'L', 'XL'];
  const colors = ['White', 'Blue', 'Black', 'Gray', 'Navy'];
  const photo = 'https://cdn-icons-png.flaticon.com/512/5242/5242103.png';

  getAllUniforms().then(existing => {
    let count = existing.length;
    for (let i = 0; i < 20; i++) {
      const uniform = {
        uniformId: 'RD-Uniform-' + (count + i + 1).toString().padStart(4, '0'),
        uniformName: 'Uniform ' + (count + i + 1),
        size: sizes[Math.floor(Math.random() * sizes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        photo
      };
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(uniform);
    }
    setTimeout(renderUniformTable, 300);
  });
}
