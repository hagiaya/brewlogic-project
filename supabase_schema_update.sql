-- Create table/config securely
CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Read' AND tablename = 'site_config' ) THEN
        CREATE POLICY "Allow Public Read" ON site_config FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Write' AND tablename = 'site_config' ) THEN
        CREATE POLICY "Allow Public Write" ON site_config FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Update' AND tablename = 'site_config' ) THEN
        CREATE POLICY "Allow Public Update" ON site_config FOR UPDATE USING (true);
    END IF;
END
$$;

-- Seed Config
INSERT INTO site_config (key, value) VALUES (
    'payment_settings',
    '{ "isProduction": false, "sandbox": { "serverKey": "", "clientKey": "" }, "production": { "serverKey": "", "clientKey": "" } }'::jsonb
) ON CONFLICT (key) DO NOTHING;

INSERT INTO site_config (key, value) VALUES (
    'site_content',
    '{
        "hero": { "title": "Master Your \n Morning Ritual", "subtitle": "BrewLogic is here...", "ctaText": "Start Brewing", "ctaLink": "/#pricing" },
        "howItWorks": { "title": "How It Works", "subtitle": "Simple steps...", "steps": [] },
        "pricing": { "title": "Pricing", "subtitle": "Choose your plan" },
        "testimonials": { "title": "Testimonials", "items": [] },
        "finalCta": { "title": "Ready?", "subtitle": "Join now.", "buttonText": "Lets go" }
    }'::jsonb
) ON CONFLICT (key) DO NOTHING;


-- === FIX: PRODUCTS TABLE ===

-- 1. Create table if it literally doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL
);

-- 2. Add missing columns safely (Configured for Postgres/Supabase)
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
END
$$;

-- 3. Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Select Products' AND tablename = 'products' ) THEN
        CREATE POLICY "Allow Public Select Products" ON products FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Insert Products' AND tablename = 'products' ) THEN
        CREATE POLICY "Allow Public Insert Products" ON products FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Update Products' AND tablename = 'products' ) THEN
        CREATE POLICY "Allow Public Update Products" ON products FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Delete Products' AND tablename = 'products' ) THEN
        CREATE POLICY "Allow Public Delete Products" ON products FOR DELETE USING (true);
    END IF;
END
$$;

-- 4. Seed Data (Upsert to update existing rows with new columns if they exist but are null)
INSERT INTO products (id, name, price, duration, description, features)
VALUES 
('starter-pack', 'Starter Pack', 50000, 'Billed Monthly', 'Perfect for home brewers starting their journey.', '["Akses Basic Tools", "5 Resep Bulanan", "Komunitas Basic"]'::jsonb),
('home-brewer', 'Home Brewer', 85000, 'Billed Quarterly', 'For the dedicated home barista.', '["Unlimited Recipes", "Advanced Tools", "Priority Support"]'::jsonb),
('pro-master', 'Pro Master', 150000, 'Billed Yearly', 'Ultimate control for serious brewers.', '["AI Coffee Analysis", "Commercial Tools", "Mentor Access"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    duration = EXCLUDED.duration,
    description = EXCLUDED.description,
    features = EXCLUDED.features;
