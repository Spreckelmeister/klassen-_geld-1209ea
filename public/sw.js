const CACHE_NAME = 'klassenkasse-v1'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http(s)
  if (!request.url.startsWith('http')) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request)
        .then((response) => {
          // Cache successful responses for assets
          if (response.ok && (request.url.includes('/assets/') || request.url.endsWith('.js') || request.url.endsWith('.css'))) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Offline fallback for navigation
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }
          return new Response('Offline', { status: 503 })
        })
    })
  )
})
