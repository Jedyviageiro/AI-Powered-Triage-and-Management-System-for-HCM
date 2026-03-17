import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { api } from "../../../lib/api";
import { clearAuth } from "../../../lib/auth";
import {
  DEFAULT_PREFERENCES,
  escapeHtml,
  normalizeDoctorsResponse,
  statusLabel,
} from "../nurse-helpers/nurseHelpers";

const makeClosedPatientEditModal = () => ({
  open: false,
  loading: false,
  saving: false,
  page: "patient",
  visitId: null,
  patientId: null,
  clinical_code: "",
  full_name: "",
  sex: "M",
  birth_date: "",
  guardian_name: "",
  guardian_phone: "",
  triageLoading: false,
  triageSaving: false,
  triageId: null,
  triage_temperature: "",
  triage_heart_rate: "",
  triage_respiratory_rate: "",
  triage_oxygen_saturation: "",
  triage_weight: "",
  triage_chief_complaint: "",
  triage_clinical_notes: "",
  triage_general_state: "",
  triage_needs_oxygen: false,
  triage_suspected_severe_dehydration: false,
  triage_excessive_lethargy: false,
  triage_difficulty_maintaining_sitting: false,
  triage_history_syncope_collapse: false,
  triage_priority: "URGENT",
  triage_max_wait_minutes: "",
});

