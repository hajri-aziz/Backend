const Disponibilities = require("../Models/Disponibilities");
const RendezVous = require("../Models/RendezVous");
const Evenement = require("../Models/Evenemnts");
const Notification = require("../Models/Notification");
const Message = require("../Models/Contactuser"); // <-- Assure-toi que le modèle existe

//********************* Gestion de  disponiblités ******************* */

// ✅ Ajouter une disponibilité
async function addDisponibilite(req, res) {
    try {
      const id_psychologue = req.user.id; // Utiliser l'ID du psychologue connecté
      console.log(req.body);
      const disponibilite = new Disponibilities({
        id_psychologue: id_psychologue,
        date: req.body.date,
        heure_debut: req.body.heure_debut,
        heure_fin: req.body.heure_fin,
        statut: req.body.statut // "disponible", "occupé", "absent"
      });
      await disponibilite.save();
      res.status(201).json({ message: "Disponibilité ajoutée avec succès", disponibilite });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de l'ajout de la disponibilité" });
    }
  }
  
// ✅ Récupérer toutes les disponibilités avec le nom du psychologue
async function getAllDisponibilites(req, res) {
  try {
    const disponibilites = await Disponibilities.find()
      .populate('id_psychologue', 'nom prenom'); // On récupère le champ "nom" du psychologue

    res.status(200).json(disponibilites);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur lors de la récupération des disponibilités" });
  }
}
  
  // ✅ Récupérer une disponibilité par ID
  async function getDisponibiliteById(req, res) {
    try {
      const disponibilite = await Disponibilities.findById(req.params.id);
      res.status(200).json(disponibilite);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de la récupération de la disponibilité" });
    }
  }
  
  // ✅ Récupérer les disponibilités d’un psychologue spécifique
  async function getDisponibilitesByPsychologue(req, res) {
    try {
      const disponibilites = await Disponibilities.find({ id_psychologue: req.params.id_psychologue });
      res.status(200).json(disponibilites);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de la récupération des disponibilités du psychologue" });
    }
  }
  
  // ✅ Modifier une disponibilité
  async function updateDisponibilite(req, res) {
    try {
      const disponibilite = await Disponibilities.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
  
      res.status(200).json({ message: "Disponibilité mise à jour", disponibilite });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de la mise à jour de la disponibilité" });
    }
  }
  
  // ✅ Supprimer une disponibilité
  async function deleteDisponibilite(req, res) {
    try {
      const disponibilite = await Disponibilities.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Disponibilité supprimée", disponibilite });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de la suppression de la disponibilité" });
    }
  }
  
// Backend: Modifier getDisponibilitesByStatut
async function getDisponibilitesByStatut(req, res) {
  try {
    const { date } = req.query;
    const statut = req.params.statut;

    console.log('Requête reçue:', { statut, date });

    if (!statut) {
      return res.status(400).json({ message: 'Le paramètre statut est requis' });
    }

    const query = { statut }; // On ne filtre plus par id_psychologue
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Format de date invalide (attendu: YYYY-MM-DD)' });
      }
      query.date = parsedDate;
    }

    const disponibilites = await Disponibilities.find(query)
      .populate('id_psychologue', 'nom'); // On récupère le nom du psy

    res.status(200).json(disponibilites);
  } catch (err) {
    console.error('Erreur dans getDisponibilitesByStatut:', err);
    res.status(500).json({ message: 'Erreur lors du filtrage des disponibilités', error: err.message });
  }
}
//********************* Gestion de rendezvous ******************* */

// ✅ Ajouter un rendez-vous (avec vérification des disponibilités + notification)
async function addRendezVous(req, res) {
  try {
    const userId = req.user.id; // Récupéré via le token décodé

    console.log(req.body);

    // 🔎 Vérifier la disponibilité du psychologue
    const disponibilite = await Disponibilities.findOne({
      id_psychologue: req.body.id_psychologue,
      date: req.body.date,
      heure_debut: { $lte: req.body.heure },
      heure_fin: { $gte: req.body.heure },
      statut: "disponible"
    });

    if (!disponibilite) {
      return res.status(400).json({
        message: "Le psychologue n'est pas disponible à ce créneau."
      });
    }

    // 📝 Créer le rendez-vous
    const rendezVous = new RendezVous({
      id_psychologue: req.body.id_psychologue,
      id_patient: userId,
      date: req.body.date,
      heure: req.body.heure,
      motif: req.body.motif,
      statut: "en attente"
    });

    await rendezVous.save();
    console.log(res);

    // ✅ Mettre à jour la disponibilité comme "occupé"
    await Disponibilities.findByIdAndUpdate(disponibilite._id, { statut: "occupé" });

    // 🔔 Créer la notification pour le patient
    // Construire une date ISO correcte à partir de `rendezVous.date` et `rendezVous.heure`
    const date = new Date(rendezVous.date);
    const [hours, minutes] = rendezVous.heure.split(':');
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    date.setSeconds(0);

    // Format d'affichage (français, exemple : "jeudi 20 mars 2025 à 11:00")
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = date.toLocaleDateString('fr-FR', options);
    const heureStr = `${hours}:${minutes}`;


    // Construire la date de rappel 1h avant
    const dateRappelMoins1h = new Date(date.getTime() - 60 * 60 * 1000);
    const message = `Votre rendez-vous avec le psychologue est prévu le ${dateStr} à ${heureStr}.`;

    const notification = new Notification({
      id_patient: rendezVous.id_patient,
      type: "rendezvous",
      id_cible: rendezVous._id,
      message,
      date_rappel: dateRappelMoins1h,
      lu: false,
      envoye: false

    });

    await notification.save();
    // ✅ Réponse finale
    res.status(201).json({
      message: "Rendez-vous ajouté avec succès",
      rendezVous
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors de l'ajout du rendez-vous"
    });
  }
}

