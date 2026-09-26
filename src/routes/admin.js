const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, upload } = require('../middleware/auth');
const { makeSlug, setSetting, formatDate } = require('../utils/helpers');

// Login page
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: 'Admin Login - CMS Portal',
    error: req.query.error || null,
    layout: false
  });
});

// Process Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('admin/login', {
      title: 'Admin Login - CMS Portal',
      error: 'Username dan password wajib diisi!',
      layout: false
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
  if (!user) {
    return res.render('admin/login', {
      title: 'Admin Login - CMS Portal',
      error: 'Username atau password salah!',
      layout: false
    });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.render('admin/login', {
      title: 'Admin Login - CMS Portal',
      error: 'Username atau password salah!',
      layout: false
    });
  }

  // Create session
  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  const returnTo = req.session.returnTo || '/admin';
  delete req.session.returnTo;
  res.redirect(returnTo);
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// All routes below require authentication
router.use(requireAuth);

// Dashboard
router.get('/', (req, res) => {
  const stats = {
    totalPosts: db.prepare('SELECT COUNT(*) as c FROM posts').get().c,
    publishedPosts: db.prepare("SELECT COUNT(*) as c FROM posts WHERE status = 'published'").get().c,
    totalCategories: db.prepare('SELECT COUNT(*) as c FROM categories').get().c,
    totalViews: db.prepare('SELECT SUM(views_count) as c FROM posts').get().c || 0,
    totalDownloads: db.prepare('SELECT SUM(downloads_count) as c FROM posts').get().c || 0,
    pendingRequests: db.prepare("SELECT COUNT(*) as c FROM software_requests WHERE status = 'pending'").get().c,
    pendingBrokenLinks: db.prepare("SELECT COUNT(*) as c FROM broken_link_reports WHERE status = 'pending'").get().c,
    totalComments: db.prepare('SELECT COUNT(*) as c FROM comments').get().c
  };

  const topPosts = db.prepare(`
    SELECT p.id, p.title, p.slug, p.views_count, p.downloads_count, c.name as category_name
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.views_count DESC
    LIMIT 6
  `).all();

  const recentRequests = db.prepare(`
    SELECT * FROM software_requests ORDER BY created_at DESC LIMIT 5
  `).all();

  const recentPosts = db.prepare(`
    SELECT p.id, p.title, p.status, p.created_at, c.name as category_name
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
    LIMIT 5
  `).all();

  res.render('admin/dashboard', {
    title: 'Dashboard CMS',
    stats,
    topPosts,
    recentRequests,
    recentPosts,
    formatDate
  });
});

