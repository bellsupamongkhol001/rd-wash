// statusUpdater.js (Firebase version)
import { dbUtils, STORE_NAME } from './washModel.js';

export const statusUpdater = {
  async updateWaitingToWashing() {
    const data = await dbUtils.getAll(STORE_NAME);
    const now = new Date();
    const updates = [];

    for (let item of data) {
      if (!item.createDate || item.status !== "กำลังรอส่งซัก") continue;

      const created = new Date(item.createDate);
      const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
      if (diffDays >= 1) {
        const updatedItem = { ...item, status: "กำลังซัก" };
        updates.push(updatedItem);
      }
    }

    for (let u of updates) {
      await dbUtils.put(STORE_NAME, u);
    }

    return updates.length;
  },

  async updateWashingToCompleted() {
    const data = await dbUtils.getAll(STORE_NAME);
    const now = new Date();
    const updates = [];

    for (let item of data) {
      if (!item.createDate || item.status !== "กำลังซัก") continue;

      const created = new Date(item.createDate);
      const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
      if (diffDays >= 3) {
        const updatedItem = { ...item, status: "ซักเสร็จแล้ว" };
        updates.push(updatedItem);
      }
    }

    for (let u of updates) {
      await dbUtils.put(STORE_NAME, u);
    }

    return updates.length;
  }
};
