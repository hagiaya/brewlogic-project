// Helper: Send Email via EmailJS
const sendEmail = async ({ toName, toEmail, subject, message }) => {
    try {
        const emailData = {
            service_id: process.env.VITE_EMAILJS_SERVICE_ID,
            template_id: process.env.VITE_EMAILJS_TEMPLATE_ID,
            user_id: process.env.VITE_EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
                to_name: toName,
                to_email: toEmail,
                subject: subject,
                message: message,
            }
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });

        if (!response.ok) {
            throw new Error(`EmailJS Error: ${await response.text()}`);
        }
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
};

