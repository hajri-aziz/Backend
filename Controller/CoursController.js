// Controller/CoursController.js
const CoursCategory   = require('../Models/CoursCategory');
const Cours           = require('../Models/Cours');
const CoursSession    = require('../Models/CoursSession');
const User            = require('../Models/User');
const { sendEmail, emailTemplates, scheduleReminder } = require('../services/mailer');
// --- Catégories ---

// Créer une catégorie
const createCategory = async (req, res) => {
  try {
    const category = new CoursCategory({
      title:       req.body.title,
      description: req.body.description,
      created_at:  new Date(),
      updated_at:  new Date()
    });
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister toutes les catégories
const getAllCategories = async (req, res) => {
  try {
    const categories = await CoursCategory.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer une catégorie par ID
const getCategoryById = async (req, res) => {
  try {
    const category = await CoursCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une catégorie
const updateCategory = async (req, res) => {
  try {
    const category = await CoursCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    category.title       = req.body.title;
    category.description = req.body.description;
    category.updated_at  = new Date();

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une catégorie
const deleteCategory = async (req, res) => {
  try {
    const category = await CoursCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Cours ---

// Créer un cours (avec image)
const createCours = async (req, res) => {
  try {
    const cours = new Cours({
      title:         req.body.title,
      description:   req.body.description,
      price:         req.body.price,            // <— nombre
      currency:      req.body.currency,         // <— string 'TND'
      category_id:   req.body.category_id,
      instructor_id: req.body.instructor_id,
      image:         req.file ? req.file.path : ''
    });
    const newCours = await cours.save();
    res.status(201).json(newCours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister tous les cours
const getAllCours = async (req, res) => {
  try {
    const coursList = await Cours.find().populate('category_id instructor_id');
    res.status(200).json(coursList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un cours par ID
const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id).populate('category_id instructor_id');
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });
    res.status(200).json(cours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un cours (avec image)
const updateCours = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });

    cours.title         = req.body.title;
    cours.description   = req.body.description;
    cours.price        = req.body.price;
    cours.currency     = req.body.currency || cours.currency; // 'TND' par défaut
    cours.category_id   = req.body.category_id;
    cours.instructor_id = req.body.instructor_id;
    cours.updated_at    = new Date();

    if (req.file) {
      cours.image = req.file.path;
    }

    const updatedCours = await cours.save();
    res.status(200).json(updatedCours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un cours
const deleteCours = async (req, res) => {
  try {
    const cours = await Cours.findByIdAndDelete(req.params.id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });
    res.status(200).json({ message: 'Cours supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Sessions de cours ---

// Créer une session
const createCoursSession = async (req, res) => {
  try {
    const {
      title,
      cours_id,
      video_url,
      duration,
      startdate,
      enddate,
      location,
      capacity,
      status
    } = req.body;

    const session = new CoursSession({
      title,
      cours_id,
      video_url,
      duration: {
        amount: duration.amount,
        unit: duration.unit
      },
      startdate,
      enddate,
      location,
      capacity,
      status,
      participants: [],
      created_at: new Date(),
      updated_at: new Date()
    });

    const newSession = await session.save();
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister toutes les sessions
const getAllCoursSessions = async (req, res) => {
  try {
    const sessions = await CoursSession.find();
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer une session par ID
const getCoursSessionById = async (req, res) => {
  try {
    const session = await CoursSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour une session (avec notifications)
const updateCoursSession = async (req, res) => {
  try {
    const {
      title,
      cours_id,
      video_url,
      duration,
      startdate,
      enddate,
      location,
      capacity,
      status
    } = req.body;

    const session = await CoursSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });

    // Détection de changement d’horaire ou de lieu
    const scheduleChanged =
      new Date(session.startdate).getTime() !== new Date(startdate).getTime() ||
      new Date(session.enddate).getTime()   !== new Date(enddate).getTime()   ||
      session.location !== location;

    const changes = [];
    if (new Date(session.startdate).getTime() !== new Date(startdate).getTime()) {
      changes.push(`Date de début modifiée: ${new Date(startdate).toLocaleString()}`);
    }
    if (new Date(session.enddate).getTime() !== new Date(enddate).getTime()) {
      changes.push(`Date de fin modifiée: ${new Date(enddate).toLocaleString()}`);
    }
    if (session.location !== location) {
      changes.push(`Lieu modifié: ${location}`);
    }

    // Mise à jour des champs
    session.title      = title;
    session.cours_id   = cours_id;
    session.video_url  = video_url;
    session.duration   = { amount: duration.amount, unit: duration.unit };
    session.startdate  = startdate;
    session.enddate    = enddate;
    session.location   = location;
    session.capacity   = capacity;
    session.status     = status;
    session.updated_at = new Date();

    const updatedSession = await session.save();

    // Si planning modifié, notifier les participants
    if (scheduleChanged && session.participants.length > 0) {
      const cours = await Cours.findById(session.cours_id);
      const sessionInfo = {
        title:     `${cours ? cours.title : 'Cours'} - ${session.title}`,
        startdate: session.startdate,
        enddate:   session.enddate,
        location:  session.location
      };
      const users = await User.find({ _id: { $in: session.participants.map(p => p.user_id) } });
      for (const user of users) {
        if (user.email) {
          const opts = emailTemplates.scheduleChange(user.email, sessionInfo, changes);
          await sendEmail(opts);
          scheduleReminder(user.email, sessionInfo);
        }
      }
    }

    res.status(200).json({
      ...updatedSession._doc,
      notificationsEnvoyees: scheduleChanged ? session.participants.length : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une session
const deleteCoursSession = async (req, res) => {
  try {
    const session = await CoursSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });
    res.status(200).json({ message: 'Session supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Inscriptions ---

// Inscrire un utilisateur
const inscrireCoursSession = async (req, res) => {
  try {
    const { session_id, user_id } = req.body;
    const session = await CoursSession.findById(session_id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });

    if (session.participants.some(p => p.user_id.toString() === user_id)) {
      return res.status(400).json({ message: 'Utilisateur déjà inscrit' });
    }
    if (session.participants.length >= session.capacity) {
      return res.status(400).json({ message: 'Capacité maximale atteinte' });
    }

    const cours = await Cours.findById(session.cours_id);
    const usr = await User.findById(user_id);
    if (!usr) return res.status(404).json({ message: 'Utilisateur introuvable' });
    if (!usr.email) return res.status(400).json({ message: 'Utilisateur sans email' });

    session.participants.push({
      user_id,
      inscription_date: new Date(),
      notified: false,
      reminders_sent: 0
    });
    await session.save();

    const sessionInfo = {
      title: `${cours ? cours.title : 'Cours'} - ${session.title}`,
      startdate: session.startdate,
      enddate: session.enddate,
      location: session.location
    };

    try {
      const mailOpt = emailTemplates.inscription(usr.email, sessionInfo);
      await sendEmail(mailOpt);
      const idx = session.participants.findIndex(p => p.user_id.toString() === user_id);
      if (idx !== -1) {
        session.participants[idx].notified = true;
        await session.save();
      }
      scheduleReminder(usr.email, sessionInfo);

      res.status(201).json({ message: 'Inscription réussie et email envoyé', session, emailSent: true });
    } catch (emailError) {
      res.status(201).json({
        message: 'Inscription réussie mais échec notification',
        session,
        emailSent: false,
        emailError: emailError.message
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister les inscriptions d’une session
const getInscriptionsBySession = async (req, res) => {
  try {
    const session = await CoursSession.findById(req.params.session_id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });
    res.status(200).json(session.participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Annuler une inscription
const annulerInscription = async (req, res) => {
  try {
    const { session_id, user_id } = req.params;
    const session = await CoursSession.findById(session_id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });

    const idx = session.participants.findIndex(p => p.user_id.toString() === user_id);
    if (idx === -1) return res.status(404).json({ message: 'Inscription non trouvée' });

    session.participants.splice(idx, 1);
    await session.save();
    res.status(200).json({ message: 'Inscription annulée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister les sessions d’un utilisateur
const getSessionsByUser = async (req, res) => {
  try {
    const sessions = await CoursSession.find({ 'participants.user_id': req.params.user_id });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Filtres & Recherche ---

const getCoursByCategory = async (req, res) => {
  try {
    const category = await CoursCategory.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const coursList = await Cours.find({ category_id: req.params.categoryId });
    res.status(200).json(coursList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoursByPrice = async (req, res) => {
  try {
    const { min, max } = req.query;
    let query = {};
    if (min !== undefined) query.price = { ...query.price, $gte: Number(min) };
    if (max !== undefined) query.price = { ...query.price, $lte: Number(max) };

    const coursList = await Cours.find(query).sort({ price: 1 });
    res.status(200).json(coursList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoursByPopularity = async (req, res) => {
  try {
    const coursList = await Cours.find().sort({ created_at: -1 }).limit(10);
    res.status(200).json(coursList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchCours = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Le terme de recherche est requis' });

    const coursList = await Cours.find({
      $or: [
        { title:       { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });
    res.status(200).json(coursList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Rappels Manuels ---

const sendSessionReminders = async (req, res) => {
  try {
    const session = await CoursSession.findById(req.params.session_id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });

    const cours = await Cours.findById(session.cours_id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });

    const sessionInfo = {
      title:     `${cours.title} - ${session.title}`,
      startdate: session.startdate,
      location:  session.location
    };

    const results = [];
    const users = await User.find({ _id: { $in: session.participants.map(p => p.user_id) } });
    for (const usr of users) {
      if (usr.email) {
        const mailOpt = emailTemplates.reminder(usr.email, sessionInfo);
        const result = await sendEmail(mailOpt);
        if (result.success) {
          const idx = session.participants.findIndex(p => p.user_id.toString() === usr._id.toString());
          if (idx !== -1) {
            session.participants[idx].reminders_sent += 1;
          }
        }
        results.push({ user: usr._id, email: usr.email, success: result.success });
      }
    }

    await session.save();
    res.status(200).json({ message: 'Rappels envoyés', results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,

  createCours,
  getAllCours,
  getCoursById,
  updateCours,
  deleteCours,

  createCoursSession,
  getAllCoursSessions,
  getCoursSessionById,
  updateCoursSession,
  deleteCoursSession,

  inscrireCoursSession,
  getInscriptionsBySession,
  annulerInscription,
  getSessionsByUser,

  getCoursByCategory,
  getCoursByPrice,
  getCoursByPopularity,
  searchCours,

  sendSessionReminders
};
