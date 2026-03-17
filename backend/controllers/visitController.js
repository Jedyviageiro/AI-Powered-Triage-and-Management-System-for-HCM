const notificationModel = require("../models/notificationModel");
const visitModel = require("../models/visitModel");

const VISIT_MOTIVES = new Set([
  "MEDICAL_CONSULTATION",
  "LAB_SAMPLE_COLLECTION",
  "LAB_RESULTS",
  "OTHER",
]);

const ALLOWED_DISPOSITIONS = new Set([
  "",
  "BED_REST",
  "HOME",
  "RETURN_VISIT",
  "ADMIT_URGENT",
  "REFER_SPECIALIST",
]);

const ALLOWED_HOSPITAL_STATUSES = new Set([
  "",
  "DISCHARGED",
  "IN_HOSPITAL",
  "BED_REST",
  "TRANSFERRED",
  "DECEASED",
]);

const ALLOWED_VITAL_STATUSES = new Set(["", "ALIVE", "DECEASED", "UNKNOWN"]);
const FORBIDDEN_DIRECT_STATUSES = new Set(["IN_CONSULTATION", "FINISHED"]);

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeUpper = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const sendServerError = (res, context, error, message) => {
  console.error(`${context}:`, error);
  return res.status(500).json({ error: message });
};

const createVisit = async (req, res) => {
  try {
    const {
      patient_id,
      force_new_consultation,
      visit_motive,
      visit_motive_other,
      skip_triage,
      return_visit_reason,
    } = req.body || {};

    if (!patient_id) {
      return res.status(400).json({ error: "patient_id e obrigatorio" });
    }

    const normalizedVisitMotive = normalizeUpper(visit_motive || "MEDICAL_CONSULTATION");
    if (!VISIT_MOTIVES.has(normalizedVisitMotive)) {
      return res.status(400).json({ error: "visit_motive invalido" });
    }

    const normalizedVisitMotiveOther =
      normalizedVisitMotive === "OTHER" ? String(visit_motive_other || "").trim() || null : null;
    const normalizedReturnVisitReason = String(return_visit_reason || "").trim() || null;

    const openVisit = await visitModel.findOpenVisitByPatientId(patient_id);
    if (openVisit) {
      return res.status(409).json({
        error: "Este paciente ja possui uma visita em aberto.",
        visit: openVisit,
      });
    }

    let visit = null;
    if (!force_new_consultation) {
      const latestLabFollowup = await visitModel.findLatestFinishedLabFollowup(patient_id);
      const hasLatestLabPendingOrReady =
        !!latestLabFollowup &&
        (!!String(latestLabFollowup.lab_result_text || "").trim() ||
          normalizeUpper(latestLabFollowup.lab_result_status) === "READY" ||
          !latestLabFollowup.lab_sample_collected_at);

      if (hasLatestLabPendingOrReady) {
        visit = await visitModel.createVisitForLabFollowup(patient_id, latestLabFollowup, {
          visit_motive: normalizedVisitMotive,
          visit_motive_other: normalizedVisitMotiveOther,
          return_visit_reason: normalizedReturnVisitReason,
        });
      }
    }

    if (!visit) {
      visit = await visitModel.createVisit(patient_id, {
        visit_motive: normalizedVisitMotive,
        visit_motive_other: normalizedVisitMotiveOther,
        return_visit_reason: normalizedReturnVisitReason,
        status: skip_triage ? "WAITING_DOCTOR" : "WAITING",
        priority: skip_triage ? "NON_URGENT" : null,
        max_wait_minutes: skip_triage ? 120 : null,
      });
    }

    return res.status(201).json(visit);
  } catch (error) {
    return sendServerError(res, "CREATE VISIT ERROR", error, "Erro ao criar visita");
  }
};

