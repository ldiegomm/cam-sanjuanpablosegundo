'use client'
import { useEffect, useState } from 'react'
import styles from '@/app/styles/componentes.module.css'
import utilStyles from '@/app/styles/utilities.module.css'

interface Prescripcion {
  nombre_medicamento: string
  ayunas: boolean
  desayuno: boolean
  media_manana: boolean
  almuerzo: boolean
  merienda_tarde: boolean
  cena: boolean
  acostarse: boolean
}

interface Paciente {
  nombre: string
  prescripciones: Prescripcion[]
}

export default function HomePage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setPacientes(data.pacientes || [])
        setLoading(false)
      })
  }, [])

  const fecha = () => {
    const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    const hoy = new Date()
    return `Resumen del día — ${dias[hoy.getDay()]} ${hoy.getDate()} de ${meses[hoy.getMonth()]}`
  }

  const totalPacientes = pacientes.length
  const conMeds = pacientes.filter(p => p.prescripciones.length > 0).length
  const totalDosis = pacientes.reduce((acc, p) => {
    return acc + p.prescripciones.reduce((a, pr) => {
      return a + [pr.ayunas, pr.desayuno, pr.media_manana, pr.almuerzo, pr.merienda_tarde, pr.cena, pr.acostarse].filter(Boolean).length
    }, 0)
  }, 0)

  const check = (val: boolean) => val
    ? <span className={styles.check}>✓</span>
    : <span className={styles.dash}>—</span>

  return (
      <div className={utilStyles.page}>
      <h2 className={utilStyles.mb1}>Panel de inicio</h2>
      <p className={utilStyles.muted} style={{ fontSize: '13px', marginBottom: '1.25rem' }}>{fecha()}</p>

      {/* Métricas */}
      <div className={utilStyles.grid3} style={{ marginBottom: '1.25rem' }}>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Personas registradas</p>
          <p className={styles.metricValue}>{loading ? '—' : totalPacientes}</p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Con medicamentos hoy</p>
          <p className={styles.metricValue}>{loading ? '—' : conMeds}</p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Dosis programadas</p>
          <p className={styles.metricValue}>{loading ? '—' : totalDosis}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className={styles.tableWrap}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #dddbd2' }}>
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Horario de medicamentos del día</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Persona</th>
              <th>Ayunas</th>
              <th>Desayuno</th>
              <th>M. mañana</th>
              <th>Almuerzo</th>
              <th>M. tarde</th>
              <th>Cena</th>
              <th>Acostarse</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888780', padding: '2rem' }}>Cargando...</td></tr>
            ) : pacientes.filter(p => p.prescripciones.length > 0).map((paciente, i) => {
              const horarios = paciente.prescripciones.reduce((acc, pr) => ({
                ayunas:       acc.ayunas || pr.ayunas,
                desayuno:     acc.desayuno || pr.desayuno,
                media_manana: acc.media_manana || pr.media_manana,
                almuerzo:     acc.almuerzo || pr.almuerzo,
                merienda_tarde: acc.merienda_tarde || pr.merienda_tarde,
                cena:         acc.cena || pr.cena,
                acostarse:    acc.acostarse || pr.acostarse,
              }), { ayunas: false, desayuno: false, media_manana: false, almuerzo: false, merienda_tarde: false, cena: false, acostarse: false })

              return (
                <tr key={i}>
                  <td>{paciente.nombre}</td>
                  <td>{check(horarios.ayunas)}</td>
                  <td>{check(horarios.desayuno)}</td>
                  <td>{check(horarios.media_manana)}</td>
                  <td>{check(horarios.almuerzo)}</td>
                  <td>{check(horarios.merienda_tarde)}</td>
                  <td>{check(horarios.cena)}</td>
                  <td>{check(horarios.acostarse)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}