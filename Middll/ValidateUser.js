const yup = require('yup');

async function validateUser(req, res, next) {
    try {
        const Schema = yup.object().shape({
            nom: yup.string().matches(/^[a-zA-Z]/, 'Name must start with a letter').required(),
            prenom: yup.string().matches(/^[a-zA-Z]/, 'Prenom must start with a letter').required(),
            email: yup.string().email().matches(/@esprit.tn/, 'Email must belong to esprit.tn domain').required(),
            
        });

        // Valide les données du corps de la requête
        await Schema.validate(req.body);

        // Passe au middleware suivant si la validation est réussie
        next();
    } catch (err) {
        // Renvoie l'erreur de validation avec un code 400
        res.status(400).json({ error: err.message });
    }
}

module.exports = validateUser;
