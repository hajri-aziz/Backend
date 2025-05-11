const express = require("express");
const router = express.Router();
const postController = require("../Controller/ForumController");
const upload = require('../Middll/uploads');
const { authMiddleware } = require('../Middll/authMiddleware');
const { addPost } = require('../Controller/ForumController');
const multer = require("multer");


  
/**
 * @swagger
 * /post/addPost:
 *   post:
 *     summary: Ajouter un nouveau post
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               contenu:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post créé avec succès
 */

// Configurer multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Dossier pour stocker l'image
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + file.originalname;
      cb(null, uniqueName);
    }
  });
  
router.post("/addPost",authMiddleware, upload.single('image'),addPost);

/**
 * @swagger
 * /post/getallPost:
 *   get:
 *     summary: Récupérer tous les posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Liste des posts
 */
router.get("/getallPost",authMiddleware,postController.getallPost);

/**
 * @swagger
 * /post/getPostbyId/{id}:
 *   get:
 *     summary: Récupérer un post par ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du post
 *     responses:
 *       200:
 *         description: Détails du post
 */
router.get("/getPostbyId/:id",authMiddleware, postController.getPostById);

/**
 * @swagger
 * /post/deletePost/{id}:
 *   delete:
 *     summary: Supprimer un post par ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du post à supprimer
 *     responses:
 *       200:
 *         description: Post supprimé avec succès
 */
router.delete("/deletePost/:id",authMiddleware,postController.deletePost);

/**
 * @swagger
 * /post/updatePost/{id}:
 *   put:
 *     summary: Mettre à jour un post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du post à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titre:
 *                 type: string
 *               contenu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post mis à jour avec succès
 */
router.put("/updatePost/:id", authMiddleware,postController.updatePost);
router.get("/getPostAvecCommentaires/:id",authMiddleware, postController.getPostAvecCommentaires);

module.exports = router;
