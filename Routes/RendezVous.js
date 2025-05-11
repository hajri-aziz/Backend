const express = require("express");
const router = express.Router();
const rendezVousController = require("../Controller/PlanningController");
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');


/**
 * @swagger
 * tags:
 *   name: RendezVous
 *   description: Gestion des rendez-vous
 */

/**
 * @swagger
 * /apis/rendezVous:
 *   post:
 *     summary: Ajouter un rendez-vous
 *     tags: [RendezVous]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               id_patient:
 *                 type: string
 *               id_psychologue:
 *                 type: string
 *               statut:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rendez-vous ajouté
 */
router.post("/rendezVous",authMiddleware,checkRole("admin","patient"), rendezVousController.addRendezVous);

/**
 * @swagger
 * /apis/rendezVous:
 *   get:
 *     summary: Récupérer tous les rendez-vous
 *     tags: [RendezVous]
 *     responses:
 *       200:
 *         description: Liste de tous les rendez-vous
 */
router.get("/rendezVous",authMiddleware,checkRole("admin","patient"), rendezVousController.getAllRendezVous);

/**
 * @swagger
 * /apis/rendezVousById/{id}:
 *   get:
 *     summary: Récupérer un rendez-vous par ID
 *     tags: [RendezVous]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du rendez-vous
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du rendez-vous
 */
router.get("/rendezVousById/:id",authMiddleware,checkRole("admin","patient"), rendezVousController.getRendezVousById);

/**
 * @swagger
 * /apis/rendezVous/Psychologue/{id_psychologue}:
 *   get:
 *     summary: Récupérer les rendez-vous d’un psychologue
 *     tags: [RendezVous]
 *     parameters:
 *       - name: id_psychologue
 *         in: path
 *         required: true
 *         description: ID du psychologue
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des rendez-vous
 */
router.get("/rendezVous/Psychologue/:id_psychologue",authMiddleware,checkRole("admin","patient"), rendezVousController.getRendezVousByPsychologue);

/**
 * @swagger
 * /apis/rendezVous/{id}:
 *   put:
 *     summary: Mettre à jour un rendez-vous
 *     tags: [RendezVous]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du rendez-vous à mettre à jour
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
 *                 format: date-time
 *               statut:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rendez-vous mis à jour
 */
router.put("/rendezVous/:id",authMiddleware,checkRole("admin","patient"), rendezVousController.updateRendezVous);

/**
 * @swagger
 * /apis/rendezVous/{id}:
 *   delete:
 *     summary: Supprimer un rendez-vous
 *     tags: [RendezVous]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID du rendez-vous
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rendez-vous supprimé
 */
router.delete("/rendezVous/:id",authMiddleware,checkRole("admin","patient"), rendezVousController.deleteRendezVous);

/**
 * @swagger
 * /apis/rendezVous/statut/{statut}:
 *   get:
 *     summary: Récupérer les rendez-vous par statut
 *     tags:
 *       - RendezVous
 *     parameters:
 *       - in: path
 *         name: statut
 *         required: true
 *         schema:
 *           type: string
 *           description: Statut du rendez-vous (en attente, confirmé, annulé)
 *     responses:
 *       200:
 *         description: Liste des rendez-vous filtrés par statut
 */
router.get("/rendezVous/statut/:statut",authMiddleware,checkRole("admin","patient"), rendezVousController.getRendezVousByStatut);


module.exports = router;
