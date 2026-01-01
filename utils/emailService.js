import emailjs from '@emailjs/browser';

// GENERIC SENDER (Base Function)
// Template must have: {{to_name}}, {{to_email}}, {{subject}}, {{message}}, {{action_url}}, {{action_text}}
const sendEmailGeneric = async (params) => {
    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceID || !templateID || !publicKey) {
        console.warn('EmailJS keys are missing inside .env');
        return false;
    }

    try {
        const response = await emailjs.send(serviceID, templateID, params, publicKey);
        console.log('Email sent:', response.status, response.text);
        return true;
    } catch (err) {
        console.error('Failed to send email:', err);
        return false;
    }
};

// 1. ORDER EMAIL
export const sendOrderEmail = async (orderData) => {
    const message = `
        Terima kasih telah memesan paket ${orderData.package_name}.
        Total tagihan: Rp${orderData.amount.toLocaleString()}.
        Order ID: ${orderData.order_id}
        Metode Pembayaran: ${orderData.payment_method.toUpperCase()}
        Status: ${orderData.status}
    `;

    return await sendEmailGeneric({
        to_name: orderData.name,
        to_email: orderData.email,
        subject: `Konfirmasi Pesanan #${orderData.order_id}`,
        message: message,
        action_url: orderData.payment_link,
        action_text: "Bayar Sekarang"
    });
};

// 2. OTP EMAIL (Untuk Register / Login)
export const sendOTP = async (email, name, otp) => {
    const message = `
        Kode verifikasi (OTP) Anda adalah:
        
        ${otp}
        
        Jangan berikan kode ini kepada siapapun. Kode berlaku selama 5 menit.
    `;

    return await sendEmailGeneric({
        to_name: name || "User",
        to_email: email,
        subject: "Kode Verifikasi BrewLogic",
        message: message,
        action_url: "",
        action_text: ""
    });
};

// 3. PASSWORD RESET EMAIL
export const sendPasswordReset = async (email, name, link) => {
    const message = `
        Kami menerima permintaan untuk mereset password akun BrewLogic Anda.
        Silakan klik tombol di bawah ini untuk membuat password baru.
    `;

    return await sendEmailGeneric({
        to_name: name || "User",
        to_email: email,
        subject: "Reset Password BrewLogic",
        message: message,
        action_url: link,
        action_text: "Reset Password"
    });
};
