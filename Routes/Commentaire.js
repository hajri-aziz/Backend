const express = require("express");
const router = express.Router();
const commentController = require("../Controller/ForumController");

/**
 * @swagger
 * /commentaire/addComment:
 *   post:
 *     summary: Ajouter un nouveau commentaire
 *     tags: [Commentaires]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contenu:
 *                 type: string
 *               postId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Commentaire ajouté avec succès
 */
router.post("/addComment", commentController.addCommentaire);

/**
 * @swagger
 * /commentaire/getallComment:
 *   get:
 *     summary: Récupérer tous les commentaires
 *     tags: [Commentaires]
 *     responses:
 *       200:
 *         description: Liste des commentaires
 */
router.get("/getallComment", commentController.getallCommentaire);

/**
 * @swagger
 * /commentaire/getCommentbyId/{id}:
 *   get:
 *     summary: Récupérer un commentaire par ID
 *     tags: [Commentaires]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du commentaire
 *     responses:
 *       200:
 *         description: Commentaire trouvé
 */
router.get("/getCommentbyId/:id", commentController.getCommentaireById);

/**
 * @swagger
 * /commentaire/deleteComment/{id}:
 *   delete:
 *     summary: Supprimer un commentaire
 *     tags: [Commentaires]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du commentaire à supprimer
 *     responses:
 *       200:
 *         description: Commentaire supprimé avec succès
 */
router.delete("/deleteComment/:id", commentController.deleteComment);

/**
 * @swagger
 * /commentaire/updateComment/{id}:
 *   put:
 *     summary: Mettre à jour un commentaire
 *     tags: [Commentaires]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du commentaire à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contenu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Commentaire mis à jour avec succès
 */
router.put("/updateComment/:id", commentController.updateComment);

module.exports = router;
