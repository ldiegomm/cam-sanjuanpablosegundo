/* ============================================================
   MODALS - Gestión de modales
   ============================================================ */

let eliminarCallback = null;
let unsavedCallback = null;

/**
 * Muestra el modal de eliminación
 * @param {string} texto - Texto a mostrar en el modal
 * @param {Function} cb - Callback a ejecutar al confirmar
 */
export function showEliminarModal(texto, cb) {
  const modalTexto = document.getElementById('modal-eliminar-texto');
  const modal = document.getElementById('modal-eliminar');
  
  if (modalTexto) modalTexto.textContent = texto;
  eliminarCallback = cb;
  if (modal) modal.style.display = 'flex';
}

/**
 * Muestra el modal de cambios sin guardar
 * @param {Function} callback - Callback a ejecutar si el usuario decide salir
 * @returns {boolean} true si hay cambios sin guardar
 */
export function checkUnsaved(callback) {
  if (!window.hayUnsaved) return false;
  
  unsavedCallback = callback;
  const modal = document.getElementById('modal-unsaved');
  if (modal) modal.style.display = 'flex';
  return true;
}

/**
 * Establece el estado de cambios sin guardar
 * @param {boolean} val - true si hay cambios sin guardar
 */
export function setUnsaved(val) {
  window.hayUnsaved = val;
}

/**
 * Inicializa los event listeners de los modales
 */
export function initModals() {
  // Modal eliminar
  const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
  if (btnCancelarEliminar) {
    btnCancelarEliminar.addEventListener('click', () => {
      const modal = document.getElementById('modal-eliminar');
      if (modal) modal.style.display = 'none';
      eliminarCallback = null;
    });
  }

  const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', () => {
      if (eliminarCallback) eliminarCallback();
      const modal = document.getElementById('modal-eliminar');
      if (modal) modal.style.display = 'none';
      eliminarCallback = null;
    });
  }

  // Modal unsaved
  const btnUnsavedQuedar = document.getElementById('btn-unsaved-quedar');
  if (btnUnsavedQuedar) {
    btnUnsavedQuedar.addEventListener('click', () => {
      const modal = document.getElementById('modal-unsaved');
      if (modal) modal.style.display = 'none';
      unsavedCallback = null;
    });
  }

  const btnUnsavedSalir = document.getElementById('btn-unsaved-salir');
  if (btnUnsavedSalir) {
    btnUnsavedSalir.addEventListener('click', () => {
      const modal = document.getElementById('modal-unsaved');
      if (modal) modal.style.display = 'none';
      window.hayUnsaved = false;
      if (unsavedCallback) {
        unsavedCallback();
        unsavedCallback = null;
      }
    });
  }
}

/**
 * Inicializa la detección de cambios sin guardar en formularios
 */
export function initUnsavedDetection() {
  window.hayUnsaved = false;
  window.setUnsaved = setUnsaved;

  // Detectar cambios en perfil-edicion
  const perfilEdicion = document.getElementById('perfil-edicion');
  if (perfilEdicion) {
    perfilEdicion.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', () => setUnsaved(true));
      el.addEventListener('input', () => setUnsaved(true));
    });
  }

  // Detectar cambios en historial-edicion
  const historialEdicion = document.getElementById('historial-edicion');
  if (historialEdicion) {
    historialEdicion.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('change', () => setUnsaved(true));
      el.addEventListener('input', () => setUnsaved(true));
    });
  }

  // Reset unsaved al guardar o cancelar
  ['btn-guardar-perfil', 'btn-cancelar-edicion', 'btn-guardar-historial', 'btn-cancelar-historial'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => setUnsaved(false), true);
  });

  // Al abrir edición, reset unsaved
  const btnEditarPaciente = document.getElementById('btn-editar-paciente');
  if (btnEditarPaciente) {
    btnEditarPaciente.addEventListener('click', () => setUnsaved(false), true);
  }

  const btnEditarHistorial = document.getElementById('btn-editar-historial');
  if (btnEditarHistorial) {
    btnEditarHistorial.addEventListener('click', () => setUnsaved(false), true);
  }
}
