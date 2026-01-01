import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Trash, Plus, CreditCard, Upload, Zap, ShieldCheck, CheckCircle, Edit } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function PaymentSettings() {
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [qrisUrl, setQrisUrl] = useState('');
    const [paymentSettings, setPaymentSettings] = useState<any>(null);
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newBank, setNewBank] = useState({
        bank_name: '',
        account_number: '',
        account_holder: ''
    });

    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

    useEffect(() => {
        fetchBanks();
        fetchQris();
        fetchPaymentSettings();
    }, []);

    const fetchBanks = async () => {
        try {
            const { data } = await supabase.from('bank_accounts').select('*');
            if (data) setBanks(data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchQris = async () => {
        const { data } = await supabase.from('site_config').select('value').eq('key', 'qris_image').maybeSingle();
        if (data) setQrisUrl(data.value?.url || '');
    };

    const fetchPaymentSettings = async () => {
        const { data } = await supabase.from('site_config').select('value').eq('key', 'payment_settings').maybeSingle();
        if (data) setPaymentSettings(data.value);
    };

    const savePaymentSettings = async (settings = paymentSettings) => {
        try {
            const { error } = await supabase.from('site_config').upsert({
                key: 'payment_settings',
                value: settings,
                updated_at: new Date().toISOString()
            });

            if (!error) {
                toast.success("Payment settings saved!");
            } else {
                toast.error("Failed to save: " + error.message);
            }
        } catch (error) {
            toast.error("Error saving payment settings");
        }
    };

    const handlePaymentChange = (mode: 'sandbox' | 'production', provider: 'xendit' | 'midtrans', key: string, value: string) => {
        setPaymentSettings((prev: any) => ({
            ...prev,
            [mode]: {
                ...prev[mode],
                [provider]: {
                    ...prev[mode]?.[provider],
                    [key]: value
                }
            }
        }));
    };

    const updatePaymentMode = async (isProduction: boolean) => {
        if (!confirm(`Switch to ${isProduction ? 'Production' : 'Sandbox'}?`)) return;
        const updated = { ...paymentSettings, isProduction };
        setPaymentSettings(updated);
        await savePaymentSettings(updated);
    };

    const handleAddBank = async () => {
        if (!newBank.bank_name || !newBank.account_number) return;
        setLoading(true);
        const { error } = await supabase.from('bank_accounts').insert([newBank]);
        if (error) {
            toast.error("Gagal menambah bank");
        } else {
            toast.success("Bank berhasil ditambahkan");
            setNewBank({ bank_name: '', account_number: '', account_holder: '' });
            fetchBanks();
        }
        setLoading(false);
    };

    const handleDeleteBank = async (id: string) => {
        if (!confirm("Hapus bank ini?")) return;
        await supabase.from('bank_accounts').delete().eq('id', id);
        fetchBanks();
    };

    const handleDeleteQris = async () => {
        if (!confirm("Hapus gambar QRIS?")) return;
        setLoading(true);
        try {
            // Update Config to remove URL
            const { error: configError } = await supabase.from('site_config').upsert({
                key: 'qris_image',
                value: { url: '' }
            });

            if (configError) throw configError;

            setQrisUrl('');
            toast.success("QRIS Removed!");
        } catch (err: any) {
            console.error(err);
            toast.error("Delete failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadQris = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileName = `qris-${Date.now()}.png`;

        setLoading(true);
        try {
            // Assume 'receipts' bucket exists from setup
            const { data, error } = await supabase.storage.from('receipts').upload(fileName, file);

            if (error) throw error;

            const publicUrl = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl;

            // Save to Config
            const { error: configError } = await supabase.from('site_config').upsert({
                key: 'qris_image',
                value: { url: publicUrl }
            });

            if (configError) throw configError;

            setQrisUrl(publicUrl);
            toast.success("QRIS Updated!");

        } catch (err: any) {
            console.error(err);
            toast.error("Upload failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to extract nested values safely
    const getVal = (mode: string, provider: string, key: string) => {
        return paymentSettings?.[mode]?.[provider]?.[key] || '';
    };

    return (
        <div className="p-6 bg-[#050505] min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-6">Pengaturan Pembayaran</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Bank Accounts */}
                <div className="bg-[#111] p-6 rounded-2xl border border-zinc-800">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <CreditCard className="text-[#D4F932]" />
                        Daftar Rekening Bank (Manual)
                    </h2>

                    <div className="space-y-4 mb-6">
                        {banks.map(bank => (
                            <div key={bank.id} className="flex items-center justify-between bg-black p-4 rounded-xl border border-zinc-800">
                                <div>
                                    <p className="font-bold text-[#D4F932]">{bank.bank_name}</p>
                                    <p className="text-lg font-mono">{bank.account_number}</p>
                                    <p className="text-sm text-zinc-500">{bank.account_holder}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteBank(bank.id)}
                                    className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-red-500 transition-colors">
                                    <Trash size={18} />
                                </button>
                            </div>
                        ))}
                        {banks.length === 0 && <p className="text-zinc-600 italic">Belum ada rekening bank.</p>}
                    </div>

                    <div className="bg-zinc-900/50 p-4 rounded-xl space-y-3">
                        <p className="text-sm font-bold text-zinc-400 uppercase">Tambah Rekening Baru</p>
                        <input
                            placeholder="Nama Bank (misal: BCA, Mandiri)"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4F932]"
                            value={newBank.bank_name}
                            onChange={e => setNewBank({ ...newBank, bank_name: e.target.value })}
                        />
                        <input
                            placeholder="Nomor Rekening"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4F932]"
                            value={newBank.account_number}
                            onChange={e => setNewBank({ ...newBank, account_number: e.target.value })}
                        />
                        <input
                            placeholder="Atas Nama (Pemilik Rekening)"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#D4F932]"
                            value={newBank.account_holder}
                            onChange={e => setNewBank({ ...newBank, account_holder: e.target.value })}
                        />
                        <button
                            onClick={handleAddBank}
                            disabled={loading}
                            className="w-full bg-white text-black font-bold py-2 rounded-lg hover:bg-[#D4F932] transition-colors flex justify-center items-center gap-2">
                            <Plus size={16} /> Tambah Bank
                        </button>
                    </div>
                </div>

                {/* QRIS Upload */}
                <div className="bg-[#111] p-6 rounded-2xl border border-zinc-800 h-fit">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Upload className="text-[#D4F932]" />
                        Upload QRIS (Manual)
                    </h2>

                    <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-6 bg-black flex flex-col items-center justify-center min-h-[250px] relative transition-colors hover:border-zinc-700">
                        {qrisUrl ? (
                            <div className="flex flex-col items-center w-full">
                                <img src={qrisUrl} alt="QRIS" className="max-w-[200px] max-h-[200px] mb-6 rounded-lg object-contain bg-white p-2" />
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
                                    >
                                        <Edit size={16} /> Ganti
                                    </button>
                                    <button
                                        onClick={handleDeleteQris}
                                        className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-500 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm border border-red-900/50"
                                    >
                                        <Trash size={16} /> Hapus
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center w-full h-full cursor-pointer group py-8"
                            >
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-600 group-hover:text-[#D4F932] group-hover:scale-110 transition-all">
                                    <Upload size={32} />
                                </div>
                                <p className="text-zinc-400 font-bold mb-1 group-hover:text-white">Upload QRIS</p>
                                <p className="text-zinc-600 text-xs">Klik untuk pilih gambar (PNG/JPG)</p>
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleUploadQris}
                            className="hidden"
                        />
                        {loading && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
                                <Upload className="animate-bounce text-[#D4F932] mb-2" size={32} />
                                <p className="text-[#D4F932] text-sm font-bold">Uploading...</p>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-zinc-500 mt-4 text-center">
                        QRIS ini akan ditampilkan kepada user di halaman pembayaran (Manual Transfer).
                    </p>
                </div>
            </div>

            {/* Payment Gateways Section */}
            {paymentSettings && (
                <div className="border-t border-zinc-800 pt-8 mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#D4F932]/10 flex items-center justify-center text-[#D4F932]">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Payment Gateway Settings</h3>
                                <p className="text-sm text-zinc-500">Configure keys for Midtrans & Xendit.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => savePaymentSettings()}
                            className="bg-zinc-800 text-white font-bold px-6 py-2 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
                        >
                            <CheckCircle size={16} /> Save Keys
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SANDBOX SETTINGS */}
                        <div className={`p-6 rounded-2xl border transition-all ${!paymentSettings.isProduction ? 'bg-[#D4F932]/5 border-[#D4F932] shadow-[0_0_30px_-5px_rgba(212,249,50,0.1)]' : 'bg-[#111] border-zinc-800 opacity-80 hover:opacity-100'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-lg font-bold text-white">Sandbox Mode</h4>
                                        {!paymentSettings.isProduction && <span className="bg-[#D4F932] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                                    </div>
                                    <p className="text-xs text-zinc-500">Use Development Keys for testing.</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <ShieldCheck size={16} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Xendit Sandbox */}
                                <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                    <p className="text-xs font-bold text-zinc-400 mb-3 border-b border-zinc-800 pb-2">Xendit</p>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Secret Key</label>
                                        <input
                                            value={getVal('sandbox', 'xendit', 'secretKey')}
                                            onChange={(e) => handlePaymentChange('sandbox', 'xendit', 'secretKey', e.target.value)}
                                            className="w-full bg-black border border-zinc-700 p-2 rounded text-xs font-mono text-zinc-300 focus:border-[#D4F932] outline-none"
                                            placeholder="xnd_development_..."
                                        />
                                    </div>
                                </div>

                                {/* Midtrans Sandbox */}
                                <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                    <p className="text-xs font-bold text-zinc-400 mb-3 border-b border-zinc-800 pb-2">Midtrans</p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Server Key</label>
                                            <input
                                                value={getVal('sandbox', 'midtrans', 'serverKey')}
                                                onChange={(e) => handlePaymentChange('sandbox', 'midtrans', 'serverKey', e.target.value)}
                                                className="w-full bg-black border border-zinc-700 p-2 rounded text-xs font-mono text-zinc-300 focus:border-[#D4F932] outline-none"
                                                placeholder="SB-Mid-server-..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Client Key</label>
                                            <input
                                                value={getVal('sandbox', 'midtrans', 'clientKey')}
                                                onChange={(e) => handlePaymentChange('sandbox', 'midtrans', 'clientKey', e.target.value)}
                                                className="w-full bg-black border border-zinc-700 p-2 rounded text-xs font-mono text-zinc-300 focus:border-[#D4F932] outline-none"
                                                placeholder="SB-Mid-client-..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {paymentSettings.isProduction && (
                                <button
                                    onClick={() => updatePaymentMode(false)}
                                    className="w-full mt-6 py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-sm font-bold transition-colors"
                                >
                                    Switch to Sandbox
                                </button>
                            )}
                        </div>

                        {/* PRODUCTION SETTINGS */}
                        <div className={`p-6 rounded-2xl border transition-all ${paymentSettings.isProduction ? 'bg-red-500/5 border-red-500 shadow-[0_0_30px_-5px_rgba(239,68,68,0.1)]' : 'bg-[#111] border-zinc-800 opacity-80 hover:opacity-100'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-lg font-bold text-white">Production Mode</h4>
                                        {paymentSettings.isProduction && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                                    </div>
                                    <p className="text-xs text-zinc-500">Use Real/Live Keys.</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <Zap size={16} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Xendit Production */}
                                <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                    <p className="text-xs font-bold text-zinc-400 mb-3 border-b border-zinc-800 pb-2">Xendit</p>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Secret Key</label>
                                        <input
                                            value={getVal('production', 'xendit', 'secretKey')}
                                            onChange={(e) => handlePaymentChange('production', 'xendit', 'secretKey', e.target.value)}
                                            className="w-full bg-black border border-zinc-700 p-2 rounded text-xs font-mono text-zinc-300 focus:border-red-500 outline-none"
                                            placeholder="xnd_production_..."
                                        />
                                    </div>
                                </div>

                                {/* Midtrans Production */}
                                <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                                    <p className="text-xs font-bold text-zinc-400 mb-3 border-b border-zinc-800 pb-2">Midtrans</p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Server Key</label>
                                            <input
                                                value={getVal('production', 'midtrans', 'serverKey')}
                                                onChange={(e) => handlePaymentChange('production', 'midtrans', 'serverKey', e.target.value)}
                                                className="w-full bg-black border border-zinc-700 p-2 rounded text-xs font-mono text-zinc-300 focus:border-red-500 outline-none"
                                                placeholder="Mid-server-..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Client Key</label>
                                            <input
                                                value={getVal('production', 'midtrans', 'clientKey')}
                                                onChange={(e) => handlePaymentChange('production', 'midtrans', 'clientKey', e.target.value)}
                                                className="w-full bg-black border border-zinc-700 p-2 rounded text-xs font-mono text-zinc-300 focus:border-red-500 outline-none"
                                                placeholder="Mid-client-..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!paymentSettings.isProduction && (
                                <button
                                    onClick={() => updatePaymentMode(true)}
                                    className="w-full mt-6 py-3 rounded-xl border border-zinc-700 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 text-sm font-bold transition-colors"
                                >
                                    Switch to Production
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

