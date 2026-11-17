# Auto Web - Smart Redirector & DuckDuckGo Gateway 🦆

**Auto Web** adalah aplikasi gateway pengarah web dinamis dengan integrasi **DuckDuckGo Hop**, dirancang khusus untuk memotong proteksi / filter blokir direct link (seperti Google Safe Browsing / ISP) sekaligus menyediakan panel admin untuk mengatur link tujuan secara instan tanpa perlu menyentuh kodingan.

---

## 🌟 Fitur Utama

1. **4 Mode Pengalihan Fleksibel:**
   - 🦆 **DuckDuckGo Hop (Direct Jump):**
     Pengunjung diarahkan melompat melalui protokol DuckDuckGo. Referrer tercatat resmi dari `duckduckgo.com`, lolos dari deteksi tautan berbahaya Google. Alamat URL browser akan berganti ke link tujuan.
   - 🛡️ **URL Masking (Stealth Mode):**
     Alamat URL di kolom browser pengunjung **tetap domain Anda**, sementara isi website tujuan ditampilkan penuh.
   - ⏳ **DuckDuckGo Bridge (Visual Interstitial):**
     Menampilkan transisi layar pencarian DuckDuckGo dengan animasi loading sejenak sebelum mengoper ke link tujuan.
   - 🎭 **Camouflage (Penyamaran):**
     Website berfungsi sebagai mesin pencari DuckDuckGo normal (mode nonaktif).

2. **Panel Admin Modern & Responsif:**
   - Ubah Target URL kapan saja secara realtime.
   - Sakelar Master Toggle (Aktif / Nonaktif).
   - Pengaturan Jeda Waktu (Delay) 0s - 3s.
   - Kustomisasi Judul & Deskripsi Sosial Media (OpenGraph Preview WhatsApp, Telegram, Facebook).
   - Manajemen Akun (Ubah Username & Password).

3. **Live Traffic Analytics:**
   - Menghitung Total Kunjungan & Total Redirect Berhasil.
   - Tabel riwayat 25 pengunjung terakhir (Waktu, IP Asli, Referrer, User-Agent, Mode).
   - Tombol Reset Statistik.

4. **Siap Deploy untuk aaPanel & VPS:**
   - Ringan, berbasis Node.js Express.
   - Database file JSON dengan proteksi atomic-write (tanpa butuh install MySQL/MongoDB tambahan).
   - Dukungan proxy header (`X-Forwarded-For`).
   - Sudah dilengkapi `ecosystem.config.js` untuk PM2 aaPanel.

---

## 🚀 Panduan Menjalankan Lokal

```bash
# 1. Masuk ke folder projek
cd auto-web

# 2. Install dependensi
npm install

# 3. Jalankan server
npm start
```

- **Link Utama (Pengunjung):** `http://localhost:3000/`
- **Panel Admin:** `http://localhost:3000/admin`
- **Akun Default:**
  - Username: `admin`
  - Password: `admin123`

---

## 📦 Deployment ke aaPanel

Silakan baca panduan lengkap step-by-step di file:
👉 **[DEPLOY_AAPANEL.md](DEPLOY_AAPANEL.md)**
