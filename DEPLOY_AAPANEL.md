# Panduan Deploy "Auto Web" di aaPanel Menggunakan GitHub

Dokumen ini menjelaskan langkah demi langkah cara men-deploy projek **Auto Web** ke **aaPanel** dari repository **GitHub**.

---

## Langkah 1: Push Projek ini ke Repository GitHub Anda

1. Buka [GitHub.com](https://github.com/new) dan buat **New Repository**:
   - Nama Repository: `auto-web` (atau nama lain sesuai selera).
   - Visibilitas: **Public** atau **Private** (bebas).
   - Jangan centang "Add a README" (karena projek lokal kita sudah lengkap).

2. Di komputer lokal Anda (folder `auto-web`), jalankan perintah git berikut:
   ```bash
   git init
   git add .
   git commit -m "Initial commit auto web app"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/auto-web.git
   git push -u origin main
   ```
   *(Ganti `USERNAME_ANDA` dengan username akun GitHub Anda).*

---

## Langkah 2: Persiapan di aaPanel

1. Login ke panel **aaPanel** Anda.
2. Masuk ke menu **App Store**:
   - Pastikan **Nginx** sudah terinstall.
   - Cari dan install **Node.js project manager** (atau **PM2 Manager**).
3. Buka **Node.js project manager**:
   - Pilih tab **Node version** dan install versi Node.js LTS terbaru (misalnya **v18**, **v20**, atau **v22**).

---

## Langkah 3: Clone Projek dari GitHub ke Server aaPanel

Ada 2 cara mudah di aaPanel:

### Cara A: Melalui Menu Terminal di aaPanel (Paling Cepat & Direkomendasikan)
1. Klik menu **Terminal** di sidebar kiri aaPanel.
2. Masuk ke direktori web:
   ```bash
   cd /www/wwwroot
   ```
3. Clone repository GitHub Anda:
   ```bash
   git clone https://github.com/USERNAME_ANDA/auto-web.git
   ```
4. Masuk ke foldernya dan install dependensi:
   ```bash
   cd auto-web
   npm install --production
   ```

---

## Langkah 4: Daftarkan Projek di aaPanel Node Project

1. Di sidebar kiri aaPanel, klik menu **Website**.
2. Pilih tab **Node project**.
3. Klik tombol **Add Node project**.
4. Isi form konfigurasinya sebagai berikut:
   - **Path**: Pilih direktori `/www/wwwroot/auto-web`
   - **Name**: `auto-web`
   - **Run Opt**: `npm`
   - **Run script**: `start` (atau pilih file: `server.js`)
   - **Port**: `3003`
   - **Node version**: Pilih versi Node.js yang sudah diinstall (misal v20 atau v22)
   - **Run as**: `www`
   - **Domain binding**: Masukkan nama domain utama Anda (misal `linkku.com` atau `web.domainanda.com`)
   - **Remark**: Auto Web Gateway
5. Klik **Submit**. aaPanel akan otomatis mengatur service background (PM2) dan membuat konfigurasi Nginx Reverse Proxy ke port 3003!

---

## Langkah 5: Pasang Sertifikat SSL (HTTPS) Gratis

Agar link aman dan berawalan `https://`:
1. Masih di tab **Node project**, klik nama domain projek Anda.
2. Pilih menu **SSL** -> **Let's Encrypt**.
3. Centang nama domain Anda dan klik **Apply**.
4. Aktifkan sakelar **Force HTTPS**.
5. Selesai! Sekarang website Anda sudah berjalan dengan SSL aman.

---

## Langkah 6: Mengakses & Menggunakan Panel Admin

1. Buka browser dan akses:
   - **Panel Admin:** `https://domainanda.com/admin`
   - **Akun Bawaan Awal:**
     - Username: `admin`
     - Password: `admin123`
2. **PENTING:** Setelah pertama kali login, langsung ubah Username dan Password Anda di kotak *Keamanan Akun Admin*.
3. Masukkan **Link Tujuan (Target URL)** Anda.
4. Pilih **Mode Pengalihan**:
   - **DuckDuckGo Hop:** URL berganti ke tujuan, referrer DuckDuckGo (rekomendasi untuk melewati filter blokir Google).
   - **URL Masking:** URL di browser tetap nama domain Anda.
   - **DuckDuckGo Bridge:** Ada animasi transisi pencarian DuckDuckGo sejenak sebelum lompat.
5. Klik **Simpan Perubahan**.

---

## 🔄 Cara Update Kode Jika Ada Perubahan di GitHub

Jika di kemudian hari Anda melakukan update kode di GitHub, di server aaPanel Anda cukup menjalankan:
```bash
cd /www/wwwroot/auto-web
git pull origin main
```
Lalu di menu **Node project** aaPanel, klik tombol **Restart** pada projek `auto-web`.

*(Catatan: Pengaturan link dan data statistik Anda tersimpan di folder `data/` yang tidak akan tertimpa saat melakukan `git pull`).*
