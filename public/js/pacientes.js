/* ============================================================
   PACIENTES - Gestión de pacientes
   ============================================================ */

import { showToast, updateCounter, calcEdad } from './utils.js';
import { setActiveNav, showPage } from './navigation.js';
import { showEliminarModal, checkUnsaved } from './modals.js';
import { pacientesDatos, pacientesOpciones, historialDatos, medsDatos, personasLista } from './data.js';
import { agregarPacienteOpciones } from './buscador.js';

export let pacienteActual = null;

/**
 * Carga el perfil de un paciente
 * @param {string} nombre - Nombre del paciente
 */
export function cargarPerfil(nombre) {
  const d = pacientesDatos[nombre];
  if (!d) return;
  
  pacienteActual = nombre;

  // --- VISTA ---
  document.getElementById('perfil-nombre').textContent = nombre;
  const edad = calcEdad(d.nacimiento);
  document.getElementById('perfil-meta').textContent = 
    (edad ? edad + ' años · ' : '') + d.sexo + ' · ' + d.estadoCivil;
  document.getElementById('perfil-estado-civil').textContent = d.estadoCivil;
  document.getElementById('perfil-telefono').textContent = d.telefono;
  document.getElementById('perfil-pension').textContent = d.pension;
  document.getElementById('perfil-direccion').textContent = 
    [d.provincia, d.canton, d.distrito].filter(Boolean).join(', ');
  document.getElementById('perfil-barrio').textContent = d.barrio;
  document.getElementById('perfil-familiar-nombre').textContent = d.familiarNombre;
  document.getElementById('perfil-familiar-datos').textContent = 
    'Cédula: ' + d.familiarCedula + ' · Tel: ' + d.familiarTel;
  document.getElementById('perfil-emergencia-nombre').textContent = d.emergenciaNombre;
  document.getElementById('perfil-emergencia-tel').textContent = 'Tel: ' + d.emergenciaTel;

  // Avatar
  const av = document.querySelector('#perfil-vista .person-avatar');
  if (av) {
    av.textContent = d.iniciales;
    av.className = 'person-avatar ' + d.color;
    av.style.width = '48px';
    av.style.height = '48px';
    av.style.fontSize = '16px';
  }

  // --- FORMULARIO DE EDICIÓN ---
  document.getElementById('edit-nombre').value = nombre;
  document.getElementById('edit-cedula').value = d.cedula;
  document.getElementById('edit-nacimiento').value = d.nacimiento;
  document.getElementById('edit-telefono').value = d.telefono;
  document.getElementById('edit-provincia').value = d.provincia;
  document.getElementById('edit-canton').value = d.canton;
  document.getElementById('edit-distrito').value = d.distrito;
  document.getElementById('edit-barrio').value = d.barrio;
  document.getElementById('edit-familiar-nombre').value = d.familiarNombre;
  document.getElementById('edit-familiar-cedula').value = d.familiarCedula;
  document.getElementById('edit-familiar-tel').value = d.familiarTel;
  document.getElementById('edit-emergencia-nombre').value = d.emergenciaNombre;
  document.getElementById('edit-emergencia-tel').value = d.emergenciaTel;

  // Selects
  const sexoSel = document.getElementById('edit-sexo');
  [...sexoSel.options].forEach(o => o.selected = o.text === d.sexo);
  
  const ecSel = document.getElementById('edit-estado-civil');
  [...ecSel.options].forEach(o => 
    o.selected = o.text.startsWith(d.estadoCivil.replace('a', '').replace('o', ''))
  );
  
  const pensionSel = document.getElementById('edit-pension');
  [...pensionSel.options].forEach(o => o.selected = o.text === d.pension);
}

/**
 * Inicializa los event listeners de pacientes
 */
