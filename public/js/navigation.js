/* ============================================================
   NAVIGATION - Gestión de navegación entre páginas
   ============================================================ */

const pages = ['dashboard', 'adultos', 'nuevo', 'perfil', 'historial', 'medicamentos'];

/**
 * Muestra una página específica
 * @param {string} name - Nombre de la página a mostrar
 */
export function showPage(name) {
  pages.forEach(p => {
    const pageEl = document.getElementById('page-' + p);
    if (pageEl) {
      pageEl.classList.toggle('active', p === name);
    }
  });
}

/**
 * Establece el elemento de navegación activo
 * @param {string} page - Nombre de la página
 */
export function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const m = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (m) m.classList.add('active');
}

/**
 * Inicializa los event listeners de navegación
 * @param {Function} checkUnsaved - Función para verificar cambios sin guardar
 */
export function initNavigation(checkUnsaved) {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    const clone = item.cloneNode(true);
    item.parentNode.replaceChild(clone, item);
    
    clone.addEventListener('click', () => {
      const action = () => {
        setActiveNav(clone.dataset.page);
        showPage(clone.dataset.page);
        if (window.setUnsaved) window.setUnsaved(false);
      };
      
      if (checkUnsaved && checkUnsaved(action)) return;
      action();
    });
  });
}

/**
 * Muestra u oculta el botón de salir en móvil según el tamaño de pantalla
 */
export function checkMobile() {
  const isMobile = window.innerWidth <= 700;
  const btnSalir = document.getElementById('btn-salir-movil');
  if (btnSalir) {
    btnSalir.style.display = isMobile ? 'flex' : 'none';
  }
}
