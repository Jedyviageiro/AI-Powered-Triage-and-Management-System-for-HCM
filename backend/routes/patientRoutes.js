const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.use(requireAuth, requireRole("ADMIN", "DOCTOR", "NURSE"));

router.post("/", patientController.createPatient);
router.get("/search", patientController.searchPatients);   // ?name=...
router.get("/code/:code", patientController.getPatientByCode);
router.get("/:id/history", patientController.getPatientHistory);
router.get("/:id", patientController.getPatientById);
router.patch("/:id", patientController.updatePatient);
router.delete("/:id", requireRole("ADMIN"), patientController.deletePatient); // só admin

module.exports = router;