// Posts List
router.get('/posts', (req, res) => {
  const search = (req.query.q || '').trim();
  const cat = req.query.cat || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  let countSql = 'SELECT COUNT(*) as c FROM posts p WHERE 1=1';
  let querySql = `
    SELECT p.id, p.title, p.slug, p.version, p.status, p.is_featured, p.views_count, p.downloads_count, p.created_at,
           c.name as category_name,
           (SELECT COUNT(*) FROM download_links dl WHERE dl.post_id = p.id) as link_count
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];
  const countParams = [];

  if (search) {
    const p = `%${search}%`;
    const filter = ' AND (p.title LIKE ? OR p.developer LIKE ?)';
    countSql += filter;
    querySql += filter;
    countParams.push(p, p);
    params.push(p, p);
  }

  if (cat) {
    countSql += ' AND p.category_id = ?';
    querySql += ' AND p.category_id = ?';
    countParams.push(cat);
    params.push(cat);
  }

  const total = db.prepare(countSql).get(...countParams).c;
  const totalPages = Math.ceil(total / limit);

  querySql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const posts = db.prepare(querySql).all(...params);
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();

  res.render('admin/posts/index', {
    title: 'Manajemen Software & Post',
    posts,
    categories,
    search,
    selectedCat: cat,
    page,
    totalPages,
    total,
    formatDate,
    success: req.query.success || null
  });
});

// Create Post Form
router.get('/posts/new', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  const defaultPassword = db.prepare("SELECT value FROM settings WHERE key = 'default_rar_password'").get()?.value || 'Khanza.NET';

  res.render('admin/posts/form', {
    title: 'Tambah Software Baru',
    post: null,
    categories,
    defaultPassword,
    links: [],
    error: null
  });
});

// Create Post Action
router.post('/posts/new', upload.single('thumbnail_file'), (req, res) => {
  try {
    const {
      title, slug, version, category_id, developer, os_support, architecture,
      file_size, thumbnail_url, screenshots_urls, excerpt, description,
      features, system_req, install_guide, rar_password, is_featured, status,
      checksum_sha256, is_tested, tags, changelog,
      link_server, link_url, link_type, link_note
    } = req.body;

    if (!title) {
      const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
      return res.render('admin/posts/form', {
        title: 'Tambah Software Baru',
        post: req.body,
        categories,
        defaultPassword: 'Khanza.NET',
        links: [],
        error: 'Judul software wajib diisi!'
      });
    }

    // Generate slug
    let finalSlug = slug ? makeSlug(slug) : makeSlug(title);
    // Ensure slug uniqueness
    const existing = db.prepare('SELECT id FROM posts WHERE slug = ?').get(finalSlug);
    if (existing) {
      finalSlug += '-' + Date.now().toString().slice(-4);
    }

    // Determine thumbnail
    let finalThumbnail = thumbnail_url ? thumbnail_url.trim() : '';
    if (req.file) {
      finalThumbnail = '/uploads/' + req.file.filename;
    }
    if (!finalThumbnail) {
      finalThumbnail = 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80';
    }

    // Process screenshots
    let screenshotsArr = [];
    if (screenshots_urls) {
      screenshotsArr = screenshots_urls.split('\n').map(s => s.trim()).filter(Boolean);
    }

    const insertPost = db.prepare(`
      INSERT INTO posts (
        title, slug, version, category_id, developer, os_support, architecture,
        file_size, thumbnail, screenshots, excerpt, description, features,
        system_req, install_guide, rar_password, is_featured, status,
        checksum_sha256, is_tested, tags, changelog
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertPost.run(
      title.trim(),
      finalSlug,
      version ? version.trim() : '',
      category_id || null,
      developer ? developer.trim() : '',
      os_support ? os_support.trim() : 'Windows 10 / 11 (64-bit)',
      architecture ? architecture.trim() : '64-bit (x64)',
      file_size ? file_size.trim() : '',
      finalThumbnail,
      JSON.stringify(screenshotsArr),
      excerpt ? excerpt.trim() : '',
      description ? description.trim() : '',
      features ? features.trim() : '',
      system_req ? system_req.trim() : '',
      install_guide ? install_guide.trim() : '',
      rar_password ? rar_password.trim() : 'Khanza.NET',
      is_featured ? 1 : 0,
      status || 'published',
      checksum_sha256 ? checksum_sha256.trim() : null,
      is_tested ? 1 : 0,
      tags ? tags.trim() : 'Pre-Activated',
      changelog ? changelog.trim() : null
    );

    const postId = result.lastInsertRowid;

    // Insert download links
    if (link_server && link_url) {
      const servers = Array.isArray(link_server) ? link_server : [link_server];
      const urls = Array.isArray(link_url) ? link_url : [link_url];
      const types = Array.isArray(link_type) ? link_type : [link_type];
      const notes = Array.isArray(link_note) ? link_note : [link_note];

      const insertLink = db.prepare(`
        INSERT INTO download_links (post_id, server_name, download_url, link_type, note, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < servers.length; i++) {
        if (servers[i] && urls[i]) {
          insertLink.run(postId, servers[i].trim(), urls[i].trim(), types[i] || 'full', notes[i] ? notes[i].trim() : '', i);
        }
      }
    }

    res.redirect('/admin/posts?success=Software+berhasil+ditambahkan!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat menyimpan data: ' + err.message);
  }
});

// Edit Post Form
router.get('/posts/:id/edit', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) {
    return res.status(404).send('Software tidak ditemukan.');
  }

  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  const links = db.prepare('SELECT * FROM download_links WHERE post_id = ? ORDER BY sort_order ASC, id ASC').all(post.id);

  // Parse screenshots
  let screenshotsUrls = '';
  if (post.screenshots) {
    try {
      const arr = JSON.parse(post.screenshots);
      if (Array.isArray(arr)) {
        screenshotsUrls = arr.join('\n');
      }
    } catch (e) {
      screenshotsUrls = post.screenshots;
    }
  }
  post.screenshots_urls = screenshotsUrls;

  res.render('admin/posts/form', {
    title: `Edit: ${post.title}`,
    post,
    categories,
    defaultPassword: post.rar_password || 'Khanza.NET',
    links,
    error: null
  });
});

// Edit Post Action
router.post('/posts/:id/edit', upload.single('thumbnail_file'), (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) {
      return res.status(404).send('Software tidak ditemukan.');
    }

    const {
      title, slug, version, category_id, developer, os_support, architecture,
      file_size, thumbnail_url, screenshots_urls, excerpt, description,
      features, system_req, install_guide, rar_password, is_featured, status,
      checksum_sha256, is_tested, tags, changelog,
      link_server, link_url, link_type, link_note
    } = req.body;

    let finalSlug = slug ? makeSlug(slug) : makeSlug(title);
    // Check slug duplicate for other posts
    const existing = db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(finalSlug, post.id);
    if (existing) {
      finalSlug += '-' + Date.now().toString().slice(-4);
    }

    let finalThumbnail = post.thumbnail;
    if (req.file) {
      finalThumbnail = '/uploads/' + req.file.filename;
    } else if (thumbnail_url && thumbnail_url.trim()) {
      finalThumbnail = thumbnail_url.trim();
    }

    let screenshotsArr = [];
    if (screenshots_urls) {
      screenshotsArr = screenshots_urls.split('\n').map(s => s.trim()).filter(Boolean);
    }

    db.prepare(`
      UPDATE posts SET
        title = ?, slug = ?, version = ?, category_id = ?, developer = ?, os_support = ?,
        architecture = ?, file_size = ?, thumbnail = ?, screenshots = ?, excerpt = ?,
        description = ?, features = ?, system_req = ?, install_guide = ?,
        rar_password = ?, is_featured = ?, status = ?,
        checksum_sha256 = ?, is_tested = ?, tags = ?, changelog = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title.trim(),
      finalSlug,
      version ? version.trim() : '',
      category_id || null,
      developer ? developer.trim() : '',
      os_support ? os_support.trim() : 'Windows 10 / 11 (64-bit)',
      architecture ? architecture.trim() : '64-bit (x64)',
      file_size ? file_size.trim() : '',
      finalThumbnail,
      JSON.stringify(screenshotsArr),
      excerpt ? excerpt.trim() : '',
      description ? description.trim() : '',
      features ? features.trim() : '',
      system_req ? system_req.trim() : '',
      install_guide ? install_guide.trim() : '',
      rar_password ? rar_password.trim() : 'Khanza.NET',
      is_featured ? 1 : 0,
      status || 'published',
      checksum_sha256 ? checksum_sha256.trim() : null,
      is_tested ? 1 : 0,
      tags ? tags.trim() : 'Pre-Activated',
      changelog ? changelog.trim() : null,
      post.id
    );

    // Replace download links
    db.prepare('DELETE FROM download_links WHERE post_id = ?').run(post.id);

    if (link_server && link_url) {
      const servers = Array.isArray(link_server) ? link_server : [link_server];
      const urls = Array.isArray(link_url) ? link_url : [link_url];
      const types = Array.isArray(link_type) ? link_type : [link_type];
      const notes = Array.isArray(link_note) ? link_note : [link_note];

      const insertLink = db.prepare(`
        INSERT INTO download_links (post_id, server_name, download_url, link_type, note, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < servers.length; i++) {
        if (servers[i] && urls[i]) {
          insertLink.run(post.id, servers[i].trim(), urls[i].trim(), types[i] || 'full', notes[i] ? notes[i].trim() : '', i);
        }
      }
    }

    res.redirect('/admin/posts?success=Perubahan+software+berhasil+disimpan!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat mengupdate software: ' + err.message);
  }
});

// Delete Post
router.post('/posts/:id/delete', (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.redirect('/admin/posts?success=Software+berhasil+dihapus!');
});

// Categories Management
router.get('/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id) as post_count
    FROM categories c
    ORDER BY c.sort_order ASC, c.name ASC
  `).all();

  res.render('admin/categories/index', {
    title: 'Manajemen Kategori',
    categories,
    success: req.query.success || null,
    error: req.query.error || null
  });
});

// Add Category
router.post('/categories', (req, res) => {
  const { name, slug, description, icon, color, sort_order } = req.body;
  if (!name) {
    return res.redirect('/admin/categories?error=Nama+kategori+wajib+diisi!');
  }

  const finalSlug = slug ? makeSlug(slug) : makeSlug(name);
  try {
    db.prepare(`
      INSERT INTO categories (name, slug, description, icon, color, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      finalSlug,
      description ? description.trim() : '',
      icon ? icon.trim() : 'fa-solid fa-folder',
      color ? color.trim() : '#3b82f6',
      parseInt(sort_order) || 0
    );
    res.redirect('/admin/categories?success=Kategori+berhasil+ditambahkan!');
  } catch (e) {
    res.redirect('/admin/categories?error=Slug+sudah+digunakan+atau+terjadi+kesalahan!');
  }
});

// Edit Category
router.post('/categories/:id/edit', (req, res) => {
  const { name, slug, description, icon, color, sort_order } = req.body;
  const finalSlug = slug ? makeSlug(slug) : makeSlug(name);

  try {
    db.prepare(`
      UPDATE categories SET
        name = ?, slug = ?, description = ?, icon = ?, color = ?, sort_order = ?
      WHERE id = ?
    `).run(
      name.trim(),
      finalSlug,
      description ? description.trim() : '',
      icon ? icon.trim() : 'fa-solid fa-folder',
      color ? color.trim() : '#3b82f6',
      parseInt(sort_order) || 0,
      req.params.id
    );
    res.redirect('/admin/categories?success=Kategori+berhasil+diperbarui!');
  } catch (e) {
    res.redirect('/admin/categories?error=Gagal+mengupdate+kategori:+slug+mungkin+sudah+ada.');
  }
});

// Delete Category
router.post('/categories/:id/delete', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.redirect('/admin/categories?success=Kategori+berhasil+dihapus!');
});

// Software Requests Management
router.get('/requests', (req, res) => {
  const requests = db.prepare('SELECT * FROM software_requests ORDER BY created_at DESC').all();
  res.render('admin/requests/index', {
    title: 'Permintaan Software Pengunjung',
    requests,
    formatDate,
    success: req.query.success || null
  });
});

// Update Request Status
router.post('/requests/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE software_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  res.redirect('/admin/requests?success=Status+permintaan+berhasil+diupdate!');
});

// Delete Request
router.post('/requests/:id/delete', (req, res) => {
  db.prepare('DELETE FROM software_requests WHERE id = ?').run(req.params.id);
  res.redirect('/admin/requests?success=Permintaan+berhasil+dihapus!');
});

// Comments Management
router.get('/comments', (req, res) => {
  const comments = db.prepare(`
    SELECT cm.*, p.title as post_title, p.slug as post_slug
    FROM comments cm
    JOIN posts p ON cm.post_id = p.id
    ORDER BY cm.created_at DESC
  `).all();

  res.render('admin/comments/index', {
    title: 'Manajemen Komentar',
    comments,
    formatDate,
    success: req.query.success || null
  });
});

// Toggle Comment Status
router.post('/comments/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(status, req.params.id);
  res.redirect('/admin/comments?success=Status+komentar+berhasil+diperbarui!');
});

// Delete Comment
router.post('/comments/:id/delete', (req, res) => {
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.redirect('/admin/comments?success=Komentar+berhasil+dihapus!');
});

// Pages Management
router.get('/pages', (req, res) => {
  const pages = db.prepare('SELECT * FROM pages ORDER BY title ASC').all();
  res.render('admin/pages/index', {
    title: 'Manajemen Halaman Statis',
    pages,
    formatDate,
    success: req.query.success || null
  });
});

// Edit Page
router.get('/pages/:id/edit', (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).send('Halaman tidak ditemukan');

  res.render('admin/pages/form', {
    title: `Edit Halaman: ${page.title}`,
    page,
    success: null,
    error: null
  });
});

// Save Page
router.post('/pages/:id/edit', (req, res) => {
  const { title, content } = req.body;
  db.prepare(`
    UPDATE pages SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(title.trim(), content, req.params.id);

  res.redirect('/admin/pages?success=Halaman+berhasil+disimpan!');
});

// Settings
router.get('/settings', (req, res) => {
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });

  res.render('admin/settings/index', {
    title: 'Pengaturan Website & Akun',
    settings,
    success: req.query.success || null,
    error: req.query.error || null
  });
});

// Save Settings
router.post('/settings', (req, res) => {
  const allowedKeys = [
    'site_name', 'site_tagline', 'site_description', 'default_rar_password',
    'telegram_url', 'discord_url', 'youtube_url', 'footer_text',
    'announcement', 'contact_email'
  ];

  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      setSetting(key, req.body[key].trim());
    }
  }

  res.redirect('/admin/settings?success=Pengaturan+website+berhasil+disimpan!');
});

// Change Admin Password / Username
router.post('/profile/update', (req, res) => {
  const { username, current_password, new_password, confirm_password } = req.body;
  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);

  if (!currentUser) {
    return res.redirect('/admin/settings?error=User+tidak+ditemukan!');
  }

  // Verify current password
  if (!bcrypt.compareSync(current_password, currentUser.password_hash)) {
    return res.redirect('/admin/settings?error=Password+saat+ini+salah!');
  }

  let newUsername = currentUser.username;
  if (username && username.trim()) {
    newUsername = username.trim();
  }

  let newHash = currentUser.password_hash;
  if (new_password) {
    if (new_password !== confirm_password) {
      return res.redirect('/admin/settings?error=Konfirmasi+password+baru+tidak+cocok!');
    }
    if (new_password.length < 6) {
      return res.redirect('/admin/settings?error=Password+baru+minimal+6+karakter!');
    }
    const salt = bcrypt.genSaltSync(10);
    newHash = bcrypt.hashSync(new_password, salt);
  }

  db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE id = ?').run(
    newUsername, newHash, currentUser.id
  );

  req.session.user.username = newUsername;

  res.redirect('/admin/settings?success=Profil+dan+password+berhasil+diperbarui!');
});

