'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import styles from '@/app/styles/componentes.module.css'
import utilStyles from '@/app/styles/utilities.module.css'

export default function EditarPage() {
  const router = useRouter()
  const params = useParams()
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [mismoFamiliar, setMismoFamiliar] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    fecha_nacimiento: '',
    sexo: '',
    estado_civil: '',
    telefono: '',
    pension_ivm: '',
    provincia: '',
    canton: '',
    distrito: '',
    barrio: '',
    familiar_nombre: '',
    familiar_cedula: '',
    familiar_telefono: '',
    familiar_direccion: '',
    emergencia_nombre: '',
    emergencia_telefono: '',
  })

  useEffect(() => {
    fetch(`/api/adultos/${params.id}`)
      .then(async res => {
        if (!res.ok) throw new Error('No se pudo cargar el registro.')
        return res.json()
      })
      .then(data => {
        const a = data.adulto
        if (!a) {
          throw new Error('No se pudo cargar el registro.')
        }
        setForm({
          nombre:              a.nombre || '',
          cedula:              a.cedula || '',
          fecha_nacimiento:    a.fecha_nacimiento || '',
          sexo:                a.sexo || '',
          estado_civil:        a.estado_civil || '',
          telefono:            a.telefono || '',
          pension_ivm:         a.pension_ivm ? 'Sí' : 'No',
          provincia:           a.provincia || '',
          canton:              a.canton || '',
          distrito:            a.distrito || '',
          barrio:              a.barrio || '',
          familiar_nombre:     a.familiar_nombre || '',
          familiar_cedula:     a.familiar_cedula || '',
          familiar_telefono:   a.familiar_telefono || '',
          familiar_direccion:  a.familiar_direccion || '',
          emergencia_nombre:   a.emergencia_nombre || '',
          emergencia_telefono: a.emergencia_telefono || '',
        })
      })
      .catch(() => {
        setLoadError('No se pudo cargar el registro del paciente. Por favor, intentá de nuevo.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [params.id])

  const set = (campo: string, valor: string) =>
    setForm(prev => ({ ...prev, [campo]: valor }))

  const handleMismoFamiliar = (checked: boolean) => {
    setMismoFamiliar(checked)
    if (checked) {
      setForm(prev => ({
        ...prev,
        emergencia_nombre:   prev.familiar_nombre,
        emergencia_telefono: prev.familiar_telefono,
      }))
    } else {
      setForm(prev => ({
        ...prev,
        emergencia_nombre:   '',
        emergencia_telefono: '',
      }))
    }
  }

  const handleGuardar = async () => {
    setError('')

    if (!form.nombre.trim() || !form.cedula.trim() || !form.fecha_nacimiento || !form.sexo) {
      setError('Los campos Nombre, Cédula, Fecha de nacimiento y Sexo son obligatorios.')
      return
    }

    setGuardando(true)

    try {
      const res = await fetch(`/api/adultos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pension_ivm: form.pension_ivm === 'Sí'
        })
      })

      const data = await res.json()

      if (data.success) {
        setToast('Registro actualizado exitosamente.')
        setTimeout(() => {
          router.push(`/adultos/${params.id}`)
        }, 2000)
      } else {
        setError(data.message || 'Error al actualizar el registro.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div className={utilStyles.page}><p className={utilStyles.muted}>Cargando...</p></div>

  if (loadError) {
    return (
      <div className={utilStyles.page}>
        <div className={utilStyles.row} style={{ marginBottom: '1.25rem' }}>
          <button className={styles.btnSm} onClick={() => router.push(`/adultos/${params.id}`)}>← Volver</button>
          <h2>Editar paciente</h2>
        </div>
        <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: '8px', padding: '8px 12px' }}>
          {loadError}
        </div>
      </div>
    )
  }

  return (
    <div className={utilStyles.page}>

      <div className={utilStyles.row} style={{ marginBottom: '1.25rem' }}>
        <button className={styles.btnSm} onClick={() => router.push(`/adultos/${params.id}`)}>← Volver</button>
        <h2>Editar paciente</h2>
      </div>

      {error && (
        <div style={{ fontSize: '12px', color: '#b91c1c', background: '#fee2e2', border: '0.5px solid #fca5a5', borderRadius: '8px', padding: '8px 12px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Datos personales */}
      <div className={styles.card} style={{ marginBottom: '10px' }}>
        <p className={utilStyles.sectionLabel}>Datos personales</p>
        <div className={utilStyles.gridForm} style={{ marginBottom: '10px' }}>
          <div>
            <label htmlFor="adulto-nombre">Nombre completo <span style={{ color: '#b91c1c' }}>*</span></label>
            <input id="adulto-nombre" type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          </div>
          <div>
            <label htmlFor="adulto-cedula">Número de cédula <span style={{ color: '#b91c1c' }}>*</span></label>
            <input id="adulto-cedula" type="text" value={form.cedula} onChange={e => set('cedula', e.target.value)} />
          </div>
          <div>
            <label htmlFor="adulto-fecha-nacimiento">Fecha de nacimiento <span style={{ color: '#b91c1c' }}>*</span></label>
            <input id="adulto-fecha-nacimiento" type="date" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} />
          </div>
          <div>
            <label htmlFor="adulto-sexo">Sexo <span style={{ color: '#b91c1c' }}>*</span></label>
            <select id="adulto-sexo" value={form.sexo} onChange={e => set('sexo', e.target.value)}>
              <option value="">Seleccionar</option>
              <option>Masculino</option>
              <option>Femenino</option>
            </select>
          </div>
          <div>
            <label htmlFor="adulto-estado-civil">Estado civil</label>
            <select id="adulto-estado-civil" value={form.estado_civil} onChange={e => set('estado_civil', e.target.value)}>
              <option value="">Seleccionar</option>
              <option>Soltero/a</option>
              <option>Casado/a</option>
              <option>Viudo/a</option>
              <option>Divorciado/a</option>
            </select>
          </div>
          <div>
            <label htmlFor="adulto-telefono">Teléfono</label>
            <input id="adulto-telefono" type="text" value={form.telefono} onChange={e => set('telefono', e.target.value)} />
          </div>
          <div>
            <label htmlFor="adulto-pension-ivm">Recibe pensión IVM</label>
            <select id="adulto-pension-ivm" value={form.pension_ivm} onChange={e => set('pension_ivm', e.target.value)}>
              <option value="">Seleccionar</option>
              <option>Sí</option>
              <option>No</option>
            </select>
          </div>
        </div>
        <div>
          <label id="adulto-direccion-label">Dirección</label>
          <div className={utilStyles.grid3cols} style={{ marginBottom: '8px' }} role="group" aria-labelledby="adulto-direccion-label">
            <input type="text" placeholder="Provincia" aria-label="Provincia" value={form.provincia} onChange={e => set('provincia', e.target.value)} />
            <input type="text" placeholder="Cantón" aria-label="Cantón" value={form.canton} onChange={e => set('canton', e.target.value)} />
            <input type="text" placeholder="Distrito" aria-label="Distrito" value={form.distrito} onChange={e => set('distrito', e.target.value)} />
          </div>
          <input type="text" placeholder="Barrio" aria-label="Barrio" value={form.barrio} onChange={e => set('barrio', e.target.value)} />
        </div>
      </div>

      {/* Familiar solicitante */}
      <div className={styles.card} style={{ marginBottom: '10px' }}>
        <p className={utilStyles.sectionLabel}>Familiar solicitante</p>
        <div className={utilStyles.gridForm}>
          <div>
            <label htmlFor="familiar-nombre">Nombre completo</label>
            <input id="familiar-nombre" type="text" value={form.familiar_nombre} onChange={e => set('familiar_nombre', e.target.value)} />
          </div>
          <div>
            <label htmlFor="familiar-cedula">Cédula</label>
            <input id="familiar-cedula" type="text" value={form.familiar_cedula} onChange={e => set('familiar_cedula', e.target.value)} />
          </div>
          <div>
            <label htmlFor="familiar-telefono">Teléfono</label>
            <input id="familiar-telefono" type="text" value={form.familiar_telefono} onChange={e => set('familiar_telefono', e.target.value)} />
          </div>
          <div>
            <label htmlFor="familiar-direccion">Dirección</label>
            <input id="familiar-direccion" type="text" value={form.familiar_direccion} onChange={e => set('familiar_direccion', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contacto de emergencia */}
      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        <p className={utilStyles.sectionLabel}>Contacto de emergencia</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <input
            type="checkbox"
            id="mismo-familiar"
            checked={mismoFamiliar}
            onChange={e => handleMismoFamiliar(e.target.checked)}
            style={{ width: 'auto', cursor: 'pointer' }}
          />
          <label htmlFor="mismo-familiar" style={{ cursor: 'pointer', marginBottom: 0 }}>
            Es el mismo que el familiar solicitante
          </label>
        </div>
        <div className={utilStyles.gridForm}>
          <div>
            <label htmlFor="emergencia-nombre">Nombre completo</label>
            <input id="emergencia-nombre" type="text" value={form.emergencia_nombre} onChange={e => set('emergencia_nombre', e.target.value)} />
          </div>
          <div>
            <label htmlFor="emergencia-telefono">Teléfono</label>
            <input id="emergencia-telefono" type="text" value={form.emergencia_telefono} onChange={e => set('emergencia_telefono', e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingBottom: '1rem' }}>
        <button onClick={() => router.push(`/adultos/${params.id}`)}>Cancelar</button>
        <button
          className={styles.btnSuccess}
          onClick={handleGuardar}
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {toast && (
        <div className={`${styles.toast} ${styles.toastSuccess}`}>
          {toast}
        </div>
      )}

    </div>
  )
}