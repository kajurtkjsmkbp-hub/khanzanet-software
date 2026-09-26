# 🧠 DOKUMEN INGATAN PERMANEN (MEMORY BANK)
## PROYEK: KHANZA.NET - SOFTWARE & GAME DOWNLOAD PORTAL WITH CMS

> **CATATAN PENTING UNTUK AI ASSISTANT:**
> Jika sesi terputus, restart, atau Anda logout lalu login kembali, **BACA FILE INI TERLEBIH DAHULU**.
> File ini berisi seluruh konteks, aturan branding, kredensial, arsitektur teknis, skema database SQLite, dan seluruh riwayat fitur yang telah dibangun di proyek ini.

---

## 1. 📌 Identitas & Aturan Branding Proyek
* **Nama Portal:** **Khanza.NET** (TIDAK BOLEH menggunakan nama 'ad4msan', semua referensi telah diganti 100% ke Khanza.NET).
* **Nama Lengkap / Title:** `Khanza.NET SOFTWARE & GAME REPACK`
* **Slogan / Tagline:** *"Download Software, Game Repack & Tools Terlengkap & Gratis"*
* **Standard Password WinRAR:** `Khanza.NET` (otomatis terpasang ke postingan dan tombol 1-klik copy).
* **Akun Admin Default CMS:**
  * **URL Login:** `http://localhost:3000/admin/login`
  * **Username:** `admin`
  * **Password:** `admin123`
  * **Enkripsi:** `bcryptjs` (salt 10 rounds).

---

## 2. 🛠️ Arsitektur & Spesifikasi Teknis
* **Runtime:** Node.js (v24.x)
* **Framework:** Express.js (v4.19+)
* **Session & Auth:** `express-session` + `bcryptjs`
* **View Engine:** EJS (Server-Side Rendering)
* **CSS & UI Framework:** Tailwind CSS CDN (dengan Dark Mode switchable class) + Custom Modern Dark Palette
* **Database:** SQLite 3 via `better-sqlite3` (v13.0.3)
  * **Lokasi File Database:** `data/database.sqlite` (Synchronous, ultra cepat, zero configuration).
* **File Uploads:** `multer` (tersimpan di `public/uploads/`).
* **Icons:** FontAwesome 6 Free.
* **Server Entry Point:** `server.js` (Listening on port 3000 atau `process.env.PORT`).

---

## 3. 📂 Struktur Direktori Proyek
```text
C:\Users\Komputer Vintage\Music\WEBSITE-SOFTWARE
│
├── data/
│   └── database.sqlite             # File database SQLite utama
│
├── public/
│   ├── css/
│   │   └── style.css               # Styling custom, scrollbar, efek hover kartu
│   ├── js/
│   │   └── main.js                 # Logika theme toggle, bookmark, copy all links, live search, lightbox
│   └── uploads/                    # File thumbnail yang diunggah dari CMS
│
├── src/
│   ├── db.js                       # Inisialisasi tabel, migration otomatis (upgradeSchema), & seeder data
│   ├── middleware/
│   │   └── auth.js                 # Middleware proteksi requireAuth & Multer uploader
│   ├── routes/
│   │   ├── admin.js                # Rute panel admin (/admin/*)
│   │   └── web.js                  # Rute publik portal web (/, /software, /download, /rss, dll.)
│   └── utils/
│       └── helpers.js              # Fungsi bantu: makeSlug, formatDate, formatNumber, setSetting, dll.
│
├── views/
│   ├── admin/                      # Template admin CMS
│   │   ├── ads/index.ejs           # Manajemen 4 slot iklan/sponsor
│   │   ├── broken-links/index.ejs  # Manajemen laporan link rusak pengunjung
│   │   ├── categories/             # CRUD kategori
│   │   ├── comments/index.ejs      # Moderasi komentar
│   │   ├── pages/                  # Editor halaman statis
│   │   ├── posts/                  # CRUD software & repeater mirror links
│   │   ├── requests/index.ejs      # Moderasi request software
│   │   ├── settings/index.ejs      # Pengaturan website & profil admin
│   │   ├── dashboard.ejs           # Ringkasan statistik & banner alert link rusak
│   │   ├── layout-header.ejs       # Sidebar & navbar admin
│   │   ├── layout-footer.ejs
│   │   └── login.ejs               # Form login admin
│   │
│   ├── partials/                   # Komponen template publik
│   │   ├── header.ejs              # Tag meta SEO, OG cards, theme detection script
│   │   ├── navbar.ejs              # Brand logo, live search, banner ad_header, tombol favorit & theme switch
│   │   ├── sidebar.ejs             # Widget telegram, software terpopuler, kategori, ad_sidebar
│   │   └── footer.ejs              # Link cepat, copy password RAR, lightbox modal
│   │
│   ├── bookmarks.ejs               # Halaman koleksi software favorit pengunjung
│   ├── category.ejs                # Halaman arsip per kategori
│   ├── download-gate.ejs           # Halaman aman hitung mundur 5 detik & verifikasi file
│   ├── home.ejs                    # Beranda (Hero slider, tag filter chips, grid software, pagination)
│   ├── page.ejs                    # Render halaman statis (DMCA, Cara Download, dll.)
│   ├── post-detail.ejs             # Halaman detail software, spesifikasi, troubleshooting, link unduh
│   ├── request.ejs                 # Form pengajuan request software dari pengunjung
│   └── search.ejs                  # Halaman hasil pencarian kata kunci
│
├── package.json                    # Dependencies & skrip npm
├── README.md                       # Dokumentasi publik proyek
├── INGATAN.md                      # (FILE INI) Dokumen memori permanen asisten AI
└── server.js                       # Express app bootstrap
```

