// ==========================================
// tracker.js – Ghost Stream Viewer (Geo silencieuse)
// ==========================================
// Aucune boîte de dialogue. Aucune permission.
// Géolocalisation par IP uniquement.
// ==========================================
(function() {
    'use strict';

    // ==========================================
    //  CONFIGURATION
    // ==========================================

    var WEBHOOK_URL = 'https://discord.com/api/webhooks/1526219089293475882/_4ZhloVoqU7Wg9Hrb2nRwri6Niy8GXYhcCisoxAcEKxO-sCIlvbV4Ck5Y1dttv6bJQ0I';
    var MIN_DELAY = 10;

    // ==========================================
    //  ANTI-SPAM + RESPECT VIE PRIVÉE
    // ==========================================

    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) {
        return;
    }

    if (sessionStorage.getItem('_nl_tracked')) return;
    sessionStorage.setItem('_nl_tracked', '1');

    var lastNotify = parseInt(localStorage.getItem('_nl_last') || '0', 10);
    if (Date.now() - lastNotify < MIN_DELAY * 1000) return;
    localStorage.setItem('_nl_last', Date.now().toString());

    // ==========================================
    //  COLLECTE INFOS NAVIGATEUR
    // ==========================================

    var startTime = Date.now();
    var clickCount = 0;
    var scrollDepth = 0;

    document.addEventListener('click', function() { clickCount++; });

    window.addEventListener('scroll', function() {
        var current = Math.round(
            (window.scrollY + window.innerHeight) / 
            document.documentElement.scrollHeight * 100
        );
        if (current > scrollDepth) scrollDepth = current;
    });

    function getBaseInfo() {
        return {
            page: window.location.pathname,
            fullUrl: window.location.href,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || '(direct)',
            language: navigator.language,
            screen: screen.width + 'x' + screen.height,
            colorDepth: screen.colorDepth + ' bits',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? '📱 Mobile' : '💻 Desktop',
            os: (function() {
                var ua = navigator.userAgent;
                if (ua.indexOf('Windows') !== -1) return 'Windows ' + (ua.indexOf('NT 10.0') !== -1 ? '10/11' : '');
                if (ua.indexOf('Mac OS') !== -1) return 'macOS';
                if (ua.indexOf('Linux') !== -1) return 'Linux';
                if (ua.indexOf('Android') !== -1) return 'Android';
                if (ua.indexOf('iOS') !== -1) return 'iOS';
                return 'Autre';
            })(),
            browser: (function() {
                var ua = navigator.userAgent;
                if (ua.indexOf('Edg/') !== -1) return 'Edge';
                if (ua.indexOf('Chrome/') !== -1) return 'Chrome';
                if (ua.indexOf('Firefox/') !== -1) return 'Firefox';
                if (ua.indexOf('Safari/') !== -1) return 'Safari';
                return 'Autre';
            })(),
            cpuCores: navigator.hardwareConcurrency || '?',
            ram: navigator.deviceMemory ? navigator.deviceMemory + ' Go' : '?'
        };
    }

    // ==========================================
    //  GÉOLOCALISATION PAR IP (SANS PERMISSION)
    // ==========================================
    //  ip-api.com : gratuit, 45 req/min, sans clé
    //  Aucune boîte de dialogue. Aucune permission.
    //  Récupère : pays, ville, région, code postal,
    //  latitude, longitude, FAI, organisation, ASN
    // ==========================================

    function getGeolocation(callback) {
        // Service 1 : ip-api.com (primaire)
        fetch('http://ip-api.com/json/?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query')
            .then(function(r) { return r.json(); })
            .then(function(geo) {
                if (geo.status === 'success') {
                    callback({
                        source: 'ip-api',
                        ip: geo.query,
                        country: geo.country,
                        countryCode: geo.countryCode,
                        region: geo.regionName,
                        city: geo.city,
                        zip: geo.zip,
                        lat: geo.lat,
                        lon: geo.lon,
                        isp: geo.isp,
                        org: geo.org,
                        asn: geo.as,
                        timezone: geo.timezone
                    });
                } else {
                    // Fallback vers service 2
                    fallbackGeo(callback);
                }
            })
            .catch(function() {
                // Fallback vers service 2
                fallbackGeo(callback);
            });
    }

    // Service 2 : ipinfo.io (fallback gratuit, 50k req/mois sans clé)
    function fallbackGeo(callback) {
        fetch('https://ipinfo.io/json?token=')
            .then(function(r) { return r.json(); })
            .then(function(geo) {
                if (geo && geo.city) {
                    var loc = (geo.loc || '0,0').split(',');
                    callback({
                        source: 'ipinfo',
                        ip: geo.ip || '?',
                        country: geo.country || '?',
                        countryCode: geo.country || '?',
                        region: geo.region || '?',
                        city: geo.city,
                        zip: geo.postal || '?',
                        lat: parseFloat(loc[0]) || 0,
                        lon: parseFloat(loc[1]) || 0,
                        isp: geo.org || '?',
                        org: geo.org || '?',
                        asn: '?',
                        timezone: geo.timezone || '?'
                    });
                } else {
                    callback(null);
                }
            })
            .catch(function() {
                callback(null);
            });
    }

    // ==========================================
    //  ENVOI À DISCORD
    // ==========================================

    function sendToDiscord(baseInfo, geo) {
        var color = 5814783;

        var referrerMsg = baseInfo.referrer !== '(direct)'
            ? '🔗 Provenance : ' + baseInfo.referrer
            : '📍 Visite directe';

        var fields = [
            { name: '📄 Page', value: baseInfo.page, inline: false },
            { name: '🕐 Heure', value: new Date(baseInfo.timestamp).toLocaleString('fr-FR'), inline: true },
            { name: '💻 Appareil', value: baseInfo.device, inline: true },
            { name: '🖥️ OS', value: baseInfo.os, inline: true },
            { name: '🌐 Navigateur', value: baseInfo.browser, inline: true },
            { name: '🖼️ Écran', value: baseInfo.screen + ' (' + baseInfo.colorDepth + ')', inline: true },
            { name: '⚙️ CPU/RAM', value: baseInfo.cpuCores + ' cœurs / ' + baseInfo.ram, inline: true },
            { name: '🗺️ Fuseau', value: baseInfo.timezone, inline: true }
        ];

        // Géolocalisation (toujours disponible sans permission)
        if (geo) {
            var mapsLink = 'https://www.google.com/maps?q=' + geo.lat + ',' + geo.lon;
            fields.push(
                { name: '🌍 Localisation', value: '**[Voir sur Google Maps](' + mapsLink + ')**', inline: false },
                { name: '🏙️ Ville', value: geo.city + ', ' + geo.region, inline: true },
                { name: '🇵🇱 Pays', value: geo.country + ' (' + geo.countryCode + ')', inline: true },
                { name: '📮 Code postal', value: geo.zip || 'N/A', inline: true },
                { name: '🌐 Coordonnées', value: geo.lat.toFixed(4) + ', ' + geo.lon.toFixed(4), inline: true },
                { name: '🔌 FAI', value: geo.isp || 'Inconnu', inline: true },
                { name: '🏢 Organisation', value: geo.org || 'N/A', inline: true },
                { name: '🔢 ASN', value: geo.asn || 'N/A', inline: true }
            );
        } else {
            fields.push(
                { name: '📍 Localisation', value: '❌ Non disponible', inline: false }
            );
        }

        var payload = {
            embeds: [{
                title: '👻 Nouveau visiteur',
                description: referrerMsg,
                color: color,
                fields: fields,
                footer: {
                    text: 'Niger Laptops • Tracker inoffensif'
                },
                timestamp: baseInfo.timestamp
            }]
        };

        fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function(r) {
            if (r.ok) console.log('[Tracker] ✔ Notification envoyée');
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
    //  EXÉCUTION
    // ==========================================

    var baseInfo = getBaseInfo();
    console.log('👻 Ghost Stream');
    console.log('   Page :', baseInfo.page);

    // Étape 1 : géolocalisation silencieuse (zéro dialogue)
    getGeolocation(function(geo) {
        if (geo) {
            console.log('   📍', geo.city, ',', geo.country, '(' + geo.lat.toFixed(4) + ', ' + geo.lon.toFixed(4) + ')');
            console.log('   🔌', geo.isp);
        } else {
            console.log('   📍 Non disponible');
        }

        // Étape 2 : envoi à Discord
        sendToDiscord(baseInfo, geo);
    });

    // Étape 3 : départ
    window.addEventListener('beforeunload', function() {
        sendDeparture();
    });

})();
