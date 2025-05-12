const User = require("../Models/User");
const Activity = require('../Models/ActivitySchema');
const upload = require('../Config/uploadConfig');const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer"); // Pour envoyer des emails
const crypto = require("crypto"); // Pour générer un OTP sécurisé
const otpMap = new Map(); // Une structure temporaire pour stocker les OTPs associés aux emails
const path = require('path');
const fs = require('fs');



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
        const { nom, prenom, email, password, dateNaissance,telephone,isApproved } = req.body;

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
            dateNaissance,
            telephone,
            isApproved, // L'utilisateur est en attente d'approbation
        });

        await user.save();
        res.status(201).json({
            message: 'Inscription réussie. Votre inscription est en attente d\'approbation.'
        });

    } catch (err) {
        console.error('Erreur serveur:', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

async function approveUser(req, res) {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // L'administrateur approuve l'utilisateur
        user.isApproved = true; // L'utilisateur est maintenant approuvé
        user.role = 'utilisateur'; // Vous pouvez également lui attribuer un rôle ici
        await user.save();

        res.status(200).json({ message: 'Utilisateur approuvé avec succès' });

    } catch (err) {
        console.log(err);
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
        if (!user.isApproved) {
            return res.status(403).json({ message: 'Votre inscription est en attente d\'approbation.' });
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
            token,
            user: {
            id: user._id,
            email: user.email,
            role: user.role
    }
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
        const { search } = req.query;

        const query = {};
        if (search) {
            query.nom = { $regex: search, $options: 'i' };
        }

        const users = await User.find(query); // Plus de skip ni de limit
        const totalUsers = users.length;

        res.status(200).json({
            users,
            totalUsers
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
            action: 'show user by id réussie',
            image: user.imageProfile,  // Nom de l'image (par ex. "profile.jpg")

        });
        await newActivity.save();

      
        res.status(200).send(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

async function showByName(req, res) {
    const { nom } = req.params; // Nom dans l'URL
    const loggedUserName = req.user.nom; // Nom extrait du token

    console.log("Nom de l'utilisateur dans l'URL :", nom);
    console.log("Nom de l'utilisateur connecté :", loggedUserName);

    try {
        // Empêche un utilisateur d'accéder aux données d'un autre
        if (nom !== loggedUserName) {
            return res.status(403).json({ message: "Accès refusé : vous ne pouvez accéder qu'à vos propres informations." });
        }

        const user = await User.findOne({ nom });
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Log activité
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
        const updates = {};

        // Liste des champs autorisés à être mis à jour
        const allowedFields = ['nom', 'prenom', 'email', 'dateNaissance', 'telephone', 'profileImage'];
        
        // Copier seulement les champs autorisés et non vides
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                updates[field] = req.body[field];
            }
        });

        // Gestion spéciale du mot de passe
        if (req.body.password && req.body.password.trim() !== '') {
            updates.password = await bcrypt.hash(req.body.password, 10);
        }

        // Gestion de l'image
        if (req.file) {
            updates.profileImage = `/uploads/profiles/${req.file.filename}`;
            
            // Optionnel: Supprimer l'ancienne image du serveur
            const oldUser = await User.findById(userId);
            if (oldUser.profileImage) {
                const oldImagePath = path.join(__dirname, '..', 'public', oldUser.profileImage);
                fs.unlink(oldImagePath, err => { if (err) console.error('Erreur suppression ancienne image:', err); });
            }
        }

        // Vérification des permissions
        if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ message: "Accès refusé : vous ne pouvez modifier que votre propre profil" });
        }

        // Mise à jour de l'utilisateur
        const user = await User.findByIdAndUpdate(
            userId, 
            { $set: updates }, // Utilisation de $set pour ne modifier que les champs spécifiés
            { new: true, runValidators: true }
        ).select('-password -__v'); // Exclure les champs sensibles

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Log activité
        await new Activity({
            user: user._id,
            action: 'Modification du profil',
            details: {
                updatedFields: Object.keys(updates),
                newImage: !!req.file
            }
        }).save();

        res.status(200).json({
            message: "Profil mis à jour avec succès",
            user: user,
            updatedFields: Object.keys(updates)
        });

    } catch (err) {
        console.error('Erreur mise à jour utilisateur:', err);
        res.status(500).json({ 
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
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





module.exports = {  showusers, showusersbyId, showByName, deleteusers, updateuser, register, login,sendOTP,verifyOTP,authorizeUser ,showActivities,uploadProfile ,approveUser};