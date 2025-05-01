const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const questionController = require('../Controller/question.controller');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const { isTestCreator, hasTestAccess } = require('../Middll/test-access.middleware');
const { validateRequest } = require('../Middll/validation.middleware');

// Validation rules
const questionValidation = [
    body('text').notEmpty().trim().withMessage('Question text is required'),
    body('type').isIn(['multiple_choice', 'likert_scale', 'open_ended', 'true_false', 'ranking'])
        .withMessage('Invalid question type'),
    body('category').isMongoId().withMessage('Valid category ID is required'),
    body('options').if(body('type').isIn(['multiple_choice', 'likert_scale', 'ranking']))
        .isArray().withMessage('Options are required for this question type')
];


/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       required:
 *         - text
 *         - type
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         text:
 *           type: string
 *           description: The question text
 *         type:
 *           type: string
 *           enum: [multiple_choice, likert_scale, open_ended, true_false, ranking]
 *           description: The type of question
 *         category:
 *           type: string
 *           description: MongoDB ID of the category this question belongs to
 *         options:
 *           type: array
 *           description: Available options for multiple choice, likert scale, or ranking questions
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               value:
 *                 type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               msg:
 *                 type: string
 *               param:
 *                 type: string
 *               location:
 *                 type: string
 */

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question management API
 */

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - type
 *               - category
 *             properties:
 *               text:
 *                 type: string
 *                 description: The question text
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, likert_scale, open_ended, true_false, ranking]
 *                 description: The type of question
 *               category:
 *                 type: string
 *                 description: MongoDB ID of the category
 *               options:
 *                 type: array
 *                 description: Required for multiple_choice, likert_scale, and ranking types
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     value:
 *                       type: number
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// CRUD Routes
router.post('/questions', 
    authMiddleware,
    questionValidation,
    validateRequest,
    questionController.createQuestion
);

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get('/questions', 
    authMiddleware,
    questionController.getAllQuestions
);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get a question by ID
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Invalid question ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */

router.get('/questions/:id', 
    authMiddleware,
    param('id').isMongoId().withMessage('Invalid question ID'),
    validateRequest,
    questionController.getQuestionById
);


/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The question text
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, likert_scale, open_ended, true_false, ranking]
 *                 description: The type of question
 *               category:
 *                 type: string
 *                 description: MongoDB ID of the category
 *               options:
 *                 type: array
 *                 description: Required for multiple_choice, likert_scale, and ranking types
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     value:
 *                       type: number
 *     responses:
 *       200:
 *         description: Question updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */

router.put('/questions/:id', 
    authMiddleware,
    param('id').isMongoId().withMessage('Invalid question ID'),
    questionValidation,
    validateRequest,
    questionController.updateQuestion
);


/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       400:
 *         description: Invalid question ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 *       500:
 *         description: Server error
 */

router.delete('/questions/:id', 
    authMiddleware,
    param('id').isMongoId().withMessage('Invalid question ID'),
    validateRequest,
    questionController.deleteQuestion
);

/**
 * @swagger
 * /api/traits/{traitId}/questions:
 *   get:
 *     summary: Get questions by trait
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: traitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Trait ID
 *     responses:
 *       200:
 *         description: List of questions for the specified trait
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *       400:
 *         description: Invalid trait ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


// Additional routes
router.get('/traits/:traitId/questions', 
    authMiddleware,
    param('traitId').isMongoId().withMessage('Invalid trait ID'),
    validateRequest,
    questionController.getQuestionsByTrait
);


/**
 * @swagger
 * /api/types/{type}/questions:
 *   get:
 *     summary: Get questions by type
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [multiple_choice, likert_scale, open_ended, true_false, ranking]
 *         description: Question type
 *     responses:
 *       200:
 *         description: List of questions of the specified type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *       400:
 *         description: Invalid question type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


router.get('/types/:type/questions', 
    authMiddleware,
    param('type').isIn(['multiple_choice', 'likert_scale', 'open_ended', 'true_false', 'ranking'])
        .withMessage('Invalid question type'),
    validateRequest,
    questionController.getQuestionsByType
);

module.exports = router;