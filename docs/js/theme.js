function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        btn.title = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
    // Désactiver le mode automatique quand l'utilisateur choisit manuellement
    localStorage.setItem('autoThemeDisabled', 'true');
}

function initTheme() {
    // Si l'utilisateur a déjà basculé manuellement, on respecte son choix
    const autoDisabled = localStorage.getItem('autoThemeDisabled');

    if (!autoDisabled) {
        // Mode automatique : sombre entre 18h et 6h, clair le reste du temps
        function applyAutoTheme() {
            const hour = new Date().getHours();
            const autoTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
            applyTheme(autoTheme);
        }
        applyAutoTheme();
        // Vérifier toutes les 60 secondes si l'heure a changé de plage
        setInterval(() => {
            if (localStorage.getItem('autoThemeDisabled') === 'true') return;
            const hour = new Date().getHours();
            const newAutoTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
            const currentAttr = document.documentElement.getAttribute('data-theme');
            if ((currentAttr === 'dark' && newAutoTheme === 'light') ||
                (currentAttr !== 'dark' && newAutoTheme === 'dark')) {
                applyTheme(newAutoTheme);
            }
        }, 60000);
    } else {
        // L'utilisateur a choisi manuellement, on applique son thème sauvegardé
        const saved = localStorage.getItem('theme');
        applyTheme(saved || 'light');
    }

    // Bouton de basculement manuel
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.addEventListener('click', toggleTheme);
    }
}
