// main.js

import { openForm, saveWash, confirmDelete, confirmESD } from '../controllers/washControllers.js';
import { generateMockData } from '../mock/washMock.js';
import { exportHistoryToCSV } from '../exports/washExports.js';
import { showDeleteModal, showESDModal } from '../views/washViews.js';

// Expose to global window for inline HTML use
window.openForm = openForm;
window.saveWash = saveWash;
window.confirmDelete = confirmDelete;
window.confirmESD = confirmESD;
window.generateMockData = generateMockData;
window.exportHistoryToCSV = exportHistoryToCSV;
window.showDeleteModal = showDeleteModal;
window.showESDModal = showESDModal;
