// ==========================================
// install.js – Bannière d'installation PWA (délai de 3 jours après refus)
// ==========================================

let deferredPrompt = null;

function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches;
}

function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
        <div class="pwa-banner-content" style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:2rem;">🖥️</span>
                <div>
                    <strong>${t('installTitle') || 'Ajouter à l\'écran d\'accueil'}</strong>
                    <span style="display:block; font-size:0.85rem;">${t('installSubtitle') || 'Installez cette application pour une meilleure expérience'}</span>
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <button id="pwa-install-btn" class="btn btn-primary btn-sm">${t('installBtn') || 'Installer'}</button>
                <button id="pwa-dismiss-btn" class="btn btn-outline btn-sm">${t('later') || 'Plus tard'}</button>
            </div>
        </div>
    `;
    banner.style.cssText = `
        position: fixed; bottom: 16px; left: 16px; right: 16px;
        background: var(--surface); border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl); padding: 16px;
        z-index: 9999; border: 1px solid var(--border);
        max-width: 550px; margin: 0 auto;
    `;
    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const result = await deferredPrompt.userChoice;
            console.log('Installation PWA:', result.outcome);
            deferredPrompt = null;
        } else if (isIOS()) {
            showIOSInstructions();
        }
        if (banner.parentNode) banner.remove();
    });

    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        if (banner.parentNode) banner.remove();
        // Enregistrer la date de refus pour patienter 3 jours
        localStorage.setItem('installBannerDismissedAt', Date.now());
    });
}

function showIOSInstructions() {
    const msg = document.createElement('div');
    msg.id = 'ios-instructions';
    msg.innerHTML = `
        <div style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; align-items:center; justify-content:center;">
            <div style="background:white; border-radius:20px; padding:24px; max-width:300px; text-align:center;">
                <p style="font-size:1.5rem; margin-bottom:16px;">📲</p>
                <p><strong>${t('iosInstallStep1') || 'Appuyez sur Partager'}</strong></p>
                <p style="font-size:0.9rem;">${t('iosInstallStep2') || 'Sélectionnez "Sur l\'écran d\'accueil"'}</p>
                <p style="font-size:0.9rem;">${t('iosInstallStep3') || 'Puis appuyez sur "Ajouter"'}</p>
                <button class="btn btn-primary btn-block" onclick="document.getElementById('ios-instructions').remove()">${t('close') || 'Fermer'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(msg);
}

function isIOS() {
    return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

function initInstallBanner() {
    if (isAppInstalled()) return;

    // Vérifier si l'utilisateur a déjà refusé il y a moins de 3 jours
    const dismissedAt = localStorage.getItem('installBannerDismissedAt');
    if (dismissedAt) {
        const hoursSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
        if (hoursSince < 72) return; // 3 jours = 72 heures
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
    });

    // Sur iOS ou si beforeinstallprompt ne se déclenche pas immédiatement, on affiche après un délai
    setTimeout(() => {
        if (!isAppInstalled() && !document.getElementById('pwa-install-banner')) {
            showInstallBanner();
        }
    }, 2000);
}

window.addEventListener('appinstalled', () => {
    console.log('PWA installée avec succès');
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
    localStorage.removeItem('installBannerDismissedAt');
});
