-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In production, hash this!
    role TEXT NOT NULL DEFAULT 'user',
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTS TABLE (Membership Packages)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, -- store IDs like 'starter', 'home_barista'
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY, -- Order ID from Midtrans
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    package_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, success, failed
    token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GRINDERS TABLE
CREATE TABLE IF NOT EXISTS grinders (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    coarse TEXT,
    medium TEXT,
    fine TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED DATA ----------------------------------------------------

-- Default Admin User
INSERT INTO users (id, username, password, role, name)
VALUES 
    (uuid_generate_v4(), 'admin', 'password123', 'admin', 'Super Admin')
ON CONFLICT (username) DO NOTHING;

-- Default Products
INSERT INTO products (id, name, price, duration)
VALUES
    ('starter', 'Starter Brew', 49000, '1 Bulan'),
    ('home_barista', 'Home Barista', 99000, '3 Bulan'),
    ('pro_brewer', 'Pro Brewer', 179000, '6 Bulan'),
    ('coffee_master', 'Coffee Master', 249000, '1 Tahun')
ON CONFLICT (id) DO UPDATE 
SET price = EXCLUDED.price, duration = EXCLUDED.duration;

-- Default Grinders
INSERT INTO grinders (name, type, coarse, medium, fine)
VALUES
    ('Timemore C2 / C3', 'Internal (Dial di bawah)', '20 - 26 Klik', '13 - 16 Klik', '10 - 12 Klik*'),
    ('Comandante C40 MK4', 'Internal (Dial tiga kaki)', '25 - 32 Klik', '18 - 24 Klik', '10 - 15 Klik'),
    ('Kingrinder K6', 'Eksternal (Ring atas)', '90 - 120 Klik', '60 - 90 Klik', '30 - 50 Klik'),
    ('1Zpresso K-Ultra', 'Eksternal (Ring atas)', 'Nomor 8 - 9', 'Nomor 6 - 7.5', 'Nomor 3 - 4.5'),
    ('Hario Skerton Pro', 'Internal (Collar bawah)', '8 - 10 Notch', '5 - 7 Notch', '1 - 4 Notch'),
    ('Timemore C3 ESP', 'Internal (Dial Multipoint)', '21 - 25 Klik', '14 - 18 Klik', '0.8 - 1.1 Putaran'),
    ('1Zpresso J-Ultra', 'Eksternal (Ring atas)', '3.5 - 4.5 Putaran', '2.5 - 3.5 Putaran', '1.0 - 1.6 Putaran'),
    ('Latina Sumo', 'Internal (Dial di bawah)', '20+ Klik', '15 - 20 Klik', '8 - 12 Klik'),
    ('Kinu M47', 'Eksternal (Micrometric)', '4.0+ Putaran', '2.5 - 3.5 Putaran', '0.8 - 1.2 Putaran'),
    ('Kingrinder P0/P1/P2', 'Internal (Dial di bawah)', '35+ Klik', '20 - 30 Klik', '15 - 20 Klik*'),
    ('Hario Mini Slim+', 'Internal (Collar bawah)', '10 - 13 Klik', '7 - 10 Klik', '3 - 5 Klik'),
    ('1Zpresso Q Air / Q2', 'Internal (Dial di bawah)', '22 - 26 Klik', '15 - 20 Klik', '10 - 14 Klik*'),
    ('Timemore Slim Plus', 'Internal (Dial di bawah)', '22 - 26 Klik', '15 - 20 Klik', '10 - 14 Klik'),
    ('Porlex Mini II', 'Internal (Dial di bawah)', '10 - 13 Klik', '7 - 9 Klik', '3 - 5 Klik'),
    ('Varia Hand Grinder', 'Eksternal (Ring atas)', '90 - 110 Klik', '60 - 85 Klik', '20 - 40 Klik'),
    ('Breville Smart Grinder Pro', 'Elektrik (LCD & Dial)', 'Setting 50 - 60', 'Setting 30 - 45', 'Setting 1 - 25'),
    ('1Zpresso ZP6 Special', 'Eksternal (Ring atas)', 'Nomor 6.0 - 7.0+', 'Nomor 3.5 - 5.5', 'TIDAK DISARANKAN'),
    ('Timemore S3', 'Eksternal (Ring atas)', 'Angka 7.5 - 9.0', 'Angka 4.5 - 6.5', 'Angka 1.5 - 3.0');
