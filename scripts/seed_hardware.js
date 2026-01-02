import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup Env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Priority: Service Key (Admin) > Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env");
    console.log("Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are set.");
    process.exit(1);
}

console.log(`🔌 Connecting to Supabase: ${supabaseUrl}`);
const isServiceKey = supabaseKey.startsWith('ey') && supabaseKey.length > 200; // Rough check
if (!isServiceKey) console.warn("⚠️  Warning: Using ANON key. Deletes might fail if RLS policies block them.");

const supabase = createClient(supabaseUrl, supabaseKey);

const GRINDERS = [
    { name: '1Zpresso J-Ultra', type: 'Putaran (External)', coarse: '3.5 - 4.5 Putaran', medium: '2.5 - 3.5 Putaran', fine: '1.0 - 1.6 Putaran' },
    { name: '1Zpresso K-Ultra', type: 'Nomor (External)', coarse: 'Nomor 8 - 9', medium: 'Nomor 6 - 7.5', fine: 'Nomor 3 - 4.5' },
    { name: '1Zpresso Q Air / Q2', type: 'Klik (Internal)', coarse: '22 - 26 Klik', medium: '15 - 20 Klik', fine: '10 - 14 Klik' },
    { name: '1Zpresso X-Pro / X-Ultra', type: 'Putaran (External)', coarse: '2.0 - 2.4 Putaran', medium: '1.2 - 1.5 Putaran', fine: '0.3 - 0.5 Putaran' },
    { name: '1Zpresso ZP6 Special', type: 'Nomor (External)', coarse: 'Nomor 6.0 - 7.5', medium: 'Nomor 3.5 - 5.5', fine: '0 (Tidak Disarankan)' },
    { name: 'Breville Smart Grinder Pro', type: 'Setting (Electric)', coarse: 'Setting 50 - 60', medium: 'Setting 30 - 45', fine: 'Setting 1 - 25' },
    { name: 'Comandante C40 MK4', type: 'Klik (Internal)', coarse: '25 - 32 Klik', medium: '18 - 24 Klik', fine: '10 - 15 Klik' },
    { name: 'Comandante C60 Baracuda', type: 'Klik (Internal)', coarse: '35 - 45 Klik', medium: '20 - 30 Klik', fine: '10 - 18 Klik' },
    { name: 'Etzinger etz-I', type: 'Angka (External)', coarse: 'Angka 18 - 22', medium: 'Angka 12 - 16', fine: 'Angka 4 - 8' },
    { name: 'Hario Canister (C-20)', type: 'Notch (Internal)', coarse: '4 - 5 Notch', medium: '2 - 3 Notch', fine: '1 Notch' },
    { name: 'Hario Mini Slim+', type: 'Klik (Internal)', coarse: '10 - 13 Klik', medium: '7 - 10 Klik', fine: '3 - 5 Klik' },
    { name: 'Hario Skerton Pro', type: 'Notch (Internal)', coarse: '8 - 10 Notch', medium: '5 - 7 Notch', fine: '1 - 4 Notch' },
    { name: 'Kingrinder K6', type: 'Klik (External)', coarse: '90 - 120 Klik', medium: '60 - 90 Klik', fine: '30 - 50 Klik' },
    { name: 'Kingrinder P0/P1/P2', type: 'Klik (Internal)', coarse: '35 - 45 Klik', medium: '20 - 30 Klik', fine: '15 - 20 Klik' },
    { name: 'Kinu M47', type: 'Putaran (External)', coarse: '4.0 - 5.0 Putaran', medium: '2.5 - 3.5 Putaran', fine: '0.8 - 1.2 Putaran' },
    { name: 'Latina Sumba / Sumbawa', type: 'Klik (Internal)', coarse: '10 - 14 Klik', medium: '7 - 10 Klik', fine: '3 - 5 Klik' },
    { name: 'Latina Sumo', type: 'Klik (Internal)', coarse: '20 - 25 Klik', medium: '15 - 20 Klik', fine: '8 - 12 Klik' },
    { name: 'Mazzer Omega', type: 'Angka (External)', coarse: 'Angka 9 - 11', medium: 'Angka 6 - 8', fine: 'Angka 1 - 3' },
    { name: 'OE Lido 3 / OG', type: 'Mark (External)', coarse: '12 - 15 Mark', medium: '6 - 10 Mark', fine: '2 - 4 Mark' },
    { name: 'Pietro (Flat Burr)', type: 'Angka (Vertical)', coarse: 'Angka 7 - 9', medium: 'Angka 5 - 7', fine: 'Angka 1 - 2.5' },
    { name: 'Porlex Mini II', type: 'Klik (Internal)', coarse: '10 - 13 Klik', medium: '7 - 9 Klik', fine: '3 - 5 Klik' },
    { name: 'Starseeker Edge / Edge+', type: 'Klik (External)', coarse: '80 - 100 Klik', medium: '50 - 70 Klik', fine: '20 - 40 Klik' },
    { name: 'Timemore C2 / C3', type: 'Klik (Internal)', coarse: '20 - 26 Klik', medium: '13 - 16 Klik', fine: '10 - 12 Klik' },
    { name: 'Timemore C3 ESP', type: 'Klik (Multipoint)', coarse: '21 - 25 Klik', medium: '14 - 18 Klik', fine: '0.8 - 1.1 Putaran' },
    { name: 'Timemore Chestnut X', type: 'Mayor (Internal)', coarse: '20 - 24 Mayor', medium: '14 - 18 Mayor', fine: '6 - 10 Mayor' },
    { name: 'Timemore Nano / Plus', type: 'Klik (Internal)', coarse: '20 - 24 Klik', medium: '14 - 18 Klik', fine: '10 - 12 Klik' },
    { name: 'Timemore S3', type: 'Angka (External)', coarse: 'Angka 7.5 - 9.0', medium: 'Angka 4.5 - 6.5', fine: 'Angka 1.5 - 3.0' },
    { name: 'Timemore Slim Plus', type: 'Klik (Internal)', coarse: '22 - 26 Klik', medium: '15 - 20 Klik', fine: '10 - 14 Klik' },
    { name: 'Varia Hand Grinder', type: 'Klik (External)', coarse: '90 - 110 Klik', medium: '60 - 85 Klik', fine: '20 - 40 Klik' },
    { name: 'Wacaco Exagrind', type: 'Putaran/Klik', coarse: '1.5 - 2.0 Putaran', medium: '1.0 - 1.3 Putaran', fine: '0 - 20 Klik' }
];

