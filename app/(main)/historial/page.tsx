'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from '@/app/styles/componentes.module.css'
import utilStyles from '@/app/styles/utilities.module.css'
import modalStyles from '@/app/styles/modals.module.css'

type Adulto = {
  id: number
  nombre: string
}

type Historial = {
  id: number
  id_adulto_mayor: number
  fuma: boolean | null
  consume_licor: boolean | null
  padecimientos: unknown
  lesiones: unknown
  operaciones: string | null
  cantidad_ejersicio_demanal: number | null
}

type HistorialForm = {
  fuma: boolean
  consume_licor: boolean
  padecimientos: string
  lesiones: string
  operaciones: string
  cantidad_ejersicio_demanal: number
}

type PendingAction =
  | { type: 'cancel' }
  | { type: 'changeAdulto'; adulto: Adulto }
  | null

declare global {
  interface Window {
    __historialUnsavedChanges?: boolean
  }
}

function parseText(value: unknown): string {
  if (!value) return ''

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean).join(', ')
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean).join(', ')
      } catch {
        // Si no es JSON valido, se intenta como texto delimitado.
      }
    }

    return trimmed
  }

  return String(value)
}

function buildFormFromHistorial(historial: Historial | null): HistorialForm {
  return {
    fuma: Boolean(historial?.fuma),
    consume_licor: Boolean(historial?.consume_licor),
    padecimientos: parseText(historial?.padecimientos),
    lesiones: parseText(historial?.lesiones),
    operaciones: historial?.operaciones || '',
    cantidad_ejersicio_demanal: Number.isFinite(Number(historial?.cantidad_ejersicio_demanal))
      ? Math.max(0, Math.min(7, Number(historial?.cantidad_ejersicio_demanal)))
      : 0
  }
}

function normalizeForm(form: HistorialForm): HistorialForm {
  return {
    ...form,
    padecimientos: form.padecimientos.trim(),
    lesiones: form.lesiones.trim(),
    cantidad_ejersicio_demanal: Number.isFinite(form.cantidad_ejersicio_demanal)
      ? Math.max(0, Math.min(7, form.cantidad_ejersicio_demanal))
      : 0,
    operaciones: form.operaciones.trim(),
  }
}

function serializeForm(form: HistorialForm): string {
  return JSON.stringify(normalizeForm(form))
}

