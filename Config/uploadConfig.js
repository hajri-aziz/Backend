const multer = require('multer');
const path = require('path'); 

// Définir où stocker les fichiers uploadés
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/profiles'));  // Le dossier où les images seront stockées
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);  // Le nom du fichier final
  }
});

// Filtrer les types de fichiers acceptés (ici seulement les images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);  // Accepter le fichier
  } else {
    cb(new Error('Seules les images sont autorisées'), false);  // Refuser si ce n'est pas une image
  }
};

// Créer l'instance de multer avec les options
const upload = multer({ storage, fileFilter });

module.exports = upload;
