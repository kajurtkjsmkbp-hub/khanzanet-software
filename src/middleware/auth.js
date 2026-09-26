const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getAllSettings, getAllCategories } = require('../utils/helpers');

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max image size
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (jpg, png, webp, gif, svg) yang diperbolehkan!'));
    }
  }
});

// Middleware to protect admin routes
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/admin/login?error=' + encodeURIComponent('Silakan login terlebih dahulu untuk mengakses CMS.'));
}

// Global view locals middleware
function globalLocals(req, res, next) {
  res.locals.settings = getAllSettings();
  res.locals.navCategories = getAllCategories();
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.currentPath = req.path;
  res.locals.query = req.query;
  next();
}

module.exports = {
  upload,
  requireAuth,
  globalLocals
};
