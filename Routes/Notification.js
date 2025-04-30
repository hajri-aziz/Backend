const express = require("express");
const router = express.Router();
const notificationController = require("../Controller/PlanningController");
const { authMiddleware, checkRole } = require('../Middll/authMiddleware');


router.get("/notifications/:id_patient",authMiddleware,checkRole("admin"), notificationController.getNotificationsByPatient);
router.put("/notifications/:id/lu",authMiddleware,checkRole("admin"), notificationController.markNotificationAsRead);


module.exports = router;