const getVisitById = async (req, res) => {
  try {
    const visitId = parsePositiveInt(req.params.id);
    if (!visitId) return res.status(400).json({ error: "id invalido" });

    const visit = await visitModel.getVisitById(visitId);
    if (!visit) return res.status(404).json({ error: "Visita nao encontrada" });

    if (req.user?.role === "DOCTOR" && Number(visit.doctor_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "Sem permissao para esta visita" });
    }

    return res.json(visit);
  } catch (error) {
    return sendServerError(res, "GET VISIT ERROR", error, "Erro ao buscar visita");
  }
};

const listActiveVisits = async (_req, res) => {
  try {
    const visits = await visitModel.listActiveVisits();
    return res.json(Array.isArray(visits) ? visits : []);
  } catch (error) {
    return sendServerError(res, "LIST ACTIVE VISITS ERROR", error, "Erro ao listar visitas ativas");
  }
};

const listPastVisits = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 200);
    const rows = await visitModel.listPastVisits(
      Number.isFinite(limit) && limit > 0 && limit <= 1000 ? limit : 200
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    return sendServerError(res, "LIST PAST VISITS ERROR", error, "Erro ao listar visitas antigas");
  }
};

const getMyAgenda = async (req, res) => {
  try {
    const doctorId =
      req.user?.role === "ADMIN"
        ? parsePositiveInt(req.query.doctor_id || req.user?.id)
        : parsePositiveInt(req.user?.id);

    if (!doctorId) {
      return res.status(400).json({ error: "doctor_id invalido" });
    }

    const agenda = await visitModel.listDoctorAgenda(doctorId);
    return res.json(agenda || { assigned_today: [], returns_today: [] });
  } catch (error) {
    return sendServerError(res, "GET MY AGENDA ERROR", error, "Erro ao buscar agenda do medico");
  }
};

const setTriagePriority = async (req, res) => {
  try {
    const { priority, max_wait_minutes } = req.body || {};
    if (!priority) {
      return res.status(400).json({ error: "priority e obrigatorio" });
    }

    const waitMinutes = Number(max_wait_minutes);
    if (!Number.isFinite(waitMinutes) || waitMinutes <= 0) {
      return res.status(400).json({ error: "max_wait_minutes deve ser um numero maior que 0" });
    }

    const updated = await visitModel.setTriagePriority(req.params.id, priority, waitMinutes);
    if (!updated) return res.status(404).json({ error: "Visita nao encontrada" });

    return res.json(updated);
  } catch (error) {
    console.error("SET TRIAGE PRIORITY ERROR:", error);
    return res.status(500).json({
      error: "Erro ao definir prioridade da visita",
      debug: {
        message: error.message,
        code: error.code,
        detail: error.detail,
      },
    });
  }
};

const updateVisitStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: "status e obrigatorio" });
    }

    const normalizedStatus = normalizeUpper(status);
    if (FORBIDDEN_DIRECT_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({
        error:
          normalizedStatus === "IN_CONSULTATION"
            ? "Use /visits/:id/start-consultation para iniciar a consulta."
            : "Use /visits/:id/finish para finalizar a visita.",
      });
    }

    const updated = await visitModel.updateVisitStatus(req.params.id, normalizedStatus);
    if (!updated) return res.status(404).json({ error: "Visita nao encontrada" });

    return res.json(updated);
  } catch (error) {
    return sendServerError(res, "UPDATE STATUS ERROR", error, "Erro ao atualizar status da visita");
  }
};

const finishVisit = async (req, res) => {
  try {
    const visit = await visitModel.getVisitById(req.params.id);
    if (!visit) return res.status(404).json({ error: "Visita nao encontrada" });

    const hasPendingLab =
      !!visit.lab_requested &&
      !String(visit.lab_result_text || "").trim() &&
      normalizeUpper(visit.lab_result_status) !== "READY";

    const finished = await visitModel.finishVisit(req.params.id);
    if (!finished) {
      return res.status(400).json({
        error:
          "Nao e possivel finalizar: preencha e salve questionario clinico, diagnostico, raciocinio clinico, prescricao e destino do paciente.",
      });
    }

    if (hasPendingLab) {
      return res.json({
        ...finished,
        pending_lab_after_discharge: true,
        pending_lab_message:
          "Consulta finalizada. Pedido laboratorial enviado ao tecnico; resultado sera notificado quando estiver pronto.",
      });
    }

    return res.json(finished);
  } catch (error) {
    return sendServerError(res, "FINISH VISIT ERROR", error, "Erro ao finalizar visita");
  }
};

