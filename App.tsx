
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BrewingConsole from './pages/BrewingConsole';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutPage from './pages/CheckoutPage';
import MemberLogin from './pages/MemberLogin';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import { initPixel, trackPageView } from './utils/pixel';
import { ToastProvider } from './components/Toast';

// Component to handle Pixel tracking on route changes
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    initPixel();
  }, []);

  useEffect(() => {
    trackPageView();
  }, [location]);

  return null;
}

function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  // Simple check for simulation. In production, verify token with backend.
  const sub = localStorage.getItem('brewlogic_sub');
  if (!sub) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
          <span className="text-2xl">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Akses Terkunci</h2>
        <p className="text-zinc-500 max-w-sm mb-8">Maaf, Anda harus memiliki paket membership aktif untuk mengakses Brewing Console.</p>
        <div className="flex gap-4">
          <a href="/#pricing" className="bg-[#D4F932] text-black px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">
            Beli Paket
          </a>
          <a href="/" className="text-zinc-500 border border-zinc-800 px-6 py-3 rounded-full font-bold text-sm hover:text-white transition-colors">
            Kembali
          </a>
        </div>
      </div>
    );
  }

  // Check expiry
  const { expiry } = JSON.parse(sub);
  if (new Date(expiry) < new Date()) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Masa Aktif Habis</h2>
        <p className="text-zinc-500 max-w-sm mb-8">Paket Anda telah berakhir. Silakan perpanjang untuk melanjutkan.</p>
        <a href="/#pricing" className="bg-[#D4F932] text-black px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">
          Perpanjang Sekarang
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <RouteTracker />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<MemberLogin />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/app"
            element={
              <SubscriptionGuard>
                <BrewingConsole />
              </SubscriptionGuard>
            }
          />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
