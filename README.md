# Khanza.NET - Powerful Software & Game Download Portal with CMS

Website portal unduhan software, tools, dan game PC modern **Khanza.NET** lengkap dengan database **SQLite** mandiri, fitur pencarian instan (Live Search), sistem download multi-mirror, serta **CMS (Content Management System)** admin panel untuk memudahkan update konten.

---

## 🌟 Fitur Utama

### 1. Front-End (Portal Pengunjung)
- **Desain Modern Dark-Tech**: Antarmuka khas portal repack software dengan tata letak rapi, cepat, dan responsif (Mobile, Tablet, Desktop).
- **Hero Rekomendasi (Featured Repacks)**: Banner sorotan untuk software unggulan dan rilis terbaru.
- **Pencarian Instan (Live Search)**:
  - Dropdown saran pencarian otomatis saat mengetik.
  - Shortcut keyboard tekan tombol `/` untuk langsung fokus ke kolom cari.
- **Navigasi Kategori Lengkap**: Operating System, Graphic Design, Multimedia, Office, Antivirus, Utilities, PC Games, Internet, dll.
- **Filter Cepat Berdasarkan Tag & Platform**:
  - Filter chip instan: `Semua`, `Pre-Activated`, `Portable`, `Full-DLC`, `Repack`, `Windows`, `macOS`, dan `64-bit`.
- **Halaman Detail Software yang Informatif**:
  - Badge **100% Tested & Verified Clean** (lolos uji malware & antivirus).
  - Badge **🔥 UPDATE BARU** otomatis untuk rilis dalam 7 hari terakhir.
  - Verifikasi **SHA-256 Checksum Hash** dengan tombol 1-klik salin hash.
  - Riwayat Versi & **Catatan Pembaruan (Changelog)**.
  - Sistem penilaian interaktif **Rating Bintang 5 (Star Rating)** real-time tanpa reload halaman.
  - Tombol **Simpan ke Favorit (Bookmark)** pada setiap kartu dan halaman detail software (tersimpan di browser pengunjung).
  - Tombol **Lapor Link Rusak** dengan modal pop-up interaktif untuk melaporkan link mati atau file bermasalah.
  - Tabel spesifikasi lengkap (Versi, Ukuran file, OS Support, Arsitektur x64/x86, Pengembang, dll).
  - Galeri Screenshot dengan Lightbox Popup (klik untuk perbesar gambar).
  - Ulasan & Fitur Utama.
  - Persyaratan Sistem PC (System Requirements).
  - **Download Center Box**:
    * Tombol **"📋 Salin Semua Link (IDM Batch)"** untuk menyalin seluruh link mirror/part sekaligus ke Internet Download Manager atau JDownloader.
    * Kotak Password WinRAR dengan tombol **1-Klik Salin Password** (`Khanza.NET`).
    * Multi-mirror server download: Google Drive, Mega, Mediafire, Direct, Torrent, dll.
    * Tombol unduh otomatis mengarahkan ke halaman **Safe Download Gate**.
  - **Tab Bantuan & Solusi Error Umum Saat Instalasi (Troubleshooting)**:
    * Solusi error `ISDone.dll` / `Unarc.dll error code -11`.
    * Solusi error `VCRUNTIME140.dll` / `MSVCP140.dll is missing`.
    * Panduan Whitelist / Exception di Windows Defender untuk menghindari False-Positive.
    * Tautan download cepat untuk paket wajib: **Visual C++ 2015-2022 AIO**, **DirectX End-User Web Setup**, **.NET Desktop Runtime 8.0**, dan **WinRAR Final x64**.
- **Koleksi Favorit Pengunjung (`/bookmarks`)**:
  - Halaman khusus untuk melihat daftar software favorit yang telah disimpan oleh pengunjung tanpa perlu registrasi/login akun.
  - Dilengkapi indikator badge jumlah favorit di navbar dan tombol hapus cepat.
- **Dark / Light Mode Switcher**:
  - Tombol saklar tema di navbar (Sun ☀️ / Moon 🌙) dengan penyimpanan preferensi di `localStorage`.