const assignDoctor = async (req, res) => {
  try {
    const doctorId = parsePositiveInt(req.body?.doctor_id);
    if (!doctorId) return res.status(400).json({ error: "doctor_id e obrigatorio" });

    const updated = await visitModel.assignDoctor(req.params.id, doctorId);
    if (!updated) return res.status(404).json({ error: "Visita nao encontrada" });

    return res.json(updated);
  } catch (error) {
    return sendServerError(res, "ASSIGN DOCTOR ERROR", error, "Erro ao atribuir medico");
  }
};

const startConsultation = async (req, res) => {
  try {
    const updated = await visitModel.startConsultation(req.params.id, req.user.id);
    if (!updated) {
      return res.status(400).json({
        error:
          "Nao e possivel iniciar consulta: falta triagem ou a visita nao esta em WAITING_DOCTOR.",
      });
    }

    return res.json(updated);
  } catch (error) {
    return sendServerError(res, "START CONSULT ERROR", error, "Erro ao iniciar consulta");
  }
};

const cancelVisit = async (req, res) => {
  try {
    const cancelled = await visitModel.cancelVisit(
      req.params.id,
      req.body?.reason,
      req.user?.id || null
    );

    if (!cancelled) {
      return res.status(404).json({ error: "Visita nao encontrada ou ja finalizada/cancelada" });
    }

    return res.json(cancelled);
  } catch (error) {
    return sendServerError(res, "CANCEL VISIT ERROR", error, "Erro ao cancelar visita");
  }
};

const editVisitPriority = async (req, res) => {
  try {
    const { priority, max_wait_minutes } = req.body || {};
    if (!priority || !max_wait_minutes) {
      return res.status(400).json({ error: "priority e max_wait_minutes sao obrigatorios" });
    }

    const updated = await visitModel.editPriority(req.params.id, priority, max_wait_minutes);
    if (!updated) return res.status(404).json({ error: "Visita nao encontrada" });

    return res.json(updated);
  } catch (error) {
    return sendServerError(res, "EDIT PRIORITY ERROR", error, "Erro ao editar prioridade");
  }
};

const saveMedicalPlan = async (req, res) => {
  try {
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
      lab_exam_type,
      lab_sample_type,
      lab_tests,
      lab_sample_collected_at,
      lab_result_text,
      lab_result_json,
      lab_result_status,
      lab_result_ready_at,
      hospital_status,
      vital_status,
      is_bedridden,
      inpatient_unit,
      inpatient_bed,
      discharged_at,
      death_note,
      doctor_questionnaire_json,
      accepted,
    } = req.body || {};

    const disposition = disposition_plan || "";
    if (!ALLOWED_DISPOSITIONS.has(disposition)) {
      return res.status(400).json({ error: "disposition_plan invalido" });
    }

    const hospital = normalizeUpper(hospital_status);
    if (!ALLOWED_HOSPITAL_STATUSES.has(hospital)) {
      return res.status(400).json({ error: "hospital_status invalido" });
    }

    const vital = normalizeUpper(vital_status);
    if (!ALLOWED_VITAL_STATUSES.has(vital)) {
      return res.status(400).json({ error: "vital_status invalido" });
    }

    const updated = await visitModel.saveMedicalPlan(
      req.params.id,
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
        lab_exam_type,
        lab_sample_type,
        lab_tests,
        lab_sample_collected_at,
        lab_result_text,
        lab_result_json,
        lab_result_status,
        lab_result_ready_at,
        hospital_status: hospital || null,
        vital_status: vital || null,
        is_bedridden: !!is_bedridden,
        inpatient_unit,
        inpatient_bed,
        discharged_at,
        death_note,
        doctor_questionnaire_json,
        accepted: !!accepted,
      },
      { actorId: req.user?.id || null, isAdmin: req.user?.role === "ADMIN" }
    );

    if (!updated) {
      return res.status(404).json({
        error: "Visita nao encontrada, finalizada/cancelada, ou sem permissao para salvar plano.",
      });
    }

    return res.json(updated);
  } catch (error) {
    return sendServerError(res, "SAVE MEDICAL PLAN ERROR", error, "Erro ao salvar plano medico");
  }
};

