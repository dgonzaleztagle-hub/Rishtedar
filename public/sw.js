const CACHE = 'rishtedar-pwa-v1'
const OFFLINE_URL = '/offline.html'

const PRECACHE = [
  '/',
  '/menu',
  '/order',
  '/circle',
  OFFLINE_URL,
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return
  // Never intercept Next.js internal requests (JS chunks, image optimization, HMR)
  if (e.request.url.includes('/_next/')) return

  // Network-first for HTML navigations — prevents stale page causing Router init errors
  if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then(cached => cached || caches.match(OFFLINE_URL))
      )
    )
    return
  }

  // Cache-first for static assets (images, fonts, etc.)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).catch(() =>
        caches.match(OFFLINE_URL)
      )
    })
  )
})

// ─── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  const title = data.title || 'Rishtedar'
  const options = {
    body: data.body || 'Actualización de tu pedido',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'order-update',
    renotify: true,
    data: { url: data.url || '/app' },
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/app'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(url))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})
