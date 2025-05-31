// Controller/CoursController.js

const fetch           = require('node-fetch');
const Cours           = require('../Models/Cours');
const CoursSession    = require('../Models/CoursSession');
const CoursCategory = require('../Models/CoursCategory');
const User            = require('../Models/User');

const { generatePassword } = require('../services/passwordGenerator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');



const { sendEmail, emailTemplates, scheduleReminder } = require('../services/mailer');

// --- CATEGORIES ---
const createCategory = async (req, res) => {
  try {
    const category = new CoursCategory({
      title: req.body.title,
      description: req.body.description,
      created_at: new Date(),
      updated_at: new Date()
    });
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await CoursCategory.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error('🔥 Erreur dans getAllCategories :', error);
    res.status(500).json({ message: error.message });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await CoursCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await CoursCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    category.title = req.body.title;
    category.description = req.body.description;
    category.updated_at = new Date();
    const updated = await category.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await CoursCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- COURS ---
const createCours = async (req, res) => {
  try {
    const cours = new Cours({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      currency: req.body.currency,
      category_id: req.body.category_id,
      instructor_id: req.body.instructor_id,
      image: req.file ? req.file.filename : ''
    });
    const newCours = await cours.save();
    res.status(201).json(newCours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCours = async (req, res) => {
  try {
    const coursList = await Cours.find()
      .populate('category_id', 'title description')
      .populate('instructor_id', 'nom prenom email');
    res.status(200).json(coursList);
  } catch (error) {
    console.error('🔥 Erreur dans getAllCours :', error);
    res.status(500).json({ message: error.message });
  }
};

const getCoursById = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id)
      .populate('category_id', 'title description')
      .populate('instructor_id', 'nom prenom email');
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });
    res.status(200).json(cours);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCours = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id);
    if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });
    cours.title = req.body.title;
    cours.description = req.body.description;
    cours.price = req.body.price;
    cours.currency = req.body.currency || cours.currency;
    cours.category_id = req.body.category_id;
    cours.instructor_id = req.body.instructor_id;
    cours.updated_at = new Date();
    if (req.file) cours.image = req.file.path;
    const updated = await cours.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

