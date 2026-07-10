// ==========================================
// utils.js – Utilitaires modernes et sécurisés
// ==========================================

/**
 * Échappe les caractères HTML pour prévenir les attaques XSS.
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

/**
 * Sélecteur rapide.
 */
function $(selector) { return document.querySelector(selector); }

/**
 * Sélecteur multiple.
 */
function $$(selector) { return document.querySelectorAll(selector); }

/**
 * Formate un prix en FCFA.
 */
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

/**
 * Affiche un toast (un seul à la fois).
 */
let currentToast = null;

function showToast(message, type = 'info', duration = 3500) {
    if (currentToast) { currentToast.remove(); currentToast = null; }

    const colors = { info: '#333', success: '#0CAB3A', error: '#EF4444', warning: '#F59E0B' };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    document.body.appendChild(toast);
    currentToast = toast;

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
            if (currentToast === toast) currentToast = null;
        }, 300);
    }, duration);
}

/**
 * Navigue vers une route (hash).
 */
function navigateTo(path) {
    window.location.hash = path;
    // handleRoute() sera déclenché par l'événement hashchange
}

/**
 * Debounce pour limiter les appels (ex: recherche).
 */
function debounce(fn, delay = 300) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Vérifie si une chaîne est un email valide.
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/**
 * Vérifie si un numéro de téléphone nigérien est valide.
 */
function isValidNigerPhone(phone) {
    return /^(\+227)?[987]\d{7}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Retourne la date formatée en français.
 */
function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
}
