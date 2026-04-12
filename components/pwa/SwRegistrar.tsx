'use client'

import { useEffect } from 'react'
import { autoSubscribeIfGranted } from '@/components/pwa/NotificationPrompt'

export function SwRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(() => {
        // Si el usuario ya había dado permiso antes, suscribirse silenciosamente
        const stored = localStorage.getItem('rishtedar_client')
        if (stored) {
          try {
            const client = JSON.parse(stored) as { phone?: string; favoriteLocal?: string }
            autoSubscribeIfGranted(client.phone, client.favoriteLocal)
          } catch { /* silencioso */ }
        } else {
          autoSubscribeIfGranted()
        }
      })
      .catch(() => {})
  }, [])
  return null
}
