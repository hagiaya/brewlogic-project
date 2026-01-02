import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env vars. In Vercel, these come from the environment, but locally we need them.
// trying to resolve from root if possible.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
const PORT = process.env.PORT || 5000;
const SERVER_START_TIME = new Date().toISOString();

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
let supabase;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase Keys! Server running in Limited Mode.");
    // Mock Supabase client to prevent crashes on query
    supabase = {
        from: () => ({
            select: () => ({ eq: () => ({ single: () => ({ error: "Server Missing Config" }) }) }),
            insert: () => ({ select: () => ({ error: "Server Missing Config" }) }),
            update: () => ({ eq: () => ({ select: () => ({ error: "Server Missing Config" }) }) }),
            delete: () => ({ eq: () => ({ error: "Server Missing Config" }) }),
            upsert: () => ({ error: "Server Missing Config" })
        })
    };
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
        console.error("Failed to init Supabase:", err);
        supabase = { from: () => ({ select: () => ({ error: "Supabase Init Failed" }) }) }; // Safe Fallback
    }
}


// Admin Client (Service Role) - For bypassing RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = supabase; // Default to anon if no service key (will fail RLS)
if (supabaseServiceKey) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        console.log("[INFO] Supabase Admin Client Initialized (RLS Bypass Enabled)");
    } catch (e) {
        console.warn("[WARN] Failed to init Supabase Admin:", e);
    }
} else {
    console.warn("[WARN] SUPABASE_SERVICE_ROLE_KEY missing. Password resets might fail if RLS is enabled.");
}