export function useNursePageActions({
  me,
  liveNotifications,
  notifications,
  patientLabFollowup,
  code,
  nameQuery,
  pClinicalCode,
  pFullName,
  pSex,
  pBirthDate,
  pGuardianName,
  pGuardianPhone,
  destinationNotes,
  showPopup,
  setPdfLoadingId,
  setErr,
  setQueueErr,
  setLoadingDoctors,
  setDoctors,
  setLoadingQueue,
  setQueue,
  setQueueSummary,
  setLoadingPastVisits,
  setPastVisits,
  setLoadingNotifications,
  setNotifications,
  setLocalNotificationReads,
  setLoadingPreferences,
  setPreferences,
  setSavingPreferences,
  setLoadingShift,
  setShiftStatus,
  setStartingShift,
  setShiftMenuOpen,
  setSearchResults,
  setPatient,
  setVisit,
  setAiSuggestion,
  setSelectedDoctorId,
  setForceTriageForLabFollowup,
  setSearchLoading,
  setCreatingPatient,
  setCreatingVisit,
  setPClinicalCode,
  setPFullName,
  setPSex,
  setPBirthDate,
  setPGuardianName,
  setPGuardianPhone,
  setTemperature,
  setHeartRate,
  setRespRate,
  setSpo2,
  setWeight,
  setGeneralState,
  setNeedsOxygen,
  setSuspectedSevereDehydration,
  setExcessiveLethargy,
  setDifficultyMaintainingSitting,
  setHistorySyncopeCollapse,
  setChiefComplaint,
  setClinicalNotes,
  setPriority,
  setCustomMaxWait,
  setTriageStep,
  setHoldInWaitingLine,
  setBypassToER,
  setPatientEditModal,
}) {
  const logout = useCallback(() => {
    clearAuth();
    window.location.replace("/login");
  }, []);

  const closePatientEditModal = useCallback(() => {
    setPatientEditModal(makeClosedPatientEditModal());
  }, [setPatientEditModal]);

  const downloadVisitPdf = useCallback(
    async (visit) => {
      if (!visit) return;
      setPdfLoadingId(visit.id);
      const generatedAt = new Date().toLocaleString("pt-PT");
      const visitDate = visit.consultation_ended_at
        ? new Date(visit.consultation_ended_at).toLocaleString("pt-PT")
        : visit.arrival_time
          ? new Date(visit.arrival_time).toLocaleString("pt-PT")
          : "-";
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;left:-99999px;top:0;width:900px;background:#ffffff;z-index:-1;";
      container.innerHTML = `
      <article style="font-family:'IBM Plex Sans','Segoe UI',Arial,sans-serif;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <header style="background:linear-gradient(135deg,#0c3a24,#165034);color:#fff;padding:16px 18px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">Relatório Clínico da Consulta</h1>
          <p style="margin:6px 0 0;font-size:12px;opacity:.95;">Documento gerado em ${escapeHtml(generatedAt)}</p>
        </header>
        <section style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;padding:14px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Consulta</span><span style="color:#111827;font-weight:600;">#${escapeHtml(visit.id)}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Data</span><span style="color:#111827;font-weight:600;">${escapeHtml(visitDate)}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Paciente</span><span style="color:#111827;font-weight:600;">${escapeHtml(visit.full_name || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Código Clínico</span><span style="color:#111827;font-weight:600;">${escapeHtml(visit.clinical_code || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Médico</span><span style="color:#111827;font-weight:600;">${escapeHtml(visit.doctor_full_name || visit.doctor_username || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Estado</span><span style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#dcebe2;color:#0c3a24;">${escapeHtml(statusLabel(visit.status || "-"))}</span></div>
        </section>
      </article>`;
      document.body.appendChild(container);
      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = 210;
        const margin = 10;
        const renderWidth = pageWidth - margin * 2;
        const renderHeight = (canvas.height * renderWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", margin, margin, renderWidth, renderHeight);
        pdf.save(`consulta_${visit.id}.pdf`);
      } catch (e) {
        showPopup("warning", "Atenção", `Não foi possível gerar o PDF: ${e?.message}`);
      } finally {
        setPdfLoadingId(null);
        if (container.parentNode) container.parentNode.removeChild(container);
      }
    },
    [setPdfLoadingId, showPopup]
  );

  const downloadDischargeSummaryPdf = useCallback(
    async (visitRow) => {
      if (!visitRow) return;
      setPdfLoadingId(visitRow.id);
      const generatedAt = new Date().toLocaleString("pt-PT");
      const dischargeNote =
        String(destinationNotes[visitRow.id] || visitRow.nurse_discharge_note || "").trim() ||
        "Sem nota adicional.";
      const followUpDate = visitRow.return_visit_date
        ? new Date(
            `${String(visitRow.return_visit_date).slice(0, 10)}T00:00:00`
          ).toLocaleDateString("pt-PT")
        : null;
      const followUpTime = String(visitRow.follow_up_when || "").trim() || null;
      const followUpText = followUpDate
        ? `${followUpDate}${followUpTime ? ` às ${followUpTime}` : ""}`
        : "Sem retorno agendado";
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;left:-99999px;top:0;width:900px;background:#ffffff;z-index:-1;";
      container.innerHTML = `
      <article style="font-family:'IBM Plex Sans','Segoe UI',Arial,sans-serif;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <header style="background:linear-gradient(135deg,#0c3a24,#165034);color:#fff;padding:16px 18px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">Resumo de Alta</h1>
          <p style="margin:6px 0 0;font-size:12px;opacity:.95;">Documento gerado em ${escapeHtml(generatedAt)}</p>
        </header>
        <section style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;padding:14px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Paciente</span><span style="color:#111827;font-weight:600;">${escapeHtml(visitRow.full_name || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Código Clínico</span><span style="color:#111827;font-weight:600;">${escapeHtml(visitRow.clinical_code || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Visita</span><span style="color:#111827;font-weight:600;">#${escapeHtml(visitRow.id || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Médico</span><span style="color:#111827;font-weight:600;">${escapeHtml(visitRow.doctor_full_name || visitRow.doctor_username || "-")}</span></div>
        </section>
        <section style="padding:16px 18px;display:grid;gap:14px;">
          <div>
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Diagnóstico / avaliação</div>
            <div style="font-size:13px;color:#111827;">${escapeHtml(visitRow.likely_diagnosis || visitRow.clinical_reasoning || "Sem registo clínico resumido.")}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Prescrição / orientações</div>
            <div style="font-size:13px;color:#111827;white-space:pre-wrap;">${escapeHtml(visitRow.prescription_text || visitRow.follow_up_instructions || "Sem instruções registadas.")}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Seguimento</div>
            <div style="font-size:13px;color:#111827;">${escapeHtml(followUpText)}</div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Nota de alta da enfermagem</div>
            <div style="font-size:13px;color:#111827;white-space:pre-wrap;">${escapeHtml(dischargeNote)}</div>
          </div>
        </section>
      </article>`;
      document.body.appendChild(container);
      try {
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = 210;
        const margin = 10;
        const renderWidth = pageWidth - margin * 2;
        const renderHeight = (canvas.height * renderWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", margin, margin, renderWidth, renderHeight);
        pdf.save(`alta_${visitRow.id}.pdf`);
      } catch (e) {
        showPopup("warning", "Atenção", `Não foi possível gerar o resumo de alta: ${e?.message}`);
      } finally {
        setPdfLoadingId(null);
        if (container.parentNode) container.parentNode.removeChild(container);
      }
    },
    [destinationNotes, setPdfLoadingId, showPopup]
  );

  const resetAll = useCallback(() => {
    setErr("");
    setSearchResults([]);
    setPatient(null);
    setVisit(null);
    setPClinicalCode("");
    setPFullName("");
    setPSex("M");
    setPBirthDate("");
    setPGuardianName("");
    setPGuardianPhone("");
    setTemperature("");
    setHeartRate("");
    setRespRate("");
    setSpo2("");
    setWeight("");
    setGeneralState("");
    setNeedsOxygen(false);
    setSuspectedSevereDehydration(false);
    setExcessiveLethargy(false);
    setDifficultyMaintainingSitting(false);
    setHistorySyncopeCollapse(false);
    setChiefComplaint("");
    setClinicalNotes("");
    setPriority("URGENT");
    setCustomMaxWait("");
    setAiSuggestion(null);
    setSelectedDoctorId("");
    setTriageStep(1);
    setHoldInWaitingLine(false);
    setBypassToER(false);
    setForceTriageForLabFollowup(false);
  }, [
    setAiSuggestion,
    setBypassToER,
    setChiefComplaint,
    setClinicalNotes,
    setCustomMaxWait,
    setDifficultyMaintainingSitting,
    setErr,
    setExcessiveLethargy,
    setForceTriageForLabFollowup,
    setGeneralState,
    setHeartRate,
    setHistorySyncopeCollapse,
    setHoldInWaitingLine,
    setNeedsOxygen,
    setPBirthDate,
    setPClinicalCode,
    setPFullName,
    setPGuardianName,
    setPGuardianPhone,
    setPSex,
    setPatient,
    setPriority,
    setRespRate,
    setSearchResults,
    setSelectedDoctorId,
    setSpo2,
    setSuspectedSevereDehydration,
    setTemperature,
    setTriageStep,
    setVisit,
    setWeight,
  ]);

  const loadDoctors = useCallback(
    async (signal) => {
      setErr("");
      setLoadingDoctors(true);
      try {
        const resp = await api.listDoctors();
        if (signal?.aborted) return;
        setDoctors(normalizeDoctorsResponse(resp));
      } catch (e) {
        if (signal?.aborted) return;
        setDoctors([]);
        setErr(e.message);
      } finally {
        if (!signal?.aborted) setLoadingDoctors(false);
      }
    },
    [setDoctors, setErr, setLoadingDoctors]
  );

  const loadQueue = useCallback(async () => {
    setQueueErr("");
    setLoadingQueue(true);
    try {
      const [data, summary] = await Promise.all([
        api.getQueue(),
        api.getQueueSummary().catch(() => null),
      ]);
      setQueue(Array.isArray(data) ? data : []);
      if (summary && typeof summary === "object") setQueueSummary(summary);
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setLoadingQueue(false);
    }
  }, [setLoadingQueue, setQueue, setQueueErr, setQueueSummary]);

  const loadPastVisits = useCallback(async () => {
    setLoadingPastVisits(true);
    try {
      const data = await api.listPastVisits(300);
      const rows = Array.isArray(data) ? data : [];
      setPastVisits(
        rows.map((v) => ({
          ...v,
          doctor_specialization: String(
            v?.doctor_specialization ?? v?.specialization ?? v?.doctor?.specialization ?? ""
          ).trim(),
        }))
      );
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setLoadingPastVisits(false);
    }
  }, [setLoadingPastVisits, setPastVisits, setQueueErr]);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const listResp = await api.listNotifications(200);
      const rows = Array.isArray(listResp?.notifications) ? listResp.notifications : [];
      setNotifications(rows);
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setLoadingNotifications(false);
    }
  }, [setLoadingNotifications, setNotifications, setQueueErr]);

  const markNotificationRead = useCallback(
    async (id) => {
      if (!id) return;
      if (String(id).startsWith("local:")) {
        const stampedAt = new Date().toISOString();
        setLocalNotificationReads((prev) => {
          if (prev?.[id]) return prev;
          return { ...(prev || {}), [id]: stampedAt };
        });
        return;
      }
      try {
        await api.markNotificationRead(id);
        await loadNotifications();
      } catch (e) {
        setQueueErr(e.message);
      }
    },
    [loadNotifications, setLocalNotificationReads, setQueueErr]
  );

  const markAllNotificationsRead = useCallback(async () => {
    const unreadLocalIds = liveNotifications
      .filter((notification) => !notification?.read_at)
      .map((notification) => String(notification.id));
    if (unreadLocalIds.length > 0) {
      const stampedAt = new Date().toISOString();
      setLocalNotificationReads((prev) => {
        const next = { ...(prev || {}) };
        unreadLocalIds.forEach((id) => {
          next[id] = next[id] || stampedAt;
        });
        return next;
      });
    }
    try {
      const hasUnreadServerNotifications = notifications.some(
        (notification) => !notification?.read_at
      );
      if (hasUnreadServerNotifications) {
        await api.markAllNotificationsRead();
        await loadNotifications();
      }
    } catch (e) {
      setQueueErr(e.message);
    }
  }, [liveNotifications, loadNotifications, notifications, setLocalNotificationReads, setQueueErr]);

  const loadPreferences = useCallback(async () => {
    setLoadingPreferences(true);
    try {
      const data = await api.getMyPreferences();
      setPreferences({ ...DEFAULT_PREFERENCES, ...(data || {}) });
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setLoadingPreferences(false);
    }
  }, [setLoadingPreferences, setPreferences, setQueueErr]);

  const savePreferences = useCallback(
    async (payload) => {
      setSavingPreferences(true);
      try {
        const data = await api.updateMyPreferences(payload || {});
        const merged = { ...DEFAULT_PREFERENCES, ...(data || {}) };
        setPreferences(merged);
        return merged;
      } finally {
        setSavingPreferences(false);
      }
    },
    [setPreferences, setSavingPreferences]
  );

  const previewPreferences = useCallback(
    (patch) => {
      setPreferences((prev) => ({ ...prev, ...(patch || {}) }));
    },
    [setPreferences]
  );

  const loadShiftStatus = useCallback(async () => {
    if (String(me?.role || "").toUpperCase() !== "NURSE") return;
    setLoadingShift(true);
    try {
      const data = await api.getNurseShiftStatus();
      setShiftStatus(data || null);
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setLoadingShift(false);
    }
  }, [me?.role, setLoadingShift, setQueueErr, setShiftStatus]);

  const startShift = useCallback(async () => {
    if (String(me?.role || "").toUpperCase() !== "NURSE") return;
    setShiftMenuOpen(false);
    setStartingShift(true);
    try {
      const res = await api.startNurseShift();
      setShiftStatus(res?.status || null);
      const delay = Number.isFinite(Number(res?.delay_minutes)) ? Number(res.delay_minutes) : 0;
      showPopup(
        "success",
        "Turno iniciado",
        delay > 0
          ? `Início registado com ${delay} minuto(s) de atraso.`
          : "Início registado sem atraso."
      );
    } catch (e) {
      setQueueErr(e.message);
      showPopup("warning", "Atenção", e.message || "Não foi possível iniciar o turno.");
    } finally {
      setStartingShift(false);
    }
  }, [me?.role, setQueueErr, setShiftMenuOpen, setShiftStatus, setStartingShift, showPopup]);

  const searchPatient = useCallback(
    async (searchMode) => {
      setErr("");
      setSearchLoading(true);
      setSearchResults([]);
      setPatient(null);
      setVisit(null);
      setAiSuggestion(null);
      setSelectedDoctorId("");
      setForceTriageForLabFollowup(false);
      try {
        if (searchMode === "CODE") {
          if (!code.trim()) {
            setErr("Informe o código clínico.");
            return;
          }
          const data = await api.getPatientByCode(code.trim());
          setPatient(data);
          setForceTriageForLabFollowup(false);
        } else {
          if (!nameQuery.trim() || nameQuery.trim().length < 2) {
            setErr("Informe pelo menos 2 letras no nome.");
            return;
          }
          const data = await api.searchPatients(nameQuery.trim());
          setSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setErr(e.message);
      } finally {
        setSearchLoading(false);
      }
    },
    [
      code,
      nameQuery,
      setAiSuggestion,
      setErr,
      setForceTriageForLabFollowup,
      setPatient,
      setSearchLoading,
      setSearchResults,
      setSelectedDoctorId,
      setVisit,
    ]
  );

  const createPatient = useCallback(
    async (e) => {
      e.preventDefault();
      setErr("");
      setCreatingPatient(true);
      try {
        const created = await api.createPatient({
          clinical_code: pClinicalCode.trim(),
          full_name: pFullName.trim(),
          sex: pSex,
          birth_date: pBirthDate,
          guardian_name: pGuardianName.trim(),
          guardian_phone: pGuardianPhone.trim(),
        });
        setPatient(created);
        setSearchResults([]);
        setAiSuggestion(null);
        setVisit(null);
        setSelectedDoctorId("");
        setForceTriageForLabFollowup(false);
      } catch (e2) {
        setErr(e2.message);
      } finally {
        setCreatingPatient(false);
      }
    },
    [
      pBirthDate,
      pClinicalCode,
      pFullName,
      pGuardianName,
      pGuardianPhone,
      pSex,
      setAiSuggestion,
      setCreatingPatient,
      setErr,
      setForceTriageForLabFollowup,
      setPatient,
      setSearchResults,
      setSelectedDoctorId,
      setVisit,
    ]
  );

  const createVisit = useCallback(
    async ({ patient, forceNewConsultation = false } = {}) => {
      if (!patient?.id) return;
      setErr("");
      setCreatingVisit(true);
      try {
        const derivedVisitMotive = (() => {
          if (patientLabFollowup?.isResult || patientLabFollowup?.isSample) {
            if (patientLabFollowup?.isSample) return "LAB_SAMPLE_COLLECTION";
            return "LAB_RESULTS";
          }
          return "MEDICAL_CONSULTATION";
        })();
        const v = await api.createVisit(patient.id, {
          force_new_consultation: !!forceNewConsultation,
          visit_motive: derivedVisitMotive,
        });
        setVisit(v);
        await loadQueue();
      } catch (e) {
        setErr(e.message);
      } finally {
        setCreatingVisit(false);
      }
    },
    [loadQueue, patientLabFollowup, setCreatingVisit, setErr, setVisit]
  );

  return {
    logout,
    closePatientEditModal,
    downloadVisitPdf,
    downloadDischargeSummaryPdf,
    resetAll,
    loadDoctors,
    loadQueue,
    loadPastVisits,
    loadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    loadPreferences,
    savePreferences,
    previewPreferences,
    loadShiftStatus,
    startShift,
    searchPatient,
    createPatient,
    createVisit,
  };
}
