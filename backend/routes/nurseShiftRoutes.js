const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const nurseShiftController = require("../controllers/nurseShiftController");

router.use(requireAuth, requireRole("NURSE", "ADMIN"));

router.get("/status", nurseShiftController.getShiftStatus);
router.patch("/start", nurseShiftController.startShift);
router.patch("/extend", nurseShiftController.extendShift);
router.patch("/stop", nurseShiftController.stopShift);
router.patch("/break", nurseShiftController.startBreak);
router.patch("/resume", nurseShiftController.resumeBreak);

module.exports = router;