// ✅ Récupérer tous les rendez-vous
async function getAllRendezVous(req, res) {
    try {
        const rendezVous = await RendezVous.find();
        res.status(200).json(rendezVous);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors de la récupération des rendez-vous" });
    }
}

// ✅ Récupérer un rendez-vous par ID
async function getRendezVousById(req, res) {
    try {
        const rendezVous = await RendezVous.findById(req.params.id);
        res.status(200).json(rendezVous);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors de la récupération du rendez-vous" });
    }
}

// ✅ Récupérer les rendez-vous d’un psychologue spécifique
async function getRendezVousByPsychologue(req, res) {
    try {
        const rendezVous = await RendezVous.find({ id_psychologue: req.params.id_psychologue });
        res.status(200).json(rendezVous);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors de la récupération des rendez-vous du psychologue" });
    }
}

// ✅ Modifier un rendez-vous (par exemple, reprogrammer ou changer le statut)
async function updateRendezVous(req, res) {
    try {
        const rendezVous = await RendezVous.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "Rendez-vous mis à jour", rendezVous });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors de la mise à jour du rendez-vous" });
    }
}

// ✅ Annuler un rendez-vous
async function deleteRendezVous(req, res) {
    try {
        const rendezVous = await RendezVous.findByIdAndDelete(req.params.id);

        if (rendezVous) {
            // Rendre la disponibilité à nouveau "disponible"
            await Disponibilities.findOneAndUpdate(
                { id_psychologue: rendezVous.id_psychologue, date: rendezVous.date },
                { statut: "disponible" }
            );
        }

        res.status(200).json({ message: "Rendez-vous annulé", rendezVous });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors de l'annulation du rendez-vous" });
    }
}

// ✅ Récupérer les rendez-vous par statut (en attente, confirmé, annulé)
async function getRendezVousByStatut(req, res) {
    try {
        const rendezVous = await RendezVous.find({ statut: req.params.statut });
        res.status(200).json(rendezVous);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors du filtrage des rendez-vous" });
    }
}

//********************* Gestion des evenements ******************* */

// ✅ Ajouter un événement
async function addEvenement(req, res) {
  try {
    
      console.log(req.body);

      const nouvelEvenement = new Evenement({
          titre: req.body.titre,
          description: req.body.description,
          date: req.body.date,
          heure_debut: req.body.heure_debut,
          duree: req.body.duree,
          capacite: req.body.capacite,
          participants: [] // <- ajouté par sécurité

      });

      await nouvelEvenement.save();
      res.status(201).json({ message: "Événement ajouté avec succès", evenement: nouvelEvenement });

  } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de l'ajout de l'événement" });
  }
}

// ✅ Récupérer tous les événements
async function getAllEvenements(req, res) {
  try {
      const evenements = await Evenement.find();
      res.status(200).json(evenements);
  } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de la récupération des événements" });
  }
}


// ✅ Récupérer tous les événements
async function getAllEvenements(req, res) {
  try {
      const evenements = await Evenement.find();
      res.status(200).json(evenements);
  } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de la récupération des événements" });
  }
}

// ✅ Récupérer un événement par ID
async function getEvenementById(req, res) {
  try {
      const evenement = await Evenement.findById(req.params.id);
      res.status(200).json(evenement);
  } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de la récupération de l'événement" });
  }
}

// ✅ Modifier un événement
async function updateEvenement(req, res) {
  try {
      const evenement = await Evenement.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(200).json({ message: "Événement mis à jour", evenement });
  } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'événement" });
  }
}

// ✅ Supprimer un événement (et toutes les inscriptions associées)
async function deleteEvenement(req, res) {
  try {
    await Evenement.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Événement supprimé avec succès" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur lors de la suppression de l'événement" });
  }
}


