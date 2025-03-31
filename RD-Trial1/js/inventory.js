// ==================== IndexedDB Setup ====================
const DB_NAME = 'RDWashDB_Inventory';
const DB_VERSION = 1;
const STORE_NAME = 'uniforms';
let db;

document.addEventListener('DOMContentLoaded', () => {
  initDB().then(() => {
    document.getElementById('searchInventory').addEventListener('input', renderUniformCards);
    document.getElementById('addInventoryBtn').addEventListener('click', () => openUniformForm());
    document.getElementById('inventoryForm').addEventListener('submit', saveUniform);
    renderUniformCards();
  });
});

// ==================== Initialize DB ====================
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
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
function toggleModal(show) {
  document.getElementById('inventoryModal').style.display = show ? 'flex' : 'none';
}

function closeInventoryModal() {
  toggleModal(false);
}

function clearForm() {
  ['inventoryId', 'UniformName', 'UniformSize', 'UniformColor', 'UniformQty', 'UniformPicture'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// ==================== Open Add/Edit ====================
function openUniformForm(id = null) {
  clearForm();
  toggleModal(true);
  const title = document.getElementById('modalTitle');
  title.textContent = id ? 'Edit Uniform' : 'Add Uniform';

  if (id) {
    getUniform(id).then((uni) => {
      document.getElementById('inventoryId').value = uni.uniformId;
      document.getElementById('UniformName').value = uni.uniformName;
      document.getElementById('UniformSize').value = uni.uniformSize;
      document.getElementById('UniformColor').value = uni.uniformColor;
      document.getElementById('UniformQty').value = uni.uniformQty;
    });
  } else {
    document.getElementById('inventoryId').value = 'UNI-' + Math.floor(Math.random() * 10000);
  }
}

// ==================== Save ====================
function saveUniform(e) {
  e.preventDefault();

  const id = document.getElementById('inventoryId').value.trim();
  const name = document.getElementById('UniformName').value.trim();
  const size = document.getElementById('UniformSize').value.trim();
  const color = document.getElementById('UniformColor').value.trim();
  const qty = parseInt(document.getElementById('UniformQty').value.trim());
  const file = document.getElementById('UniformPicture').files[0];

  if (!id || !name || !size || !color || !qty) {
    alert('Please fill in all fields.');
    return;
  }

  const saveData = (imageBase64 = '') => {
    const uniform = {
      uniformId: id,
      uniformName: name,
      uniformSize: size,
      uniformColor: color,
      uniformQty: qty,
      photo: imageBase64
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(uniform);
    tx.oncomplete = () => {
      toggleModal(false);
      renderUniformCards();
    };
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = e => saveData(e.target.result);
    reader.readAsDataURL(file);
  } else {
    getUniform(id).then(data => saveData(data?.photo || ''));
  }
}

// ==================== Delete ====================
let currentDeleteId = null;

function toggleDeleteModal(show, id = null) {
  document.getElementById('deleteModal').style.display = show ? 'flex' : 'none';
  currentDeleteId = id;
}

function deleteUniform() {
  if (!currentDeleteId) return;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(currentDeleteId);
  tx.oncomplete = () => {
    toggleDeleteModal(false);
    renderUniformCards();
  };
}

// ==================== DB Helpers ====================
function getUniform(id) {
  return new Promise(resolve => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
  });
}

function getAllUniforms() {
  return new Promise(resolve => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });
}

// ==================== Render ====================
function renderUniformCards() {
  const container = document.getElementById('inventoryList');
  const keyword = document.getElementById('searchInventory')?.value.toLowerCase() || '';
  container.innerHTML = '';

  getAllUniforms().then(uniforms => {
    if (!uniforms.length) {
      container.innerHTML = '<p>No uniforms found.</p>';
      return;
    }

    uniforms.forEach((u) => {
      if (!u.uniformName.toLowerCase().includes(keyword) && !u.uniformColor.toLowerCase().includes(keyword)) return;

      const card = document.createElement('div');
      card.className = 'inventory-card';
      card.innerHTML = `
        <div class="actions">
          <button class="edit" onclick="openUniformForm('${u.uniformId}')"><i class="fas fa-edit"></i></button>
          <button class="delete" onclick="toggleDeleteModal(true, '${u.uniformId}')"><i class="fas fa-trash-alt"></i></button>
        </div>
        <img src="${u.photo || 'https://via.placeholder.com/240x140?text=No+Image'}" alt="Uniform">
        <h4>${u.uniformName}</h4>
        <p>Size: ${u.uniformSize} | Color: ${u.uniformColor}</p>
        <div class="qty">Qty: ${u.uniformQty}</div>
      `;
      container.appendChild(card);
    });
  });
}

// ==================== Mock Data ====================
function generateInventoryMock() {
  const samples = [
    { uniformName: 'Cleanroom Jacket', uniformSize: 'M', uniformColor: 'White', uniformQty: 25 },
    { uniformName: 'Anti-Static Coat', uniformSize: 'L', uniformColor: 'Blue', uniformQty: 15 },
    { uniformName: 'Dust-Free Pants', uniformSize: 'XL', uniformColor: 'Gray', uniformQty: 10 },
    { uniformName: 'Smock Top', uniformSize: 'S', uniformColor: 'Navy', uniformQty: 18 },
    { uniformName: 'Coverall Suit', uniformSize: 'M', uniformColor: 'Black', uniformQty: 30 }
  ];
  const photo = 'https://cdn-icons-png.flaticon.com/512/5242/5242103.png';

  samples.forEach((item, i) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      uniformId: 'UNI-' + (1000 + i),
      ...item,
      photo
    });
  });

  setTimeout(renderUniformCards, 300);
}
