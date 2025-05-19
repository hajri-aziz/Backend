// routes/Cours.js

const express = require('express');
const router = express.Router();

const {
  createCours,
  getAllCours,
  getCoursById,
  updateCours,
  deleteCours,
  getCoursByCategory,
  getCoursByPrice,
  getCoursByPopularity,
  searchCours,
  sendSessionReminders
} = require('../Controller/CoursController');

const validateBody = require('../Middll/validateBody');
const { validateCours } = require('../Middll/ValidateCours');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const upload = require('../Config/uploadConfig');

/**
 * @swagger
 * tags:
 *   name: Cours
 *   description: API de gestion des cours
 */

// Lister tous les cours
/**
 * @swagger
 * /api/cours/all:
 *   get:
 *     summary: Récupérer tous les cours
 *     tags: [Cours]
 *     responses:
 *       200:
 *         description: Liste des cours renvoyée
 */
router.get('/all', getAllCours);

// Récupérer un cours par ID
/**
 * @swagger
 * /api/cours/get/{id}:
 *   get:
 *     summary: Récupérer un cours par ID
 *     tags: [Cours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cours trouvé
 *       404:
 *         description: Cours non trouvé
 */
router.get('/get/:id', getCoursById);

// Créer un nouveau cours
/**
 * @swagger
 * /api/cours/add:
 *   post:
 *     summary: Créer un nouveau cours (instructor, admin)
 *     tags: [Cours]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - category_id
 *               - instructor_id
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 description: Montant du cours en TND
 *               currency:
 *                 type: string
 *                 enum: [TND]
 *                 default: TND
 *                 description: Devise (TND)
 *               category_id:
 *                 type: string
 *               instructor_id:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Cours créé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 */
router.post(
  '/add',
  authMiddleware,
  checkRole('admin'),
  upload.single('image'),
  validateBody(validateCours),
  createCours
);

// Mettre à jour un cours
/**
 * @swagger
 * /api/cours/update/{id}:
 *   put:
 *     summary: Mettre à jour un cours (instructor, admin)
 *     tags: [Cours]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 description: Montant en TND
 *               currency:
 *                 type: string
 *                 enum: [TND]
 *                 default: TND
 *               category_id:
 *                 type: string
 *               instructor_id:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cours mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Cours non trouvé
 */
router.put(
  '/update/:id',
  authMiddleware,
  checkRole('admin'),
  upload.single('image'),
  validateBody(validateCours),
  updateCours
);

// Supprimer un cours
/**
 * @swagger
 * /api/cours/delete/{id}:
 *   delete:
 *     summary: Supprimer un cours (instructor, admin)
 *     tags: [Cours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cours supprimé
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Cours non trouvé
 */
router.delete(
  '/delete/:id',
  authMiddleware,
  checkRole('admin'),
  deleteCours
);

/**
 * @swagger
 * /api/cours/category/{categoryId}:
 *   get:
 *     summary: Lister les cours d’une catégorie
 *     tags: [Cours]
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Liste des cours renvoyée
 */
router.get('/category/:categoryId', getCoursByCategory);

/**
 * @swagger
 * /api/cours/filter/price:
 *   get:
 *     summary: Filtrer les cours par prix
 *     tags: [Cours]
 *     parameters:
 *       - name: min
 *         in: query
 *         schema:
 *           type: number
 *       - name: max
 *         in: query
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Liste filtrée renvoyée
 */
router.get('/filter/price', getCoursByPrice);

/**
 * @swagger
 * /api/cours/filter/popularity:
 *   get:
 *     summary: Lister les cours populaires
 *     tags: [Cours]
 *     responses:
 *       200:
 *         description: Liste des cours populaires
 */
router.get('/filter/popularity', getCoursByPopularity);

/**
 * @swagger
 * /api/cours/search:
 *   get:
 *     summary: Rechercher des cours par mot-clé
 *     tags: [Cours]
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Résultats de la recherche
 *       400:
 *         description: Terme manquant
 */
router.get('/search', searchCours);

/**
 * @swagger
 * /api/cours/sessions/{session_id}/notify:
 *   post:
 *     summary: Envoyer des rappels pour une session (instructor, admin)
 *     tags: [Cours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: session_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Rappels envoyés
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Session non trouvée
 */
router.post(
  '/sessions/:session_id/notify',
  authMiddleware,
  checkRole('instructor','admin'),
  sendSessionReminders
);

module.exports = router;
