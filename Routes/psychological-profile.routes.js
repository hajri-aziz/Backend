const express = require('express');
const router = express.Router();
const psychologicalProfileController = require('../Controller/psychological-profile.controller');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const { isTestCreator, hasTestAccess } = require('../Middll/test-access.middleware');
const { validateRequest } = require('../Middll/validation.middleware');
const { body, param } = require('express-validator');

// Validation rules
const profileValidation = [
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    body('traits').isArray().withMessage('Traits must be an array'),
    body('traits.*.traitId').isMongoId().withMessage('Valid trait ID is required'),
    body('traits.*.score').isNumeric().withMessage('Score must be a number')
];



/**
 * @swagger
 * components:
 *   schemas:
 *     TraitScore:
 *       type: object
 *       required:
 *         - traitId
 *         - score
 *       properties:
 *         traitId:
 *           type: string
 *           format: mongoid
 *           description: The ID of the personality trait
 *         score:
 *           type: number
 *           description: The score for this trait
 *     PsychologicalProfile:
 *       type: object
 *       required:
 *         - userId
 *         - traits
 *       properties:
 *         userId:
 *           type: string
 *           format: mongoid
 *           description: The ID of the user this profile belongs to
 *         traits:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TraitScore'
 *           description: Array of trait scores
 *         isPrivate:
 *           type: boolean
 *           description: Privacy setting for the profile
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Profile creation timestamp
 *     PrivacySettings:
 *       type: object
 *       required:
 *         - isPrivate
 *       properties:
 *         isPrivate:
 *           type: boolean
 *           description: Whether the profile is private
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/profiles:
 *   post:
 *     summary: Create a new psychological profile
 *     description: Create a new psychological profile with trait scores
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PsychologicalProfile'
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all psychological profiles
 *     description: Retrieve a list of all psychological profiles
 *     responses:
 *       200:
 *         description: A list of psychological profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PsychologicalProfile'
 *       500:
 *         description: Server error
 */


// Base CRUD Routes with authentication and validation
router.post('/profiles', 
    profileValidation,
    validateRequest,
    psychologicalProfileController.createProfile
);

router.get('/profiles', 
    psychologicalProfileController.getAllProfiles
);


/**
 * @swagger
 * /api/profiles/{id}:
 *   get:
 *     summary: Get profile by ID
 *     description: Retrieve a psychological profile by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The profile ID
 *     responses:
 *       200:
 *         description: Profile found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PsychologicalProfile'
 *       400:
 *         description: Invalid profile ID
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a profile
 *     description: Update a psychological profile (admin or psychologist only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PsychologicalProfile'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin or psychologist role
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a profile
 *     description: Delete a psychological profile by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The profile ID
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       400:
 *         description: Invalid profile ID
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */


router.get('/profiles/:id', 
    param('id').isMongoId().withMessage('Invalid profile ID'),
    validateRequest,
    psychologicalProfileController.getProfileById
);

router.put('/profiles/:id', 
    authMiddleware,
    checkRole('admin', 'psychologist'),
    param('id').isMongoId(),
    profileValidation,
    validateRequest,
    psychologicalProfileController.updateProfile
);

router.delete('/profiles/:id', 
    param('id').isMongoId(),
    validateRequest,
    psychologicalProfileController.deleteProfile
);


/**
 * @swagger
 * /api/users/{userId}/profiles:
 *   get:
 *     summary: Get profiles by user
 *     description: Retrieve all psychological profiles for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: List of user's profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PsychologicalProfile'
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */


// Additional routes with proper middleware
router.get('/users/:userId/profiles',
    param('userId').isMongoId(),
    validateRequest,
    psychologicalProfileController.getProfilesByUser
);


/**
 * @swagger
 * /api/profiles/{id}/history:
 *   get:
 *     summary: Get profile history
 *     description: Retrieve the history of changes for a psychological profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The profile ID
 *     responses:
 *       200:
 *         description: Profile history
 *       400:
 *         description: Invalid profile ID
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */


router.get('/profiles/:id/history',
    param('id').isMongoId(),
    validateRequest,
    psychologicalProfileController.getProfileHistory
);


/**
 * @swagger
 * /api/profiles/{id}/recommendations:
 *   get:
 *     summary: Get profile recommendations
 *     description: Retrieve recommendations based on a psychological profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The profile ID
 *     responses:
 *       200:
 *         description: Profile recommendations
 *       400:
 *         description: Invalid profile ID
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */


router.get('/profiles/:id/recommendations',
    param('id').isMongoId(),
    validateRequest,
    psychologicalProfileController.getProfileRecommendations
);


/**
 * @swagger
 * /api/profiles/{id}/privacy:
 *   put:
 *     summary: Update privacy settings
 *     description: Update the privacy settings for a psychological profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrivacySettings'
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */


router.put('/profiles/:id/privacy',
    param('id').isMongoId(),
    body('isPrivate').isBoolean(),
    validateRequest,
    psychologicalProfileController.updatePrivacySettings
);


/**
 * @swagger
 * /api/profiles/{id}/traits:
 *   post:
 *     summary: Add trait scores
 *     description: Add new trait scores to an existing psychological profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               traits:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TraitScore'
 *     responses:
 *       200:
 *         description: Trait scores added successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Server error
 */


router.post('/profiles/:id/traits',
    param('id').isMongoId(),
    body('traits').isArray(),
    validateRequest,
    psychologicalProfileController.addTraitScore
);


/**
 * @swagger
 * /api/profiles/stats/summary:
 *   get:
 *     summary: Get profiles statistics
 *     description: Retrieve statistical summary of all psychological profiles
 *     responses:
 *       200:
 *         description: Profiles statistics summary
 *       500:
 *         description: Server error
 */

router.get('/profiles/stats/summary',
    psychologicalProfileController.getProfilesStats
);

module.exports = router;
