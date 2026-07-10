// ==========================================
// theme.js – Gestion du thème sombre/clair
// ==========================================

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    const btn = document.getElementById('theme-btn');
    if (btn) {
        if (theme === 'dark') {
            btn.innerHTML = '<i class="fas fa-sun"></i> Mode clair';
            btn.title = 'Passer en mode clair';
        } else {
            btn.innerHTML = '<i class="fas fa-moon"></i> Mode sombre';
            btn.title = 'Passer en mode sombre';
        }
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
    localStorage.setItem('autoThemeDisabled', 'true');
}

function initTheme() {
    const autoDisabled = localStorage.getItem('autoThemeDisabled');

    if (!autoDisabled) {
        // Mode automatique : sombre de 18h à 6h
        function applyAutoTheme() {
            const hour = new Date().getHours();
            const autoTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
            applyTheme(autoTheme);
        }
        applyAutoTheme();
        setInterval(() => {
            if (localStorage.getItem('autoThemeDisabled') === 'true') return;
            const hour = new Date().getHours();
            const autoTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
            const currentAttr = document.documentElement.getAttribute('data-theme');
            if ((currentAttr === 'dark' && autoTheme === 'light') ||
                (currentAttr !== 'dark' && autoTheme === 'dark')) {
                applyTheme(autoTheme);
            }
        }, 60000);
    } else {
        const saved = localStorage.getItem('theme');
        applyTheme(saved || 'light');
    }

    const btn = document.getElementById('theme-btn');
    if (btn) {
        btn.addEventListener('click', toggleTheme);
    }
}

// Initialisation au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
