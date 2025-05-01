// Config/uploadConfig.js
const multer  = require('multer');
const path    = require('path');

// Storage dynamique selon le fieldname
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // si on uploade la photo de profil…
    if (file.fieldname === 'photo') {
      return cb(null, path.join(__dirname, '../uploads/profiles'));
    }
    // si on uploade l'image d'un cours…
    if (file.fieldname === 'image') {
      return cb(null, path.join(__dirname, '../uploads/cours'));
    }
    // sinon dossier générique
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    // on garde un nom unique
    const uniqueName = Date.now() + '-' + Math.round(Math.random()*1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

// On n’accepte que les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées'), false);
  }
};

module.exports = multer({ storage, fileFilter });
