const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const personalityTraitController = require('../Controller/personality-trait.controller');
const validationMiddleware = require('../Middll/validation.middleware');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const { isTestCreator, hasTestAccess } = require('../Middll/test-access.middleware');
const { validateRequest } = require('../Middll/validation.middleware');
console.log(typeof authMiddleware, 'authMiddleware');
console.log(typeof personalityTraitController.create, 'create handler');
console.log(typeof validationMiddleware.validateRequest, 'validation middleware');

// Validation schemas
const createTraitValidation =[ 
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Trait name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Trait name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Big Five', 'MBTI', 'HEXACO', 'Custom'])
    .withMessage('Invalid category'),
  body('measurementScale.min')
    .isNumeric()
    .withMessage('Minimum scale value must be a number'),
  body('measurementScale.max')
    .isNumeric()
    .withMessage('Maximum scale value must be a number')
    .custom((value, { req }) => {
      if (value <= req.body.measurementScale.min) {
        throw new Error('Maximum scale value must be greater than minimum');
      }
      return true;
    })
];

const updateTraitValidation = [
  param('id').isMongoId().withMessage('Invalid trait ID'),
  ...createTraitValidation.map(validation => validation.optional())
];

const relationshipValidation = [
  body('relatedTraits')
    .isArray()
    .withMessage('Related traits must be an array'),
  body('relatedTraits.*')
    .isMongoId()
    .withMessage('Invalid related trait ID')
];

const assessmentMethodValidation =[
  body('methods')
    .isArray()
    .withMessage('Methods must be an array')
    .custom(methods => {
      const validMethods = ['questionnaire', 'observation', 'interview', 'behavioral'];
      return methods.every(method => validMethods.includes(method));
    })
    .withMessage('Invalid assessment method')
];




/**
 * @swagger
 * components:
 *   schemas:
 *     PersonalityTrait:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - category
 *         - measurementScale
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the personality trait
 *         description:
 *           type: string
 *           description: Description of the personality trait
 *         category:
 *           type: string
 *           enum: [Big Five, MBTI, HEXACO, Custom]
 *           description: Category of the personality trait
 *         measurementScale:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               description: Minimum value of the measurement scale
 *             max:
 *               type: number
 *               description: Maximum value of the measurement scale
 *     TraitRelationship:
 *       type: object
 *       properties:
 *         relatedTraits:
 *           type: array
 *           items:
 *             type: string
 *             format: mongoid
 *           description: Array of related trait IDs
 *     AssessmentMethods:
 *       type: object
 *       properties:
 *         methods:
 *           type: array
 *           items:
 *             type: string
 *             enum: [questionnaire, observation, interview, behavioral]
 *           description: Assessment methods for the trait
 *     ScoreValidation:
 *       type: object
 *       required:
 *         - traitId
 *         - score
 *       properties:
 *         traitId:
 *           type: string
 *           format: mongoid
 *           description: ID of the trait to validate score against
 *         score:
 *           type: number
 *           description: Score to validate
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/personality-traits:
 *   get:
 *     summary: Get all personality traits
 *     description: Retrieve a list of all personality traits
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of personality traits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PersonalityTrait'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new personality trait
 *     description: Add a new personality trait (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalityTrait'
 *     responses:
 *       201:
 *         description: Personality trait created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       500:
 *         description: Server error
 */


// Routes

router
  .route('/')
  .get(authMiddleware, personalityTraitController.getAll)
  .post(authMiddleware,
    checkRole('admin'),
    createTraitValidation,
    validationMiddleware.validateRequest,
    personalityTraitController.create
  );


/**
 * @swagger
 * /api/personality-traits/category/{category}:
 *   get:
 *     summary: Get traits by category
 *     description: Retrieve all personality traits belonging to a specific category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Big Five, MBTI, HEXACO, Custom]
 *         description: The trait category
 *     responses:
 *       200:
 *         description: List of traits in the category
 *       400:
 *         description: Invalid category
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


router.get(
    '/category/:category',
    authMiddleware,
    param('category')
      .isIn(['Big Five', 'MBTI', 'HEXACO', 'Custom'])
      .withMessage('Invalid category'),
    validationMiddleware.validateRequest,
    personalityTraitController.getByCategory
);
 



/**
 * @swagger
 * /api/personality-traits/{id}:
 *   get:
 *     summary: Get trait by ID
 *     description: Retrieve a single personality trait by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trait ID
 *     responses:
 *       200:
 *         description: Trait found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonalityTrait'
 *       400:
 *         description: Invalid trait ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a trait
 *     description: Update an existing personality trait (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trait ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalityTrait'
 *     responses:
 *       200:
 *         description: Trait updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a trait
 *     description: Delete a personality trait by ID (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trait ID
 *     responses:
 *       200:
 *         description: Trait deleted successfully
 *       400:
 *         description: Invalid trait ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 */ 



