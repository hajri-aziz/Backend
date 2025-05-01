// middleware/auth.js - version session
const User = require('../Models/User');

const auth = async (req, res, next) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }

        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'authentification'
        });
    }
};

module.exports = auth;