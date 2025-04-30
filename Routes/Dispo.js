const express = require("express");
const router = express.Router();
const dispoController = require("../Controller/PlanningController");
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');


/**
 * @swagger
 * tags:
 *   name: Disponibilités
 *   description: Gestion des disponibilités
 */

/**
 * @swagger
 * /apis/disponibilite:
 *   post:
 *     summary: Ajouter une nouvelle disponibilité
 *     tags:
 *       - Disponibilités
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               heure:
 *                 type: string
 *               statut:
 *                 type: string
 *               id_psychologue:
 *                 type: string
 *     responses:
 *       201:
 *         description: Disponibilité ajoutée avec succès
 */
router.post("/disponibilite", authMiddleware,checkRole("admin"), dispoController.addDisponibilite);

/**
 * @swagger
 * /apis/disponibilites:
 *   get:
 *     summary: Récupérer toutes les disponibilités
 *     tags:
 *       - Disponibilités
 *     responses:
 *       200:
 *         description: Liste des disponibilités
 */
router.get("/disponibilites",authMiddleware,checkRole("admin"), dispoController.getAllDisponibilites);

/**
 * @swagger
 * /apis/disponibilitesByid/{id}:
 *   get:
 *     summary: Récupérer une disponibilité par ID
 *     tags:
 *       - Disponibilités
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la disponibilité
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de la disponibilité
 */
router.get("/disponibilitesByid/:id",authMiddleware,checkRole("admin"), dispoController.getDisponibiliteById);

/**
 * @swagger
 * /apis/disponibilites/psychologue/{id_psychologue}:
 *   get:
 *     summary: Récupérer les disponibilités d'un psychologue
 *     tags:
 *       - Disponibilités
 *     parameters:
 *       - name: id_psychologue
 *         in: path
 *         required: true
 *         description: ID du psychologue
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des disponibilités du psychologue
 */
router.get("/disponibilites/psychologue/:id_psychologue",authMiddleware,checkRole("admin"), dispoController.getDisponibilitesByPsychologue);

/**
 * @swagger
 * /apis/disponibilites/statut/{statut}:
 *   get:
 *     summary: Récupérer les disponibilités par statut
 *     tags:
 *       - Disponibilités
 *     parameters:
 *       - name: statut
 *         in: path
 *         required: true
 *         description: Statut de la disponibilité (disponible, occupé, etc.)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des disponibilités filtrées par statut
 */
router.get("/disponibilites/statut/:statut",authMiddleware,checkRole("admin"), dispoController.getDisponibilitesByStatut);

/**
 * @swagger
 * /apis/disponibilites/{id}:
 *   delete:
 *     summary: Supprimer une disponibilité par ID
 *     tags:
 *       - Disponibilités
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la disponibilité
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Disponibilité supprimée
 */
router.delete("/disponibilites/:id",authMiddleware,checkRole("admin"), dispoController.deleteDisponibilite);

/**
 * @swagger
 * /apis/disponibilites/{id}:
 *   put:
 *     summary: Mettre à jour une disponibilité
 *     tags:
 *       - Disponibilités
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la disponibilité
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               heure:
 *                 type: string
 *               statut:
 *                 type: string
 *     responses:
 *       200:
 *         description: Disponibilité mise à jour
 */
router.put("/disponibilites/:id",authMiddleware,checkRole("admin"), dispoController.updateDisponibilite);

module.exports = router;
