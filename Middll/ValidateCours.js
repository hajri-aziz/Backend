 // Middll/ValidateCours.js
 
  const Joi = require('joi');
  const joiObjectId = require('joi-objectid');
  Joi.objectId = joiObjectId(Joi);
  
  // Validation des catégories de cours
  const validateCourseCategory = (data) => {
    const schema = Joi.object({
      title:       Joi.string().trim().min(3).max(100).required(),
      description: Joi.string().trim().min(10).max(500).required()
    });
    return schema.validate(data);
  };
  
  // Validation des cours
  const validateCours = (data) => {
    const schema = Joi.object({
      title:        Joi.string().min(3).max(100).required(),
      description:  Joi.string().min(10).max(500).required(),
      // price et currency en champs séparés
      price:        Joi.number().positive().required()
                      .messages({ 'number.base': '"price" doit être un nombre' }),
      currency:     Joi.string().valid('TND').default('TND'),
      category_id:  Joi.objectId().required(),
      instructor_id:Joi.objectId().required()
    });
  
    return schema.validate(data);
  };
  
  // Validation des sessions de cours
  const validateCoursSession = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    cours_id: Joi.objectId().required(),
    video_url: Joi.string().uri().required(),

    duration: Joi.object({
      amount: Joi.number()
        .positive()
        .required()
        .messages({ 'number.base': 'La durée doit être un nombre positif' }),
      unit: Joi.string()
        .valid('minutes')
        .default('minutes')
    }).required().messages({
      'object.base': 'Le champ duration doit être un objet avec amount et unit'
    }),

    startdate: Joi.date().iso().required(),
    enddate: Joi.date().iso().required(),
    location: Joi.string().required(),
    capacity: Joi.number().positive().required(),
    status: Joi.string()
      .valid('active','inactive','completed','scheduled','in-progress','cancelled')
      .required()
  });

  return schema.validate(data);
};
  
  // Validation de l'inscription à une session
  const validateSessionInscription = (data) => {
    const schema = Joi.object({
      session_id: Joi.objectId().required(),
      user_id:    Joi.objectId().required()
    });
    return schema.validate(data);
  };
  
  module.exports = {
    validateCourseCategory,
    validateCours,
    validateCoursSession,
    validateSessionInscription
  };
  