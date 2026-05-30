'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import UserManagementModal from '@/app/(main)/components/UserManagementModal'
import styles from '@/app/styles/layout.module.css'
import modalStyles from '@/app/styles/modals.module.css'

declare global {
  interface Window {
    __historialUnsavedChanges?: boolean
  }
}

type PendingNavigation =
  | { type: 'route'; path: string }
  | { type: 'logout' }
  | null

type SessionUser = {
  id: number | string
  nombre: string
  email: string
  rol: string
}

function getInitials(nombre?: string) {
  if (!nombre) return 'U'

  const partes = nombre.trim().split(' ').filter(Boolean)

  if (partes.length === 0) return 'U'

  return (partes[0][0] + (partes[1]?.[0] || '')).toUpperCase()
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation>(null)
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [showUsersModal, setShowUsersModal] = useState(false)

  const isAdmin = String(currentUser?.rol || '').toLowerCase() === 'admin'

  const hasUnsavedChanges = () => {
    if (typeof window === 'undefined') return false
    return Boolean(window.__historialUnsavedChanges)
  }

  const goToPath = (path: string) => {
    if (pathname === path) return

    if (hasUnsavedChanges()) {
      setPendingNavigation({ type: 'route', path })
      setShowUnsavedModal(true)
      return
    }

    router.push(path)
  }

  const handleRouteClick = (path: string) => {
    goToPath(path)
  }

  const handleLogout = async () => {
    if (hasUnsavedChanges()) {
      setPendingNavigation({ type: 'logout' })
      setShowUnsavedModal(true)
      return
    }

    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const closeUnsavedModal = () => {
    setShowUnsavedModal(false)
    setPendingNavigation(null)
  }

  const confirmDiscardAndContinue = async () => {
    const action = pendingNavigation
    closeUnsavedModal()

    if (!action) return

    if (action.type === 'route') {
      router.push(action.path)
      return
    }

    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  useEffect(() => {
    const onUnsavedChange = () => {
      // Fuerza re-render cuando cambia la bandera para mantener la UI sincronizada.
      setShowUnsavedModal((prev) => prev)
    }

    window.addEventListener('historial-unsaved-change', onUnsavedChange)

    return () => {
      window.removeEventListener('historial-unsaved-change', onUnsavedChange)
    }
  }, [])

  useEffect(() => {
    fetch('/api/auth/session')
      .then(async (response) => {
        if (!response.ok) {
          setCurrentUser(null)
          return null
        }

        const data = await response.json() as { usuario?: SessionUser }
        return data.usuario ?? null
      })
      .then((usuario) => {
        if (usuario) {
          setCurrentUser(usuario)
        }
      })
      .catch(() => {
        setCurrentUser(null)
      })
  }, [])

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>

        <div className={styles.sidebarBrand}>
          <p>Centro Adulto Mayor</p>
          <p>San Juan Pablo II</p>
        </div>

        <nav className={styles.nav}>
          <div className={`${styles.navItem} ${pathname === '/home' ? styles.navItemActive : ''}`} onClick={() => handleRouteClick('/home')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Panel de inicio</span>
          </div>
          <div className={`${styles.navItem} ${pathname.startsWith('/adultos') ? styles.navItemActive : ''}`} onClick={() => handleRouteClick('/adultos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Adultos mayores</span>
          </div>
          <div className={`${styles.navItem} ${pathname.startsWith('/historial') ? styles.navItemActive : ''}`} onClick={() => handleRouteClick('/historial')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Historial de salud</span>
          </div>
          <div className={`${styles.navItem} ${pathname.startsWith('/medicamentos') ? styles.navItemActive : ''}`} onClick={() => handleRouteClick('/medicamentos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/>
              <circle cx="18" cy="18" r="3"/>
              <path d="m22 22-1.5-1.5"/>
            </svg>
            <span>Medicamentos</span>
          </div>
          <div
            className={`${styles.navItem} ${styles.navItemConfig}`}
            onClick={() => setShowUsersModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.24.31.44.65.6 1a1.65 1.65 0 0 0 1 .33H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1 .33c-.31.24-.65.44-1 .6Z" />
            </svg>
            <span>Usuarios</span>
          </div>
          <div
            className={`${styles.navItem} ${styles.navItemSalir}`}
            onClick={handleLogout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Salir</span>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarFooterInner}>
            <div className={styles.avatar}>{getInitials(currentUser?.nombre)}</div>
            <div className={styles.sidebarFooterMeta}>
              <div className={styles.sidebarFooterUserRow}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 500 }}>{currentUser?.nombre || 'Usuario'}</p>
                  <p style={{ fontSize: '11px', color: '#888780' }}>{currentUser?.rol || 'Sin rol'}</p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    className={styles.settingsButton}
                    onClick={() => setShowUsersModal(true)}
                    aria-label="Administrar usuarios"
                    title="Administrar usuarios"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-.33-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1-.33 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.24.31.44.65.6 1a1.65 1.65 0 0 0 1 .33H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1 .33c-.31.24-.65.44-1 .6Z" />
                    </svg>
                  </button>
                )}
              </div>
              <p
                onClick={handleLogout}
                style={{ fontSize: '11px', color: '#14B8A6', cursor: 'pointer', fontWeight: 500 }}
              >
                Cerrar sesión
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className={styles.mobileHeader}>
        <span style={{ fontWeight: 500 }}>{currentUser?.nombre || 'Usuario'}</span>
        <span style={{ color: '#888780' }}>{currentUser?.rol || 'Sin rol'}</span>
      </div>

      <main className={styles.main}>
        {children}
      </main>

      {showUnsavedModal && (
        <div className={`${modalStyles.overlay} ${modalStyles.overlayOpen}`}>
          <div className={modalStyles.modalContentSm}>
            <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>Cambios sin guardar</h2>
            <p style={{ fontSize: '13px', color: '#888780', marginBottom: '1.25rem' }}>
              Tenés cambios sin guardar en historial. Si salís ahora los vas a perder.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={closeUnsavedModal}>Quedarme</button>
              <button
                onClick={confirmDiscardAndContinue}
                style={{ background: '#FBF3DC', color: '#7A5C1E', borderColor: '#E8C96A' }}
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showUsersModal && (
        <UserManagementModal
          open={showUsersModal}
          onClose={() => setShowUsersModal(false)}
          currentUser={currentUser}
          onCurrentUserUpdated={setCurrentUser}
        />
      )}
    </div>
  )
}