import React, { useState } from 'react';
import { ArrowLeft, Loader2, KeyRound, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error("Masukkan email");
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("OTP terkirim ke email Anda");
            setStep(2);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return toast.error("Masukkan OTP");
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("OTP Valid");
            setStep(3);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) return toast.error("Masukkan password baru");
        if (newPassword.length < 6) return toast.error("Password minimal 6 karakter");

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Password Berhasil Direset!");
            setStep(4);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#111] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative">

                {step !== 4 && (
                    <Link to="/login" className="absolute top-6 left-6 text-zinc-500 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                )}

                <div className="text-center mb-8 pt-4">
                    <div className="w-12 h-12 bg-[#D4F932] rounded-full mx-auto mb-4 flex items-center justify-center text-black">
                        <KeyRound size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Lupa Password</h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        {step === 1 && "Masukkan email untuk mereset password."}
                        {step === 2 && `Masukkan kode OTP yang dikirim ke ${email}`}
                        {step === 3 && "Buat password baru Anda."}
                        {step === 4 && "Password berhasil diubah."}
                    </p>
                </div>

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none"
                            autoFocus
                        />
                        <button disabled={loading} className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110 flex justify-center gap-2">
                            {loading && <Loader2 className="animate-spin" />} Kirim OTP
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Kode 6 Digit OTP"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none text-center tracking-widest text-2xl font-mono"
                            maxLength={6}
                            autoFocus
                        />
                        <button disabled={loading} className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110 flex justify-center gap-2">
                            {loading && <Loader2 className="animate-spin" />} Verifikasi
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="w-full text-zinc-500 text-sm mt-2 hover:text-white">Ganti Email</button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Password Baru"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none"
                            autoFocus
                        />
                        <button disabled={loading} className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110 flex justify-center gap-2">
                            {loading && <Loader2 className="animate-spin" />} Simpan Password
                        </button>
                    </form>
                )}

                {step === 4 && (
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <CheckCircle size={64} className="text-[#D4F932]" />
                        </div>
                        <button onClick={() => navigate('/login')} className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110">
                            Masuk Sekarang
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