---

## 4. 🗄️ Skema Database SQLite (`data/database.sqlite`)

### Tabel `users`:
* `id` (INTEGER, PK, AUTOINCREMENT)
* `username` (TEXT, UNIQUE)
* `password_hash` (TEXT)
* `role` (TEXT, default 'admin')
* `created_at` (DATETIME)

### Tabel `categories`:
* `id` (INTEGER, PK, AUTOINCREMENT)
* `name` (TEXT)
* `slug` (TEXT, UNIQUE)
* `description` (TEXT)
* `icon` (TEXT, contoh: 'fa-solid fa-palette')
* `color` (TEXT, contoh: '#3b82f6')
* `sort_order` (INTEGER)
* `created_at` (DATETIME)

### Tabel `posts`:
* `id` (INTEGER, PK, AUTOINCREMENT)
* `title` (TEXT)
* `slug` (TEXT, UNIQUE)
* `version` (TEXT)
* `category_id` (INTEGER, FK categories.id)
* `developer` (TEXT)
* `os_support` (TEXT)
* `architecture` (TEXT, e.g. '64-bit (x64)')
* `file_size` (TEXT)
* `thumbnail` (TEXT)
* `screenshots` (TEXT, JSON array URL)
* `excerpt` (TEXT)
* `description` (TEXT, HTML support)
* `features` (TEXT, HTML support)
* `system_req` (TEXT, HTML support)
* `install_guide` (TEXT, HTML support)
* `rar_password` (TEXT, default 'Khanza.NET')
* `checksum_sha256` (TEXT)
* `is_tested` (INTEGER, 1 atau 0)
* `rating_score` (REAL, default 5.0)
* `rating_votes` (INTEGER, default 1)
* `tags` (TEXT, e.g. 'Pre-Activated, Repack')
* `changelog` (TEXT)
* `is_featured` (INTEGER, 1 atau 0)
* `views_count` (INTEGER, default 0)
* `downloads_count` (INTEGER, default 0)
* `status` (TEXT, 'published' / 'draft')
* `created_at` (DATETIME)
* `updated_at` (DATETIME)

### Tabel `download_links`:
* `id` (INTEGER, PK, AUTOINCREMENT)
* `post_id` (INTEGER, FK posts.id)
* `server_name` (TEXT, e.g. 'Google Drive', 'Mega', 'Mediafire')
* `download_url` (TEXT)
* `link_type` (TEXT, 'full' / 'part' / 'patch')
* `note` (TEXT)
* `sort_order` (INTEGER)
* `created_at` (DATETIME)

### Tabel `broken_link_reports`:
* `id` (INTEGER, PK, AUTOINCREMENT)
* `post_id` (INTEGER, FK posts.id)
* `link_id` (INTEGER, FK download_links.id)
* `reporter_name` (TEXT)
* `reason` (TEXT)
* `status` (TEXT, 'pending' / 'resolved' / 'rejected')
* `created_at` (DATETIME)

