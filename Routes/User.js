const express = require("express");
const router = express.Router();
const UserController = require('../Controller/UserController');
const validate = require('../Middll/ValidateUser');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const upload = require('../Config/uploadConfig');

/**
 * @swagger
 * /user/showusers:
 *   get:
 *     summary: Affiche tous les utilisateurs (admin uniquement)
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */
router.get('/showusers', authMiddleware, checkRole("admin"), UserController.showusers);

/**
 * @swagger
 * /user/showusers/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par ID
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 */
router.get('/showusers/:id', authMiddleware, UserController.showusersbyId);

/**
 * @swagger
 * /user/shownameuser/{username}:
 *   get:
 *     summary: Rechercher un utilisateur par nom d'utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom d'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 */
router.get('/shownameuser/:nom', authMiddleware, UserController.showByName);

/**
 * @swagger
 * /user/delete/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur (admin uniquement)
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé
 */
router.delete('/delete/:id', authMiddleware, checkRole("admin"), UserController.deleteusers);

/**
 * @swagger
 * /user/update/{id}:
 *   put:
 *     summary: Mettre à jour les informations d'un utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
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
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 */
router.put('/update/:id', authMiddleware, UserController.updateuser);

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé
 */
router.post('/register', validate, UserController.register);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Connexion utilisateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 */
router.post('/login', UserController.login);

/**
 * @swagger
 * /user/forgot-password:
 *   post:
 *     summary: Envoyer un OTP par e-mail pour réinitialiser le mot de passe
 *     tags: [Mot de passe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP envoyé
 */
router.post("/forgot-password", UserController.sendOTP);

/**
 * @swagger
 * /user/verify-otp:
 *   post:
 *     summary: Vérifier l'OTP et réinitialiser le mot de passe
 *     tags: [Mot de passe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 */
router.post("/verify-otp", UserController.verifyOTP);

/**
 * @swagger
 * /user/authorizeUser/{id}:
 *   put:
 *     summary: Autoriser un utilisateur (admin uniquement)
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Utilisateur autorisé
 */
router.put("/authorizeUser/:id", authMiddleware,checkRole("admin"), UserController.authorizeUser);

/**
 * @swagger
 * /user/activities:
 *   get:
 *     summary: Voir tout l'historique des activités (admin uniquement)
 *     tags: [Activités]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historique récupéré
 */
router.get('/activities', authMiddleware, checkRole("admin"), UserController.showActivities);

/**
 * @swagger
 * /user/activities/{userId}:
 *   get:
 *     summary: Voir l'historique d'un utilisateur spécifique
 *     tags: [Activités]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historique de l'utilisateur
 */
router.get('/activities/:userId', authMiddleware, UserController.showActivities);

/**
 * @swagger
 * /upload-profile-photo/{id}:
 *   put:
 *     summary: Mettre à jour la photo de profil d’un utilisateur
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: photo
 *         in: formData
 *         required: true
 *         type: file
 *         description: Image de profil à uploader
 *     responses:
 *       200:
 *         description: Photo mise à jour
 */
router.put('/upload-profile-photo/:id', authMiddleware, upload.single('photo'), UserController.uploadProfile);

module.exports = router;
