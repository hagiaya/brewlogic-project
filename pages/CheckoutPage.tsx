
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, CreditCard, CheckCircle, Loader2, ArrowRight, Smartphone, ShieldCheck, Zap, Ticket, X, Upload, LayoutDashboard, Users, ShoppingCart, Coffee, Database, Settings, Trash2, UserPlus, Type, Edit, Check } from 'lucide-react';
import { trackEvent } from '../utils/pixel';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../components/Toast';



export default function CheckoutPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();
    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

    // Package Details from URL
    const pkgId = searchParams.get('pkg');
    const pkgName = searchParams.get('name') || 'Membership';
    const pkgValue = parseInt(searchParams.get('val') || '0');

    const [loading, setLoading] = useState(false);
    const [uniqueCode, setUniqueCode] = useState(0);
    const [finalTransferAmount, setFinalTransferAmount] = useState(0);
    const [qrisUrl, setQrisUrl] = useState('');
    const [banks, setBanks] = useState<any[]>([]);
    const [proofFile, setProofFile] = useState<File | null>(null);

    // Restored State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
    const [paymentMethod, setPaymentMethod] = useState('qris');
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRedeemVoucher = async () => {
        setLoading(true);
        // Simulating voucher check (replace with DB check if needed)
        if (voucherCode === 'BREW10') {
            setAppliedVoucher({ code: 'BREW10', discount_type: 'percentage', discount_value: 10 });
            setDiscountAmount(pkgValue * 0.1);
            toast.success("Voucher Applied!");
        } else {
            toast.error("Voucher Invalid");
        }
        setLoading(false);
    };

    const removeVoucher = () => {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        setVoucherCode('');
    };

    useEffect(() => {
        // Generate Unique Code on Mount (once)
        const code = Math.floor(Math.random() * 900) + 100; // 100-999
        setUniqueCode(code);

        // Fetch Manual Payment Data
        const fetchData = async () => {
            const { data: bankData } = await supabase.from('bank_accounts').select('*').eq('is_active', true);
            if (bankData) setBanks(bankData);

            const { data: qrisData } = await supabase.from('site_config').select('value').eq('key', 'qris_image').maybeSingle();
            if (qrisData) setQrisUrl(qrisData.value?.url);
        };
        fetchData();

    }, []);

    useEffect(() => {
        // Recalculate based on discount
        // Logic: finalTotal = pkgValue - discountAmount
    }, [discountAmount]); // We actually calculate finalTotal on render or useMemo

    // Derived finalTotal for render
    const finalTotal = (pkgValue || 0) - discountAmount;

    useEffect(() => {
        setFinalTransferAmount(finalTotal + uniqueCode);
    }, [finalTotal, uniqueCode]);



    const handlePayment = async () => {
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            toast.error("Harap lengkapi semua data diri termasuk password.");
            return;
        }

        // Manual validation
        if (paymentMethod === 'manual' && !proofFile) {
            toast.error("Mohon upload bukti transfer terlebih dahulu.");
            return;
        }

        setLoading(true);

        try {
            // 1. Register User (Same as before)
            // If Manual: Plan is PENDING_xxx (Admin must verify)
            // If Xendit: Plan is xxx (Auto-active, assuming payment success)
            const planStatus = paymentMethod === 'manual' ? `PENDING_${pkgName}` : pkgName;

            const regResponse = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.email,
                    password: formData.password,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    role: 'member',
                    plan: planStatus
                })
            });

            const regData = await regResponse.json();
            if (!regResponse.ok && regData.error !== 'Username already taken') {
                // Ignore 'taken' error to allow existing users to buy more
                throw new Error(regData.error || "Gagal mendaftar akun");
            }

            // 2. Upload Proof if manual
            let proofUrl = null;
            if (paymentMethod === 'manual' && proofFile) {
                const fileName = `proof-${Date.now()}-${formData.email}.jpg`;
                const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, proofFile);
                if (uploadError) throw new Error("Gagal upload bukti: " + uploadError.message);

                proofUrl = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl;
            }

            // 3. Create Transaction
            const response = await fetch(`${API_URL}/create-transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    total: finalTotal,
                    packageName: pkgName,
                    packageId: pkgId || 'custom-plan',
                    paymentMethod: paymentMethod,
                    uniqueCode: paymentMethod === 'manual' ? uniqueCode : 0,
                    proofImage: proofUrl
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            if (data.is_manual) {
                // SUCCESS MANUAL
                handleSuccess({ order_id: data.order_id, payment_type: 'manual_transfer' });
            } else if (data.redirect_url) {
                // XENDIT SUCCESS -> Redirect to Invoice URL
                window.location.href = data.redirect_url;
                setLoading(false);
            } else {
                throw new Error("Payment URL not found");
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
            setLoading(false);
        }
    };


    const handleSuccess = (result: any) => {
        // Simpan status subscription ke LocalStorage
        const expiryDate = new Date();
        if (pkgId?.includes("starter")) expiryDate.setMonth(expiryDate.getMonth() + 1);
        else if (pkgId?.includes("home")) expiryDate.setMonth(expiryDate.getMonth() + 3);
        else if (pkgId?.includes("pro")) expiryDate.setMonth(expiryDate.getMonth() + 6);
        else if (pkgId?.includes("master")) expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        else if (pkgId?.includes("lifetime") || pkgName?.toLowerCase().includes("lifetime")) expiryDate.setFullYear(expiryDate.getFullYear() + 100);
        else expiryDate.setMonth(expiryDate.getMonth() + 1); // Default

        const subData = {
            status: result.payment_type.includes('manual') ? 'pending' : 'active',
            plan: pkgName,
            expiry: expiryDate.toISOString(),
            user: formData,
            orderId: result.order_id,
            paymentType: result.payment_type
        };

        localStorage.setItem('brewlogic_sub', JSON.stringify(subData));

        trackEvent('Purchase', {
            value: pkgValue,
            currency: 'IDR',
            content_name: pkgName,
            content_ids: [pkgId || 'unknown'],
            content_type: 'product',
            order_id: result.order_id
        });

        setStep(3); // Move to Success
    };

    // Reusable Payment Button
    const PaymentButton = ({ mobileOnly = false }: { mobileOnly?: boolean }) => (
        <div className={mobileOnly ? 'lg:hidden mt-8' : 'hidden lg:block'}>
            <button
                onClick={handlePayment}
                disabled={loading}
                className={`w-full bg-[#D4F932] text-black rounded-full py-4 font-bold text-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,249,50,0.3)] mb-2`}
            >
                {loading ? (
                    <>
                        <Loader2 size={24} className="animate-spin" />
                        Memproses...
                    </>
                ) : (
                    <>
                        Bayar <span className="hidden xl:inline">Sekarang</span>
                        <ArrowRight size={20} />
                    </>
                )}
            </button>
            <p className="text-[10px] text-zinc-600 text-center">
                Pastikan data sudah benar sebelum lanjut.
            </p>
        </div>
    );

    if (step === 3) {
        if (paymentMethod === 'manual') {
            return (
                <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-8 animate-pulse">
                        <Loader2 size={48} />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Pendaftaran Berhasil</h1>
                    <p className="text-zinc-400 max-w-md mb-8 leading-relaxed">
                        Akun Anda <span className="text-white font-semibold">({formData.email})</span> dan password telah dibuat. <br /><br />
                        <span className="text-yellow-500 font-bold">Mohon menunggu konfirmasi Admin</span> untuk verifikasi pembayaran dan aktivasi akun agar bisa login.
                    </p>

                    <div className="bg-zinc-900/50 p-6 rounded-2xl mb-10 border border-zinc-800 text-sm w-full max-w-md text-left">
                        <p className="text-zinc-500 text-xs font-bold uppercase mb-4 text-center">Detail Pembayaran Manual</p>

                        {/* Bank List */}
                        <div className="space-y-4 mb-6">
                            {banks.map((bank: any) => (
                                <div key={bank.id} className="flex justify-between items-center border-b border-zinc-800 pb-2">
                                    <div>
                                        <p className="font-bold text-white">{bank.bank_name}</p>
                                        <p className="text-zinc-500 text-xs">{bank.account_holder}</p>
                                    </div>
                                    <p className="font-mono text-[#D4F932] font-bold text-lg">{bank.account_number}</p>
                                </div>
                            ))}
                        </div>

                        {/* QRIS */}
                        {qrisUrl && (
                            <div className="text-center mt-6 pt-6 border-t border-zinc-800">
                                <img src={qrisUrl} alt="QRIS" className="w-32 h-32 mx-auto rounded-lg mb-2" />
                                <p className="text-xs text-zinc-500">Scan QRIS</p>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-xs text-zinc-500 mb-1">Total Transfer (termasuk kode unik)</p>
                            <p className="text-2xl font-bold text-[#D4F932] font-mono">Rp{finalTransferAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <a href="/" className="bg-zinc-800 text-white px-8 py-3 rounded-full font-bold hover:bg-zinc-700 transition">
                        Kembali ke Home
                    </a>
                </div>
            );
        }

        // XENDIT SUCCESS OR OTHERS
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-[#D4F932] flex items-center justify-center text-black mb-8 animate-[bounce_1s_infinite]">
                    <CheckCircle size={48} />
                </div>
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Pembayaran Berhasil!</h1>
                <p className="text-zinc-500 max-w-md mb-8 text-lg">
                    Selamat bergabung, <span className="text-white font-semibold">{formData.name}</span>. <br />
                    Paket <span className="text-[#D4F932] font-bold">{pkgName}</span> Anda telah aktif.
                </p>
                <div className="bg-zinc-900/50 p-6 rounded-2xl mb-10 border border-zinc-800 text-sm w-full max-w-sm backdrop-blur-sm">
                    <p className="text-zinc-400 mb-2">Status Pembayaran</p>
                    <div className="flex items-center justify-center gap-2 text-[#D4F932] font-bold uppercase text-lg">
                        <ShieldCheck size={20} />
                        LUNAS via Xendit
                    </div>
                </div>
                <a href="/login" className="bg-[#D4F932] text-black px-8 py-3 rounded-full font-bold hover:brightness-110 transition shadow-[0_0_20px_rgba(212,249,50,0.4)]">
                    Mulai Brewing
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#D4F932] selection:text-black pb-12">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <Link to="/" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Checkout</h1>
                        <p className="text-xs text-zinc-500">Membership Setup</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

                    {/* LEFT COLUMN: FORMS */}
                    <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">

                        {/* 1. Data Diri */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-[#D4F932] text-black flex items-center justify-center font-bold text-sm">1</div>
                                <h2 className="text-xl font-bold">Informasi Data Diri</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#111] p-6 rounded-2xl border border-zinc-900">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4F932] focus:ring-1 focus:ring-[#D4F932] transition-all placeholder:text-zinc-700"
                                        placeholder="Contoh: Budi Santoso"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4F932] focus:ring-1 focus:ring-[#D4F932] transition-all placeholder:text-zinc-700"
                                        placeholder="nama@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">WhatsApp / Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4F932] focus:ring-1 focus:ring-[#D4F932] transition-all placeholder:text-zinc-700"
                                        placeholder="0812..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Buat Password / Kata Sandi</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4F932] focus:ring-1 focus:ring-[#D4F932] transition-all placeholder:text-zinc-700"
                                        placeholder="Min. 6 karakter"
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">Akun akan otomatis dibuat untuk login member area.</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Metode Pembayaran */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm">2</div>
                                <h2 className="text-xl font-bold">Metode Pembayaran</h2>
                            </div>

                            <div className="bg-[#111] p-6 rounded-2xl border border-zinc-900">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                    {[
                                        { id: 'xendit', name: 'Xendit (QRIS / VA)', sub: 'Instant Payment', icon: <Zap size={20} /> },
                                        { id: 'midtrans', name: 'Midtrans', sub: 'Gopay / ShopeePay / CC', icon: <Smartphone size={20} /> },
                                        { id: 'manual', name: 'Manual Transfer', sub: 'BCA / Mandiri / QRIS Manual', icon: <CreditCard size={20} /> },
                                    ].map((method) => (
                                        <div
                                            key={method.id}
                                            onClick={() => {
                                                setPaymentMethod(method.id);
                                            }}
                                            className={`relative border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] duration-200 ${paymentMethod === method.id
                                                ? 'bg-zinc-900 border-[#D4F932] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                                                : 'bg-black border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className={`p-2 rounded-lg ${paymentMethod === method.id ? 'bg-[#D4F932]/10 text-[#D4F932]' : 'bg-zinc-900 text-zinc-500'}`}>
                                                    {method.icon}
                                                </div>
                                                {paymentMethod === method.id && <div className="w-5 h-5 bg-[#D4F932] rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-black rounded-full"></div></div>}
                                            </div>
                                            <p className={`font-bold ${paymentMethod === method.id ? 'text-white' : 'text-zinc-400'}`}>{method.name}</p>
                                            <p className="text-xs text-zinc-600">{method.sub}</p>
                                        </div>
                                    ))}
                                </div>

                                {paymentMethod === 'manual' && (
                                    <div className="mt-6 bg-black border border-zinc-800 rounded-xl p-6 animate-in slide-in-from-top-4 fade-in">
                                        <div className="mb-6 text-center">
                                            <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Total Yang Harus Ditransfer</p>
                                            <p className="text-3xl font-bold text-[#D4F932]">Rp{finalTransferAmount.toLocaleString()}</p>
                                            <p className="text-xs text-zinc-500 mt-1">*Pastikan transfer sesuai hingga 3 digit terakhir ({uniqueCode})</p>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            {qrisUrl && (
                                                <div className="text-center">
                                                    <img src={qrisUrl} alt="QRIS" className="w-48 h-48 mx-auto rounded-lg mb-2" />
                                                    <p className="text-xs font-bold text-zinc-300">Scan QRIS Manual</p>
                                                </div>
                                            )}

                                            {banks.map((bank: any) => (
                                                <div key={bank.id} className="flex justify-between items-center border-b border-zinc-800 pb-2 bg-zinc-900/50 p-3 rounded-lg">
                                                    <div>
                                                        <p className="font-bold text-white">{bank.bank_name}</p>
                                                        <p className="text-zinc-400 text-xs">{bank.account_holder}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono text-[#D4F932] font-bold text-lg select-all cursor-pointer">{bank.account_number}</p>
                                                        <p className="text-[10px] text-zinc-600">Click to copy</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t border-dashed border-zinc-800 pt-6">
                                            <label className="block text-sm font-bold text-zinc-300 mb-2">Upload Bukti Transfer</label>
                                            <div className="relative border-2 border-dashed border-zinc-700 bg-zinc-900 rounded-lg p-4 text-center hover:border-[#D4F932] transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                                    <Upload size={24} />
                                                    <span className="text-xs">{proofFile ? proofFile.name : "Klik untuk upload screenshot"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <PaymentButton mobileOnly={true} />
                    </div>

                    {/* RIGHT COLUMN: SUMMARY (Sticky on Desktop) */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
                                {/* Decor */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4F932]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-6 pb-4 border-b border-zinc-800">Ringkasan Pesanan</h3>

                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">{pkgName}</h2>
                                        <div className="inline-flex items-center px-2 py-1 rounded bg-[#D4F932]/10 text-[#D4F932] text-xs font-medium">
                                            <Zap size={12} className="mr-1" />
                                            Active Plan
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-zinc-500 line-through decoration-red-500">Rp{((pkgValue || 0) * 1.5).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Voucher Section */}
                                <div className="mb-6">
                                    {!appliedVoucher ? (
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                                <input
                                                    value={voucherCode}
                                                    onChange={e => setVoucherCode(e.target.value)}
                                                    placeholder="Punya Kode Voucher?"
                                                    className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4F932]"
                                                />
                                            </div>
                                            <button
                                                onClick={handleRedeemVoucher}
                                                disabled={!voucherCode || loading}
                                                className="bg-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between bg-[#D4F932]/10 border border-[#D4F932]/20 p-3 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Ticket size={16} className="text-[#D4F932]" />
                                                <div>
                                                    <p className="text-xs font-bold text-[#D4F932]">{appliedVoucher.code}</p>
                                                    <p className="text-[10px] text-[#D4F932]/70">{appliedVoucher.discount_type === 'percentage' ? `${appliedVoucher.discount_value}% Discount` : 'Fixed Discount'}</p>
                                                </div>
                                            </div>
                                            <button onClick={removeVoucher} className="text-zinc-500 hover:text-white">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-dashed border-zinc-800 space-y-3">
                                    <div className="flex justify-between text-zinc-400 text-sm">
                                        <span>Subtotal</span>
                                        <span>Rp{pkgValue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400 text-sm">
                                        <span>Pajak (PPN 11%)</span>
                                        <span className="text-[#D4F932]">Included</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-4">
                                        <span className="text-white font-bold">Total Tagihan</span>
                                        <span className="text-3xl font-bold text-[#D4F932]">Rp{finalTotal.toLocaleString()}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-[#D4F932] text-sm">
                                            <span>Discount Applied</span>
                                            <span>-Rp{discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <PaymentButton mobileOnly={false} />
                                    <p className="text-center text-[10px] text-zinc-600 mt-4">
                                        By clicking Pay, you agree to our Terms & Conditions.
                                    </p>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex justify-center gap-4 opacity-30 grayscale transition-all hover:grayscale-0 hover:opacity-50">
                                {/* Simple text simulation for logos */}
                                <span className="text-xs font-bold font-serif tracking-widest text-zinc-300">VISA</span>
                                <span className="text-xs font-bold tracking-tight text-zinc-300">mastercard</span>
                                <span className="text-xs font-bold text-zinc-300">JCB</span>
                            </div>
                        </div>
                    </div>

                </div >
            </main >
        </div >
    );
}