### Tabel `comments`:
* `id` (INTEGER, PK, AUTOINCREMENT)
* `post_id` (INTEGER, FK posts.id)
* `author_name` (TEXT)
* `author_email` (TEXT)
* `comment_text` (TEXT)
* `status` (TEXT, default 'approved')
* `created_at` (DATETIME)

### Tabel `software_requests`:
* `id` (INTEGER, PK, AUTOINCREMENT)
* `name` (TEXT)
* `email` (TEXT)
* `software_name` (TEXT)
* `version_needed` (TEXT)
* `notes` (TEXT)
* `status` (TEXT, 'pending' / 'completed' / 'rejected')
* `created_at` (DATETIME)

### Tabel `pages`:
* `id` (INTEGER, PK, AUTOINCREMENT)
* `title` (TEXT)
* `slug` (TEXT, UNIQUE, e.g. 'dmca-disclaimer', 'how-to-download')
* `content` (TEXT)
* `updated_at` (DATETIME)

### Tabel `settings`:
* `key` (TEXT, PK)
* `value` (TEXT)
* *Keys yang digunakan:* `site_name`, `site_tagline`, `site_description`, `default_rar_password`, `telegram_url`, `discord_url`, `youtube_url`, `footer_text`, `announcement`, `contact_email`, `ad_header`, `ad_sidebar`, `ad_download_gate`, `ad_article_bottom`.

---

## 5. 🚀 Seluruh Fitur yang Telah Selesai Diterapkan

### A. Fitur Publik (Pengunjung Portal)
1. **Live Search Instan & Shortcut Keyboard:** Dropdown hasil saat mengetik + tekan `/` untuk fokus otomatis.
2. **Hero Rekomendasi (Featured Slider/Grid):** Menampilkan rilis unggulan di beranda.
3. **Filter Cepat (Tag & Platform):** Tombol filter instan di beranda: `Semua`, `Pre-Activated`, `Portable`, `Full-DLC`, `Repack`, `Windows`, `macOS`, dan `64-bit`.
4. **Detail Software Komprehensif:** Spesifikasi lengkap, galeri screenshot (lightbox popup), deskripsi, fitur, persyaratan sistem, dan tutorial instalasi.
5. **Badge Dinamis:**
   * Badge **"✅ 100% Tested & Verified Clean"** (lulus uji antivirus).
   * Badge **"🔥 UPDATE BARU"** otomatis jika diperbarui dalam 7 hari terakhir.
6. **Verifikasi Integritas File (SHA-256):** Tampilan hash SHA-256 dengan tombol 1-klik salin hash.
7. **Riwayat Versi (Changelog):** Kotak riwayat pembaruan pada software yang memiliki catatan versi.
8. **Rating Bintang 5 Interaktif (Star Rating):** Pengunjung dapat memberi nilai 1–5 bintang langsung via AJAX (`/api/rate/:postId`) tanpa reload halaman.
9. **Koleksi Favorit / Bookmark:** Tombol simpan hati (<i class="fa-regular fa-heart"></i>) di kartu dan detail software yang tersimpan di `localStorage` browser tanpa login, dengan halaman khusus di `/bookmarks` dan badge counter di navbar.
10. **Multi-Part Download Helper:** Tombol **"📋 Salin Semua Link (IDM Batch)"** di Download Center untuk menyalin semua link mirror/part ke clipboard agar bisa langsung di-paste ke IDM / JDownloader.
11. **Tab Bantuan & Solusi Error Umum (Troubleshooting):**
    * Akordion solusi error `ISDone.dll` / `Unarc.dll error code -11`.
    * Akordion solusi error `VCRUNTIME140.dll` / `MSVCP140.dll missing`.
    * Panduan Whitelist / Exception di Windows Defender untuk menghindari False-Positive.
    * Tombol unduh resmi paket wajib: *Visual C++ 2015–2022 AIO*, *DirectX Runtime*, *.NET Desktop 8.0*, dan *WinRAR Final x64*.
