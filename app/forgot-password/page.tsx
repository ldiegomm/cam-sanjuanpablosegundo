'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../styles/login.module.css'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.success) {
        setEnviado(true)
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

        <div className={styles.logo}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {!enviado ? (
          <>
            <h1 className={styles.title}>Recuperar contraseña</h1>
            <p className={styles.subtitle}>Te enviaremos un enlace para restablecer tu contraseña directamente a tu correo registrado.</p>

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

            <button
              className={styles.btnLogin}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>

            <p
              onClick={() => router.push('/login')}
              style={{ fontSize: '12px', color: '#888780', textAlign: 'center', marginTop: '16px', cursor: 'pointer' }}
            >
              ← Volver al inicio de sesión
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Solicitud enviada</h1>
            <p className={styles.subtitle}>Si tu correo está registrado en el sistema, te enviamos un enlace para restablecer tu contraseña. Revisá tu bandeja de entrada (y la carpeta de spam) durante la próxima hora.</p>
            <button
              className={styles.btnLogin}
              onClick={() => router.push('/login')}
            >
              Volver al inicio de sesión
            </button>
          </>
        )}

      </div>
    </div>
  )
}