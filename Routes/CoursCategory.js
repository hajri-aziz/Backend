
const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} = require('../Controller/CoursController'); 
/**
 * @swagger
 * components:
 *   schemas:
 *     CourseCategory:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: CourseCategories
 *   description: API de gestion des catégories de cours
 */


/**
 * @swagger
 * /api/coursecategories/add:
 *   post:
 *     summary: Créer une catégorie
 *     tags: [CourseCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseCategory'
 *     responses:
 *       201:
 *         description: Créée avec succès
 */
router.post('/add', createCategory);

/**
 * @swagger
 * /api/coursecategories/all:
 *   get:
 *     summary: Récupérer toutes les catégories
 *     tags: [CourseCategories]
 *     responses:
 *       200:
 *         description: Liste des catégories
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
 *     responses:
 *       200:
 *         description: Catégorie trouvée
 *       404:
 *         description: Catégorie non trouvée
 */
router.get('/get/:id', getCategoryById);

/**
 * @swagger
 * /api/coursecategories/update/{id}:
 *   put:
 *     summary: Modifier une catégorie
 *     tags: [CourseCategories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseCategory'
 *     responses:
 *       200:
 *         description: Mise à jour réussie
 */
router.put('/update/:id', updateCategory);

/**
 * @swagger
 * /api/coursecategories/delete/{id}:
 *   delete:
 *     summary: Supprimer une catégorie
 *     tags: [CourseCategories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supprimée avec succès
 */
router.delete('/delete/:id', deleteCategory);

module.exports = router;
