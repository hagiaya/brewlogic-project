-- Fix Data Entry for Grinders and Drippers
-- This script ensures all grinders and drippers from the app constants are in the database.

-- 1. Setup Drippers Table (if not exists)
CREATE TABLE IF NOT EXISTS drippers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Drippers
ALTER TABLE drippers ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS ( SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Drippers' AND tablename = 'drippers' ) THEN
        CREATE POLICY "Public Access Drippers" ON drippers FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;


-- 2. Populate Grinders
-- We truncate to regenerate the list cleanly from the Source of Truth (constants.tsx)
TRUNCATE TABLE grinders RESTART IDENTITY;

INSERT INTO grinders (name, type, coarse, medium, fine)
VALUES
  ('1Zpresso J-Ultra', 'Putaran (External)', '3.5 - 4.5 Putaran', '2.5 - 3.5 Putaran', '1.0 - 1.6 Putaran'),
  ('1Zpresso K-Ultra', 'Nomor (External)', 'Nomor 8 - 9', 'Nomor 6 - 7.5', 'Nomor 3 - 4.5'),
  ('1Zpresso Q Air / Q2', 'Klik (Internal)', '22 - 26 Klik', '15 - 20 Klik', '10 - 14 Klik'),
  ('1Zpresso X-Pro / X-Ultra', 'Putaran (External)', '2.0 - 2.4 Putaran', '1.2 - 1.5 Putaran', '0.3 - 0.5 Putaran'),
  ('1Zpresso ZP6 Special', 'Nomor (External)', 'Nomor 6.0 - 7.5', 'Nomor 3.5 - 5.5', '0 (Tidak Disarankan)'),
  ('Breville Smart Grinder Pro', 'Setting (Electric)', 'Setting 50 - 60', 'Setting 30 - 45', 'Setting 1 - 25'),
  ('Comandante C40 MK4', 'Klik (Internal)', '25 - 32 Klik', '18 - 24 Klik', '10 - 15 Klik'),
  ('Comandante C60 Baracuda', 'Klik (Internal)', '35 - 45 Klik', '20 - 30 Klik', '10 - 18 Klik'),
  ('Etzinger etz-I', 'Angka (External)', 'Angka 18 - 22', 'Angka 12 - 16', 'Angka 4 - 8'),
  ('Hario Canister (C-20)', 'Notch (Internal)', '4 - 5 Notch', '2 - 3 Notch', '1 Notch'),
  ('Hario Mini Slim+', 'Klik (Internal)', '10 - 13 Klik', '7 - 10 Klik', '3 - 5 Klik'),
  ('Hario Skerton Pro', 'Notch (Internal)', '8 - 10 Notch', '5 - 7 Notch', '1 - 4 Notch'),
  ('Kingrinder K6', 'Klik (External)', '90 - 120 Klik', '60 - 90 Klik', '30 - 50 Klik'),
  ('Kingrinder P0/P1/P2', 'Klik (Internal)', '35 - 45 Klik', '20 - 30 Klik', '15 - 20 Klik'),
  ('Kinu M47', 'Putaran (External)', '4.0 - 5.0 Putaran', '2.5 - 3.5 Putaran', '0.8 - 1.2 Putaran'),
  ('Latina Sumba / Sumbawa', 'Klik (Internal)', '10 - 14 Klik', '7 - 10 Klik', '3 - 5 Klik'),
  ('Latina Sumo', 'Klik (Internal)', '20 - 25 Klik', '15 - 20 Klik', '8 - 12 Klik'),
  ('Mazzer Omega', 'Angka (External)', 'Angka 9 - 11', 'Angka 6 - 8', 'Angka 1 - 3'),
  ('OE Lido 3 / OG', 'Mark (External)', '12 - 15 Mark', '6 - 10 Mark', '2 - 4 Mark'),
  ('Pietro (Flat Burr)', 'Angka (Vertical)', 'Angka 7 - 9', 'Angka 5 - 7', 'Angka 1 - 2.5'),
  ('Porlex Mini II', 'Klik (Internal)', '10 - 13 Klik', '7 - 9 Klik', '3 - 5 Klik'),
  ('Starseeker Edge / Edge+', 'Klik (External)', '80 - 100 Klik', '50 - 70 Klik', '20 - 40 Klik'),
  ('Timemore C2 / C3', 'Klik (Internal)', '20 - 26 Klik', '13 - 16 Klik', '10 - 12 Klik'),
  ('Timemore C3 ESP', 'Klik (Multipoint)', '21 - 25 Klik', '14 - 18 Klik', '0.8 - 1.1 Putaran'),
  ('Timemore Chestnut X', 'Mayor (Internal)', '20 - 24 Mayor', '14 - 18 Mayor', '6 - 10 Mayor'),
  ('Timemore Nano / Plus', 'Klik (Internal)', '20 - 24 Klik', '14 - 18 Klik', '10 - 12 Klik'),
  ('Timemore S3', 'Angka (External)', 'Angka 7.5 - 9.0', 'Angka 4.5 - 6.5', 'Angka 1.5 - 3.0'),
  ('Timemore Slim Plus', 'Klik (Internal)', '22 - 26 Klik', '15 - 20 Klik', '10 - 14 Klik'),
  ('Varia Hand Grinder', 'Klik (External)', '90 - 110 Klik', '60 - 85 Klik', '20 - 40 Klik'),
  ('Wacaco Exagrind', 'Putaran/Klik', '1.5 - 2.0 Putaran', '1.0 - 1.3 Putaran', '0 - 20 Klik');


-- 3. Populate Drippers
TRUNCATE TABLE drippers RESTART IDENTITY;

INSERT INTO drippers (name, brand, type)
VALUES
  ('April Brewer', 'April', 'Flat Bottom Dripper'),
  ('Blue Bottle Dripper', 'Blue Bottle', 'Flat Bottom Dripper'),
  ('Brewista Gem Series', 'Brewista', 'Gem Series Dripper'),
  ('Brewista Tornado', 'Brewista', 'Tornado Duo Dripper'),
  ('Cafec Deep 27', 'Cafec', 'Deep 27 Flower Dripper'),
  ('Cafec Flower Dripper', 'Cafec', 'Flower Dripper (Cone)'),
  ('Chemex', 'Chemex', 'Pour-over Glass Coffeemaker'),
  ('Clever Dripper', 'Clever', 'Immersion Dripper'),
  ('Fellow Stagg [X]', 'Fellow', 'Stagg [X] Flat Bottom'),
  ('Hario Mugen', 'Hario', 'V60 Mugen (One Pour)'),
  ('Hario Switch', 'Hario', 'Immersion Switch'),
  ('Hario V60', 'Hario', 'V60 Plastic/Ceramic/Glass'),
  ('Hero Variable Dripper', 'Hero', 'Variable Flow Dripper'),
  ('Kalita 102', 'Kalita', 'Trapezoid Dripper'),
  ('Kalita Wave 155 / 185', 'Kalita', 'Wave Flat Bottom'),
  ('Kono Meimon', 'Kono', 'Meimon Dripper'),
  ('Latina Cono', 'Latina', 'Cono Dripper'),
  ('Latina Volcano', 'Latina', 'Volcano Dripper'),
  ('Loveramics', 'Loveramics', 'Brewers (3 Flow Types)'),
  ('Melitta', 'Melitta', 'Aromaboy / 1x2 Trapezoid'),
  ('MHW-3Bomber Elf', 'MHW-3Bomber', 'Elf Dripper'),
  ('Orea V3 / V4', 'Orea', 'Flat Bottom Brewer'),
  ('Origami Dripper (S/M)', 'Origami', 'Folded Cone Dripper'),
  ('Suji V60 Dripper', 'Suji', 'Pourover Dripper'),
  ('Suji Wave Dripper', 'Suji', 'Wave Dripper'),
  ('The Gabi Master A/B', 'The Gabi', 'Master A/B Dripper'),
  ('Timemore B75', 'Timemore', 'B75 Flat Bottom'),
  ('Timemore Crystal Eye', 'Timemore', 'Crystal Eye V60'),
  ('Torch Mountain', 'Torch', 'Mountain Dripper'),
  ('Vietnam Drip', 'No Brand', 'Gravity Insert Dripper');
