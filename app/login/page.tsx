'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from '../styles/login.module.css'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedOut, setLoggedOut] = useState(false)

  useEffect(() => {
    if (searchParams.get('logout') === '1') {
      setLoggedOut(true)
      router.replace('/login')

      const timer = setTimeout(() => setLoggedOut(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  const dismissLogout = () => setLoggedOut(false)

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault()
    setError('')
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
      }
    } catch {
      setError('Error de conexión. Por favor contacte al administrador.')
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

        <div className={styles.field}>
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); dismissLogout() }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); dismissLogout() }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            placeholder="••••••••"
          />
        </div>

        <button
          className={styles.btnLogin}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
        <Link
          href="/forgot-password"
          style={{ display: 'block', fontSize: '12px', color: '#6b6a63', textAlign: 'center', marginTop: '16px', textDecoration: 'none' }}
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
