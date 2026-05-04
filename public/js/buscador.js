/* ============================================================
   BUSCADOR - Componente de buscador reutilizable
   ============================================================ */

/**
 * Crea un buscador de pacientes
 * @param {string} inputId - ID del input de búsqueda
 * @param {string} dropdownId - ID del dropdown de resultados
 * @param {string} hiddenId - ID del input hidden con el valor seleccionado
 * @param {Array} pacientesOpciones - Array de opciones de pacientes
 * @param {Function} onSelect - Callback al seleccionar un paciente
 */
export function crearBuscador(inputId, dropdownId, hiddenId, pacientesOpciones, onSelect) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  const hidden = document.getElementById(hiddenId);

  if (!input || !dropdown || !hidden) return;

  function renderOpciones(filtro) {
    const txt = filtro.toLowerCase();
    const filtradas = pacientesOpciones.filter(p => 
      p.nombre.toLowerCase().includes(txt)
    );
    
    dropdown.innerHTML = '';
    
    if (filtradas.length === 0) {
      dropdown.innerHTML = '<div class="pac-option no-results">Sin resultados</div>';
    } else {
      filtradas.forEach(p => {
        const div = document.createElement('div');
        div.className = 'pac-option' + (p.key === hidden.value ? ' selected' : '');
        div.textContent = p.nombre;
        div.addEventListener('mousedown', (e) => {
          e.preventDefault();
          hidden.value = p.key;
          input.value = p.nombre;
          dropdown.classList.remove('open');
          onSelect(p.key);
        });
        dropdown.appendChild(div);
      });
    }
  }

  input.addEventListener('focus', () => {
    renderOpciones(input.value);
    dropdown.classList.add('open');
  });

  input.addEventListener('input', () => {
    renderOpciones(input.value);
    dropdown.classList.add('open');
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.classList.remove('open');
      // Si el texto no coincide exactamente con la selección actual, restaurar
      const actual = pacientesOpciones.find(p => p.key === hidden.value);
      if (actual) input.value = actual.nombre;
    }, 150);
  });

  // Inicializar con el valor por defecto
  const defecto = pacientesOpciones.find(p => p.key === hidden.value);
  if (defecto) input.value = defecto.nombre;
}

/**
 * Agrega un nuevo paciente a las opciones de búsqueda
 * @param {Array} pacientesOpciones - Array de opciones de pacientes
 * @param {string} key - Key única del paciente
 * @param {string} nombre - Nombre del paciente
 */
export function agregarPacienteOpciones(pacientesOpciones, key, nombre) {
  pacientesOpciones.push({ key, nombre });
}
