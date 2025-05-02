const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const { isTestCreator, hasTestAccess } = require('../Middll/test-access.middleware');
const { validateRequest } = require('../Middll/validation.middleware');
const {
    getAllTestRecommendations,
    getTestRecommendationById,
    createTestRecommendation,
    updateTestRecommendation,
    deleteTestRecommendation,
    getRecommendationsByUser,
    getRecommendationsByStatus
} = require('../Controller/test-recommendation.controller');

// Base path: /api/recommendations

// Validation middleware
const validateId = param('id').isMongoId().withMessage('Invalid ID format');
const validateCreateUpdate = [
    body('testType').notEmpty().withMessage('Test type is required'),
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    body('status').optional().isIn(['pending', 'completed', 'rejected']),
    body('priority').optional().isIn(['low', 'medium', 'high'])
];




/**
 * @swagger
 * components:
 *   schemas:
 *     TestRecommendation:
 *       type: object
 *       required:
 *         - testType
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         testType:
 *           type: string
 *           description: Type of test being recommended
 *         userId:
 *           type: string
 *           description: MongoDB ID of the user receiving the recommendation
 *         recommendedBy:
 *           type: string
 *           description: MongoDB ID of the user/professional making the recommendation
 *         status:
 *           type: string
 *           enum: [pending, completed, rejected]
 *           default: pending
 *           description: Current status of the recommendation
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *           description: Priority level of the recommendation
 *         notes:
 *           type: string
 *           description: Additional notes about the recommendation
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When the recommended test was completed
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
 *   name: Test Recommendations
 *   description: Test recommendation management API
 */

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get all test recommendations
 *     tags: [Test Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all test recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestRecommendation'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */



// GET /api/recommendations
router.get('/', authMiddleware, getAllTestRecommendations);


/**
 * @swagger
 * /api/recommendations/{id}:
 *   get:
 *     summary: Get a test recommendation by ID
 *     tags: [Test Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recommendation ID
 *     responses:
 *       200:
 *         description: Test recommendation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestRecommendation'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Server error
 */


// GET /api/recommendations/:id
router.get('/:id', authMiddleware, validateId, validateRequest, getTestRecommendationById);

/** 
* @swagger
* /api/recommendations:
*   post:
*     summary: Create a new test recommendation
*     tags: [Test Recommendations]
*     security:
*       - bearerAuth: []
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             required:
*               - testType
*               - userId
*             properties:
*               testType:
*                 type: string
*                 description: Type of test being recommended
*               userId:
*                 type: string
*                 description: MongoDB ID of the user receiving the recommendation
*               status:
*                 type: string
*                 enum: [pending, completed, rejected]
*                 default: pending
*               priority:
*                 type: string
*                 enum: [low, medium, high]
*                 default: medium
*               notes:
*                 type: string
*                 description: Additional notes about the recommendation
*     responses:
*       201:
*         description: Test recommendation created successfully
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/TestRecommendation'
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

// POST /api/recommendations
router.post('/', authMiddleware, validateCreateUpdate, validateRequest, createTestRecommendation);


/**
 * @swagger
 * /api/recommendations/{id}:
 *   put:
 *     summary: Update a test recommendation
 *     tags: [Test Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recommendation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testType:
 *                 type: string
 *                 description: Type of test being recommended
 *               userId:
 *                 type: string
 *                 description: MongoDB ID of the user receiving the recommendation
 *               status:
 *                 type: string
 *                 enum: [pending, completed, rejected]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               notes:
 *                 type: string
 *                 description: Additional notes about the recommendation
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the recommended test was completed
 *     responses:
 *       200:
 *         description: Test recommendation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestRecommendation'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Server error
 */


// PUT /api/recommendations/:id
router.put('/:id', authMiddleware, validateId, validateCreateUpdate, validateRequest, updateTestRecommendation);


/**
 * @swagger
 * /api/recommendations/{id}:
 *   delete:
 *     summary: Delete a test recommendation
 *     tags: [Test Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Recommendation ID
 *     responses:
 *       200:
 *         description: Test recommendation deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recommendation not found
 *       500:
 *         description: Server error
 */

// DELETE /api/recommendations/:id
router.delete('/:id', authMiddleware, validateId, validateRequest, deleteTestRecommendation);


/**
 * @swagger
 * /api/recommendations/user/{userId}:
 *   get:
 *     summary: Get all recommendations for a specific user
 *     tags: [Test Recommendations]
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
 *         description: List of recommendations for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestRecommendation'
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


// GET /api/recommendations/user/:userId
router.get('/user/:userId', authMiddleware, param('userId').isMongoId(), validateRequest, getRecommendationsByUser);



/**
 * @swagger
 * /api/recommendations/status/{status}:
 *   get:
 *     summary: Get all recommendations with a specific status
 *     tags: [Test Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, completed, rejected]
 *         description: Recommendation status
 *     responses:
 *       200:
 *         description: List of recommendations with the specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestRecommendation'
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */



// GET /api/recommendations/status/:status
router.get('/status/:status', authMiddleware, param('status').isIn(['pending', 'completed', 'rejected']), validateRequest, getRecommendationsByStatus);

module.exports = router;
