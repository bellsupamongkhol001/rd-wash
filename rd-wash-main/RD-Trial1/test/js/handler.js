// ==================== Handle Add/Edit Uniform ====================
document.getElementById('formAddUniform').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const uniformId = document.getElementById('uniformId').value || `UNI-${Date.now()}`;
    const name = document.getElementById('uniformName').value.trim();
    const size = document.getElementById('uniformSize').value.trim();
    const color = document.getElementById('uniformColor').value.trim();
    const qty = parseInt(document.getElementById('uniformQty').value.trim());
    const photoInput = document.getElementById('uniformPhoto');
    const photo = photoInput.files[0] ? await toBase64(photoInput.files[0]) : '';
  
    const uniform = { uniformId, name, size, color, qty, photo, status: 'available' };
    await updateUniform(uniform);
  
    closeModal('modalAddUniform');
    renderUniformCards();
    e.target.reset();
  });
  
  // 🖼 Convert Image File to Base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  // ==================== Handle Assign Uniform ====================
  document.getElementById('formAssignUniform').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const uniformCode = document.getElementById('assignUniformCode').value;
    const size = document.getElementById('assignSize').value;
    const color = document.getElementById('assignColor').value;
    const qty = parseInt(document.getElementById('assignQty').value);
    const employeeId = document.getElementById('assignEmployeeId').value.trim();
    const employeeName = document.getElementById('assignEmployeeName').value.trim();
    const department = document.getElementById('assignDepartment').value.trim();
  
    if (!uniformCode || !employeeId || !employeeName || !department) {
      alert("Please complete all required fields.");
      return;
    }
  
    const assignment = {
      assignId: `ASG-${Date.now()}`,
      uniformCode,
      size,
      color,
      qty,
      employeeId,
      employeeName,
      department,
      status: 'in-use',
      createdAt: new Date().toISOString()
    };
  
    await addAssignment(assignment);
    closeModal('modalAssignUniform');
    alert('✅ Uniform assigned successfully');
  });
  