const express = require('express');
const router = express.Router();

const {
    createCoursSession,
    getAllCoursSessions,
    getCoursSessionById,
    updateCoursSession,
    deleteCoursSession,
    inscrireCoursSession,
    getInscriptionsBySession,
    annulerInscription,
    getSessionsByUser
} = require('../Controller/CoursController');

/**
 * @swagger
 * tags:
 *   name: Course Sessions
 *   description: API for managing course sessions and enrollments
 */

/**
 * @swagger
 * /api/courssessions/add:
 *   post:
 *     summary: Create a new course session
 *     tags: [Course Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - cours_id
 *             properties:
 *               title:
 *                 type: string
 *               cours_id:
 *                 type: string
 *               video_url:
 *                 type: string
 *               duration:
 *                 type: number
 *               startdate:
 *                 type: string
 *                 format: date-time
 *               enddate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               capacity:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: The session was successfully created
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.post('/add', createCoursSession);

/**
 * @swagger
 * /api/courssessions/all:
 *   get:
 *     summary: Get all course sessions
 *     tags: [Course Sessions]
 *     responses:
 *       200:
 *         description: List of all sessions
 *       500:
 *         description: Server error
 */
router.get('/all', getAllCoursSessions);

/**
 * @swagger
 * /api/courssessions/get/{id}:
 *   get:
 *     summary: Get a session by ID
 *     tags: [Course Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session details
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.get('/get/:id', getCoursSessionById);

/**
 * @swagger
 * /api/courssessions/update/{id}:
 *   put:
 *     summary: Update a session
 *     tags: [Course Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               cours_id:
 *                 type: string
 *               video_url:
 *                 type: string
 *               duration:
 *                 type: number
 *               startdate:
 *                 type: string
 *                 format: date-time
 *               enddate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               capacity:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session updated successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.put('/update/:id', updateCoursSession);

/**
 * @swagger
 * /api/courssessions/delete/{id}:
 *   delete:
 *     summary: Delete a session
 *     tags: [Course Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:id', deleteCoursSession);

/**
 * @swagger
 * /api/courssessions/inscriptions:
 *   post:
 *     summary: Enroll a user in a course session
 *     tags: [Course Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - user_id
 *             properties:
 *               session_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Enrollment successful
 *       400:
 *         description: User already enrolled or capacity reached
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.post('/inscriptions', inscrireCoursSession);

/**
 * @swagger
 * /api/courssessions/sessions/{session_id}/inscriptions:
 *   get:
 *     summary: Get all enrollments for a session
 *     tags: [Course Sessions]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *     responses:
 *       200:
 *         description: List of all enrollments
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.get('/sessions/:session_id/inscriptions', getInscriptionsBySession);

/**
 * @swagger
 * /api/courssessions/sessions/{session_id}/inscriptions/{user_id}:
 *   delete:
 *     summary: Cancel an enrollment
 *     tags: [Course Sessions]
 *     parameters:
 *       - in: path
 *         name: session_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Session ID
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Enrollment canceled successfully
 *       404:
 *         description: Session or enrollment not found
 *       500:
 *         description: Server error
 */
router.delete('/sessions/:session_id/inscriptions/:user_id', annulerInscription);

/**
 * @swagger
 * /api/courssessions/users/{user_id}/sessions:
 *   get:
 *     summary: Get all sessions for a user
 *     tags: [Course Sessions]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of all sessions for the user
 *       500:
 *         description: Server error
 */
router.get('/users/:user_id/sessions', getSessionsByUser);

module.exports = router;