/* ============================================================
   UTILS - Funciones utilitarias
   ============================================================ */

/**
 * Muestra un mensaje toast temporal
 * @param {string} msg - Mensaje a mostrar
 * @param {string} type - Tipo de toast: 'success' o 'error'
 */
export function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = (type === 'success' ? '✓  ' : '✗  ') + msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity 0.3s';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

/**
 * Actualiza el contador de pacientes
 */
export function updateCounter() {
  const count = document.querySelectorAll('#lista-adultos .person-item').length;
  const s = count !== 1;
  document.getElementById('adultos-contador').textContent = 
    count + ' persona' + (s ? 's' : '') + ' registrada' + (s ? 's' : '');
  document.getElementById('dashboard-total').textContent = count;
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 * @param {string} nacimiento - Fecha de nacimiento en formato YYYY-MM-DD
 * @returns {number|null} Edad en años o null si no hay fecha
 */
export function calcEdad(nacimiento) {
  if (!nacimiento) return null;
  return new Date().getFullYear() - new Date(nacimiento).getFullYear();
}

/**
 * Inicializa la fecha en el dashboard
 */
export function initFecha() {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const hoy = new Date();
  document.getElementById('dashboard-fecha').textContent =
    'Resumen del día — ' + dias[hoy.getDay()] + ' ' + hoy.getDate() + ' de ' + meses[hoy.getMonth()];
}
