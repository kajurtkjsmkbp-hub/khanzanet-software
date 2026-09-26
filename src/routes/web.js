const express = require('express');
const router = express.Router();
const db = require('../db');
const { formatDate, formatNumber } = require('../utils/helpers');

// Helper to get sidebar data (popular software, recent updates)
function getSidebarData() {
  const popularPosts = db.prepare(`
    SELECT p.id, p.title, p.slug, p.version, p.thumbnail, p.views_count, p.downloads_count, p.file_size, c.name as category_name
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
    ORDER BY p.views_count DESC
    LIMIT 6
  `).all();

  const recentUpdates = db.prepare(`
    SELECT p.id, p.title, p.slug, p.version, p.thumbnail, p.updated_at, c.name as category_name
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
    ORDER BY p.updated_at DESC
    LIMIT 6
  `).all();

  return { popularPosts, recentUpdates };
}

// Home page
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  const selectedTag = (req.query.tag || '').trim();
  const selectedOs = (req.query.os || '').trim();
  const selectedArch = (req.query.arch || '').trim();

  // Featured software for hero slider / top grid
  const featuredPosts = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published' AND p.is_featured = 1
    ORDER BY p.created_at DESC
    LIMIT 5
  `).all();

  let countSql = "SELECT COUNT(*) as count FROM posts p WHERE p.status = 'published'";
  let querySql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
           (SELECT COUNT(*) FROM download_links dl WHERE dl.post_id = p.id) as link_count
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
  `;
  const params = [];
  const countParams = [];

  if (selectedTag) {
    countSql += " AND p.tags LIKE ?";
    querySql += " AND p.tags LIKE ?";
    countParams.push(`%${selectedTag}%`);
    params.push(`%${selectedTag}%`);
  }
  if (selectedOs) {
    countSql += " AND p.os_support LIKE ?";
    querySql += " AND p.os_support LIKE ?";
    countParams.push(`%${selectedOs}%`);
    params.push(`%${selectedOs}%`);
  }
  if (selectedArch) {
    countSql += " AND p.architecture LIKE ?";
    querySql += " AND p.architecture LIKE ?";
    countParams.push(`%${selectedArch}%`);
    params.push(`%${selectedArch}%`);
  }

  const totalCount = db.prepare(countSql).get(...countParams).count;
  const totalPages = Math.ceil(totalCount / limit);

  querySql += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const posts = db.prepare(querySql).all(...params);
  const { popularPosts, recentUpdates } = getSidebarData();

  res.render('home', {
    title: selectedTag ? `Tag: ${selectedTag}` : 'Beranda',
    posts,
    featuredPosts,
    popularPosts,
    recentUpdates,
    currentPage: page,
    totalPages,
    totalCount,
    selectedTag,
    selectedOs,
    selectedArch,
    formatDate,
    formatNumber
  });
});