const DRIPPERS = [
    { name: 'April Brewer', brand: 'April', type: 'Flat Bottom Dripper' },
    { name: 'Blue Bottle Dripper', brand: 'Blue Bottle', type: 'Flat Bottom Dripper' },
    { name: 'Brewista Gem Series', brand: 'Brewista', type: 'Gem Series Dripper' },
    { name: 'Brewista Tornado', brand: 'Brewista', type: 'Tornado Duo Dripper' },
    { name: 'Cafec Deep 27', brand: 'Cafec', type: 'Deep 27 Flower Dripper' },
    { name: 'Cafec Flower Dripper', brand: 'Cafec', type: 'Flower Dripper (Cone)' },
    { name: 'Chemex', brand: 'Chemex', type: 'Pour-over Glass Coffeemaker' },
    { name: 'Clever Dripper', brand: 'Clever', type: 'Immersion Dripper' },
    { name: 'Fellow Stagg [X]', brand: 'Fellow', type: 'Stagg [X] Flat Bottom' },
    { name: 'Hario Mugen', brand: 'Hario', type: 'V60 Mugen (One Pour)' },
    { name: 'Hario Switch', brand: 'Hario', type: 'Immersion Switch' },
    { name: 'Hario V60', brand: 'Hario', type: 'V60 Plastic/Ceramic/Glass' },
    { name: 'Hero Variable Dripper', brand: 'Hero', type: 'Variable Flow Dripper' },
    { name: 'Kalita 102', brand: 'Kalita', type: 'Trapezoid Dripper' },
    { name: 'Kalita Wave 155 / 185', brand: 'Kalita', type: 'Wave Flat Bottom' },
    { name: 'Kono Meimon', brand: 'Kono', type: 'Meimon Dripper' },
    { name: 'Latina Cono', brand: 'Latina', type: 'Cono Dripper' },
    { name: 'Latina Volcano', brand: 'Latina', type: 'Volcano Dripper' },
    { name: 'Loveramics', brand: 'Loveramics', type: 'Brewers (3 Flow Types)' },
    { name: 'Melitta', brand: 'Melitta', type: 'Aromaboy / 1x2 Trapezoid' },
    { name: 'MHW-3Bomber Elf', brand: 'MHW-3Bomber', type: 'Elf Dripper' },
    { name: 'Orea V3 / V4', brand: 'Orea', type: 'Flat Bottom Brewer' },
    { name: 'Origami Dripper (S/M)', brand: 'Origami', type: 'Folded Cone Dripper' },
    { name: 'Suji V60 Dripper', brand: 'Suji', type: 'Pourover Dripper' },
    { name: 'Suji Wave Dripper', brand: 'Suji', type: 'Wave Dripper' },
    { name: 'The Gabi Master A/B', brand: 'The Gabi', type: 'Master A/B Dripper' },
    { name: 'Timemore B75', brand: 'Timemore', type: 'B75 Flat Bottom' },
    { name: 'Timemore Crystal Eye', brand: 'Timemore', type: 'Crystal Eye V60' },
    { name: 'Torch Mountain', brand: 'Torch', type: 'Mountain Dripper' },
    { name: 'Vietnam Drip', brand: 'No Brand', type: 'Gravity Insert Dripper' }
];

