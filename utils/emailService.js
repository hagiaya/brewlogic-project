import emailjs from '@emailjs/browser';

// Inisialisasi EmailJS (Panggil sekali di app entry point atau sebelum usage)
// Namun kita bisa pass Public Key langsung di send()

export const sendOrderEmail = async (orderData) => {
    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceID || !templateID || !publicKey) {
        console.warn('EmailJS keys are missing inside .env');
        return;
    }

    try {
        const templateParams = {
            to_name: orderData.name,
            to_email: orderData.email,
            order_id: orderData.orderId,
            package_name: orderData.packageName,
            amount: orderData.amount,
            payment_method: orderData.paymentMethod, // 'manual', 'xendit', 'midtrans'
            status: orderData.paymentMethod === 'manual' ? 'Menunggu Konfirmasi' : 'Dalam Proses',
            // Tambahkan link pembayaran jika ada
            payment_link: orderData.paymentUrl || '-'
        };

        const response = await emailjs.send(serviceID, templateID, templateParams, publicKey);
        console.log('Email sent successfully!', response.status, response.text);
        return true;
    } catch (err) {
        console.error('Failed to send email:', err);
        return false;
    }
};
