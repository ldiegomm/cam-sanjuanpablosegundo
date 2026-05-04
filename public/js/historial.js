/* ============================================================
   HISTORIAL - Gestión de historial de salud
   ============================================================ */

import { showToast } from './utils.js';
import { historialDatos, pacientesOpciones } from './data.js';

/**
 * Limpia el formulario de historial
 */
function limpiarFormHistorial() {
  document.querySelectorAll('.patologia-check, .lesion-check').forEach(c => c.checked = false);
  const hFuma = document.getElementById('h-fuma');
  const hLicor = document.getElementById('h-licor');
  const hEjercicio = document.getElementById('h-ejercicio');
  const hOperaciones = document.getElementById('h-operaciones');
  const hLimitaciones = document.getElementById('h-limitaciones');
  
  if (hFuma) hFuma.checked = false;
  if (hLicor) hLicor.checked = false;
  if (hEjercicio) hEjercicio.value = '0';
  if (hOperaciones) hOperaciones.value = '';
  if (hLimitaciones) hLimitaciones.value = '';
}

/**
 * Llena el formulario de historial con datos existentes
 * @param {Object} datos - Datos del historial
 */
function llenarFormHistorial(datos) {
  // Marcar patologías
  document.querySelectorAll('.patologia-check').forEach(c => {
    c.checked = datos.patologias.includes(c.dataset.label);
  });
  
  // Marcar lesiones
  document.querySelectorAll('.lesion-check').forEach(c => {
    c.checked = datos.lesiones.includes(c.dataset.label);
  });
  
  // Hábitos — parsear desde el string guardado
  const hFuma = document.getElementById('h-fuma');
  const hLicor = document.getElementById('h-licor');
  const hEjercicio = document.getElementById('h-ejercicio');
  
  if (hFuma) {
    hFuma.checked = datos.habitos.includes('Fuma') && !datos.habitos.includes('No fuma');
  }
  if (hLicor) {
    hLicor.checked = datos.habitos.includes('Consume licor') && !datos.habitos.includes('No consume licor');
  }
  
  const matchEj = datos.habitos.match(/Ejercicio (\d+)x/);
  if (hEjercicio) {
    hEjercicio.value = matchEj ? matchEj[1] : '0';
  }
  
  const hOperaciones = document.getElementById('h-operaciones');
  const hLimitaciones = document.getElementById('h-limitaciones');
  
  if (hOperaciones) {
    hOperaciones.value = datos.operaciones !== 'Ninguna' ? datos.operaciones : '';
  }
  if (hLimitaciones) {
    hLimitaciones.value = datos.limitaciones !== 'Ninguna' ? datos.limitaciones : '';
  }
}

/**
 * Renderiza el historial de un paciente
 * @param {string} key - Key del paciente
 */
export function renderHistorial(key) {
  const datos = historialDatos[key];
  const tieneData = datos && datos.tieneData;
  
  const historialVacio = document.getElementById('historial-vacio');
  const btnEditarHistorial = document.getElementById('btn-editar-historial');
  
  if (historialVacio) {
    historialVacio.style.display = tieneData ? 'none' : 'block';
  }
  if (btnEditarHistorial) {
    btnEditarHistorial.style.display = 'inline-block';
  }

  const cards = document.querySelectorAll('#historial-vista .grid-2, #historial-vista .card-sm');
  cards.forEach(c => c.style.display = tieneData ? '' : 'none');

  if (tieneData) {
    const vistaPatologias = document.getElementById('vista-patologias');
    const vistaLesiones = document.getElementById('vista-lesiones');
    const vistaOperaciones = document.getElementById('vista-operaciones');
    const vistaHabitos = document.getElementById('vista-habitos');
    const vistaLimitaciones = document.getElementById('vista-limitaciones');
    
    if (vistaPatologias) {
      vistaPatologias.innerHTML = datos.patologias.length
        ? datos.patologias.map(l => `<span class="badge-red">${l}</span>`).join('')
        : '<span class="muted" style="font-size:13px;">Sin patologías registradas</span>';
    }
    
    if (vistaLesiones) {
      vistaLesiones.innerHTML = datos.lesiones.length
        ? datos.lesiones.map(l => `<span class="badge-yellow">${l}</span>`).join('')
        : '<span class="muted" style="font-size:13px;">Sin lesiones registradas</span>';
    }
    
    if (vistaOperaciones) vistaOperaciones.textContent = datos.operaciones;
    if (vistaHabitos) vistaHabitos.innerHTML = datos.habitos;
    if (vistaLimitaciones) vistaLimitaciones.textContent = datos.limitaciones;
    
    llenarFormHistorial(datos);
  } else {
    limpiarFormHistorial();
  }
}

/**
 * Inicializa los event listeners de historial
 */
export function initHistorial() {
  const btnEditarHistorial = document.getElementById('btn-editar-historial');
  if (btnEditarHistorial) {
    btnEditarHistorial.addEventListener('click', () => {
      const historialVista = document.getElementById('historial-vista');
      const historialEdicion = document.getElementById('historial-edicion');
      const histSearch = document.getElementById('hist-search');
      
      if (historialVista) historialVista.style.display = 'none';
      if (historialEdicion) historialEdicion.style.display = 'block';
      if (btnEditarHistorial) btnEditarHistorial.style.display = 'none';
      if (histSearch) {
        histSearch.disabled = true;
        histSearch.style.opacity = '0.5';
      }
    });
  }

  const btnCancelarHistorial = document.getElementById('btn-cancelar-historial');
  if (btnCancelarHistorial) {
    btnCancelarHistorial.addEventListener('click', () => {
      const historialVista = document.getElementById('historial-vista');
      const historialEdicion = document.getElementById('historial-edicion');
      const histSearch = document.getElementById('hist-search');
      
      if (historialVista) historialVista.style.display = 'block';
      if (historialEdicion) historialEdicion.style.display = 'none';
      if (btnEditarHistorial) btnEditarHistorial.style.display = 'inline-block';
      if (histSearch) {
        histSearch.disabled = false;
        histSearch.style.opacity = '1';
      }
    });
  }

  const btnGuardarHistorial = document.getElementById('btn-guardar-historial');
  if (btnGuardarHistorial) {
    btnGuardarHistorial.addEventListener('click', guardarHistorial);
  }
}