// Broken Link Reports List
router.get('/broken-links', (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, p.title as post_title, p.slug as post_slug, dl.server_name, dl.download_url
    FROM broken_link_reports r
    LEFT JOIN posts p ON r.post_id = p.id
    LEFT JOIN download_links dl ON r.link_id = dl.id
    ORDER BY r.created_at DESC
  `).all();

  const pendingCount = db.prepare("SELECT COUNT(*) as c FROM broken_link_reports WHERE status = 'pending'").get().c;

  res.render('admin/broken-links/index', {
    title: 'Laporan Link Rusak',
    reports,
    pendingCount,
    success: req.query.success || null,
    formatDate
  });
});

// Update Broken Link Status
router.post('/broken-links/:id/status', (req, res) => {
  const { status } = req.body;
  if (['pending', 'resolved', 'rejected'].includes(status)) {
    db.prepare('UPDATE broken_link_reports SET status = ? WHERE id = ?').run(status, req.params.id);
  }
  res.redirect('/admin/broken-links?success=Status+laporan+berhasil+diperbarui!');
});

// Delete Broken Link Report
router.post('/broken-links/:id/delete', (req, res) => {
  db.prepare('DELETE FROM broken_link_reports WHERE id = ?').run(req.params.id);
  res.redirect('/admin/broken-links?success=Laporan+berhasil+dihapus!');
});

// Ads Management View
router.get('/ads', (req, res) => {
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });

  res.render('admin/ads/index', {
    title: 'Kelola Slot Iklan & Sponsor',
    settings,
    success: req.query.success || null,
    error: req.query.error || null
  });
});

// Save Ads
router.post('/ads', (req, res) => {
  const adKeys = ['ad_header', 'ad_sidebar', 'ad_download_gate', 'ad_article_bottom'];
  for (const key of adKeys) {
    if (req.body[key] !== undefined) {
      setSetting(key, req.body[key].trim());
    }
  }
  res.redirect('/admin/ads?success=Slot+iklan+dan+sponsor+berhasil+disimpan!');
});

// One-Click Database Backup Download
router.get('/backup/database', (req, res) => {
  const dbFile = path.resolve(__dirname, '../../data/database.sqlite');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const downloadName = `khanza-backup-${dateStr}.sqlite`;
  
  res.download(dbFile, downloadName, (err) => {
    if (err) {
      console.error('Backup download error:', err);
      if (!res.headersSent) {
        res.status(500).send('Gagal mengunduh file backup database.');
      }
    }
  });
});

module.exports = router;