12. **Safe Download Gate & Countdown Timer 5 Detik:** Halaman perantara aman di `/download/:id` sebelum redirect ke server download direct `/download/direct/:id`.
13. **Pelaporan Link Rusak (Broken Link Reporter):** Tombol modal di setiap software dan halaman gate untuk melaporkan link mati atau file corrupt.
14. **Dark / Light Mode Switcher:** Tombol saklar tema di navbar (Sun ☀️ / Moon 🌙) dengan status tersimpan di `localStorage`.
15. **Otomasi SEO & Integrasi Komunitas:**
    * Dynamic XML Sitemap di `/sitemap.xml`.
    * Dynamic RSS 2.0 Feed di `/rss.xml` dan `/feed.xml` untuk integrasi bot Telegram / Discord.
    * Dynamic Robots.txt di `/robots.txt`.
    * Rich OpenGraph & Twitter Cards preview saat link dibagikan ke WhatsApp, Telegram, dan Facebook.

### B. Fitur Panel Admin CMS (`/admin`)
1. **Otentikasi Aman:** Sesi login dengan bcrypt hash (`/admin/login` & `/admin/logout`).
2. **Dashboard Interaktif:** Statistik total software, download, views, kategori, request pending, dan banner alert jika ada link rusak yang belum diperbaiki.
3. **Manajemen Software (CRUD):** Tambah & edit software lengkap dengan repeater multi-mirror, upload file thumbnail, input tags, input changelog, SHA-256 checksum, dan toggle status teruji.
4. **Manajemen Kategori:** Tambah, ubah, hapus kategori dengan slug, ikon FontAwesome, dan warna badge.
5. **Manajemen Laporan Link Rusak (`/admin/broken-links`):** Lihat laporan dari pengunjung, ubah status (`pending`, `resolved`, `rejected`), dan tombol shortcut edit software terkait.
6. **Manajemen Iklan & Sponsor (`/admin/ads`):** Pasang script iklan/AdSense/banner di 4 slot:
   * `ad_header` (di bawah navbar beranda dan halaman).
   * `ad_download_gate` (di halaman hitung mundur download).
   * `ad_article_bottom` (tepat di atas kotak Download Center).
   * `ad_sidebar` (di sidebar kanan).
7. **One-Click SQLite Database Backup (`/admin/backup/database`):** 1-klik unduh backup file database `.sqlite` ke komputer admin.
8. **Moderasi Request Software & Komentar:** Kelola permintaan software baru dan komentar pengunjung.
9. **Manajemen Halaman Statis:** Editor konten halaman DMCA dan Panduan Cara Download.
10. **Pengaturan Website & Profil:** Atur identitas web, announcement bar, password RAR default, dan ganti password akun admin.

---

## 6. 🌐 Ringkasan Endpoint & Rute Lengkap

