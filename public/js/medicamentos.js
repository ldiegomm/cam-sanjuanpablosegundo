/* ============================================================
   MEDICAMENTOS - Gestión de medicamentos
   ============================================================ */

import { showToast } from './utils.js';
import { showEliminarModal } from './modals.js';
import { medsDatos, horarioKeys, pacientesOpciones } from './data.js';

let editingRow = null;

/**
 * Construye una fila de medicamento para la tabla
 * @param {Object} med - Objeto de medicamento
 * @returns {HTMLElement} Elemento TR
 */
function buildMedRow(med) {
  const celdas = med.horarios.map(c => 
    `<td class="${c ? 'check' : 'dash'}">${c ? '✓' : '—'}</td>`
  ).join('');
  
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <p style="font-weight:500;">${med.nombre}</p>
      <p style="font-size:11px;" class="muted">${med.indicacion || 'Sin indicación especial'}</p>
    </td>
    ${celdas}
    <td style="white-space:nowrap;">
      <button class="btn-sm btn-editar-med" style="color:#C9A84C;border-color:#C9A84C;">Editar</button>
      <button class="btn-sm btn-eliminar-med" style="color:#b91c1c;border-color:#fca5a5;margin-left:4px;">Eliminar</button>
    </td>`;
  return tr;
}

/**
 * Renderiza los medicamentos de un paciente
 * @param {string} key - Key del paciente
 */
export function renderMeds(key) {
  const tbody = document.getElementById('med-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const meds = medsDatos[key] || [];
  
  if (meds.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="9" style="text-align:center;padding:2rem;color:#888780;font-size:13px;">Sin medicamentos registrados para esta persona.</td>';
    tbody.appendChild(tr);
  } else {
    meds.forEach(m => tbody.appendChild(buildMedRow(m)));
  }
}

/**
 * Abre el modal de medicamento
 * @param {string} titulo - Título del modal
 * @param {string} nombre - Nombre del medicamento
 * @param {string} indicacion - Indicación especial
 * @param {Array} horarios - Array de strings con los horarios activos
 */
function openMedModal(titulo, nombre, indicacion, horarios) {
  const modalTitulo = document.getElementById('modal-titulo');
  const modalNombre = document.getElementById('modal-nombre');
  const modalIndicacion = document.getElementById('modal-indicacion');
  const modalOverlay = document.getElementById('modal-overlay');
  
  if (modalTitulo) modalTitulo.textContent = titulo;
  if (modalNombre) modalNombre.value = nombre || '';
  if (modalIndicacion) modalIndicacion.value = indicacion || '';
  
  horarioKeys.forEach(h => {
    const checkbox = document.getElementById('h-' + h);
    if (checkbox) {
      checkbox.checked = horarios ? horarios.includes(h) : false;
    }
  });
  
  if (modalOverlay) modalOverlay.style.display = 'flex';
}

/**
 * Inicializa los event listeners de medicamentos
 */
export function initMedicamentos() {
  // Agregar medicamento
  const btnAgregarMed = document.getElementById('btn-agregar-med');
  if (btnAgregarMed) {
    btnAgregarMed.addEventListener('click', () => {
      editingRow = null;
      openMedModal('Agregar medicamento', '', '', []);
    });
  }

  // Editar medicamento
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-editar-med')) {
      editingRow = e.target.closest('tr');
      const nombre = editingRow.querySelector('p').textContent;
      const indicacion = editingRow.querySelectorAll('p')[1].textContent;
      const checks = [...editingRow.querySelectorAll('td')].slice(1, 8).map((td, i) =>
        td.classList.contains('check') ? horarioKeys[i] : null
      ).filter(Boolean);
      openMedModal('Editar medicamento', nombre, indicacion, checks);
    }
  });

  // Cerrar modal
  const btnCerrarModal = document.getElementById('btn-cerrar-modal');
  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', () => {
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) modalOverlay.style.display = 'none';
      editingRow = null;
    });
  }

  const btnCancelarModal = document.getElementById('btn-cancelar-modal');
  if (btnCancelarModal) {
    btnCancelarModal.addEventListener('click', () => {
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay) modalOverlay.style.display = 'none';
      editingRow = null;
    });
  }

  // Guardar medicamento
  const btnGuardarModal = document.getElementById('btn-guardar-modal');
  if (btnGuardarModal) {
    btnGuardarModal.addEventListener('click', guardarMedicamento);
  }

  // Eliminar medicamento
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar-med')) {
      const row = e.target.closest('tr');
      const nombre = row.querySelector('p').textContent;
      showEliminarModal(
        '¿Eliminar ' + nombre + '? Esta acción no se puede deshacer.',
        () => {
          const medSelect = document.getElementById('med-select');
          const keyP = medSelect ? medSelect.value : null;
          const tbody = document.getElementById('med-tbody');
          const idx = tbody ? [...tbody.rows].indexOf(row) : -1;
          
          if (keyP && medsDatos[keyP] && idx >= 0) {
            medsDatos[keyP].splice(idx, 1);
          }
          
          row.remove();
          
          // Si no quedan filas, mostrar vacío
          if (tbody && tbody.rows.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="9" style="text-align:center;padding:2rem;color:#888780;font-size:13px;">Sin medicamentos registrados para esta persona.</td>';
            tbody.appendChild(tr);
          }
          
          if (window.renderDashboard) window.renderDashboard();
          showToast('Medicamento eliminado correctamente.');
        }
      );
    }
  });
}

/**
 * Guarda un medicamento (nuevo o editado)
 */
function guardarMedicamento() {
  const modalNombre = document.getElementById('modal-nombre');
  const modalIndicacion = document.getElementById('modal-indicacion');
  
  const nombre = modalNombre ? modalNombre.value.trim() : '';
  const indicacion = modalIndicacion ? modalIndicacion.value.trim() : '';
  const checks = horarioKeys.map(h => {
    const checkbox = document.getElementById('h-' + h);
    return checkbox ? checkbox.checked : false;
  });
  
  if (!nombre) {
    showToast('Por favor ingresá el nombre del medicamento.', 'error');
    return;
  }

  const medSelect = document.getElementById('med-select');
  const keyPerson = medSelect ? medSelect.value : null;
  
  if (!keyPerson) return;
  
  if (!medsDatos[keyPerson]) medsDatos[keyPerson] = [];

  if (editingRow) {
    // Actualizar en mapa
    const tbody = document.getElementById('med-tbody');
    const idx = tbody ? [...tbody.rows].indexOf(editingRow) : -1;
    
    if (idx >= 0) {
      medsDatos[keyPerson][idx] = {
        nombre,
        indicacion: indicacion || 'Sin indicación especial',
        horarios: checks
      };
    }
    
    editingRow.querySelector('p').textContent = nombre;
    editingRow.querySelectorAll('p')[1].textContent = indicacion || 'Sin indicación especial';
    const tds = editingRow.querySelectorAll('td');
    checks.forEach((c, i) => {
      tds[i + 1].className = c ? 'check' : 'dash';
      tds[i + 1].textContent = c ? '✓' : '—';
    });
    
    if (window.renderDashboard) window.renderDashboard();
    showToast('Medicamento actualizado correctamente.');
  } else {
    const newMed = {
      nombre,
      indicacion: indicacion || 'Sin indicación especial',
      horarios: checks
    };
    medsDatos[keyPerson].push(newMed);
    
    // Si la tabla tiene el mensaje vacío, limpiarlo primero
    const tbody = document.getElementById('med-tbody');
    if (tbody && tbody.rows.length === 1 && tbody.rows[0].cells.length === 1) {
      tbody.innerHTML = '';
    }
    
    if (tbody) tbody.appendChild(buildMedRow(newMed));
    if (window.renderDashboard) window.renderDashboard();
    showToast('Medicamento agregado correctamente.');
  }
  
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) modalOverlay.style.display = 'none';
  editingRow = null;
}

/**
 * Navega a la página de medicamentos de un paciente específico
 * @param {string} nombre - Nombre del paciente
 */
export function irAMedicamentosPaciente(nombre) {
  const op = pacientesOpciones.find(p => p.nombre === nombre);
  if (op) {
    const medSelect = document.getElementById('med-select');
    const medSearch = document.getElementById('med-search');
    const medContextoNombre = document.getElementById('med-contexto-nombre');
    
    if (medSelect) medSelect.value = op.key;
    if (medSearch) medSearch.value = op.nombre;
    if (medContextoNombre) medContextoNombre.textContent = op.nombre;
    
    renderMeds(op.key);
  }
}
