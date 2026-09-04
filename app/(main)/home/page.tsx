'use client'
import { useCallback, useEffect, useState } from 'react'
import styles from '@/app/styles/componentes.module.css'
import utilStyles from '@/app/styles/utilities.module.css'
import ErrorState from '@/app/(main)/components/ErrorState'
import { obtenerMomentoActualCR, formatearHoraCR } from '@/lib/fecha'

interface Prescripcion {
  nombre_medicamento: string
  dosis: string | null
  indicaciones: string | null
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

const MOMENTOS_DIA: { key: keyof Prescripcion; label: string }[] = [
  { key: 'ayunas',        label: 'Ayunas' },
  { key: 'desayuno',      label: 'Desayuno' },
  { key: 'media_manana',  label: 'M. mañana' },
  { key: 'almuerzo',      label: 'Almuerzo' },
  { key: 'merienda_tarde', label: 'M. tarde' },
  { key: 'cena',          label: 'Cena' },
  { key: 'acostarse',     label: 'Acostarse' },
]

function nombreConDosis(pr: Prescripcion): string {
  return `${pr.nombre_medicamento}${pr.dosis ? ` ${pr.dosis}` : ''}`
}

export default function HomePage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null)

  const cargarDashboard = useCallback((silencioso = false) => {
    fetch('/api/dashboard')
      .then(async res => {
        if (!res.ok) throw new Error('No se pudo cargar el panel de inicio.')
        return res.json()
      })
      .then(data => {
        setPacientes(data.pacientes || [])
        setUltimaActualizacion(formatearHoraCR())
      })
      .catch(() => {
        // En el refresco silencioso no se pisa el panel con un error por una falla de red pasajera,
        // se mantienen los últimos datos buenos y se reintenta solo en el próximo ciclo.
        if (!silencioso) {
          setError('Ocurrió un error cargando el panel de inicio. Intentá de nuevo.')
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    cargarDashboard()
  }, [cargarDashboard])

  useEffect(() => {
    const intervalo = setInterval(() => cargarDashboard(true), 10 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [cargarDashboard])

  const reintentarCargarDashboard = () => {
    setLoading(true)
    setError(null)
    cargarDashboard()
  }

  const fecha = () => {
    const formatter = new Intl.DateTimeFormat('es-CR', {
      timeZone: 'America/Costa_Rica',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    const partes = Object.fromEntries(formatter.formatToParts(new Date()).map(p => [p.type, p.value]))
    return `Resumen del día — ${partes.weekday} ${partes.day} de ${partes.month}`
  }

  const totalPacientes = pacientes.length
  const conMeds = pacientes.filter(p => p.prescripciones.length > 0).length
  const totalDosis = pacientes.reduce((acc, p) => {
    return acc + p.prescripciones.reduce((a, pr) => {
      return a + [pr.ayunas, pr.desayuno, pr.media_manana, pr.almuerzo, pr.merienda_tarde, pr.cena, pr.acostarse].filter(Boolean).length
    }, 0)
  }, 0)

  const pacientesConMedsHoy = pacientes.filter(p => p.prescripciones.length > 0)
  const momentoActual = obtenerMomentoActualCR()
  const dosisAhora = momentoActual
    ? pacientes.reduce((acc, p) => acc + p.prescripciones.filter(pr => pr[momentoActual]).length, 0)
    : 0

  return (
      <div className={utilStyles.page}>
      <div className={styles.homeLogoWrap}>
        <img
          src="/logoPAM.jpeg"
          alt="Logo PAM"
          width={1800}
          height={1200}
          className={styles.homeLogo}
        />
      </div>
      <h2 className={utilStyles.mb1}>Panel de inicio</h2>
      <p className={utilStyles.muted} style={{ fontSize: '13px', marginBottom: '1.25rem' }}>{fecha()}</p>

      {error && (
        <ErrorState
          title="Error al cargar el panel de inicio"
          description={error}
          actionLabel="Reintentar"
          onAction={reintentarCargarDashboard}
        />
      )}

      {/* Métricas */}
      <div className={utilStyles.grid3} style={{ marginBottom: '1.25rem' }}>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Personas registradas</p>
          <p className={styles.metricValue}>{loading || error ? '—' : totalPacientes}</p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Con medicamentos hoy</p>
          <p className={styles.metricValue}>{loading || error ? '—' : conMeds}</p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Dosis programadas</p>
          <p className={styles.metricValue}>{loading || error ? '—' : totalDosis}</p>
          {!loading && !error && dosisAhora > 0 && (
            <p className={styles.metricSubValue}>{dosisAhora} ahora mismo</p>
          )}
        </div>
      </div>

      {/* Medicamentos de hoy */}
      <div className={styles.tableWrap}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '0.5px solid #dddbd2', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Medicamentos de hoy</p>
          {ultimaActualizacion && (
            <p style={{ fontSize: '11px', color: '#6b6a63' }}>Actualizado a las {ultimaActualizacion}</p>
          )}
        </div>
        <div style={{ padding: '0 1.25rem' }}>
          {loading ? (
            <p style={{ fontSize: '14px', textAlign: 'center', color: '#6b6a63', padding: '2rem 0' }}>Cargando...</p>
          ) : error ? (
            <p style={{ fontSize: '14px', textAlign: 'center', color: '#6b6a63', padding: '2rem 0' }}>No se pudo cargar la información.</p>
          ) : pacientesConMedsHoy.length === 0 ? (
            <p style={{ fontSize: '14px', textAlign: 'center', color: '#6b6a63', padding: '2rem 0' }}>No hay medicamentos programados para hoy.</p>
          ) : pacientesConMedsHoy.map((paciente, i) => (
            <div key={i} className={styles.medsPaciente}>
              <p className={styles.medsPacienteNombre}>{paciente.nombre}</p>
              <ul className={styles.medsList}>
                {paciente.prescripciones.map((pr, j) => (
                  <li key={j} className={styles.medsItem}>
                    <span className={styles.medsItemNombre}>{nombreConDosis(pr)}</span>
                    <div className={styles.medsMomentosRow}>
                      {MOMENTOS_DIA.filter(m => pr[m.key]).map(m => (
                        <span
                          key={m.key}
                          className={`${styles.medsMomentoBadge} ${m.key === momentoActual ? styles.medsMomentoBadgeActual : ''}`}
                          title={m.key === momentoActual ? `${m.label} — momento actual` : undefined}
                        >
                          {m.label}
                        </span>
                      ))}
                    </div>
                    {pr.indicaciones && (
                      <p className={styles.medsItemIndicacion}>{pr.indicaciones}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}