const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const { isTestCreator, hasTestAccess } = require('../Middll/test-access.middleware');
const { validateRequest } = require('../Middll/validation.middleware');
const {
    getAllTestScoringAlgorithms,
    getTestScoringAlgorithmById,
    createTestScoringAlgorithm,
    updateTestScoringAlgorithm,
    deleteTestScoringAlgorithm,
    getAlgorithmsByTest,
    calculateScore,
    validateResults
} = require('../Controller/test-scoring-algorithm.controller');

// Base path: /api/scoring-algorithms

// Validation middleware
const validateId = param('id').isMongoId().withMessage('Invalid ID format');
const validateCreateUpdate = [
    body('name').notEmpty().withMessage('Algorithm name is required'),
    body('testId').isMongoId().withMessage('Valid test ID is required'),
    body('formula').notEmpty().withMessage('Scoring formula is required'),
    body('parameters').isArray().withMessage('Parameters must be an array')
];



/**
 * @swagger
 * components:
 *   schemas:
 *     TestScoringAlgorithm:
 *       type: object
 *       required:
 *         - name
 *         - testId
 *         - formula
 *         - parameters
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Name of the scoring algorithm
 *         testId:
 *           type: string
 *           description: MongoDB ID of the test this algorithm is for
 *         description:
 *           type: string
 *           description: Description of how the algorithm works
 *         formula:
 *           type: string
 *           description: The scoring formula or logic (can be a mathematical formula or description)
 *         parameters:
 *           type: array
 *           description: Parameters used in the scoring formula
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [number, string, boolean, array]
 *         version:
 *           type: string
 *           description: Version of the algorithm
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether this algorithm is currently active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CalculateScoreRequest:
 *       type: object
 *       required:
 *         - algorithmId
 *         - answers
 *       properties:
 *         algorithmId:
 *           type: string
 *           description: MongoDB ID of the scoring algorithm to use
 *         answers:
 *           type: array
 *           description: Array of test answers to score
 *           items:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: string
 *               value:
 *                 type: string
 *     ValidateResultsRequest:
 *       type: object
 *       required:
 *         - algorithmId
 *         - results
 *       properties:
 *         algorithmId:
 *           type: string
 *           description: MongoDB ID of the scoring algorithm to use
 *         results:
 *           type: array
 *           description: Array of test results to validate
 *           items:
 *             type: object
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
 *   name: Test Scoring Algorithms
 *   description: Test scoring algorithm management API
 */

/**
 * @swagger
 * /api/scoring-algorithms:
 *   get:
 *     summary: Get all test scoring algorithms
 *     tags: [Test Scoring Algorithms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all scoring algorithms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestScoringAlgorithm'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */





// GET /api/scoring-algorithms
router.get('/', authMiddleware, getAllTestScoringAlgorithms);


/**
 * @swagger
 * /api/scoring-algorithms/{id}:
 *   get:
 *     summary: Get a scoring algorithm by ID
 *     tags: [Test Scoring Algorithms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Algorithm ID
 *     responses:
 *       200:
 *         description: Scoring algorithm details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestScoringAlgorithm'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Algorithm not found
 *       500:
 *         description: Server error
 */


// GET /api/scoring-algorithms/:id
router.get('/:id', authMiddleware, validateId, validateRequest, getTestScoringAlgorithmById);


