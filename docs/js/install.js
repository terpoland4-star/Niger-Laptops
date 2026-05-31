// ==========================================
// install.js – Bannière d'installation PWA
// ==========================================

let deferredPrompt = null;
let installBannerDismissed = false;

// Vérifie si l'application est déjà installée (mode standalone ou fullscreen)
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches;
}

// Crée et affiche la bannière
function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return; // déjà présente

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
        <div class="pwa-banner-content">
            <div class="pwa-banner-logo">🖥️</div>
            <div class="pwa-banner-text">
                <strong>${t('installTitle')}</strong>
                <span>${t('installSubtitle')}</span>
            </div>
            <div class="pwa-banner-actions">
                <button id="pwa-install-btn" class="btn btn-primary btn-sm">${t('installBtn')}</button>
                <button id="pwa-dismiss-btn" class="btn btn-outline btn-sm">${t('later')}</button>
            </div>
        </div>
    `;
    banner.style.cssText = `
        position: fixed; bottom: 16px; left: 16px; right: 16px;
        background: var(--surface); border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl); padding: 16px;
        z-index: 9999; display: flex; align-items: center;
        border: 1px solid var(--border);
        max-width: 500px; margin: 0 auto;
    `;
    document.body.appendChild(banner);

    // Bouton installer
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            // Android / Desktop Chrome
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            console.log('Choix utilisateur:', result.outcome);
            deferredPrompt = null;
        } else if (isIOS()) {
            // iOS : afficher les instructions pour ajouter à l'écran d'accueil
            showIOSInstructions();
        }
        // Masquer la bannière (l'événement appinstalled la fera disparaître)
        document.getElementById('pwa-install-banner').remove();
    });

    // Bouton "Plus tard"
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        installBannerDismissed = true;
        localStorage.setItem('installBannerDismissed', 'true');
        document.getElementById('pwa-install-banner').remove();
    });
}

// Instructions spécifiques pour iOS
function showIOSInstructions() {
    const msg = document.createElement('div');
    msg.id = 'ios-instructions';
    msg.innerHTML = `
        <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; align-items:center; justify-content:center;">
            <div style="background:white; border-radius:20px; padding:24px; max-width:300px; text-align:center;">
                <p style="font-size:1.5rem; margin-bottom:16px;">📲</p>
                <p><strong>${t('iosInstallStep1')}</strong></p>
                <p style="font-size:0.9rem;">${t('iosInstallStep2')}</p>
                <p style="font-size:0.9rem;">${t('iosInstallStep3')}</p>
                <button class="btn btn-primary btn-block" onclick="document.getElementById('ios-instructions').remove()">${t('close')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(msg);
}

// Détecte iOS
function isIOS() {
    return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

// Initialisation
function initInstallBanner() {
    // Ne rien faire si déjà installé
    if (isAppInstalled()) return;

    // Si l'utilisateur a déjà rejeté la bannière, ne pas la réafficher (sauf si on souhaite la remontrer après un certain temps)
    if (localStorage.getItem('installBannerDismissed') === 'true') return;

    // Sur Android/Desktop, écouter beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
    });

    // Sur iOS, afficher la bannière après un délai (pas de beforeinstallprompt)
    if (isIOS()) {
        setTimeout(() => {
            if (!isAppInstalled() && localStorage.getItem('installBannerDismissed') !== 'true') {
                showInstallBanner();
            }
        }, 2000);
    }
}

// Écouter l'installation réussie
window.addEventListener('appinstalled', () => {
    console.log('PWA installée');
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
    localStorage.removeItem('installBannerDismissed');
});
