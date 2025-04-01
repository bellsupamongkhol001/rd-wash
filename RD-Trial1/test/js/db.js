// ==================== IndexedDB Setup ====================
const DB_NAME = 'RDWashDB_Inventory';
const DB_VERSION = 1;
let db;

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('Inventory')) {
        const store = db.createObjectStore('Inventory', { keyPath: 'uniformId' });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains('assignments')) {
        db.createObjectStore('assignments', { keyPath: 'assignId', autoIncrement: true });
      }
    };
  });
}

// ==================== Inventory Functions ====================
export function addUniform(uniform) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readwrite');
    const store = transaction.objectStore('Inventory');
    const request = store.add(uniform);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export function getAllUniforms() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readonly');
    const store = transaction.objectStore('Inventory');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getUniformById(uniformId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readonly');
    const store = transaction.objectStore('Inventory');
    const request = store.get(uniformId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function updateUniform(uniform) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readwrite');
    const store = transaction.objectStore('Inventory');
    const request = store.put(uniform);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export function deleteUniform(uniformId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('Inventory', 'readwrite');
    const store = transaction.objectStore('Inventory');
    const request = store.delete(uniformId);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// ==================== Assignment Functions ====================
export function addAssignment(assignment) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readwrite');
    const store = transaction.objectStore('assignments');
    const request = store.add(assignment);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export function getAllAssignments() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readonly');
    const store = transaction.objectStore('assignments');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getAssignmentById(assignId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readonly');
    const store = transaction.objectStore('assignments');
    const request = store.get(assignId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function updateAssignment(assignment) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readwrite');
    const store = transaction.objectStore('assignments');
    const request = store.put(assignment);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export function deleteAssignment(assignId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('assignments', 'readwrite');
    const store = transaction.objectStore('assignments');
    const request = store.delete(assignId);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}
