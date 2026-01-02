import React from 'react';
import { Wind, Droplets, Zap, Coffee } from 'lucide-react';
import { GrinderOption, ProfileOption, WaterOption } from './types';

export const PROCESS_OPTIONS = [
  "Washed",
  "Natural",
  "Honey",
  "Anaerobic / Fermented",
  "Wet Hulled (Giling Basah)",
  "Experimental / Infused",
  "Lainnya (Input Manual)"
];

export const VARIETY_OPTIONS = [
  "Abyssinia",
  "Bourbon",
  "Catimor",
  "Caturra / Catuai",
  "Ethiopian Heirlooms",
  "Geisha",
  "P88",
  "Robusta (Fine Robusta)",
  "S795 (Jember)",
  "Sigararutang / Ateng",
  "Typica",
  "Mix Variety",
  "Lainnya (Input Manual)"
];

export const WATER_OPTIONS: WaterOption[] = [
  { id: 'aqua', name: 'Aqua (Danone)', ppm: 140 },
  { id: 'le_minerale', name: 'Le Minerale', ppm: 100 },
  { id: 'nestle', name: 'Nestle Pure Life', ppm: 50 },
  { id: 'cleo', name: 'Cleo (Distilled/RO)', ppm: 10 },
  { id: 'amidis', name: 'Amidis (Distilled)', ppm: 0 },
  { id: 'other', name: 'Lainnya (Input PPM)', ppm: 0 }
];

export const GRINDERS: GrinderOption[] = [
  { id: '1zpresso_jultra', name: '1Zpresso J-Ultra', unit: 'Putaran', kasar: { min: 3.5, max: 4.5 }, sedang: { min: 2.5, max: 3.5 }, halus: { min: 1.0, max: 1.6 } },
  { id: '1zpresso_kultra', name: '1Zpresso K-Ultra', unit: 'Nomor', kasar: { min: 8, max: 9 }, sedang: { min: 6, max: 7.5 }, halus: { min: 3, max: 4.5 } },
  { id: '1zpresso_q', name: '1Zpresso Q Air / Q2', unit: 'Klik', kasar: { min: 22, max: 26 }, sedang: { min: 15, max: 20 }, halus: { min: 10, max: 14 } },
  { id: '1zpresso_xpro', name: '1Zpresso X-Pro / X-Ultra', unit: 'Putaran', kasar: { min: 2.0, max: 2.4 }, sedang: { min: 1.2, max: 1.5 }, halus: { min: 0.3, max: 0.5 } },
  { id: '1zpresso_zp6', name: '1Zpresso ZP6 Special', unit: 'Nomor', kasar: { min: 6.0, max: 7.5 }, sedang: { min: 3.5, max: 5.5 }, halus: { min: 0, max: 0 } },
  { id: 'breville_smart', name: 'Breville Smart Grinder Pro', unit: 'Setting', kasar: { min: 50, max: 60 }, sedang: { min: 30, max: 45 }, halus: { min: 1, max: 25 } },
  { id: 'comandante', name: 'Comandante C40 MK4', unit: 'Klik', kasar: { min: 25, max: 32 }, sedang: { min: 18, max: 24 }, halus: { min: 10, max: 15 } },
  { id: 'comandante_c60', name: 'Comandante C60 Baracuda', unit: 'Klik', kasar: { min: 35, max: 45 }, sedang: { min: 20, max: 30 }, halus: { min: 10, max: 18 } },
  { id: 'etzinger_etzi', name: 'Etzinger etz-I', unit: 'Angka', kasar: { min: 18, max: 22 }, sedang: { min: 12, max: 16 }, halus: { min: 4, max: 8 } },
  { id: 'hario_canister', name: 'Hario Canister (C-20)', unit: 'Notch', kasar: { min: 4, max: 5 }, sedang: { min: 2, max: 3 }, halus: { min: 1, max: 1 } },
  { id: 'hario_minislim', name: 'Hario Mini Slim+', unit: 'Klik', kasar: { min: 10, max: 13 }, sedang: { min: 7, max: 10 }, halus: { min: 3, max: 5 } },
  { id: 'hario_skerton', name: 'Hario Skerton Pro', unit: 'Notch', kasar: { min: 8, max: 10 }, sedang: { min: 5, max: 7 }, halus: { min: 1, max: 4 } },
  { id: 'kingrinder_k6', name: 'Kingrinder K6', unit: 'Klik', kasar: { min: 90, max: 120 }, sedang: { min: 60, max: 90 }, halus: { min: 30, max: 50 } },
  { id: 'kingrinder_p', name: 'Kingrinder P0/P1/P2', unit: 'Klik', kasar: { min: 35, max: 45 }, sedang: { min: 20, max: 30 }, halus: { min: 15, max: 20 } },
  { id: 'kinu_m47', name: 'Kinu M47', unit: 'Putaran', kasar: { min: 4.0, max: 5.0 }, sedang: { min: 2.5, max: 3.5 }, halus: { min: 0.8, max: 1.2 } },
  { id: 'latina_sumba', name: 'Latina Sumba / Sumbawa', unit: 'Klik', kasar: { min: 10, max: 14 }, sedang: { min: 7, max: 10 }, halus: { min: 3, max: 5 } },
  { id: 'latina_sumo', name: 'Latina Sumo', unit: 'Klik', kasar: { min: 20, max: 25 }, sedang: { min: 15, max: 20 }, halus: { min: 8, max: 12 } },
  { id: 'mazzer_omega', name: 'Mazzer Omega', unit: 'Angka', kasar: { min: 9, max: 11 }, sedang: { min: 6, max: 8 }, halus: { min: 1, max: 3 } },
  { id: 'oe_lido', name: 'OE Lido 3 / OG', unit: 'Mark', kasar: { min: 12, max: 15 }, sedang: { min: 6, max: 10 }, halus: { min: 2, max: 4 } },
  { id: 'pietro', name: 'Pietro (Flat Burr)', unit: 'Angka', kasar: { min: 7, max: 9 }, sedang: { min: 5, max: 7 }, halus: { min: 1, max: 2.5 } },
  { id: 'porlex_mini', name: 'Porlex Mini II', unit: 'Klik', kasar: { min: 10, max: 13 }, sedang: { min: 7, max: 9 }, halus: { min: 3, max: 5 } },
  { id: 'starseeker_edge', name: 'Starseeker Edge / Edge+', unit: 'Klik', kasar: { min: 80, max: 100 }, sedang: { min: 50, max: 70 }, halus: { min: 20, max: 40 } },
  { id: 'timemore_c2', name: 'Timemore C2 / C3', unit: 'Klik', kasar: { min: 20, max: 26 }, sedang: { min: 13, max: 16 }, halus: { min: 10, max: 12 } },
  { id: 'timemore_c3esp', name: 'Timemore C3 ESP', unit: 'Klik/Putaran', kasar: { min: 21, max: 25 }, sedang: { min: 14, max: 18 }, halus: { min: 0.8, max: 1.1 } },
  { id: 'timemore_chestnut_x', name: 'Timemore Chestnut X', unit: 'Mayor', kasar: { min: 20, max: 24 }, sedang: { min: 14, max: 18 }, halus: { min: 6, max: 10 } },
  { id: 'timemore_nano', name: 'Timemore Nano / Plus', unit: 'Klik', kasar: { min: 20, max: 24 }, sedang: { min: 14, max: 18 }, halus: { min: 10, max: 12 } },
  { id: 'timemore_s3', name: 'Timemore S3', unit: 'Angka', kasar: { min: 7.5, max: 9.0 }, sedang: { min: 4.5, max: 6.5 }, halus: { min: 1.5, max: 3.0 } },
  { id: 'timemore_slimplus', name: 'Timemore Slim Plus', unit: 'Klik', kasar: { min: 22, max: 26 }, sedang: { min: 15, max: 20 }, halus: { min: 10, max: 14 } },
  { id: 'varia_hand', name: 'Varia Hand Grinder', unit: 'Klik', kasar: { min: 90, max: 110 }, sedang: { min: 60, max: 85 }, halus: { min: 20, max: 40 } },
  { id: 'wacaco_exagrind', name: 'Wacaco Exagrind', unit: 'Putaran/Klik', kasar: { min: 1.5, max: 2.0 }, sedang: { min: 1.0, max: 1.3 }, halus: { min: 0, max: 20 } },
  { id: 'other', name: 'Lainnya (Input Manual)', unit: 'Custom', kasar: { min: 0, max: 0 }, sedang: { min: 0, max: 0 }, halus: { min: 0, max: 0 } }
];