export function initPacientes() {
  // Nuevo registro
  const btnNuevo = document.getElementById('btn-nuevo');
  if (btnNuevo) {
    btnNuevo.addEventListener('click', () => {
      setActiveNav('');
      showPage('nuevo');
    });
  }

  const btnVolver = document.getElementById('btn-volver');
  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      setActiveNav('adultos');
      showPage('adultos');
    });
  }

  const btnCancelar = document.getElementById('btn-cancelar');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
      setActiveNav('adultos');
      showPage('adultos');
    });
  }

  const btnGuardarRegistro = document.getElementById('btn-guardar-registro');
  if (btnGuardarRegistro) {
    btnGuardarRegistro.addEventListener('click', guardarNuevoRegistro);
  }

  // Ver perfil
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-ver')) {
      const nombre = e.target.closest('.person-item').querySelector('p').textContent;
      
      // Si no está en el mapa (paciente nuevo), crear entrada vacía
      if (!pacientesDatos[nombre]) {
        const partes = nombre.split(' ');
        const iniciales = (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
        const colores = ['avatar-green', 'avatar-blue', 'avatar-yellow'];
        const color = colores[Object.keys(pacientesDatos).length % 3];
        
        pacientesDatos[nombre] = {
          iniciales,
          color,
          cedula: '',
          nacimiento: '',
          sexo: 'Femenino',
          estadoCivil: 'Soltero/a',
          telefono: '',
          pension: 'No',
          provincia: '',
          canton: '',
          distrito: '',
          barrio: '',
          familiarNombre: '',
          familiarCedula: '',
          familiarTel: '',
          emergenciaNombre: '',
          emergenciaTel: ''
        };
      }
      
      cargarPerfil(nombre);
      setActiveNav('adultos');
      showPage('perfil');
      document.getElementById('perfil-vista').style.display = 'block';
      document.getElementById('perfil-edicion').style.display = 'none';
    }
  });

  // Volver desde perfil
  const btnVolverPerfil = document.getElementById('btn-volver-perfil');
  if (btnVolverPerfil) {
    btnVolverPerfil.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      const action = () => {
        setActiveNav('adultos');
        showPage('adultos');
        if (window.setUnsaved) window.setUnsaved(false);
      };
      if (checkUnsaved(action)) return;
      action();
    }, true);
  }

  // Editar perfil
  const btnEditarPaciente = document.getElementById('btn-editar-paciente');
  if (btnEditarPaciente) {
    btnEditarPaciente.addEventListener('click', () => {
      document.getElementById('perfil-vista').style.display = 'none';
      document.getElementById('perfil-edicion').style.display = 'block';
    });
  }

  const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
  if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener('click', () => {
      document.getElementById('perfil-vista').style.display = 'block';
      document.getElementById('perfil-edicion').style.display = 'none';
    });
  }

  const btnGuardarPerfil = document.getElementById('btn-guardar-perfil');
  if (btnGuardarPerfil) {
    btnGuardarPerfil.addEventListener('click', guardarPerfil);
  }

  // Eliminar paciente
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar-paciente')) {
      const item = e.target.closest('.person-item');
      const nombre = item.querySelector('p').textContent;
      showEliminarModal(
        '¿Eliminar a ' + nombre + '? Esta acción no se puede deshacer.',
        () => {
          item.remove();
          updateCounter();
          showToast('Registro eliminado correctamente.');
        }
      );
    }
  });

  // Buscador de adultos
  const adultosSearch = document.getElementById('adultos-search');
  if (adultosSearch) {
    adultosSearch.addEventListener('input', function() {
      const txt = this.value.toLowerCase();
      document.querySelectorAll('#lista-adultos .person-item').forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(txt) ? '' : 'none';
      });
    });
  }
}

/**
 * Guarda un nuevo registro de paciente
 */
