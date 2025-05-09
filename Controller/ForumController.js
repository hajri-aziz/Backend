const Post = require('../Models/Post');
const Commentaire = require('../Models/Commentaire');
const Message = require('../Models/Message');
const Group = require('../Models/Group');
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
const addMember = async (req, res) => {
  try {
    const { groupId, newMemberId } = req.body;

    if (!groupId || !newMemberId) {
      return res.status(400).json({ error: 'groupId et newMemberId sont requis.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Groupe non trouvé.' });
    }

    // Évite d'ajouter un membre déjà existant
    if (group.members.includes(newMemberId)) {
      return res.status(400).json({ error: 'Le membre est déjà dans le groupe.' });
    }

    group.members.push(newMemberId);
    await group.save();

    res.status(200).json({ message: `Membre ${newMemberId} ajouté au groupe ${groupId}`, group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du membre.' });
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
        addMember
       
        
        
      
        
    }