const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Ensure DB is initialized
require('./src/db');

const { globalLocals } = require('./src/middleware/auth');
const webRoutes = require('./src/routes/web');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Set template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser('khanzanet-secret-key-2026'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'khanzanet-super-secret-session-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Global locals (settings, categories, logged in user, current path)
app.use(globalLocals);

// Routes
app.use('/admin', adminRoutes);
app.use('/', webRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Halaman Tidak Ditemukan' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(500).render('500', {
    title: '500 - Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kendala pada server kami.'
  });
});

app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 Khanza.NET SOFTWARE Portal running on: http://localhost:${PORT}`);
  console.log(`🔑 Admin CMS Panel: http://localhost:${PORT}/admin`);
  console.log(`👤 Default Login: username: admin | password: admin123`);
  console.log('==================================================');
});
