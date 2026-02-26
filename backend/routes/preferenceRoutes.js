const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const preferenceController = require("../controllers/preferenceController");

router.use(requireAuth, requireRole("ADMIN", "DOCTOR", "NURSE"));

router.get("/me", preferenceController.getMyPreferences);
router.patch("/me", preferenceController.updateMyPreferences);

module.exports = router;