- **Safe Download Gate & Countdown Timer**:
  - Halaman transit pengunduhan aman dengan hitung mundur 5 detik.
  - Ringkasan file, peringatan keamanan, salin password WinRAR & SHA-256 checksum.
  - Otomatis redirect ke server mirror saat countdown selesai atau via tombol direct download.
  - Tombol Lapor Link Rusak langsung di halaman gate jika server tujuan bermasalah.
- **Formulir Request Software**: Pengunjung dapat mengajukan software/game yang belum ada di situs beserta tracking status prosesnya.
- **Halaman Panduan Cara Download & DMCA**: Dokumen siap pakai yang bisa diedit langsung dari CMS.
- **Automated SEO & RSS Feed**:
  - Dynamic XML Sitemap di `/sitemap.xml` yang auto-update.
  - Dynamic RSS 2.0 Feed di `/rss.xml` dan `/feed.xml` untuk integrasi otomatis bot Telegram Channel & Discord.
  - Dynamic `/robots.txt` dengan indexing rule siap pakai.
  - OpenGraph & Twitter Cards rich preview saat postingan dibagikan ke WhatsApp, Telegram, Facebook, dan X.

---

### 2. Back-End & CMS (Admin Panel)
- **Akses Dashboard**: `/admin` (dilindungi sistem otentikasi sesi & hash password bcrypt).
- **Statistik Ringkasan**:
  - Total software terpublikasi.
  - Total unduhan link & views pembaca.
  - Jumlah request software pending dari pengunjung.
  - Alert banner jika ada laporan link rusak yang perlu diperbaiki.
- **Manajemen Software & Repack (CRUD Lengkap)**:
  - Tambah software baru dengan editor deskripsi, spesifikasi, dan panduan instalasi.
  - Input hash **SHA-256 Checksum** & toggle badge **100% Tested & Clean**.
  - **Dynamic Mirror Links Repeater**: Tambah dan atur link unduhan mirror sebanyak yang diinginkan secara dinamis (Google Drive, Mega, Mediafire, dll.).
  - **Upload Gambar Fleksibel**: Bisa mengunggah file thumbnail langsung dari komputer atau menempelkan URL gambar eksternal.
  - Dukungan multiple URL screenshot.
  - Pengaturan status (Published / Draft) dan badge rekomendasi (Featured).
- **Manajemen Laporan Link Rusak (`/admin/broken-links`)**:
  - Daftar komprehensif link yang dilaporkan pengunjung (software, server mirror, nama pelapor, alasan error).
  - Tombol filter dan pengubah status (`Menunggu Perbaikan`, `Sudah Diperbaiki`, `Abaikan/Normal`).
  - Shortcut langsung untuk mengedit postingan terkait.
- **Kelola Slot Iklan & Sponsor (`/admin/ads`)**:
  - Pasang script banner / AdSense di 4 slot strategis:
    * `ad_header`: Atas beranda & halaman (728x90 px / responsif).
    * `ad_download_gate`: Halaman hitung mundur download (High Impression).
    * `ad_article_bottom`: Sebelum kotak Download Center (High CTR).
    * `ad_sidebar`: Widget sidebar samping (300x250 px).
- **Backup Database 1-Klik (`/admin/backup/database`)**:
  - Unduh file `database.sqlite` secara instan ke komputer admin kapan saja sebagai arsip cadangan.
- **Manajemen Kategori**: Tambah, ubah, atau hapus kategori, slug URL, ikon FontAwesome, dan warna badge.
- **Moderasi Permintaan Software**: Lihat request pengunjung dan ubah status (`Sedang Diproses`, `Sudah Diupload`, `Ditolak`).
- **Moderasi Komentar**: Setujui atau hapus komentar dari pengunjung.
- **Manajemen Halaman Statis**: Ubah isi teks DMCA Disclaimer dan Panduan Cara Download.
- **Pengaturan Situs & Akun**:
  - Ubah Nama Website, Slogan, Deskripsi SEO.
  - Atur Default Password WinRAR (otomatis terpasang ke postingan baru).
  - Teks Pengumuman Header (Ticker bar).
  - Tautan Komunitas (Telegram Channel, Discord, YouTube).
  - Ubah Username & Password akun Admin.

