//CoursCategory
const CoursCategory = require('../Models/CoursCategory');
//Cours
const Cours = require('../Models/Cours');
//coursseesion
const CoursSession = require('../Models/CoursSession');
//User Model
const User = require('../Models/User');
//Validation
const { validateCourseCategory, validateCours, validateCoursSession  } = require('../Middll/ValidateCours');
//Email Service
const { sendEmail, emailTemplates, scheduleReminder } = require('../mailer');

//CoursCategory
const createCategory = async (req, res) => {
    const { error } = validateCourseCategory(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const category = new CoursCategory({
        title: req.body.title,
        description: req.body.description,
        created_at: new Date(),
        updated_at: new Date()
    });

    try {
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
    const { error } = validateCourseCategory(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const category = await CoursCategory.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        category.title = req.body.title;
        category.description = req.body.description;
        category.updated_at = new Date();

        const updatedCategory = await category.save();
        res.status(200).json(updatedCategory);
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

//Cours
const createCours = async (req, res) => {
    const { error } = validateCours(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const cours = new Cours({
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        category_id: req.body.category_id,
        instructor_id: req.body.instructor_id,
        created_at: new Date(),
        updated_at: new Date()
    });

    try {
        const newCours = await cours.save();
        res.status(201).json(newCours);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllCours = async (req, res) => {
    try {
        const cours = await Cours.find().populate('category_id instructor_id');
        res.status(200).json(cours);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCoursById = async (req, res) => {
    try {
        const cours = await Cours.findById(req.params.id).populate('category_id instructor_id');
        if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });
        res.status(200).json(cours);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCours = async (req, res) => {
    const { error } = validateCours(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const cours = await Cours.findById(req.params.id);
        if (!cours) return res.status(404).json({ message: 'Cours non trouvé' });

        cours.title = req.body.title;
        cours.description = req.body.description;
        cours.price = req.body.price;
        cours.category_id = req.body.category_id;
        cours.instructor_id = req.body.instructor_id;
        cours.updated_at = new Date();

        const updatedCours = await cours.save();
        res.status(200).json(updatedCours);
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

// Créer une session de cours
const createCoursSession = async (req, res) => {
    const { title, cours_id, video_url, duration, startdate, enddate, location, capacity, status } = req.body;
    
    const session = new CoursSession({
        title,
        cours_id,
        video_url,
        duration,
        startdate,
        enddate,
        location,
        capacity,
        status,
        participants: [],
        created_at: new Date(),
        updated_at: new Date(),
    });

    try {
        const newSession = await session.save();
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer toutes les sessions de cours
const getAllCoursSessions = async (req, res) => {
    try {
        const sessions = await CoursSession.find();
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupérer une session de cours par ID
const getCoursSessionById = async (req, res) => {
    try {
        const session = await CoursSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session non trouvée' });
        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mettre à jour une session de cours
const updateCoursSession = async (req, res) => {
    const { title, cours_id, video_url, duration, startdate, enddate, location, capacity, status } = req.body;
    
    try {
        const session = await CoursSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session non trouvée' });

        // Vérifier s'il y a des changements d'horaire
        const scheduleChanged = 
            new Date(session.startdate).getTime() !== new Date(startdate).getTime() || 
            new Date(session.enddate).getTime() !== new Date(enddate).getTime() || 
            session.location !== location;

        // Enregistrer les changements pour les notifications
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

        // Mettre à jour la session
        session.title = title;
        session.cours_id = cours_id;
        session.video_url = video_url;
        session.duration = duration;
        session.startdate = startdate;
        session.enddate = enddate;
        session.location = location;
        session.capacity = capacity;
        session.status = status;
        session.updated_at = new Date();

        const updatedSession = await session.save();

        // Notifier les utilisateurs inscrits des changements d'horaire s'il y en a
        if (scheduleChanged && session.participants.length > 0) {
            const cours = await Cours.findById(session.cours_id);
            
            // Préparer les informations de session pour l'email
            const sessionInfo = {
                title: `${cours ? cours.title : 'Cours'} - ${session.title}`,
                startdate: session.startdate,
                enddate: session.enddate,
                location: session.location
            };

            // Récupérer les emails des utilisateurs inscrits et envoyer des notifications
            const userIds = session.participants.map(p => p.user_id);
            const users = await User.find({ _id: { $in: userIds } });
            
            for (const user of users) {
                if (user.email) {
                    const emailOptions = emailTemplates.scheduleChange(user.email, sessionInfo, changes);
                    await sendEmail(emailOptions);
                    
                    // Reprogrammer les rappels avec les nouvelles dates
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

// Supprimer une session de cours
const deleteCoursSession = async (req, res) => {
    try {
        const session = await CoursSession.findByIdAndDelete(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session non trouvée' });

        res.status(200).json({ message: 'Session supprimée' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Inscrire un utilisateur à une session de cours
const inscrireCoursSession = async (req, res) => {
    try {
        const { session_id, user_id } = req.body;

        const session = await CoursSession.findById(session_id);
        if (!session) {
            return res.status(404).json({ message: "Session de cours introuvable" });
        }

        // Vérifier si déjà inscrit
        const dejaInscrit = session.participants.some(p => p.user_id.toString() === user_id);
        if (dejaInscrit) {
            return res.status(400).json({ message: "L'utilisateur est déjà inscrit à cette session" });
        }

        // Vérifier la capacité
        if (session.participants.length >= session.capacity) {
            return res.status(400).json({ message: "Capacité maximale atteinte pour cette session" });
        }

        // Récupérer les données du cours pour les notifications
        const cours = await Cours.findById(session.cours_id);
        if (!cours) {
            console.log(`Avertissement: Cours avec ID ${session.cours_id} non trouvé`);
        }

        // Récupérer les informations de l'utilisateur pour l'email
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }
        
        if (!user.email) {
            console.log(`Avertissement: L'utilisateur ${user_id} n'a pas d'adresse email`);
            return res.status(400).json({ message: "L'utilisateur n'a pas d'adresse email pour recevoir les notifications" });
        }

        // Ajouter l'inscription
        session.participants.push({ 
            user_id,
            inscription_date: new Date(),
            notified: false,
            reminders_sent: 0
        });
        await session.save();

        // Préparer les informations de session pour l'email
        const sessionInfo = {
            title: `${cours ? cours.title : 'Cours'} - ${session.title}`,
            startdate: session.startdate,
            enddate: session.enddate,
            location: session.location
        };

        console.log(`Préparation de l'email pour l'utilisateur ${user.email} avec les informations:`, sessionInfo);

        // Envoyer l'email de confirmation
        try {
            const emailOptions = emailTemplates.inscription(user.email, sessionInfo);
            console.log("Options email préparées:", emailOptions);
            
            const emailResult = await sendEmail(emailOptions);
            console.log("Résultat de l'envoi d'email:", emailResult);
            
            // Marquer l'utilisateur comme notifié
            const participantIndex = session.participants.findIndex(p => p.user_id.toString() === user_id);
            if (participantIndex !== -1) {
                session.participants[participantIndex].notified = true;
                await session.save();
            }
            
            // Programmer les rappels
            const reminderResult = scheduleReminder(user.email, sessionInfo);
            console.log("Résultat de la programmation des rappels:", reminderResult);
            
            return res.status(201).json({ 
                message: "Inscription réussie et notification envoyée", 
                session,
                emailSent: true
            });
        } catch (emailError) {
            console.error("Erreur lors de l'envoi de l'email:", emailError);
            
            // L'inscription est réussie même si l'email échoue
            return res.status(201).json({ 
                message: "Inscription réussie mais échec de l'envoi de la notification", 
                session,
                emailSent: false,
                emailError: emailError.message
            });
        }
    } catch (err) {
        console.error("Erreur lors de l'inscription:", err);
        res.status(500).json({ message: "Erreur lors de l'inscription à la session de cours" });
    }
};

// Récupérer les inscriptions d'une session de cours
const getInscriptionsBySession = async (req, res) => {
    try {
        const session = await CoursSession.findById(req.params.session_id);
        if (!session) {
            return res.status(404).json({ message: "Session de cours introuvable" });
        }

        res.status(200).json(session.participants);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors de la récupération des participants" });
    }
};

// Annuler une inscription à une session de cours
const annulerInscription = async (req, res) => {
    try {
        const { session_id, user_id } = req.params;

        const session = await CoursSession.findById(session_id);
        if (!session) {
            return res.status(404).json({ message: "Session de cours introuvable" });
        }

        // Filtrer les participants
        const indexParticipant = session.participants.findIndex(p => p.user_id === user_id);
        
        if (indexParticipant === -1) {
            return res.status(404).json({ message: "Inscription non trouvée" });
        }
        
        session.participants.splice(indexParticipant, 1);
        await session.save();

        res.status(200).json({ message: "Inscription annulée avec succès" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors de l'annulation de l'inscription" });
    }
};

// Récupérer toutes les sessions auxquelles un utilisateur est inscrit
const getSessionsByUser = async (req, res) => {
    try {
        const user_id = req.params.user_id;
        
        const sessions = await CoursSession.find({
            'participants.user_id': user_id
        });
        
        res.status(200).json(sessions);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Erreur lors de la récupération des sessions de l'utilisateur" });
    }
};

// Récupérer les cours par catégorie
const getCoursByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        // Vérification que categoryId est fourni
        if (!categoryId) {
            return res.status(400).json({ message: "L'ID de catégorie est requis" });
        }
        
        // Récupérer les cours de la catégorie spécifiée
        const cours = await Cours.find({ category_id: categoryId });
        
        res.status(200).json(cours);
    } catch (error) {
        console.error("Erreur lors de la récupération des cours par catégorie:", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des cours par catégorie" });
    }
};

// Filtrer les cours par prix
const getCoursByPrice = async (req, res) => {
    try {
        const { min, max } = req.query;
        let query = {};
        
        // Construire la requête en fonction des paramètres
        if (min !== undefined) {
            query.price = { ...query.price, $gte: Number(min) };
        }
        
        if (max !== undefined) {
            query.price = { ...query.price, $lte: Number(max) };
        }
        
        // Récupérer les cours filtrés par prix
        const cours = await Cours.find(query).sort({ price: 1 });
        
        res.status(200).json(cours);
    } catch (error) {
        console.error("Erreur lors du filtrage des cours par prix:", error);
        res.status(500).json({ message: "Erreur serveur lors du filtrage des cours par prix" });
    }
};

// Récupérer les cours par popularité
const getCoursByPopularity = async (req, res) => {
    try {
        // Tri par date de création (du plus récent au plus ancien)
        const cours = await Cours.find()
            .sort({ created_at: -1 })
            .limit(10);
        
        res.status(200).json(cours);
    } catch (error) {
        console.error("Erreur lors de la récupération des cours par popularité:", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des cours par popularité" });
    }
};

// Rechercher des cours
const searchCours = async (req, res) => {
    try {
        const { q } = req.query;
        
        // Vérification que le terme de recherche est fourni
        if (!q) {
            return res.status(400).json({ message: "Le terme de recherche est requis" });
        }
        
        // Recherche dans les titres et descriptions des cours
        const cours = await Cours.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },    // 'i' pour insensible à la casse
                { description: { $regex: q, $options: 'i' } }
            ]
        });
        
        res.status(200).json(cours);
    } catch (error) {
        console.error("Erreur lors de la recherche des cours:", error);
        res.status(500).json({ message: "Erreur serveur lors de la recherche des cours" });
    }
};

// Envoyer des rappels pour une session
const sendSessionReminders = async (req, res) => {
    try {
        const { session_id } = req.params;
        
        const session = await CoursSession.findById(session_id);
        if (!session) {
            return res.status(404).json({ message: "Session de cours introuvable" });
        }
        
        const cours = await Cours.findById(session.cours_id);
        if (!cours) {
            return res.status(404).json({ message: "Cours introuvable" });
        }
        
        // Préparer les informations de session pour l'email
        const sessionInfo = {
            title: `${cours.title} - ${session.title}`,
            startdate: session.startdate,
            enddate: session.enddate,
            location: session.location
        };
        
        // Récupérer les emails des utilisateurs inscrits
        const userIds = session.participants.map(p => p.user_id);
        const users = await User.find({ _id: { $in: userIds } });
        
        const results = [];
        for (const user of users) {
            if (user.email) {
                const emailOptions = emailTemplates.reminder(user.email, sessionInfo);
                const result = await sendEmail(emailOptions);
                
                if (result.success) {
                    // Mettre à jour le compteur de rappels envoyés
                    const participantIndex = session.participants.findIndex(p => p.user_id === user._id.toString());
                    if (participantIndex !== -1) {
                        session.participants[participantIndex].reminders_sent += 1;
                    }
                }
                
                results.push({ user: user._id, email: user.email, success: result.success });
            }
        }
        
        await session.save();
        
        res.status(200).json({ 
            message: "Rappels envoyés", 
            results 
        });
        
    } catch (error) {
        console.error("Erreur lors de l'envoi des rappels:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'envoi des rappels" });
    }
};

module.exports = {
    //category
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    //cours
    createCours,
    getAllCours,
    getCoursById,
    updateCours,
    deleteCours,
    //coursSession
    createCoursSession,
    getAllCoursSessions,
    getCoursSessionById,
    updateCoursSession,
    deleteCoursSession,
    //inscription
    inscrireCoursSession,
    getInscriptionsBySession,
    annulerInscription,
    getSessionsByUser,
    //cours by category
    getCoursByCategory,
    //cours by price    
    getCoursByPrice,
    //cours by popularity
    getCoursByPopularity,
    //search cours
    searchCours,
    //notifications
    sendSessionReminders
};