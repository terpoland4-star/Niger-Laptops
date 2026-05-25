import { db } from './database';
import bcrypt from 'bcryptjs';
import { generateSlug, generateSKU } from '../utils/helpers';

const seedProducts = [
  {
    name: 'Cartouche HP 63 Noire Originale',
    category: 'Cartouches & Toners',
    brand: 'HP',
    model: 'F6U62AE',
    price: 12500,
    compare_at_price: 15000,
    cost_price: 9500,
    stock_quantity: 25,
    description: 'Cartouche d\'encre originale HP 63 noire. Compatible avec HP DeskJet 1110, 2130, 3630 et OfficeJet 3830, 4650, 5200.',
    specifications: { couleur: 'Noir', rendement: '190 pages', type: 'Originale' },
    is_featured: true,
  },
  {
    name: 'Câble HDMI 2.0 3 mètres',
    category: 'Câbles & Adaptateurs',
    brand: 'UGREEN',
    price: 4500,
    stock_quantity: 100,
    description: 'Câble HDMI 2.0 haute vitesse, compatible 4K@60Hz, idéal pour PC, TV, projecteur.',
    specifications: { longueur: '3m', version: '2.0', resolution: '4K@60Hz' },
  },
  {
    name: 'Clé USB 32 Go SanDisk Ultra',
    category: 'Stockage & Mémoire',
    brand: 'SanDisk',
    model: 'SDCZ48-032G',
    price: 6500,
    cost_price: 4500,
    stock_quantity: 50,
    description: 'Clé USB 3.0 SanDisk Ultra 32 Go. Transferts rapides jusqu\'à 130 Mo/s.',
    specifications: { capacite: '32 Go', interface: 'USB 3.0', vitesse: '130 Mo/s' },
    is_featured: true,
  },
  {
    name: 'Souris Sans Fil Logitech M185',
    category: 'Accessoires PC',
    brand: 'Logitech',
    price: 8500,
    stock_quantity: 30,
    description: 'Souris sans fil compacte, portée 10m, pile longue durée 12 mois.',
  },
  {
    name: 'Routeur WiFi TP-Link Archer C6',
    category: 'Réseau & Connectique',
    brand: 'TP-Link',
    model: 'Archer C6',
    price: 28000,
    compare_at_price: 32000,
    stock_quantity: 15,
    description: 'Routeur WiFi double bande AC1200, 4 antennes, port USB.',
    specifications: { wifi: 'AC1200', bandes: '2.4GHz + 5GHz', ports: '4 LAN + 1 WAN' },
    is_featured: true,
  },
  {
    name: 'Webcam Logitech C270 HD',
    category: 'Audio & Visioconférence',
    brand: 'Logitech',
    price: 18000,
    stock_quantity: 10,
    description: 'Webcam HD 720p avec micro intégré, idéale pour visioconférences.',
  },
  {
    name: 'Batterie PC Portable Universelle 65W',
    category: 'Batteries & Alimentation',
    brand: 'Generic',
    price: 22000,
    stock_quantity: 20,
    description: 'Chargeur universel 65W compatible majorité des PC portables. Multi-embouts.',
    specifications: { puissance: '65W', voltage: '19V', connecteurs: '8 embouts' },
  },
  {
    name: 'Cartouche Canon PG-545 Noire',
    category: 'Cartouches & Toners',
    brand: 'Canon',
    model: 'PG-545',
    price: 9800,
    stock_quantity: 20,
    description: 'Cartouche noire Canon PG-545 pour PIXMA MG2450, MG2550, MG2950, IP2850.',
  },
  {
    name: 'Disque Dur Externe 1 To Toshiba',
    category: 'Stockage & Mémoire',
    brand: 'Toshiba',
    price: 35000,
    compare_at_price: 42000,
    stock_quantity: 12,
    description: 'Disque dur externe USB 3.0 1 To, compact et fiable.',
    is_featured: true,
  },
  {
    name: 'Clavier USB AZERTY Logitech K120',
    category: 'Accessoires PC',
    brand: 'Logitech',
    price: 7500,
    stock_quantity: 40,
    description: 'Clavier filaire USB, touches résistantes, design confortable.',
  },
  {
    name: 'Câble USB-C vers USB-A 1m',
    category: 'Câbles & Adaptateurs',
    brand: 'Baseus',
    price: 3500,
    stock_quantity: 200,
    description: 'Câble USB-C vers USB-A, charge rapide et transfert de données.',
  },
  {
    name: 'Onduleur APC 650VA',
    category: 'Batteries & Alimentation',
    brand: 'APC',
    price: 45000,
    stock_quantity: 8,
    description: 'Onduleur 650VA avec protection surtension, 4 prises, idéal pour PC.',
    is_featured: true,
  },
];

const seed = async () => {
  console.log('🌱 Démarrage du seed...\n');

  // Créer l'admin par défaut si pas déjà fait
  const adminExists = await db.query('SELECT id FROM admins WHERE email = $1', ['admin@nigerlaptops.ne']);
  if (adminExists.rows.length === 0) {
    const hash = await bcrypt.hash('Admin@123456', 12);
    await db.query(
      'INSERT INTO admins (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)',
      ['admin@nigerlaptops.ne', hash, 'Hamadine AG MOCTAR', 'super_admin']
    );
    console.log('✅ Admin créé: admin@nigerlaptops.ne / Admin@123456');
  }

  // Insérer les produits
  let inserted = 0;
  for (const product of seedProducts) {
    const exists = await db.query('SELECT id FROM products WHERE name = $1', [product.name]);
    if (exists.rows.length > 0) {
      console.log(`⏭️  Produit existant: ${product.name}`);
      continue;
    }

    const slug = generateSlug(product.name);
    const sku = generateSKU(product.category, product.brand);
    const images = [
      { url: `https://placehold.co/600x600/EEE/999?text=${encodeURIComponent(product.name.substring(0, 20))}`, thumbnail: `https://placehold.co/300x300/EEE/999?text=${encodeURIComponent(product.name.substring(0, 15))}`, key: `seed-${slug}` }
    ];

    await db.query(
      `INSERT INTO products (sku, name, slug, description, category, brand, model, price, compare_at_price, cost_price, stock_quantity, specifications, is_featured, is_published, images, thumbnail)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        sku, product.name, slug, product.description || '', product.category, product.brand,
        product.model || null, product.price, product.compare_at_price || null,
        product.cost_price || null, product.stock_quantity,
        JSON.stringify(product.specifications || {}),
        product.is_featured || false, true,
        JSON.stringify(images), images[0].thumbnail,
      ]
    );
    inserted++;
    console.log(`✅ ${product.name}`);
  }

  console.log(`\n🎉 Seed terminé ! ${inserted} produits ajoutés.`);
  process.exit(0);
};

seed().catch((error) => {
  console.error('❌ Erreur seed:', error);
  process.exit(1);
});
