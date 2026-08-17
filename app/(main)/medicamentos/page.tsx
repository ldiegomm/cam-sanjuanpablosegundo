'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from '@/app/styles/componentes.module.css'
import utilStyles from '@/app/styles/utilities.module.css'
import modalStyles from '@/app/styles/modals.module.css'
import ErrorState from '@/app/(main)/components/ErrorState'
import { useEscapeKey } from '@/app/(main)/components/useEscapeKey'

type Adulto = {
  id: number
  nombre: string
  cedula: string
}

type Prescripcion = {
  id: number
  id_adulto_mayor: number
  nombre_medicamento: string
  indicaciones: string | null
  ayunas: boolean
  desayuno: boolean
  media_manana: boolean
  almuerzo: boolean
  merienda_tarde: boolean
  cena: boolean
  acostarse: boolean
}

type PrescripcionForm = {
  nombre_medicamento: string
  indicaciones: string
  ayunas: boolean
  desayuno: boolean
  media_manana: boolean
  almuerzo: boolean
  merienda_tarde: boolean
  cena: boolean
  acostarse: boolean
}

const FORM_INICIAL: PrescripcionForm = {
  nombre_medicamento: '',
  indicaciones: '',
  ayunas: false,
  desayuno: false,
  media_manana: false,
  almuerzo: false,
  merienda_tarde: false,
  cena: false,
  acostarse: false,
}

const HORARIOS: { key: keyof PrescripcionForm; label: string }[] = [
  { key: 'ayunas',        label: 'Ayunas' },
  { key: 'desayuno',      label: 'Desayuno' },
  { key: 'media_manana',  label: 'M. mañana' },
  { key: 'almuerzo',      label: 'Almuerzo' },
  { key: 'merienda_tarde', label: 'M. tarde' },
  { key: 'cena',          label: 'Cena' },
  { key: 'acostarse',     label: 'Acostarse' },
]

