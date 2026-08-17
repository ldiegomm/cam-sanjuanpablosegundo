'use client'

import type { ReactNode } from 'react'
import styles from '@/app/styles/componentes.module.css'

type ErrorStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

const defaultIcon = (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b4b2a9" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="13" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export default function ErrorState({ icon, title, description, actionLabel, onAction }: ErrorStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
        {icon ?? defaultIcon}
      </div>
      <p style={{ fontSize: '14px', color: '#888780', marginBottom: '6px' }}>{title}</p>
      {description && (
        <p style={{ fontSize: '12px', color: '#b4b2a9', marginBottom: actionLabel ? '1rem' : 0 }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          className={styles.btnSm}
          style={{ color: '#14B8A6', borderColor: '#14B8A6' }}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
