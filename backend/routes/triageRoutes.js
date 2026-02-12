const express = require("express");
const router = express.Router();

const triageController = require("../controllers/triageController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.use(requireAuth);

// visualizar triagem
router.get("/visit/:visit_id", requireRole("ADMIN", "DOCTOR", "NURSE"), triageController.getTriageByVisitId);
router.get("/:id", requireRole("ADMIN", "DOCTOR", "NURSE"), triageController.getTriageById);

// criar/editar/remover triagem
router.post("/", requireRole("ADMIN", "NURSE"), triageController.createTriage);
router.patch("/:id", requireRole("ADMIN", "NURSE"), triageController.updateTriage);
router.delete("/:id", requireRole("ADMIN"), triageController.deleteTriage);

module.exports = router;
