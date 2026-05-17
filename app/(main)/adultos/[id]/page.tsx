'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import styles from '@/app/styles/componentes.module.css'
import utilStyles from '@/app/styles/utilities.module.css'

interface Adulto {
  id: number
  nombre: string
  cedula: string
  fecha_nacimiento: string
  sexo: string
  estado_civil: string
  telefono: string
  pension_ivm: boolean
  provincia: string
  canton: string
  distrito: string
  barrio: string
  familiar_nombre: string
  familiar_cedula: string
  familiar_telefono: string
  familiar_direccion: string
  emergencia_nombre: string
  emergencia_telefono: string
}

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function getIniciales(nombre: string): string {
  const partes = nombre.trim().split(' ')
  return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase()
}

export default function PerfilPage() {
  const router = useRouter()
  const params = useParams()
  const [adulto, setAdulto] = useState<Adulto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/adultos/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setAdulto(data.adulto)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div className={utilStyles.page}><p className={utilStyles.muted}>Cargando...</p></div>
  if (!adulto) return <div className={utilStyles.page}><p className={utilStyles.muted}>Paciente no encontrado.</p></div>

  const direccion = [adulto.provincia, adulto.canton, adulto.distrito].filter(Boolean).join(', ')

  return (
    <div className={utilStyles.page}>

      <div className={utilStyles.row} style={{ marginBottom: '1.25rem' }}>
        <button className={styles.btnSm} onClick={() => router.push('/adultos')}>← Volver</button>
        <h2>Perfil del paciente</h2>
      </div>

      <div className={styles.card} style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className={`${styles.personAvatar} ${styles.avatarGreen}`} style={{ width: '48px', height: '48px', fontSize: '16px' }}>
              {getIniciales(adulto.nombre)}
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 500 }}>{adulto.nombre}</p>
              <p style={{ fontSize: '13px', color: '#888780' }}>
                {calcularEdad(adulto.fecha_nacimiento)} años · {adulto.sexo} · {adulto.estado_civil}
              </p>
            </div>
          </div>
          <button
            className={styles.btnSm}
            style={{ color: '#C9A84C', borderColor: '#C9A84C' }}
            onClick={() => router.push(`/adultos/${adulto.id}/editar`)}
          >
            Editar
          </button>
        </div>

        <div style={{ borderTop: '0.5px solid #dddbd2', marginTop: '1rem', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div><p style={{ fontSize: '12px', color: '#888780' }}>Cédula</p><p style={{ fontSize: '13px' }}>{adulto.cedula}</p></div>
          <div><p style={{ fontSize: '12px', color: '#888780' }}>Fecha de nacimiento</p><p style={{ fontSize: '13px' }}>{formatFecha(adulto.fecha_nacimiento)}</p></div>
          <div><p style={{ fontSize: '12px', color: '#888780' }}>Estado civil</p><p style={{ fontSize: '13px' }}>{adulto.estado_civil}</p></div>
          <div><p style={{ fontSize: '12px', color: '#888780' }}>Teléfono</p><p style={{ fontSize: '13px' }}>{adulto.telefono || '—'}</p></div>
          <div><p style={{ fontSize: '12px', color: '#888780' }}>Pensión IVM</p><p style={{ fontSize: '13px' }}>{adulto.pension_ivm ? 'Sí' : 'No'}</p></div>
          <div><p style={{ fontSize: '12px', color: '#888780' }}>Dirección</p><p style={{ fontSize: '13px' }}>{direccion || '—'}</p></div>
          {adulto.barrio && <div><p style={{ fontSize: '12px', color: '#888780' }}>Barrio</p><p style={{ fontSize: '13px' }}>{adulto.barrio}</p></div>}
        </div>
      </div>

      <div className={utilStyles.grid2} style={{ marginBottom: '10px' }}>
        <div className={styles.cardSm}>
          <p className={utilStyles.sectionLabel}>Familiar solicitante</p>
          <p style={{ fontSize: '13px', fontWeight: 500 }}>{adulto.familiar_nombre || '—'}</p>
          <p style={{ fontSize: '12px', color: '#888780' }}>
            {adulto.familiar_cedula ? `Cédula: ${adulto.familiar_cedula} · ` : ''}
            {adulto.familiar_telefono ? `Tel: ${adulto.familiar_telefono}` : ''}
          </p>
        </div>
        <div className={styles.cardSm}>
          <p className={utilStyles.sectionLabel}>Contacto de emergencia</p>
          <p style={{ fontSize: '13px', fontWeight: 500 }}>{adulto.emergencia_nombre || '—'}</p>
          <p style={{ fontSize: '12px', color: '#888780' }}>
            {adulto.emergencia_telefono ? `Tel: ${adulto.emergencia_telefono}` : ''}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className={styles.btnSm}
          style={{ color: '#14B8A6', borderColor: '#14B8A6' }}
          onClick={() => router.push(`/historial?id=${adulto.id}`)}
        >
          Ver historial
        </button>
        <button
          className={styles.btnSm}
          style={{ color: '#14B8A6', borderColor: '#14B8A6' }}
          onClick={() => router.push(`/medicamentos?id=${adulto.id}`)}
        >
          Ver medicamentos
        </button>
      </div>

    </div>
  )
}