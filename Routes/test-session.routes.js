const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
    getAllTestSessions,
    getTestSessionById,
    createTestSession,
    updateTestSession,
    deleteTestSession,
    getSessionsByUser,
    getSessionsByStatus,
    submitTestSession
} = require('../Controller/test-session.controller');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const { isTestCreator, hasTestAccess } = require('../Middll/test-access.middleware');
const { validateRequest } = require('../Middll/validation.middleware');


// Base path: /api/sessions

// Validation middleware
const validateId = param('id').isMongoId().withMessage('Invalid ID format');
const validateCreateUpdate = [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('testId').isMongoId().withMessage('Valid test ID is required'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
    body('answers').optional().isArray().withMessage('Answers must be an array')
];


/**
 * @swagger
 * components:
 *   schemas:
 *     TestSession:
 *       type: object
 *       required:
 *         - userId
 *         - testId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         userId:
 *           type: string
 *           description: MongoDB ID of the user taking the test
 *         testId:
 *           type: string
 *           description: MongoDB ID of the test being taken
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed, cancelled]
 *           default: pending
 *           description: Current status of the test session
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the test session was started
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the test session was completed
 *         timeSpent:
 *           type: number
 *           description: Time spent on the test in seconds
 *         answers:
 *           type: array
 *           description: User's answers to test questions
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *                 description: ID of the question
 *               value:
 *                 type: string
 *                 description: User's answer to the question
 *               timeSpent:
 *                 type: number
 *                 description: Time spent on this question in seconds
 *         score:
 *           type: object
 *           description: Test score details
 *           properties:
 *             raw:
 *               type: number
 *               description: Raw score
 *             scaled:
 *               type: number
 *               description: Scaled score
 *             interpretation:
 *               type: string
 *               description: Interpretation of the score
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TestSessionCreate:
 *       type: object
 *       required:
 *         - userId
 *         - testId
 *       properties:
 *         userId:
 *           type: string
 *           description: MongoDB ID of the user taking the test
 *         testId:
 *           type: string
 *           description: MongoDB ID of the test being taken
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed, cancelled]
 *           default: pending
 *         startedAt:
 *           type: string
 *           format: date-time
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               value:
 *                 type: string
 *               timeSpent:
 *                 type: number
 *     TestSessionSubmit:
 *       type: object
 *       required:
 *         - answers
 *       properties:
 *         answers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               value:
 *                 type: string
 *               timeSpent:
 *                 type: number
 *         completedAt:
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
 *   name: Test Sessions
 *   description: Test session management API
 */

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all test sessions
 *     tags: [Test Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all test sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestSession'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


// GET /api/sessions
router.get('/', authMiddleware, getAllTestSessions);



/**
 * @swagger
 * /api/sessions/{id}:
 *   get:
 *     summary: Get a test session by ID
 *     tags: [Test Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Test session details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestSession'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */


// GET /api/sessions/:id
router.get('/:id', authMiddleware, validateId, validateRequest, getTestSessionById);



/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new test session
 *     tags: [Test Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestSessionCreate'
 *     responses:
 *       201:
 *         description: Test session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestSession'
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


// POST /api/sessions
router.post('/', authMiddleware, validateCreateUpdate, validateRequest, createTestSession);

/**
 * @swagger
 * /api/sessions/{id}:
 *   put:
 *     summary: Update a test session
 *     tags: [Test Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: MongoDB ID of the user taking the test
 *               testId:
 *                 type: string
 *                 description: MongoDB ID of the test being taken
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, completed, cancelled]
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     value:
 *                       type: string
 *                     timeSpent:
 *                       type: number
 *     responses:
 *       200:
 *         description: Test session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestSession'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */

// PUT /api/sessions/:id
router.put('/:id', authMiddleware, validateId, validateCreateUpdate, validateRequest, updateTestSession);


/**
 * @swagger
 * /api/sessions/{id}:
 *   delete:
 *     summary: Delete a test session
 *     tags: [Test Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Test session deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */


// DELETE /api/sessions/:id
router.delete('/:id', authMiddleware, validateId, validateRequest, deleteTestSession);


/**
 * @swagger
 * /api/sessions/user/{userId}:
 *   get:
 *     summary: Get all test sessions for a specific user
 *     tags: [Test Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of test sessions for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestSession'
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


// GET /api/sessions/user/:userId
router.get('/user/:userId', authMiddleware, param('userId').isMongoId(), validateRequest, getSessionsByUser);


/**
 * @swagger
 * /api/sessions/status/{status}:
 *   get:
 *     summary: Get all test sessions with a specific status
 *     tags: [Test Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed, cancelled]
 *         description: Session status
 *     responses:
 *       200:
 *         description: List of test sessions with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestSession'
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// GET /api/sessions/status/:status
router.get('/status/:status', authMiddleware, 
    param('status').isIn(['pending', 'in-progress', 'completed', 'cancelled']), 
    validateRequest, 
    getSessionsByStatus
);



/**
 * @swagger
 * /api/sessions/{id}/submit:
 *   post:
 *     summary: Submit a completed test session
 *     tags: [Test Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestSessionSubmit'
 *     responses:
 *       200:
 *         description: Test session submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestSession'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */



// POST /api/sessions/:id/submit
router.post('/:id/submit', authMiddleware,
    [
        validateId,
        body('answers').isArray().withMessage('Answers must be an array'),
        body('completedAt').optional().isISO8601().withMessage('Invalid completion date')
    ],
    validateRequest,
    submitTestSession
);

module.exports = router;