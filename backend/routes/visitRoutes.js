const express = require("express");
const router = express.Router();

const visitController = require("../controllers/visitController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

// Qualquer visita: precisa estar autenticado e ter role válida
router.use(requireAuth, requireRole("ADMIN", "DOCTOR", "NURSE"));

// CRUD básico
router.post("/", visitController.createVisit);
router.get("/active", visitController.listActiveVisits);
router.get("/history", visitController.listPastVisits);
router.get("/:id", visitController.getVisitById);

// Prioridade definida pelo enfermeiro/admin (triagem)
router.patch(
  "/:id/priority",
  requireRole("NURSE", "ADMIN"),
  visitController.setTriagePriority
);

// Atribuir médico (normalmente enfermeiro/admin)
router.patch(
  "/:id/assign-doctor",
  requireRole("NURSE", "ADMIN"),
  visitController.assignDoctor
);

// Iniciar consulta (SÓ médico/admin) — aqui é onde validamos "tem triagem" e "status correto"
router.patch(
  "/:id/start-consultation",
  requireRole("DOCTOR", "ADMIN"),
  visitController.startConsultation
);

// Status genérico (ex: WAITING_DOCTOR, etc)
// ⚠️ IN_CONSULTATION e FINISHED estão bloqueados no controller deste endpoint
router.patch(
  "/:id/status",
  requireRole("DOCTOR", "ADMIN"),
  visitController.updateVisitStatus
);

// Finalizar
router.patch(
  "/:id/finish",
  requireRole("DOCTOR", "ADMIN"),
  visitController.finishVisit
);

// cancelar (NURSE e ADMIN)
router.patch("/:id/cancel", requireRole("NURSE", "ADMIN"), visitController.cancelVisit);

// editar prioridade depois (NURSE e ADMIN)
router.patch("/:id/edit-priority", requireRole("NURSE", "ADMIN"), visitController.editVisitPriority);

// salvar plano mÃ©dico (DOCTOR e ADMIN)
router.patch(
  "/:id/medical-plan",
  requireRole("DOCTOR", "ADMIN"),
  visitController.saveMedicalPlan
);


module.exports = router;
