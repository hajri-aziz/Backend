const Joi = require('joi');
const joiObjectId = require('joi-objectid');
Joi.objectId = joiObjectId(Joi);

const validateCourseCategory = (data) => {
    const schema = Joi.object({
        title: Joi.string().trim().min(3).max(100).required(),
        description: Joi.string().trim().min(10).max(500).required()
    });

    return schema.validate(data);
};

const validateCours = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(3).max(100).required(),
        description: Joi.string().min(10).max(500).required(),
        price: Joi.number().required(),
        category_id: Joi.objectId().required(),  // Modifié: utilise objectId()
        instructor_id: Joi.objectId().required()  // Modifié: utilise objectId()
    });

    return schema.validate(data);
};

const validateCoursSession = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(3).max(100).required(),
        cours_id: Joi.objectId().required(),  // Modifié: utilise objectId()
        video_url: Joi.string().uri().required(),
        duration: Joi.number().required(),
        startdate: Joi.date().required(),
        enddate: Joi.date().required(),
        location: Joi.string().required(),
        capacity: Joi.number().required(),
        status: Joi.string().valid('active', 'inactive', 'completed', 'scheduled', 'in-progress', 'cancelled').required(),
    });

    return schema.validate(data);
};

// Nouvelle validation pour l'inscription à une session
const validateSessionInscription = (data) => {
    const schema = Joi.object({
        session_id: Joi.objectId().required(),
        user_id: Joi.objectId().required()
    });

    return schema.validate(data);
};

module.exports = {
    validateCourseCategory,
    validateCours,
    validateCoursSession,
    validateSessionInscription
};