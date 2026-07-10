// ==========================================
// sw.js – Service Worker optimisé (fusion v14 + améliorations)
// ==========================================

const CACHE_NAME = 'niger-laptops-v15'; // Nouvelle version après refonte

// Liste complète des ressources à pré-cacher
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/utils.js',
    './js/i18n.js',
    './js/theme.js',
    './js/install.js',
    './js/data.js',
    './js/api.js',
    './js/payments.js',
    './js/auth.js',
    './js/cart.js',
    './js/ui.js',
    './js/app.js',
    './OneSignalSDKWorker.js',
    './assets/site.webmanifest',
    './assets/favicon.ico',
    './assets/favicon.svg',
    './assets/favicon-96x96.png',
    './assets/apple-touch-icon.png',
    './assets/web-app-manifest-192x192.png',
    './assets/web-app-manifest-512x512.png',
    // Polices et icônes externes (pour le mode hors-ligne)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap'
];

// Installation : mise en cache avec tolérance aux erreurs
self.addEventListener('install', event => {
    console.log('[SW] Installation');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Pré-caching avec tolérance aux erreurs');
            return Promise.allSettled(
                ASSETS.map(url =>
                    cache.add(url).catch(err => {
                        console.warn(`[SW] Échec de mise en cache pour ${url} :`, err);
                    })
                )
            );
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
                    console.log('[SW] Suppression du cache obsolète :', key);
                    return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

// Stratégies de réponse
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // API : Network-first avec fallback cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Mettre en cache la réponse fraîche
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => {
                    // Essayer de servir depuis le cache si pas de réseau
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Navigations SPA : servir index.html si pas dans le cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html').then(cached => {
                return cached || fetch('./index.html');
            })
        );
        return;
    }

    // Pour toutes les autres ressources : stale-while-revalidate
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Lancer la mise à jour en arrière-plan
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                }
                return networkResponse;
            }).catch(() => cachedResponse);

            // Retourner la version cachée immédiatement si disponible, sinon attendre le réseau
            return cachedResponse || fetchPromise;
        })
    );
});
