// ==========================================
// tracker.js – Ghost Stream Viewer v2 (Discord)
// ==========================================
// Améliorations inoffensives :
//   - Localisation approximative (ville/pays)
//   - Temps passé sur la page
//   - Compteur de clics
//   - Profondeur de scroll
//   - Pages visitées dans la session
// ==========================================
(function() {
    'use strict';

    // ==========================================
    //  CONFIGURATION
    // ==========================================

    var WEBHOOK_URL = 'https://discord.com/api/webhooks/1526219089293475882/_4ZhloVoqU7Wg9Hrb2nRwri6Niy8GXYhcCisoxAcEKxO-sCIlvbV4Ck5Y1dttv6bJQ0I';
    var MIN_DELAY = 15;

    // ==========================================
    //  RESPECT VIE PRIVÉE + ANTI-SPAM
    // ==========================================

    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) {
        console.log('[Tracker] Do Not Track respecté.');
        return;
    }

    // Anti-doublon session
    if (sessionStorage.getItem('_nl_tracked_session')) {
        // C'est une navigation interne, pas un nouveau visiteur
        navigationPage();
        return;
    }
    sessionStorage.setItem('_nl_tracked_session', '1');

    // Anti-spam temporel
    var lastNotify = parseInt(localStorage.getItem('_nl_last') || '0', 10);
    if (Date.now() - lastNotify < MIN_DELAY * 1000) return;
    localStorage.setItem('_nl_last', Date.now().toString());

    // ==========================================
    //  COLLECTE
    // ==========================================

    var startTime = Date.now();
    var clickCount = 0;
    var scrollDepth = 0;

    document.addEventListener('click', function() {
        clickCount++;
    });

    window.addEventListener('scroll', function() {
        var current = Math.round(
            (window.scrollY + window.innerHeight) / 
            document.documentElement.scrollHeight * 100
        );
        if (current > scrollDepth) scrollDepth = current;
    });

    // Enregistrer la page pour la navigation
    sessionStorage.setItem('_nl_prev', window.location.pathname);

    function getInfo() {
        return {
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || '(direct)',
            language: navigator.language.substring(0, 2),
            screen: screen.width + 'x' + screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? '📱 Mobile' : '💻 Desktop',
            os: (function() {
                var ua = navigator.userAgent;
                if (ua.indexOf('Windows') !== -1) return 'Windows';
                if (ua.indexOf('Mac OS') !== -1) return 'macOS';
                if (ua.indexOf('Linux') !== -1) return 'Linux';
                if (ua.indexOf('Android') !== -1) return 'Android';
                if (ua.indexOf('iOS') !== -1) return 'iOS';
                return 'Autre';
            })()
        };
    }

    // ==========================================
    //  GÉOLOCALISATION
    // ==========================================

    function getGeo(callback) {
        fetch('http://ip-api.com/json/?fields=country,city,region,isp,org,query,as')
            .then(function(r) { return r.json(); })
            .then(function(geo) {
                callback(geo);
            })
            .catch(function() {
                callback(null);
            });
    }

    // ==========================================
    //  ENVOI ARRIVÉE
    // ==========================================

    function sendArrival(data, geo) {
        var colors = {
            '/': 5814783,
            '/laptops': 3447003,
            '/accessoires': 15105570,
            '/contact': 15844367,
            '/panier': 15158332,
            '/promotions': 3066993
        };
        var color = colors[data.page] || 5814783;

        var referrerMsg = data.referrer !== '(direct)'
            ? '🔗 Provenance : ' + data.referrer
            : '📍 Visite directe';

        var fields = [
            { name: '📄 Page', value: data.page, inline: true },
            { name: '🕐 Heure', value: new Date(data.timestamp).toLocaleString('fr-FR'), inline: true },
            { name: '💻 Appareil', value: data.device + ' | ' + data.os, inline: true },
            { name: '🖥️ Écran', value: data.screen, inline: true },
            { name: '🌍 Langue', value: data.language.toUpperCase(), inline: true },
            { name: '🗺️ Fuseau', value: data.timezone, inline: true }
        ];

        if (geo) {
            fields.push(
                { name: '📍 Ville', value: geo.city + ', ' + geo.country, inline: true },
                { name: '🔌 FAI', value: geo.isp || 'Inconnu', inline: true },
                { name: '🏢 ASN', value: geo.as || 'N/A', inline: true }
            );
        }

        var payload = {
            embeds: [{
                title: '👻 Nouveau visiteur',
                description: referrerMsg,
                color: color,
                fields: fields,
                footer: { text: 'Niger Laptops • Tracker inoffensif' },
                timestamp: data.timestamp
            }]
        };

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function(r) {
            if (r.ok) console.log('[Tracker] ✔ Arrivée notifiée');
        }).catch(function() {});
    }

    // ==========================================
    //  ENVOI DÉPART
    // ==========================================

    function sendDeparture() {
        var timeSpent = Math.round((Date.now() - startTime) / 1000);
        var minutes = Math.floor(timeSpent / 60);
        var seconds = timeSpent % 60;

        var payload = {
            embeds: [{
                title: '👋 Visiteur parti',
                color: 15158332,
                fields: [
                    { name: '📄 Page', value: window.location.pathname, inline: true },
                    { name: '⏱️ Temps passé', value: minutes + 'm ' + seconds + 's', inline: true },
                    { name: '🖱️ Clics', value: clickCount + ' clics', inline: true },
                    { name: '📜 Scroll max', value: scrollDepth + '%', inline: true }
                ],
                footer: { text: 'Session terminée' },
                timestamp: new Date().toISOString()
            }]
        };

        var xhr = new XMLHttpRequest();
        xhr.open('POST', WEBHOOK_URL, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
    }

    // ==========================================
    //  NAVIGATION INTERNE
    // ==========================================

    function navigationPage() {
        var prev = sessionStorage.getItem('_nl_prev');
        var curr = window.location.pathname;
        if (prev && prev !== curr) {
            sessionStorage.setItem('_nl_prev', curr);

            var payload = {
                embeds: [{
                    title: '🔄 Navigation',
                    color: 15844367,
                    fields: [
                        { name: '⬅️ De', value: prev, inline: true },
                        { name: '➡️ Vers', value: curr, inline: true }
                    ],
                    footer: { text: 'Même session' },
                    timestamp: new Date().toISOString()
                }]
            };

            var xhr = new XMLHttpRequest();
            xhr.open('POST', WEBHOOK_URL, false);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(payload));
        }
    }

    // ==========================================
    //  EXÉCUTION
    // ==========================================

    var data = getInfo();
    console.log('👻 Ghost Stream v2');
    console.log('   Page :', data.page, '|', data.device, '|', data.os);

    // Envoi arrivée avec géolocalisation
    getGeo(function(geo) {
        if (geo) {
            console.log('   Ville :', geo.city, ',', geo.country);
            console.log('   FAI   :', geo.isp);
        } else {
            console.log('   Géolocalisation : non disponible');
        }
        sendArrival(data, geo);
    });

    // Envoi départ au fermeture
    window.addEventListener('beforeunload', function() {
        sendDeparture();
    });

    // Intercepter les clics sur les liens internes pour future navigation
    document.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        if (link && link.hostname === window.location.hostname) {
            sessionStorage.setItem('_nl_next', link.pathname);
        }
    });

})();
