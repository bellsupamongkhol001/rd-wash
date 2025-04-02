// ==================== Render Uniform Cards ====================
async function renderUniformCards() {
    const listEl = document.getElementById('uniformCardList');
    const uniforms = await getAllUniforms();
    listEl.innerHTML = '';  // Clear existing cards
    
    uniforms.forEach((u) => {
      const card = document.createElement('div');
      card.className = 'inventory-card';
      card.innerHTML = `
        <div class="actions">
          <button class="edit" onclick="editUniform('${u.uniformId}')"><i class="fas fa-pen"></i></button>
          <button class="delete" onclick="deleteUniform('${u.uniformId}')"><i class="fas fa-trash"></i></button>
          <button class="detail" onclick="openDetail('${u.uniformId}')"><i class="fas fa-eye"></i></button>
        </div>
        <img src="${u.photo || 'https://via.placeholder.com/240x140?text=No+Image'}" alt="Uniform Image" />
        <h4>${u.name}</h4>
        <p>Size: ${u.size} | Color: ${u.color}</p>
        <div class="qty"><i class="fas fa-box"></i> ${u.qty}</div>
      `;
      listEl.appendChild(card);
    });
  }
  
  // ==================== Render Dashboard ====================
  function renderDashboard(uniforms, assignments) {
    const summary = {   
      inUse: assignments.filter(a => a.status === 'in-use').length,
      available: uniforms.filter(u => u.status === 'available').length,
      other: uniforms.filter(u => u.status === 'other').length,
      total: uniforms.length
    };
  
    document.getElementById('summaryInUse').textContent = summary.inUse;
    document.getElementById('summaryActual').textContent = summary.available;
    document.getElementById('summaryOther').textContent = summary.other;
    document.getElementById('summaryTotal').textContent = summary.total;
  }
  
  // ==================== Populate Uniform Dropdown ====================
  async function populateUniformDropdown() {
    const select = document.getElementById('assignUniformCode');
    const uniforms = await getAllUniforms();
    select.innerHTML = `<option value="">-- Select Uniform --</option>`;  // Reset options
    uniforms.forEach(u => {
      const option = document.createElement('option');
      option.value = u.uniformId;
      option.textContent = `${u.uniformId} (${u.name})`;
      select.appendChild(option);
    });
  }
  
  // ==================== Open Uniform Detail ====================
  async function openDetail(uniformId) {
    const uniform = await getUniformById(uniformId);
    if (!uniform) return alert("Uniform not found");
  
    const header = document.getElementById('uniformDetailHeader');
    header.textContent = `${uniform.name} | Size: ${uniform.size} | Color: ${uniform.color} | Qty: ${uniform.qty}`;
  
    const tbody = document.getElementById('uniformDetailBody');
    tbody.innerHTML = '';
  
    const assignments = await getAllAssignments();
    const filtered = assignments.filter(a => a.uniformCode === uniformId);
  
    filtered.forEach(assign => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${assign.uniformCode}</td>
        <td>${assign.employeeId}</td>
        <td>${assign.employeeName}</td>
        <td>${assign.department}</td>
        <td>${assign.qty}</td>
        <td><span class="status ${assign.status}">${assign.status}</span></td>
        <td>
          <button class="edit" onclick="editAssignment('${assign.assignId}')"><i class="fas fa-pen"></i></button>
          <button class="delete" onclick="removeAssignment('${assign.assignId}')"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });
  
    document.getElementById('modalUniformDetail').style.display = 'flex';
  }
  