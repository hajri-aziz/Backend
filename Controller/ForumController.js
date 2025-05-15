const Post = require('../Models/Post');
const Commentaire = require('../Models/Commentaire');
const Message = require('../Models/Message');
const Group = require('../Models/Group');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = mongoose.models.user || mongoose.model('user');
const validator = require('validator'); // Added import
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
        image: req.file ? `/uploads/${req.file.filename}` : undefined,
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
        
            // Vérifie que l'ID est bien un ObjectId valide
            if (!mongoose.Types.ObjectId.isValid(postId)) {
              return res.status(400).json({ message: "ID de post invalide" });
            }
        
            // Récupère le post
            const post = await Post.findById(postId).populate('idAuteur', 'nom prenom profileImage');
            if (!post) {
              return res.status(404).json({ message: "Post non trouvé" });
            }
        
            // Récupère les commentaires associés à ce post
            const commentaires = await Commentaire.find({ idPost: postId })
              .populate('idAuteur', 'nom prenom profileImage') // Affiche infos de l'auteur
        
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

     
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.query;
    // logiques pour récupérer les messages d'une conversation
    res.status(200).json({ message: `Messages de la conversation ${conversationId}` });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getUserConversations = async (req, res) => {
  try {
    const userId = req.params.userId;
    // logiques pour récupérer les conversations de l'utilisateur
    res.status(200).json({ message: `Conversations pour l'utilisateur ${userId}` });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
const toggleReaction = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const { reaction } = req.body;
    // logiques pour ajouter ou retirer une réaction
    res.status(200).json({ message: `Réaction ${reaction} appliquée au message ${messageId}` });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getUserGroups = async (req, res) => {
  try {
    // Récupérer l'ID utilisateur depuis le token (ajouté par le middleware auth)
    const userId = req.user.id; // Utilisez le champ id du token
    
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié.' });
    }

    // Récupérer tous les groupes où l'utilisateur est membre, admin ou créateur
    const groups = await Group.find({ 
      $or: [
        { members: userId },
        { admins: userId },
        { creator: userId }
      ] 
    })
      .populate('creator', 'nom prenom profileImage')
      .populate('members', 'nom prenom profileImage')
      .populate('admins', 'nom prenom profileImage')
      
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des groupes.' });
  }
};

// Méthode pour créer un groupe (mise à jour pour utiliser l'ID du token)
const createGroup = async (req, res) => {
  try {
    const { name, creator, members, admins, lastMessage } = req.body;

    if (!creator) {
      return res.status(400).json({ error: 'Le champ creator est requis.' });
    }

    const group = new Group({
      name,
      creator,
      members,
      admins,
      lastMessage
    });

    const savedGroup = await group.save();
    res.status(201).json({ message: `Groupe ${name} créé`, group: savedGroup });

  } catch (err) {
    console.error(err); // pour debugger
    res.status(500).json({ error: 'Erreur serveur lors de la création du groupe.' });
  }
};

// Méthode pour ajouter un membre à un groupe
const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId: memberToAdd } = req.body;
    const currentUserId = req.userData.userId;

    // Vérifier si le groupe existe
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé.' });
    }

    // Vérifier si l'utilisateur actuel est admin ou créateur du groupe
    if (group.creator.toString() !== currentUserId && !group.admins.includes(currentUserId)) {
      return res.status(403).json({ error: 'Vous n\'avez pas les droits pour ajouter des membres à ce groupe.' });
    }

    // Vérifier si le membre est déjà dans le groupe
    if (group.members.includes(memberToAdd)) {
      return res.status(400).json({ error: 'Cet utilisateur est déjà membre du groupe.' });
    }

    // Ajouter le membre au groupe
    group.members.push(memberToAdd);
    await group.save();

    // Retourner le groupe mis à jour avec les informations des membres
    const updatedGroup = await Group.findById(groupId)
      .populate('creator', 'nom prenom profileImage')
      .populate('members', 'nom prenom profileImage')
      .populate('admins', 'nom prenom profileImage');

    res.status(200).json({ message: 'Membre ajouté au groupe', group: updatedGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du membre au groupe.' });
  }
};
const getUserByEmail = async (email) => {
  console.log('Recherche de l\'utilisateur avec email:', email);
  try {
    const user = await User.findOne({ email });
    console.log('Utilisateur trouvé:', user);
    return user;
  } catch (error) {
    console.error('Erreur lors de la recherche de l\'utilisateur par email:', error);
    throw error;
  }
};


// Backend/Controller/ForumController.js
// Backend/Controller/ForumController.js
const addMemberByEmail = async (req, res) => {
  try {
    const { groupId, email } = req.body;
    const userId = req.user?.id;

    console.log('🆔 User ID from JWT:', userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.log('❌ Erreur: userId invalide ou manquant:', userId);
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié ou ID invalide',
      });
    }

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de groupe invalide',
      });
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Adresse email invalide',
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé',
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ Email non trouvé dans la base de données: ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Utilisateur non trouvé dans la base de données',
      });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === user._id.toString()
    );
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur est déjà membre du groupe',
      });
    }

    group.members.push(user._id);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .populate('admins', 'name email');

    res.status(200).json({
      success: true,
      message: 'Membre ajouté avec succès',
      group: updatedGroup,
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du membre au groupe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


    module.exports={
        addPost,
        getallPost,
        getPostById,
        deletePost,
        updatePost,
        addCommentaire,
        getallCommentaire,
        getPostAvecCommentaires,
        getCommentaireById,
        deleteComment,
        updateComment,
        getConversationMessages,
        getUserConversations,
        toggleReaction,
        createGroup,
        getUserGroups,
        addMemberToGroup,
        getUserByEmail,
        addMemberByEmail
       
        
    }