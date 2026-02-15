const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const aiDoctorController = require("../controllers/aiDoctorController"); // doctor
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.post(
  "/triage",
  requireAuth,
  requireRole("NURSE", "ADMIN"),
  aiController.nurseTriageAI
);

// DOCTOR/ADMIN -> diagnóstico + prescrição sugerida
router.post(
  "/doctor",
  requireAuth,
  requireRole("DOCTOR", "ADMIN"),
  aiDoctorController.doctorAssistAI
);

module.exports = router;
