import { showToast } from './ui.js';

function isValidEmail(email) {
    return /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return phone === '' || /^\+?[\d\s\-]{7,}$/.test(phone);
}

export function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('contactName')?.value.trim();
        const email = document.getElementById('contactEmail')?.value.trim();
        const phone = document.getElementById('contactPhone')?.value.trim();
        const message = document.getElementById('contactMessage')?.value.trim();
        
        if (!name) { showToast('Nom requis', 'error'); return; }
        if (!email || !isValidEmail(email)) { showToast('Email valide requis', 'error'); return; }
        if (phone && !isValidPhone(phone)) { showToast('Téléphone invalide', 'error'); return; }
        if (!message) { showToast('Message requis', 'error'); return; }
        
        showToast('Message envoyé !', 'success');
        form.reset();
    });
}

export function initNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail')?.value.trim();
        if (!email || !isValidEmail(email)) { showToast('Email valide requis', 'error'); return; }
        showToast('Inscription réussie !', 'success');
        form.reset();
    });
}
