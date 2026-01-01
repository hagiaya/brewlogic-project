import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, LogIn } from 'lucide-react';

export default function MemberLogin() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/member-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Success - Set Session
            const user = data.user;

            // Calculate Expiry
            // Default to 1 month if no plan or unknown
            // If admin set plan, use it.
            // Using created_at implies "subscription started when account created"
            const startDate = user.created_at ? new Date(user.created_at) : new Date();
            const expiryDate = new Date(startDate);
            const planName = user.plan || 'Free';

            if (planName.toLowerCase().includes('starter')) expiryDate.setMonth(expiryDate.getMonth() + 1);
            else if (planName.toLowerCase().includes('home')) expiryDate.setMonth(expiryDate.getMonth() + 3);
            else if (planName.toLowerCase().includes('pro')) expiryDate.setMonth(expiryDate.getMonth() + 6);
            else if (planName.toLowerCase().includes('master')) expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            else if (planName.toLowerCase().includes('lifetime')) expiryDate.setFullYear(expiryDate.getFullYear() + 100);
            else expiryDate.setMonth(expiryDate.getMonth() + 1); // Fallback

            // If expiry is in the past (e.g. account created 2 months ago for 1 month plan), user is expired.
            // That's correct behavior.

            const subData = {
                status: 'active',
                plan: planName,
                expiry: expiryDate.toISOString(),
                user: {
                    name: user.name,
                    email: user.username, // Assuming username is email
                    phone: user.phone
                },
                orderId: 'MANUAL-LOGIN', // Placeholder
                paymentType: 'MANUAL'
            };

            localStorage.setItem('brewlogic_sub', JSON.stringify(subData));

            // Redirect
            navigate('/app');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-[#D4F932] rounded-full mx-auto mb-4 flex items-center justify-center text-black">
                        <LogIn size={24} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Member Login</h1>
                    <p className="text-zinc-500 text-sm">Masuk untuk mengakses Brewing Console.</p>
                </div>

                <div className="bg-[#111] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Email / Username</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                required
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none"
                                placeholder="nama@email.com"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-zinc-500 uppercase block">Password</label>
                                <Link to="/forgot-password" size="sm" className="text-[10px] text-[#D4F932] hover:underline font-bold">Lupa Password?</Link>
                            </div>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none"
                                placeholder="******"
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Masuk
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <Link to="/" className="text-zinc-500 hover:text-white text-sm flex items-center justify-center gap-2">
                        <ArrowLeft size={16} /> Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
