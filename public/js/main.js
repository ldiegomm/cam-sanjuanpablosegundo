/* ============================================================
   MAIN - Inicialización de la aplicación
   ============================================================ */

import { initFecha, updateCounter } from './utils.js';
import { initNavigation, checkMobile, setActiveNav, showPage } from './navigation.js';
import { initAuth } from './auth.js';
import { initModals, initUnsavedDetection, checkUnsaved } from './modals.js';
import { crearBuscador } from './buscador.js';
import { initPacientes, pacienteActual } from './pacientes.js';
import { renderHistorial, initHistorial, irAHistorialPaciente } from './historial.js';
import { renderMeds, initMedicamentos, irAMedicamentosPaciente } from './medicamentos.js';
import { renderDashboard, renderBadgesPacientes } from './dashboard.js';
import { pacientesOpciones, historialDatos, medsDatos } from './data.js';

/**
 * Inicializa la aplicación
 */
function init() {
  // Fecha en el dashboard
  initFecha();
  
  // Contador inicial
  updateCounter();
  
  // Autenticación
  initAuth();
  
  // Modales
  initModals();
  initUnsavedDetection();
  
  // Navegación (con check de unsaved)
  initNavigation(checkUnsaved);
  
  // Responsive
  checkMobile();
  window.addEventListener('resize', checkMobile);
  
  // Pacientes
  initPacientes();
  
  // Historial
  initHistorial();
  
  // Medicamentos
  initMedicamentos();
  
  // Dashboard
  renderDashboard();
  renderBadgesPacientes();
  
  // Inicializar buscadores
  initBuscadores();
  
  // Inicializar accesos rápidos desde perfil
  initAccesosRapidos();
  
  // Exponer funciones globales necesarias
  window.renderDashboard = wrapRenderDashboard;
  window.renderBadgesPacientes = renderBadgesPacientes;
  window.pacientesOpciones = pacientesOpciones;
  window.historialDatos = historialDatos;
  window.medsDatos = medsDatos;
}

/**
 * Envuelve renderDashboard para que también actualice badges
 */
function wrapRenderDashboard() {
  renderDashboard();
  renderBadgesPacientes();
}

/**
 * Inicializa los buscadores de pacientes
 */
function initBuscadores() {
  // Buscador de historial
  crearBuscador('hist-search', 'hist-dropdown', 'historial-select', pacientesOpciones, (key) => {
    renderHistorial(key);
    
    const historialEdicion = document.getElementById('historial-edicion');
    const historialVista = document.getElementById('historial-vista');
    const btnEditarHistorial = document.getElementById('btn-editar-historial');
    const histSearch = document.getElementById('hist-search');
    
    if (historialEdicion) historialEdicion.style.display = 'none';
    if (historialVista) historialVista.style.display = 'block';
    if (btnEditarHistorial) btnEditarHistorial.style.display = 'inline-block';
    if (histSearch) {
      histSearch.disabled = false;
      histSearch.style.opacity = '1';
    }
    
    // Actualizar contexto
    const op = pacientesOpciones.find(p => p.key === key);
    const histContextoNombre = document.getElementById('hist-contexto-nombre');
    if (op && histContextoNombre) {
      histContextoNombre.textContent = op.nombre;
    }
  });

  // Buscador de medicamentos
  crearBuscador('med-search', 'med-dropdown', 'med-select', pacientesOpciones, (key) => {
    renderMeds(key);
    
    // Actualizar contexto
    const op = pacientesOpciones.find(p => p.key === key);
    const medContextoNombre = document.getElementById('med-contexto-nombre');
    if (op && medContextoNombre) {
      medContextoNombre.textContent = op.nombre;
    }
  });
  
  // Cargar María al inicio
  renderHistorial('maria');
  renderMeds('maria');
  
  // Actualizar contexto inicial
  const histContextoNombre = document.getElementById('hist-contexto-nombre');
  const medContextoNombre = document.getElementById('med-contexto-nombre');
  if (histContextoNombre) histContextoNombre.textContent = 'María Rodríguez';
  if (medContextoNombre) medContextoNombre.textContent = 'María Rodríguez';
}

/**
 * Inicializa los accesos rápidos desde el perfil del paciente
 */
function initAccesosRapidos() {
  const btnIrHistorial = document.getElementById('btn-ir-historial');
  if (btnIrHistorial) {
    btnIrHistorial.addEventListener('click', () => {
      if (checkUnsaved(() => {
        irAHistorialPaciente(pacienteActual);
        setActiveNav('historial');
        showPage('historial');
      })) return;
      
      irAHistorialPaciente(pacienteActual);
      setActiveNav('historial');
      showPage('historial');
    });
  }

  const btnIrMedicamentos = document.getElementById('btn-ir-medicamentos');
  if (btnIrMedicamentos) {
    btnIrMedicamentos.addEventListener('click', () => {
      if (checkUnsaved(() => {
        irAMedicamentosPaciente(pacienteActual);
        setActiveNav('medicamentos');
        showPage('medicamentos');
      })) return;
      
      irAMedicamentosPaciente(pacienteActual);
      setActiveNav('medicamentos');
      showPage('medicamentos');
    });
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
