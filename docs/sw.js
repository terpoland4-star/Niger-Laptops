const CACHE_NAME = 'niger-laptops-v2'; // version incrémentée pour forcer la mise à jour du cache
const ASSETS = [
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/api.js',
    './js/auth.js',
    './js/cart.js',
    './js/ui.js',
    './js/utils.js',
    './js/theme.js',
    './js/install.js',
    './js/i18n.js',
    './js/data.js',
    './js/payments.js',
    './assets/site.webmanifest',
    './assets/favicon.ico',
    './assets/favicon.svg',
    './assets/apple-touch-icon.png',
    './assets/web-app-manifest-192x192.png',
    './assets/web-app-manifest-512x512.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    // Force l'activation immédiate du nouveau Service Worker (skip waiting)
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // Supprime les anciens caches
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
    // Prend le contrôle de toutes les pages immédiatement
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Ne pas intercepter les requêtes API (elles passent directement)
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
        return;
    }

    // Pour toutes les autres ressources : stratégie "cache-first, puis réseau"
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // Mettre en cache les nouvelles ressources si elles ne sont pas déjà en cache
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});
