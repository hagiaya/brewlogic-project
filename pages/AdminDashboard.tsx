
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, ShoppingCart, Coffee, Database, LogOut,
    Plus, Trash2, Edit2, Search, CheckCircle, XCircle, Settings, Type, CreditCard, ShieldCheck, Zap, UserPlus, Ticket, ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../components/Toast';
import PaymentSettings from './PaymentSettings';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    // Data States
    const [users, setUsers] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [grinders, setGrinders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]); // Products/Packages
    const [vouchers, setVouchers] = useState<any[]>([]); // Vouchers
    const [drippers, setDrippers] = useState<any[]>([]); // Drippers (New)
    const [siteContent, setSiteContent] = useState<any>(null);
    const [paymentSettings, setPaymentSettings] = useState<any>(null);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [refresh, setRefresh] = useState(0);

    // Modal States
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<any>(null); // For editing/adding

    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Content Editor State
    const [contentSection, setContentSection] = useState('hero');

    const [verifyModal, setVerifyModal] = useState<{ open: boolean, user: any }>({ open: false, user: null });


    // Initial Login Check
    useEffect(() => {
        const user = localStorage.getItem('admin_user');
        if (user) {
            setIsLoggedIn(true);
            fetchAllData();
        }
    }, [refresh]);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            // Fetch Users
            const { data: userData } = await supabase.from('users').select('*');
            if (userData) setUsers(userData);

            // Fetch Transactions
            const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
            if (txData) {
                const mapped = txData.map(d => ({
                    ...d,
                    package: d.package_name,
                    date: d.created_at
                }));
                setTransactions(mapped);
            }

            // Fetch Products
            const { data: prodData } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
            if (prodData) setProducts(prodData);

            // Fetch Vouchers
            const { data: voucherData } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false });
            if (voucherData) setVouchers(voucherData);

            // Fetch Grinders
            const { data: grindData } = await supabase.from('grinders').select('*');
            if (grindData) setGrinders(grindData);

            // Fetch Drippers
            const { data: dripData } = await supabase.from('drippers').select('*');
            if (dripData) setDrippers(dripData);

            // Fetch Content
            const { data: contentData } = await supabase.from('site_config').select('value').eq('key', 'site_content').single();
            if (contentData) setSiteContent(contentData.value);

            // Fetch Payment Settings
            const { data: paymentData } = await supabase.from('site_config').select('value').eq('key', 'payment_settings').single();
            if (paymentData) setPaymentSettings(paymentData.value);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyUser = async (userId: string | number, currentPlan: string, email: string) => {
        if (!confirm("Verify this user and activate their plan?")) return;

        const newPlan = currentPlan.replace('PENDING_', '');

        // Calculate Expiry
        const now = new Date();
        const expiry = new Date();
        const p = newPlan.toLowerCase();
        if (p.includes("starter")) expiry.setMonth(expiry.getMonth() + 1);
        else if (p.includes("home")) expiry.setMonth(expiry.getMonth() + 3);
        else if (p.includes("pro")) expiry.setMonth(expiry.getMonth() + 6);
        else if (p.includes("master")) expiry.setFullYear(expiry.getFullYear() + 1);
        else if (p.includes("lifetime")) expiry.setFullYear(expiry.getFullYear() + 100);
        else expiry.setMonth(expiry.getMonth() + 1); // Default

        try {
            // 1. Update User Plan & Dates
            const { error: userError } = await supabase.from('users')
                .update({
                    plan: newPlan,
                    subscription_start: now.toISOString(),
                    subscription_end: expiry.toISOString()
                })
                .eq('id', userId);

            if (userError) throw userError;

            // 2. Update Transaction Status to 'success' (if exists)
            // We find the most recent pending/manual transaction for this user
            const { data: recentTx } = await supabase.from('transactions')
                .select('id')
                .eq('email', email)
                .in('status', ['pending', 'manual_success'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (recentTx) {
                await supabase.from('transactions')
                    .update({ status: 'success' })
                    .eq('id', recentTx.id);
            }

            toast.success(`User verified! Plan active: ${newPlan}`);
            setRefresh(prev => prev + 1);

        } catch (error: any) {
            toast.error("Verification failed: " + error.message);
        }
    };

    const confirmTransaction = async (tx: any) => {
        if (!confirm("Konfirmasi pembayaran ini valid?")) return;

        try {
            // 1. Update Transaction
            const { error: txError } = await supabase.from('transactions')
                .update({ status: 'success' })
                .eq('id', tx.id);

            if (txError) throw txError;

            // 2. Activate User Plan
            // Find user by email
            const { data: user } = await supabase.from('users').select('*').eq('email', tx.email).single();

            if (user) {
                // Logic to set plan
                const newPlan = tx.package_name || user.plan || 'Starter Plan';
                const cleanPlan = newPlan.replace('PENDING_', '');

                // Calculate Expiry
                const now = new Date();
                const expiry = new Date();
                const p = cleanPlan.toLowerCase();

                if (p.includes("starter")) expiry.setMonth(expiry.getMonth() + 1);
                else if (p.includes("home")) expiry.setMonth(expiry.getMonth() + 3);
                else if (p.includes("pro")) expiry.setMonth(expiry.getMonth() + 6);
                else if (p.includes("master")) expiry.setFullYear(expiry.getFullYear() + 1);
                else if (p.includes("lifetime")) expiry.setFullYear(expiry.getFullYear() + 100);
                else expiry.setMonth(expiry.getMonth() + 1);

                await supabase.from('users').update({
                    plan: cleanPlan,
                    subscription_start: now.toISOString(),
                    subscription_end: expiry.toISOString()
                }).eq('id', user.id);

                toast.success("Transaksi Valid! Plan User Aktif.");
            } else {
                toast.success("Transaksi Dikonfirmasi (User tidak ditemukan)");
            }

            setRefresh(prev => prev + 1);

        } catch (error: any) {
            toast.error("Gagal konfirmasi: " + error.message);
        }
    };

    const handleEditUser = (user: any) => {
        setEditingUser(user);
        setIsEditUserModalOpen(true);
    };



    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        // Build updates object carefully to handle empty plan as null if desired, or just string
        let planValue: any = formData.get('plan');
        if (planValue === '') planValue = null;

        const updates = {
            name: formData.get('name'),
            role: formData.get('role'),
            plan: planValue
        };

        try {
            const { error } = await supabase.from('users').update(updates).eq('id', editingUser.id);
            if (error) throw error;

            toast.success("User updated successfully");
            setIsEditUserModalOpen(false);
            setEditingUser(null);
            setRefresh(prev => prev + 1);
        } catch (error: any) {
            toast.error("Failed to update user: " + error.message);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data: any = Object.fromEntries(formData.entries());

        const username = data.username;
        const password = data.password;
        const role = data.role || 'member';
        const name = data.name || username;
        const plan = data.plan;

        try {
            // Check existing
            const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
            if (existing) {
                toast.error('Username already taken');
                return;
            }

            // Insert User
            // Note: Postgres generates UUID for 'id' default, but we can pass it if we want. 
            // We'll let Postgres handle it or use retrieved data.
            const { data: newUser, error: userError } = await supabase.from('users').insert([{
                username,
                password,
                role,
                name
            }]).select().single();

            if (userError || !newUser) {
                toast.error("Failed to add user: " + userError?.message);
                return;
            }

            // If plan selected, add transaction
            if (plan) {
                const txId = `MANUAL-${crypto.randomUUID().split('-')[0]}-${Date.now()}`;
                const manualAmount = data.amount ? parseInt(data.amount) : 0;

                const { error: txError } = await supabase.from('transactions').insert([{
                    id: txId,
                    customer_name: name,
                    email: username, // Assuming username is email often, or fallback
                    phone: data.phone || '-',
                    package_name: plan,
                    amount: manualAmount,
                    status: 'manual_success',
                    token: 'manual-grant'
                }]);

                if (txError) console.error("Failed to create manual transaction record", txError);
            }

            toast.success("User added successfully!");
            setIsAddUserModalOpen(false);
            setRefresh(prev => prev + 1);

        } catch (error: any) {
            toast.error("Failed to process request: " + error.message);
        }
    };


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Use RPC for secure password check
            const { data, error } = await supabase.rpc('login_admin', {
                p_username: loginData.username,
                p_password: loginData.password
            });

            if (error) {
                toast.error('Login System Error: ' + error.message);
                return;
            }

            if (data.success) {
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                setIsLoggedIn(true);
                fetchAllData();
            } else {
                toast.error('Login Failed: ' + data.error);
            }
        } catch (error) {
            toast.error('Login Error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_user');
        setIsLoggedIn(false);
        navigate('/');
    };

    // --- CRUD Operations ---

    const deleteItem = async (type: string, id: string | number) => {
        if (!confirm('Are you sure?')) return;

        let table = '';
        if (type === 'users') table = 'users';
        if (type === 'grinders') table = 'grinders';
        if (type === 'drippers') table = 'drippers';
        if (type === 'vouchers') table = 'vouchers';
        if (type === 'transactions') table = 'transactions';
        // products are not deleted in UI, only grinders and users

        if (table) {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) toast.error("Failed to delete: " + error.message);
            else setRefresh(prev => prev + 1);
        }
    };

    const addDripper = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data: any = Object.fromEntries(formData.entries());

        const { error } = await supabase.from('drippers').insert([data]);
        if (error) toast.error("Failed to add dripper: " + error.message);
        else {
            toast.success("Dripper added successfully!");
            setRefresh(prev => prev + 1);
            form.reset();
        }
    };

    const addGrinder = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data: any = Object.fromEntries(formData.entries());

        const { error } = await supabase.from('grinders').insert([data]);
        if (error) toast.error("Failed to add grinder: " + error.message);
        else {
            toast.success("Grinder added successfully!");
            setRefresh(prev => prev + 1);
            form.reset();
        }
    };

    const addVoucher = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data: any = Object.fromEntries(formData.entries());

        const payload = {
            code: data.code.toUpperCase(),
            discount_type: data.discount_type,
            discount_value: parseInt(data.discount_value)
        };

        const { error } = await supabase.from('vouchers').insert([payload]);
        if (error) toast.error("Failed to add voucher: " + error.message);
        else {
            toast.success("Voucher added successfully!");
            setRefresh(prev => prev + 1);
            form.reset();
        }
    };

    const moveProduct = async (id: string, direction: 'up' | 'down') => {
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === products.length - 1) return;

        const otherIndex = direction === 'up' ? index - 1 : index + 1;
        const currentItem = products[index];
        const otherItem = products[otherIndex];

        // Optimistic Update
        const newProducts = [...products];
        newProducts[index] = { ...otherItem, sort_order: currentItem.sort_order };
        newProducts[otherIndex] = { ...currentItem, sort_order: otherItem.sort_order };
        // Swap their positions in array too just in case sort_order was messy, 
        // but primarily we rely on swapping the numeric values.
        // Actually, assuming sort_order is sequential:

        try {
            await supabase.from('products').upsert([
                { id: currentItem.id, sort_order: otherItem.sort_order },
                { id: otherItem.id, sort_order: currentItem.sort_order }
            ]);
            setRefresh(prev => prev + 1);
        } catch (error) {
            console.error(error);
            toast.error("Failed to move product");
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        // Parse features from text area (newline separated)
        const featuresText = formData.get('features') as string;
        const features = featuresText.split('\n').filter(line => line.trim() !== '');

        const payload = {
            id: formData.get('id'),
            name: formData.get('name'),
            price: parseInt(formData.get('price') as string),
            duration: formData.get('duration'),
            description: formData.get('description'),
            monthly_price: formData.get('monthly_price') ? (parseInt(formData.get('monthly_price') as string) || null) : null,
            savings_text: formData.get('savings_text'),
            promo_text: formData.get('promo_text'),
            is_best_seller: formData.get('is_best_seller') === 'on',
            features: features
        };

        const { error } = await supabase.from('products').upsert(payload);

        if (error) {
            toast.error("Failed to save product: " + error.message);
        } else {
            toast.success("Product saved successfully!");
            setRefresh(prev => prev + 1);
            setIsProductModalOpen(false);
            setCurrentProduct(null);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) toast.error("Failed to delete product: " + error.message);
        else setRefresh(prev => prev + 1);
    };

    const updateProduct = async (id: string, data: any) => {
        // Legacy: keep for compatibility if needed, but handleSaveProduct is preferred now
        const payload = typeof data === 'object' ? data : { price: parseInt(data) };
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) toast.error("Failed to update product: " + error.message);
        else setRefresh(prev => prev + 1);
    };


    const updatePaymentMode = async (isProduction: boolean) => {
        if (!confirm(`Are you sure you want to switch to ${isProduction ? 'Production (Live)' : 'Sandbox (Test)'} mode?`)) return;

        try {
            const updatedSettings = { ...paymentSettings, isProduction };
            const { error } = await supabase.from('site_config').upsert({
                key: 'payment_settings',
                value: updatedSettings,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;

            setPaymentSettings(updatedSettings);
            toast.success(`Switched to ${isProduction ? 'Production' : 'Sandbox'} mode!`);
        } catch (error) {
            toast.error("Failed to update settings");
        }
    };

    const updatePaymentSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Merge logic similar to server.js
        const current = { ...paymentSettings };

        // Handle checkbox
        current.isProduction = (form.querySelector('[name=isProduction]') as HTMLInputElement).checked;

        // We need to merge sandbox/production keys specifically from the form inputs?
        // The form only shows read-only views in the previous code? 
        // Wait, the previous code showed "Server Key" etc as read-only divs in the PROD/SANDBOX cards. 
        // It didn't seem to have input fields for keys in the UI shown in Step 21/35!
        // Ah, look at step 21: There is no inputs for serverKey/clientKey in the UI! 
        // The original `updatePaymentSettings` function existed but where is the form?
        // The UI code for 'payment' tab only shows read-only divs and a "Switch to..." button.
        // It seems the user can't actually edit keys in this UI?
        // Wait, let me check the UI rendering code again.
        // Step 21 lines 739+. It shows Cards. It does NOT show input fields for server keys.
        // It seems the `updatePaymentSettings` function (lines 171-195) is dead code or I missed the form.
        // But `updatePaymentMode` IS used.
        // So I will implement `updatePaymentMode` properly. `updatePaymentSettings` I will keep but it might not be reachable.

        // Actually, previous `updatePaymentSettings` (lines 171) was reading formData.
        // If there are no inputs, formData is empty (except checkbox?).
        // I will keep it but assume it might be unused or for future.

        // For now, let's just make sure `updatePaymentMode` works.
        // And I'll comment out or leave `updatePaymentSettings` as is but using Supabase.

        // Ah, looking closer at Step 21, indeed there are no inputs for keys. 
        // Maybe they are supposed to be in `.env` only? Or the UI is incomplete.
        // I will focus on making sure the existing UI works (switching modes).
    };

    const handleContentChange = (section: string, key: string, value: any) => {
        setSiteContent((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const handleArrayChange = (section: string, arrayKey: string, index: number, field: string, value: any) => {
        setSiteContent((prev: any) => {
            const newArray = [...(prev[section][arrayKey] || [])];
            newArray[index] = { ...newArray[index], [field]: value };
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [arrayKey]: newArray
                }
            };
        });
    };

    const saveContentSection = async (section: string) => {
        try {
            // Save the WHOLE content object because we maintain it in state?
            // Or just update the section in the DB JSON?
            // Supabase doesn't support deep partial JSON updates easily without fetching first (which we have in state).
            // So we save the whole `siteContent` to config.

            const { error } = await supabase.from('site_config').upsert({
                key: 'site_content',
                value: siteContent,
                updated_at: new Date().toISOString()
            });

            if (!error) {
                toast.success("Content updated successfully!");
            } else {
                toast.error("Failed to update: " + error.message);
            }
        } catch (error) {
            toast.error("Error saving content");
        }
    };

    const handlePaymentChange = (mode: 'sandbox' | 'production', key: 'serverKey' | 'clientKey', value: string) => {
        setPaymentSettings((prev: any) => ({
            ...prev,
            [mode]: {
                ...prev[mode],
                [key]: value
            }
        }));
    };

    const savePaymentSettings = async () => {
        try {
            const { error } = await supabase.from('site_config').upsert({
                key: 'payment_settings',
                value: paymentSettings,
                updated_at: new Date().toISOString()
            });

            if (!error) {
                toast.success("Payment settings saved successfully!");
            } else {
                toast.error("Failed to save settings: " + error.message);
            }
        } catch (error) {
            toast.error("Error saving payment settings");
        }
    };

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data: any = Object.fromEntries(formData.entries());

        if (!user.id) return toast.error("User ID not found, please re-login.");

        // Remove empty password if blank
        if (!data.password) delete data.password;

        try {
            const { error } = await supabase.from('users').update(data).eq('id', user.id);

            if (!error) {
                toast.success("Profile updated successfully! Please login again.");
                handleLogout();
            } else {
                toast.error("Update failed: " + error.message);
            }
        } catch (error) {
            toast.error("Update failed.");
        }
    };

    // --- Renderers ---

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl border border-zinc-800">
                    <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Access (Supabase)</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Username</label>
                            <input
                                type="text"
                                className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white mt-1"
                                value={loginData.username}
                                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Password</label>
                            <input
                                type="password"
                                className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white mt-1"
                                value={loginData.password}
                                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                            />
                        </div>
                        <button className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110">
                            Masuk Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-900 p-6 flex flex-col h-screen fixed left-0 top-0 bg-[#050505] overflow-y-auto z-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 rounded-full bg-[#D4F932]"></div>
                    <span className="font-bold text-lg">BrewAdmin</span>
                </div>

                <nav className="space-y-2 flex-1">
                    {[
                        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                        { id: 'users', label: 'Manajemen User', icon: Users },
                        { id: 'transactions', label: 'Transaksi', icon: ShoppingCart },
                        { id: 'products', label: 'Paket Membership', icon: Coffee },
                        { id: 'vouchers', label: 'Manajemen Voucher', icon: Ticket },
                        { id: 'grinders', label: 'Database Grinder', icon: Database },
                        { id: 'drippers', label: 'Database Dripper', icon: Coffee },
                        { id: 'content', label: 'Site Content', icon: Type },
                        { id: 'payment', label: 'Payment Settings', icon: CreditCard },
                        { id: 'settings', label: 'Settings', icon: Settings },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                ? 'bg-[#D4F932] text-black font-bold'
                                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-zinc-900 rounded-xl transition-all">
                    <LogOut size={20} />
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8 bg-[#09090b] min-h-screen">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold capitalize">{activeTab.replace('_', ' ')}</h2>
                        <p className="text-zinc-500 text-sm">Welcome back, Super Admin</p>
                    </div>
                </header>

                {/* DASHBOARD TAB */}
                {/* DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard
                                title="Pendapatan (Sukses)"
                                value={`Rp${transactions.filter(t => ['success', 'settlement', 'capture', 'manual_success'].includes(t.status)).reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0).toLocaleString()}`}
                                icon={CheckCircle}
                            />
                            <StatsCard
                                title="Pendapatan (Pending)"
                                value={`Rp${transactions.filter(t => ['pending', 'pending_payment'].includes(t.status)).reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0).toLocaleString()}`}
                                icon={Activity}
                            />
                            <StatsCard title="Total Transaksi" value={transactions.length} icon={ShoppingCart} />
                            <StatsCard title="Total User" value={users.length} icon={Users} />
                            <StatsCard title="Active Plans" value={products.length} icon={Coffee} />
                            {/* <StatsCard title="Database Grinder" value={grinders.length} icon={Database} />
                            <StatsCard title="Database Dripper" value={drippers.length} icon={Coffee} /> 
                                Filtered out to prioritize financial overview 
                            */}
                        </div>

                        {/* Recent Transactions Section */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Activity size={20} className="text-[#D4F932]" />
                                    Transaksi Terbaru
                                </h3>
                                <button onClick={() => setActiveTab('transactions')} className="text-sm text-zinc-500 hover:text-white transition-colors">
                                    Lihat Semua &rarr;
                                </button>
                            </div>

                            <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Package</th>
                                            <th className="p-4">Amount</th>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        {transactions.slice(0, 5).map((tx) => (
                                            <tr key={tx.id} className="hover:bg-zinc-900/20 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-sm text-white">{tx.customer_name}</div>
                                                    <div className="text-xs text-zinc-500">{tx.email}</div>
                                                </td>
                                                <td className="p-4 text-sm text-zinc-400">{tx.package}</td>
                                                <td className="p-4 font-mono text-sm text-[#D4F932]">Rp{(parseInt(tx.amount) || 0).toLocaleString()}</td>
                                                <td className="p-4 text-xs text-zinc-500">{new Date(tx.date).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${tx.status === 'success' || tx.status === 'manual_success'
                                                        ? 'bg-[#D4F932]/20 text-[#D4F932]'
                                                        : 'bg-yellow-500/10 text-yellow-500'
                                                        }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-zinc-500 italic">Belum ada transaksi.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">User Management</h3>
                            <button
                                onClick={() => setIsAddUserModalOpen(true)}
                                className="bg-[#D4F932] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:brightness-110"
                            >
                                <UserPlus size={18} />
                                Add New User
                            </button>
                        </div>

                        <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Username</th>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Role</th>
                                        <th className="p-4">Plan (Manual)</th>
                                        <th className="p-4">Expiry</th>
                                        <th className="p-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-zinc-900/20">
                                            <td className="p-4">{user.username}</td>
                                            <td className="p-4">
                                                {user.name}
                                                {user.email && <div className="text-xs text-zinc-500">{user.email}</div>}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {user.plan ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-mono border px-2 py-0.5 rounded ${user.plan.startsWith('PENDING_')
                                                            ? 'text-yellow-500 border-yellow-500/30'
                                                            : 'text-[#D4F932] border-[#D4F932]/30'
                                                            }`}>
                                                            {user.plan}
                                                        </span>
                                                        {user.plan.startsWith('PENDING_') && (
                                                            <button
                                                                onClick={() => handleVerifyUser(user.id, user.plan, user.email || user.username)}
                                                                className="bg-[#D4F932] text-black px-2 py-0.5 rounded text-[10px] font-bold hover:brightness-110 flex items-center gap-1"
                                                                title="Verify User & Transaction"
                                                            >
                                                                <CheckCircle size={10} /> Verify
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : <span className="text-zinc-600">-</span>}
                                            </td>
                                            <td className="p-4">
                                                {user.subscription_end ? (
                                                    (() => {
                                                        const end = new Date(user.subscription_end);
                                                        const now = new Date();
                                                        const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 3600 * 24));
                                                        return (
                                                            <div>
                                                                <div className={`text-xs font-mono font-bold ${daysLeft <= 3 && daysLeft >= 0 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                                                                    {end.toLocaleDateString()}
                                                                </div>
                                                                {daysLeft <= 3 && daysLeft >= 0 && (
                                                                    <div className="text-[9px] text-red-500 uppercase font-bold mt-1">Expiring Soon!</div>
                                                                )}
                                                                {daysLeft < 0 && (
                                                                    <div className="text-[9px] text-zinc-600 uppercase font-bold mt-1">Expired</div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()
                                                ) : <span className="text-zinc-600 text-xs">-</span>}
                                            </td>
                                            <td className="p-4">
                                                {user.role !== 'admin' && (
                                                    <div className="flex gap-2">
                                                        {(!user.plan || user.plan.toString().startsWith('PENDING')) && (
                                                            <button
                                                                onClick={() => setVerifyModal({ open: true, user })}
                                                                className="text-xs bg-[#D4F932] text-black px-2 py-1 rounded font-bold hover:brightness-110"
                                                            >
                                                                Verify
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEditUser(user)}
                                                            className="text-blue-500 hover:text-white"
                                                            title="Edit User"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button onClick={() => deleteItem('users', user.id)} className="text-red-500 hover:text-white">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
                }

                {/* TRANSACTIONS TAB */}
                {
                    activeTab === 'transactions' && (
                        <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Order ID</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4">Package</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Proof</th>
                                        <th className="p-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {transactions.length === 0 && (
                                        <tr><td colSpan={8} className="p-8 text-center text-zinc-500">No transactions yet.</td></tr>
                                    )}
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-zinc-900/20">
                                            <td className="p-4 text-xs font-mono text-zinc-400">{tx.id}</td>
                                            <td className="p-4 font-bold">{tx.customer_name}<br /><span className="text-xs font-normal text-zinc-500">{tx.email}</span></td>
                                            <td className="p-4">{tx.package}</td>
                                            <td className="p-4 font-mono">Rp{(parseInt(tx.amount) || 0).toLocaleString()}</td>
                                            <td className="p-4 text-xs text-zinc-500">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tx.status === 'success' || tx.status === 'manual_success' ? 'bg-[#D4F932]/20 text-[#D4F932]' : 'bg-yellow-500/10 text-yellow-500'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {tx.proof_image ? (
                                                    <a href={tx.proof_image} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#D4F932] hover:underline text-xs">
                                                        <Settings size={14} /> View
                                                    </a>
                                                ) : <span className="text-zinc-600">-</span>}
                                            </td>
                                            <td className="p-4 flex items-center gap-2">
                                                {(tx.status === 'pending' || tx.status === 'manual_success' || tx.status === 'pending_payment') && (
                                                    <button
                                                        onClick={() => confirmTransaction(tx)}
                                                        className="text-black bg-[#D4F932] hover:brightness-110 p-2 rounded-lg transition-colors"
                                                        title="Confirm Payment"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button onClick={() => deleteItem('transactions', tx.id)} className="text-red-500 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors" title="Delete Transaction">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }

                {
                    activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold">Membership Packages</h3>
                                <button
                                    onClick={() => {
                                        setCurrentProduct(null); // Clear for new entry
                                        setIsProductModalOpen(true);
                                    }}
                                    className="bg-[#D4F932] text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:brightness-110"
                                >
                                    <Plus size={18} />
                                    Add New Package
                                </button>
                            </div>

                            <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="p-4">Package ID</th>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4">Duration</th>
                                            <th className="p-4 hidden md:table-cell">Features</th>
                                            <th className="p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        {products.map(p => (
                                            <tr key={p.id} className="hover:bg-zinc-900/20">
                                                <td className="p-4 font-mono text-zinc-400 text-xs">{p.id}</td>
                                                <td className="p-4 font-bold text-white">
                                                    {p.name}
                                                    <div className="text-xs text-zinc-500 font-normal mt-1 line-clamp-1">{p.description}</div>
                                                </td>
                                                <td className="p-4 text-[#D4F932] font-mono">Rp{p.price.toLocaleString()}</td>
                                                <td className="p-4 text-zinc-300 text-sm">{p.duration}</td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <div className="flex flex-wrap gap-1">
                                                        {Array.isArray(p.features) && p.features.slice(0, 2).map((f: string, i: number) => (
                                                            <span key={i} className="inline-block bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded">
                                                                {f}
                                                            </span>
                                                        ))}
                                                        {Array.isArray(p.features) && p.features.length > 2 && (
                                                            <span className="text-[10px] text-zinc-600 self-center">+{p.features.length - 2} more</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setCurrentProduct(p);
                                                                setIsProductModalOpen(true);
                                                            }}
                                                            className="text-zinc-400 hover:text-white"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>

                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => moveProduct(p.id, 'up')}
                                                                className="text-zinc-500 hover:text-white disabled:opacity-30"
                                                                disabled={products.indexOf(p) === 0}
                                                            >
                                                                <ArrowUp size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => moveProduct(p.id, 'down')}
                                                                className="text-zinc-500 hover:text-white disabled:opacity-30"
                                                                disabled={products.indexOf(p) === products.length - 1}
                                                            >
                                                                <ArrowDown size={14} />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => deleteProduct(p.id)}
                                                            className="text-red-500 hover:text-red-400"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {/* VOUCHERS TAB */}
                {
                    activeTab === 'vouchers' && (
                        <div className="space-y-6">
                            <div className="bg-[#111] border border-zinc-800 p-6 rounded-2xl">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Plus size={18} className="text-[#D4F932]" />
                                    Add New Voucher
                                </h3>
                                <form onSubmit={addVoucher} className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Voucher Code</label>
                                        <input name="code" required placeholder="e.g. SUMMER50" className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white font-mono uppercase focus:border-[#D4F932] outline-none" />
                                    </div>
                                    <div className="w-full md:w-48">
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Discount Type</label>
                                        <select name="discount_type" className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white focus:border-[#D4F932] outline-none">
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (Rp)</option>
                                        </select>
                                    </div>
                                    <div className="w-full md:w-48">
                                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Value</label>
                                        <input name="discount_value" type="number" required placeholder="e.g. 50 or 50000" className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white focus:border-[#D4F932] outline-none" />
                                    </div>
                                    <button className="bg-[#D4F932] text-black font-bold px-6 py-3 rounded-lg hover:brightness-110 w-full md:w-auto">
                                        Create
                                    </button>
                                </form>
                            </div>

                            <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="p-4">Code</th>
                                            <th className="p-4">Discount</th>
                                            <th className="p-4">Created At</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        {vouchers.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No vouchers active.</td></tr>
                                        )}
                                        {vouchers.map(v => (
                                            <tr key={v.id} className="hover:bg-zinc-900/20">
                                                <td className="p-4 font-mono font-bold text-[#D4F932] text-lg">{v.code}</td>
                                                <td className="p-4 font-bold text-white">
                                                    {v.discount_type === 'percentage'
                                                        ? `${v.discount_value}% OFF`
                                                        : `Rp${v.discount_value.toLocaleString()} OFF`
                                                    }
                                                </td>
                                                <td className="p-4 text-xs text-zinc-500">{new Date(v.created_at).toLocaleDateString()}</td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => deleteItem('vouchers', v.id)} className="text-red-500 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {/* GRINDERS TAB */}
                {
                    activeTab === 'grinders' && (
                        <div className="space-y-6">
                            {/* Add Form */}
                            <div className="bg-[#111] border border-zinc-800 p-6 rounded-2xl mb-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18} /> Add New Grinder</h3>
                                <form onSubmit={addGrinder} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    <input name="name" placeholder="Grinder Name" required className="md:col-span-2 bg-black border border-zinc-800 p-2 rounded text-sm text-white" />
                                    <input name="type" placeholder="Type" className="bg-black border border-zinc-800 p-2 rounded text-sm text-white" />
                                    <input name="coarse" placeholder="Coarse Setting" className="bg-black border border-zinc-800 p-2 rounded text-sm text-white" />
                                    <input name="medium" placeholder="Medium Setting" className="bg-black border border-zinc-800 p-2 rounded text-sm text-white" />
                                    <input name="fine" placeholder="Fine Setting" className="bg-black border border-zinc-800 p-2 rounded text-sm text-white" />
                                    <button className="bg-[#D4F932] text-black font-bold p-2 rounded text-sm hover:brightness-110">Add</button>
                                </form>
                            </div>

                            {/* Table */}
                            <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Mechanism</th>
                                            <th className="p-4">Coarse</th>
                                            <th className="p-4">Medium</th>
                                            <th className="p-4">Fine</th>
                                            <th className="p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900 border-zinc-800">
                                        {grinders.map(g => (
                                            <tr key={g.id} className="hover:bg-zinc-900/20 text-sm">
                                                <td className="p-4 font-bold">{g.name}</td>
                                                <td className="p-4 text-zinc-500">{g.type}</td>
                                                <td className="p-4 font-mono text-zinc-400">{g.coarse}</td>
                                                <td className="p-4 font-mono text-zinc-400">{g.medium}</td>
                                                <td className="p-4 font-mono text-zinc-400">{g.fine}</td>
                                                <td className="p-4">
                                                    <button onClick={() => deleteItem('grinders', g.id)} className="text-red-500 hover:text-white">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

                {/* DRIPPERS TAB */}
                {
                    activeTab === 'drippers' && (
                        <div className="space-y-6">
                            {/* Add Form */}
                            <div className="bg-[#111] border border-zinc-800 p-6 rounded-2xl mb-6">
                                <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18} /> Add New Dripper</h3>
                                <form onSubmit={addDripper} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <input name="name" placeholder="Dripper Name" required className="bg-black border border-zinc-800 p-2 rounded text-sm text-white" />
                                    <input name="brand" placeholder="Brand (Optional)" className="bg-black border border-zinc-800 p-2 rounded text-sm text-white" />
                                    <input name="type" placeholder="Type (e.g. Cone, Flat)" className="bg-black border border-zinc-800 p-2 rounded text-sm text-white" />
                                    <button className="bg-[#D4F932] text-black font-bold p-2.5 rounded text-sm hover:brightness-110">Add Dripper</button>
                                </form>
                            </div>

                            {/* Table */}
                            <div className="bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-900/50 text-zinc-500 text-xs uppercase font-bold">
                                        <tr>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Brand</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900 border-zinc-800">
                                        {drippers.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No drippers found.</td></tr>
                                        )}
                                        {drippers.map(g => (
                                            <tr key={g.id} className="hover:bg-zinc-900/20 text-sm">
                                                <td className="p-4 font-bold">{g.name}</td>
                                                <td className="p-4 text-zinc-500">{g.brand || '-'}</td>
                                                <td className="p-4 text-zinc-400">{g.type || '-'}</td>
                                                <td className="p-4">
                                                    <button onClick={() => deleteItem('drippers', g.id)} className="text-red-500 hover:text-white">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }
                {/* CONTENT TAB */}
                {
                    activeTab === 'content' && siteContent && (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Sidebar for Sections */}
                            <div className="w-full lg:w-64 space-y-2 shrink-0">
                                {['hero', 'howItWorks', 'testimonials', 'faq', 'finalCta'].map(section => (
                                    <button
                                        key={section}
                                        onClick={() => setContentSection(section)}
                                        className={`w-full text-left px-4 py-3 rounded-lg font-bold uppercase text-xs transition-colors ${contentSection === section ? 'bg-[#D4F932] text-black' : 'bg-[#111] text-zinc-500 hover:text-white'
                                            }`}
                                    >
                                        {section.replace(/([A-Z])/g, ' $1')}
                                    </button>
                                ))}
                            </div>

                            {/* Editor Area */}
                            <div className="flex-1 bg-[#111] border border-zinc-800 p-8 rounded-2xl">
                                <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white capitalize">{contentSection.replace(/([A-Z])/g, ' $1')}</h3>
                                        <p className="text-sm text-zinc-500">Edit content for this section.</p>
                                    </div>
                                    <button
                                        onClick={() => saveContentSection(contentSection)}
                                        className="bg-[#D4F932] text-black font-bold px-6 py-2 rounded-lg hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Save Changes
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Generic Text Fields */}
                                    {Object.keys(siteContent[contentSection]).map(key => {
                                        const value = siteContent[contentSection][key];
                                        if (typeof value === 'string') {
                                            return (
                                                <div key={key}>
                                                    <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">{key}</label>
                                                    {key === 'subtitle' || key === 'desc' || key.includes('text') || value.length > 50 ? (
                                                        <textarea
                                                            value={value}
                                                            onChange={e => handleContentChange(contentSection, key, e.target.value)}
                                                            rows={3}
                                                            className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-zinc-200 outline-none focus:border-[#D4F932]"
                                                        />
                                                    ) : (
                                                        <input
                                                            value={value}
                                                            onChange={e => handleContentChange(contentSection, key, e.target.value)}
                                                            className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white outline-none focus:border-[#D4F932]"
                                                        />
                                                    )}
                                                </div>
                                            )
                                        }
                                        return null;
                                    })}

                                    {/* Array Fields (Specific Handling) */}
                                    {contentSection === 'howItWorks' && (
                                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold text-white">Steps</h4>
                                                <button
                                                    onClick={() => {
                                                        const newArr = [...siteContent.howItWorks.steps, { title: 'New Step', desc: 'Description' }];
                                                        handleContentChange('howItWorks', 'steps', newArr);
                                                    }}
                                                    className="text-xs bg-zinc-800 px-2 py-1 rounded text-white"
                                                >+ Add Item</button>
                                            </div>
                                            {siteContent.howItWorks.steps.map((step: any, i: number) => (
                                                <div key={i} className="p-4 bg-black rounded-xl border border-zinc-800 space-y-3 relative group">
                                                    <button
                                                        onClick={() => {
                                                            const newArr = siteContent.howItWorks.steps.filter((_: any, idx: number) => idx !== i);
                                                            handleContentChange('howItWorks', 'steps', newArr);
                                                        }}
                                                        className="absolute top-2 right-2 text-zinc-600 hover:text-red-500"
                                                    ><XCircle size={16} /></button>
                                                    <input
                                                        value={step.title}
                                                        onChange={e => handleArrayChange('howItWorks', 'steps', i, 'title', e.target.value)}
                                                        className="w-full bg-zinc-900 border-none rounded p-2 text-sm text-[#D4F932] font-bold"
                                                        placeholder="Step Title"
                                                    />
                                                    <textarea
                                                        value={step.desc}
                                                        onChange={e => handleArrayChange('howItWorks', 'steps', i, 'desc', e.target.value)}
                                                        className="w-full bg-zinc-900 border-none rounded p-2 text-sm text-zinc-400"
                                                        rows={2}
                                                        placeholder="Step Description"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {contentSection === 'testimonials' && (
                                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold text-white">Testimonials</h4>
                                                <button
                                                    onClick={() => {
                                                        const newArr = [...siteContent.testimonials.items, { name: 'New User', role: 'Role', text: 'Review...' }];
                                                        handleContentChange('testimonials', 'items', newArr);
                                                    }}
                                                    className="text-xs bg-zinc-800 px-2 py-1 rounded text-white"
                                                >+ Add Item</button>
                                            </div>
                                            {siteContent.testimonials.items.map((item: any, i: number) => (
                                                <div key={i} className="p-4 bg-black rounded-xl border border-zinc-800 space-y-2 relative group">
                                                    <button
                                                        onClick={() => {
                                                            const newArr = siteContent.testimonials.items.filter((_: any, idx: number) => idx !== i);
                                                            handleContentChange('testimonials', 'items', newArr);
                                                        }}
                                                        className="absolute top-2 right-2 text-zinc-600 hover:text-red-500"
                                                    ><XCircle size={16} /></button>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            value={item.name}
                                                            onChange={e => handleArrayChange('testimonials', 'items', i, 'name', e.target.value)}
                                                            className="bg-zinc-900 border-none rounded p-2 text-sm text-white font-bold"
                                                            placeholder="Name"
                                                        />
                                                        <input
                                                            value={item.role}
                                                            onChange={e => handleArrayChange('testimonials', 'items', i, 'role', e.target.value)}
                                                            className="bg-zinc-900 border-none rounded p-2 text-sm text-zinc-400"
                                                            placeholder="Role"
                                                        />
                                                    </div>
                                                    <textarea
                                                        value={item.text}
                                                        onChange={e => handleArrayChange('testimonials', 'items', i, 'text', e.target.value)}
                                                        className="w-full bg-zinc-900 border-none rounded p-2 text-sm text-zinc-300"
                                                        rows={2}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {contentSection === 'faq' && (
                                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold text-white">FAQ Items</h4>
                                                <button
                                                    onClick={() => {
                                                        const newArr = [...siteContent.faq.items, { question: 'New Question?', answer: 'Answer here.' }];
                                                        handleContentChange('faq', 'items', newArr);
                                                    }}
                                                    className="text-xs bg-zinc-800 px-2 py-1 rounded text-white"
                                                >+ Add Item</button>
                                            </div>
                                            {siteContent.faq.items.map((item: any, i: number) => (
                                                <div key={i} className="p-4 bg-black rounded-xl border border-zinc-800 space-y-2 relative">
                                                    <button
                                                        onClick={() => {
                                                            const newArr = siteContent.faq.items.filter((_: any, idx: number) => idx !== i);
                                                            handleContentChange('faq', 'items', newArr);
                                                        }}
                                                        className="absolute top-2 right-2 text-zinc-600 hover:text-red-500"
                                                    ><XCircle size={16} /></button>
                                                    <input
                                                        value={item.question}
                                                        onChange={e => handleArrayChange('faq', 'items', i, 'question', e.target.value)}
                                                        className="w-full bg-zinc-900 border-none rounded p-2 text-sm text-white font-bold"
                                                        placeholder="Question"
                                                    />
                                                    <textarea
                                                        value={item.answer}
                                                        onChange={e => handleArrayChange('faq', 'items', i, 'answer', e.target.value)}
                                                        className="w-full bg-zinc-900 border-none rounded p-2 text-sm text-zinc-300"
                                                        rows={2}
                                                        placeholder="Answer"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* PAYMENT TAB */}
                {activeTab === 'payment' && <PaymentSettings />}

                {/* VERIFY MODAL */}
                {
                    verifyModal.open && verifyModal.user && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
                                <button
                                    onClick={() => setVerifyModal({ open: false, user: null })}
                                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                                >
                                    <XCircle size={24} />
                                </button>

                                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <ShieldCheck className="text-[#D4F932]" />
                                    Verify User
                                </h2>
                                <p className="text-zinc-500 text-sm mb-6">Set active plan for <b>{verifyModal.user.name}</b></p>

                                <form onSubmit={handleVerifyUser} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Select Plan</label>
                                        <select name="plan" required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none">
                                            <option value="Starter Brew">Starter Brew</option>
                                            <option value="Home Barista">Home Barista</option>
                                            <option value="Pro Brewer">Pro Brewer</option>
                                            <option value="Coffee Master">Coffee Master</option>
                                            <option value="Lifetime Access">Lifetime Access</option>
                                        </select>
                                    </div>
                                    <div className="text-xs text-zinc-600 bg-zinc-900/50 p-3 rounded">
                                        This will activate the user immediately and create a manual transaction record.
                                    </div>

                                    <button className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110">
                                        Confirm Verification
                                    </button>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* SETTINGS TAB */}
                {
                    activeTab === 'settings' && (
                        <div className="max-w-2xl bg-[#111] border border-zinc-800 p-8 rounded-2xl">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Settings size={20} className="text-[#D4F932]" />
                                Profile Settings
                            </h3>
                            <form onSubmit={updateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Username</label>
                                        <input
                                            name="username"
                                            defaultValue={JSON.parse(localStorage.getItem('admin_user') || '{}').username}
                                            className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">Display Name</label>
                                        <input
                                            name="name"
                                            defaultValue={JSON.parse(localStorage.getItem('admin_user') || '{}').name}
                                            className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-zinc-500 uppercase font-bold block mb-2">New Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="Leave blank to keep current password"
                                        className="w-full bg-black border border-zinc-800 p-3 rounded-lg text-white"
                                    />
                                    <p className="text-xs text-zinc-600 mt-2">* You will need to login again after changing these details.</p>
                                </div>

                                <div className="pt-4 border-t border-zinc-800 flex justify-end">
                                    <button className="bg-[#D4F932] text-black font-bold px-6 py-3 rounded-lg hover:brightness-110 flex items-center gap-2">
                                        <CheckCircle size={18} />
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )
                }
                {/* ADD USER MODAL */}
                {
                    isAddUserModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative">
                                <button
                                    onClick={() => setIsAddUserModalOpen(false)}
                                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                                >
                                    <XCircle size={24} />
                                </button>

                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <UserPlus className="text-[#D4F932]" />
                                    Add New User
                                </h2>

                                <form onSubmit={handleAddUser} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Username / Email</label>
                                            <input name="username" required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Full Name</label>
                                            <input name="name" required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Password</label>
                                            <input name="password" type="password" required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Phone (WA)</label>
                                            <input name="phone" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Role</label>
                                            <select name="role" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none">
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Subscription Plan</label>
                                            <select name="plan" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none">
                                                <option value="">No Plan</option>
                                                <option value="Starter Brew">Starter Brew</option>
                                                <option value="Home Barista">Home Barista</option>
                                                <option value="Pro Brewer">Pro Brewer</option>
                                                <option value="Coffee Master">Coffee Master</option>
                                                <option value="Lifetime Access">Lifetime Access</option>
                                            </select>
                                            <p className="text-[10px] text-zinc-600 mt-1">* Adds manual transaction record.</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Manual Amount (Rp)</label>
                                            <input name="amount" type="number" placeholder="Enter custom price or 0" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                    </div>

                                    <button className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110 mt-4">
                                        Create User
                                    </button>
                                </form>
                            </div>
                        </div >
                    )
                }

                {/* EDIT USER MODAL */}
                {
                    isEditUserModalOpen && editingUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative">
                                <button
                                    onClick={() => { setIsEditUserModalOpen(false); setEditingUser(null); }}
                                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                                >
                                    <XCircle size={24} />
                                </button>

                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Edit2 className="text-[#D4F932]" />
                                    Edit User
                                </h2>

                                <form onSubmit={handleUpdateUser} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Username (Read-only)</label>
                                        <input value={editingUser.username} readOnly className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white opacity-50 cursor-not-allowed" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Full Name</label>
                                        <input name="name" defaultValue={editingUser.name} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Role</label>
                                        <select name="role" defaultValue={editingUser.role} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none">
                                            <option value="member">Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Subscription Plan</label>
                                        <select name="plan" defaultValue={editingUser.plan || ''} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none">
                                            <option value="">No Plan</option>
                                            <option value="Starter Brew">Starter Brew</option>
                                            <option value="Home Barista">Home Barista</option>
                                            <option value="Pro Brewer">Pro Brewer</option>
                                            <option value="Coffee Master">Coffee Master</option>
                                            <option value="Lifetime Access">Lifetime Access</option>
                                            {/* Allow keeping existing custom/pending plans not in list */}
                                            {(!['', 'Starter Brew', 'Home Barista', 'Pro Brewer', 'Coffee Master', 'Lifetime Access'].includes(editingUser.plan || '')) && (
                                                <option value={editingUser.plan}>{editingUser.plan}</option>
                                            )}
                                        </select>
                                    </div>

                                    <button className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110 mt-4">
                                        Update User
                                    </button>
                                </form>
                            </div>
                        </div >
                    )
                }

                {/* PRODUCT MODAL */}
                {
                    isProductModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                                <button
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                                >
                                    <XCircle size={24} />
                                </button>

                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Coffee className="text-[#D4F932]" />
                                    {currentProduct ? 'Edit Package' : 'Add New Package'}
                                </h2>

                                <form onSubmit={handleSaveProduct} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Package ID (Slug)</label>
                                        <input
                                            name="id"
                                            defaultValue={currentProduct?.id || ''}
                                            required
                                            placeholder="e.g. pro-brewer"
                                            readOnly={!!currentProduct} // ID is immutable when editing
                                            className={`w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none ${currentProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Package Name</label>
                                            <input name="name" defaultValue={currentProduct?.name || ''} required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Price (IDR)</label>
                                            <input name="price" type="number" defaultValue={currentProduct?.price || ''} required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Duration Label</label>
                                        <input name="duration" defaultValue={currentProduct?.duration || ''} placeholder="e.g. Billed Monthly" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                                        <textarea name="description" defaultValue={currentProduct?.description || ''} rows={2} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Monthly Price (Opt)</label>
                                            <input name="monthly_price" type="number" defaultValue={currentProduct?.monthly_price || ''} placeholder="Auto-calc if empty" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Savings Text (Opt)</label>
                                            <input name="savings_text" defaultValue={currentProduct?.savings_text || ''} placeholder="e.g. Hemat 33%" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Promo Text (Opt)</label>
                                        <input name="promo_text" defaultValue={currentProduct?.promo_text || ''} placeholder="e.g. Bonus Ebook" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Features (One per line)</label>
                                        <textarea
                                            name="features"
                                            defaultValue={currentProduct?.features ? currentProduct.features.join('\n') : ''}
                                            rows={5}
                                            placeholder="AI Recipe Generation&#10;Unlimited Saves&#10;Priority Support"
                                            className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-[#D4F932] outline-none font-mono text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                        <input
                                            type="checkbox"
                                            name="is_best_seller"
                                            id="is_best_seller"
                                            defaultChecked={currentProduct?.is_best_seller}
                                            className="w-5 h-5 rounded border-zinc-700 bg-black text-[#D4F932] focus:ring-[#D4F932]"
                                        />
                                        <label htmlFor="is_best_seller" className="text-sm font-bold text-zinc-300 cursor-pointer">Set as Best Seller</label>
                                    </div>

                                    <button className="w-full bg-[#D4F932] text-black font-bold py-3 rounded-lg hover:brightness-110 mt-4">
                                        {currentProduct ? 'Save Changes' : 'Create Package'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}

function StatsCard({ title, value, icon: Icon }: any) {
    return (
        <div className="bg-[#111] border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
            <div>
                <p className="text-zinc-500 text-xs font-bold uppercase mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white">{value}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-[#D4F932]">
                <Icon size={24} />
            </div>
        </div>
    )
}