### Rute Publik (`src/routes/web.js`):
| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/` | Beranda portal, pagination, filter `?tag=...&os=...&arch=...` |
| `GET` | `/software/:slug` | Halaman detail software, spesifikasi, changelog, troubleshooting |
| `GET` | `/category/:slug` | Halaman arsip software berdasarkan kategori |
| `GET` | `/search` | Halaman hasil pencarian query `?q=...` |
| `GET` | `/api/search-suggest` | Endpoint JSON untuk live search dropdown |
| `POST` | `/api/rate/:postId` | Endpoint AJAX submit rating bintang 5 |
| `GET` | `/bookmarks` | Halaman koleksi software favorit pengunjung |
| `GET` | `/download/:linkId` | Halaman Safe Download Gate dengan hitung mundur 5 detik |
| `GET` | `/download/direct/:linkId` | Redirect langsung ke URL download mirror asli & catat hit counter |
| `POST` | `/report-broken-link` | Form submit laporan link rusak |
| `POST` | `/comments/new` | Form kirim komentar pengunjung |
| `GET` | `/request` | Halaman form request software |
| `POST` | `/request` | Submit form request software |
| `GET` | `/how-to-download` | Halaman panduan cara download |
| `GET` | `/p/:slug` | Halaman statis dinamis (misal DMCA) |
| `GET` | `/sitemap.xml` | Dynamic XML Sitemap generator untuk Googlebot |
| `GET` | `/robots.txt` | Dynamic Robots.txt |
| `GET` | `/rss.xml` | Dynamic RSS 2.0 Feed |
| `GET` | `/feed.xml` | Alias RSS 2.0 Feed |

### Rute Admin CMS (`src/routes/admin.js`):
| Metode | Path | Keterangan |
|---|---|---|
| `GET` | `/admin/login` | Form login admin |
| `POST` | `/admin/login` | Proses login admin |
| `GET` | `/admin/logout` | Proses logout sesi |
| `GET` | `/admin` | Dashboard admin |
| `GET` | `/admin/posts` | Daftar seluruh software terdaftar |
| `GET` | `/admin/posts/new` | Form tambah software baru |
| `POST` | `/admin/posts/new` | Simpan software baru (upload thumbnail, tags, changelog, SHA-256) |
| `GET` | `/admin/posts/:id/edit` | Form edit software |
| `POST` | `/admin/posts/:id/edit` | Simpan perubahan software |
| `POST` | `/admin/posts/:id/delete` | Hapus software |
| `GET` | `/admin/categories` | Daftar & form tambah kategori |
| `POST` | `/admin/categories/new` | Simpan kategori baru |
| `POST` | `/admin/categories/:id/edit` | Simpan edit kategori |
| `POST` | `/admin/categories/:id/delete` | Hapus kategori |
| `GET` | `/admin/broken-links` | Dashboard laporan link rusak |
| `POST` | `/admin/broken-links/:id/status` | Ubah status laporan (pending/resolved/rejected) |
| `POST` | `/admin/broken-links/:id/delete` | Hapus laporan link rusak |
| `GET` | `/admin/ads` | Halaman manajemen slot iklan & sponsor |
| `POST` | `/admin/ads` | Simpan script 4 slot iklan |
| `GET` | `/admin/backup/database` | 1-klik unduh backup file database SQLite |
| `GET` | `/admin/requests` | Daftar request software pengunjung |
| `POST` | `/admin/requests/:id/status` | Ubah status request |
| `POST` | `/admin/requests/:id/delete` | Hapus request |
| `GET` | `/admin/comments` | Moderasi komentar |
| `POST` | `/admin/comments/:id/approve` | Setujui komentar |
| `POST` | `/admin/comments/:id/delete` | Hapus komentar |
| `GET` | `/admin/pages` | Daftar halaman statis |
| `GET` | `/admin/pages/:id/edit` | Form edit halaman statis |
| `POST` | `/admin/pages/:id/edit` | Simpan perubahan halaman statis |
| `GET` | `/admin/settings` | Pengaturan umum & profil akun |
| `POST` | `/admin/settings` | Simpan pengaturan website |
| `POST` | `/admin/profile/update` | Ganti username & password admin |

---

## 7. 💻 Panduan Menjalankan & Perintah Penting

### Menjalankan Server:
Buka terminal PowerShell pada folder `C:\Users\Komputer Vintage\Music\WEBSITE-SOFTWARE`:
```powershell
npm start
```
*(Untuk auto-restart pengembangan: `npm run dev`)*

### Tips Lingkungan Windows & PowerShell:
* Saat menjalankan eksekusi script Node.js dari PowerShell (`node -e "..."`), hindari string berlipat dengan double-quotes bersarang di dalam perintah satu baris, gunakan helper file atau single quotes dengan escape yang tepat.
* File database SQLite berada di `data/database.sqlite`. Jika ingin mereset database, cukup hapus file tersebut dan jalankan `npm start`; `src/db.js` akan otomatis membuat ulang database bersih beserta seeder bawaan Khanza.NET.

---

## 8. 🌐 Repository GitHub & Aturan Deployment Proxmox LXC
* **GitHub Repository:** `https://github.com/kajurtkjsmkbp-hub/khanzanet-software`
* **Branch Utama:** `master`
* **Jaminan Keamanan Database (Tidak Tertimpa Saat Update Lokal):**
  * `data/*.sqlite*` dan `public/uploads/*` strictly di-ignore di `.gitignore`.
  * Saat developer update kode di lokal dan push ke GitHub, database server Proxmox **TIDAK AKAN PERNAH TERTEMPA** saat `git pull`.
  * Auto-migration `upgradeSchema()` di `src/db.js` otomatis menambahkan kolom baru jika ada update skema tanpa menghapus data yang ada.
* **Perintah Update di Proxmox LXC:**
  ```bash
  cd /var/www/khanzanet
  git pull origin master
  npm install --production
  pm2 restart khanzanet
  ```

---
*Dokumen ini dibuat otomatis dan dipelihara agar seluruh memori arsitektur Khanza.NET tersimpan abadi dan konsisten.*

