# Panduan Setup Webhook (Notifikasi Pembayaran)

Karena Anda menggunakan Vercel (Cloud Hosting), Anda tidak memerlukan IP Statis. Cukup gunakan URL Webhook di bawah ini.

## 1. Persiapan URL
Setelah Anda deploy ke Vercel, domain Anda akan terlihat seperti:
`https://brewlogic-project.vercel.app` (Contoh)

Maka, URL Webhook Anda adalah:
**`https://[DOMAIN-ANDA]/api/webhooks/notification`**

---

## 2. Setup Midtrans
1. Login ke [Dashboard Midtrans](https://dashboard.midtrans.com).
2. Masuk ke **Settings** > **Configuration**.
3. Cari bagian **Notification URL**.
4. Masukkan URL Webhook Anda:
   - `https://[DOMAIN-ANDA]/api/webhooks/notification`
5. Pastikan **Allow Transactions from** (IP Whitelist) **DIKOSONGKAN** atau diisi simbol wildcard jika ada, agar menerima notifikasi dari Vercel yang IP-nya dinamis.

---

## 3. Setup Xendit
1. Login ke [Dashboard Xendit](https://dashboard.xendit.co).
2. Masuk ke **Settings** > **Callbacks**.
3. Cari bagian **Invoices** (karena kita menggunakan Invoice Payment).
4. Masukkan URL Webhook Anda pada kolom **Invoice Created** dan **Invoice Paid**:
   - `https://[DOMAIN-ANDA]/api/webhooks/notification`
5. Klik **Save and Test**.

---

## 4. Test Pembayaran
1. Buka aplikasi Anda yang sudah dideploy.
2. Lakukan transaksi "Test" menggunakan metode Midtrans/Xendit (Mode Sandbox).
3. Bayar (Simulasi).
4. Cek di **Admin Dashboard** > **Halaman Transaksi**, status seharusnya otomatis berubah menjadi `success`.
