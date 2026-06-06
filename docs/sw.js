const CACHE_NAME = 'niger-laptops-v9';

// Ressources à mettre en cache (ajustez selon vos besoins)
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/ui.js',
    './js/utils.js',
    './js/i18n.js',
    './js/data.js',
    './js/api.js',
    './js/payments.js',
    './js/auth.js',
    './js/cart.js',
    './js/theme.js',
    './js/install.js',
    './assets/site.webmanifest',
    './assets/favicon.ico',
    './assets/favicon.svg',
    './assets/apple-touch-icon.png',
    './assets/web-app-manifest-192x192.png',
    './assets/web-app-manifest-512x512.png',
];

// Installation : mise en cache
self.addEventListener('install', event => {
    console.log('[SW] Installation');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Mise en cache des assets');
            return cache.addAll(ASSETS).catch(err => {
                console.error('[SW] Erreur de cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
    console.log('[SW] Activation');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => {
                    console.log('[SW] Suppression du cache obsolète:', key);
                    return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', event => {
    // Ne pas intercepter les requêtes API
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Pour les requêtes de navigation, toujours servir index.html
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html').then(cached => {
                return cached || fetch('./index.html');
            })
        );
        return;
    }

    // Pour les autres ressources : cache d'abord, puis réseau
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return response;
            });
        })
    );
});
