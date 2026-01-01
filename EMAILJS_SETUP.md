# Setup Email Otomatis (EmailJS)

Fitur email konfirmasi otomatis sudah ditambahkan! Sekarang Anda hanya perlu mendaftar di EmailJS (Gratis) dan mendapatkan kunci API Anda.

## Langkah 1: Daftar EmailJS
1. Buka [https://www.emailjs.com](https://www.emailjs.com) dan buat akun (Gratis).
2. Di Dashboard, klik **"Add New Service"** > pilih **Gmail** (atau layanan lain).
3. Klik **Connect Account** dan login Gmail Anda.
4. Klik **Create Service**.
5. Catat **Service ID** (Contoh: `service_xyz123`).

## Langkah 2: Buat Template Email
1. Klik menu **Email Templates** di kiri > **Create New Template**.
2. Desain email sesuka Anda.
3. Gunakan variabel berikut agar data dinamis masuk:
   - `{{to_name}}` : Nama Pembeli
   - `{{to_email}}` : Email Pembeli
   - `{{package_name}}` : Nama Paket
   - `{{amount}}` : Total Harga
   - `{{order_id}}` : ID Order
   - `{{payment_method}}` : Metode Bayar
   - `{{status}}` : Status (Pending/Success)
   - `{{payment_link}}` : Link Bayar (untuk Xendit/Midtrans)

   **Contoh Isi Email:**
   ```
   Halo {{to_name}},
   
   Terima kasih telah memesan paket {{package_name}}.
   Total: Rp{{amount}}
   Order ID: {{order_id}}

   Silakan selesaikan pembayaran Anda di sini:
   {{payment_link}}
   ```
4. Simpan Template. Catat **Template ID** (Contoh: `template_abc123`).

## Langkah 3: Dapatkan Public Key
1. Klik menu **Account** (Icon Orang di pojok kanan atas).
2. Catat **Public Key** Anda (Contoh: `user_123xyz`).

## Langkah 4: Masukkan ke Vercel (Environment Variables)
Masukkan 3 kunci tadi ke pengaturan **Environment Variables** di Vercel:

| Key | Value (Contoh) |
| --- | --- |
| `VITE_EMAILJS_SERVICE_ID` | `service_xyz123` |
| `VITE_EMAILJS_TEMPLATE_ID` | `template_abc123` |
| `VITE_EMAILJS_PUBLIC_KEY` | `user_123xyz` |

Setelah itu, **Redeploy** aplikasi Anda di Vercel agar perubahan efektif.