export default function MedicamentosPage() {
  const [adultos, setAdultos] = useState<Adulto[]>([])
  const [prescripciones, setPrescripciones] = useState<Prescripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [adultoId, setAdultoId] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const [toast, setToast] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const [showModal, setShowModal] = useState(false)
  const [editingPrescripcion, setEditingPrescripcion] = useState<Prescripcion | null>(null)
  const [form, setForm] = useState<PrescripcionForm>(FORM_INICIAL)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const formErrorRef = useRef<HTMLDivElement>(null)

  const [prescripcionAEliminar, setPrescripcionAEliminar] = useState<Prescripcion | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cargarMedicamentos = useCallback(() => {
    fetch('/api/medicamentos')
      .then(async res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(data => {
        setAdultos(data.adultos || [])
        setPrescripciones(data.prescripciones || [])
      })
      .catch(err => {
        console.error(err)
        setError('Ocurrió un error cargando los medicamentos.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    cargarMedicamentos()
  }, [cargarMedicamentos])

  const reintentarCargarMedicamentos = () => {
    setLoading(true)
    setError(null)
    cargarMedicamentos()
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (formError) {
      formErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formError])

  const adultosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return adultos
    return adultos.filter(a => a.nombre.toLowerCase().includes(term))
  }, [adultos, search])

  useEffect(() => {
    setActiveIndex(-1)
  }, [dropdownOpen, adultosFiltrados])

  const seleccionarAdulto = (a: Adulto) => {
    setAdultoId(a.id)
    setSearch(a.nombre)
    setDropdownOpen(false)
  }

  const handleBuscarKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % Math.max(adultosFiltrados.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev <= 0 ? adultosFiltrados.length - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < adultosFiltrados.length) {
        e.preventDefault()
        seleccionarAdulto(adultosFiltrados[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
    }
  }

  const adultoSeleccionado = useMemo(
    () => adultos.find(a => a.id === adultoId) ?? null,
    [adultos, adultoId]
  )

  const prescripcionesDelPaciente = useMemo(
    () => prescripciones.filter(p => p.id_adulto_mayor === adultoId),
    [prescripciones, adultoId]
  )

  const check = (val: boolean) => val
    ? <span className={styles.check}>✓</span>
    : <span className={styles.dash}>—</span>

  const abrirModalAgregar = () => {
    setEditingPrescripcion(null)
    setForm(FORM_INICIAL)
    setFormError(null)
    setShowModal(true)
  }

  const abrirModalEditar = (p: Prescripcion) => {
    setEditingPrescripcion(p)
    setForm({
      nombre_medicamento: p.nombre_medicamento,
      indicaciones:       p.indicaciones ?? '',
      ayunas:             p.ayunas,
      desayuno:           p.desayuno,
      media_manana:       p.media_manana,
      almuerzo:           p.almuerzo,
      merienda_tarde:     p.merienda_tarde,
      cena:               p.cena,
      acostarse:          p.acostarse,
    })
    setFormError(null)
    setShowModal(true)
  }

  const cerrarModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingPrescripcion(null)
    setFormError(null)
  }

  const cerrarModalEliminar = () => {
    if (eliminando) return
    setPrescripcionAEliminar(null)
  }

  useEscapeKey(showModal, cerrarModal)
  useEscapeKey(Boolean(prescripcionAEliminar), cerrarModalEliminar)

  const handleGuardar = async () => {
    if (!adultoId || saving) return

    if (!form.nombre_medicamento.trim()) {
      setFormError('El nombre del medicamento es obligatorio.')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const isEdit = Boolean(editingPrescripcion)
      const url    = isEdit ? `/api/medicamentos/${editingPrescripcion!.id}` : '/api/medicamentos'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_adulto_mayor:   adultoId,
          nombre_medicamento: form.nombre_medicamento.trim(),
          indicaciones:      form.indicaciones.trim() || null,
          ayunas:            form.ayunas,
          desayuno:          form.desayuno,
          media_manana:      form.media_manana,
          almuerzo:          form.almuerzo,
          merienda_tarde:    form.merienda_tarde,
          cena:              form.cena,
          acostarse:         form.acostarse,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || '')

      if (isEdit) {
        setPrescripciones(prev => prev.map(p =>
          p.id === editingPrescripcion!.id
            ? {
                ...p,
                nombre_medicamento: form.nombre_medicamento.trim(),
                indicaciones:       form.indicaciones.trim() || null,
                ayunas:             form.ayunas,
                desayuno:           form.desayuno,
                media_manana:       form.media_manana,
                almuerzo:           form.almuerzo,
                merienda_tarde:     form.merienda_tarde,
                cena:               form.cena,
                acostarse:          form.acostarse,
              }
            : p
        ))
        setToastType('success')
        setToast('Medicamento actualizado correctamente.')
      } else {
        setPrescripciones(prev => [...prev, data.prescripcion as Prescripcion])
        setToastType('success')
        setToast('Medicamento agregado correctamente.')
      }

      cerrarModal()
    } catch (err) {
      console.error(err)
      setToastType('error')
      setToast('Error al guardar el medicamento.')
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async () => {
    if (!prescripcionAEliminar || eliminando) return
    setEliminando(true)

    try {
      const res = await fetch(`/api/medicamentos/${prescripcionAEliminar.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error()

      setPrescripciones(prev => prev.filter(p => p.id !== prescripcionAEliminar.id))
      setToastType('success')
      setToast('Medicamento eliminado correctamente.')
      setPrescripcionAEliminar(null)
    } catch (err) {
      console.error(err)
      setToastType('error')
      setToast('Error al eliminar el medicamento.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className={utilStyles.page}>
      <div className={utilStyles.mb2}>
        <h2>Medicamentos</h2>
      </div>

      {/* Buscador + botón agregar */}
      <div className={styles.searchAccion}>
        <div style={{ flex: 1 }}>
          <label htmlFor="medicamentos-buscar-persona" style={{ fontSize: '12px', color: '#6b6a63', display: 'block', marginBottom: '4px' }}>
            Seleccionar persona
          </label>
          <div className={styles.pacSearchWrap}>
            <svg className={styles.pacIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="medicamentos-buscar-persona"
              type="text"
              className={styles.pacInput}
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 120)}
              onKeyDown={handleBuscarKeyDown}
              autoComplete="off"
              disabled={loading || !!error}
              role="combobox"
              aria-expanded={dropdownOpen}
              aria-controls="medicamentos-buscar-listbox"
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 && adultosFiltrados[activeIndex] ? `medicamentos-opcion-${adultosFiltrados[activeIndex].id}` : undefined}
            />
            <div
              id="medicamentos-buscar-listbox"
              role="listbox"
              className={styles.pacDropdown}
              style={{ display: dropdownOpen ? 'block' : 'none' }}
            >
              {adultosFiltrados.length === 0 ? (
                <div className={`${styles.pacOption} ${styles.pacOptionNoResults}`}>Sin resultados</div>
              ) : (
                adultosFiltrados.map((a, i) => (
                  <div
                    key={a.id}
                    id={`medicamentos-opcion-${a.id}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`${styles.pacOption} ${i === activeIndex ? styles.selected : ''}`}
                    onMouseDown={() => seleccionarAdulto(a)}
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
          onClick={abrirModalAgregar}
          disabled={loading || !!error || !adultoSeleccionado}
        >
          + Agregar
        </button>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <p className={utilStyles.muted} style={{ fontSize: '13px' }}>Cargando...</p>
      ) : error ? (
        <ErrorState
          title="Error al cargar los medicamentos"
          description={error}
          actionLabel="Reintentar"
          onAction={reintentarCargarMedicamentos}
        />
      ) : !adultoSeleccionado ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ fontSize: '14px', color: '#6b6a63', marginBottom: '6px' }}>No hay persona seleccionada</p>
          <p style={{ fontSize: '12px', color: '#7a7970' }}>Buscá y seleccioná un adulto mayor para ver o gestionar sus medicamentos.</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '13px', color: '#6b6a63', marginBottom: '12px' }}>
            Medicamentos de: <strong>{adultoSeleccionado.nombre}</strong>
          </p>

          <p className={styles.scrollHint}>← Deslizá para ver más →</p>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Ayunas</th>
                  <th>Desayuno</th>
                  <th>M. mañana</th>
                  <th>Almuerzo</th>
                  <th>M. tarde</th>
                  <th>Cena</th>
                  <th>Acostarse</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prescripcionesDelPaciente.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#6b6a63', padding: '2rem' }}>
                      Sin medicamentos registrados para esta persona.
                    </td>
                  </tr>
                ) : (
                  prescripcionesDelPaciente.map(p => (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontWeight: 500 }}>{p.nombre_medicamento}</span>
                        {p.indicaciones && (
                          <p style={{ fontSize: '11px', color: '#6b6a63', marginTop: '2px' }}>{p.indicaciones}</p>
                        )}
                      </td>
                      <td>{check(p.ayunas)}</td>
                      <td>{check(p.desayuno)}</td>
                      <td>{check(p.media_manana)}</td>
                      <td>{check(p.almuerzo)}</td>
                      <td>{check(p.merienda_tarde)}</td>
                      <td>{check(p.cena)}</td>
                      <td>{check(p.acostarse)}</td>
                      <td>
                        <div className={modalStyles.tableActions}>
                          <button className={styles.btnSm} onClick={() => abrirModalEditar(p)}>
                            Editar
                          </button>
                          <button
                            className={styles.btnSm}
                            style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                            onClick={() => setPrescripcionAEliminar(p)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal agregar / editar */}
      {showModal && (
        <div
          className={`${modalStyles.overlay} ${modalStyles.overlayOpen}`}
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal() }}
        >
          <div className={modalStyles.modalContent}>
            <div className={modalStyles.modalHeaderRow}>
              <p className={modalStyles.modalTitle}>
                {editingPrescripcion ? 'Editar medicamento' : 'Agregar medicamento'}
              </p>
              <button type="button" className={modalStyles.iconButton} onClick={cerrarModal} disabled={saving} aria-label="Cerrar modal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {formError && (
              <div ref={formErrorRef} className={`${modalStyles.banner} ${modalStyles.bannerError}`}>{formError}</div>
            )}

            <div className={modalStyles.formStack}>
              <div>
                <label>Nombre del medicamento</label>
                <input
                  type="text"
                  value={form.nombre_medicamento}
                  onChange={e => setForm(prev => ({ ...prev, nombre_medicamento: e.target.value }))}
                  placeholder="Ej: Metformina 500mg"
                  autoFocus
                />
              </div>

              <div>
                <label>Indicación especial</label>
                <input
                  type="text"
                  value={form.indicaciones}
                  onChange={e => setForm(prev => ({ ...prev, indicaciones: e.target.value }))}
                  placeholder="Ej: Tomar con abundante agua"
                />
              </div>

              <div>
                <label style={{ marginBottom: '8px' }}>Horario de toma</label>
                <div className={modalStyles.horarioGrid}>
                  {HORARIOS.map(({ key, label }) => (
                    <label key={key} className={modalStyles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={form[key] as boolean}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.checked }))}
                        style={{ width: '16px', height: '16px', flexShrink: 0 }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={modalStyles.formActions} style={{ marginTop: '1.25rem' }}>
              <button onClick={cerrarModal} disabled={saving}>Cancelar</button>
              <button className={styles.btnSuccess} onClick={handleGuardar} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {prescripcionAEliminar && (
        <div
          className={`${modalStyles.overlay} ${modalStyles.overlayOpen}`}
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModalEliminar() }}
        >
          <div className={modalStyles.modalContentDanger}>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>¿Eliminar medicamento?</p>
            <p style={{ fontSize: '13px', color: '#6b6a63', marginBottom: '1.25rem' }}>
              Se eliminará <strong>{prescripcionAEliminar.nombre_medicamento}</strong>. Esta acción no se puede deshacer.
            </p>
            <div className={modalStyles.formActions}>
              <button
                onClick={cerrarModalEliminar}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
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

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toastType === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast}
        </div>
      )}
    </div>
  )
}
