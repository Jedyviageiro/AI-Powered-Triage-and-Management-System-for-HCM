import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { api } from "../../../lib/api";
import { clearAuth } from "../../../lib/auth";
import {
  DEFAULT_PREFERENCES,
  calculateAgeYears,
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
  alt_phone: "",
  address: "",
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
  pFullName,
  pSex,
  pBirthDate,
  pGuardianName,
  pGuardianPhone,
  pAltPhone,
  pAddress,
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
  setLoadingRoomSettings,
  setRoomSettings,
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
  setPAltPhone,
  setPAddress,
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
  openConfirmPopup,
}) {
  const logout = useCallback(() => {
    openConfirmPopup({
      title: "Confirmar logout",
      message: "Tem a certeza de que deseja terminar a sessão e voltar ao ecrã de login?",
      confirmLabel: "Terminar sessão",
      onConfirm: async () => {
        clearAuth();
        window.location.replace("/login");
      },
    });
  }, [openConfirmPopup]);

  const closePatientEditModal = useCallback(() => {
    setPatientEditModal(makeClosedPatientEditModal());
  }, [setPatientEditModal]);

  const downloadVisitPdf = useCallback(
    async (visit, options = {}) => {
      if (!visit) return;
      setPdfLoadingId(visit.id);
      const template = options?.template || "today-summary";
      const timeline = Array.isArray(options?.timeline) ? options.timeline : [];
      const generatedAt = new Date().toLocaleString("pt-PT");
      const visitDate = visit.consultation_ended_at
        ? new Date(visit.consultation_ended_at).toLocaleString("pt-PT")
        : visit.arrival_time
          ? new Date(visit.arrival_time).toLocaleString("pt-PT")
          : "-";
      const formatVisitDate = (row) => {
        const raw = row?.consultation_ended_at || row?.arrival_time || row?.created_at;
        if (!raw) return "-";
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString("pt-PT");
      };
      const title =
        template === "today-summary" ? "Resumo Clinico de Hoje" : "Registo Clinico Completo";
      const filePrefix = template === "today-summary" ? "resumo_consulta" : "registo_completo";
      const rows = template === "today-summary" ? [visit] : [visit, ...timeline].filter(Boolean);
      const clinicalBlocks =
        template === "today-summary"
          ? `
        <section style="padding:18px;display:grid;gap:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:#ffffff;">
              <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Diagnostico de hoje</div>
              <div style="font-size:14px;line-height:1.55;color:#111827;">${escapeHtml(visit.likely_diagnosis || visit.clinical_reasoning || "Sem diagnostico registado.")}</div>
            </div>
            <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:#ffffff;">
              <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Prescricao</div>
              <div style="font-size:14px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escapeHtml(visit.prescription_text || "Sem prescricao registada.")}</div>
            </div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:#f8fafc;">
            <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Queixa / resumo</div>
            <div style="font-size:13px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escapeHtml(visit.chief_complaint || visit.triage_chief_complaint || visit.clinical_notes || "Sem resumo clinico adicional.")}</div>
          </div>
        </section>`
          : `
        <section style="padding:18px;display:grid;gap:12px;">
          <div style="font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Registo clinico completo</div>
          ${rows
            .map(
              (row, index) => `
              <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px;background:${index === 0 ? "#f8fafc" : "#ffffff"};">
                <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:8px;">
                  <strong style="font-size:14px;color:#0f172a;">${escapeHtml(row.chief_complaint || row.triage_chief_complaint || row.return_visit_reason || `Consulta #${row.visit_id || row.id || "-"}`)}</strong>
                  <span style="font-size:11px;color:#64748b;white-space:nowrap;">${escapeHtml(formatVisitDate(row))}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;color:#334155;">
                  <div><span style="display:block;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.07em;">Diagnostico</span>${escapeHtml(row.likely_diagnosis || "Nao registado")}</div>
                  <div><span style="display:block;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.07em;">Medico</span>${escapeHtml(row.doctor_full_name || row.doctor_username || "Nao registado")}</div>
                </div>
                <div style="margin-top:10px;font-size:12px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escapeHtml(row.clinical_notes || row.clinical_reasoning || "Sem notas clinicas adicionais.")}</div>
                <div style="margin-top:8px;font-size:12px;line-height:1.55;color:#111827;white-space:pre-wrap;"><strong>Prescricao:</strong> ${escapeHtml(row.prescription_text || "Sem prescricao registada.")}</div>
              </div>`
            )
            .join("")}
        </section>`;
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed;left:-99999px;top:0;width:900px;background:#ffffff;z-index:-1;";
      container.innerHTML = `
      <article style="font-family:'IBM Plex Sans','Segoe UI',Arial,sans-serif;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <header style="background:linear-gradient(135deg,#0c3a24,#165034);color:#fff;padding:16px 18px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">${escapeHtml(title)}</h1>
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
        ${clinicalBlocks}
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
        pdf.save(`${filePrefix}_${visit.id}.pdf`);
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
    setPAltPhone("");
    setPAddress("");
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
    setPAltPhone,
    setPAddress,
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

  const loadNextClinicalCode = useCallback(async () => {
    try {
      const data = await api.getNextClinicalCode();
      setPClinicalCode(String(data?.clinical_code || ""));
    } catch (e) {
      setErr(e.message);
    }
  }, [setErr, setPClinicalCode]);

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

  const loadRoomSettings = useCallback(async () => {
    setLoadingRoomSettings(true);
    try {
      const data = await api.getRoomSettings();
      setRoomSettings({
        urgent_room_total: Number(data?.urgent_room_total || 4),
        standard_room_total: Number(data?.standard_room_total || 4),
        quick_room_total: Number(data?.quick_room_total || 4),
        urgent_room_description: String(data?.urgent_room_description || "Para casos criticos com necessidade de monitorizacao continua."),
        standard_room_description: String(data?.standard_room_description || "Para casos moderados sem necessidade de cuidados intensivos."),
        quick_room_description: String(data?.quick_room_description || "Para casos leves sem necessidade de monitorizacao ou acesso IV."),
        urgent_room_tags: Array.isArray(data?.urgent_room_tags) ? data.urgent_room_tags : ["monitor", "oxigenio", "iv"],
        standard_room_tags: Array.isArray(data?.standard_room_tags) ? data.standard_room_tags : ["consulta", "observacao", "avaliacao"],
        quick_room_tags: Array.isArray(data?.quick_room_tags) ? data.quick_room_tags : ["rapido", "leve", "sem-iv"],
        urgent_room_labels: Array.isArray(data?.urgent_room_labels) ? data.urgent_room_labels : [],
        standard_room_labels: Array.isArray(data?.standard_room_labels) ? data.standard_room_labels : [],
        quick_room_labels: Array.isArray(data?.quick_room_labels) ? data.quick_room_labels : [],
      });
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setLoadingRoomSettings(false);
    }
  }, [setLoadingRoomSettings, setQueueErr, setRoomSettings]);

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
          const query = nameQuery.trim();
          if (query.length < 2) {
            showPopup(
              "warning",
              "Pesquisa incompleta",
              "Informe pelo menos 2 letras do nome para pesquisar na base de dados."
            );
            return;
          }
          const data = await api.searchPatients(query);
          const results = Array.isArray(data) ? data : [];
          setSearchResults(results);
          if (results.length === 0) {
            showPopup(
              "warning",
              "Paciente nao encontrado",
              `O paciente "${query}" nao esta atualmente disponivel na base de dados. Confirme o nome ou cadastre um novo paciente.`
            );
          }
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
      showPopup,
    ]
  );

  const createPatient = useCallback(
    async (e) => {
      e.preventDefault();
      setErr("");
      const ageYears = calculateAgeYears(pBirthDate);
      if (!Number.isInteger(ageYears) || ageYears < 0) {
        showPopup("warning", "Data invalida", "Informe uma data de nascimento valida.");
        return;
      }
      if (ageYears < 6) {
        showPopup(
          "warning",
          "Faixa etaria nao suportada",
          "A triagem nao e para recem-nascidos, lactentes ou criancas menores de 6 anos."
        );
        return;
      }
      if (ageYears > 17) {
        showPopup(
          "warning",
          "Faixa etaria nao suportada",
          "O sistema e somente para triagem pediatrica, nao para adultos."
        );
        return;
      }
      setCreatingPatient(true);
      try {
        const created = await api.createPatient({
          full_name: pFullName.trim(),
          sex: pSex,
          birth_date: pBirthDate,
          guardian_name: pGuardianName.trim(),
          guardian_phone: pGuardianPhone.trim(),
          alt_phone: pAltPhone.trim(),
          address: pAddress.trim(),
        });
        setPatient(created);
        setSearchResults([]);
        setAiSuggestion(null);
        setVisit(null);
        setSelectedDoctorId("");
        setForceTriageForLabFollowup(false);
        await loadNextClinicalCode();
      } catch (e2) {
        setErr(e2.message);
      } finally {
        setCreatingPatient(false);
      }
    },
    [
      pBirthDate,
      pFullName,
      pGuardianName,
      pGuardianPhone,
      pAltPhone,
      pAddress,
      pSex,
      showPopup,
      setAiSuggestion,
      setCreatingPatient,
      setErr,
      setForceTriageForLabFollowup,
      setPatient,
      setSearchResults,
      setSelectedDoctorId,
      setVisit,
      loadNextClinicalCode,
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
        return v;
      } catch (e) {
        setErr(e.message);
        return null;
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
    loadNextClinicalCode,
    loadDoctors,
    loadQueue,
    loadPastVisits,
    loadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    loadPreferences,
    loadRoomSettings,
    savePreferences,
    previewPreferences,
    loadShiftStatus,
    startShift,
    searchPatient,
    createPatient,
    createVisit,
  };
}