/**
 * Guarda el historial de salud
 */
function guardarHistorial() {
  const patologias = [...document.querySelectorAll('.patologia-check:checked')].map(c => c.dataset.label);
  const lesiones = [...document.querySelectorAll('.lesion-check:checked')].map(c => c.dataset.label);
  
  const hFuma = document.getElementById('h-fuma');
  const hLicor = document.getElementById('h-licor');
  const hEjercicio = document.getElementById('h-ejercicio');
  const hOperaciones = document.getElementById('h-operaciones');
  const hLimitaciones = document.getElementById('h-limitaciones');
  
  const fuma = hFuma ? hFuma.checked : false;
  const licor = hLicor ? hLicor.checked : false;
  const ejercicio = hEjercicio ? hEjercicio.value : '0';
  const operaciones = hOperaciones ? hOperaciones.value.trim() : '';
  const limitaciones = hLimitaciones ? hLimitaciones.value.trim() : '';

  const vistaPatologias = document.getElementById('vista-patologias');
  const vistaLesiones = document.getElementById('vista-lesiones');
  const vistaHabitos = document.getElementById('vista-habitos');
  const vistaOperaciones = document.getElementById('vista-operaciones');
  const vistaLimitaciones = document.getElementById('vista-limitaciones');
  
  if (vistaPatologias) {
    vistaPatologias.innerHTML = patologias.length
      ? patologias.map(l => `<span class="badge-red">${l}</span>`).join('')
      : '<span class="muted" style="font-size:13px;">Sin patologías registradas</span>';
  }

  if (vistaLesiones) {
    vistaLesiones.innerHTML = lesiones.length
      ? lesiones.map(l => `<span class="badge-yellow">${l}</span>`).join('')
      : '<span class="muted" style="font-size:13px;">Sin lesiones registradas</span>';
  }

  const habitosText = (fuma ? 'Fuma' : 'No fuma') + ' · ' + 
                      (licor ? 'Consume licor' : 'No consume licor') +
                      '<br>Ejercicio ' + ejercicio + 'x semana';
  
  if (vistaHabitos) {
    vistaHabitos.innerHTML = habitosText;
  }

  if (vistaOperaciones) vistaOperaciones.textContent = operaciones || 'Ninguna';
  if (vistaLimitaciones) vistaLimitaciones.textContent = limitaciones || 'Ninguna';

  // Guardar en el mapa para que persista al cambiar persona
  const historialSelect = document.getElementById('historial-select');
  const keyActual = historialSelect ? historialSelect.value : null;
  
  if (keyActual) {
    historialDatos[keyActual] = {
      patologias,
      lesiones,
      operaciones: operaciones || 'Ninguna',
      habitos: habitosText,
      limitaciones: limitaciones || 'Ninguna',
      tieneData: true
    };
  }
  
  // Mostrar estado con datos (ocultar vacío)
  const historialVacio = document.getElementById('historial-vacio');
  if (historialVacio) historialVacio.style.display = 'none';
  
  const cards = document.querySelectorAll('#historial-vista .grid-2, #historial-vista .card-sm');
  cards.forEach(c => c.style.display = '');

  const historialVista = document.getElementById('historial-vista');
  const historialEdicion = document.getElementById('historial-edicion');
  const btnEditarHistorial = document.getElementById('btn-editar-historial');
  const histSearch = document.getElementById('hist-search');
  
  if (historialVista) historialVista.style.display = 'block';
  if (historialEdicion) historialEdicion.style.display = 'none';
  if (btnEditarHistorial) btnEditarHistorial.style.display = 'inline-block';
  if (histSearch) {
    histSearch.disabled = false;
    histSearch.style.opacity = '1';
  }
  
  if (window.renderBadgesPacientes) window.renderBadgesPacientes();
  showToast('Historial actualizado correctamente.');
}

/**
 * Navega al historial de un paciente específico
 * @param {string} nombre - Nombre del paciente
 */
export function irAHistorialPaciente(nombre) {
  const op = pacientesOpciones.find(p => p.nombre === nombre);
  if (op) {
    const historialSelect = document.getElementById('historial-select');
    const histSearch = document.getElementById('hist-search');
    const histContextoNombre = document.getElementById('hist-contexto-nombre');
    const historialEdicion = document.getElementById('historial-edicion');
    const historialVista = document.getElementById('historial-vista');
    const btnEditarHistorial = document.getElementById('btn-editar-historial');
    
    if (historialSelect) historialSelect.value = op.key;
    if (histSearch) histSearch.value = op.nombre;
    if (histContextoNombre) histContextoNombre.textContent = op.nombre;
    
    renderHistorial(op.key);
    
    if (historialEdicion) historialEdicion.style.display = 'none';
    if (historialVista) historialVista.style.display = 'block';
    if (btnEditarHistorial) btnEditarHistorial.style.display = 'inline-block';
    if (histSearch) {
      histSearch.disabled = false;
      histSearch.style.opacity = '1';
    }
  }
}
