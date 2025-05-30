const express = require("express");
const router = express.Router();
const notificationController = require("../Controller/PlanningController");
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');


router.get("/notifications/:id_patient",authMiddleware,checkRole("admin","patient"), notificationController.getNotificationsByPatient);
router.put("/notifications/lu/:id",authMiddleware,checkRole("admin","patient"), notificationController.markNotificationAsRead);


module.exports = router;
