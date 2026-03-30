// Service Worker for Beyan Dil Akademi PWA
// Provides offline caching and install capability

const CACHE_NAME = 'beyan-v2';
const STATIC_ASSETS = [
    '/',
    '/offline',
    '/assets/logo-new.png',
    '/giris',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: Network-first strategy (always try network, fallback to cache)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and Supabase API calls
    if (
        event.request.method !== 'GET' ||
        event.request.url.includes('supabase.co') ||
        event.request.url.includes('/api/')
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses for static assets
                if (response.ok && event.request.url.includes('/assets/')) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache if network fails
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    // Return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});
