# Panduan Menghubungkan Domain Hostinger ke Vercel

Berikut adalah langkah-langkah untuk menghubungkan domain yang Anda beli di **Hostinger** ke aplikasi yang di-deploy di **Vercel**.

## 1. Dapatkan DNS Record dari Vercel
1. Masuk ke **Vercel Dashboard** (vercel.com).
2. Pilih project `brewlogic-brewing-recipe` Anda.
3. Pergi ke tab **Settings** -> **Domains**.
4. Masukkan nama domain Anda (contoh: `brewlogic.com`) di kolom input dan klik **Add**.
5. Vercel akan memberikan **Invalid Configuration** dengan detail DNS record yang dibutuhkan. Biasanya ada dua opsi:
   - **Recommended**: A Record (`76.76.21.21`).
   - **CNAME**: `cname.vercel-dns.com` (untuk subdomain seperti `www`).

   **Catat data berikut:**
   - **Type**: A
   - **Value**: `76.76.21.21` (Ini adalah IP Vercel)
   - **Type**: CNAME
   - **Name**: `www`
   - **Value**: `cname.vercel-dns.com`

## 2. Setting DNS di Hostinger
1. Login ke akun **Hostinger** Anda.
2. Klik menu **Domains** di bagian atas.
3. Pilih domain yang ingin Anda hubungkan, lalu klik **Manage** (Kelola).
4. Di sidebar kiri, cari menu **DNS / Name Servers**.
5. **PENTING**: Hapus record lama yang bertipe **A** dan **CNAME** jika namanya sama (`@` atau `www`) agar tidak bentrok.
6. **Tambahkan Record Baru (A Record untuk Root Domain):**
   - **Type**: A
   - **Name**: @ (atau kosongkan jika Hostinger meminta kosong)
   - **Points to / Value**: `76.76.21.21`
   - **TTL**: Biarkan default (biasanya 14400 atau 3600)
   - Klik **Add Record**.

7. **Tambahkan Record Baru (CNAME untuk www):**
   - **Type**: CNAME
   - **Name**: www
   - **Points to / Target**: `cname.vercel-dns.com`
   - **TTL**: Biarkan default.
   - Klik **Add Record**.

## 3. Verifikasi
1. Kembali ke **Vercel Dashboard**.
2. Tunggu beberapa saat (bisa instan, atau hingga 24 jam untuk propagasi global).
3. Jika konfigurasi sudah benar, status di Vercel akan berubah menjadi centang biru **Valid**.
4. SSL (HTTPS) akan otomatis digenerate oleh Vercel dalam beberapa menit.

## Catatan Tambahan
- Jika Anda ingin menggunakan subdomain (misal: `app.brewlogic.com`), cukup tambahkan **CNAME** di Hostinger dengan Name `app` dan Target `cname.vercel-dns.com`. Anda tidak perlu A Record untuk subdomain di Vercel.