function guardarNuevoRegistro() {
  const nombre = document.getElementById('nuevo-nombre').value.trim();
  const cedula = document.getElementById('nuevo-cedula').value.trim();
  const nacInput = document.getElementById('nuevo-nacimiento').value;
  
  if (!nombre || !cedula) {
    showToast('Por favor ingresá el nombre y la cédula.', 'error');
    return;
  }
  
  let edadTxt = '';
  if (nacInput) {
    const edad = new Date().getFullYear() - new Date(nacInput).getFullYear();
    edadTxt = ' · ' + edad + ' años';
  }
  
  const partes = nombre.split(' ');
  const iniciales = (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
  const colores = ['avatar-green', 'avatar-blue', 'avatar-yellow'];
  const color = colores[document.querySelectorAll('#lista-adultos .person-item').length % 3];
  
  const item = document.createElement('div');
  item.className = 'person-item';
  item.dataset.nombre = nombre;
  item.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="person-avatar ${color}">${iniciales}</div>
      <div>
        <p style="font-size:14px;font-weight:500;">${nombre}</p>
        <p style="font-size:12px;" class="muted">Cédula: ${cedula}${edadTxt}</p>
        <div class="pac-badges" style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;"></div>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-sm btn-ver">Ver</button>
      <button class="btn-sm btn-eliminar-paciente" style="color:#b91c1c;border-color:#fca5a5;">Eliminar</button>
    </div>`;
  
  document.getElementById('lista-adultos').appendChild(item);
  
  // Limpiar formulario
  document.getElementById('nuevo-nombre').value = '';
  document.getElementById('nuevo-cedula').value = '';
  document.getElementById('nuevo-nacimiento').value = '';
  document.getElementById('nuevo-sexo').selectedIndex = 0;
  
  updateCounter();
  
  // Agregar al select de historial y medicamentos
  const keyNuevo = 'nuevo_' + Date.now();
  historialDatos[keyNuevo] = { tieneData: false };
  medsDatos[keyNuevo] = [];
  personasLista.push({ key: keyNuevo, nombre });
  agregarPacienteOpciones(pacientesOpciones, keyNuevo, nombre);
  
  setActiveNav('adultos');
  showPage('adultos');
  showToast('Registro guardado correctamente.');
  
  // Actualizar badges
  if (window.renderBadgesPacientes) window.renderBadgesPacientes();
}

/**
 * Guarda los cambios en el perfil del paciente
 */
function guardarPerfil() {
  const nombre = document.getElementById('edit-nombre').value.trim();
  const nacInput = document.getElementById('edit-nacimiento').value;
  const sexo = document.getElementById('edit-sexo').value;
  const estadoCivil = document.getElementById('edit-estado-civil').value;
  const telefono = document.getElementById('edit-telefono').value.trim();
  const pension = document.getElementById('edit-pension').value;
  const provincia = document.getElementById('edit-provincia').value.trim();
  const canton = document.getElementById('edit-canton').value.trim();
  const distrito = document.getElementById('edit-distrito').value.trim();
  const barrio = document.getElementById('edit-barrio').value.trim();
  const famNombre = document.getElementById('edit-familiar-nombre').value.trim();
  const famCedula = document.getElementById('edit-familiar-cedula').value.trim();
  const famTel = document.getElementById('edit-familiar-tel').value.trim();
  const emergNombre = document.getElementById('edit-emergencia-nombre').value.trim();
  const emergTel = document.getElementById('edit-emergencia-tel').value.trim();

  let metaTxt = sexo + ' · ' + estadoCivil;
  if (nacInput) {
    const edad = new Date().getFullYear() - new Date(nacInput).getFullYear();
    metaTxt = edad + ' años · ' + metaTxt;
  }
  
  document.getElementById('perfil-nombre').textContent = nombre;
  document.getElementById('perfil-meta').textContent = metaTxt;
  document.getElementById('perfil-telefono').textContent = telefono;
  document.getElementById('perfil-pension').textContent = pension;
  document.getElementById('perfil-estado-civil').textContent = estadoCivil;
  document.getElementById('perfil-direccion').textContent = 
    [provincia, canton, distrito].filter(Boolean).join(', ');
  document.getElementById('perfil-barrio').textContent = barrio;
  document.getElementById('perfil-familiar-nombre').textContent = famNombre;
  document.getElementById('perfil-familiar-datos').textContent = 
    'Cédula: ' + famCedula + ' · Tel: ' + famTel;
  document.getElementById('perfil-emergencia-nombre').textContent = emergNombre;
  document.getElementById('perfil-emergencia-tel').textContent = 'Tel: ' + emergTel;

  // Actualizar mapa de datos
  if (pacienteActual && pacientesDatos[pacienteActual]) {
    const d = pacientesDatos[pacienteActual];
    d.nacimiento = nacInput;
    d.sexo = sexo;
    d.estadoCivil = estadoCivil.replace('/a', '').replace('/o', '');
    d.telefono = telefono;
    d.pension = pension;
    d.provincia = provincia;
    d.canton = canton;
    d.distrito = distrito;
    d.barrio = barrio;
    d.familiarNombre = famNombre;
    d.familiarCedula = famCedula;
    d.familiarTel = famTel;
    d.emergenciaNombre = emergNombre;
    d.emergenciaTel = emergTel;
    
    // Si cambió el nombre, actualizar clave
    const nuevoNombre = nombre;
    if (nuevoNombre !== pacienteActual) {
      pacientesDatos[nuevoNombre] = { ...d };
      delete pacientesDatos[pacienteActual];
      pacienteActual = nuevoNombre;
    }
  }

  document.getElementById('perfil-vista').style.display = 'block';
  document.getElementById('perfil-edicion').style.display = 'none';
  showToast('Datos del paciente actualizados.');
}
