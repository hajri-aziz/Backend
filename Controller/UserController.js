const User = require("../Models/User");
const Activity = require('../Models/ActivitySchema'); // Correspond au nom du fichier
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer"); // Pour envoyer des emails
const crypto = require("crypto"); // Pour générer un OTP sécurisé
const otpMap = new Map(); // Une structure temporaire pour stocker les OTPs associés aux emails



// 📨 1️⃣ Fonction pour envoyer un OTP à l'email de l'utilisateur
async function sendOTP(req, res) {
    try {
        const { email } = req.body; // Récupère l'email entré par l'utilisateur
        const user = await User.findOne({ email }); // Cherche l'utilisateur dans la base de données

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Générer un OTP (code à 6 chiffres aléatoire)
        const otp = crypto.randomInt(100000, 999999).toString();
        otpMap.set(email, otp); // Associe l'OTP à l'email de l'utilisateur (stocké temporairement)

        // Configuration du service d'envoi d'email (Hotmail/Outlook)
        const transporter = nodemailer.createTransport({
         host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,  // false means TLS will be used
        auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
        }
});


        // Envoi de l'email avec l'OTP
        await transporter.sendMail({
            from: "ines.aouadi@esprit.tn",  // Ton adresse email Hotmail
            to: email,                    // L'email de l'utilisateur
            subject: "Code de récupération de mot de passe",
            text: `Votre code de récupération est : ${otp}`
        });

        res.status(200).json({ message: "OTP envoyé à votre email." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
}
// 🔑 2️⃣ Fonction pour vérifier l'OTP et mettre à jour le mot de passe
async function verifyOTP(req, res) {
    try {
        const { email, otp, newPassword } = req.body;

        // Vérifier si l'OTP entré correspond à celui stocké
        if (otpMap.get(email) !== otp) {
            return res.status(400).json({ message: "OTP invalide ou expiré" });
        }

        // Hacher le nouveau mot de passe avant de l'enregistrer
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe de l'utilisateur dans la base de données
        await User.findOneAndUpdate({ email }, { password: hashedPassword });

        // Supprimer l'OTP après l'utilisation
        otpMap.delete(email);

        res.status(200).json({ message: "Mot de passe réinitialisé avec succès !" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
}


const secretKey = process.env.JWT_SECRET;

// Fonction d'inscription
async function register(req, res) {
    try {
        const { nom, prenom, email, password, role,dateNaissance} = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            nom,
            prenom,
            email,
            password: hashedPassword,
            role,
            dateNaissance
        });

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        await user.save();
        const newActivity = new Activity({
            user: user._id,
            action: 'Inscription réussie'
        });
        await newActivity.save();

       

        res.status(201).json({
            message: 'Inscription réussie',
            token
        });

    } catch (err) {
        console.error('Erreur serveur:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Vérification du statut de l'utilisateur
        if (user.status === "non autorisé") {
            return res.status(403).json({
                message: "Votre compte est non autorisé. Veuillez contacter l'administration pour plus d'informations."
            });
        }



        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }
        const expiresIn = '2h';
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn }
        );  
       const newActivity = new Activity({
        user: user._id, // Remplace newUser par user ici
        action: 'Connexion réussie'
        });
        await newActivity.save();


        console.log(`Token généré avec succès ! Durée de validité : ${expiresIn}`);
        res.status(200).json({
            message: 'Connexion réussie',
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
async function authorizeUser(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        user.status = "non autorisé";  // Changer le statut
        await user.save();

        res.status(200).json({ message: 'Utilisateur non autorisé avec succès' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}


async function showusers(req, res) {
    try {
        // Récupérer les paramètres de la requête
        const { search, page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit; // Calculer le nombre d'éléments à ignorer pour la pagination
          const query = {};
        // Ajouter la recherche si le paramètre 'search' est fourni
        if (search) {
            query.nom = { $regex: search, $options: 'i' }; // Recherche insensible à la casse dans le nom
        }

        // Récupérer les utilisateurs en fonction de la recherche et de la pagination
        const users = await User.find(query).skip(skip).limit(limit);
        const totalUsers = await User.countDocuments(query); // Compter le total des utilisateurs

        // Retourner les utilisateurs et la pagination
        res.status(200).json({
            users,
            pagination: {
                totalUsers,
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}


async function showusersbyId(req, res) {
    const userId = req.params.id;
     if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ message: "Accès refusé : vous ne pouvez voir que votre propre profil" });
        }
    try {
        const user = await User.findById(req.params.id);
        const newActivity = new Activity({
            user: user._id,
            action: 'show user by id réussie'
        });
        await newActivity.save();

      
        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

async function showByName(req, res) {
    const { nom } = req.params; // Récupère le nom depuis l'URL
    console.log("Nom de l'utilisateur dans l'URL :", nom); // Affiche le nom passé dans l'URL

    try {
        const user = await User.findOne({ nom }); // Recherche l'utilisateur par son nom
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Logique d'activité et réponse
        const newActivity = new Activity({
            user: user._id,
            action: 'show by name réussie'
        });
        await newActivity.save();

        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}


async function deleteusers(req, res) {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

async function updateuser(req, res) {
    try {
        const userId = req.params.id;
        // Ne hacher le mot de passe que si un nouveau mot de passe est fourni
        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, 10); // Hacher le mot de passe
        }

        // Ne pas autoriser la mise à jour du statut
        if (req.body.status) {
            delete req.body.status;
        }
         if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ message: "Accès refusé : vous ne pouvez modifier que votre propre profil" });
        }
        // Mettre à jour l'utilisateur
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        console.log("Données reçues pour update :", req.body);
        console.log("Mot de passe final envoyé à la base :", req.body.password);
        const newActivity = new Activity({
            user: user._id,
            action: 'Modification réussie'
        });
        await newActivity.save();

        

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}
// 🕓 Voir l'historique complet ou par utilisateur
async function showActivities(req, res) {
  try {
    const userId = req.user.id;

    const activities = await Activity.find({ user: userId })
      .populate('user', 'nom prenom') // récupère seulement le champ 'name'
      .sort({ timestamp: -1 })
      .exec();

    res.status(200).json(activities);
  } catch (err) {
    console.error("Erreur lors de la récupération des activités :", err);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des activités." });
  }
}

async function uploadProfile(req, res) {
    try {
        const userId = req.params.id;

        // Vérifie si l'utilisateur est authentifié et autorisé
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès refusé : vous ne pouvez modifier que votre propre profil" });
        }

        // Vérifie si le fichier a été téléchargé
        if (!req.file) {
            return res.status(400).json({ message: "Aucune image téléchargée" });
        }

        // Récupère l'URL de l'image téléchargée
        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        // Met à jour l'image de profil dans la base de données
        const user = await User.findByIdAndUpdate(userId, { profileImage: imageUrl }, { new: true });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.status(200).json({ message: "Photo de profil téléchargée avec succès", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
}





module.exports = {  showusers, showusersbyId, showByName, deleteusers, updateuser, register, login,sendOTP,verifyOTP,authorizeUser ,showActivities,uploadProfile};
