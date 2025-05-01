const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const { isTestCreator, hasTestAccess } = require('../Middll/test-access.middleware');
const validation = require('../Middll/validation.middleware');

const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../Controller/test-category.controller');

// Validation middleware
const validateId = param('id').isMongoId().withMessage('Invalid ID format');
const validateCreateUpdate = [
    body('name').notEmpty().trim().withMessage('Category name is required'),
    body('description').optional().trim(),
    body('parentId').optional().isMongoId().withMessage('Invalid parent category ID'),
    body('isActive').optional().isBoolean()
];



/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: The category name
 *         description:
 *           type: string
 *           description: Category description
 *         parentId:
 *           type: string
 *           description: MongoDB ID of the parent category (if this is a subcategory)
 *         isActive:
 *           type: boolean
 *           description: Whether the category is active
 *           default: true
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
 *   name: Categories
 *   description: Test category management API
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all test categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


// Routes
router.get('/',authMiddleware, getAllCategories);



/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */


router.get('/:id', authMiddleware, validateId, validation.validateRequest, getCategoryById);



/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: The category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               parentId:
 *                 type: string
 *                 description: MongoDB ID of the parent category (if this is a subcategory)
 *               isActive:
 *                 type: boolean
 *                 description: Whether the category is active
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
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


router.post('/', authMiddleware, validateCreateUpdate, validation.validateRequest, createCategory);


/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               parentId:
 *                 type: string
 *                 description: MongoDB ID of the parent category (if this is a subcategory)
 *               isActive:
 *                 type: boolean
 *                 description: Whether the category is active
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */

router.put('/:id', authMiddleware, validateId, validateCreateUpdate, validation.validateRequest, updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       409:
 *         description: Cannot delete category with associated tests or subcategories
 *       500:
 *         description: Server error
 */


router.delete('/:id', authMiddleware, validateId, validation.validateRequest, deleteCategory);

module.exports = router;