// ✅ Inscrire un patient à un événement (avec notification)
async function inscrireEvenement(req, res) {
  try {
        const userId = req.user.id; // Récupéré via le token décodé

    const { id_evenement } = req.body;

    const evenement = await Evenement.findById(id_evenement);
    if (!evenement) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    // 🔁 Vérifier si déjà inscrit
    const dejaInscrit = evenement.participants.some(p => p.id_participant.toString() === userId);
    if (dejaInscrit) {
      return res.status(400).json({ message: "Le patient est déjà inscrit" });
    }

    // 🧮 Vérifier la capacité
    if (evenement.participants.length >= evenement.capacite) {
      return res.status(400).json({ message: "Capacité maximale atteinte" });
    }

    // ➕ Ajouter l'inscription
    evenement.participants.push({ id_participant: userId });
    await evenement.save();

    // 🔔 Créer la notification pour le patient
    // Construire une date ISO correcte à partir de `evenement.date` et `evenement.heure_debut`
    const date = new Date(evenement.date);
    const [hours, minutes] = evenement.heure_debut.split(':');
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    date.setSeconds(0);

    // Format d'affichage (français, exemple : "jeudi 20 mars 2025 à 11:00")
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = date.toLocaleDateString('fr-FR', options);
    const heureStr = `${hours}:${minutes}`;


    // Construire la date de rappel 1h avant
    const dateRappelMoins1h = new Date(date.getTime() - 60 * 60 * 1000);
    const message = `Vous êtes inscrit à l'événement "${evenement.titre}" prévu le ${dateStr} à ${heureStr}.`;
    const notification = new Notification({
      id_patient: userId,
      type: "evenement",
      id_cible: evenement._id,
      message,
      date_rappel: dateRappelMoins1h,
      lu: false,
      envoye: false
    });

    await notification.save();

    // ✅ Retour au client
    res.status(201).json({ message: "Inscription réussie", evenement });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'inscription à l'événement" });
  }
}



// ✅ Récupérer les inscriptions d'un événement
async function getInscriptionsByEvenement(req, res) {
  try {
    const evenement = await Evenement.findById(req.params.id_evenement);
    if (!evenement) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    res.status(200).json(evenement.participants);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur lors de la récupération des participants" });
  }
}


// ✅ Annuler une inscription à un événement
async function annulerInscription(req, res) {
  try {
    const { id_evenement, id_patient } = req.params;

    const evenement = await Evenement.findById(id_evenement);
    if (!evenement) {
      return res.status(404).json({ message: "Événement introuvable" });
    }

    // Filtrer les participants
    const updatedParticipants = evenement.participants.filter(p => p.id_patient !== parseInt(id_patient));
    evenement.participants = updatedParticipants;
    await evenement.save();

    res.status(200).json({ message: "Inscription annulée avec succès" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Erreur lors de l'annulation de l'inscription" });
  }
}

//********************* Gestion des notification ******************* */


// ✅ Récupérer toutes les notifications d’un patient
async function getNotificationsByPatient(req, res) {
  try {
    const { id_patient } = req.params;

    const notifications = await Notification.find({ id_patient })
      .sort({ date_rappel: -1 }); // Les plus récentes en premier

    res.status(200).json({ notifications });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
  }
}
// ✅ Marquer comme lue
async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { lu: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification introuvable" });
    }

    res.status(200).json({ message: "Notification marquée comme lue", notification });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la mise à jour de la notification" });
  }
}

// ✅ Ajouter un message de contact
async function addMessage(req, res) {
  try {
    const { name, email, subject, message } = req.body;

    const newMessage = new Message({
      name,
      email,
      subject,
      message
    });

    await newMessage.save();

    res.status(201).json({
      message: "Message envoyé avec succès",
      data: newMessage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors de l'envoi du message",
      error: err.message
    });
  }
}

// ✅ Récupérer tous les messages envoyés via le formulaire de contact
async function getAllMessages(req, res) {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Erreur lors de la récupération des messages",
      error: err.message
    });
  }
}

// ✅ Supprimer un message par ID
async function deleteMessage(req, res) {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message non trouvé" });
    }
    res.status(200).json({ success: true, message: "Message supprimé avec succès", data: message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Erreur lors de la suppression du message", error: error.message });
  }
}



  module.exports = {
    addDisponibilite,
    getAllDisponibilites,
    getDisponibiliteById,
    getDisponibilitesByPsychologue,
    updateDisponibilite,
    deleteDisponibilite,
    getDisponibilitesByStatut,
    addRendezVous,
    getAllRendezVous,
    getRendezVousById,
    getRendezVousByPsychologue,
    updateRendezVous,
    deleteRendezVous,
    getRendezVousByStatut,
    addEvenement,
    getAllEvenements,
    getEvenementById,
    updateEvenement,
    deleteEvenement,
    inscrireEvenement,
    getInscriptionsByEvenement,
    annulerInscription,
    getNotificationsByPatient, 
    markNotificationAsRead,
    addMessage, 
    getAllMessages,
    deleteMessage
  };