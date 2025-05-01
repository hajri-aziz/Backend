const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');
const { isTestCreator, hasTestAccess } = require('../Middll/test-access.middleware');
const validation = require('../Middll/validation.middleware');

const {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport,
    getReportsByUser,
    getReportsByPsychologist,
    updateReportStatus
} = require('../Controller/psychological-report.controller');

// Validation middleware
const validateId = param('id').isMongoId().withMessage('Invalid ID format');
const validateCreateUpdate = [
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    body('psychologistId').isMongoId().withMessage('Valid psychologist ID is required'),
    body('content').notEmpty().trim().withMessage('Report content is required'),
    body('testResults').optional().isArray(),
    body('diagnosis').optional().trim(),
    body('recommendations').optional().isArray(),
    body('status').optional().isIn(['draft', 'pending', 'completed', 'archived'])
];

const validateStatus = [
    body('status').isIn(['draft', 'pending', 'completed', 'archived'])
        .withMessage('Invalid status value')
];





// Routes


/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all psychological reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get('/', authMiddleware, getAllReports);



/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get a psychological report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */



router.get('/:id', authMiddleware, validateId, validation.validateRequest, getReportById);


/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new psychological report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Report'
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
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


router.post('/', authMiddleware, validateCreateUpdate, validation.validateRequest, createReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Update a psychological report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Report'
 *     responses:
 *       200:
 *         description: Report updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */


router.put('/:id', authMiddleware, validateId, validateCreateUpdate, validation.validateRequest, updateReport);


/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Delete a psychological report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */


router.delete('/:id', authMiddleware, validateId, validation.validateRequest, deleteReport);


/**
 * @swagger
 * /api/reports/user/{userId}:
 *   get:
 *     summary: Get all reports for a specific user
 *     tags: [Reports]
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
 *         description: List of reports for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


router.get('/user/:userId', 
    authMiddleware, 
    param('userId').isMongoId().withMessage('Invalid user ID format'),
    validation.validateRequest,
    getReportsByUser
);


/**
 * @swagger
 * /api/reports/psychologist/{psychologistId}:
 *   get:
 *     summary: Get all reports created by a specific psychologist
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: psychologistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Psychologist ID
 *     responses:
 *       200:
 *         description: List of reports by the psychologist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 *       400:
 *         description: Invalid psychologist ID format
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


router.get('/psychologist/:psychologistId',
    authMiddleware,
    param('psychologistId').isMongoId().withMessage('Invalid psychologist ID format'),
    validation.validateRequest,
    getReportsByPsychologist
);



/**
 * @swagger
 * /api/reports/{id}/status:
 *   patch:
 *     summary: Update the status of a psychological report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportStatus'
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 *       500:
 *         description: Server error
 */

router.patch('/:id/status',
    authMiddleware,
    validateId,
    validateStatus,
    validation.validateRequest,
    updateReportStatus
);

module.exports = router;