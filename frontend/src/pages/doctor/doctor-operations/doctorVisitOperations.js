import { api } from "../../../lib/api";

export const loadDoctorVisitBundle = async (visitId) => {
  const visit = await api.getVisitById(visitId);

  let patient = null;
  let history = [];
  try {
    const [patientResp, historyResp] = await Promise.all([
      api.getPatientById(visit.patient_id),
      api.getPatientHistory(visit.patient_id),
    ]);
    patient = patientResp || null;
    history = Array.isArray(historyResp) ? historyResp : [];
  } catch {
    patient = null;
    history = [];
  }

  let triage = null;
  try {
    triage = await api.getTriageByVisitId(visitId);
  } catch {
    triage = null;
  }

  return {
    visit,
    patient,
    history,
    triage,
  };
};

export const startDoctorConsultationAction = async (visitId) => {
  return api.startConsultation(visitId);
};

export const prepareDoctorQueueVisit = async ({ visitId, row, meId, loadQueue }) => {
  if (row?.doctor_id && Number(row?.doctor_id) !== Number(meId)) {
    throw new Error("Este paciente ja foi atribuido a outro medico.");
  }
  if (row?.status === "WAITING_DOCTOR") {
    if (row?.doctor_id && Number(row?.doctor_id) !== Number(meId)) {
      throw new Error("Este paciente já foi atribuído a outro médico.");
    }
    await api.startConsultation(visitId);
    await loadQueue();
  }
};

export const reopenDoctorFollowupVisit = async ({ visitId, preview, sourceMeta, loadQueue }) => {
  const rawStatus = String(preview?.status || sourceMeta?.status || "").toUpperCase();
  const activeChildVisitId = preview?.active_child_visit_id || sourceMeta?.active_child_visit_id;
  let nextPreview = preview;

  if (activeChildVisitId) {
    nextPreview = {
      ...(preview || {}),
      id: activeChildVisitId,
      status: sourceMeta?.active_child_status || "WAITING_DOCTOR",
    };
  } else if (rawStatus === "FINISHED") {
    const child = await api.openReturnVisit(visitId);
    nextPreview = {
      ...(preview || {}),
      ...child,
      source_visit_id: visitId,
      is_followup_visit: true,
    };
  }

  const nextVisitId = nextPreview?.id || visitId;
  const nextStatus = String(nextPreview?.status || rawStatus).toUpperCase();

  if (nextStatus === "WAITING_DOCTOR") {
    await api.startConsultation(nextVisitId);
    nextPreview = { ...(nextPreview || {}), id: nextVisitId, status: "IN_CONSULTATION" };
  } else if (nextStatus === "WAITING" || nextStatus === "IN_TRIAGE") {
    throw new Error("Este retorno ainda precisa passar pela triagem antes da consulta.");
  }

  await loadQueue();
  return nextPreview;
};

export const resetDoctorFollowupToWaiting = async (visitId, options = {}) => {
  return api.openReturnVisit(visitId, { force_full_consultation: !!options.forceFullConsultation });
};
