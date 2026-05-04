/* ============================================================
   DASHBOARD - Panel de inicio
   ============================================================ */

import { medsDatos, personasLista } from './data.js';

/**
 * Renderiza el dashboard con los medicamentos del día
 */
export function renderDashboard() {
  const tbody = document.getElementById('dashboard-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  let totalDosis = 0;
  let conMeds = 0;

  personasLista.forEach(p => {
    const meds = medsDatos[p.key] || [];
    if (meds.length === 0) return; // no mostrar personas sin medicamentos
    conMeds++;

    // Para cada slot, recopilar nombres de meds que aplican
    const slots = Array.from({ length: 7 }, (_, i) =>
      meds.filter(m => m.horarios[i]).map(m => m.nombre.split(' ')[0])
    );
    totalDosis += slots.reduce((acc, s) => acc + s.length, 0);

    const celdas = slots.map(s =>
      s.length > 0
        ? s.map(n => `<span class="badge-green">${n}</span>`).join('<br>')
        : '<span class="dash">—</span>'
    ).join('</td><td>');

    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${p.nombre}</strong></td><td>${celdas}</td>`;
    tbody.appendChild(tr);
  });

  // Si no hay nadie con medicamentos
  if (tbody.rows.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="8" style="text-align:center;padding:1.5rem;color:#888780;font-size:13px;">No hay medicamentos registrados.</td>';
    tbody.appendChild(tr);
  }

  const dashboardConMeds = document.getElementById('dashboard-con-meds');
  const dashboardDosis = document.getElementById('dashboard-dosis');
  
  if (dashboardConMeds) dashboardConMeds.textContent = conMeds;
  if (dashboardDosis) dashboardDosis.textContent = totalDosis;
  
  // Actualizar badges de pacientes
  if (window.renderBadgesPacientes) window.renderBadgesPacientes();
}

/**
 * Renderiza los badges en las tarjetas de pacientes
 */
export function renderBadgesPacientes() {
  document.querySelectorAll('#lista-adultos .person-item').forEach(item => {
    const nombre = item.dataset.nombre || item.querySelector('p').textContent;
    const badgesEl = item.querySelector('.pac-badges');
    if (!badgesEl) return;
    
    // Buscar key del paciente
    const op = window.pacientesOpciones.find(p => p.nombre === nombre);
    const key = op ? op.key : null;
    const meds = key && medsDatos[key] ? medsDatos[key].length : 0;
    const tieneHistorial = key && window.historialDatos[key] && window.historialDatos[key].tieneData;
    
    badgesEl.innerHTML = '';
    
    // Badge medicamentos
    const bMed = document.createElement('span');
    bMed.style.cssText = 'font-size:10px;padding:2px 7px;border-radius:99px;font-weight:500;';
    if (meds > 0) {
      bMed.style.background = '#d1fae5';
      bMed.style.color = '#1D9E75';
      bMed.textContent = meds + ' med' + (meds !== 1 ? 's.' : '.');
    } else {
      bMed.style.background = '#f0f0ee';
      bMed.style.color = '#888780';
      bMed.textContent = 'Sin meds.';
    }
    badgesEl.appendChild(bMed);
    
    // Badge historial
    const bHist = document.createElement('span');
    bHist.style.cssText = 'font-size:10px;padding:2px 7px;border-radius:99px;font-weight:500;';
    if (tieneHistorial) {
      bHist.style.background = '#FBF3DC';
      bHist.style.color = '#7A5C1E';
      bHist.textContent = 'Con historial';
    } else {
      bHist.style.background = '#f0f0ee';
      bHist.style.color = '#888780';
      bHist.textContent = 'Sin historial';
    }
    badgesEl.appendChild(bHist);
  });
}
