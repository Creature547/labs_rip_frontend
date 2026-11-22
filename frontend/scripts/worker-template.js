const prefix = 'heating-equipment:' + self.registration.scope + ':'
const cacheName = prefix + '__VERSION__'
const files = /* FILES */ []
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files)))
})
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key)
    }
    await self.clients.claim()
  })())
})
self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope) || request.headers.has('range')) return
  event.respondWith((async () => {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request.mode === 'navigate' ? './index.html' : request)
    return cached || fetch(request)
  })())
})