/**
 * @swagger
 * /api/scoring-algorithms:
 *   post:
 *     summary: Create a new scoring algorithm
 *     tags: [Test Scoring Algorithms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - testId
 *               - formula
 *               - parameters
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the scoring algorithm
 *               testId:
 *                 type: string
 *                 description: MongoDB ID of the test this algorithm is for
 *               description:
 *                 type: string
 *                 description: Description of how the algorithm works
 *               formula:
 *                 type: string
 *                 description: The scoring formula or logic
 *               parameters:
 *                 type: array
 *                 description: Parameters used in the scoring formula
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [number, string, boolean, array]
 *               version:
 *                 type: string
 *                 description: Version of the algorithm
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Scoring algorithm created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestScoringAlgorithm'
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


// POST /api/scoring-algorithms
router.post('/', authMiddleware, validateCreateUpdate, validateRequest, createTestScoringAlgorithm);



/**
 * @swagger
 * /api/scoring-algorithms/{id}:
 *   put:
 *     summary: Update a scoring algorithm
 *     tags: [Test Scoring Algorithms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Algorithm ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - testId
 *               - formula
 *               - parameters
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the scoring algorithm
 *               testId:
 *                 type: string
 *                 description: MongoDB ID of the test this algorithm is for
 *               description:
 *                 type: string
 *                 description: Description of how the algorithm works
 *               formula:
 *                 type: string
 *                 description: The scoring formula or logic
 *               parameters:
 *                 type: array
 *                 description: Parameters used in the scoring formula
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [number, string, boolean, array]
 *               version:
 *                 type: string
 *                 description: Version of the algorithm
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Scoring algorithm updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestScoringAlgorithm'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Algorithm not found
 *       500:
 *         description: Server error
 */


// PUT /api/scoring-algorithms/:id
router.put('/:id', authMiddleware, validateId, validateCreateUpdate, validateRequest, updateTestScoringAlgorithm);


/**
 * @swagger
 * /api/scoring-algorithms/{id}:
 *   delete:
 *     summary: Delete a scoring algorithm
 *     tags: [Test Scoring Algorithms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Algorithm ID
 *     responses:
 *       200:
 *         description: Scoring algorithm deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Algorithm not found
 *       500:
 *         description: Server error
 */


// DELETE /api/scoring-algorithms/:id
router.delete('/:id', authMiddleware, validateId, validateRequest, deleteTestScoringAlgorithm);


/**
 * @swagger
 * /api/scoring-algorithms/test/{testId}:
 *   get:
 *     summary: Get all scoring algorithms for a specific test
 *     tags: [Test Scoring Algorithms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: List of scoring algorithms for the specified test
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestScoringAlgorithm'
 *       400:
 *         description: Invalid test ID format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


// GET /api/scoring-algorithms/test/:testId
router.get('/test/:testId', authMiddleware, param('testId').isMongoId(), validateRequest, getAlgorithmsByTest);


/**
 * @swagger
 * /api/scoring-algorithms/calculate:
 *   post:
 *     summary: Calculate a score using a specific algorithm
 *     tags: [Test Scoring Algorithms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalculateScoreRequest'
 *     responses:
 *       200:
 *         description: Score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 score:
 *                   type: number
 *                 interpretation:
 *                   type: string
 *                 details:
 *                   type: object
 *       400:
 *         description: Validation error or calculation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Algorithm not found
 *       500:
 *         description: Server error
 */



// POST /api/scoring-algorithms/calculate
router.post('/calculate', authMiddleware, [
    body('algorithmId').isMongoId().withMessage('Valid algorithm ID is required'),
    body('answers').isArray().withMessage('Answers must be an array')
], validateRequest, calculateScore);


/**
 * @swagger
 * /api/scoring-algorithms/validate:
 *   post:
 *     summary: Validate test results against an algorithm
 *     tags: [Test Scoring Algorithms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateResultsRequest'
 *     responses:
 *       200:
 *         description: Results validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValid:
 *                   type: boolean
 *                   description: Whether the results are valid according to the algorithm
 *                 issues:
 *                   type: array
 *                   description: List of validation issues if any
 *                   items:
 *                     type: string
 *                 details:
 *                   type: object
 *                   description: Additional validation details
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Algorithm not found
 *       500:
 *         description: Server error
 */


// POST /api/scoring-algorithms/validate
router.post('/validate', authMiddleware, [
    body('algorithmId').isMongoId().withMessage('Valid algorithm ID is required'),
    body('results').isArray().withMessage('Results must be an array')
], validateRequest, validateResults);

module.exports = router;