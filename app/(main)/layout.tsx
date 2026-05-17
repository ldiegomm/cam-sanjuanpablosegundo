'use client'
import { useRouter } from 'next/navigation'
import styles from '@/app/styles/layout.module.css'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>

        <div className={styles.sidebarBrand}>
          <p>Centro Adulto Mayor</p>
          <p>San Juan Pablo II</p>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navItem} onClick={() => router.push('/home')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Panel de inicio</span>
          </div>
          <div className={styles.navItem} onClick={() => router.push('/adultos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Adultos mayores</span>
          </div>
          <div className={styles.navItem} onClick={() => router.push('/historial')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Historial de salud</span>
          </div>
          <div className={styles.navItem} onClick={() => router.push('/medicamentos')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/>
              <circle cx="18" cy="18" r="3"/>
              <path d="m22 22-1.5-1.5"/>
            </svg>
            <span>Medicamentos</span>
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
            <div className={styles.avatar}>A</div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 500 }}>Admin</p>
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

      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}