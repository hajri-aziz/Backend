const express = require("express");
const router = express.Router();
const evenementController = require("../Controller/PlanningController");
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');


/**
 * @swagger
 * tags:
 *   name: Événements
 *   description: Gestion des événements et des inscriptions
 */

/**
 * @swagger
 * /apis/evenements:
 *   post:
 *     summary: Ajouter un événement
 *     tags: [Événements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Événement ajouté avec succès
 */
router.post("/evenements",authMiddleware,checkRole("admin","patient"), evenementController.addEvenement);

/**
 * @swagger
 * /apis/evenements:
 *   get:
 *     summary: Obtenir la liste de tous les événements
 *     tags: [Événements]
 *     responses:
 *       200:
 *         description: Liste des événements
 */
router.get("/evenements",authMiddleware,checkRole("admin","patient"), evenementController.getAllEvenements);

/**
 * @swagger
 * /apis/evenements/{id}:
 *   get:
 *     summary: Obtenir un événement par son ID
 *     tags: [Événements]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'événement
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de l'événement
 */
router.get("/evenements/:id",authMiddleware,checkRole("admin","patient"), evenementController.getEvenementById);

/**
 * @swagger
 * /apis/evenements/{id}:
 *   put:
 *     summary: Mettre à jour un événement
 *     tags: [Événements]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'événement à modifier
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: Événement mis à jour
 */
router.put("/evenements/:id",authMiddleware,checkRole("admin","patient"), evenementController.updateEvenement);

/**
 * @swagger
 * /apis/evenements/{id}:
 *   delete:
 *     summary: Supprimer un événement
 *     tags: [Événements]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'événement à supprimer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Événement supprimé
 */
router.delete("/evenements/:id",authMiddleware,checkRole("admin","patient"), evenementController.deleteEvenement);

/**
 * @swagger
 * /apis/inscriptions:
 *   post:
 *     summary: Inscrire un patient à un événement
 *     tags: [Événements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_evenement:
 *                 type: string
 *               id_patient:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient inscrit
 */
router.post("/inscriptions",authMiddleware,checkRole("admin","patient"), evenementController.inscrireEvenement);

/**
 * @swagger
 * /apis/inscriptions/{id_evenement}:
 *   get:
 *     summary: Obtenir les inscriptions pour un événement
 *     tags: [Événements]
 *     parameters:
 *       - name: id_evenement
 *         in: path
 *         required: true
 *         description: ID de l'événement
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des inscriptions
 */
router.get("/inscriptions/:id_evenement",authMiddleware,checkRole("admin","patient"), evenementController.getInscriptionsByEvenement);

/**
 * @swagger
 * /apis/inscriptions/{id_evenement}/{id_patient}:
 *   delete:
 *     summary: Annuler l'inscription d'un patient à un événement
 *     tags: [Événements]
 *     parameters:
 *       - name: id_evenement
 *         in: path
 *         required: true
 *         description: ID de l'événement
 *         schema:
 *           type: string
 *       - name: id_patient
 *         in: path
 *         required: true
 *         description: ID du patient
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inscription annulée
 */
router.delete("/inscriptions/:id_evenement/:id_patient",authMiddleware,checkRole("admin","patient"), evenementController.annulerInscription);

module.exports = router;
