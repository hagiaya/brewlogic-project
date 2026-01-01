
import React, { useState, useEffect } from 'react';
import {
  Coffee, Settings, Droplets, ArrowRight, Share2,
  Activity, Wind, Zap, Flame, Clock, RefreshCw, Sliders, Snowflake, ThermometerSun, Sparkles, Home
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import {
  PROCESS_OPTIONS, VARIETY_OPTIONS, WATER_OPTIONS,
  GRINDERS, BREWERS, PROFILES
} from '../constants';
import { FormData, RecipeResult, Step } from '../types';
import { GlassCard, Label, InputField, SelectInput } from '../components/UI';
import { useToast } from '../components/Toast';

const LOADING_MESSAGES = [
  {
    "title": "Mengkalibrasi Variabel Rasa",
    "subtitle": "Mencari titik keseimbangan paling pas agar kopi Anda terasa istimewa."
  },
  {
    "title": "Menganalisa Karakter Biji",
    "subtitle": "Memahami profil unik kopi Anda demi ekstraksi rasa yang maksimal."
  },
  {
    "title": "Menghitung Rasio Presisi",
    "subtitle": "Memastikan setiap tetes air membawa kelezatan terbaik ke dalam cangkirmu."
  },
  {
    "title": "Meracik Metode Optimal",
    "subtitle": "Menentukan urutan tuangan yang paling cocok dengan alat pilihan Anda."
  },
  {
    "title": "Memburu Sweet Spot",
    "subtitle": "Menyelaraskan suhu dan gilingan agar rasa manis alaminya keluar sempurna."
  },
  {
    "title": "Mengoptimalkan Ekstraksi",
    "subtitle": "Mengatur variabel seduhan agar tidak ada rasa nikmat yang terlewatkan."
  },
  {
    "title": "Menyusun Logika Seduh",
    "subtitle": "Disesuaikan khusus untuk alat dan jenis kopi yang Anda gunakan hari ini."
  },
  {
    "title": "Mencari Keseimbangan Sempurna",
    "subtitle": "Menghitung waktu kontak air dan kopi agar hasilnya bersih dan seimbang."
  },
  {
    "title": "Menyelaraskan Resep Juara",
    "subtitle": "Menerapkan standar barista dunia ke dalam variabel seduhan personalmu."
  },
  {
    "title": "Memetakan Potensi Rasa",
    "subtitle": "Mengunci kombinasi terbaik agar karakter asli biji kopi Anda bersinar."
  }
];

export default function BrewingConsole() {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentLoadingIdx, setCurrentLoadingIdx] = useState<number>(0);
  const [result, setResult] = useState<RecipeResult | null>(null);
  const toast = useToast();

  // Form State
  const [formData, setFormData] = useState<FormData>({
    origin: '',
    process: PROCESS_OPTIONS[0],
    customProcess: '',
    variety: VARIETY_OPTIONS[0],
    customVariety: '',
    waterBrand: WATER_OPTIONS[0].id,
    customPPM: '',
    grinder: GRINDERS[0].id,
    brewer: BREWERS[0],
    profile: PROFILES[0].id,
    dose: 15,
    temperature: 'hot'
  });

  const [brewerList, setBrewerList] = useState<string[]>(BREWERS);

  // Fetch dynamic drippers
  useEffect(() => {
    const fetchDrippers = async () => {
      const { data } = await supabase.from('drippers').select('name');
      if (data && data.length > 0) {
        const names = data.map(d => d.name);
        // Filter duplicates if necessary, or just append. 
        // We'll just simple append for now.
        setBrewerList(prev => [...new Set([...prev, ...names])]);
      }
    };
    fetchDrippers();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateRecipe = async () => {
    // Pick random loading message
    setCurrentLoadingIdx(Math.floor(Math.random() * LOADING_MESSAGES.length));
    setLoading(true);

    try {
      const varietyName = formData.variety.includes("Lainnya")
        ? formData.customVariety
        : formData.variety;

      const processName = formData.process.includes("Lainnya")
        ? formData.customProcess
        : formData.process;

      const selectedWater = WATER_OPTIONS.find(w => w.id === formData.waterBrand);
      const effectivePPM = formData.waterBrand === 'other'
        ? parseInt(formData.customPPM) || 50
        : (selectedWater?.ppm || 50);

      const selectedGrinder = GRINDERS.find(g => g.id === formData.grinder);
      const doseNum = typeof formData.dose === 'string' ? parseFloat(formData.dose) : formData.dose;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `Act as a World Class Championship Barista and Coffee Scientist.
      Analyze the following coffee data and generate an optimized brewing recipe based on global specialty coffee standards:
      - Bean Identity: ${formData.origin}
      - Processing: ${processName}
      - Variety: ${varietyName}
      - Target Taste Profile: ${formData.profile} (options are: acidity, sweet, body, balance)
      - Hardware: ${formData.brewer}
      - Grinder: ${selectedGrinder?.name} (Standard Medium Range: ${selectedGrinder?.sedang.min}-${selectedGrinder?.sedang.max} ${selectedGrinder?.unit})
      - Water Chemistry: ${effectivePPM} PPM
      - Parameters: ${doseNum}g coffee, ${formData.temperature.toUpperCase()} brew.
      
      Rules:
      1. For ICED brew, use a higher ratio (approx 1:15 total) but divide into ~60% hot water and ~40% ice in server.
      2. For HOT brew, adjust ratio between 1:15 to 1:17 based on profile.
      3. Temperature should be between 80-99C.
      4. Grind setting MUST be a specific range (e.g., "14.5 - 15.5") within or slightly adjusted from the provided Medium Range for this grinder.
      5. Sequence must include a Bloom step and 2-3 subsequent pours.
      6. Each step note should be concise, clear, and professional.
      7. MANDATORY: All instructions in "action" and "note" inside the "steps" array MUST be in Indonesian (Bahasa Indonesia).
      8. Use professional Indonesian coffee terms: "Tuangan" instead of "Pour", "Aduk" instead of "Stir", etc. "Bloom" can stay as "Bloom".`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              temp: { type: Type.NUMBER, description: "Brewing temperature in Celsius" },
              time: { type: Type.STRING, description: "Total estimated time e.g. 02:30" },
              grind: { type: Type.STRING, description: "Specific grind setting range" },
              totalWater: { type: Type.NUMBER, description: "Total volume in ml" },
              brewingWater: { type: Type.NUMBER, description: "Hot water used for brewing in ml" },
              iceAmount: { type: Type.NUMBER, description: "Ice cubes in server in grams" },
              ratio: { type: Type.STRING, description: "Brew ratio e.g. 1:15" },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    action: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    note: { type: Type.STRING }
                  },
                  required: ["time", "action", "amount", "note"]
                }
              }
            },
            required: ["temp", "time", "grind", "totalWater", "brewingWater", "iceAmount", "ratio", "steps"]
          },
          temperature: 0.7,
        }
      });

      const resText = response.text;
      if (resText) {
        const parsedResult = JSON.parse(resText);
        setResult({
          ...parsedResult,
          effectivePPM
        });
      }

      setLoading(false);
      setStep(2);
    } catch (error) {
      console.error("AI Generation Failed", error);
      setLoading(false);
      toast.error("AI Analysis failed. Please check your parameters or try again.");
    }
  };

  const copyRecipe = () => {
    if (!result) return;

    let text = `BREWLOGIC AI-OPTIMIZED RECIPE\n${formData.origin} | ${formData.brewer} (${formData.temperature.toUpperCase()})\n`;
    text += `Target: ${formData.profile.toUpperCase()} | Temp: ${result.temp}°C\n`;
    text += `Grind: ${result.grind} | Ratio: ${result.ratio}\n`;
    if (result.iceAmount > 0) {
      text += `Ice in Server: ${result.iceAmount}g | Hot Water: ${result.brewingWater}ml\n`;
    }
    text += `\nSteps:\n${result.steps.map(s => `${s.time}: ${s.action} -> ${s.amount}ml\n   (${s.note})`).join('\n')}`;
    text += `\n\nTotal Estimated Time: ${result.time}`;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast.success("Resep berhasil disalin!")).catch(err => console.error(err));
    }
  };

  if (loading) {
    const msg = LOADING_MESSAGES[currentLoadingIdx];
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-zinc-900"></div>
          <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-[#D4F932] animate-spin"></div>
          <div className="absolute inset-4 rounded-full border border-dashed border-zinc-800 animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute flex flex-col items-center">
            <Sparkles size={32} className="text-[#D4F932] animate-pulse" />
          </div>
        </div>
        <div className="mt-12 max-w-xs space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight animate-in slide-in-from-bottom-2 duration-700">
            {msg.title}
          </h2>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-150">
            {msg.subtitle}
          </p>
        </div>
        <div className="mt-12 flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4F932] animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4F932] animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4F932] animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 font-sans selection:bg-[#D4F932] selection:text-black">

      <header className="px-6 pt-12 pb-6 flex justify-between items-end max-w-md mx-auto">
        <Link to="/" className="group">
          <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-1 group-hover:text-[#D4F932] transition-colors">
            BrewLogic
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#D4F932]" />
            AI Enhanced Console
          </p>
        </Link>
        <Link to="/" className="text-zinc-600 hover:text-white transition-colors">
          <Home size={20} />
        </Link>
      </header>

      <main className="max-w-md mx-auto px-6 relative space-y-8">

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

            <div className="bg-[#1C1C1E] p-1.5 rounded-2xl border border-zinc-800 flex relative">
              <button
                onClick={() => setFormData(prev => ({ ...prev, temperature: 'hot' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all z-10 ${formData.temperature === 'hot'
                  ? 'bg-[#D4F932] text-black shadow-lg shadow-[#D4F932]/10'
                  : 'text-zinc-500 hover:text-white'
                  }`}
              >
                <ThermometerSun size={18} />
                HOT BREW
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, temperature: 'iced' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all z-10 ${formData.temperature === 'iced'
                  ? 'bg-[#D4F932] text-black shadow-lg shadow-[#D4F932]/10'
                  : 'text-zinc-500 hover:text-white'
                  }`}
              >
                <Snowflake size={18} />
                ICED BREW
              </button>
            </div>

            <GlassCard>
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders size={16} className="text-[#D4F932]" />
                  <h3 className="text-white font-bold">Parameters</h3>
                </div>

                <div>
                  <Label>Origin / Brand Name</Label>
                  <InputField
                    type="text"
                    name="origin"
                    placeholder="e.g. Arabika Gayo, Blue Bottle Ethiopia..."
                    value={formData.origin}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dose (g)</Label>
                    <InputField
                      type="number"
                      name="dose"
                      value={formData.dose}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label>Process</Label>
                    <SelectInput name="process" value={formData.process} options={PROCESS_OPTIONS} onChange={handleInputChange} />
                    {formData.process.includes("Lainnya") && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                        <InputField
                          type="text"
                          name="customProcess"
                          placeholder="Describe the process..."
                          value={formData.customProcess}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Variety</Label>
                  <SelectInput name="variety" value={formData.variety} options={VARIETY_OPTIONS} onChange={handleInputChange} />
                  {formData.variety.includes("Lainnya") && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                      <InputField
                        type="text"
                        name="customVariety"
                        placeholder="Type variety..."
                        value={formData.customVariety}
                        onChange={handleInputChange}
                      />
                      <p className="text-[10px] text-zinc-600 mt-2 italic px-1">
                        Gunakan tanda koma (,) jika memasukkan lebih dari satu varietas.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={16} className="text-[#D4F932]" />
                  <h3 className="text-white font-bold">Hardware</h3>
                </div>

                <div>
                  <Label>Brewer</Label>
                  <SelectInput name="brewer" value={formData.brewer} options={brewerList} onChange={handleInputChange} />
                </div>

                <div>
                  <Label>Grinder Model</Label>
                  <SelectInput name="grinder" value={formData.grinder} options={GRINDERS} onChange={handleInputChange} />
                </div>

                <div>
                  <Label>Water Source</Label>
                  <SelectInput name="waterBrand" value={formData.waterBrand} options={WATER_OPTIONS} onChange={handleInputChange} />
                  {formData.waterBrand === 'other' && (
                    <div className="mt-3">
                      <InputField
                        type="number"
                        name="customPPM"
                        placeholder="Water PPM/TDS..."
                        value={formData.customPPM}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Target Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PROFILES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFormData(prev => ({ ...prev, profile: p.id }))}
                    className={`p-5 rounded-3xl flex flex-col items-start justify-between h-32 transition-all duration-300 ${formData.profile === p.id
                      ? 'bg-[#D4F932] text-black shadow-lg shadow-[#D4F932]/20 scale-[1.02]'
                      : 'bg-[#1C1C1E] text-zinc-400 hover:bg-zinc-800 border border-zinc-800/50'
                      }`}
                  >
                    <div className={`p-2 rounded-full ${formData.profile === p.id ? 'bg-black/10' : 'bg-black border border-zinc-800'}`}>
                      {p.icon}
                    </div>
                    <span className="font-bold text-sm tracking-wide">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {step === 2 && result && (
          <div className="animate-in slide-in-from-bottom-12 duration-700 space-y-6">

            <div className="bg-[#1C1C1E] rounded-[2.5rem] p-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4F932] rounded-full blur-[80px] opacity-20"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Total Beverage</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <h2 className="text-5xl font-bold text-white tracking-tight">{result.totalWater}</h2>
                      <span className="text-xl text-[#D4F932] font-medium">ml</span>
                    </div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-zinc-800/50 flex items-center gap-1.5">
                    <Sparkles size={10} className="text-[#D4F932]" />
                    <span className="text-[10px] font-mono font-bold text-zinc-300">{result.ratio}</span>
                  </div>
                </div>

                {result.iceAmount > 0 && (
                  <div className="flex gap-2 mb-6">
                    <div className="flex-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 flex items-center gap-3">
                      <div className="bg-[#D4F932]/10 p-2 rounded-full text-[#D4F932]">
                        <ThermometerSun size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Hot Water</p>
                        <p className="text-lg font-bold text-white">{result.brewingWater}g</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 flex items-center gap-3">
                      <div className="bg-cyan-500/10 p-2 rounded-full text-cyan-400">
                        <Snowflake size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Ice Cubes</p>
                        <p className="text-lg font-bold text-white">{result.iceAmount}g</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 text-center">
                  <div className="flex-1 bg-black/40 rounded-2xl py-4 px-1 border border-zinc-800 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Target End</span>
                    <span className="text-lg font-bold text-white">{result.time}</span>
                  </div>
                  <div className="flex-1 bg-black/40 rounded-2xl py-4 px-1 border border-zinc-800 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Temp</span>
                    <span className="text-lg font-bold text-white whitespace-nowrap">{result.temp}°C</span>
                  </div>
                  <div className="flex-1 bg-black/40 rounded-2xl py-4 px-1 border border-zinc-800 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Grind Size</span>
                    <span className="text-sm font-bold text-[#D4F932] leading-tight break-words w-full px-1">{result.grind}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 pl-2 flex items-center gap-2">
                <Clock size={14} />
                AI SEQUENCE
              </h3>
              <div className="bg-[#1C1C1E] rounded-[2rem] border border-zinc-800 overflow-hidden">
                {result.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-start p-5 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-black border border-zinc-800 flex items-center justify-center shrink-0 mr-4 mt-1 text-[#D4F932]">
                      {s.action.toLowerCase().includes("valve") ? <Activity size={18} /> : (idx === 0 ? <Wind size={18} /> : <Droplets size={18} />)}
                    </div>

                    <div className="flex-1 min-w-0 mr-4">
                      <h4 className="font-bold text-white leading-snug">{s.action}</h4>
                      <p className="text-xs text-zinc-400 font-mono mt-1.5 leading-relaxed">
                        <span className="font-bold text-zinc-500">{s.time}</span> • {s.note}
                      </p>
                    </div>

                    <div className="bg-[#D4F932] text-black px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 mt-1">
                      {s.amount}ml
                    </div>
                  </div>
                ))}
                <div className="px-6 py-4 bg-zinc-900/30 flex justify-between items-center border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Master Brew Analysis Complete</span>
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-[#D4F932]" />
                    <span className="text-xs text-zinc-400 font-bold">{result.time}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-10"></div>
          </div>
        )}

      </main>

      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
        {step === 1 ? (
          <button
            onClick={generateRecipe}
            className="pointer-events-auto bg-[#D4F932] text-black w-20 h-20 rounded-full shadow-[0_0_40px_-10px_rgba(212,249,50,0.4)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-[#050505] group"
          >
            <div className="relative">
              <ArrowRight size={32} className="group-hover:translate-x-1 transition-transform" />
              <Sparkles size={14} className="absolute -top-4 -right-4 text-black animate-pulse" />
            </div>
          </button>
        ) : (
          <div className="pointer-events-auto flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="bg-[#1C1C1E] text-white border border-zinc-700 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-zinc-800 transition-all"
            >
              <RefreshCw size={24} />
            </button>
            <button
              onClick={copyRecipe}
              className="bg-[#D4F932] text-black w-14 h-14 rounded-full shadow-[0_0_20px_-5px_rgba(212,249,50,0.4)] flex items-center justify-center hover:scale-105 transition-all"
            >
              <Share2 size={24} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
