import { db } from './database';
import bcrypt from 'bcryptjs';
import { generateSlug, generateSKU } from '../utils/helpers';

const seedProducts = [
  {
    sku: 'HP-PROBOOK-450-G7',
    name: 'HP Probook 450 G7',
    category: 'Ordinateurs',
    brand: 'HP',
    model: 'Probook 450 G7',
    price: 650000,
    compare_at_price: null,
    cost_price: 580000,
    stock_quantity: 5,
    low_stock_threshold: 2,
    is_featured: true,
    description: 'PC portable professionnel 15.6" Full HD IPS, Intel Core i7-10510U, 16Go RAM, SSD 512Go, NVIDIA GeForce MX250, Windows 10 Pro.',
    specifications: {
      processor: 'Intel Core i7 10510U',
      ram: '16 Go DDR4',
      storage: '512 Go SSD',
      gpu: 'NVIDIA GeForce MX250 2 Go',
      screen: '15.6" Full HD IPS mat'
    },
    // Images placeholder – à remplacer après upload (cf. étape 3)
    images: [
      { url: 'https://placehold.co/600x400?text=HP+Probook+450+G7', thumbnail: 'https://placehold.co/300x300?text=HP+Probook+450+G7', key: 'seed-probook-1' }
    ],
    thumbnail: 'https://placehold.co/300x300?text=HP+Probook+450+G7'
  },
  {
    sku: 'HP-OMNIBOOK-5-FLIP-14',
    name: 'HP OmniBook 5 Flip 14-fp0023dx',
    category: 'Ordinateurs',
    brand: 'HP',
    model: 'OmniBook 5 Flip 14',
    price: 720000,
    compare_at_price: null,
    cost_price: 650000,
    stock_quantity: 3,
    low_stock_threshold: 1,
    is_featured: true,
    description: 'PC portable convertible 14" 2K tactile, Intel Core 7 150U, 16Go LPDDR5, SSD 512Go PCIe Gen4, Windows 11.',
    specifications: {
      processor: 'Intel Core 7 150U',
      ram: '16 Go LPDDR5',
      storage: '512 Go SSD PCIe Gen4',
      screen: '14" 2K tactile'
    },
    images: [
      { url: 'https://placehold.co/600x400?text=HP+OmniBook+5+Flip', thumbnail: 'https://placehold.co/300x300?text=HP+OmniBook+5+Flip', key: 'seed-omnibook-1' }
    ],
    thumbnail: 'https://placehold.co/300x300?text=HP+OmniBook+5+Flip'
  },
  {
    sku: 'HP-VICTUS-15-FB3093DX',
    name: 'HP Victus 15-fb3093dx',
    category: 'Ordinateurs',
    brand: 'HP',
    model: 'Victus 15',
    price: 780000,
    compare_at_price: null,
    cost_price: 700000,
    stock_quantity: 4,
    low_stock_threshold: 2,
    is_featured: true,
    description: 'PC portable gaming/design 15.6" FHD 144 Hz, AMD Ryzen 7-7445HS, 16 Go RAM, SSD 1 To, NVIDIA RTX 4050 6 Go, Windows 11.',
    specifications: {
      processor: 'AMD Ryzen 7 7445HS',
      ram: '16 Go DDR5',
      storage: '1 To SSD NVMe',
      gpu: 'NVIDIA RTX 4050 6 Go',
      screen: '15.6" FHD 144 Hz'
    },
    images: [
      { url: 'https://placehold.co/600x400?text=HP+Victus+15', thumbnail: 'https://placehold.co/300x300?text=HP+Victus+15', key: 'seed-victus-1' }
    ],
    thumbnail: 'https://placehold.co/300x300?text=HP+Victus+15'
  }
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
  for (const product of seedProducts) {
    const exists = await db.query('SELECT id FROM products WHERE sku = $1', [product.sku]);
    if (exists.rows.length > 0) {
      console.log(`⏭️  Produit déjà existant: ${product.name}`);
      continue;
    }

    const slug = generateSlug(product.name);
    await db.query(
      `INSERT INTO products (sku, name, slug, description, category, brand, model,
        price, compare_at_price, cost_price, stock_quantity, low_stock_threshold,
        specifications, images, thumbnail, is_featured, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        product.sku, product.name, slug, product.description,
        product.category, product.brand, product.model,
        product.price, product.compare_at_price, product.cost_price,
        product.stock_quantity, product.low_stock_threshold,
        JSON.stringify(product.specifications),
        JSON.stringify(product.images), product.thumbnail,
        product.is_featured, true
      ]
    );
    console.log(`✅ Produit ajouté: ${product.name}`);
  }

  console.log('\n🎉 Seed terminé !');
  process.exit(0);
};

seed().catch((error) => {
  console.error('❌ Erreur seed:', error);
  process.exit(1);
});
