// middleware/validateBody.js

/**
 * Middleware générique pour valider req.body avec une fonction Joi.
 * @param {Function} validatorFn - fonction qui prend les données et retourne { error, value } de Joi.
 */
module.exports = (validatorFn) => {
    return (req, res, next) => {
      const { error } = validatorFn(req.body);
      if (error) {
        // Renvoie le premier message d'erreur Joi en 400 Bad Request
        return res.status(400).json({ message: error.details[0].message });
      }
      next();
    };
  };
  