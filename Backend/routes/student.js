const express = require("express");
const router = express.Router();
const { getStudentProfile, updateStudentProfile, getStudentDashboard, getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } = require("../controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");

// Get student dashboard data
router.get("/dashboard", authMiddleware, getStudentDashboard);

// Get student profile
router.get("/profile", authMiddleware, getStudentProfile);

// Update student profile
router.put("/profile", authMiddleware, updateStudentProfile);

// Update student password only
router.put("/profile/password", authMiddleware, updateStudentProfile);

// Get student notifications
router.get("/notifications", authMiddleware, getNotifications);

// Get unread notification count
router.get("/notifications/unread-count", authMiddleware, getUnreadNotificationCount);

// Mark single notification as read
router.put("/notifications/:id/read", authMiddleware, markNotificationRead);

// Mark all notifications as read
router.put("/notifications/read", authMiddleware, markAllNotificationsRead);

module.exports = router;