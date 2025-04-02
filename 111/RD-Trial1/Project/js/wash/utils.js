// utils.js

/**
 * หน่วงเวลาการเรียกฟังก์ชัน (ใช้สำหรับ search, resize, input ฯลฯ)
 * @param {Function} func - ฟังก์ชันที่จะเรียก
 * @param {number} delay - หน่วงเวลากี่มิลลิวินาที
 */
export function debounce(func, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * แปลงวันที่จาก ISO เป็น dd/mm/yyyy
 * @param {string} isoString - รูปแบบ ISO (new Date().toISOString())
 * @returns {string} - วันที่ในรูปแบบ dd/mm/yyyy
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * สร้าง ID อัตโนมัติ
 * @param {string} prefix - คำขึ้นต้น เช่น wash, employee, uniform
 * @returns {string} - เช่น wash-1712050048293
 */
export function generateId(prefix = "wash") {
  const now = Date.now();
  return `${prefix}-${now}`;
}