const createCoursSession = async (req, res) => {
  console.log('📦 Payload reçu côté serveur :', req.body);
  try {
    const {
      title, cours_id, video_url, duration,
      startdate, enddate, location,
      capacity, status
    } = req.body;
    const session = new CoursSession({
      title,
      cours_id,
      video_url,
      duration: { amount: duration.amount, unit: duration.unit },
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

const getAllCoursSessions = async (req, res) => {
  try {
    const sessions = await CoursSession
      .find()
      .populate('cours_id', 'title description')
      .populate('participants.user_id', 'nom prenom email'); // ref: 'user'
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoursSessionById = async (req, res) => {
  try {
    const session = await CoursSession
      .findById(req.params.id)
      .populate('cours_id', 'title description')
      .populate('participants.user_id', 'nom prenom email');
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCoursSession = async (req, res) => {
  try {
    const {
      title, cours_id, video_url, duration,
      startdate, enddate, location,
      capacity, status
    } = req.body;

    const session = await CoursSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });

    const scheduleChanged =
      new Date(session.startdate).getTime() !== new Date(startdate).getTime() ||
      new Date(session.enddate).getTime()   !== new Date(enddate).getTime()   ||
      session.location !== location;

    const changes = [];
    if (new Date(session.startdate).getTime() !== new Date(startdate).getTime())
      changes.push(`Date de début modifiée: ${new Date(startdate).toLocaleString()}`);
    if (new Date(session.enddate).getTime() !== new Date(enddate).getTime())
      changes.push(`Date de fin modifiée: ${new Date(enddate).toLocaleString()}`);
    if (session.location !== location)
      changes.push(`Lieu modifié: ${location}`);

    Object.assign(session, {
      title,
      cours_id,
      video_url,
      duration: {
      amount: req.body.duration.amount,
      unit: req.body.duration.unit
},
startdate: new Date(req.body.startdate),
enddate: new Date(req.body.enddate),

      location,
      capacity,
      status,
      updated_at: new Date()
    });
    const updatedSession = await session.save();

    if (scheduleChanged && session.participants.length > 0) {
      const coursDoc = await Cours.findById(session.cours_id);

      const sessionInfo = {
      
        title:     `${session.cours_id.title} – ${session.title}`,
        startdate: session.startdate,
        enddate:   session.enddate,
        duration:  session.duration,
        location:  session.location,
        accessLink:`${process.env.FRONTEND_URL}/sessions/${session._id}`
      };
       sessionInfo.id = session._id;
      const users = await User.find({ _id: { $in: session.participants.map(p => p.user_id) } });
      for (const usr of users) {
        if (usr.email) {
          const opts = emailTemplates.scheduleChange(usr.email, sessionInfo, changes);
          await sendEmail(opts);
          scheduleReminder(usr.email, sessionInfo);
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
const inscrireCoursSession = async (req, res) => {
  try {
    console.log("🔍 Body reçu :", req.body);
    const { user_id }    = req.body;
    const { session_id } = req.params;

    // 1. Vérification de la session
    const session = await CoursSession
      .findById(session_id)
      .populate('cours_id', 'title description duration');
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }
    if (!session.cours_id) {
      return res.status(404).json({
        success: false,
        message: 'Cours associé introuvable'
      });
    }

    // 2. Vérification de l'utilisateur
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // 3. Conditions d’inscription

    if (session.participants.some(p => p.user_id.toString() === user_id)) {
      return res.status(400).json({ message: 'Utilisateur déjà inscrit' });
    }
    if (session.participants.length >= session.capacity) {
      return res.status(400).json({ message: 'Capacité maximale atteinte' });
    }

    // 4. Génération du mot de passe
    let rawPwd;
    try {
      rawPwd = await generatePassword();
    } catch (err) {
      console.error('Erreur generatePassword, fallback sur crypto :', err);
      rawPwd = crypto.randomBytes(4).toString('base64');
    }

    // 5. Hash du mot de passe et push dans participants
    const pwdHash = await bcrypt.hash(rawPwd, 10);
    session.participants.push({
      user_id:             user._id,
      inscription_date:    new Date(),
      notified:            false,
      sessionPasswordHash: pwdHash
    });
    await session.save();

    // 6. Préparation des infos de session pour l’e-mail
    const sessionInfo = {
      id:        session._id.toString(),
      title:     `${session.cours_id.title} – ${session.title}`,  // fallback géré plus haut
      startdate: session.startdate,
      enddate:   session.enddate,
      duration:  session.duration,
      location:  session.location,
       accessLink: `${process.env.FRONTEND_URL}/sessions/${session._id}/play`

    };

    // 7. Préparation du mail
    const mailOptions = emailTemplates.inscription(
      user.email,
      { ...sessionInfo },
      { password: rawPwd}
    );
    const emailResult = await sendEmail(mailOptions);

    // 8. Envoi de l'email
    
    if (emailResult.success) {
      // on marque notified = true
      const idx = session.participants.findIndex(p => p.user_id.toString() === user_id);
      if (idx !== -1) {
        session.participants[idx].notified = true;
        await session.save();
      }

      return res.status(201).json({
        success: true,
        message: 'Inscription réussie et email envoyé',
        session
      });
    } else {
      console.warn('Échec envoi email :', emailResult.error);
      return res.status(201).json({
        success: true,
        message: 'Inscription réussie mais échec d’envoi de l’email',
        session,
        emailError: emailResult.error
      });
    }

  } catch (error) {
    console.error('Erreur lors de l’inscription :', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l’inscription',
      error:   error.message
    });
  }
};


//

const getInscriptionsBySession = async (req, res) => {
  try {
    const session = await CoursSession
      .findById(req.params.session_id)
      .populate('participants.user_id', 'nom prenom email');
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });
    res.status(200).json(session.participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
const bookTimeSlot = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { user_id, date, time, motif } = req.body;

    const session = await CoursSession.findById(session_id);
    if (!session) return res.status(404).json({ message: 'Session non trouvée' });

    const alreadyBooked = session.bookings.some(
      b =>
        b.user_id.toString() === user_id &&
        new Date(b.date).toISOString() === new Date(date).toISOString() &&
        b.time === time
    );
    if (alreadyBooked)
      return res.status(400).json({ message: 'Vous avez déjà réservé ce créneau' });

    session.bookings.push({ user_id, date, time, motif });
    await session.save();

    res.status(201).json({ message: 'Créneau réservé avec succès', session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSessionsByUser = async (req, res) => {
  try {
    const sessions = await CoursSession
      .find({ 'participants.user_id': req.params.user_id })
      .populate('cours_id', 'title description')
      .populate('participants.user_id', 'nom prenom email');
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
  const getSessionsByCours = async (req, res) => {
  try {
    const coursId = req.params.cours_id;
    const sessions = await CoursSession
      .find({ cours_id: coursId })
      .populate('participants.user_id', 'nom prenom email');
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Filtres & Recherche ---

const getCoursByCategory = async (req, res) => {
  try {
    const category = await CoursCategory.findById(req.params.id); // <- ici
    if (!category) return res.status(404).json({ message: 'Catégorie non trouvée' });

    const coursList = await Cours.find({ category_id: req.params.id }); // <- ici
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

    const coursDoc = await Cours.findById(session.cours_id);
    if (!coursDoc) return res.status(404).json({ message: 'Cours non trouvé' });

    const sessionInfo = {
      title:     `${coursDoc.title} - ${session.title}`,
      startdate: session.startdate,
      location:  session.location
    };

    const results = [];
    const users = await User.find({ _id: { $in: session.participants.map(p => p.user_id) } });
    for (const usr of users) {
      if (usr.email) {
        const mailOpt = emailTemplates.reminder(usr.email, sessionInfo);
        const result  = await sendEmail(mailOpt);
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
  bookTimeSlot,
  getSessionsByUser,
  getSessionsByCours,


  getCoursByCategory,
  getCoursByPrice,
  getCoursByPopularity,
  searchCours,

  sendSessionReminders
};
