'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/app/styles/componentes.module.css'
import utilStyles from '@/app/styles/utilities.module.css'
import modalStyles from '@/app/styles/modals.module.css'

interface Adulto {
  id: number
  nombre: string
  cedula: string
  fecha_nacimiento: string
  sexo: string
  prescripciones: { id: number }[]
  historial_salud: { id: number }[]
}

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function getIniciales(nombre: string): string {
  const partes = nombre.trim().split(' ')
  return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase()
}

const coloresAvatar = ['avatarGreen', 'avatarGreen', 'avatarYellow']

export default function AdultosPage() {
  const router = useRouter()
  const [adultos, setAdultos] = useState<Adulto[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState(false)
  const [adultoAEliminar, setAdultoAEliminar] = useState<Adulto | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/adultos')
      .then(res => res.json())
      .then(data => {
        setAdultos(data.adultos || [])
        setLoading(false)
      })
  }, [])

  const filtrados = adultos.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.cedula.includes(busqueda)
  )

  const handleEliminar = async () => {
    if (!adultoAEliminar) return
    setEliminando(true)

    try {
      const res = await fetch(`/api/adultos/${adultoAEliminar.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        setAdultos(prev => prev.filter(a => a.id !== adultoAEliminar.id))
        setToast(`${adultoAEliminar.nombre} fue eliminado correctamente.`)
        setTimeout(() => setToast(null), 3000)
        setAdultoAEliminar(null)
      }
    } catch (error) {
      console.error('Error eliminando:', error)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className={utilStyles.page}>
      <div className={utilStyles.mb2}>
        <h2>Adultos mayores</h2>
        <p className={utilStyles.muted} style={{ fontSize: '13px', marginTop: '4px' }}>
          {loading ? '...' : `${adultos.length} persona${adultos.length !== 1 ? 's' : ''} registrada${adultos.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Buscador + botón */}
      <div className={styles.searchAccion}>
        <div className={styles.pacSearchWrap} style={{ flex: 1 }}>
          <svg className={styles.pacIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className={styles.pacInput}
            placeholder="Buscar por nombre o cédula..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <button
          onClick={() => router.push('/adultos/nuevo')}
          style={{ color: '#C9A84C', borderColor: '#C9A84C', whiteSpace: 'nowrap' }}
        >
          + Nuevo registro
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <p className={utilStyles.muted} style={{ fontSize: '13px' }}>Cargando...</p>
      ) : filtrados.length === 0 ? (
        <p className={utilStyles.muted} style={{ fontSize: '13px' }}>No se encontraron resultados.</p>
      ) : (
        filtrados.map((adulto, i) => (
          <div key={adulto.id} className={styles.personItem}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className={`${styles.personAvatar} ${styles[coloresAvatar[i % 3]]}`}>
                {getIniciales(adulto.nombre)}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>{adulto.nombre}</p>
                <p style={{ fontSize: '12px', color: '#888780' }}>
                  Cédula: {adulto.cedula} · {calcularEdad(adulto.fecha_nacimiento)} años
                </p>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {adulto.prescripciones.length > 0 && (
                    <span className={styles.badgeGreen}>{adulto.prescripciones.length} med{adulto.prescripciones.length !== 1 ? 's.' : '.'}</span>
                  )}
                  {adulto.historial_salud.length > 0
                    ? <span className={styles.badgeGreen}>Con historial</span>
                    : <span className={styles.badgeYellow}>Sin historial</span>
                  }
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={styles.btnSm}
                onClick={() => router.push(`/adultos/${adulto.id}`)}
              >
                Ver
              </button>
              <button
                className={styles.btnSm}
                style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                onClick={() => setAdultoAEliminar(adulto)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles.toastSuccess}`}>
          {toast}
        </div>
      )}

      {/* Modal eliminar */}
      {adultoAEliminar && (
        <div className={`${modalStyles.overlay} ${modalStyles.overlayOpen}`}>
          <div className={modalStyles.modalContentDanger}>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              ¿Eliminar paciente?
            </p>
            <p style={{ fontSize: '13px', color: '#888780', marginBottom: '1.25rem' }}>
              Esta acción eliminará a <strong>{adultoAEliminar.nombre}</strong> junto con todo su historial y medicamentos. No se puede deshacer.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className={styles.btnSm}
                onClick={() => setAdultoAEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                className={styles.btnSm}
                style={{ background: '#b91c1c', color: '#fff', borderColor: '#b91c1c' }}
                onClick={handleEliminar}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}