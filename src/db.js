const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode and foreign keys for performance and data integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'fa-solid fa-folder',
      color TEXT DEFAULT '#3b82f6',
      sort_order INTEGER DEFAULT 0
    );
  `);

  // 3. Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      version TEXT,
      category_id INTEGER,
      developer TEXT,
      os_support TEXT DEFAULT 'Windows 10 / 11 (64-bit)',
      architecture TEXT DEFAULT '64-bit (x64)',
      file_size TEXT,
      thumbnail TEXT,
      screenshots TEXT,
      excerpt TEXT,
      description TEXT,
      features TEXT,
      system_req TEXT,
      install_guide TEXT,
      rar_password TEXT DEFAULT 'Khanza.NET',
      is_featured INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      views_count INTEGER DEFAULT 0,
      downloads_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  // 4. Download links table
  db.exec(`
    CREATE TABLE IF NOT EXISTS download_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      server_name TEXT NOT NULL,
      download_url TEXT NOT NULL,
      link_type TEXT DEFAULT 'full',
      note TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  // 5. Software requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS software_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      software_name TEXT NOT NULL,
      version_needed TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT,
      comment_text TEXT NOT NULL,
      status TEXT DEFAULT 'approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
  `);

  // 7. Broken Link Reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS broken_link_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      link_id INTEGER,
      reporter_name TEXT,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (link_id) REFERENCES download_links(id) ON DELETE SET NULL
    );
  `);

  // 8. Pages table (DMCA, About, How to Download, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Schema upgrades for existing databases
  upgradeSchema();

  // Seed default data if empty
  seedDefaultData();
}

function upgradeSchema() {
  const cols = db.pragma('table_info(posts)').map(c => c.name);
  if (!cols.includes('checksum_sha256')) {
    db.exec("ALTER TABLE posts ADD COLUMN checksum_sha256 TEXT");
  }
  if (!cols.includes('is_tested')) {
    db.exec("ALTER TABLE posts ADD COLUMN is_tested INTEGER DEFAULT 1");
  }
  if (!cols.includes('rating_score')) {
    db.exec("ALTER TABLE posts ADD COLUMN rating_score REAL DEFAULT 5.0");
  }
  if (!cols.includes('rating_votes')) {
    db.exec("ALTER TABLE posts ADD COLUMN rating_votes INTEGER DEFAULT 1");
  }
  if (!cols.includes('tags')) {
    db.exec("ALTER TABLE posts ADD COLUMN tags TEXT DEFAULT 'Pre-Activated'");
  }
  if (!cols.includes('changelog')) {
    db.exec("ALTER TABLE posts ADD COLUMN changelog TEXT");
  }

  // Populate default checksums & rating
  db.prepare("UPDATE posts SET checksum_sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' WHERE id = 1 AND (checksum_sha256 IS NULL OR checksum_sha256 = '')").run();
  db.prepare("UPDATE posts SET checksum_sha256 = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b' WHERE id = 2 AND (checksum_sha256 IS NULL OR checksum_sha256 = '')").run();
  db.prepare("UPDATE posts SET checksum_sha256 = '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7' WHERE id = 3 AND (checksum_sha256 IS NULL OR checksum_sha256 = '')").run();
  db.prepare("UPDATE posts SET is_tested = 1 WHERE is_tested IS NULL").run();
  db.prepare("UPDATE posts SET rating_score = 4.9, rating_votes = 128 WHERE id = 1 AND rating_votes = 1").run();
  db.prepare("UPDATE posts SET rating_score = 5.0, rating_votes = 342 WHERE id = 2 AND rating_votes = 1").run();
  db.prepare("UPDATE posts SET rating_score = 4.8, rating_votes = 215 WHERE id = 3 AND rating_votes = 1").run();
  db.prepare("UPDATE posts SET tags = 'Pre-Activated, Repack' WHERE id = 1 AND (tags IS NULL OR tags = '')").run();
  db.prepare("UPDATE posts SET tags = 'Pre-Activated, Full-DLC' WHERE id = 2 AND (tags IS NULL OR tags = '')").run();
  db.prepare("UPDATE posts SET tags = 'Portable, Pre-Activated' WHERE id = 3 AND (tags IS NULL OR tags = '')").run();
  db.prepare("UPDATE posts SET changelog = '• Pembaruan ke versi build terbaru v25.11\n• Peningkatan fitur Adobe Firefly Generative AI\n• Perbaikan bug stabilitas rendering GPU dan crash pada Windows 11' WHERE id = 1 AND changelog IS NULL").run();
}