const scheduleVisitReturn = async (req, res) => {
  try {
    const { return_visit_date, return_visit_reason } = req.body || {};
    if (!return_visit_date) {
      return res.status(400).json({ error: "return_visit_date e obrigatorio" });
    }

    const parsedReturnDate = new Date(`${return_visit_date}T00:00:00`);
    if (Number.isNaN(parsedReturnDate.getTime())) {
      return res.status(400).json({ error: "return_visit_date invalida" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedReturnDate.getTime() <= today.getTime()) {
      return res.status(400).json({
        error: "Nao e permitido agendar retorno para hoje. Escolha amanha ou uma data futura.",
      });
    }

    const updated = await visitModel.scheduleReturn(
      req.params.id,
      {
        return_visit_date,
        return_visit_reason: return_visit_reason || null,
      },
      { actorId: req.user?.id || null, isAdmin: req.user?.role === "ADMIN" }
    );

    if (!updated) {
      return res.status(404).json({
        error:
          "Visita nao encontrada, finalizada/cancelada, ou sem permissao para agendar retorno.",
      });
    }

    return res.json(updated);
  } catch (error) {
    return sendServerError(res, "SCHEDULE RETURN ERROR", error, "Erro ao agendar retorno");
  }
};

const updatePastVisitSummary = async (req, res) => {
  try {
    const { likely_diagnosis, clinical_reasoning, prescription_text, doctor_id, hospital_status } =
      req.body || {};

    const hospital = normalizeUpper(hospital_status);
    if (!ALLOWED_HOSPITAL_STATUSES.has(hospital)) {
      return res.status(400).json({ error: "hospital_status invalido" });
    }

    const updated = await visitModel.updatePastVisitSummary(req.params.id, {
      likely_diagnosis,
      clinical_reasoning,
      prescription_text,
      doctor_id: doctor_id ? Number(doctor_id) : null,
      hospital_status: hospital || null,
    });

    if (!updated) {
      return res.status(404).json({ error: "Visita antiga nao encontrada" });
    }

    return res.json(updated);
  } catch (error) {
    return sendServerError(
      res,
      "UPDATE PAST VISIT SUMMARY ERROR",
      error,
      "Erro ao atualizar visita antiga"
    );
  }
};

const removeVisitTriage = async (req, res) => {
  try {
    const visitId = parsePositiveInt(req.params.id);
    if (!visitId) return res.status(400).json({ error: "id invalido" });

    const result = await visitModel.removeTriageFromVisit(visitId, {
      actorId: req.user?.id || null,
    });

    if (!result) {
      return res.status(404).json({
        error: "Visita nao encontrada, ou visita nao permite remocao.",
      });
    }

    return res.json(result);
  } catch (error) {
    return sendServerError(
      res,
      "REMOVE VISIT TRIAGE ERROR",
      error,
      "Erro ao remover triagem da visita"
    );
  }
};

const listLabPendingRequests = async (_req, res) => {
  try {
    const rows = await visitModel.listLabPendingRequests();
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    return sendServerError(
      res,
      "LIST LAB PENDING ERROR",
      error,
      "Erro ao listar pedidos pendentes do laboratorio"
    );
  }
};

const listLabReadyResults = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 200);
    const rows = await visitModel.listLabReadyResults(
      Number.isFinite(limit) && limit > 0 ? limit : 200
    );
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    return sendServerError(res, "LIST LAB READY ERROR", error, "Erro ao listar resultados prontos");
  }
};

