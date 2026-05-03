/* ============================================================
   AUTH - Gestión de autenticación (login/logout)
   ============================================================ */

import { setActiveNav, showPage } from './navigation.js';

/**
 * Inicializa los event listeners de autenticación
 */
export function initAuth() {
  // Login
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', handleLogin);
  }

  const loginPass = document.getElementById('login-pass');
  if (loginPass) {
    loginPass.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    });
  }

  // Cerrar sesión
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', handleLogout);
  }

  // Salir móvil
  const btnSalirMovil = document.getElementById('btn-salir-movil');
  if (btnSalirMovil) {
    btnSalirMovil.addEventListener('click', handleLogout);
  }
}

/**
 * Maneja el proceso de login
 */
function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');

  if (email && pass) {
    err.style.display = 'none';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    setActiveNav('dashboard');
    showPage('dashboard');
  } else {
    err.style.display = 'block';
  }
}

/**
 * Maneja el proceso de logout
 */
function handleLogout() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').style.display = 'none';
  setActiveNav('dashboard');
  showPage('dashboard');
}
