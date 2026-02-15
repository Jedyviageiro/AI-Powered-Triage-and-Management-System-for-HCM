const router = require("express").Router();

const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const doctorController = require("../controllers/doctorController");

// Ver disponibilidade: Nurse/Admin/Doctor
router.get(
  "/availability",
  requireAuth,
  requireRole("NURSE", "ADMIN", "DOCTOR"),
  doctorController.listAvailability
);

// Check-in / Check-out / Availability / Heartbeat: só DOCTOR
router.patch(
  "/checkin",
  requireAuth,
  requireRole("DOCTOR"),
  doctorController.checkin
);

router.patch(
  "/checkout",
  requireAuth,
  requireRole("DOCTOR"),
  doctorController.checkout
);

router.patch(
  "/availability",
  requireAuth,
  requireRole("DOCTOR"),
  doctorController.setAvailability
);

router.patch(
  "/heartbeat",
  requireAuth,
  requireRole("DOCTOR"),
  doctorController.heartbeat
);

module.exports = router;
