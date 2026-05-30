'use client'

import { useEffect, useState } from 'react'
import componentStyles from '@/app/styles/componentes.module.css'
import modalStyles from '@/app/styles/modals.module.css'
import { USER_ROLES, type UserRole } from '@/lib/userRoles'

type SessionUser = {
  id: number | string
  nombre: string
  email: string
  rol: string
}

type Usuario = {
  id: number | string
  nombre: string
  apellidos: string
  email: string
  rol: string
  activo: boolean
  ultimo_acceso: string | null
}

type FormState = {
  nombre: string
  apellidos: string
  email: string
  password: string
  rol: UserRole
  activo: boolean
}

const initialForm: FormState = {
  nombre: '',
  apellidos: '',
  email: '',
  password: '',
  rol: 'admin',
  activo: true
}

function getFullName(usuario: Pick<Usuario, 'nombre' | 'apellidos'>) {
  return `${usuario.nombre} ${usuario.apellidos}`.trim()
}

function formatLastAccess(value: string | null) {
  if (!value) {
    return 'Sin registro'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sin registro'
  }

  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

function isAdminRole(role: string | null | undefined) {
  return String(role || '').toLowerCase() === 'admin'
}

type Props = {
  open: boolean
  onClose: () => void
  currentUser: SessionUser | null
  onCurrentUserUpdated: (usuario: SessionUser) => void
}

export default function UserManagementModal({
  open,
  onClose,
  currentUser,
  onCurrentUserUpdated
}: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const adminCount = usuarios.filter(usuario => isAdminRole(usuario.rol)).length
  const editingUser =
    editingUserId !== null
      ? usuarios.find(usuario => String(usuario.id) === String(editingUserId)) ?? null
      : null

  useEffect(() => {
    if (!open) {
      return
    }

    void loadUsuarios()
  }, [open])

  const loadUsuarios = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/usuarios')
      const data = (await response.json()) as {
        success?: boolean
        usuarios?: Usuario[]
        message?: string
      }

      if (!response.ok) {
        setError(data.message || 'No se pudieron cargar los usuarios.')
        return
      }

      setUsuarios(data.usuarios || [])
    } catch {
      setError('Error de conexión al cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewUser = () => {
    setEditingUserId(null)
    setForm(initialForm)
    setError(null)
    setMessage(null)
  }

  const handleEdit = (usuario: Usuario) => {
    const normalizedRole = usuario.rol === 'admin' ? 'admin' : 'colaborador'

    setEditingUserId(usuario.id)
    setForm({
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      email: usuario.email,
      password: '',
      rol: normalizedRole,
      activo: usuario.activo
    })
    setError(null)
    setMessage(null)
  }

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!form.nombre.trim() || !form.apellidos.trim() || !form.email.trim() || !form.rol) {
      setError('Nombre, apellidos, correo y rol son obligatorios.')
      return
    }

    if (!editingUserId && !form.password.trim()) {
      setError('La contraseña es obligatoria para crear un usuario.')
      return
    }

    if (form.password.trim() && form.password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (
      editingUser &&
      isAdminRole(editingUser.rol) &&
      !isAdminRole(form.rol) &&
      adminCount <= 1
    ) {
      setError('Debe existir al menos un usuario con rol admin.')
      return
    }

    setSubmitting(true)

    try {
      const isEditing = editingUserId !== null
      const response = await fetch(isEditing ? `/api/usuarios/${editingUserId}` : '/api/usuarios', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: form.nombre,
          apellidos: form.apellidos,
          email: form.email,
          password: form.password,
          rol: form.rol,
          activo: form.activo
        })
      })

      const data = (await response.json()) as {
        success?: boolean
        usuario?: Usuario
        message?: string
      }

      if (!response.ok || !data.success || !data.usuario) {
        setError(data.message || 'No se pudo guardar el usuario.')
        return
      }

      if (currentUser && String(currentUser.id) === String(data.usuario.id)) {
        onCurrentUserUpdated({
          id: data.usuario.id,
          nombre: data.usuario.nombre,
          email: data.usuario.email,
          rol: data.usuario.rol
        })
      }

      await loadUsuarios()
      setEditingUserId(null)
      setForm(initialForm)
      setMessage(isEditing ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.')
    } catch {
      setError('Error de conexión al guardar el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    if (isAdminRole(deleteTarget.rol) && adminCount <= 1) {
      setError('Debe existir al menos un usuario con rol admin.')
      return
    }

    setDeleting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/usuarios/${deleteTarget.id}`, { method: 'DELETE' })
      const data = (await response.json()) as { success?: boolean; message?: string }

      if (!response.ok || !data.success) {
        setError(data.message || 'No se pudo eliminar el usuario.')
        return
      }

      await loadUsuarios()
      setDeleteTarget(null)
      setEditingUserId(prev => (String(prev) === String(deleteTarget.id) ? null : prev))
      setForm(prev => (String(editingUserId) === String(deleteTarget.id) ? initialForm : prev))
      setMessage('Usuario eliminado correctamente.')
    } catch {
      setError('Error de conexión al eliminar el usuario.')
    } finally {
      setDeleting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <>
      <div className={`${modalStyles.overlay} ${modalStyles.overlayOpen}`}>
        <div className={modalStyles.modalContentLg}>
          <div className={modalStyles.modalHeaderRow}>
            <div>
              <h2 className={modalStyles.modalTitle}>Usuarios del sistema</h2>
              <p className={modalStyles.modalSubtitle}>
                Administrá accesos y credenciales de usuarios.
              </p>
            </div>
            <button type="button" onClick={onClose} className={modalStyles.iconButton} aria-label="Cerrar modal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {error && <div className={`${modalStyles.banner} ${modalStyles.bannerError}`}>{error}</div>}
          {message && <div className={`${modalStyles.banner} ${modalStyles.bannerSuccess}`}>{message}</div>}

          <div className={modalStyles.adminModalGrid}>
            <section className={modalStyles.adminPanel}>
              <div className={modalStyles.panelHeaderRow}>
                <div>
                  <p className={modalStyles.panelTitle}>Usuarios registrados</p>
                  <p className={modalStyles.panelMeta}>
                    {loading ? 'Cargando usuarios...' : `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <button type="button" onClick={handleNewUser} style={{ color: '#C9A84C', borderColor: '#C9A84C' }}>
                  + Nuevo usuario
                </button>
              </div>

              <div className={componentStyles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Último acceso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className={modalStyles.emptyCell}>Cargando usuarios...</td>
                      </tr>
                    ) : usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={modalStyles.emptyCell}>No hay usuarios registrados.</td>
                      </tr>
                    ) : (
                      usuarios.map(usuario => (
                        <tr key={usuario.id}>
                          <td>
                            <div className={modalStyles.userCell}>
                              <span className={componentStyles.badgeGreen}>{usuario.email}</span>
                                <span>{getFullName(usuario)}</span>
                            </div>
                          </td>
                          <td>{usuario.rol}</td>
                          <td>
                            <span className={usuario.activo ? componentStyles.badgeGreen : componentStyles.badgeYellow}>
                              {usuario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>{formatLastAccess(usuario.ultimo_acceso)}</td>
                          <td>
                            <div className={modalStyles.tableActions}>
                              <button type="button" className={componentStyles.btnSm} onClick={() => handleEdit(usuario)}>
                                Editar
                              </button>
                              <button
                                type="button"
                                className={componentStyles.btnSm}
                                style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                                disabled={
                                  (currentUser ? String(currentUser.id) === String(usuario.id) : false) ||
                                  (isAdminRole(usuario.rol) && adminCount <= 1)
                                }
                                onClick={() => setDeleteTarget(usuario)}
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
            </section>

            <section className={modalStyles.adminPanel}>
              <div className={modalStyles.panelHeaderStack}>
                <p className={modalStyles.panelTitle}>
                  {editingUserId ? 'Editar usuario' : 'Crear usuario'}
                </p>
                <p className={modalStyles.panelMeta}>
                  {editingUserId
                    ? 'Actualizá nombre, correo, rol o contraseña del usuario.'
                    : 'Definí los datos iniciales para el nuevo acceso al sistema.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className={modalStyles.formStack}>
                <div className={modalStyles.fieldGrid}>
                  <div>
                    <label htmlFor="usuario-nombre">Nombre</label>
                    <input
                      id="usuario-nombre"
                      value={form.nombre}
                      onChange={event => handleChange('nombre', event.target.value)}
                      placeholder="Nombre"
                    />
                  </div>
                  <div>
                    <label htmlFor="usuario-apellidos">Apellidos</label>
                    <input
                      id="usuario-apellidos"
                      value={form.apellidos}
                      onChange={event => handleChange('apellidos', event.target.value)}
                      placeholder="Apellidos"
                    />
                  </div>
                </div>

                <div className={modalStyles.fieldGrid}>
                  <div>
                    <label htmlFor="usuario-email">Correo electrónico</label>
                    <input
                      id="usuario-email"
                      type="email"
                      value={form.email}
                      onChange={event => handleChange('email', event.target.value)}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

                <div className={modalStyles.fieldGrid}>
                  <div>
                    <label htmlFor="usuario-password">
                      {editingUserId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                    </label>
                    <input
                      id="usuario-password"
                      type="password"
                      value={form.password}
                      onChange={event => handleChange('password', event.target.value)}
                      placeholder={editingUserId ? 'Dejar en blanco para conservarla' : 'Mínimo 6 caracteres'}
                    />
                  </div>
                  <div>
                    <label htmlFor="usuario-rol">Rol</label>
                    <select
                      id="usuario-rol"
                      value={form.rol}
                      onChange={event => handleChange('rol', event.target.value as UserRole)}
                    >
                      {USER_ROLES.map(role => (
                        <option key={role} value={role}>
                          {role === 'admin' ? 'Admin' : 'Colaborador'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className={modalStyles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={event => handleChange('activo', event.target.checked)}
                  />
                  <span>Usuario activo</span>
                </label>

                <div className={modalStyles.formActions}>
                  <button type="button" onClick={handleNewUser}>
                    Limpiar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ background: '#14B8A6', color: '#fff', borderColor: '#14B8A6' }}
                  >
                    {submitting ? 'Guardando...' : editingUserId ? 'Guardar cambios' : 'Crear usuario'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className={`${modalStyles.overlay} ${modalStyles.overlayOpen}`}>
          <div className={modalStyles.modalContentDanger}>
            <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              ¿Eliminar usuario?
            </p>
            <p style={{ fontSize: '13px', color: '#888780', marginBottom: '1.25rem' }}>
              Esta acción eliminará a <strong>{deleteTarget.nombre}</strong> del sistema. No se puede deshacer.
            </p>
            {isAdminRole(deleteTarget.rol) && adminCount <= 1 && (
              <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '1.25rem' }}>
                Debe existir al menos un usuario con rol admin.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || (isAdminRole(deleteTarget.rol) && adminCount <= 1)}
                style={{ background: '#b91c1c', color: '#fff', borderColor: '#b91c1c' }}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}