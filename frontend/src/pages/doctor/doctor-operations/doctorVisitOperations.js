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
  let nextPreview = preview;

  if (rawStatus === "WAITING_DOCTOR") {
    await api.startConsultation(visitId);
    nextPreview = { ...(preview || {}), status: "IN_CONSULTATION" };
  } else if (rawStatus === "FINISHED" || rawStatus === "WAITING" || rawStatus === "IN_TRIAGE") {
    await api.setVisitStatus(visitId, "WAITING_DOCTOR");
    await api.startConsultation(visitId);
    nextPreview = { ...(preview || {}), status: "IN_CONSULTATION" };
  }

  await loadQueue();
  return nextPreview;
};

export const resetDoctorFollowupToWaiting = async (visitId) => {
  return api.setVisitStatus(visitId, "WAITING");
};
