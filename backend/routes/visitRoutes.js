const express = require("express");
const router = express.Router();

const visitController = require("../controllers/visitController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.use(requireAuth, requireRole("ADMIN", "DOCTOR", "NURSE"));

router.post("/", visitController.createVisit);
router.get("/active", visitController.listActiveVisits);
router.get("/:id", visitController.getVisitById);

// prioridade normalmente definida pelo enfermeiro (triagem) ou admin
router.patch("/:id/priority", requireRole("NURSE", "ADMIN"), visitController.setTriagePriority);

// status pode ser mudado por médico/admin (ex: em consulta, finalizado)
router.patch("/:id/status", requireRole("DOCTOR", "ADMIN"), visitController.updateVisitStatus);
router.patch("/:id/finish", requireRole("DOCTOR", "ADMIN"), visitController.finishVisit);

module.exports = router;