app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] API Request: ${req.method} ${req.url}`);
    next();
});

const DEFAULT_CONTENT = {
    hero: {
        title: "Master Your \n Morning Ritual",
        subtitle: "BrewLogic adalah asisten seduh kopi pribadi...",
        ctaText: "Start Brewing Now",
        ctaLink: "/#pricing"
    },
    howItWorks: {
        title: "Cara Kerja BrewLogic",
        subtitle: "Tiga langkah sederhana...",
        steps: [
            { title: "1. Input Variabel", desc: "Masukkan detail biji kopi..." },
            { title: "2. AI Calibration", desc: "Algoritma kami menganalisis..." },
            { title: "3. Seduh Presisi", desc: "Ikuti panduan step-by-step..." }
        ]
    },
    pricing: {
        title: "Pilih Paket Membership",
        subtitle: "Investasi kecil untuk kenikmatan kopi sempurna..."
    },
    testimonials: {
        title: "Kata Mereka",
        items: []
    },
    grinder: {
        title: "Database Grinder",
        subtitle: "Cek apakah alatmu terdaftar.",
        disclaimer: "*Data ini adalah referensi awal."
    },
    faq: {
        title: "FAQ",
        items: []
    },
    finalCta: {
        title: "Siap Menyeduh?",
        subtitle: "Bergabunglah sekarang.",
        buttonText: "Coba Sekarang"
    }
};

// --- HELPERS FOR DB CONFIG (Replacing File System) ---

// Helper: Get Config from DB
// Helper: Get Config from DB
const getConfig = async (key, defaultValue) => {
    // CRITICAL FIX: Bypass DB for payment settings on Netlify to prevent 502 timeouts
    // BUT we need to support dynamic keys now. We will try ONE fetch, if fails, fallback to Env.
    if (key === 'payment_settings') {
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('value')
                .eq('key', key)
                .maybeSingle(); // Use maybeSingle to avoid errors

            if (data && data.value) {
                return data.value;
            }
        } catch (e) {
            console.warn("DB Config Fetch Failed, using fallback");
        }

        // Fallback to Env if DB fails or empty
        const isProd = process.env.XENDIT_IS_PRODUCTION === 'true';
        return {
            isProduction: isProd,
            sandbox: {
                xendit: { secretKey: process.env.XENDIT_SECRET_KEY || "" },
                midtrans: { serverKey: process.env.MIDTRANS_SERVER_KEY || "", clientKey: process.env.MIDTRANS_CLIENT_KEY || "" }
            },
            production: {
                xendit: { secretKey: process.env.XENDIT_SECRET_KEY || "" },
                midtrans: { serverKey: process.env.MIDTRANS_SERVER_KEY || "", clientKey: process.env.MIDTRANS_CLIENT_KEY || "" }
            }
        };
    }

    try {
        const { data, error } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !data) {
            return defaultValue;
        }
        return data.value;
    } catch (err) {
        console.error(`Config Fetch Error (${key}):`, err);
        return defaultValue;
    }
};

// Helper: Save Config to DB
const saveConfig = async (key, value) => {
    const { error } = await supabase
        .from('site_config')
        .upsert({ key, value, updated_at: new Date() }, { onConflict: 'key' });

    if (error) {
        console.error(`Failed to save config for ${key}:`, error);
        return false;
    }
    return true;
};



// Midtrans Helper
const createMidtransTransaction = async (orderId, amount, customerDetails) => {
    const settings = await getConfig('payment_settings');
    const mode = settings.isProduction ? 'production' : 'sandbox';
    const keys = settings[mode]?.midtrans || {};

    const serverKey = keys.serverKey;
    if (!serverKey) throw new Error("Midtrans Server Key not found");

    const auth = Buffer.from(serverKey + ':').toString('base64');
    const apiUrl = settings.isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            transaction_details: {
                order_id: orderId,
                gross_amount: amount
            },
            credit_card: {
                secure: true
            },
            customer_details: {
                first_name: customerDetails.name,
                email: customerDetails.email,
                phone: customerDetails.phone
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error_messages?.join(', ') || "Failed to create Midtrans Transaction");
    }

    return data; // returns { token, redirect_url }
};

app.post('/api/create-transaction', async (req, res) => {
    const { name, email, phone, total, packageName, packageId, paymentMethod, uniqueCode, proofImage } = req.body;

    try {
        const orderId = `ORDER-${Date.now()}`;

        let newTx = {
            id: orderId,
            customer_name: name,
            email,
            phone,
            package_name: packageName,
            amount: total,
            status: 'pending',
            created_at: new Date().toISOString(),
            payment_method: paymentMethod || 'midtrans'
        };

        if (paymentMethod === 'manual') {
            // MANUAL TRANSFER LOGIC
            newTx.unique_code = uniqueCode || 0;
            newTx.transfer_amount = (total || 0) + (uniqueCode || 0);
            newTx.proof_image = proofImage || null;
            newTx.token = null;

            const { error } = await supabase.from('transactions').insert([newTx]);
            if (error) throw error;

            res.json({ success: true, order_id: orderId, is_manual: true });

        } else if (paymentMethod === 'midtrans') {
            // MIDTRANS LOGIC
            const transaction = await createMidtransTransaction(orderId, total, { name, email, phone });

            newTx.token = transaction.token;
            newTx.payment_url = transaction.redirect_url;

            const { error } = await supabase.from('transactions').insert([newTx]);
            if (error) throw error;

            res.json({
                redirect_url: transaction.redirect_url,
                token: transaction.token,
                order_id: orderId,
                is_manual: false
            });

        } else {

            throw new Error("Metode pembayaran tidak valid");
        }

    } catch (error) {
        console.error("Tx Error", error);
        res.status(500).json({ error: error.message || "Transaction failed" });
    }
});



// WEBHOOK HANDLER (No Static IP needed, just Public URL)
app.post('/api/webhooks/notification', async (req, res) => {
    try {
        const body = req.body;
        console.log("Webhook Received:", JSON.stringify(body));

        let orderId = null;
        let status = 'pending';
        let provider = 'unknown';

        // 1. Detect Midtrans
        // Midtrans sends: transaction_status, order_id, fraud_status
        if (body.transaction_status && body.order_id) {
            provider = 'midtrans';
            orderId = body.order_id;

            const transStatus = body.transaction_status;
            const fraudStatus = body.fraud_status;

            if (transStatus === 'capture') {
                status = (fraudStatus === 'challenge') ? 'challenge' : 'success';
            } else if (transStatus === 'settlement') {
                status = 'success';
            } else if (transStatus === 'deny' || transStatus === 'cancel' || transStatus === 'expire') {
                status = 'failed';
            } else if (transStatus === 'pending') {
                status = 'pending';
            }

            // 2. Detect Xendit (Invoice Callback)
            // Xendit sends: status, external_id, id
        }


        if (orderId && provider !== 'unknown') {
            // Update Transaction in DB
            const { error } = await supabase
                .from('transactions')
                .update({ status: status, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) {
                console.error("Webhook DB Error:", error);
                return res.status(500).send("DB Error");
            }

            // If Success, Activate User Plan (Optional - if you want auto-activation)
            if (status === 'success') {
                // Fetch TX to get user details
                const { data: tx } = await supabase.from('transactions').select('*').eq('id', orderId).single();
                if (tx && tx.email && tx.package_name) {
                    // Check if it's a valid plan
                    const planName = tx.package_name;
                    // Logic to calculate end date (simplified duplicate of register)
                    const now = new Date();
                    const end = new Date();
                    if (planName.toLowerCase().includes('master')) end.setFullYear(now.getFullYear() + 1);
                    else end.setMonth(now.getMonth() + 1);

                    await supabase.from('users')
                        .update({
                            plan: planName,
                            subscription_start: now.toISOString(),
                            subscription_end: end.toISOString()
                        })
                        .eq('email', tx.email);
                }
            }

            console.log(`Updated Order ${orderId} to ${status} via ${provider}`);
            return res.status(200).json({ received: true });
        }

        res.status(400).json({ error: "Unknown Payload" });

    } catch (err) {
        console.error("Webhook Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transaction-success', async (req, res) => {
    const { order_id, transaction_status } = req.body;

    // 1. Get transaction
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', order_id).single();
    if (!tx) return res.status(404).json({ error: "Transaction not found" });

    // 2. Update Transaction
    await supabase.from('transactions').update({ status: transaction_status || 'success' }).eq('id', order_id);

    // 3. Update User Plan - DISABLED. Admin must verify manually.
    // if (transaction_status === 'settlement' || transaction_status === 'capture' || transaction_status === 'success') {
    //     const { error } = await supabase.from('users')
    //         .update({ plan: tx.package_name })
    //         .eq('username', tx.email);
    // 
    //     if (error) console.error("Failed to update user plan", error);
    // }

    res.json({ success: true });
});


// FORGOT PASSWORD
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        console.log(`[INFO] Forgot Password Request for: ${email}`);

        // 1. Check User (Check both email and username columns)
        const { data: user, error: userErr } = await supabase.from('users')
            .select('name, username, email')
            .or(`email.eq.${email},username.eq.${email}`)
            .maybeSingle();

        if (!user) {
            console.log(`[WARN] User not found for: ${email}`);
            return res.status(400).json({ error: "Email/Username tidak terdaftar" });
        }

        // Use the actual email from DB if available, otherwise use input
        const targetEmail = user.email || user.username;

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60000).toISOString(); // 5 mins

        // 3. Save OTP
        // Delete old OTPs first
        await supabase.from('otp_codes').delete().or(`email.eq.${targetEmail},email.eq.${email}`);

        const { error: dbError } = await supabase.from('otp_codes').insert({
            email: targetEmail,
            otp_code: otp,
            expires_at: expiresAt
        });

        if (dbError) throw dbError;

        // 4. Send Email (via EmailJS REST API)
        // Note: Using REST API because we are on server
        const emailData = {
            service_id: process.env.VITE_EMAILJS_SERVICE_ID,
            template_id: process.env.VITE_EMAILJS_TEMPLATE_ID,
            user_id: process.env.VITE_EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY, // REQUIRED for non-browser/server-side requests
            template_params: {
                to_name: user.name || "User",
                to_email: targetEmail,
                subject: "Reset Password OTP",
                message: `Kode OTP Anda adalah: ${otp}`,
                action_url: "",
                action_text: ""
            }
        };

        const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });

        if (!emailRes.ok) {
            console.error("EmailJS Error:", await emailRes.text());
            throw new Error("Gagal mengirim email OTP");
        }

        res.json({ success: true, message: "OTP sent to email" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const { data } = await supabase.from('otp_codes')
            .select('*')
            .eq('email', email)
            .eq('otp_code', otp)
            .maybeSingle();

        if (!data) return res.status(400).json({ error: "Kode OTP salah" });

        if (new Date(data.expires_at) < new Date()) {
            return res.status(400).json({ error: "Kode OTP kadaluarsa" });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        // Re-verify OTP to be safe
        const { data } = await supabase.from('otp_codes')
            .select('*')
            .eq('email', email)
            .eq('otp_code', otp)
            .maybeSingle();

        if (!data || new Date(data.expires_at) < new Date()) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // Update Password
        const isAdmin = supabaseAdmin !== supabase;
        console.log(`[INFO] Resetting password for: ${email}. Privileged (Admin) Client: ${isAdmin}`);

        if (!isAdmin) {
            console.warn("[WARN] Using standard Supabase client. Update will fail if RLS is enabled for 'users' table. Please set SUPABASE_SERVICE_ROLE_KEY.");
        }

        // Use supabaseAdmin to bypass RLS policies
        // CRITICAL FIX: Match against email OR username, because 'email' variable might hold a username
        const { data: updateData, error, count } = await supabaseAdmin.from('users')
            .update({ password: newPassword }) // In real app, HASH THIS! 
            .or(`email.eq.${email},username.eq.${email}`)
            .select(); // Select to verify return

        if (error) throw error;

        // Check if any row was actually updated
        if (!updateData || updateData.length === 0) {
            console.error(`[ERROR] Reset Password Failed: No user found for '${email}' (or RLS blocked update)`);
            return res.status(400).json({ error: "Gagal update password. User tidak ditemukan atau server permission denied." });
        }

        console.log(`[SUCCESS] Password updated for ${email}`);

        // Clean up OTP
        await supabase.from('otp_codes').delete().eq('email', email);

        res.json({ success: true, message: "Password updated" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// MEMBER LOGIN
app.post('/api/member-login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[LOGIN START] Attempting login for: ${username}`);

    try {
        // 1. Find User by Username OR Email first (without password check)
        const { data: user, error } = await supabase.from('users')
            .select('*')
            .or(`username.eq.${username},email.eq.${username}`)
            .maybeSingle();

        if (error) {
            console.error("Login DB Error:", error);
            return res.status(500).json({ error: "Database error during login" });
        }

        if (!user) {
            console.log(`[LOGIN FAILED] User not found: ${username}`);
            return res.status(401).json({ error: "Username atau email tidak terdaftar" });
        }

        // 2. Check Password
        // Trimming inputs to avoid subtle whitespace issues
        if (user.password !== password && user.password !== password.trim()) {
            console.log(`[LOGIN FAILED] Password mismatch for: ${username}`);
            // Diagnostic log to see what's happening (remove in production)
            console.log(`[DEBUG] Input Password len: ${password.length}, DB Password len: ${user.password ? user.password.length : 0}`);
            return res.status(401).json({ error: "Password salah" });
        }

        console.log(`[LOGIN SUCCESS] User logged in: ${user.username}`);

        // Return user info (no sensitive data)
        const { password: _, ...userData } = user;
        res.json({ success: true, user: userData });

    } catch (err) {
        console.error("Login Exception:", err);
        res.status(500).json({ error: "Login failed system error" });
    }
});