// Single software detail page
router.get('/software/:slug', (req, res) => {
  const { slug } = req.params;

  // Find post
  const post = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ?
  `).get(slug);

  if (!post) {
    return res.status(404).render('404', { title: 'Software Tidak Ditemukan' });
  }

  // Increment views count (only for published posts)
  if (post.status === 'published') {
    db.prepare('UPDATE posts SET views_count = views_count + 1 WHERE id = ?').run(post.id);
    post.views_count += 1;
  }

  // Parse screenshots if JSON
  let screenshots = [];
  if (post.screenshots) {
    try {
      screenshots = JSON.parse(post.screenshots);
    } catch (e) {
      if (typeof post.screenshots === 'string' && post.screenshots.trim()) {
        screenshots = [post.screenshots.trim()];
      }
    }
  }

  // Fetch download links
  const downloadLinks = db.prepare(`
    SELECT * FROM download_links WHERE post_id = ? ORDER BY sort_order ASC, id ASC
  `).all(post.id);

  // Related posts from same category
  const relatedPosts = db.prepare(`
    SELECT p.id, p.title, p.slug, p.version, p.thumbnail, p.file_size, p.views_count, c.name as category_name
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published' AND p.category_id = ? AND p.id != ?
    ORDER BY p.views_count DESC
    LIMIT 4
  `).all(post.category_id, post.id);

  // Comments for this post
  const comments = db.prepare(`
    SELECT * FROM comments WHERE post_id = ? AND status = 'approved' ORDER BY created_at DESC
  `).all(post.id);

  const { popularPosts, recentUpdates } = getSidebarData();

  res.render('post-detail', {
    title: `${post.title} - Download Gratis`,
    post,
    screenshots,
    downloadLinks,
    relatedPosts,
    comments,
    popularPosts,
    recentUpdates,
    formatDate,
    formatNumber,
    msg: req.query.msg || null
  });
});

// Safe Download Gate page with countdown
router.get('/download/:id', (req, res) => {
  const link = db.prepare('SELECT * FROM download_links WHERE id = ?').get(req.params.id);
  if (!link) {
    return res.status(404).render('404', { title: 'Tautan Tidak Ditemukan' });
  }

  const post = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(link.post_id);

  if (!post) {
    return res.status(404).render('404', { title: 'Software Tidak Ditemukan' });
  }

  // Other mirror links for this software
  const otherLinks = db.prepare('SELECT * FROM download_links WHERE post_id = ? AND id != ? ORDER BY sort_order ASC').all(post.id, link.id);

  res.render('download-gate', {
    title: `Download ${post.title} via ${link.server_name}`,
    post,
    link,
    otherLinks,
    formatDate,
    formatNumber
  });
});

// Final Direct Download execution (tracks download count & redirects to target URL)
router.get('/download/direct/:id', (req, res) => {
  const link = db.prepare('SELECT * FROM download_links WHERE id = ?').get(req.params.id);
  if (!link) {
    return res.status(404).send('Tautan download tidak valid atau sudah kadaluarsa.');
  }

  // Increment post download count
  db.prepare('UPDATE posts SET downloads_count = downloads_count + 1 WHERE id = ?').run(link.post_id);

  res.redirect(link.download_url);
});

// Category archive
router.get('/category/:slug', (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
  if (!category) {
    return res.status(404).render('404', { title: 'Kategori Tidak Ditemukan' });
  }

  const totalCount = db.prepare("SELECT COUNT(*) as count FROM posts WHERE category_id = ? AND status = 'published'").get(category.id).count;
  const totalPages = Math.ceil(totalCount / limit);

  const posts = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
           (SELECT COUNT(*) FROM download_links dl WHERE dl.post_id = p.id) as link_count
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.category_id = ? AND p.status = 'published'
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(category.id, limit, offset);

  const { popularPosts, recentUpdates } = getSidebarData();

  res.render('category', {
    title: `Kategori: ${category.name}`,
    category,
    posts,
    currentPage: page,
    totalPages,
    totalCount,
    popularPosts,
    recentUpdates,
    formatDate,
    formatNumber
  });
});

// Search page
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  const catFilter = req.query.cat || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  if (!q && !catFilter) {
    return res.redirect('/');
  }

  let countSql = `SELECT COUNT(*) as count FROM posts p WHERE p.status = 'published'`;
  let searchSql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug, c.color as category_color,
           (SELECT COUNT(*) FROM download_links dl WHERE dl.post_id = p.id) as link_count
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
  `;
  const params = [];
  const countParams = [];

  if (q) {
    const pattern = `%${q}%`;
    const searchFilter = ` AND (p.title LIKE ? OR p.description LIKE ? OR p.developer LIKE ? OR p.version LIKE ?)`;
    countSql += searchFilter;
    searchSql += searchFilter;
    countParams.push(pattern, pattern, pattern, pattern);
    params.push(pattern, pattern, pattern, pattern);
  }

  if (catFilter) {
    countSql += ` AND p.category_id = ?`;
    searchSql += ` AND p.category_id = ?`;
    countParams.push(catFilter);
    params.push(catFilter);
  }

  const totalCount = db.prepare(countSql).get(...countParams).count;
  const totalPages = Math.ceil(totalCount / limit);

  searchSql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const posts = db.prepare(searchSql).all(...params);
  const { popularPosts, recentUpdates } = getSidebarData();

  res.render('search', {
    title: `Hasil Pencarian: "${q}"`,
    queryStr: q,
    catFilter,
    posts,
    currentPage: page,
    totalPages,
    totalCount,
    popularPosts,
    recentUpdates,
    formatDate,
    formatNumber
  });
});