async function seed() {
    console.log("🚀 Starting Hardware Seed Script...");

    // 1. DRIPPERS
    console.log("\n📦 Checking 'drippers' table...");
    // Test connection and existence
    const { error: checkError } = await supabase.from('drippers').select('id').limit(1);

    if (checkError) {
        console.error("❌ Error accessing 'drippers' table:", checkError.message);
        if (checkError.message.includes('relation') || checkError.code === '42P01') {
            console.error("\n=======================================================");
            console.error("🔴 CRITICAL: TABLE 'drippers' DOES NOT EXIST!");
            console.error("You MUST run the 'fix_data_entry.sql' script in your Supabase Dashboard SQL Editor.");
            console.error("This script cannot create tables from the client.");
            console.error("=======================================================\n");
        }
    } else {
        console.log("🗑️  Purging existing drippers...");
        // Hack: Delete where id > 0 (assuming int id)
        const { error: delError } = await supabase.from('drippers').delete().gt('id', 0);
        if (delError) console.error("⚠️  Delete failed (likely Row Level Security):", delError.message);

        console.log(`🌱 Inserting ${DRIPPERS.length} drippers...`);
        const { error: insError } = await supabase.from('drippers').insert(DRIPPERS);

        if (insError) {
            console.error("❌ Failed to insert drippers:", insError.message);
        } else {
            console.log("✅ Drippers inserted successfully!");
        }
    }

    // 2. GRINDERS
    console.log("\n📦 Checking 'grinders' table...");
    const { error: checkGError } = await supabase.from('grinders').select('id').limit(1);

    if (checkGError) {
        console.error("❌ Error accessing 'grinders' table:", checkGError.message);
    } else {
        console.log("🗑️  Purging existing grinders...");
        const { error: delGError } = await supabase.from('grinders').delete().gt('id', 0);
        if (delGError) console.error("⚠️  Delete failed:", delGError.message);

        console.log(`🌱 Inserting ${GRINDERS.length} grinders...`);
        // Insert in chunks if needed, but 30 is small enough
        const { error: insGError } = await supabase.from('grinders').insert(GRINDERS);

        if (insGError) {
            console.error("❌ Failed to insert grinders:", insGError.message);
        } else {
            console.log("✅ Grinders inserted successfully!");
        }
    }
}

seed();