// 3.5 USERS (Registration)
app.post('/api/users', async (req, res) => {
    const { username, password, name, email, phone, role, plan } = req.body;

    // Basic Validation
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Helper to get expiry based on plan name
    const getPlanExpiry = (planName) => {
        if (!planName) return null;
        const now = new Date();
        const p = planName.toLowerCase();

        if (p.includes("starter")) now.setMonth(now.getMonth() + 1);
        else if (p.includes("home")) now.setMonth(now.getMonth() + 3);
        else if (p.includes("pro")) now.setMonth(now.getMonth() + 6);
        else if (p.includes("master")) now.setFullYear(now.getFullYear() + 1);
        else if (p.includes("lifetime")) now.setFullYear(now.getFullYear() + 100);
        else now.setMonth(now.getMonth() + 1); // Default 1 month

        return now;
    };

    try {
        // Check if user exists (to provide better error msg than 500)
        // Use maybeSingle to avoid 500 error when no rows found
        const { data: existing } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
        if (existing) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        let subStart = null;
        let subEnd = null;

        // Only set dates if plan is ACTIVE (not pending)
        if (plan && !plan.startsWith('PENDING')) {
            subStart = new Date();
            subEnd = getPlanExpiry(plan);
        }

        const { data, error } = await supabase.from('users').insert([{
            username,
            email: email || username,
            password, // In prod, hash this! But maintaining existing flow.
            name,
            phone,
            role: role || 'member',
            plan,
            subscription_start: subStart,
            subscription_end: subEnd
        }]).select();

        if (error) {
            // Handle unique constraint violation race condition
            if (error.code === '23505') {
                return res.status(400).json({ error: 'Username already taken' });
            }
            throw error;
        }

        res.json({ success: true, user: data[0] });

    } catch (err) {
        console.error("User Register Error:", err);
        return res.status(500).json({ error: err.message || "Registration failed" });
    }
});