// Live search JSON API
router.get('/api/search-suggest', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) {
    return res.json([]);
  }

  const results = db.prepare(`
    SELECT p.id, p.title, p.slug, p.version, p.thumbnail, p.file_size, c.name as category_name
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published' AND (p.title LIKE ? OR p.developer LIKE ?)
    LIMIT 6
  `).all(`%${q}%`, `%${q}%`);

  res.json(results);
});

// Post comment
router.post('/software/:slug/comment', (req, res) => {
  const { slug } = req.params;
  const { author_name, author_email, comment_text } = req.body;

  const post = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
  if (!post) {
    return res.status(404).send('Not Found');
  }

  if (!author_name || !comment_text) {
    return res.redirect(`/software/${slug}?msg=Komentar+gagal:+Nama+dan+pesan+wajib+diisi.#comments`);
  }

  db.prepare(`
    INSERT INTO comments (post_id, author_name, author_email, comment_text, status)
    VALUES (?, ?, ?, ?, 'approved')
  `).run(post.id, author_name.trim(), (author_email || '').trim(), comment_text.trim());

  res.redirect(`/software/${slug}?msg=Komentar+berhasil+dikirim!#comments`);
});

// Request software page & submission
router.get('/request', (req, res) => {
  const recentRequests = db.prepare(`
    SELECT * FROM software_requests ORDER BY created_at DESC LIMIT 10
  `).all();

  const { popularPosts } = getSidebarData();

  res.render('request-software', {
    title: 'Request Software & Game PC',
    recentRequests,
    popularPosts,
    formatDate,
    success: req.query.success || null
  });
});

router.post('/request', (req, res) => {
  const { name, email, software_name, version_needed, notes } = req.body;

  if (!name || !software_name) {
    return res.redirect('/request?error=Nama+dan+nama+software+wajib+diisi!');
  }

  db.prepare(`
    INSERT INTO software_requests (name, email, software_name, version_needed, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), (email || '').trim(), software_name.trim(), (version_needed || '').trim(), (notes || '').trim());

  res.redirect('/request?success=Permintaan+software+berhasil+dikirim!+Tim+kami+akan+segera+mengeceknya.');
});

// How to download tutorial page
router.get('/how-to-download', (req, res) => {
  const page = db.prepare("SELECT * FROM pages WHERE slug = 'how-to-download'").get();
  const { popularPosts } = getSidebarData();
  res.render('page', {
    title: page ? page.title : 'Panduan Cara Download',
    pageContent: page ? page.content : '<p>Panduan sedang disiapkan.</p>',
    pageTitle: page ? page.title : 'Panduan Cara Download',
    popularPosts
  });
});

// Generic dynamic page (DMCA, About, etc.)
router.get('/p/:slug', (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
  if (!page) {
    return res.status(404).render('404', { title: 'Halaman Tidak Ditemukan' });
  }

  const { popularPosts } = getSidebarData();
  res.render('page', {
    title: page.title,
    pageTitle: page.title,
    pageContent: page.content,
    popularPosts
  });
});

// Report broken download link
router.post('/report-broken-link', (req, res) => {
  const { post_id, link_id, reporter_name, reason } = req.body;

  if (!post_id || !reason) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, message: 'Alasan wajib diisi.' });
    }
    return res.redirect('back');
  }

  db.prepare(`
    INSERT INTO broken_link_reports (post_id, link_id, reporter_name, reason, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(
    post_id,
    link_id || null,
    (reporter_name || 'Pengunjung').trim(),
    reason.trim()
  );

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, message: 'Laporan link rusak berhasil dikirim! Admin akan segera mengecek dan me-reupload link.' });
  }

  const post = db.prepare('SELECT slug FROM posts WHERE id = ?').get(post_id);
  const redirectUrl = post ? `/software/${post.slug}?msg=Laporan+link+rusak+berhasil+dikirim!+Terima+kasih.` : '/';
  res.redirect(redirectUrl);
});