export const BREWERS = [
  "April Brewer",
  "Blue Bottle Dripper",
  "Brewista Gem Series",
  "Brewista Tornado",
  "Cafec Deep 27",
  "Cafec Flower Dripper",
  "Chemex",
  "Clever Dripper",
  "Fellow Stagg [X]",
  "Hario Mugen",
  "Hario Switch",
  "Hario V60 (Plastic/Ceramic)",
  "Hero Variable Dripper",
  "Kalita 102 (Trapezoid)",
  "Kalita Wave 155 / 185",
  "Kono Meimon",
  "Latina Cono",
  "Latina Volcano",
  "Loveramics (3 Types)",
  "Melitta (Aromaboy/1x2)",
  "MHW-3Bomber Elf",
  "Orea V3 / V4",
  "Origami Dripper (S/M)",
  "Suji V60 Dripper",
  "Suji Wave Dripper",
  "The Gabi Master A/B",
  "Timemore B75",
  "Timemore Crystal Eye",
  "Torch Mountain",
  "Vietnam Drip",
  "Lainnya (Input Manual)"
];

export const PROFILES: ProfileOption[] = [
  { id: 'balance', label: 'Balance & Clean', icon: <Wind size={14} /> },
  { id: 'sweet', label: 'More Sweetness', icon: <Droplets size={14} /> },
  { id: 'acidity', label: 'More Acidity', icon: <Zap size={14} /> },
  { id: 'body', label: 'More Body', icon: <Coffee size={14} /> },
];