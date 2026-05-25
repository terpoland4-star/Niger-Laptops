-- ============================================
-- NIGER LAPTOPS - Base de données e-commerce
-- Version 1.0
-- ============================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- TYPES ÉNUMÉRÉS
-- ============================================

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',
        'confirmed',
        'processing',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending',
        'processing',
        'completed',
        'failed',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'orange_money',
        'airtel_money',
        'cash_on_delivery',
        'bank_transfer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_method AS ENUM (
        'home_delivery',
        'pickup_point'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM (
        'super_admin',
        'manager',
        'staff'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Produits
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(250) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    
    -- Prix en FCFA (entier pour éviter les erreurs de virgule)
    price INTEGER NOT NULL CHECK (price > 0),
    compare_at_price INTEGER,  -- Prix barré (promo)
    cost_price INTEGER,        -- Prix d'achat (interne)
    
    -- Stock
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_in_stock BOOLEAN GENERATED ALWAYS AS (stock_quantity > 0) STORED,
    
    -- Médias
    images TEXT[] DEFAULT '{}',
    thumbnail VARCHAR(500),
    
    -- Attributs
    weight_grams INTEGER,
    dimensions JSONB,  -- {length, width, height}
    specifications JSONB,
    tags TEXT[] DEFAULT '{}',
    
    -- État
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_on_sale BOOLEAN GENERATED ALWAYS AS (
        compare_at_price IS NOT NULL AND compare_at_price > price
    ) STORED,
    
    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Index produits
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_search ON products 
    USING GIN (to_tsvector('french', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand, '')));

-- Catégories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(500),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200) GENERATED ALWAYS AS (
        TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
    ) STORED,
    
    -- Localisation
    default_location GEOGRAPHY(POINT, 4326),
    saved_addresses JSONB DEFAULT '[]',
    
    -- Authentification
    password_hash VARCHAR(255),
    is_phone_verified BOOLEAN DEFAULT false,
    is_email_verified BOOLEAN DEFAULT false,
    
    -- Marketing
    accepts_marketing BOOLEAN DEFAULT false,
    referral_code VARCHAR(20),
    referred_by UUID REFERENCES customers(id),
    
    -- Stats
    total_orders INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers USING GIST(default_location);

-- Sessions OTP
CREATE TABLE IF NOT EXISTS otp_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_sessions(expires_at);

-- Tokens de rafraîchissement
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    device_info JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_customer ON refresh_tokens(customer_id);

-- Adresses
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label VARCHAR(100),  -- Domicile, Bureau, etc.
    full_name VARCHAR(200),
    phone VARCHAR(15),
    address_line1 VARCHAR(500) NOT NULL,
    address_line2 VARCHAR(500),
    city VARCHAR(100) DEFAULT 'Niamey',
    commune VARCHAR(50),
    location GEOGRAPHY(POINT, 4326),
    is_default BOOLEAN DEFAULT false,
    delivery_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_location ON addresses USING GIST(location);

-- Commandes
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    address_id UUID REFERENCES addresses(id),
    
    -- Statuts
    status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    payment_method payment_method,
    delivery_method delivery_method DEFAULT 'home_delivery',
    
    -- Montants en FCFA
    subtotal INTEGER NOT NULL,
    delivery_fee INTEGER DEFAULT 0,
    discount_amount INTEGER DEFAULT 0,
    coupon_code VARCHAR(50),
    tax_amount INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    
    -- Livraison
    delivery_address JSONB,
    delivery_location GEOGRAPHY(POINT, 4326),
    delivery_notes TEXT,
    estimated_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Paiement
    payment_reference VARCHAR(200),
    payment_details JSONB,
    paid_at TIMESTAMPTZ,
    
    -- Client
    customer_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- Lignes de commande
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(250) NOT NULL,
    product_sku VARCHAR(50),
    product_image VARCHAR(500),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Paiements (logs)
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    payment_method payment_method NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    reference VARCHAR(200),
    gateway_reference VARCHAR(200),
    gateway_response JSONB,
    status payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_order ON payment_logs(order_id);

-- Panier (sessions)
CREATE TABLE IF NOT EXISTS cart_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    session_id VARCHAR(200) UNIQUE,
    items JSONB NOT NULL DEFAULT '[]',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_customer ON cart_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_sessions(session_id);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role admin_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bannières promotionnelles
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Avis clients
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- ============================================
-- VUES
-- ============================================

-- Vue dashboard admin
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    CURRENT_DATE as date,
    COUNT(DISTINCT o.id) FILTER (WHERE o.created_at::date = CURRENT_DATE) as today_orders,
    COALESCE(SUM(o.total) FILTER (WHERE o.created_at::date = CURRENT_DATE), 0) as today_revenue,
    COUNT(DISTINCT o.id) FILTER (WHERE o.created_at::date >= CURRENT_DATE - INTERVAL '30 days') as monthly_orders,
    COALESCE(SUM(o.total) FILTER (WHERE o.created_at::date >= CURRENT_DATE - INTERVAL '30 days'), 0) as monthly_revenue,
    COUNT(DISTINCT c.id) FILTER (WHERE c.created_at::date >= CURRENT_DATE - INTERVAL '30 days') as new_customers,
    COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM products WHERE stock_quantity <= low_stock_threshold AND is_published = true) as low_stock_products
FROM orders o
CROSS JOIN customers c
WHERE o.created_at::date >= CURRENT_DATE - INTERVAL '30 days';

-- ============================================
-- FONCTIONS
-- ============================================

-- Génération de numéro de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    seq INT;
    number VARCHAR(20);
BEGIN
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM '\d+$')::INT), 0) + 1
    INTO seq
    FROM orders
    WHERE order_number LIKE 'NL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    number := 'NL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq::VARCHAR, 4, '0');
    RETURN number;
END;
$$ LANGUAGE plpgsql;

-- Mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DONNÉES DE TEST (optionnel)
-- ============================================

-- Catégories par défaut
INSERT INTO categories (name, slug, description, sort_order) VALUES
('Cartouches & Toners', 'cartouches-toners', 'Cartouches d''encre et toners pour imprimantes HP, Canon, Brother, Epson', 1),
('Câbles & Adaptateurs', 'cables-adaptateurs', 'Câbles HDMI, VGA, USB, Ethernet et adaptateurs divers', 2),
('Stockage & Mémoire', 'stockage-memoire', 'Clés USB, disques durs externes, SSD, cartes SD', 3),
('Accessoires PC', 'accessoires-pc', 'Souris, claviers, chargeurs, sacoches, supports', 4),
('Réseau & Connectique', 'reseau-connectique', 'Routeurs, switchs, répéteurs WiFi, câbles RJ45', 5),
('Audio & Visioconférence', 'audio-visioconference', 'Casques, webcams, microphones, enceintes', 6),
('Batteries & Alimentation', 'batteries-alimentation', 'Batteries PC, chargeurs universels, onduleurs', 7)
ON CONFLICT (slug) DO NOTHING;

-- Compte admin par défaut (mot de passe : Admin@123 - à changer immédiatement)
INSERT INTO admins (email, password_hash, full_name, role) VALUES
('admin@nigerlaptops.ne', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hamadine AG MOCTAR', 'super_admin')
ON CONFLICT (email) DO NOTHING;