// User Star Rating & Upvote API
router.post('/api/rate/:postId', (req, res) => {
  const postId = req.params.postId;
  const rating = parseFloat(req.body.rating);

  if (isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating harus antara 1 sampai 5' });
  }

  const post = db.prepare('SELECT id, rating_score, rating_votes FROM posts WHERE id = ?').get(postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Software tidak ditemukan' });
  }

  const currentScore = post.rating_score || 5.0;
  const currentVotes = post.rating_votes || 1;

  const newVotes = currentVotes + 1;
  const newScore = parseFloat((((currentScore * currentVotes) + rating) / newVotes).toFixed(1));

  db.prepare('UPDATE posts SET rating_score = ?, rating_votes = ? WHERE id = ?').run(newScore, newVotes, postId);

  res.json({
    success: true,
    message: 'Terima kasih atas penilaian Anda!',
    newScore,
    newVotes
  });
});

// Dynamic Sitemap.xml Generator
router.get('/sitemap.xml', (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const posts = db.prepare("SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC").all();
  const categories = db.prepare("SELECT slug FROM categories ORDER BY name ASC").all();
  const pages = db.prepare("SELECT slug, updated_at FROM pages").all();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += `  <url>\n    <loc>${host}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  xml += `  <url>\n    <loc>${host}/request</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;

  // Categories
  categories.forEach(cat => {
    xml += `  <url>\n    <loc>${host}/category/${cat.slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  });

  // Posts
  posts.forEach(post => {
    const modDate = post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    xml += `  <url>\n    <loc>${host}/software/${post.slug}</loc>\n    <lastmod>${modDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
  });

  // Static Pages
  pages.forEach(pg => {
    const modDate = pg.updated_at ? new Date(pg.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    xml += `  <url>\n    <loc>${host}/p/${pg.slug}</loc>\n    <lastmod>${modDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  });

  xml += '</urlset>';

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Dynamic Robots.txt
router.get('/robots.txt', (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  let text = `User-agent: *\n`;
  text += `Disallow: /admin/\n`;
  text += `Disallow: /download/\n`;
  text += `Allow: /\n\n`;
  text += `Sitemap: ${host}/sitemap.xml\n`;

  res.header('Content-Type', 'text/plain');
  res.send(text);
});

// Dynamic RSS 2.0 Feed Generator
function generateRssFeed(req, res) {
  const host = `${req.protocol}://${req.get('host')}`;
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });

  const posts = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
    ORDER BY p.created_at DESC
    LIMIT 30
  `).all();

  const siteName = settings.site_name || 'Khanza.NET';
  const siteDesc = settings.site_description || 'Portal download software Windows, Mac, game PC repack full version gratis.';

  let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
  rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  rss += '  <channel>\n';
  rss += `    <title>${siteName}</title>\n`;
  rss += `    <link>${host}</link>\n`;
  rss += `    <description>${siteDesc}</description>\n`;
  rss += `    <language>id-ID</language>\n`;
  rss += `    <atom:link href="${host}/rss.xml" rel="self" type="application/rss+xml" />\n`;

  posts.forEach(p => {
    const pubDate = new Date(p.created_at || Date.now()).toUTCString();
    const cleanExcerpt = (p.excerpt || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
    const cleanTitle = (p.title || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });

    rss += '    <item>\n';
    rss += `      <title>${cleanTitle}</title>\n`;
    rss += `      <link>${host}/software/${p.slug}</link>\n`;
    rss += `      <guid isPermaLink="true">${host}/software/${p.slug}</guid>\n`;
    rss += `      <pubDate>${pubDate}</pubDate>\n`;
    rss += `      <category>${p.category_name || 'Software'}</category>\n`;
    rss += `      <description>${cleanExcerpt} (Versi: ${p.version || '-'}, Ukuran: ${p.file_size || '-'})</description>\n`;
    if (p.thumbnail) {
      rss += `      <enclosure url="${p.thumbnail}" type="image/jpeg" length="0" />\n`;
    }
    rss += '    </item>\n';
  });

  rss += '  </channel>\n';
  rss += '</rss>';

  res.header('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(rss);
}

router.get('/rss.xml', generateRssFeed);
router.get('/feed.xml', generateRssFeed);

// Bookmarks Page
router.get('/bookmarks', (req, res) => {
  const { popularPosts, recentUpdates } = getSidebarData();
  res.render('bookmarks', {
    title: 'Koleksi Favorit Saya',
    popularPosts,
    recentUpdates,
    formatDate,
    formatNumber
  });
});

module.exports = router;
