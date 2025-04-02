// esd.js (Firebase version)
import { dbUtils, STORE_NAME } from './washModel.js';
import { washView } from './washView.js';
import { historyLogger } from './historyLogger.js';

export const esdHandler = {
  async openESDModal(id) {
    const data = await dbUtils.getById(STORE_NAME, id);
    if (!data) return;
    washView.showESDModal(id);
    document.getElementById("esdItemInfo").textContent = `WashID: ${data.washId || id}, Name: ${data.employeeName}`;
  },

  async submitESDResult(pass) {
    const id = document.getElementById("esdModal").getAttribute("data-id");
    const data = await dbUtils.getById(STORE_NAME, id);
    if (!data) return;

    // Prepare ESD record
    data.esdTests = data.esdTests || [];
    data.esdTests.push({
      result: pass ? "PASS" : "FAIL",
      timestamp: new Date().toISOString()
    });

    // Update status based on result
    if (pass) {
      data.status = "พร้อมส่งคืน";
      await historyLogger.log(id, "ESD", "ผ่าน");
    } else {
      data.rewashCount = (data.rewashCount || 0) + 1;
      if (data.rewashCount >= 3) {
        data.status = "Scrap";
        await historyLogger.log(id, "ESD", "ไม่ผ่านครบ 3 ครั้ง → Scrap");
      } else {
        data.status = `ซํกซ้ำครั้งที่ ${data.rewashCount}`;
        await historyLogger.log(id, "ESD", `ไม่ผ่าน → ซํกซ้ำครั้งที่ ${data.rewashCount}`);
      }
    }

    await dbUtils.put(STORE_NAME, data);
    const updated = await dbUtils.getAll(STORE_NAME);
    washView.renderTable(updated);
    washView.updateSummary(updated);
    document.getElementById("esdModal").style.display = "none";
  }
};