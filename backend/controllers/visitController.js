const visitModel = require("../models/visitModel");

// ========================
// CREATE VISIT (chegada)
// POST /visits
// body: { patient_id }
// ========================
const createVisit = async (req, res) => {
  try {
    const { patient_id } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: "patient_id é obrigatório" });
    }

    const openVisit = await visitModel.findOpenVisitByPatientId(patient_id);
    if (openVisit) {
      return res.status(409).json({
        error: "Este paciente ja possui uma visita em aberto.",
        visit: openVisit,
      });
    }

    const visit = await visitModel.createVisit(patient_id);
    return res.status(201).json(visit);
  } catch (err) {
    console.error("CREATE VISIT ERROR:", err);
    return res.status(500).json({ error: "Erro ao criar visita" });
  }
};

// ========================
// GET VISIT BY ID
// GET /visits/:id
// ========================
const getVisitById = async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await visitModel.getVisitById(id);
    if (!visit) return res.status(404).json({ error: "Visita não encontrada" });
    if (req.user?.role === "DOCTOR" && visit.doctor_id !== req.user.id) {
      return res.status(403).json({ error: "Sem permissao para esta visita" });
    }

    return res.json(visit);
  } catch (err) {
    console.error("GET VISIT ERROR:", err);
    return res.status(500).json({ error: "Erro ao buscar visita" });
  }
};

// ========================
// LIST ACTIVE VISITS (fila)
// GET /visits/active
// ========================
const listActiveVisits = async (req, res) => {
  try {
    const visits = await visitModel.listActiveVisits();
    return res.json(visits);
  } catch (err) {
    console.error("LIST ACTIVE VISITS ERROR:", err);
    return res.status(500).json({ error: "Erro ao listar visitas ativas" });
  }
};

// ========================
// SET TRIAGE PRIORITY
// PATCH /visits/:id/priority
// body: { priority, max_wait_minutes }
// ========================
const setTriagePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority, max_wait_minutes } = req.body;

    if (!priority) {
      return res.status(400).json({ error: "priority é obrigatório" });
    }

    const mw = Number(max_wait_minutes);
    if (!Number.isFinite(mw) || mw <= 0) {
      return res
        .status(400)
        .json({ error: "max_wait_minutes deve ser um número > 0" });
    }

    const updated = await visitModel.setTriagePriority(id, priority, mw);
    if (!updated) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(updated);
  } catch (err) {
    console.log("ERROR setTriagePriority:", err);
    return res.status(500).json({
      error: "Erro ao definir prioridade da visita",
      debug: {
        message: err.message,
        code: err.code,
        detail: err.detail,
        hint: err.hint,
        where: err.where,
      },
    });
  }
};

// ========================
// UPDATE STATUS
// PATCH /visits/:id/status
// body: { status }
// Regras:
// - NÃO permitir setar IN_CONSULTATION via este endpoint
// - NÃO permitir setar FINISHED via este endpoint (use /finish)
// ========================
const updateVisitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status é obrigatório" });
    }

    const forbidden = ["IN_CONSULTATION", "FINISHED"];
    if (forbidden.includes(status)) {
      return res.status(400).json({
        error:
          status === "IN_CONSULTATION"
            ? "Use o endpoint /visits/:id/start-consultation para iniciar consulta (e só após triagem)."
            : "Use o endpoint /visits/:id/finish para finalizar visita.",
      });
    }

    const updated = await visitModel.updateVisitStatus(id, status);
    if (!updated) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    return res.status(500).json({ error: "Erro ao atualizar status da visita" });
  }
};

// ========================
// FINISH VISIT
// PATCH /visits/:id/finish
// ========================
const finishVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const finished = await visitModel.finishVisit(id);
    if (!finished) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(finished);
  } catch (err) {
    console.error("FINISH VISIT ERROR:", err);
    return res.status(500).json({ error: "Erro ao finalizar visita" });
  }
};

