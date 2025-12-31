-- Update site_content with Indonesian text requested by user
UPDATE site_config
SET value = '{
    "hero": {
        "title": "Master Your \n Morning Ritual",
        "subtitle": "BrewLogic adalah asisten seduh kopi pribadi berbasis AI yang dirancang untuk mengubah setiap home brewer menjadi barista ahli. Dengan menganalisis variabel kompleks seperti asal biji, proses pasca-panen, hingga jenis grinder, BrewLogic menciptakan resep presisi secara otomatis agar Anda bisa menikmati sweet spot kopi setiap hari tanpa trial-and-error yang boros.",
        "ctaText": "Start Brewing Now",
        "ctaLink": "/#pricing"
    },
    "howItWorks": {
        "title": "Cara Kerja BrewLogic",
        "subtitle": "Tiga langkah sederhana menuju cangkir kopi sempurna, bertenaga kecerdasan buatan.",
        "steps": [
            { "title": "1. Input Variabel", "desc": "Masukkan detail biji kopi (asal, proses), alat seduh, dan grinder yang Anda gunakan." },
            { "title": "2. AI Calibration", "desc": "Algoritma kami menganalisis ribuan data untuk menentukan suhu, gilingan, dan rasio ideal." },
            { "title": "3. Seduh Presisi", "desc": "Ikuti panduan step-by-step real-time: kapan menuang, kapan mengaduk, hingga tetes terakhir." }
        ]
    },
    "pricing": {
        "title": "Pilih Paket Membership",
        "subtitle": "Investasi kecil untuk kenikmatan kopi sempurna setiap hari. Hemat hingga 58% dengan paket tahunan."
    },
    "testimonials": {
        "title": "Kata Mereka Tentang BrewLogic",
        "items": [
            { "name": "Andreas Lukman", "role": "Home Brewer", "text": "Saya selalu kesulitan menyeduh kopi anaerobic process. BrewLogic menyarankan suhu yang lebih rendah dan gilingan yang tak terpikirkan sebelumnya. Hasilnya? Manis luar biasa!" },
            { "name": "Sarah Wijaya", "role": "Coffee Shop Owner", "text": "Fitur kalibrasi grindernya sangat akurat. Saya menggunakannya untuk menstandarisasi resep manual brew di kedai saya. Barista junior jadi lebih cepat belajar." },
            { "name": "Budi Santoso", "role": "Coffee Enthusiast", "text": "Investasi terbaik untuk hobi kopi saya. Daripada buang biji mahal karena salah seduh, mending pakai BrewLogic. Rasanya konsisten setiap pagi." }
        ]
    },
    "grinder": {
        "title": "List Grinder dan Dripper yang tersedia di Brewlogic",
        "subtitle": "BrewLogic mendukung kalibrasi untuk berbagai grinder populer di pasar. Cek apakah alatmu terdaftar.",
        "disclaimer": "*Data ini adalah referensi awal. Hasil akhir dipengaruhi kalibrasi alat & usia burr. Alat Anda belum ada? <a href=\"#\" className=\"text-[#D4F932] underline hover:no-underline\">Request di sini.</a>"
    },
    "faq": {
        "title": "Pertanyaan Umum (FAQ)",
        "items": [
            { "question": "Apakah aplikasi ini cocok untuk pemula?", "answer": "Sangat cocok! BrewLogic dirancang untuk memandu Anda dari nol. Anda hanya perlu memilih alat yang Anda punya, dan kami yang akan menghitung sisanya." }
        ]
    },
    "finalCta": {
        "title": "Siap Menyeduh Kopi Terbaikmu?",
        "subtitle": "Bergabunglah sekarang dan rasakan perbedaan di cangkir pertama. Jangan biarkan biji kopi spesialmu tersia-sia.",
        "buttonText": "Coba BrewLogic Sekarang"
    }
}'::jsonb
WHERE key = 'site_content';
