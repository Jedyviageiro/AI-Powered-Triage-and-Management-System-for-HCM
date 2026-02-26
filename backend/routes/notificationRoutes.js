const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const notificationController = require("../controllers/notificationController");

router.use(requireAuth, requireRole("ADMIN", "DOCTOR", "NURSE"));

router.get("/", notificationController.listNotifications);
router.get("/latest", notificationController.getLatestNotification);
router.patch("/read-all", notificationController.markAllNotificationsRead);
router.patch("/:id/read", notificationController.markNotificationRead);

module.exports = router;