// ========================
// ASSIGN DOCTOR
// PATCH /visits/:id/assign-doctor
// body: { doctor_id }
// ========================
const assignDoctor = async (req, res) => {
  try {
    const { id } = req.params; // visitId
    const { doctor_id } = req.body;

    if (!doctor_id) {
      return res.status(400).json({ error: "doctor_id é obrigatório" });
    }

    const updated = await visitModel.assignDoctor(id, doctor_id);
    if (!updated) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(updated);
  } catch (err) {
    console.error("ASSIGN DOCTOR ERROR:", err);
    return res.status(500).json({ error: "Erro ao atribuir médico" });
  }
};

// ========================
// START CONSULTATION (PROTEGIDO)
// PATCH /visits/:id/start-consultation
// - Só permite se status = WAITING_DOCTOR e existir triagem
// ========================
const startConsultation = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await visitModel.startConsultation(id, req.user.id);

    if (!updated) {
      return res.status(400).json({
        error: "Não é possível iniciar consulta: falta triagem OU visita não está em 'WAITING_DOCTOR'."
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error("START CONSULT ERROR:", err);
    return res.status(500).json({ error: "Erro ao iniciar consulta" });
  }
};

const cancelVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cancelled = await visitModel.cancelVisit(id, reason, req.user?.id || null);

    if (!cancelled) {
      return res.status(404).json({ error: "Visita não encontrada ou já finalizada/cancelada" });
    }

    return res.json(cancelled);
  } catch (err) {
    console.error("CANCEL VISIT ERROR:", err);
    return res.status(500).json({ error: "Erro ao cancelar visita" });
  }
};


const editVisitPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority, max_wait_minutes } = req.body;

    if (!priority || !max_wait_minutes) {
      return res.status(400).json({ error: "priority e max_wait_minutes são obrigatórios" });
    }

    const updated = await visitModel.editPriority(id, priority, max_wait_minutes);
    if (!updated) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(updated);
  } catch (err) {
    console.error("EDIT PRIORITY ERROR:", err);
    return res.status(500).json({ error: "Erro ao editar prioridade" });
  }
};

const listPastVisits = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 200);
    const rows = await visitModel.listPastVisits(
      Number.isFinite(limit) && limit > 0 && limit <= 1000 ? limit : 200
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error("LIST PAST VISITS ERROR:", err);
    return res.status(500).json({ error: "Erro ao listar visitas antigas" });
  }
};

const saveMedicalPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      likely_diagnosis,
      clinical_reasoning,
      prescription_text,
      disposition_plan,
      disposition_reason,
      follow_up_when,
      follow_up_instructions,
      follow_up_return_if,
      no_charge_chronic,
      no_charge_reason,
      return_visit_date,
      return_visit_reason,
      lab_requested,
      lab_tests,
      lab_sample_collected_at,
      accepted,
    } = req.body || {};

    const allowedDisposition = ["", "BED_REST", "HOME", "RETURN_VISIT", "ADMIT_URGENT"];
    const disposition = disposition_plan || "";
    if (!allowedDisposition.includes(disposition)) {
      return res.status(400).json({ error: "disposition_plan invÃ¡lido" });
    }

    const updated = await visitModel.saveMedicalPlan(
      id,
      {
        likely_diagnosis,
        clinical_reasoning,
        prescription_text,
        disposition_plan: disposition || null,
        disposition_reason,
        follow_up_when,
        follow_up_instructions,
        follow_up_return_if,
        no_charge_chronic: !!no_charge_chronic,
        no_charge_reason,
        return_visit_date,
        return_visit_reason,
        lab_requested: !!lab_requested,
        lab_tests,
        lab_sample_collected_at,
        accepted: !!accepted,
      },
      { actorId: req.user?.id || null, isAdmin: req.user?.role === "ADMIN" }
    );

    if (!updated) {
      return res.status(404).json({
        error: "Visita nÃ£o encontrada, finalizada/cancelada, ou sem permissÃ£o para salvar plano",
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error("SAVE MEDICAL PLAN ERROR:", err);
    return res.status(500).json({ error: "Erro ao salvar plano mÃ©dico" });
  }
};


module.exports = {
  createVisit,
  getVisitById,
  listActiveVisits,
  listPastVisits,
  setTriagePriority,
  updateVisitStatus,
  finishVisit,
  assignDoctor,
  startConsultation,
  cancelVisit,
  editVisitPriority,
  saveMedicalPlan,
};

