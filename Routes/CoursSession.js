// routes/CoursSession.js

const express = require('express');
const router = express.Router();

const {
  createCoursSession,
  getAllCoursSessions,
  getCoursSessionById,
  updateCoursSession,
  deleteCoursSession,
  inscrireCoursSession,
  getInscriptionsBySession,
  annulerInscription,
  getSessionsByUser,
  getSessionsByCours,
  bookTimeSlot
} = require('../Controller/CoursController');

const validateBody = require('../Middll/validateBody');
const { validateCoursSession, validateSessionInscription } = require('../Middll/ValidateCours');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: CourseSessions
 *   description: API de gestion des sessions de cours et inscriptions
 */

/**
 * @swagger
 * /api/courssessions/all:
 *   get:
 *     summary: Récupérer toutes les sessions de cours
 *     tags: [CourseSessions]
 *     responses:
 *       200:
 *         description: Liste des sessions renvoyée
 */
router.get('/all', getAllCoursSessions);

/**
 * @swagger
 * /api/courssessions/get/{id}:
 *   get:
 *     summary: Récupérer une session par ID
 *     tags: [CourseSessions]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Session trouvée
 *       404:
 *         description: Session non trouvée
 */
router.get('/get/:id', getCoursSessionById);

/**
 * @swagger
 * /api/courssessions/add:
 *   post:
 *     summary: Créer une nouvelle session de cours (instructor, admin)
 *     tags: [CourseSessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - cours_id
 *               - video_url
 *               - duration
 *               - startdate
 *               - enddate
 *               - location
 *               - capacity
 *               - status
 *             properties:
 *               title:
 *                 type: string
 *               cours_id:
 *                 type: string
 *               video_url:
 *                 type: string
 *               duration:
 *                 type: object
 *                 required: [amount]
 *                 properties:
 *                   amount:
 *                     type: number
 *                     description: Durée en minutes
 *                   unit:
 *                     type: string
 *                     enum: [minutes]
 *                     default: minutes
 *               startdate:
 *                 type: string
 *                 format: date-time
 *               enddate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active,inactive,completed,scheduled,in-progress,cancelled]
 *     responses:
 *       201:
 *         description: Session créée
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
  checkRole('instructor','admin'),
  validateBody(validateCoursSession), // ✅ Bonne validation
  createCoursSession
);

/**
 * @swagger
 * /api/courssessions/update/{id}:
 *   put:
 *     summary: Mettre à jour une session de cours (instructor, admin)
 *     tags: [CourseSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CoursSession'
 *     responses:
 *       200:
 *         description: Session mise à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Session non trouvée
 */
router.put(
  '/update/:id',
  authMiddleware,
  checkRole('instructor','admin'),
  validateBody(validateCoursSession),
  updateCoursSession
);

/**
 * @swagger
 * /api/courssessions/delete/{id}:
 *   delete:
 *     summary: Supprimer une session de cours (instructor, admin)
 *     tags: [CourseSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la session
 *     responses:
 *       200:
 *         description: Session supprimée
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Session non trouvée
 */
router.delete(
  '/delete/:id',
  authMiddleware,
  checkRole('instructor','admin'),
  deleteCoursSession
);

/**
 * @swagger
 * /api/courssessions/{session_id}/inscriptions:
 *   post:
 *     summary: Inscrire un utilisateur à une session (etudiant, student, instructor, admin)
 *     tags: [CourseSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: session_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SessionInscription'
 *     responses:
 *       201:
 *         description: Inscription réussie
 *       400:
 *         description: Déjà inscrit ou capacité atteinte
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Session non trouvée
 */
router.post(
  '/:session_id/inscriptions',
  authMiddleware,
  checkRole('etudiant','student','instructor','admin'),
  validateBody(validateSessionInscription),
  inscrireCoursSession
);

/**
 * @swagger
 * /api/courssessions/{session_id}/inscriptions:
 *   get:
 *     summary: Lister les inscriptions d’une session (instructor, admin)
 *     tags: [CourseSessions]
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
 *         description: Liste des inscriptions
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Session non trouvée
 */
router.get(
  '/:session_id/inscriptions',
  authMiddleware,
  checkRole('instructor','admin'),
  getInscriptionsBySession
);

/**
 * @swagger
 * /api/courssessions/{session_id}/inscriptions/{user_id}:
 *   delete:
 *     summary: Annuler l'inscription d'un utilisateur (etudiant, student, instructor, admin)
 *     tags: [CourseSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: session_id
 *         in: path
 *         required: true
 *       - name: user_id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Inscription annulée
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Session ou inscription non trouvée
 */
router.delete(
  '/:session_id/inscriptions/:user_id',
  authMiddleware,
  checkRole('etudiant','student','instructor','admin'),
  annulerInscription
);

/**
 * @swagger
 * /api/courssessions/{session_id}/book:
 *   post:
 *     summary: Réserver un créneau horaire pour une session (etudiant, student, instructor, admin)
 *     tags: [CourseSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: session_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - date
 *               - time
 *               - motif
 *             properties:
 *               user_id:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               motif:
 *                 type: string
 *     responses:
 *       201:
 *         description: Créneau réservé avec succès
 *       400:
 *         description: Créneau déjà réservé
 *       404:
 *         description: Session non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.post(
  '/:session_id/book',
  authMiddleware,
  checkRole('etudiant','student', 'instructor', 'admin'),
  bookTimeSlot
);


/**
 * @swagger
 * /api/courssessions/users/{user_id}/sessions:
 *   get:
 *     summary: Lister les sessions d’un utilisateur (etudiant, student, instructor, admin)
 *     tags: [CourseSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Liste des sessions
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 */
router.get(
  '/users/:user_id/sessions',
  authMiddleware,
  checkRole('etudiant','student','instructor','admin'),
  getSessionsByUser
);
router.get('/by-cours/:cours_id', getSessionsByCours);
/**
 * @swagger
 * /api/courssessions/{session_id}/bookings:
 *   get:
 *     summary: Récupérer tous les créneaux réservés pour une session (admin, instructor)
 *     tags: [CourseSessions]
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
 *         description: Liste des réservations
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé, rôle insuffisant
 *       404:
 *         description: Session non trouvée
 */
router.get(
  '/:session_id/bookings',
  authMiddleware,
  checkRole('instructor', 'admin'),
  async (req, res) => {
    try {
      const session = await CoursSession.findById(req.params.session_id);
      if (!session) return res.status(404).json({ message: 'Session non trouvée' });
      res.status(200).json(session.bookings || []);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);



module.exports = router;