function seedDefaultData() {
  // Check if admin exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('admin123', salt);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', passwordHash, 'admin');
    console.log('[DB] Default admin created: username: admin / password: admin123');
  }

  // Seed default settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    const defaultSettings = [
      ['site_name', 'Khanza.NET SOFTWARE'],
      ['site_tagline', 'Download Software, Game Repack & Tools Terlengkap & Gratis'],
      ['site_description', 'Portal download software Windows, Mac, game PC repack full version gratis dan selalu update setiap hari dengan direct mirror tercepat.'],
      ['default_rar_password', 'Khanza.NET'],
      ['telegram_url', 'https://t.me/khanzanet_software'],
      ['discord_url', 'https://discord.gg/khanzanet'],
      ['youtube_url', 'https://youtube.com/@khanzanet'],
      ['footer_text', '© 2026 Khanza.NET. All Rights Reserved. All software and games provided on this website are for educational and testing purposes only.'],
      ['announcement', '🎉 Selamat datang di Khanza.NET Portal! Semua software telah diuji 100% bebas malware dan aman diinstal. Password RAR: <strong>Khanza.NET</strong>'],
      ['contact_email', 'support@khanza.net']
    ];

    const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of defaultSettings) {
      insertSetting.run(key, value);
    }
  }

  // Seed Categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    const categories = [
      { name: 'Operating System', slug: 'operating-system', description: 'Windows 11, Windows 10, Server & Linux ISO', icon: 'fa-brands fa-windows', color: '#0ea5e9', sort_order: 1 },
      { name: 'Graphic & Design', slug: 'graphic-design', description: 'Photoshop, Illustrator, CorelDRAW, CAD & 3D Modeling', icon: 'fa-solid fa-palette', color: '#f43f5e', sort_order: 2 },
      { name: 'Multimedia & Video', slug: 'multimedia-video', description: 'Premiere Pro, After Effects, Audio & Video Editing', icon: 'fa-solid fa-film', color: '#8b5cf6', sort_order: 3 },
      { name: 'Office & Business', slug: 'office-business', description: 'Microsoft Office, PDF Editors, Document & Accounting Tools', icon: 'fa-solid fa-briefcase', color: '#10b981', sort_order: 4 },
      { name: 'Antivirus & Security', slug: 'antivirus-security', description: 'Malwarebytes, ESET, Kaspersky & Internet Security', icon: 'fa-solid fa-shield-halved', color: '#eab308', sort_order: 5 },
      { name: 'Utilities & System', slug: 'utilities-system', description: 'IDM, WinRAR, Rufus, Driver Booster & System Tweakers', icon: 'fa-solid fa-wrench', color: '#06b6d4', sort_order: 6 },
      { name: 'PC Games Repack', slug: 'pc-games', description: 'Action, RPG, Open World & Simulation PC Games Full DLC', icon: 'fa-solid fa-gamepad', color: '#ec4899', sort_order: 7 },
      { name: 'Internet & Network', slug: 'internet-network', description: 'Browsers, VPN, Remote Desktop & Downloader Tools', icon: 'fa-solid fa-globe', color: '#3b82f6', sort_order: 8 }
    ];

    const insertCat = db.prepare('INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    for (const c of categories) {
      insertCat.run(c.name, c.slug, c.description, c.icon, c.color, c.sort_order);
    }
  }

  // Seed sample Posts
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get();
  if (postCount.count === 0) {
    const cats = db.prepare('SELECT id, slug FROM categories').all();
    const catMap = {};
    cats.forEach(c => { catMap[c.slug] = c.id; });

    const samplePosts = [
      {
        title: 'Adobe Photoshop 2024 v25.11.0 Full Version Pre-activated',
        slug: 'adobe-photoshop-2024-full-version',
        version: 'v25.11.0.706',
        category_id: catMap['graphic-design'],
        developer: 'Adobe Inc.',
        os_support: 'Windows 10 / 11 (64-bit Version 20H2 or later)',
        architecture: '64-bit (x64)',
        file_size: '3.42 GB',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        screenshots: JSON.stringify([
          'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1000&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop&q=80'
        ]),
        excerpt: 'Adobe Photoshop 2024 adalah software manipulasi grafis dan editing foto terbaik di dunia dengan fitur Generative Fill AI terbaru.',
        description: `<p><strong>Adobe Photoshop 2024</strong> adalah standar industri perangkat lunak pengeditan grafis raster yang digunakan oleh jutaan desainer grafis, fotografer profesional, dan seniman digital di seluruh dunia. Versi terbaru ini hadir dengan integrasi mendalam fitur <em>Adobe Firefly Generative AI</em> yang memungkinkan Anda menambahkan, menghapus, atau memperluas konten gambar hanya dengan perintah teks.</p>
        <p>Selain itu, terdapat peningkatan performa pemrosesan layer resolusi ultra-tinggi, alat seleksi objek berbasis machine learning yang semakin presisi, dan antarmuka modern yang diperbarui untuk memaksimalkan efisiensi alur kerja kreatif Anda.</p>`,
        features: `<ul>
          <li>Fitur Generative Fill & Generative Expand berbasis Adobe Firefly AI</li>
          <li>Konteks Task Bar baru untuk navigasi menu cepat</li>
          <li>Remove Tool yang disempurnakan untuk membersihkan objek pengganggu seketika</li>
          <li>Dukungan format foto HDR (High Dynamic Range) 32-bit</li>
          <li>Peningkatan performa rendering GPU dengan akselerasi hardware penuh</li>
          <li>Pre-activated: Instal langsung aktif tanpa perlu patch manual</li>
        </ul>`,
        system_req: `<strong>Minimal Spesifikasi:</strong><br>
        • Processor: Intel atau AMD 64-bit (2 GHz atau lebih cepat dengan SSE 4.2)<br>
        • OS: Windows 10 64-bit (versi 20H2+) / Windows 11<br>
        • RAM: 8 GB (Disarankan 16 GB atau lebih)<br>
        • Kartu Grafis: GPU dengan dukungan DirectX 12 dan memori VRAM minimal 2 GB<br>
        • Penyimpanan: 10 GB ruang kosong SSD`,
        install_guide: `<ol>
          <li>Matikan sementara koneksi internet dan Windows Defender / Antivirus agar setup tidak terganggu.</li>
          <li>Ekstrak file ZIP/RAR yang telah didownload menggunakan WinRAR versi terbaru (Password: <strong>Khanza.NET</strong>).</li>
          <li>Buka folder hasil ekstrak, jalankan file <code>Set-up.exe</code> dengan klik kanan <em>Run as Administrator</em>.</li>
          <li>Pilih bahasa dan lokasi instalasi, tunggu proses sampai selesai 100%.</li>
          <li>Software sudah Pre-Activated, siap digunakan tanpa perlu crack lagi!</li>
        </ol>`,
        rar_password: 'Khanza.NET',
        is_featured: 1,
        status: 'published',
        views_count: 14250,
        downloads_count: 5320,
        links: [
          { server: 'Google Drive', url: 'https://drive.google.com', type: 'full', note: 'Kecepatan Maksimal' },
          { server: 'Mediafire', url: 'https://mediafire.com', type: 'full', note: 'Direct Mirror' },
          { server: 'Mega.nz', url: 'https://mega.nz', type: 'full', note: 'Fast Cloud Mirror' }
        ]
      },
      {
        title: 'Internet Download Manager (IDM) 6.42 Build 18 Full Patch',
        slug: 'internet-download-manager-idm-full-patch',
        version: 'v6.42 Build 18',
        category_id: catMap['utilities-system'],
        developer: 'Tonec Inc.',
        os_support: 'Windows 7 / 8 / 10 / 11 (32-bit & 64-bit)',
        architecture: 'Dual (x86 & x64)',
        file_size: '14.8 MB',
        thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
        screenshots: JSON.stringify([
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1000&auto=format&fit=crop&q=80'
        ]),
        excerpt: 'IDM adalah software download accelerator terbaik nomor 1 yang mempercepat unduhan hingga 5x lipat dengan integrasi browser otomatis.',
        description: `<p><strong>Internet Download Manager (IDM)</strong> adalah akselerator unduhan cerdas yang membagi file ke dalam beberapa segmen paralel untuk memaksimalkan kecepatan koneksi internet Anda. Dilengkapi dengan ekstensi IDM Integration Module untuk Google Chrome, Mozilla Firefox, Microsoft Edge, dan Opera.</p>`,
        features: `<ul>
          <li>Meningkatkan kecepatan download hingga 500%</li>
          <li>Resume download yang terputus atau gagal tanpa harus mengulang dari nol</li>
          <li>Grabber video otomatis dari YouTube, streaming video, dan media web</li>
          <li>Support semua browser populer modern</li>
          <li>Bebas pop-up fake serial number seumur hidup</li>
        </ul>`,
        system_req: `<strong>Minimal Spesifikasi:</strong><br>
        • OS: Windows XP/Vista/7/8/10/11 (32 & 64 bit)<br>
        • RAM: 512 MB<br>
        • Penyimpanan: 50 MB`,
        install_guide: `<ol>
          <li>Uninstall IDM versi lama jika ada sampai bersih.</li>
          <li>Ekstrak file RAR (Password: <strong>Khanza.NET</strong>).</li>
          <li>Jalankan <code>idman642build18.exe</code> dan selesaikan instalasi.</li>
          <li>Keluar (Exit) IDM dari system tray di pojok kanan bawah taskbar.</li>
          <li>Jalankan file Patch, klik tombol <em>Patch / Activate</em>. Selesai!</li>
        </ol>`,
        rar_password: 'Khanza.NET',
        is_featured: 1,
        status: 'published',
        views_count: 28900,
        downloads_count: 14120,
        links: [
          { server: 'Google Drive', url: 'https://drive.google.com', type: 'full', note: 'Fast Direct' },
          { server: 'Zippyshare / Qiwi', url: 'https://qiwi.gg', type: 'full', note: 'No Limit' }
        ]
      },
      {
        title: 'Windows 11 Pro 23H2 Build 22631 Non-TPM Full Activated',
        slug: 'windows-11-pro-23h2-iso-full-activated',
        version: 'v23H2 (Build 22631.3880)',
        category_id: catMap['operating-system'],
        developer: 'Microsoft Corporation',
        os_support: 'Komputer & Laptop PC',
        architecture: '64-bit (x64)',
        file_size: '5.10 GB',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        screenshots: JSON.stringify([
          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80'
        ]),
        excerpt: 'ISO Windows 11 Pro versi terbaru yang telah dioptimasi, bypass TPM 2.0 dan Secure Boot, bisa diinstal di semua PC lama.',
        description: `<p><strong>Windows 11 Pro 23H2</strong> menghadirkan pembaruan besar antarmuka modern dengan Copilot AI, File Explorer baru berbasis tab, Taskbar ungrouping, dan performa gaming yang jauh lebih stabil berkat DirectStorage API.</p>`,
        features: `<ul>
          <li>Bypass persyaratan hardware TPM 2.0, Secure Boot, & RAM 4GB</li>
          <li>Sudah teraktivasi otomatis secara digital (Permanen)</li>
          <li>Tidak ada bloatware tidak berguna, performa jauh lebih ringan</li>
          <li>Update resmi Windows Update tetap berjalan normal</li>
          <li>Termasuk Net Framework 3.5 & DirectX Runtime lengkap</li>
        </ul>`,
        system_req: `<strong>Minimal Spesifikasi:</strong><br>
        • Processor: 1 GHz dual core 64-bit<br>
        • RAM: 4 GB<br>
        • Penyimpanan: 64 GB HDD / SSD<br>
        • Display: Resolusi 720p 9 inci ke atas`,
        install_guide: `<ol>
          <li>Siapkan Flashdisk minimal 8 GB.</li>
          <li>Buat bootable menggunakan aplikasi <strong>Rufus</strong> (Pilih file ISO ini, skema GPT / MBR sesuai laptop).</li>
          <li>Colokkan flashdisk ke PC target, masuk ke BIOS / Boot Menu (Tekan F12/F11/Esc).</li>
          <li>Pilih boot dari USB dan ikuti proses instalasi sampai selesai.</li>
        </ol>`,
        rar_password: 'Khanza.NET',
        is_featured: 1,
        status: 'published',
        views_count: 31200,
        downloads_count: 12400,
        links: [
          { server: 'Google Drive', url: 'https://drive.google.com', type: 'full', note: 'Single Link ISO' },
          { server: 'Mediafire', url: 'https://mediafire.com', type: 'full', note: 'High Speed' },
          { server: 'Mega.nz', url: 'https://mega.nz', type: 'full', note: 'Alternative Link' }
        ]
      },
      {
        title: 'CorelDRAW Graphics Suite 2024 v25.0 Full Version',
        slug: 'coreldraw-graphics-suite-2024-full-version',
        version: 'v25.0.0.230',
        category_id: catMap['graphic-design'],
        developer: 'Corel Corporation',
        os_support: 'Windows 11 / Windows 10 (64-bit)',
        architecture: '64-bit (x64)',
        file_size: '1.85 GB',
        thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&auto=format&fit=crop&q=80',
        screenshots: JSON.stringify([
          'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1000&auto=format&fit=crop&q=80'
        ]),
        excerpt: 'Software desain vektor terfavorit untuk percetakan, sablon, branding logo, dan ilustrasi digital profesional.',
        description: `<p><strong>CorelDRAW Graphics Suite 2024</strong> menyediakan solusi terpadu untuk ilustrasi vektor, tata letak halaman (layout), tipografi, pengeditan foto, dan desain cetak beresolusi tinggi dengan keakuratan warna CMYK yang tak tertandingi.</p>`,
        features: `<ul>
          <li>Koleksi 100 painterly brush realistis terbaru</li>
          <li>Non-destructive effect editing yang fleksibel</li>
          <li>Optimasi alur kerja multipage layout</li>
          <li>Ekspor format PDF/X, SVG, AI, EPS yang kompatibel luas</li>
          <li>Sudah termasuk keygen generator dan patch permanen</li>
        </ul>`,
        system_req: `<strong>Spesifikasi:</strong><br>
        • OS: Windows 10/11 64-bit<br>
        • RAM: 8 GB<br>
        • Storage: 5.5 GB SSD`,
        install_guide: `<ol>
          <li>Matikan koneksi internet.</li>
          <li>Ekstrak arsip RAR (Password: <strong>Khanza.NET</strong>).</li>
          <li>Jalankan setup instalasi dan masukkan serial dari Keygen.</li>
          <li>Setelah selesai, terapkan crack/patch ke folder instalasi.</li>
        </ol>`,
        rar_password: 'Khanza.NET',
        is_featured: 0,
        status: 'published',
        views_count: 18400,
        downloads_count: 6720,
        links: [
          { server: 'Google Drive', url: 'https://drive.google.com', type: 'full', note: 'Single Link' },
          { server: 'Mediafire', url: 'https://mediafire.com', type: 'full', note: 'Mirror 2' }
        ]
      },
      {
        title: 'Grand Theft Auto V: Premium Edition Repack Full DLC',
        slug: 'gta-v-premium-edition-repack-pc',
        version: 'v1.0.3095 / Online 1.68',
        category_id: catMap['pc-games'],
        developer: 'Rockstar Games',
        os_support: 'Windows 10 / 11 64-bit',
        architecture: '64-bit',
        file_size: '48.5 GB',
        thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
        screenshots: JSON.stringify([
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80'
        ]),
        excerpt: 'Jelajahi kota Los Santos dalam game open world legendaris GTA 5 versi repack lengkap dengan semua DLC dan mobil update terbaru.',
        description: `<p><strong>Grand Theft Auto V</strong> mengisahkan tiga penjahat berbeda: Michael, Trevor, dan Franklin, yang mempertaruhkan segalanya dalam serangkaian perampokan berani di seluruh negara bagian San Andreas.</p>`,
        features: `<ul>
          <li>Termasuk semua update patch dan DLC story</li>
          <li>Ukuran kompresi hemat tanpa mengurangi kualitas audio/video</li>
          <li>Dukungan modding (Menyoo, ScriptHookV, Realism Graphics Mod)</li>
          <li>Bisa dimainkan secara offline 100%</li>
        </ul>`,
        system_req: `<strong>Spesifikasi:</strong><br>
        • Processor: Intel Core i5 3470 @ 3.2GHz / AMD FX-8350 @ 4GHz<br>
        • RAM: 8 GB<br>
        • GPU: NVIDIA GTX 660 2GB / AMD HD 7870 2GB<br>
        • Storage: 95 GB HDD / SSD`,
        install_guide: `<ol>
          <li>Ekstrak semua part file RAR jika mendownload dalam bentuk part.</li>
          <li>Jalankan <code>Setup.exe</code>, centang opsi <em>Limit RAM 2GB</em> jika RAM Anda 8GB ke bawah.</li>
          <li>Tunggu proses instalasi dekompresi hingga 100%.</li>
          <li>Jalankan game melalui shortcut desktop. Selamat bermain!</li>
        </ol>`,
        rar_password: 'Khanza.NET',
        is_featured: 1,
        status: 'published',
        views_count: 45200,
        downloads_count: 18900,
        links: [
          { server: 'Google Drive Part 1', url: 'https://drive.google.com', type: 'part', note: 'Part 1 (10 GB)' },
          { server: 'Google Drive Part 2', url: 'https://drive.google.com', type: 'part', note: 'Part 2 (10 GB)' },
          { server: 'Google Drive Part 3', url: 'https://drive.google.com', type: 'part', note: 'Part 3 (10 GB)' },
          { server: 'Torrent Magnet', url: 'magnet:?xt=urn:btih:sample', type: 'full', note: 'Torrent Single File' }
        ]
      },
      {
        title: 'Microsoft Office 2024 Pro Plus LTSC Pre-Activated',
        slug: 'microsoft-office-2024-pro-plus-ltsc',
        version: 'v2408 (Build 17928.20114)',
        category_id: catMap['office-business'],
        developer: 'Microsoft Corporation',
        os_support: 'Windows 10 / 11 64-bit',
        architecture: 'Dual (x86 & x64)',
        file_size: '3.12 GB',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        screenshots: JSON.stringify([
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&auto=format&fit=crop&q=80'
        ]),
        excerpt: 'Paket aplikasi perkantoran resmi terlengkap: Word, Excel, PowerPoint, Outlook, Access 2024 dengan aktivasi LTSC otomatis seumur hidup.',
        description: `<p><strong>Microsoft Office 2024</strong> adalah rilis permanen terbaru untuk pengguna rumahan maupun korporat. Hadir dengan antarmuka Fluent Design yang serasi dengan Windows 11, ratusan formula baru di Excel, dan transisi presentasi mutakhir di PowerPoint.</p>`,
        features: `<ul>
          <li>Paket lengkap Word, Excel, PowerPoint, Outlook, Access, OneNote 2024</li>
          <li>Lisensi LTSC permanen seumur hidup tanpa langganan bulanan</li>
          <li>Kinerja membuka file spreadsheet berukuran besar jauh lebih cepat</li>
          <li>Dukungan format dokumen OpenDocument 1.4</li>
        </ul>`,
        system_req: `<strong>Spesifikasi:</strong><br>
        • OS: Windows 10/11 64-bit<br>
        • RAM: 4 GB<br>
        • Storage: 5 GB ruang kosong`,
        install_guide: `<ol>
          <li>Mount file ISO hasil ekstrak.</li>
          <li>Klik kanan pada <code>Setup.cmd</code> dan pilih <em>Run as Administrator</em>.</li>
          <li>Tunggu jendela Command Prompt otomatis menginstal dan mengaktivasi Office 2024.</li>
          <li>Buka Word atau Excel, lisensi sudah teraktivasi otomatis!</li>
        </ol>`,
        rar_password: 'Khanza.NET',
        is_featured: 1,
        status: 'published',
        views_count: 22100,
        downloads_count: 9800,
        links: [
          { server: 'Google Drive', url: 'https://drive.google.com', type: 'full', note: 'Direct ISO' },
          { server: 'Mediafire', url: 'https://mediafire.com', type: 'full', note: 'Mirror' }
        ]
      }
    ];

    const insertPost = db.prepare(`
      INSERT INTO posts (
        title, slug, version, category_id, developer, os_support, architecture,
        file_size, thumbnail, screenshots, excerpt, description, features,
        system_req, install_guide, rar_password, is_featured, status,
        views_count, downloads_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLink = db.prepare(`
      INSERT INTO download_links (post_id, server_name, download_url, link_type, note, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const p of samplePosts) {
      const res = insertPost.run(
        p.title, p.slug, p.version, p.category_id, p.developer, p.os_support, p.architecture,
        p.file_size, p.thumbnail, p.screenshots, p.excerpt, p.description, p.features,
        p.system_req, p.install_guide, p.rar_password, p.is_featured, p.status,
        p.views_count, p.downloads_count
      );

      const postId = res.lastInsertRowid;
      if (p.links && p.links.length > 0) {
        p.links.forEach((l, idx) => {
          insertLink.run(postId, l.server, l.url, l.type, l.note, idx);
        });
      }
    }
  }

  // Seed sample static pages
  const pageCount = db.prepare('SELECT COUNT(*) as count FROM pages').get();
  if (pageCount.count === 0) {
    const pages = [
      {
        title: 'DMCA Disclaimer',
        slug: 'dmca-disclaimer',
        content: `<h3>Digital Millennium Copyright Act (DMCA) Notice</h3>
        <p>Website <strong>Khanza.NET SOFTWARE</strong> tidak menyimpan atau meng-host file software berhak cipta apapun di server kami sendiri. Semua tautan unduhan yang tersedia di situs ini dikumpulkan dari domain publik, forum pihak ketiga, dan situs penyimpanan file eksternal seperti Google Drive, Mega, Mediafire, dan sejenisnya.</p>
        <p>Jika Anda adalah pemegang hak cipta sah dari materi yang terindeks di situs kami dan ingin materi tersebut dihapus, silakan kirimkan pemberitahuan resmi yang berisi bukti kepemilikan hak cipta ke email: <strong>dmca@khanza.net</strong>. Kami akan segera merespons dan menonaktifkan tautan tersebut dalam waktu 1x24 jam kerja.</p>`
      },
      {
        title: 'Panduan Cara Download',
        slug: 'how-to-download',
        content: `<h3>Panduan Lengkap Cara Download di Website Khanza.NET</h3>
        <p>Bagi Anda pengunjung baru yang mengalami kesulitan saat mendownload file, ikuti langkah mudah berikut:</p>
        <ol>
          <li>Cari software yang Anda butuhkan melalui tombol search bar di atas atau melalui menu kategori.</li>
          <li>Klik judul atau tombol <strong>"Detail & Download"</strong> pada software pilihan Anda.</li>
          <li>Gulir ke bawah ke bagian <strong>"Download Links"</strong>.</li>
          <li>Pilih salah satu server mirror yang tersedia (Google Drive, Mega, Mediafire, dll.).</li>
          <li>Jika file berukuran besar dan dipecah menjadi beberapa Part (Part 1, Part 2, dst.), Anda wajib mendownload semua part tersebut hingga lengkap dan menyimpannya dalam satu folder yang sama sebelum diekstrak.</li>
          <li>Gunakan aplikasi <strong>WinRAR versi terbaru</strong> untuk mengekstrak file. Masukkan password RAR: <code>Khanza.NET</code>.</li>
          <li>Ikuti petunjuk instalasi yang tertera di halaman postingan software.</li>
        </ol>`
      }
    ];

    const insertPage = db.prepare('INSERT INTO pages (title, slug, content) VALUES (?, ?, ?)');
    for (const pg of pages) {
      insertPage.run(pg.title, pg.slug, pg.content);
    }
  }
}

// Initialize tables and seeds
initDatabase();

module.exports = db;