---

## 🛠️ Stack Teknologi

- **Backend**: Node.js & Express
- **Database**: SQLite 3 (menggunakan `better-sqlite3` yang super cepat dan synchronous)
- **View Engine**: EJS (Server-Side Rendering untuk performa maksimal dan SEO prima)
- **Styling**: Tailwind CSS & Custom Modern Dark Palette
- **Ikon**: FontAwesome 6 Pro-style
- **Uploads**: Multer Storage

---

## 🚀 Cara Menjalankan

### 1. Prasyarat
Pastikan komputer Anda sudah terpasang **Node.js** (versi 18 ke atas disarankan).

### 2. Jalankan Server
Buka terminal PowerShell di folder proyek ini:

```powershell
npm start
```
*(Atau untuk mode auto-reload pengembangan: `npm run dev`)*

Server akan langsung aktif di:
- **Website Utama**: [http://localhost:3000](http://localhost:3000)
- **CMS Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🚀 Panduan Instalasi & Deployment di Proxmox LXC (Ubuntu / Debian)

Panduan ini menjamin bahwa **database SQLite dan file uploads di Proxmox TIDAK AKAN PERNAH tertimpa atau hilang** saat Anda melakukan pembaruan kode (`git pull`) dari lokal.

---

### 1. Kenapa Database di Proxmox Aman dari Pembaruan Lokal?
* File database `data/*.sqlite*` dan berkas upload `public/uploads/*` telah dimasukkan ke dalam `.gitignore`.
* Git **hanya melacak kode sumber** (views, routes, css, js).
* Ketika Anda menjalankan `git pull` di server Proxmox:
  1. Git **hanya memperbarui file kode**.
  2. File `data/database.sqlite` (berisi postingan baru, jumlah views/downloads, rating, komentar, & laporan link rusak yang ada di Proxmox) **tetap aman 100% dan tidak tersentuh**.
  3. Skema database dilengkapi fungsi **auto-migration** (`upgradeSchema()` di `src/db.js`), sehingga jika ada kolom baru di update kode, tabel akan otomatis disesuaikan tanpa menghapus data yang sudah ada.

---

### 2. Langkah Instalasi Awal di LXC Proxmox

#### A. Siapkan Container LXC
Gunakan template **Ubuntu 22.04 / 24.04** atau **Debian 12**.

Masuk ke console LXC, lalu jalankan update sistem & instalasi Node.js (v20 atau v22):

```bash
# Update package list
apt update && apt upgrade -y

# Install tools dasar & build tools untuk better-sqlite3
apt install -y curl git build-essential python3

# Install Node.js LTS (v22.x)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Verifikasi instalasi
node -v
npm -v
```

#### B. Clone Repository
```bash
# Pindah ke direktori web (contoh: /var/www)
mkdir -p /var/www
cd /var/www

# Clone repository
git clone https://github.com/kajurtkjsmkbp-hub/khanzanet-software.git khanzanet
cd khanzanet

# Install dependencies (better-sqlite3 akan di-compile otomatis)
npm install --production
```

#### C. Konfigurasi Environment & Persiapan Awal
```bash
# Buat file konfigurasi .env dari template
cp .env.example .env

# (Opsional) Edit port atau session secret jika diperlukan:
# nano .env
```

> 💡 **Pilihan Database Awal:**
> 1. **Mulai dari Database Baru (Bawaan Seeder):** Anda tidak perlu melakukan apa-apa. Saat server pertama kali berjalan, sistem akan otomatis membuat `data/database.sqlite` dan mengisi postingan default & akun admin (`admin` / `admin123`).
> 2. **(Atau) Menggunakan Database yang Sudah Ada dari Komputer Lokal:**
>    Kirim file database dari PC Windows Anda ke server LXC via SCP/WinSCP:
>    ```powershell
>    # Jalankan dari terminal PC lokal Anda:
>    scp "C:\Users\Komputer Vintage\Music\WEBSITE-SOFTWARE-sudah-diupload-proxmox\data\database.sqlite" root@<IP_PROXMOX_LXC>:/var/www/khanzanet/data/
>    ```

#### D. Jalankan dengan Process Manager (PM2) agar Auto-Start saat Reboot
```bash
# Install PM2 secara global
npm install -g pm2

# Jalankan server dengan PM2
pm2 start server.js --name "khanzanet"

# Simpan proses agar otomatis aktif setelah reboot container
pm2 save
pm2 startup
# (Jalankan perintah yang disarankan oleh pm2 startup jika diminta)
```

Cek status aplikasi:
```bash
pm2 status
pm2 logs khanzanet
```

Akses portal Anda di browser:
* Web Portal: `http://<IP_LXC_PROXMOX>:3000`
* Admin Panel: `http://<IP_LXC_PROXMOX>:3000/admin`

---

### 3. Cara Melakukan Update Kode dari Lokal ke Proxmox (Tanpa Menimpa Database)

#### Langkah di Komputer Lokal (Setelah selesai edit kode):
```powershell
git add .
git commit -m "Update fitur atau perbaikan tampilan"
git push origin master
```

#### Langkah di Server Proxmox LXC:
```bash
cd /var/www/khanzanet

# Ambil update kode terbaru dari GitHub
git pull origin master

# Install dependencies jika ada paket baru yang ditambahkan
npm install --production

# Restart aplikasi melalui PM2 (Database otomatis aman & auto-upgrade schema berjalan)
pm2 restart khanzanet
```

> ✅ **Selesai!** Database SQLite dan file uploads yang ada di Proxmox tetap utuh dan aman, sementara seluruh kode tampilan dan fitur telah terbarui ke versi terkini.

---

## 🔑 Akun Default Admin

| Field | Nilai Bawaan |
|---|---|
| **URL Login** | `http://localhost:3000/admin/login` |
| **Username** | `admin` |
| **Password** | `admin123` |

> 💡 *Catatan Keamanan:* Segera ganti username & password Anda melalui menu **Pengaturan & Akun** di dalam CMS setelah pertama kali login.

---

## 📂 Struktur File

```
WEBSITE-SOFTWARE/
├── data/
│   ├── .gitkeep             # Menjaga folder data tetap ada di git
│   └── database.sqlite      # File database SQLite (DI-IGNORE GIT - AMAN DI SERVER)
├── public/
│   ├── css/
│   │   └── style.css        # Custom CSS, efek hover kartu, scrollbar
│   ├── js/
│   │   └── main.js          # Live search suggestion, salin password, modal
│   └── uploads/             # Gambar upload CMS (DI-IGNORE GIT)
├── src/
│   ├── db.js                # Koneksi SQLite, skema tabel, auto-migration, dan seeder
│   ├── middleware/
│   │   └── auth.js          # Proteksi login admin & filter upload multer
│   ├── routes/
│   │   ├── web.js           # Rute frontend pengunjung
│   │   └── admin.js         # Rute manajemen CMS Admin
│   └── utils/
│       └── helpers.js       # Format tanggal, angka K/M, slug generator
├── views/
│   ├── partials/            # Header, Navbar, Sidebar, Footer
│   ├── admin/               # Halaman CMS (Dashboard, Posts, Kategori, Request, dll.)
│   ├── home.ejs             # Halaman beranda
│   ├── post-detail.ejs      # Halaman detail software & download center
│   ├── category.ejs         # Halaman arsip per kategori
│   ├── search.ejs           # Halaman hasil pencarian
│   ├── request.ejs          # Halaman ajukan request software
│   └── page.ejs             # Halaman statis dinamis
├── .gitignore               # Proteksi database & upload agar tidak tertimpa
├── server.js                # Entry point Express server
├── package.json
└── README.md
```

