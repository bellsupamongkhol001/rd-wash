document.addEventListener('DOMContentLoaded', async () => {
    await openDatabase();
    loadInitialData();
  
    // Initialize form and event listeners
    document.getElementById('formAssignUniform').addEventListener('submit', handleAssignSubmit);
    document.getElementById('assignUniformCode').addEventListener('change', async function () {
      const uniformId = this.value;
      const uniform = await getUniformById(uniformId);
      if (uniform) {
        document.getElementById('assignSize').value = uniform.size;
        document.getElementById('assignColor').value = uniform.color;
        document.getElementById('assignQty').value = uniform.qty;
      }
    });
  });
  
  // ==================== Load Initial Data ====================
  async function loadInitialData() {
    const uniforms = await getAllUniforms();
    const assignments = await getAllAssignments();
    renderUniformCards(uniforms);
    renderDashboard(uniforms, assignments);
  }
  
  // ==================== Assign Submit Handler ====================
  async function handleAssignSubmit(e) {
    e.preventDefault();
    const assignData = {
      uniformCode: document.getElementById('assignUniformCode').value,
      size: document.getElementById('assignSize').value,
      color: document.getElementById('assignColor').value,
      qty: parseInt(document.getElementById('assignQty').value),
      employeeId: document.getElementById('assignEmployeeId').value,
      employeeName: document.getElementById('assignEmployeeName').value,
      department: document.getElementById('assignDepartment').value,
      status: 'in-use',
      assignDate: new Date().toISOString()
    };
  
    if (!assignData.uniformCode || !assignData.employeeId || !assignData.qty) {
      alert('⚠️ Please fill in all required fields');
      return;
    }
  
    await addAssignment(assignData);
  
    const uniform = await getUniformById(assignData.uniformCode);
    if (uniform) {
      uniform.qty = Math.max(0, uniform.qty - assignData.qty);
      await updateUniform(uniform);
    }
  
    await renderUniformCards();
    closeModal('modalAssignUniform');
    alert('✅ Uniform assigned successfully');
  }
  