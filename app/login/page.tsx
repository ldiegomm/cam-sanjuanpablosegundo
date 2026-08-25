'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from '../styles/login.module.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedOut, setLoggedOut] = useState(false)
  // Se captura una sola vez al montar: router.replace más abajo le quita el
  // parámetro a la URL, y si searchParams siguiera como dependencia el efecto
  // se reiniciaría al instante, cancelando el temporizador antes de los 4s.
  const logoutParam = useRef(searchParams.get('logout')).current

  useEffect(() => {
    if (logoutParam === '1') {
      setLoggedOut(true)
      router.replace('/login')

      const timer = setTimeout(() => setLoggedOut(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [logoutParam, router])

  const dismissLogout = () => setLoggedOut(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!EMAIL_REGEX.test(email)) {
      setError('Ingresá un correo electrónico válido.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        router.push('/home')
      } else {
        setError(data.message)
        setPassword('')
      }
    } catch {
      setError('Error de conexión. Verificá tu conexión a internet e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>

        <div className={styles.logoWrapper}>
          <img
            src="/logoPAM.jpeg"
            alt="Logo PAM"
            className={styles.logoImage}
          />
        </div>

        <h1 className={styles.title}>Bienvenido</h1>
        <p className={styles.subtitle}>Centro Adulto Mayor San Juan Pablo II</p>

        {loggedOut && (
          <div className={styles.success}>
            Sesión cerrada correctamente.
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); dismissLogout() }}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); dismissLogout() }}
            />
          </div>

          <button
            type="submit"
            className={styles.btnLogin}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        <Link
          href="/forgot-password"
          style={{ display: 'block', fontSize: '12px', color: '#14B8A6', textAlign: 'center', marginTop: '16px', textDecoration: 'none', fontWeight: 500 }}
        >
          ¿Olvidaste tu contraseña?
        </Link>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