router
  .route('/:id')
  .get(
    authMiddleware,
    param('id').isMongoId().withMessage('Invalid trait ID'),
    validationMiddleware.validateRequest,
    personalityTraitController.getOne
  )
  .put(
    authMiddleware,
    checkRole('admin'),
    updateTraitValidation,
    validationMiddleware.validateRequest,
    personalityTraitController.update
  )
  .delete(
    authMiddleware,
    checkRole('admin'),
    param('id').isMongoId().withMessage('Invalid trait ID'),
    validationMiddleware.validateRequest,
    personalityTraitController.delete
  );


/**
 * @swagger
 * /api/personality-traits/{id}/relationships:
 *   get:
 *     summary: Get related traits
 *     description: Get all traits related to a specific trait
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trait ID
 *     responses:
 *       200:
 *         description: List of related traits
 *       400:
 *         description: Invalid trait ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update trait relationships
 *     description: Update the relationships between traits (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trait ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TraitRelationship'
 *     responses:
 *       200:
 *         description: Relationships updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 */



router
  .route('/:id/relationships')
  .get(
    authMiddleware,
    param('id').isMongoId().withMessage('Invalid trait ID'),
    validationMiddleware.validateRequest,
    personalityTraitController.getRelatedTraits
  )
  .put(
    authMiddleware,
    checkRole('admin'),
    param('id').isMongoId().withMessage('Invalid trait ID'),
    relationshipValidation,
    validationMiddleware.validateRequest,
    personalityTraitController.updateRelationships
  );


/**
 * @swagger
 * /api/personality-traits/{id}/assessment-methods:
 *   get:
 *     summary: Get assessment methods
 *     description: Get assessment methods for a specific trait
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trait ID
 *     responses:
 *       200:
 *         description: Assessment methods for the trait
 *       400:
 *         description: Invalid trait ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update assessment methods
 *     description: Update assessment methods for a trait (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trait ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssessmentMethods'
 *     responses:
 *       200:
 *         description: Assessment methods updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 */


router
  .route('/:id/assessment-methods')
  .get(
    authMiddleware,
    param('id').isMongoId().withMessage('Invalid trait ID'),
    validationMiddleware.validateRequest,
    personalityTraitController.getAssessmentMethods
  )
  .put(
    authMiddleware,
    checkRole('admin'),
    param('id').isMongoId().withMessage('Invalid trait ID'),
    assessmentMethodValidation,
    validationMiddleware.validateRequest,
    personalityTraitController.updateAssessmentMethods
  );


/**
 * @swagger
 * /api/personality-traits/{id}/restore:
 *   post:
 *     summary: Restore a deleted trait
 *     description: Restore a previously deleted personality trait (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trait ID to restore
 *     responses:
 *       200:
 *         description: Trait restored successfully
 *       400:
 *         description: Invalid trait ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 */


router.post(
  '/:id/restore',
  authMiddleware,
  checkRole('admin'),
  param('id').isMongoId().withMessage('Invalid trait ID'),
  validationMiddleware.validateRequest,
  personalityTraitController.restore
);


/**
 * @swagger
 * /api/personality-traits/validate-score:
 *   post:
 *     summary: Validate a trait score
 *     description: Validate if a score is within the valid range for a trait
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScoreValidation'
 *     responses:
 *       200:
 *         description: Score validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Trait not found
 *       500:
 *         description: Server error
 */


router.post(
  '/validate-score',
  authMiddleware,
  [
    body('traitId').isMongoId().withMessage('Invalid trait ID'),
    body('score').isNumeric().withMessage('Score must be a number')
  ],
  validationMiddleware.validateRequest,
  personalityTraitController.validateScore
);

module.exports = router;
