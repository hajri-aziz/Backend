const Post = require('../models/Post');
const Commentaire = require('../models/Commentaire');
const Message = require('../models/Message');
const Group = require('../models/Group');
const mongoose = require('mongoose');
const User = mongoose.models.user || mongoose.model('user');
//const Post = mongoose.models.Post || mongoose.model('Post');
  //*********************CRUD POST******************* ******************************/
 
  async function addPost(req, res) {
    try {
      console.log("Fichier reçu:", req.file);
  
      const userId = req.body.idAuteur;
  
      // Vérifie que l'utilisateur existe
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: "L'utilisateur avec cet ID n'existe pas." });
      }
  
      const post = new Post({
        idAuteur: userId,
        titre: req.body.titre,
        contenu: req.body.contenu,
        date_creation: new Date().toISOString(),
        likes: [],
        image: req.file ? req.file.path : null
      });
  
      await post.save();
  
      res.status(201).json({
        message: "Post ajouté avec succès",
        post
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de l'ajout du post" });
    }
  }
  async function getallPost(req, res) {
        try {
          const post = await Post.find();
      
          res.status(200).json(post);
        } catch (err) {
          console.log(err);
        }
      }
  async function getPostById(req, res) {
          try {
            const post = await Post.findById(req.params.id);
        
            res.status(200).json(post);
          } catch (err) {
            console.log(err);
          }
        }
  async function getPostAvecCommentaires(req, res) {
          try {
            const postId = req.params.id;
        
            // Récupère le post
            const post = await Post.findById(postId);
            if (!post) {
              return res.status(404).json({ message: "Post non trouvé" });
            }
        
            // Récupère les commentaires associés à ce post
            const commentaires = await Commentaire.find({ idPost: postId })
              .populate('idAuteur', 'nom prenom profileImage'); // optionnel : pour afficher les infos auteur
        
            res.status(200).json({
              post,
              commentaires
            });
          } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Erreur lors de la récupération du post" });
          }
        }
  async function deletePost(req, res) {
            try {
              const post = await Post.findByIdAndDelete(req.params.id);
          
              res.status(200).json(post);
            } catch (err) {
              console.log(err);
            }
          }
  async function updatePost(req, res) {
            try {
              const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
              });
          
              res.status(200).json(post);
            } catch (err) {
              console.log(err);
            }
          }

 //*********************CRUD COMMENTAIRE******************* */

 async function addCommentaire(req, res) {
  try {
    const { idAuteur, idPost, contenu } = req.body;

    // Vérifie que l'utilisateur existe
    const userExists = await User.findById(idAuteur);
    if (!userExists) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifie que le post existe
    const postExists = await Post.findById(idPost);
    if (!postExists) {
      return res.status(404).json({ message: "Post non trouvé" });
    }

    // Crée le commentaire
    const comment = new Commentaire({
      idAuteur,
      idPost,
      contenu,
      date_creation: new Date().toISOString()
    });

    await comment.save();

    res.status(201).json({
      message: "Commentaire ajouté avec succès",
      comment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'ajout du commentaire" });
  }
}
 async function getallCommentaire(req, res) {
    try {
      const comment = await Commentaire.find();
  
      res.status(200).json(comment);
    } catch (err) {
      console.log(err);
    }
      }

async function getCommentaireById(req, res) {
      try {
        const comment = await Commentaire.findById(req.params.id);
    
        res.status(200).json(comment);
      } catch (err) {
        console.log(err);
      }
      }
async function deleteComment(req, res) {
        try {
          const comment = await Commentaire.findByIdAndDelete(req.params.id);
      
          res.status(200).json(comment);
        } catch (err) {
          console.log(err);
        }
      }

async function updateComment(req, res) {
        try {
          const comment = await Commentaire.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
          });
      
          res.status(200).json(comment);
        } catch (err) {
          console.log(err);
        }
      }
//***********************************CRUD Group******************* ************************************/

     

     



    module.exports={
        addPost,
        getallPost,
        getPostById,
        deletePost,
        updatePost,
        addCommentaire,
        getallCommentaire,
        getCommentaireById,
        deleteComment,
        updateComment,
        //createGroup,
        //joinGroup,
        //getGroupMessages,
       // getUserGroups,
        //searchGroups,
        getPostAvecCommentaires
        
        
      
        
    }