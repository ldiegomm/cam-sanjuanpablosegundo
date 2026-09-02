'use client'

import { useEffect, useRef, useState } from 'react'
import styles from '@/app/styles/componentes.module.css'
import utilStyles from '@/app/styles/utilities.module.css'
import modalStyles from '@/app/styles/modals.module.css'
import ErrorState from '@/app/(main)/components/ErrorState'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SessionUser = {
  id: number | string
  nombre: string
  email: string
  rol: string
}

type Configuracion = {
  activo: boolean
  correo_destino: string | null
  domingo: boolean
  lunes: boolean
  martes: boolean
  miercoles: boolean
  jueves: boolean
  viernes: boolean
  sabado: boolean
}

type ConfiguracionForm = {
  activo: boolean
  correo_destino: string
  domingo: boolean
  lunes: boolean
  martes: boolean
  miercoles: boolean
  jueves: boolean
  viernes: boolean
  sabado: boolean
}

const DIAS_SEMANA: { key: keyof Omit<ConfiguracionForm, 'activo' | 'correo_destino'>; label: string; nombreCompleto: string }[] = [
  { key: 'lunes', label: 'Lu', nombreCompleto: 'Lunes' },
  { key: 'martes', label: 'Ma', nombreCompleto: 'Martes' },
  { key: 'miercoles', label: 'Mi', nombreCompleto: 'Miércoles' },
  { key: 'jueves', label: 'Ju', nombreCompleto: 'Jueves' },
  { key: 'viernes', label: 'Vi', nombreCompleto: 'Viernes' },
  { key: 'sabado', label: 'Sa', nombreCompleto: 'Sábado' },
  { key: 'domingo', label: 'Do', nombreCompleto: 'Domingo' },
]

const FORM_INICIAL: ConfiguracionForm = {
  activo: true,
  correo_destino: '',
  lunes: true,
  martes: true,
  miercoles: true,
  jueves: true,
  viernes: true,
  sabado: true,
  domingo: true,
}

