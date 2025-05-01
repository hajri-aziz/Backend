// routes/CoursCategory.js

const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../Controller/CoursController');
const validateBody = require('../Middll/validateBody');
const { validateCourseCategory } = require('../Middll/ValidateCours');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: CourseCategories
 *   description: API de gestion des catégories de cours
 */

/**
 * @swagger
 * /api/coursecategories/all:
 *   get:
 *     summary: Récupérer toutes les catégories de cours
 *     tags: [CourseCategories]
 *     responses:
 *       200:
 *         description: Liste des catégories renvoyée
 */
router.get('/all', getAllCategories);

/**
 * @swagger
 * /api/coursecategories/get/{id}:
 *   get:
 *     summary: Récupérer une catégorie par ID
 *     tags: [CourseCategories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie trouvée
 *       404:
 *         description: Catégorie non trouvée
 */
router.get('/get/:id', getCategoryById);

/**
 * @swagger
 * /api/coursecategories/add:
 *   post:
 *     summary: Créer une nouvelle catégorie de cours (admin uniquement)
 *     tags: [CourseCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseCategory'
 *     responses:
 *       201:
 *         description: Catégorie créée
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
  validateBody(validateCourseCategory),
  createCategory
);

/**
 * @swagger
 * /api/coursecategories/update/{id}:
 *   put:
 *     summary: Mettre à jour une catégorie de cours (admin uniquement)
 *     tags: [CourseCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseCategory'
 *     responses:
 *       200:
 *         description: Catégorie mise à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Catégorie non trouvée
 */
router.put(
  '/update/:id',
  authMiddleware,
  checkRole('admin'),
  validateBody(validateCourseCategory),
  updateCategory
);

/**
 * @swagger
 * /api/coursecategories/delete/{id}:
 *   delete:
 *     summary: Supprimer une catégorie de cours (admin uniquement)
 *     tags: [CourseCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie supprimée
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Catégorie non trouvée
 */
router.delete(
  '/delete/:id',
  authMiddleware,
  checkRole('admin'),
  deleteCategory
);

module.exports = router;
