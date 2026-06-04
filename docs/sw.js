const CACHE_NAME = 'niger-laptops-v3'; // nouvelle version pour forcer la mise à jour
const ASSETS = [
    './',                     // ← important : la racine du site
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
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Requêtes API : réseau d'abord, puis cache
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
        return;
    }

    // Pour les requêtes de navigation (ex: l'ouverture de l'app), servir index.html
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html').then(cached => cached || fetch(event.request))
        );
        return;
    }

    // Pour toutes les autres ressources : cache d'abord, puis réseau
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
