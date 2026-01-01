-- =================================================================
-- COMPLETE BREWLOGIC SUPABASE SETUP
-- Run this entire script in the Supabase SQL Editor to fix all issues.
-- =================================================================

-- 1. SETUP PRODUCTS TABLE (Membership Packages)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL
);

-- Safely Add Columns using DO block to avoid errors if they exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE products ADD COLUMN duration TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column duration already exists in products.';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN description TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column description already exists in products.';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN features JSONB DEFAULT '[]'::jsonb;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column features already exists in products.';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN is_best_seller BOOLEAN DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column is_best_seller already exists in products.';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column sort_order already exists in products.';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN monthly_price BIGINT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column monthly_price already exists in products.';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN savings_text TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column savings_text already exists in products.';
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN promo_text TEXT;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column promo_text already exists in products.';
    END;
END
$$;

-- 2. SETUP SITE_CONFIG TABLE (Content & Settings)
CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SETUP USERS TABLE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    name TEXT,
    plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SETUP TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    package_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SETUP GRINDERS TABLE
CREATE TABLE IF NOT EXISTS grinders (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    coarse TEXT,
    medium TEXT,
    fine TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- SECURITY POLICIES (RLS) & AUTH
-- =================================================================

-- Products Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Products' AND tablename = 'products' ) THEN
        CREATE POLICY "Public Access Products" ON products FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Site Config Policies
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Config' AND tablename = 'site_config' ) THEN
        CREATE POLICY "Public Access Config" ON site_config FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Transactions Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Transactions' AND tablename = 'transactions' ) THEN
        CREATE POLICY "Public Access Transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Grinders Policies
ALTER TABLE grinders ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Grinders' AND tablename = 'grinders' ) THEN
        CREATE POLICY "Public Access Grinders" ON grinders FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Users Policies (WARNING: Public Access Required for our Serverless Admin Panel)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Users' AND tablename = 'users' ) THEN
        CREATE POLICY "Public Access Users" ON users FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- =================================================================
-- FUNCTIONS & SEEDS
-- =================================================================

-- Login Function
CREATE OR REPLACE FUNCTION login_admin(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    found_user RECORD;
BEGIN
    SELECT * INTO found_user FROM users WHERE username = p_username;
    
    IF found_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    IF found_user.password <> p_password THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid password');
    END IF;
    
    IF found_user.role <> 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Access denied: Admin only');
    END IF;
    
    RETURN jsonb_build_object('success', true, 'user', row_to_json(found_user));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed Default Admin
INSERT INTO users (username, password, role, name)
VALUES ('admin', 'password123', 'admin', 'Super Admin')
ON CONFLICT (username) DO NOTHING;

-- Seed Default Products
INSERT INTO products (id, name, price, duration, description, features)
VALUES 
('starter-brew', 'Starter Brew', 50000, 'Billed Monthly', 'Perfect for home brewers starting their journey.', '["Akses Basic Tools", "5 Resep Bulanan", "Komunitas Basic"]'::jsonb),
('home-barista', 'Home Barista', 85000, 'Billed Quarterly', 'For the dedicated home barista.', '["Unlimited Recipes", "Advanced Tools", "Priority Support"]'::jsonb),
('pro-brewer', 'Pro Brewer', 150000, 'Billed Yearly', 'Ultimate control for serious brewers.', '["AI Coffee Analysis", "Commercial Tools", "Mentor Access"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    duration = EXCLUDED.duration,
    description = EXCLUDED.description,
    features = EXCLUDED.features;