export default function NotificacionesPage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ConfiguracionForm>(FORM_INICIAL)
  const [diasModo, setDiasModo] = useState<'todos' | 'especificos'>('todos')

  const [formError, setFormError] = useState<string | null>(null)
  const [formErrorAttempt, setFormErrorAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const titleRef = useRef<HTMLHeadingElement>(null)

  const isAdmin = String(currentUser?.rol || '').toLowerCase() === 'admin'

  useEffect(() => {
    fetch('/api/auth/session')
      .then(async (response) => {
        if (!response.ok) return null
        const data = await response.json() as { usuario?: SessionUser }
        return data.usuario ?? null
      })
      .then((usuario) => setCurrentUser(usuario))
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  const cargarConfiguracion = () => {
    fetch('/api/configuracion-notificaciones')
      .then(async (res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        const configuracion = data.configuracion as Configuracion | null
        if (configuracion) {
          setForm({
            activo: configuracion.activo,
            correo_destino: configuracion.correo_destino ?? '',
            lunes: configuracion.lunes,
            martes: configuracion.martes,
            miercoles: configuracion.miercoles,
            jueves: configuracion.jueves,
            viernes: configuracion.viernes,
            sabado: configuracion.sabado,
            domingo: configuracion.domingo,
          })
          setDiasModo(DIAS_SEMANA.every((d) => configuracion[d.key]) ? 'todos' : 'especificos')
        }
      })
      .catch((err) => {
        console.error(err)
        setError('Ocurrió un error cargando la configuración de notificaciones.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!checkingSession && isAdmin) {
      cargarConfiguracion()
    }
  }, [checkingSession, isAdmin])

  const reintentar = () => {
    setLoading(true)
    setError(null)
    cargarConfiguracion()
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (formError) {
      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formError, formErrorAttempt])

  const handleDiasModoChange = (modo: 'todos' | 'especificos') => {
    setDiasModo(modo)
    setForm((prev) => ({
      ...prev,
      lunes: modo === 'todos',
      martes: modo === 'todos',
      miercoles: modo === 'todos',
      jueves: modo === 'todos',
      viernes: modo === 'todos',
      sabado: modo === 'todos',
      domingo: modo === 'todos',
    }))
  }

  const handleGuardar = async () => {
    if (saving) return
    setFormErrorAttempt((n) => n + 1)

    const correo = form.correo_destino.trim()

    if (correo && !EMAIL_REGEX.test(correo)) {
      setFormError('Ingresá un correo electrónico válido.')
      return
    }

    if (form.activo && diasModo === 'especificos' && !DIAS_SEMANA.some((d) => form[d.key])) {
      setFormError('Seleccioná al menos un día de la semana.')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const res = await fetch('/api/configuracion-notificaciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activo: form.activo,
          correo_destino: correo || null,
          lunes: form.lunes,
          martes: form.martes,
          miercoles: form.miercoles,
          jueves: form.jueves,
          viernes: form.viernes,
          sabado: form.sabado,
          domingo: form.domingo,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || '')

      setToastType('success')
      setToast('Configuración guardada correctamente.')
    } catch (err) {
      console.error(err)
      setToastType('error')
      setToast('Error al guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  if (checkingSession) {
    return (
      <div className={utilStyles.page}>
        <p className={utilStyles.muted} style={{ fontSize: '13px' }}>Cargando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className={utilStyles.page}>
        <ErrorState
          title="No tenés acceso a esta sección"
          description="Esta pantalla es exclusiva para usuarios administradores."
        />
      </div>
    )
  }

  return (
    <div className={utilStyles.page}>
      <div className={utilStyles.mb2}>
        <h2 ref={titleRef} style={{ scrollMarginTop: '16px' }}>Notificaciones</h2>
      </div>

      {loading ? (
        <p className={utilStyles.muted} style={{ fontSize: '13px' }}>Cargando...</p>
      ) : error ? (
        <ErrorState
          title="Error al cargar la configuración"
          description={error}
          actionLabel="Reintentar"
          onAction={reintentar}
        />
      ) : (
        <>
          {formError && (
            <div className={`${modalStyles.banner} ${modalStyles.bannerError}`}>{formError}</div>
          )}

          <div className={styles.card} style={{ marginBottom: '10px' }}>
            <p className={utilStyles.sectionLabel}>Notificación de medicamentos por paciente</p>
            <p style={{ fontSize: '13px', color: '#6b6a63', marginBottom: '1.25rem' }}>
              Recibí por correo el detalle de medicamentos que corresponde administrar a cada paciente.
            </p>

            <label className={modalStyles.toggleRow} htmlFor="notif-activo" style={{ marginBottom: '1.25rem' }}>
              <span className={`${modalStyles.toggleTrack} ${form.activo ? modalStyles.toggleTrackActive : ''}`} aria-hidden="true">
                <span className={modalStyles.toggleThumb} />
              </span>
              <input
                type="checkbox"
                id="notif-activo"
                role="switch"
                checked={form.activo}
                onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
                style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }}
              />
              <span>Recibir notificación de medicamentos por correo</span>
            </label>

            {form.activo && (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="notif-correo">Correo de destino</label>
                  <input
                    id="notif-correo"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={form.correo_destino}
                    onChange={(e) => setForm((prev) => ({ ...prev, correo_destino: e.target.value }))}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label id="notif-dias-modo-label" style={{ marginBottom: '8px' }}>Días de envío</label>
                  <div className={modalStyles.diasModoToggle} role="radiogroup" aria-labelledby="notif-dias-modo-label">
                    <label
                      htmlFor="notif-dias-modo-todos"
                      className={`${modalStyles.diasModoBtn} ${diasModo === 'todos' ? modalStyles.diasModoBtnActive : ''}`}
                    >
                      <input
                        type="radio"
                        id="notif-dias-modo-todos"
                        name="notif-dias-modo"
                        checked={diasModo === 'todos'}
                        onChange={() => handleDiasModoChange('todos')}
                        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }}
                      />
                      Todos los días
                    </label>
                    <label
                      htmlFor="notif-dias-modo-especificos"
                      className={`${modalStyles.diasModoBtn} ${diasModo === 'especificos' ? modalStyles.diasModoBtnActive : ''}`}
                    >
                      <input
                        type="radio"
                        id="notif-dias-modo-especificos"
                        name="notif-dias-modo"
                        checked={diasModo === 'especificos'}
                        onChange={() => handleDiasModoChange('especificos')}
                        style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }}
                      />
                      Días específicos
                    </label>
                  </div>

                  {diasModo === 'especificos' && (
                    <div className={modalStyles.diasChipsGrid} style={{ marginBottom: 0 }}>
                      {DIAS_SEMANA.map(({ key, label, nombreCompleto }) => (
                        <label
                          key={key}
                          htmlFor={`notif-dia-${key}`}
                          className={`${modalStyles.diasChip} ${form[key] ? modalStyles.diasChipActive : ''}`}
                        >
                          <input
                            type="checkbox"
                            id={`notif-dia-${key}`}
                            checked={form[key]}
                            onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.checked }))}
                            style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }}
                          />
                          <span aria-hidden="true">{label}</span>
                          <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                            {nombreCompleto}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`${modalStyles.banner} ${modalStyles.bannerSuccess}`} style={{ marginBottom: 0 }}>
                  El correo se envía siempre a las 8:00 a.m. (hora de Costa Rica); este horario está fijo en el sistema y no se puede configurar desde esta pantalla.
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingBottom: '1rem' }}>
            <button className={styles.btnSuccess} onClick={handleGuardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </>
      )}

      {toast && (
        <div className={`${styles.toast} ${toastType === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast}
        </div>
      )}
    </div>
  )
}
