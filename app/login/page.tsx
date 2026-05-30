'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../styles/login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className={styles.field}>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <p
          onClick={() => router.push('/forgot-password')}
          style={{ fontSize: '12px', color: '#888780', textAlign: 'center', marginTop: '16px', cursor: 'pointer' }}
        >
          ¿Olvidaste tu contraseña?
        </p>

      </div>
    </div>
  )
}