const listLabHistoryToday = async (_req, res) => {
  try {
    const rows = await visitModel.listLabHistoryToday();
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    return sendServerError(
      res,
      "LIST LAB HISTORY TODAY ERROR",
      error,
      "Erro ao listar historico do dia do laboratorio"
    );
  }
};

const saveLabResult = async (req, res) => {
  try {
    const { lab_result_text, lab_result_json, lab_result_status, lab_result_ready_at } =
      req.body || {};

    if (!String(lab_result_text || "").trim()) {
      return res.status(400).json({ error: "lab_result_text e obrigatorio" });
    }

    const updated = await visitModel.saveLabResultByLabTechnician(req.params.id, {
      lab_result_text,
      lab_result_json,
      lab_result_status,
      lab_result_ready_at,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ error: "Visita nao encontrada ou sem pedido laboratorial ativo" });
    }

    if (updated.doctor_id) {
      try {
        await notificationModel.createNotification({
          user_id: updated.doctor_id,
          title: "Resultado laboratorial pronto",
          message: `O resultado do exame da visita #${updated.id} esta pronto e disponivel para revisao.`,
          level: "INFO",
          source: "LAB",
          visit_id: updated.id,
        });
      } catch (notifyError) {
        console.error("LAB RESULT NOTIFICATION ERROR:", notifyError);
      }
    }

    return res.json(updated);
  } catch (error) {
    return sendServerError(
      res,
      "SAVE LAB RESULT ERROR",
      error,
      "Erro ao salvar resultado do laboratorio"
    );
  }
};

const updateLabWorkflow = async (req, res) => {
  try {
    const { lab_result_status, lab_sample_collected_at } = req.body || {};
    const updated = await visitModel.updateLabWorkflowByLabTechnician(req.params.id, {
      lab_result_status,
      lab_sample_collected_at,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ error: "Visita nao encontrada ou sem pedido laboratorial ativo" });
    }

    return res.json(updated);
  } catch (error) {
    return sendServerError(
      res,
      "UPDATE LAB WORKFLOW ERROR",
      error,
      "Erro ao atualizar o fluxo laboratorial"
    );
  }
};

const notifyPatientLabReady = async (req, res) => {
  try {
    const visitId = parsePositiveInt(req.params.id);
    if (!visitId) return res.status(400).json({ error: "id invalido" });

    const note = typeof req.body?.note === "string" ? req.body.note : null;
    const updated = await visitModel.markLabPatientNotified(visitId, {
      actorId: req.user?.id || null,
      note,
    });

    if (!updated) {
      return res.status(404).json({
        error: "Visita nao encontrada ou sem resultado laboratorial pronto.",
      });
    }

    return res.json(updated);
  } catch (error) {
    return sendServerError(
      res,
      "NOTIFY PATIENT LAB READY ERROR",
      error,
      "Erro ao marcar aviso ao paciente"
    );
  }
};

module.exports = {
  assignDoctor,
  cancelVisit,
  createVisit,
  editVisitPriority,
  finishVisit,
  getMyAgenda,
  getVisitById,
  listActiveVisits,
  listLabHistoryToday,
  listLabPendingRequests,
  listLabReadyResults,
  listPastVisits,
  notifyPatientLabReady,
  removeVisitTriage,
  saveLabResult,
  saveMedicalPlan,
  scheduleVisitReturn,
  setTriagePriority,
  startConsultation,
  updateLabWorkflow,
  updatePastVisitSummary,
  updateVisitStatus,
};
