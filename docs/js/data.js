const demoData = {
  products: [
    // ────────── Ordinateurs portables ──────────
    {
      id: "1",
      name: "HP Victus 15-fb3093dx",
      category: "Ordinateurs",
      price: 780000,
      oldPrice: null,
      thumbnail: "assets/images/products/hp-victus-15-fb3093dx.jpg",
      featured: true,
      rating: 4.6,
      description: "PC portable gaming 15.6\" FHD 144 Hz, AMD Ryzen 7-7445HS, 16 Go RAM, SSD 1 To, RTX 4050."
    },
    {
      id: "2",
      name: "HP ProBook 450 G7",
      category: "Ordinateurs",
      price: 650000,
      oldPrice: 720000,
      thumbnail: "assets/images/products/hp-probook-450-g7.jpg",
      featured: true,
      rating: 4.5,
      description: "Professionnel 15.6\" Full HD IPS, Core i7-10510U, 16 Go, SSD 512 Go, Windows 10 Pro."
    },
    {
      id: "3",
      name: "HP ProBook 450 G8",
      category: "Ordinateurs",
      price: 720000,
      oldPrice: null,
      thumbnail: "assets/images/products/HP ProBook 450 G8..jpg",
      featured: false,
      rating: 4.4,
      description: "Évolution du G7, processeur 11e génération, toujours aussi robuste."
    },
    {
      id: "4",
      name: "Lenovo ThinkPad X13 Yoga",
      category: "Ordinateurs",
      price: 850000,
      oldPrice: null,
      thumbnail: "assets/images/products/Lenovo ThinkPad X13 Yoga..jpg",
      featured: false,
      rating: 4.7,
      description: "Convertible 13.3\" tactile, stylet intégré, idéal pour les pros nomades."
    },
    {
      id: "5",
      name: "Lenovo ThinkPad X1 Yoga",
      category: "Ordinateurs",
      price: 920000,
      oldPrice: 1050000,
      thumbnail: "assets/images/products/Lenovo ThinkPad X1 Yoga.jpg",
      featured: true,
      rating: 4.8,
      description: "Premium 14\" HDR, légèreté et puissance, stylet rechargeable."
    },
    {
      id: "6",
      name: "Lenovo ThinkPad T470S",
      category: "Ordinateurs",
      price: 450000,
      oldPrice: null,
      thumbnail: "assets/images/products/Lenovo ThinkPad T470S.jpg",
      featured: false,
      rating: 4.2,
      description: "14\" Full HD, Core i5 7e gén., 8 Go, SSD 256 Go, ultraportable fiable."
    },
    {
      id: "7",
      name: "Lenovo ThinkPad T14",
      category: "Ordinateurs",
      price: 680000,
      oldPrice: null,
      thumbnail: "assets/images/products/Lenovo ThinkPad T14.jpg",
      featured: false,
      rating: 4.5,
      description: "Génération récente, écran 14\", autonomie excellente."
    },
    {
      id: "8",
      name: "Lenovo ThinkPad T14 Gen",
      category: "Ordinateurs",
      price: 710000,
      oldPrice: null,
      thumbnail: "assets/images/products/Lenovo ThinkPad T14 Gen.jpg",
      featured: false,
      rating: 4.6,
      description: "Dernière génération Intel/AMD, robustesse militaire."
    },
    {
      id: "9",
      name: "Lenovo ThinkBook 15 G2",
      category: "Ordinateurs",
      price: 580000,
      oldPrice: 650000,
      thumbnail: "assets/images/products/LENOVO ThinkBook 15 G2..jpg",
      featured: false,
      rating: 4.3,
      description: "15.6\" Full HD, Core i5 11e gén., 8 Go, SSD 512 Go, pour PME."
    },

    // ────────── PC tout-en-un ──────────
    {
      id: "10",
      name: "HP Tout-en-un 24 pouces",
      category: "Ordinateurs",
      price: 450000,
      oldPrice: null,
      thumbnail: "assets/images/products/HP Tout-en-un de 24 pouces.jpg",
      featured: false,
      rating: 4.1,
      description: "PC tout-en-un avec écran 24\" tactile, Core i3, 8 Go, 512 Go SSD."
    },

    // ────────── Tablettes ──────────
    {
      id: "11",
      name: "Samsung Galaxy Tab S9 FE+ (Fan Edition Plus)",
      category: "Tablettes",
      price: 320000,
      oldPrice: null,
      thumbnail: "assets/images/products/Samsung Galaxy Tab S9 FE+ (Fan Edition Plus)..jpg",
      featured: true,
      rating: 4.6,
      description: "Tablette 12.4\" 128 Go, 8 Go RAM, stylet S Pen inclus, Android."
    },
    {
      id: "12",
      name: "Samsung Galaxy Tab A9+ 128 Go",
      category: "Tablettes",
      price: 180000,
      oldPrice: 210000,
      thumbnail: "assets/images/products/Samsung Galaxy TAB A9+ ROM8_128GB.jpg",
      featured: false,
      rating: 4.4,
      description: "11\" TFT, 128 Go, 8 Go RAM, idéale multimédia."
    },
    {
      id: "13",
      name: "Samsung Galaxy Tab A8",
      category: "Tablettes",
      price: 140000,
      oldPrice: null,
      thumbnail: "assets/images/products/Samsung Galaxy TAB A8.jpg",
      featured: false,
      rating: 4.3,
      description: "10.5\", 64 Go, 4 Go RAM, pour toute la famille."
    },

    // ────────── Photo / Vidéo ──────────
    {
      id: "14",
      name: "Canon EOS R6",
      category: "Photo & Vidéo",
      price: 1450000,
      oldPrice: null,
      thumbnail: "assets/images/products/Canon EOS R6.jpg",
      featured: true,
      rating: 4.9,
      description: "Hybride plein format 20 Mp, stabilisation 5 axes, vidéo 4K 60p."
    },
    {
      id: "15",
      name: "Nikon D5300",
      category: "Photo & Vidéo",
      price: 380000,
      oldPrice: 450000,
      thumbnail: "assets/images/products/Nikon D5300..jpg",
      featured: false,
      rating: 4.4,
      description: "Reflex 24 Mp, écran orientable, Wi‑Fi, idéal débutant/expert."
    },

    // ────────── Audio ──────────
    {
      id: "16",
      name: "Enceinte Bluetooth JBL Flip 7",
      category: "Audio",
      price: 75000,
      oldPrice: 85000,
      thumbnail: "assets/images/products/enceintes Bluetooth JBL Flip 7.jpg",
      featured: true,
      rating: 4.7,
      description: "Son puissant, grave profond, IP67, autonomie 14 h."
    },

    // ────────── Réseau / WiFi ──────────
    {
      id: "17",
      name: "Grandstream GWN7664ELR",
      category: "Réseau & Connectique",
      price: 220000,
      oldPrice: null,
      thumbnail: "assets/images/products/Grandstream GWN7664ELR..jpg",
      featured: false,
      rating: 4.3,
      description: "Point d'accès WiFi 6E, portée étendue, idéal pour les entreprises."
    },
    {
      id: "18",
      name: "Ruijie Reyee RG-AirMetro460F",
      category: "Réseau & Connectique",
      price: 180000,
      oldPrice: null,
      thumbnail: "assets/images/products/Ruijie Reyee RG-AirMetro460F..jpg",
      featured: false,
      rating: 4.2,
      description: "Liaison sans fil point à point 5 GHz, jusqu'à 867 Mbps."
    },
    {
      id: "19",
      name: "MikroTik hAP ax² C52iG-5HaxD2HaxD-TC",
      category: "Réseau & Connectique",
      price: 95000,
      oldPrice: 110000,
      thumbnail: "assets/images/products/MikroTik hAP ax² C52iG-5HaxD2HaxD-TC.jpg",
      featured: false,
      rating: 4.5,
      description: "Routeur WiFi 6, 5 ports Gigabit, USB, puissant et configurable."
    },

    // ────────── Projecteurs ──────────
    {
      id: "20",
      name: "Vidéoprojecteur Epson EB-535W",
      category: "Projecteurs",
      price: 350000,
      oldPrice: null,
      thumbnail: "assets/images/products/vidéoprojecteur Epson EB-535W.jpg",
      featured: false,
      rating: 4.4,
      description: "Courte focale, 3400 lumens, WXGA, idéal pour salles de classe."
    },

    // ────────── Impression ──────────
    {
      id: "21",
      name: "Imprimante HP Laser MFP 137fnw",
      category: "Impression",
      price: 180000,
      oldPrice: 210000,
      thumbnail: "assets/images/products/imprimante HP Laser MFP 137fnw..jpg",
      featured: false,
      rating: 4.1,
      description: "Multifonction laser N&B, WiFi, recto-verso automatique."
    },

    // ────────── Énergie / Divers ──────────
    {
      id: "22",
      name: "Huafon ESS P600 de 600 watts",
      category: "Énergie & Onduleurs",
      price: 95000,
      oldPrice: null,
      thumbnail: "assets/images/products/Huafon ESS P600 de 600 watts..jpg",
      featured: false,
      rating: 4.0,
      description: "Onduleur 600 VA / 360 W, protection surtension, compact."
    },
    {
      id: "23",
      name: "Support de toit Starlink Mini",
      category: "Accessoires",
      price: 25000,
      oldPrice: null,
      thumbnail: "assets/images/products/Support de toit Starlink Mini.jpg",
      featured: false,
      rating: 4.2,
      description: "Fixation solide pour antenne Starlink Mini sur tout type de toit."
    },
    {
      id: "24",
      name: "RECRSI RE-S680",
      category: "Accessoires",
      price: 15000,
      oldPrice: null,
      thumbnail: "assets/images/products/RECRSI RE-S680 .jpg",
      featured: false,
      rating: 4.0,
      description: "Accessoire pratique (veuillez préciser)."
    },

    // ────────── Communication ──────────
    {
      id: "25",
      name: "Talkies-walkies Baofeng BF-888S",
      category: "Communication",
      price: 18000,
      oldPrice: null,
      thumbnail: "assets/images/products/talkies-walkies Baofeng BF-888S..jpg",
      featured: false,
      rating: 4.3,
      description: "Lot de 2 talkies-walkies UHF, portée jusqu'à 5 km."
    },

    // ────────── Gaming ──────────
    {
      id: "26",
      name: "Sony DualShock 4",
      category: "Gaming",
      price: 32000,
      oldPrice: 38000,
      thumbnail: "assets/images/products/Sony DualShock 4.jpg",
      featured: false,
      rating: 4.6,
      description: "Manette sans fil officielle PS4, compatible PC."
    },

    // ────────── Visioconférence ──────────
    {
      id: "27",
      name: "Logitech GROUP système de vidéoconférence",
      category: "Visioconférence",
      price: 420000,
      oldPrice: null,
      thumbnail: "assets/images/products/Logitech GROUP système de vidéoconférence.jpg",
      featured: true,
      rating: 4.5,
      description: "Caméra Full HD, haut-parleur, micros, télécommande, pour salles de réunion."
    },

    // ────────── Comptage / Bureau ──────────
    {
      id: "28",
      name: "Trieuse de billets Kisan Newton III",
      category: "Matériel de bureau",
      price: 280000,
      oldPrice: 320000,
      thumbnail: "assets/images/products/trieuse de billets Kisan Newton III .jpg",
      featured: false,
      rating: 4.3,
      description: "Compteuse trieuse de billets, détection faux, capacité 200 billets."
    }
  ]
};