// 4. GRINDERS
app.get('/api/grinders', async (req, res) => {
    const { data, error } = await supabase.from('grinders').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/grinders', async (req, res) => {
    const { error } = await supabase.from('grinders').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/api/grinders/:id', async (req, res) => {
    const { error } = await supabase.from('grinders').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// 4.5 DRIPPERS
app.get('/api/drippers', async (req, res) => {
    const { data, error } = await supabase.from('drippers').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/drippers', async (req, res) => {
    const { error } = await supabase.from('drippers').insert([req.body]);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.delete('/api/drippers/:id', async (req, res) => {
    const { error } = await supabase.from('drippers').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// 5. SETTINGS
app.get('/api/settings/payment', async (req, res) => {
    const settings = await getConfig('payment_settings', { isProduction: false, sandbox: {}, production: {} });
    res.json(settings);
});

app.put('/api/settings/payment', async (req, res) => {
    const newSettings = req.body;
    let current = await getConfig('payment_settings', { isProduction: false });

    if (typeof newSettings.isProduction === 'boolean') current.isProduction = newSettings.isProduction;
    if (newSettings.sandbox) current.sandbox = { ...current.sandbox, ...newSettings.sandbox };
    if (newSettings.production) current.production = { ...current.production, ...newSettings.production };

    await saveConfig('payment_settings', current);
    res.json(current);
});

// 6. CONTENT
app.get('/api/content', async (req, res) => {
    const content = await getConfig('site_content', DEFAULT_CONTENT);
    res.json(content);
});

app.get('/api/content/:section', async (req, res) => {
    const { section } = req.params;
    const content = await getConfig('site_content', DEFAULT_CONTENT);

    if (content[section]) {
        res.json(content[section]);
    } else {
        res.json({});
    }
});

app.put('/api/content/:section', async (req, res) => {
    const { section } = req.params;
    const newData = req.body;

    let content = await getConfig('site_content', DEFAULT_CONTENT);
    if (!content[section]) content[section] = {};
    content[section] = { ...content[section], ...newData };

    const success = await saveConfig('site_content', content);
    if (!success) {
        return res.status(500).json({ error: "Failed to save content to database. Check server logs." });
    }
    res.json(content[section]);
});

// Catch-all 404 for API routes to always return JSON (fixes "Unexpected token <")
app.use('/api/*path', (req, res) => {
    console.log(`[404] Route Not Found: ${req.originalUrl}`);
    res.status(404).json({ error: `Route ${req.originalUrl} not found on this server.` });
});

// Export for Vercel
export default app;

// Start server if not running on Vercel
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`[OK] API Server started on port ${PORT}`);
        console.log(`[INFO] Server ID (Start Time): ${SERVER_START_TIME}`);
        console.log(`[INFO] EmailJS Private Key: ${process.env.EMAILJS_PRIVATE_KEY ? (process.env.EMAILJS_PRIVATE_KEY.substring(0, 4) + '...') : 'MISSING (Required for Strict Mode)'}`);
        console.log(`[OK] Mode: ${process.env.XENDIT_IS_PRODUCTION === 'true' ? 'PRODUCTION' : 'SANDBOX'}`);
    }).on('error', (err) => {
        console.error("Server Start Error:", err);
    });
}
