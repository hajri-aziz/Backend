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

// 🔧 Import uniquement la fonction nécessaire
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Cours:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - category_id
 *         - instructor_id
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         category_id:
 *           type: string
 *         instructor_id:
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
 * /api/cours/add:
 *   post:
 *     summary: Ajouter un nouveau cours
 *     tags: [Cours]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cours'
 *     responses:
 *       200:
 *         description: Cours ajouté avec succès
 */
router.post('/add', createCours);

router.get('/all', getAllCours);
router.get('/get/:id', getCoursById);
router.put('/update/:id', updateCours);
router.delete('/delete/:id', deleteCours);
router.get('/category/:categoryId', getCoursByCategory);
router.get('/filter/price', getCoursByPrice);
router.get('/filter/popularity', getCoursByPopularity);
router.get('/search', searchCours);

/**
 * @swagger
 * /api/cours/sessions/{session_id}/notify:
 *   post:
 *     summary: Envoyer des rappels pour une session de cours
 *     tags: [Cours]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rappels envoyés avec succès
 */
router.post('/sessions/:session_id/notify', authMiddleware, sendSessionReminders);

module.exports = router;
