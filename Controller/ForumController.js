const Post = require('../models/Post');
const Commentaire = require('../models/Commentaire');
const Message = require('../models/Message');
  //*********************CRUD POST******************* */
  async function addPost(req, res) {
    try {
      console.log("Fichier reçu:", req.file);
      
      const post = new Post({
        idAuteur: req.body.idAuteur,
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

    async function  addCommentaire(req, res) {
  try {
    console.log(req.body);
    const comment = new Commentaire({
        idAuteur: req.body.idAuteur,
        idPost: req.body.idPost,
        contenu : req.body.contenu,
        date_creation : new Date().toISOString(),
        
  });
    await comment.save();
    res.status(201).json({message: "Commentaire ajouté avec succès",comment});
   
  } catch (err) {
    console.log(err);
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
      //*********************CRUD Group******************* */
      // Créer un nouveau groupe
async function createGroup(req, res) {
  try {
    const { name, description, category, isPrivate } = req.body;
    const creator = req.user._id; // ID de l'utilisateur authentifié
    
    const newGroup = await Group.create({
      name,
      description,
      category,
      creator,
      members: [creator], // Ajouter le créateur comme premier membre
      moderators: [creator], // Le créateur est automatiquement modérateur
      isPrivate
    });
    
    res.status(201).json(newGroup);
  } catch (err) {
    console.error("Erreur lors de la création du groupe :", err);
    res.status(500).send("Erreur serveur");
  }
}

// Rejoindre un groupe
async function joinGroup(req, res) {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    
    const group = await group.findById(groupId);
    if (!group) {
      return res.status(404).send("Groupe non trouvé");
    }
    
    // Vérifier si le groupe est privé
    if (group.isPrivate) {
      return res.status(403).send("Ce groupe est privé. Une invitation est requise.");
    }
    
    // Vérifier si l'utilisateur est déjà membre
    if (group.members.includes(userId)) {
      return res.status(400).send("Vous êtes déjà membre de ce groupe");
    }
    
    // Ajouter l'utilisateur au groupe
    group.members.push(userId);
    await group.save();
    
    res.status(200).json({ message: "Vous avez rejoint le groupe avec succès" });
  } catch (err) {
    console.error("Erreur lors de l'ajout au groupe :", err);
    res.status(500).send("Erreur serveur");
  }
}

// Récupérer les messages d'un groupe
async function getGroupMessages(req, res) {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;
    
    // Vérifier que l'utilisateur est membre du groupe
    const group = await group.findById(groupId);
    if (!group || !group.members.includes(req.user._id)) {
      return res.status(403).send("Accès non autorisé à ce groupe");
    }
    
    // Récupérer les messages du groupe
    const messages = await Message.find({ 
      isGroupMessage: true, 
      groupId 
    })
    .sort({ dateEnvoi: -1 })
    .skip(page * limit)
    .limit(limit)
    .populate('expediteurId', 'name avatar'); // Supposant que vous avez un modèle User
    
    res.status(200).json(messages);
  } catch (err) {
    console.error("Erreur lors de la récupération des messages du groupe :", err);
    res.status(500).send("Erreur serveur");
  }
}

// Liste des groupes auxquels l'utilisateur appartient
async function getUserGroups(req, res) {
  try {
    const userId = req.user._id;
    
    const groups = await Group.find({
      members: userId
    });
    
    res.status(200).json(groups);
  } catch (err) {
    console.error("Erreur lors de la récupération des groupes :", err);
    res.status(500).send("Erreur serveur");
  }
}

// Recherche de groupes par catégorie ou mot-clé
async function searchGroups(req, res) {
  try {
    const { keyword, category } = req.query;
    const query = { isPrivate: false }; // Ne chercher que dans les groupes publics
    
    if (category) {
      query.category = category;
    }
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const groups = await groups.find(query);
    res.status(200).json(groups);
  } catch (err) {
    console.error("Erreur lors de la recherche de groupes :", err);
    res.status(500).send("Erreur serveur");
  }
}
     

     



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
        createGroup,
        joinGroup,
        getGroupMessages,
        getUserGroups,
        searchGroups
        
        
      
        
    }