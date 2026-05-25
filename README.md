# 🖥️ Niger Laptops – Plateforme e-commerce complète

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

## 📋 Description

**Niger Laptops** est une boutique en ligne de consommables et accessoires informatiques, conçue pour le marché nigérien.  
Développée par **Hamadine AG MOCTAR**, CEO de **HAM Global Words** et développeur full‑stack malien, cette plateforme allie modernité, rapidité et moyens de paiement locaux (Orange Money, Airtel Money, MyNita, AmanaTa, carte bancaire).

La solution se compose de trois modules :

1. **Backend API** (Node.js/Express + PostgreSQL) – gestion des produits, commandes, authentification et paiements.
2. **Application PWA** (HTML/CSS/JavaScript) – vitrine installable sur mobile, avec panier, commande et suivi.
3. **Dashboard administrateur** (Next.js) – interface privée pour gérer le catalogue et les commandes.

## 🎯 Palette de couleurs (inspirée du Niger 🇳🇪)

| Couleur       | Code hex    | Utilisation                             |
|---------------|-------------|-----------------------------------------|
| Orange        | `#E05206`   | Boutons principaux, accents, prix       |
| Bleu profond  | `#003D7A`   | Titres, barres, footer                  |
| Vert          | `#0CAB3A`   | Succès, disponibilité, boutons second.  |
| Blanc         | `#FFFFFF`   | Fond, cartes                            |
| Gris clair    | `#F5F7FA`   | Arrière-plan global                     |

## ✨ Fonctionnalités clés

### 🛍️ Catalogue produits
- Affichage dynamique des produits avec images, descriptions et spécifications.
- Recherche instantanée par mot‑clé.
- Filtrage par catégorie.
- Badges promotionnels (réduction, nouveau).

### 🛒 Panier & commande
- Ajout, modification de quantité, suppression.
- Calcul automatique des frais de livraison (gratuit au‑dessus de 25 000 FCFA).
- Formulaire de livraison complet.

### 💳 Paiement intégré
- Orange Money
- Airtel Money
- MyNita
- AmanaTa
- Carte bancaire (Visa/Mastercard)
- Virement bancaire
- Espèces à la livraison

### 📱 PWA (Progressive Web App)
- Installation sur l'écran d'accueil (Android/iOS).
- Fonctionnement hors‑ligne (catalogue en cache).
- Notifications push (OneSignal).

### 👤 Authentification
- Connexion par OTP SMS (sans mot de passe).
- Profil utilisateur avec historique des commandes.

### 🛠️ Dashboard administrateur
- Gestion des produits (ajout, modification, suppression, upload d'images).
- Suivi des commandes en temps réel (changement de statut).
- Statistiques (chiffre d'affaires, commandes/jour, produits populaires).
- Gestion des clients et des catégories.

## 🏗️ Structure du projet

niger-laptops/
├── backend/ # API Node.js + Express
│ ├── src/
│ │ ├── config/ # Base de données, Redis, environnement
│ │ ├── controllers/ # Logique métier (produits, commandes…)
│ │ ├── middleware/ # Auth, validation, sécurité
│ │ ├── routes/ # Définition des endpoints
│ │ ├── services/ # Paiement, SMS, upload
│ │ └── utils/ # Helpers, JWT, constantes
│ ├── sql/ # Scripts SQL d'initialisation
│ ├── docker-compose.yml # PostgreSQL + Redis + MinIO
│ └── package.json

├── pwa/ # Application web progressive
│ ├── index.html
│ ├── manifest.json
│ ├── sw.js # Service Worker
│ ├── css/styles.css
│ ├── js/
│ │ ├── app.js # Routeur SPA
│ │ ├── api.js # Appels à l'API
│ │ ├── auth.js # Authentification
│ │ ├── cart.js # Gestion du panier
│ │ ├── ui.js # Rendu des pages
│ │ └── utils.js # Fonctions utilitaires
│ └── assets/ # Icônes, images, logo
│
├── admin/ # Dashboard Next.js
│ ├── src/app/ # Pages (produits, commandes, clients…)
│ ├── src/components/ # Layout, cartes, tableaux
│ └── src/lib/ # API client, auth
│
└── README.md


📬 Contact
Hamadine AG MOCTAR
CEO de HAM Global Words
Développeur full‑stack malien

📍 Tchangarey, Marché de Bétail, Niamey (Niger)

💬 WhatsApp : +227 86 76 29 03

✉️ Email : hamadineagmoctar@gmail.com

© 2026 Niger Laptops – Tous droits réservés.
Développé avec passion par Hamadine AG MOCTAR.