export default function HistorialPage() {
  const searchParams = useSearchParams()
  const [adultos, setAdultos] = useState<Adulto[]>([])
  const [historial, setHistorial] = useState<Historial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [adultoId, setAdultoId] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [editSnapshot, setEditSnapshot] = useState('')
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [form, setForm] = useState<HistorialForm>({
    fuma: false,
    consume_licor: false,
    padecimientos: '',
    lesiones: '',
    operaciones: '',
    cantidad_ejersicio_demanal: 0
  })

  useEffect(() => {
    fetch('/api/historial')
      .then(async res => {
        if (!res.ok) throw new Error('No se pudo cargar el historial de salud.')
        return res.json()
      })
      .then(data => {
        const adultosData: Adulto[] = data.adultos || []
        const historialData: Historial[] = data.historial || []

        setAdultos(adultosData)
        setHistorial(historialData)

        const idParam = Number(searchParams.get('id'))
        const existeIdParam = Number.isFinite(idParam) && adultosData.some(a => a.id === idParam)

        if (existeIdParam) {
          setAdultoId(idParam)
          const adulto = adultosData.find(a => a.id === idParam)
          setSearch(adulto?.nombre || '')
        } else {
          setAdultoId(null)
          setSearch('')
        }
      })
      .catch(err => {
        console.error(err)
        setError('Ocurrió un error cargando el historial.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchParams])

  const adultosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return adultos
    return adultos.filter(a => a.nombre.toLowerCase().includes(term))
  }, [adultos, search])

  const adultoSeleccionado = useMemo(
    () => adultos.find(a => a.id === adultoId) || null,
    [adultos, adultoId]
  )

  const historialSeleccionado = useMemo(
    () => historial.find(h => h.id_adulto_mayor === adultoId) || null,
    [historial, adultoId]
  )

  useEffect(() => {
    if (!isEditing) {
      const baseForm = buildFormFromHistorial(historialSeleccionado)
      setForm(baseForm)
      setEditSnapshot(serializeForm(baseForm))
    }
  }, [historialSeleccionado, isEditing])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const padecimientos = parseText(historialSeleccionado?.padecimientos)
  const lesiones = parseText(historialSeleccionado?.lesiones)
  const isDirty = isEditing && serializeForm(form) !== editSnapshot

  useEffect(() => {
    window.__historialUnsavedChanges = isDirty
    window.dispatchEvent(new CustomEvent('historial-unsaved-change'))
  }, [isDirty])

  useEffect(() => {
    return () => {
      window.__historialUnsavedChanges = false
      window.dispatchEvent(new CustomEvent('historial-unsaved-change'))
    }
  }, [])

  const applyAdultoSelection = (adulto: Adulto) => {
    setAdultoId(adulto.id)
    setSearch(adulto.nombre)
    setDropdownOpen(false)
    setIsEditing(false)
  }

  const requestCancelEdit = () => {
    if (isDirty) {
      setPendingAction({ type: 'cancel' })
      setShowUnsavedModal(true)
      return
    }

    setForm(buildFormFromHistorial(historialSeleccionado))
    setIsEditing(false)
  }

  const requestAdultoSelection = (adulto: Adulto) => {
    if (isDirty) {
      setPendingAction({ type: 'changeAdulto', adulto })
      setShowUnsavedModal(true)
      return
    }

    applyAdultoSelection(adulto)
  }

  const closeUnsavedModal = () => {
    setShowUnsavedModal(false)
    setPendingAction(null)
  }

  const discardUnsavedChanges = () => {
    if (pendingAction?.type === 'changeAdulto') {
      applyAdultoSelection(pendingAction.adulto)
      closeUnsavedModal()
      return
    }

    if (pendingAction?.type === 'cancel') {
      setForm(buildFormFromHistorial(historialSeleccionado))
      setIsEditing(false)
      closeUnsavedModal()
      return
    }

    closeUnsavedModal()
  }

  const handleSave = async () => {
    if (!adultoId || saving) return

    setSaving(true)
    try {
      const res = await fetch('/api/historial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_adulto_mayor: adultoId,
          fuma: form.fuma,
          consume_licor: form.consume_licor,
          padecimientos: form.padecimientos,
          lesiones: form.lesiones,
          operaciones: form.operaciones.trim(),
          cantidad_ejersicio_demanal: form.cantidad_ejersicio_demanal
        })
      })

      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'No fue posible guardar los cambios.')
      }

      const updated = data.historial as Historial
      setHistorial((prev) => {
        const filtered = prev.filter((item) => item.id_adulto_mayor !== adultoId)
        return [...filtered, updated]
      })

      setIsEditing(false)
      setToastType('success')
      setToast('Historial actualizado correctamente.')
    } catch (err) {
      console.error(err)
      setToastType('error')
      setToast('Error al guardar el historial.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={utilStyles.page}>
      <div className={utilStyles.mb2}>
        <h2>Historial de salud</h2>
      </div>

      <div className={styles.searchAccion}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '12px', color: '#888780', display: 'block', marginBottom: '4px' }}>
            Seleccionar persona
          </label>
          <div className={styles.pacSearchWrap}>
            <svg className={styles.pacIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.pacInput}
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => {
                setTimeout(() => setDropdownOpen(false), 120)
              }}
              autoComplete="off"
              disabled={loading || !!error || isEditing}
            />
            <div
              className={styles.pacDropdown}
              style={{ display: dropdownOpen ? 'block' : 'none' }}
            >
              {adultosFiltrados.length === 0 ? (
                <div className={`${styles.pacOption} ${styles.pacOptionNoResults}`}>Sin resultados</div>
              ) : (
                adultosFiltrados.map(a => (
                  <div
                    key={a.id}
                    className={styles.pacOption}
                    onMouseDown={() => {
                      requestAdultoSelection(a)
                    }}
                  >
                    {a.nombre}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <button
          style={{ color: '#C9A84C', borderColor: '#C9A84C', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
          onClick={() => {
            const baseForm = buildFormFromHistorial(historialSeleccionado)
            setForm(baseForm)
            setEditSnapshot(serializeForm(baseForm))
            setIsEditing(true)
          }}
          disabled={loading || !!error || !adultoSeleccionado || isEditing}
        >
          Editar historial
        </button>
      </div>

      {loading ? (
        <p className={utilStyles.muted} style={{ fontSize: '13px' }}>Cargando...</p>
      ) : error ? (
        <p className={utilStyles.muted} style={{ fontSize: '13px' }}>{error}</p>
      ) : (
        <>
          <p style={{ fontSize: '13px', color: '#888780', marginBottom: '12px' }}>
            Historial de salud de: <strong>{adultoSeleccionado?.nombre || '—'}</strong>
          </p>

          {!adultoSeleccionado ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ fontSize: '14px', color: '#888780', marginBottom: '6px' }}>No hay persona seleccionada</p>
              <p style={{ fontSize: '12px', color: '#b4b2a9' }}>Buscá y seleccioná un adulto mayor para ver o editar su historial.</p>
            </div>
          ) : !isEditing && !historialSeleccionado ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b4b2a9" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p style={{ fontSize: '14px', color: '#888780', marginBottom: '6px' }}>Sin historial registrado</p>
              <p style={{ fontSize: '12px', color: '#b4b2a9' }}>No hay información de salud guardada para esta persona.</p>
            </div>
          ) : !isEditing ? (
            <>
              <div className={utilStyles.grid2} style={{ marginBottom: '10px' }}>
                <div className={styles.cardSm}>
                  <p className={utilStyles.sectionLabel}>Padecimientos</p>
                  <p style={{ fontSize: '13px', whiteSpace: 'pre-line' }}>{padecimientos || 'Sin padecimientos registrados'}</p>
                </div>

                <div className={styles.cardSm}>
                  <p className={utilStyles.sectionLabel}>Lesiones</p>
                  <p style={{ fontSize: '13px', whiteSpace: 'pre-line' }}>{lesiones || 'Sin lesiones registradas'}</p>
                </div>
              </div>

              <div className={utilStyles.grid2} style={{ marginBottom: '10px' }}>
                <div className={styles.cardSm}>
                  <p className={utilStyles.sectionLabel}>Hábitos</p>
                  <p style={{ fontSize: '13px', whiteSpace: 'pre-line' }}>
                    {historialSeleccionado.fuma ? 'Fuma' : 'No fuma'} {' · '}
                    {historialSeleccionado.consume_licor ? 'Consume licor' : 'No consume licor'}
                    {'\n'}Ejercicio {historialSeleccionado.cantidad_ejersicio_demanal ?? 0}x semana
                  </p>
                </div>
                <div className={styles.cardSm}>
                  <p className={utilStyles.sectionLabel}>Operaciones</p>
                  <p style={{ fontSize: '13px', whiteSpace: 'pre-line' }}>{historialSeleccionado.operaciones || 'Ninguna'}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.card} style={{ marginBottom: '10px' }}>
                <p className={utilStyles.sectionLabel}>Padecimientos</p>
                <textarea
                  value={form.padecimientos}
                  onChange={(e) => setForm((prev) => ({ ...prev, padecimientos: e.target.value }))}
                  style={{ width: '100%', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div className={styles.card} style={{ marginBottom: '10px' }}>
                <p className={utilStyles.sectionLabel}>Lesiones</p>
                <textarea
                  value={form.lesiones}
                  onChange={(e) => setForm((prev) => ({ ...prev, lesiones: e.target.value }))}
                  style={{ width: '100%', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div className={styles.card} style={{ marginBottom: '10px' }}>
                <p className={utilStyles.sectionLabel}>Hábitos</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a1a18', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.fuma}
                      onChange={(e) => setForm((prev) => ({ ...prev, fuma: e.target.checked }))}
                      style={{ width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    Fuma
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1a1a18', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.consume_licor}
                      onChange={(e) => setForm((prev) => ({ ...prev, consume_licor: e.target.checked }))}
                      style={{ width: '16px', height: '16px', flexShrink: 0 }}
                    />
                    Consume licor
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: '#1a1a18', marginBottom: 0 }}>Ejercicio</label>
                    <input
                      type="number"
                      min={0}
                      max={7}
                      value={form.cantidad_ejersicio_demanal}
                      onChange={(e) => setForm((prev) => ({ ...prev, cantidad_ejersicio_demanal: Number(e.target.value) }))}
                      style={{ width: '60px' }}
                    />
                    <label style={{ fontSize: '13px', color: '#888780', marginBottom: 0 }}>veces/semana</label>
                  </div>
                </div>
              </div>

              <div className={styles.card} style={{ marginBottom: '10px' }}>
                <p className={utilStyles.sectionLabel}>Operaciones</p>
                <textarea
                  value={form.operaciones}
                  onChange={(e) => setForm((prev) => ({ ...prev, operaciones: e.target.value }))}
                  style={{ width: '100%', minHeight: '60px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingBottom: '1rem', marginTop: '1.25rem' }}>
                <button
                  onClick={requestCancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnSuccess}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {showUnsavedModal && (
        <div className={`${modalStyles.overlay} ${modalStyles.overlayOpen}`}>
          <div className={modalStyles.modalContentSm}>
            <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Cambios sin guardar</h2>
            <p style={{ fontSize: '13px', color: '#888780', marginBottom: '1.25rem' }}>
              Tenés cambios sin guardar. Si salís ahora los vas a perder.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={closeUnsavedModal}>Quedarme</button>
              <button
                onClick={discardUnsavedChanges}
                style={{ background: '#FBF3DC', color: '#7A5C1E', borderColor: '#E8C96A' }}
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toastType === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast}
        </div>
      )}
    </div>
  )
}
