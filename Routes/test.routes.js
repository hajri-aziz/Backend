const express = require('express');
const router = express.Router();
const testController = require('../Controller/test.controller');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const validationMiddleware = require('../Middll/validation.middleware');
const { body, param } = require('express-validator');

// Validation schemas
const createTestValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Test name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Test name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Test type is required'),
  body('duration')
    .isObject()
    .withMessage('Duration must be an object'),
  body('configuration')
    .isObject()
    .withMessage('Configuration must be an object'),
  body('questions')
    .isArray()
    .withMessage('Questions must be an array')
];

const updateTestValidation = [
  param('id').isMongoId().withMessage('Invalid test ID'),
  ...createTestValidation.map(validation => validation.optional())
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Test:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - type
 *         - duration
 *         - configuration
 *         - questions
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the psychological test
 *         description:
 *           type: string
 *           description: Description of the test
 *         type:
 *           type: string
 *           description: Type of psychological test
 *         duration:
 *           type: object
 *           description: Duration settings for the test
 *         configuration:
 *           type: object
 *           description: Configuration settings for the test
 *         questions:
 *           type: array
 *           description: Array of questions for the test
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Get all tests
 *     description: Retrieve a list of all psychological tests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of tests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Test'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new test
 *     description: Add a new psychological test (admin/psychologist only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Test'
 *     responses:
 *       201:
 *         description: Test created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin or psychologist role
 *       500:
 *         description: Server error
 */

// Routes
router
  .route('/')
  .get(authMiddleware, testController.getAll)
  .post(
    authMiddleware,
    checkRole('admin', 'psychologist'),
    createTestValidation,
    validationMiddleware.validateRequest,
    testController.create
  );


/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get test by ID
 *     description: Retrieve a single test by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The test ID
 *     responses:
 *       200:
 *         description: Test found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Test'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a test
 *     description: Update an existing test (admin/psychologist only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Test'
 *     responses:
 *       200:
 *         description: Test updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin or psychologist role
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a test
 *     description: Delete a test by ID (admin/psychologist only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The test ID
 *     responses:
 *       200:
 *         description: Test deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin or psychologist role
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */



router
  .route('/:id')
  .get(authMiddleware, testController.getById)
  .put(
    authMiddleware,
    checkRole('admin', 'psychologist'),
    updateTestValidation,
    validationMiddleware.validateRequest,
    testController.update
  )
  .delete(
    authMiddleware,
    checkRole('admin', 'psychologist'),
    param('id').isMongoId().withMessage('Invalid test ID'),
    validationMiddleware.validateRequest,
    testController.delete
  );

/**
 * @swagger
 * /api/tests/category/{categoryId}:
 *   get:
 *     summary: Get tests by category
 *     description: Retrieve all tests belonging to a specific category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     responses:
 *       200:
 *         description: List of tests in the category
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */


router.get('/category/:categoryId', authMiddleware, testController.getByCategory);

/**
 * @swagger
 * /api/tests/{id}/toggle-status:
 *   patch:
 *     summary: Toggle test status
 *     description: Toggle the active status of a test (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The test ID
 *     responses:
 *       200:
 *         description: Test status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         description: Test not found
 *       500:
 *         description: Server error
 */

router.patch('/:id/toggle-status', authMiddleware, checkRole('admin'), testController.toggleStatus);

module.exports = router;