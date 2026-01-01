import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sparkles, ArrowRight, Coffee, ShieldCheck, Zap, LayoutDashboard, Check,
    Smartphone, Sliders, PlayCircle, Star, Quote, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function LandingPage() {
    const navigate = useNavigate();

    const [content, setContent] = useState<any>({
        hero: {
            title: "Master Your \n Morning Ritual",
            subtitle: "BrewLogic adalah asisten seduh kopi pribadi berbasis AI yang dirancang untuk mengubah setiap home brewer menjadi barista ahli. Dengan menganalisis variabel kompleks seperti asal biji, proses pasca-panen, hingga jenis grinder, BrewLogic menciptakan resep presisi secara otomatis agar Anda bisa menikmati sweet spot kopi setiap hari tanpa trial-and-error yang boros.",
            ctaText: "Start Brewing Now",
            ctaLink: "/#pricing"
        },
        howItWorks: {
            title: "Cara Kerja BrewLogic",
            subtitle: "Tiga langkah sederhana menuju cangkir kopi sempurna, bertenaga kecerdasan buatan.",
            steps: [
                { title: "1. Input Variabel", desc: "Masukkan detail biji kopi (asal, proses), alat seduh, dan grinder yang Anda gunakan." },
                { title: "2. AI Calibration", desc: "Algoritma kami menganalisis ribuan data untuk menentukan suhu, gilingan, dan rasio ideal." },
                { title: "3. Seduh Presisi", desc: "Ikuti panduan step-by-step real-time: kapan menuang, kapan mengaduk, hingga tetes terakhir." }
            ]
        },
        pricing: {
            title: "Pilih Paket Membership",
            subtitle: "Investasi kecil untuk kenikmatan kopi sempurna setiap hari. Hemat hingga 58% dengan paket tahunan."
        },
        testimonials: {
            title: "Kata Mereka Tentang BrewLogic",
            items: [
                { name: "Andreas Lukman", role: "Home Brewer", text: "Saya selalu kesulitan menyeduh kopi anaerobic process. BrewLogic menyarankan suhu yang lebih rendah dan gilingan yang tak terpikirkan sebelumnya. Hasilnya? Manis luar biasa!" },
                { name: "Sarah Wijaya", role: "Coffee Shop Owner", text: "Fitur kalibrasi grindernya sangat akurat. Saya menggunakannya untuk menstandarisasi resep manual brew di kedai saya. Barista junior jadi lebih cepat belajar." },
                { name: "Budi Santoso", role: "Coffee Enthusiast", text: "Investasi terbaik untuk hobi kopi saya. Daripada buang biji mahal karena salah seduh, mending pakai BrewLogic. Rasanya konsisten setiap pagi." }
            ]
        },
        grinder: {
            title: "List Grinder dan Dripper yang tersedia di Brewlogic",
            subtitle: "BrewLogic mendukung kalibrasi untuk berbagai grinder populer di pasar. Cek apakah alatmu terdaftar.",
            disclaimer: "*Data ini adalah referensi awal. Hasil akhir dipengaruhi kalibrasi alat & usia burr. Alat Anda belum ada? <a href=\"#\" className=\"text-[#D4F932] underline hover:no-underline\">Request di sini.</a>"
        },
        faq: {
            title: "Pertanyaan Umum (FAQ)",
            items: [
                { question: "Apakah aplikasi ini cocok untuk pemula?", answer: "Sangat cocok! BrewLogic dirancang untuk memandu Anda dari nol. Anda hanya perlu memilih alat yang Anda punya, dan kami yang akan menghitung sisanya." }
            ]
        },
        finalCta: {
            title: "Siap Menyeduh Kopi Terbaikmu?",
            subtitle: "Bergabunglah sekarang dan rasakan perbedaan di cangkir pertama. Jangan biarkan biji kopi spesialmu tersia-sia.",
            buttonText: "Coba BrewLogic Sekarang"
        }
    });

    const [products, setProducts] = useState<any[]>([]);

    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

    useEffect(() => {
        // Fetch Content
        const fetchContent = async () => {
            const { data } = await supabase.from('site_config').select('value').eq('key', 'site_content').single();
            if (data && data.value) {
                setContent((prev: any) => ({ ...prev, ...data.value }));
            }
        };

        // Fetch Products
        const fetchProducts = async () => {
            const { data } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
            if (data) setProducts(data);
        };

        fetchContent();
        fetchProducts();
    }, []);

    const handleStartBrewing = () => {
        if (content.hero.ctaLink.startsWith('/#')) {
            const id = content.hero.ctaLink.substring(2);
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        } else if (content.hero.ctaLink.startsWith('http')) {
            window.location.href = content.hero.ctaLink;
        } else {
            navigate(content.hero.ctaLink);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-[#D4F932] selection:text-black font-sans">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-6 max-w-7xl mx-auto w-full backdrop-blur-sm bg-black/20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D4F932] flex items-center justify-center text-black">
                        <Sparkles size={18} />
                    </div>
                    <span className="font-bold text-xl tracking-tight">BrewLogic</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">
                        Member Login
                    </Link>
                    <button
                        onClick={handleStartBrewing}
                        className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-[#D4F932] transition-colors"
                    >
                        Get in
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-6 pt-20">
                {/* Background Gradients */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#D4F932] rounded-full blur-[120px] opacity-[0.05] pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[120px] opacity-[0.05] pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-[#D4F932] animate-pulse"></span>
                        <span className="text-xs font-medium text-zinc-300 tracking-wide uppercase">AI-Powered Brewing Intelligence</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-bold tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 whitespace-pre-line">
                        {content.hero.title}
                    </h1>

                    <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                        {content.hero.subtitle}
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={handleStartBrewing}
                            className="group relative px-8 py-4 bg-[#D4F932] text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 flex items-center gap-2 cursor-pointer"
                        >
                            {content.hero.ctaText}
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>

                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 px-6 border-t border-zinc-900 bg-zinc-900/10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">{content.howItWorks.title}</h2>
                        <p className="text-zinc-500 max-w-2xl mx-auto">{content.howItWorks.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-zinc-800 -z-10"></div>

                        {content.howItWorks.steps.map((step: any, i: number) => (
                            <div key={i} className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-[#111] border border-zinc-800 flex items-center justify-center text-[#D4F932] mb-6 shadow-xl relative z-10">
                                    {i === 0 ? <Sliders size={32} /> : i === 1 ? <Zap size={32} /> : <PlayCircle size={32} />}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-zinc-500 leading-relaxed px-4">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-6 relative bg-black border-t border-zinc-900">
                <div className="max-w-[90rem] mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4">{content.pricing.title}</h2>
                        <p className="text-zinc-500 max-w-xl mx-auto">{content.pricing.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                        {products.length > 0 ? products.map((prod, idx) => {
                            // Simple logic to highlight the most expensive plan or specific ID if needed
                            const isBestValue = prod.is_best_seller;
                            const isHighlight = prod.id === 'pro-brewer';

                            const pricePerMonthCalc = () => {
                                if (prod.monthly_price) {
                                    return `Rp${prod.monthly_price.toLocaleString()}`;
                                }
                                if (prod.duration?.includes('Yearly') || prod.duration?.includes('Tahun')) {
                                    return `Rp${Math.round(prod.price / 12).toLocaleString()}`;
                                } else if (prod.duration?.includes('Quarterly') || prod.duration?.includes('3 Bulan')) {
                                    return `Rp${Math.round(prod.price / 3).toLocaleString()}`;
                                }
                                return `Rp${prod.price.toLocaleString()}`;
                            };

                            return (
                                <PricingCard
                                    key={prod.id}
                                    id={prod.id}
                                    value={prod.price}
                                    title={prod.name}
                                    duration={prod.duration}
                                    price={`Rp${prod.price.toLocaleString()}`}
                                    pricePerMonth={pricePerMonthCalc()}
                                    features={Array.isArray(prod.features) ? prod.features : []}
                                    bestValue={isBestValue}
                                    highlight={isHighlight}
                                    description={prod.description}
                                    save={prod.savings_text}
                                    promo={prod.promo_text}
                                />
                            )
                        }) : (
                            <div className="col-span-full text-center text-zinc-500">Loading plans...</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 border-t border-zinc-900 bg-zinc-900/20 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>

                <h2 className="text-3xl font-bold text-center mb-16 relative z-10">{content.testimonials.title}</h2>

                <div className="flex pause-on-hover">
                    <div className="flex gap-6 animate-scroll-right min-w-max pl-6">
                        {content.testimonials.items && content.testimonials.items.length > 0 ? (
                            // Duplicate list to ensure scrolling loop works if few items
                            [...content.testimonials.items, ...content.testimonials.items, ...content.testimonials.items].map((t: any, i: number) => (
                                <div key={i} className="w-[400px]">
                                    <TestimonialCard
                                        name={t.name}
                                        role={t.role}
                                        text={t.text}
                                    />
                                </div>
                            ))
                        ) : (
                            // Fallback if empty
                            [1, 2, 3].map(i => <div key={i} className="text-zinc-500">No testimonials yet</div>)
                        )}
                    </div>
                </div>
            </section>

            {/* Supported Grinders Section */}
            <section className="py-24 px-6 border-t border-zinc-900 bg-black">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md mb-4">
                            <span className="w-2 h-2 rounded-full bg-[#D4F932]"></span>
                            <span className="text-xs font-medium text-zinc-300 uppercase">Hardware Support</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{content.grinder.title}</h2>
                        <p className="text-zinc-500 max-w-2xl mx-auto">
                            {content.grinder.subtitle}
                        </p>
                    </div>

                    <GrinderTable />

                    <div className="mt-6 text-center">
                        <p
                            className="text-xs text-zinc-600 bg-zinc-900/50 inline-block px-4 py-2 rounded-lg border border-zinc-800"
                            dangerouslySetInnerHTML={{ __html: content.grinder.disclaimer }}
                        ></p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6 border-t border-zinc-900">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">{content.faq.title}</h2>
                    <div className="space-y-4">
                        {content.faq.items.map((item: any, i: number) => (
                            <FAQItem
                                key={i}
                                question={item.question}
                                answer={item.answer}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-6 bg-[#D4F932] text-black">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h2 className="text-4xl font-bold tracking-tight">{content.finalCta.title}</h2>
                    <p className="text-lg font-medium opacity-80 max-w-xl mx-auto">
                        {content.finalCta.subtitle}
                    </p>
                    <div className="pt-4">
                        <Link
                            to="/app"
                            className="bg-black text-white px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform inline-flex items-center gap-2 shadow-2xl"
                        >
                            {content.finalCta.buttonText}
                            <ArrowRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-black text-center border-t border-transparent">
                <div className="flex justify-center gap-6 mb-8 text-zinc-500">
                    <a href="#" className="hover:text-white transition-colors">Instagram</a>
                    <a href="#" className="hover:text-white transition-colors">Threads</a>
                    <a href="#" className="hover:text-white transition-colors">TikTok</a>
                </div>
                <p className="text-zinc-600 text-sm">© 2024 BrewLogic Intelligence. All rights reserved.</p>
            </footer>
        </div>
    );
}

function PricingCard({ id, value, title, duration, price, pricePerMonth, save, promo, features, highlight = false, bestValue = false }: any) {
    return (
        <div className={`relative p-8 rounded-[2rem] border flex flex-col h-full transition-all duration-300 ${bestValue
            ? 'bg-[#1C1C1E] border-[#D4F932] shadow-[0_0_30px_-10px_rgba(212,249,50,0.2)] scale-105 z-10'
            : highlight
                ? 'bg-[#111] border-zinc-700 hover:border-zinc-500'
                : 'bg-[#09090b] border-zinc-800 hover:border-zinc-700'
            }`}>
            {bestValue && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-[#D4F932] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Best Value
                    </span>
                </div>
            )}

            <div className="mb-6">
                <h3 className={`text-lg font-bold ${bestValue ? 'text-[#D4F932]' : 'text-white'}`}>{title}</h3>
                <p className="text-zinc-500 text-sm font-medium mt-1">{duration}</p>
            </div>

            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{pricePerMonth}</span>
                    <span className="text-xs text-zinc-500">/mo</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm text-zinc-400">Total {price}</p>
                    {save && <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">{save}</span>}
                </div>

                {promo && (
                    <p className="text-xs font-bold text-[#D4F932] mt-2">
                        {promo}
                    </p>
                )}
            </div>

            <div className="space-y-3 mb-8 flex-1">
                {features.map((feat: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                        <Check size={16} className={`shrink-0 mt-0.5 ${bestValue ? 'text-[#D4F932]' : 'text-zinc-600'}`} />
                        <span className="text-sm text-zinc-300 leading-tight">{feat}</span>
                    </div>
                ))}
            </div>

            <Link
                to={`/checkout?pkg=${id}&val=${value}&name=${encodeURIComponent(title)}`}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all text-center block ${bestValue
                    ? 'bg-[#D4F932] text-black hover:brightness-110'
                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                    }`}>
                Pilih Paket
            </Link>
        </div>
    )
}

function TestimonialCard({ name, role, text }: any) {
    return (
        <div className="p-8 rounded-3xl bg-[#111] border border-zinc-800 relative">
            <Quote className="absolute top-6 left-6 text-zinc-700" size={24} />
            <p className="text-zinc-400 italic mb-6 mt-6 leading-relaxed">
                "{text}"
            </p>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                    {name[0]}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white">{name}</h4>
                    <p className="text-xs text-zinc-600">{role}</p>
                </div>
            </div>
        </div>
    )
}

function FAQItem({ question, answer }: any) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-zinc-800 rounded-2xl bg-[#111] overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-zinc-900 transition-colors"
            >
                <span className="font-bold text-white">{question}</span>
                {open ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
            </button>
            {open && (
                <div className="px-6 pb-6 text-zinc-400 text-sm leading-relaxed animate-in slide-in-from-top-2">
                    {answer}
                </div>
            )}
        </div>
    )
}

function GrinderTable() {
    const [activeTab, setActiveTab] = useState<'grinder' | 'dripper'>('grinder');
    const [search, setSearch] = useState("");
    const [grinders, setGrinders] = useState<any[]>([]);
    const [drippers, setDrippers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: grindersData } = await supabase.from('grinders').select('*');
            if (grindersData) setGrinders(grindersData);

            const { data: drippersData } = await supabase.from('drippers').select('*');
            if (drippersData) setDrippers(drippersData);

            setLoading(false);
        };
        fetchData();
    }, []);

    const currentData = activeTab === 'grinder' ? grinders : drippers;
    const filteredData = currentData.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="bg-[#111] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Search Header */}
            <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/30">
                <div className="flex items-center gap-6">
                    {/* Tabs */}
                    <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('grinder')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'grinder' ? 'bg-[#D4F932] text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Grinder
                        </button>
                        <button
                            onClick={() => setActiveTab('dripper')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dripper' ? 'bg-[#D4F932] text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Dripper
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="font-bold text-white text-lg hidden md:block">
                                Database {activeTab === 'grinder' ? 'Grinder' : 'Dripper'}
                            </h3>
                            <p className="text-xs text-zinc-500 hidden md:block">{filteredData.length} item ditemukan</p>
                        </div>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder={`Cari ${activeTab}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#D4F932] transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-wider font-bold">
                            <th className="p-4 border-b border-zinc-800 text-center w-16">No</th>
                            <th className="p-4 border-b border-zinc-800">Nama {activeTab === 'grinder' ? 'Grinder' : 'Dripper'}</th>
                            <th className="p-4 border-b border-zinc-800">{activeTab === 'grinder' ? 'Mekanisme' : 'Brand'}</th>
                            {activeTab === 'grinder' ? (
                                <>
                                    <th className="p-4 border-b border-zinc-800 text-[#D4F932]">Kasar (Tubruk)</th>
                                    <th className="p-4 border-b border-zinc-800 text-blue-400">Sedang (V60)</th>
                                    <th className="p-4 border-b border-zinc-800 text-red-400">Halus (Espresso)</th>
                                </>
                            ) : (
                                <th className="p-4 border-b border-zinc-800">Type / Model</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-sm md:text-base">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-zinc-500">Loading database...</td></tr>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((item, i) => (
                                <tr key={item.id || i} className="hover:bg-zinc-900/30 transition-colors group">
                                    <td className="p-4 text-center text-zinc-600 font-mono">{i + 1}</td>
                                    <td className="p-4 font-bold text-white group-hover:text-[#D4F932] transition-colors">{item.name}</td>

                                    {activeTab === 'grinder' ? (
                                        <>
                                            <td className="p-4 text-zinc-500 text-xs md:text-sm">{item.type}</td>
                                            <td className="p-4 text-zinc-300 bg-zinc-900/10 font-medium">{item.coarse}</td>
                                            <td className="p-4 text-zinc-300 bg-zinc-900/20 font-medium">{item.medium}</td>
                                            <td className="p-4 text-zinc-300 bg-zinc-900/30 font-medium">{item.fine}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-4 text-zinc-500">{item.brand || '-'}</td>
                                            <td className="p-4 text-zinc-300 font-medium">{item.type || '-'}</td>
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-zinc-500">
                                    <p className="mb-2">{activeTab === 'grinder' ? 'Grinder' : 'Dripper'} "{search}" tidak ditemukan.</p>
                                    <button onClick={() => setSearch('')} className="text-[#D4F932] hover:underline text-sm">Clear Search</button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
