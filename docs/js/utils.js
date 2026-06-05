// ==========================================
// utils.js – Fonctions utilitaires
// ==========================================

let currentToast = null; // Garde la référence du toast actif

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function showToast(message, type = 'info', duration = 3000) {
    // Supprimer le toast précédent s'il existe
    if (currentToast) {
        currentToast.remove();
        currentToast = null;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';

    // Couleur selon le type
    const colors = {
        info: '#333',
        success: '#0CAB3A',
        error: '#D32F2F'
    };
    toast.style.background = colors[type] || colors.info;
    toast.textContent = message;
    document.body.appendChild(toast);
    currentToast = toast;

    setTimeout(() => {
        toast.remove();
        if (currentToast === toast) currentToast = null;
    }, duration);
}

function navigateTo(path) {
    window.location.hash = path;
    handleRoute();
}
