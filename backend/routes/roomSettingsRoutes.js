const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const roomSettingsController = require("../controllers/roomSettingsController");

router.use(requireAuth, requireRole("ADMIN", "NURSE", "DOCTOR"));

router.get("/", roomSettingsController.getRoomSettings);
router.patch("/", roomSettingsController.updateRoomSettings);

module.exports = router;
