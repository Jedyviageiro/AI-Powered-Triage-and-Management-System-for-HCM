const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const doctorShiftController = require("../controllers/doctorShiftController");

router.use(requireAuth, requireRole("DOCTOR", "ADMIN"));

router.get("/status", doctorShiftController.getShiftStatus);
router.patch("/start", doctorShiftController.startShift);
router.patch("/extend", doctorShiftController.extendShift);
router.patch("/stop", doctorShiftController.stopShift);

module.exports = router;
