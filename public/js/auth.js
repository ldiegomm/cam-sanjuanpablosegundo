/* ============================================================
   AUTH - Gestión de autenticación (logout)
   ============================================================ */

/**
 * Muestra el nombre del usuario activo en el div #activeUser.
 */
async function renderActiveUser() {
  const container = document.getElementById('activeUser')
  if (!container) return

  try {
    const response = await fetch('/api/auth/me', { method: 'GET' })
    if (!response.ok) return

    const data = await response.json()
    const session = data?.usuario
    if (!session) return

    // Actualizar el texto del nombre (primer <p> dentro del div)
    const nombreEl = container.querySelector('p:first-child')
    if (nombreEl) {
      nombreEl.textContent = session.username || 'Usuario'
    }

    // Actualizar avatar con la primera letra del usuario
    const avatar = container.closest('.sidebar-footer-inner')?.querySelector('.avatar')
    if (avatar) {
      const name = session.username || 'U'
      avatar.textContent = name.charAt(0).toUpperCase()
    }
  } catch {
    // Si falla la consulta, dejar el valor por defecto
  }
}

/**
 * Inicializa los event listeners de autenticación
 */
export function initAuth() {
  renderActiveUser()

  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion')
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', handleLogout)
  }

  const btnSalirMovil = document.getElementById('btn-salir-movil')
  if (btnSalirMovil) {
    btnSalirMovil.addEventListener('click', handleLogout)
  }
}

/**
 * Llama al endpoint de logout y redirige al login de Next.js
 */
async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch (_) {
    // ignorar errores de red; redirigir de todas formas
  }
  window.location.href = '/login'
}
