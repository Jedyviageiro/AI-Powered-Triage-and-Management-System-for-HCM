import { useMemo, useState, useEffect } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
const PRIORITIES = [
  { value: "URGENT", label: "Urgente", maxWait: 60, color: "#ef4444", bg: "#fef2f2", border: "#fca5a5" },
  { value: "LESS_URGENT", label: "Pouco Urgente", maxWait: 120, color: "#f97316", bg: "#fff7ed", border: "#fdba74" },
  { value: "NON_URGENT", label: "Não Urgente", maxWait: 240, color: "#22c55e", bg: "#f0fdf4", border: "#86efac" },
];

const priorityLabel = (value) =>
  PRIORITIES.find((p) => p.value === value)?.label || "Não classificado";

function normalizeDoctorsResponse(resp) {
  const raw = Array.isArray(resp)
    ? resp
    : resp && Array.isArray(resp.doctors)
    ? resp.doctors
    : resp && Array.isArray(resp.data)
    ? resp.data
    : [];
  return raw.map((d) => ({
    ...d,
    specialization: String(d?.specialization ?? d?.doctor_specialization ?? d?.especializacao ?? "").trim(),
  }));
}

const statusLabel = (s) => {
  if (s === "WAITING") return "Aguardando Triagem";
  if (s === "IN_TRIAGE") return "Em Triagem";
  if (s === "WAITING_DOCTOR") return "Aguardando Médico";
  if (s === "IN_CONSULTATION") return "Em Consulta";
  if (s === "FINISHED") return "Finalizado";
  if (s === "CANCELLED") return "Cancelado";
  return s || "-";
};

const isValidNumber = (v, { min = -Infinity, max = Infinity } = {}) => {
  if (v === "" || v == null) return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max;
};

const calculateAgeYears = (birthDate) => {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return null;
  const now = new Date();
  const hadBirthdayThisYear = now >= new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  return Math.max(0, now.getFullYear() - bd.getFullYear() - (hadBirthdayThisYear ? 0 : 1));
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export default function TriageNurse() {
  const me = getUser();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("home");

  const [searchMode, setSearchMode] = useState("CODE");
  const [code, setCode] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [topNavSearch, setTopNavSearch] = useState("");
  const [topSearchFocus, setTopSearchFocus] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [err, setErr] = useState("");
  const [patient, setPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);

  // New patient form
  const [pClinicalCode, setPClinicalCode] = useState("");
  const [pFullName, setPFullName] = useState("");
  const [pSex, setPSex] = useState("M");
  const [pBirthDate, setPBirthDate] = useState("");
  const [pGuardianName, setPGuardianName] = useState("");
  const [pGuardianPhone, setPGuardianPhone] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);

  const [visit, setVisit] = useState(null);
  const [creatingVisit, setCreatingVisit] = useState(false);

  const [temperature, setTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respRate, setRespRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weight, setWeight] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [priority, setPriority] = useState("URGENT");
  const [customMaxWait, setCustomMaxWait] = useState("");
  const [savingTriage, setSavingTriage] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueErr, setQueueErr] = useState("");
  const [pastVisits, setPastVisits] = useState([]);
  const [loadingPastVisits, setLoadingPastVisits] = useState(false);

  const [editingVisit, setEditingVisit] = useState(null);
  const [editPriority, setEditPriority] = useState("URGENT");
  const [editMaxWait, setEditMaxWait] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);
  const [popup, setPopup] = useState({
    open: false,
    type: "warning",
    title: "",
    message: "",
  });
  const [cancelModal, setCancelModal] = useState({
    open: false,
    visitId: null,
    reason: "",
  });
  const [pastVisitModal, setPastVisitModal] = useState({
    open: false,
    visit: null,
  });
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  // Step state for new triage wizard
  const [triageStep, setTriageStep] = useState(1);

  const selectedPriority = useMemo(() => PRIORITIES.find((p) => p.value === priority), [priority]);
  const availableDoctors = useMemo(() => doctors.filter((d) => d?.is_busy === false), [doctors]);
  const busyDoctors = useMemo(() => doctors.filter((d) => d?.is_busy === true), [doctors]);
  const urgentQueue = useMemo(() => queue.filter((v) => v?.priority === "URGENT"), [queue]);
  const nonUrgentQueue = useMemo(() => queue.filter((v) => v?.priority !== "URGENT"), [queue]);
  const patientAgeYears = useMemo(() => calculateAgeYears(patient?.birth_date), [patient?.birth_date]);

  const latestRecordedWeight = useMemo(() => {
    if (!Array.isArray(patientHistory)) return null;
    for (const h of patientHistory) {
      if (h?.weight != null && Number.isFinite(Number(h.weight))) return Number(h.weight);
    }
    return null;
  }, [patientHistory]);

  const triageFieldsOk = useMemo(() => {
    const hasChief = chiefComplaint.trim().length > 0;
    const okTemp = isValidNumber(temperature, { min: 25, max: 45 });
    const okSpo2 = isValidNumber(spo2, { min: 1, max: 100 });
    const okHR = isValidNumber(heartRate, { min: 20, max: 260 });
    const okRR = isValidNumber(respRate, { min: 5, max: 120 });
    const okWeight = isValidNumber(weight, { min: 0.5, max: 300 });
    return hasChief && okTemp && okSpo2 && okHR && okRR && okWeight;
  }, [chiefComplaint, temperature, spo2, heartRate, respRate, weight]);

  const aiShortReason = useMemo(() => {
    if (!aiSuggestion) return "";
    if (Array.isArray(aiSuggestion?.reasons) && aiSuggestion.reasons.length > 0) {
      return aiSuggestion.reasons
        .map((r) => String(r || "").trim())
        .filter(Boolean)
        .slice(0, 1)
        .join("");
    }
    return String(
      aiSuggestion?.reason ||
      aiSuggestion?.match_reason ||
      aiSuggestion?.short_reason ||
      ""
    ).trim();
  }, [aiSuggestion]);

  const logout = () => { clearAuth(); window.location.replace("/login"); };

  const showPopup = (type, title, message) => {
    setPopup({ open: true, type, title, message });
  };

  const closePopup = () => {
    setPopup({ open: false, type: "warning", title: "", message: "" });
    setErr("");
    setQueueErr("");
  };

  const openCancelModal = (visitId) => {
    setCancelModal({ open: true, visitId, reason: "" });
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, visitId: null, reason: "" });
  };
  const openPastVisitModal = (visit) => {
    setPastVisitModal({ open: true, visit: visit || null });
  };
  const closePastVisitModal = () => {
    setPastVisitModal({ open: false, visit: null });
  };

  const downloadVisitPdf = async (visit) => {
    if (!visit) return;
    setPdfLoadingId(visit.id);

    const generatedAt = new Date().toLocaleString("pt-PT");
    const visitDate = visit.consultation_ended_at
      ? new Date(visit.consultation_ended_at).toLocaleString("pt-PT")
      : visit.arrival_time
      ? new Date(visit.arrival_time).toLocaleString("pt-PT")
      : "-";

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-99999px";
    container.style.top = "0";
    container.style.width = "900px";
    container.style.background = "#ffffff";
    container.style.zIndex = "-1";
    container.innerHTML = `
      <article style="font-family:Poppins,'Segoe UI',Arial,sans-serif;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <header style="background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;padding:16px 18px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;">Relatório Clínico da Consulta</h1>
          <p style="margin:6px 0 0;font-size:12px;opacity:.95;">Documento gerado em ${escapeHtml(generatedAt)}</p>
        </header>
        <section style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;padding:14px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Consulta</span><span style="color:#111827;font-weight:600;">#${escapeHtml(visit.id)}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Data</span><span style="color:#111827;font-weight:600;">${escapeHtml(visitDate)}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Paciente</span><span style="color:#111827;font-weight:600;">${escapeHtml(visit.full_name || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Código Clínico</span><span style="color:#111827;font-weight:600;">${escapeHtml(visit.clinical_code || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Médico</span><span style="color:#111827;font-weight:600;">${escapeHtml(visit.doctor_full_name || visit.doctor_username || "-")}</span></div>
          <div style="font-size:12px;"><span style="color:#64748b;display:block;margin-bottom:2px;">Estado</span><span style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:#dcfce7;color:#166534;">${escapeHtml(statusLabel(visit.status || "-"))}</span></div>
        </section>
        <section style="padding:14px 18px;border-bottom:1px solid #f1f5f9;">
          <h2 style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#166534;">Queixa Principal</h2>
          <p style="margin:0;white-space:pre-wrap;font-size:13px;line-height:1.5;">${escapeHtml(visit.chief_complaint || visit.triage_chief_complaint || "-")}</p>
        </section>
        <section style="padding:14px 18px;border-bottom:1px solid #f1f5f9;">
          <h2 style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#166534;">Diagnóstico e Fundamentação</h2>
          <p style="margin:0;white-space:pre-wrap;font-size:13px;line-height:1.5;"><strong>Diagnóstico:</strong> ${escapeHtml(visit.likely_diagnosis || "-")}</p>
          <p style="margin:8px 0 0;white-space:pre-wrap;font-size:13px;line-height:1.5;"><strong>Justificativa:</strong> ${escapeHtml(visit.clinical_reasoning || "-")}</p>
        </section>
        <section style="padding:14px 18px;border-bottom:1px solid #f1f5f9;">
          <h2 style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#166534;">Prescrição</h2>
          <p style="margin:0;white-space:pre-wrap;font-size:13px;line-height:1.5;">${escapeHtml(visit.prescription_text || "-")}</p>
        </section>
        <section style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <h2 style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#166534;">Destino e Seguimento</h2>
            <p style="margin:0;font-size:13px;line-height:1.5;"><strong>Destino:</strong> ${escapeHtml(visit.disposition_plan || "-")}</p>
            <p style="margin:6px 0 0;font-size:13px;line-height:1.5;"><strong>Motivo:</strong> ${escapeHtml(visit.disposition_reason || "-")}</p>
            <p style="margin:6px 0 0;font-size:13px;line-height:1.5;"><strong>Retorno:</strong> ${escapeHtml(visit.return_visit_date || "-")}</p>
          </div>
          <div>
            <h2 style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#166534;">Laboratório</h2>
            <p style="margin:0;font-size:13px;line-height:1.5;"><strong>Solicitado:</strong> ${visit.lab_requested ? "Sim" : "Não"}</p>
            <p style="margin:6px 0 0;font-size:13px;line-height:1.5;"><strong>Tipo:</strong> ${escapeHtml(visit.lab_exam_type || "-")}</p>
            <p style="margin:6px 0 0;font-size:13px;line-height:1.5;"><strong>Exames:</strong> ${escapeHtml(visit.lab_tests || "-")}</p>
            <p style="margin:6px 0 0;font-size:13px;line-height:1.5;"><strong>Resultado:</strong> ${escapeHtml(visit.lab_result_text || "-")}</p>
          </div>
        </section>
      </article>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const renderWidth = pageWidth - margin * 2;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;

      let heightLeft = renderHeight;
      let position = margin;
      pdf.addImage(imgData, "PNG", margin, position, renderWidth, renderHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (renderHeight - heightLeft);
        pdf.addImage(imgData, "PNG", margin, position, renderWidth, renderHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text("Sistema de Triagem Pediátrica • Uso clínico interno", margin, pageHeight - 5);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
      }

      const filenameBase = String(visit.full_name || "paciente")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      pdf.save(`consulta_${visit.id}_${filenameBase || "paciente"}.pdf`);
    } catch (e) {
      showPopup("warning", "Atenção", `Não foi possível gerar o PDF: ${e?.message || "erro desconhecido"}`);
    } finally {
      setPdfLoadingId(null);
      if (container.parentNode) container.parentNode.removeChild(container);
    }
  };

  const resetAll = () => {
    setErr(""); setSearchResults([]); setPatient(null); setVisit(null);
    setCode(""); setNameQuery(""); setPClinicalCode(""); setPFullName("");
    setPSex("M"); setPBirthDate(""); setPGuardianName(""); setPGuardianPhone("");
    setTemperature(""); setHeartRate(""); setRespRate(""); setSpo2(""); setWeight("");
    setChiefComplaint(""); setClinicalNotes(""); setPriority("URGENT");
    setCustomMaxWait(""); setAiSuggestion(null); setSelectedDoctorId("");
    setTriageStep(1);
  };

  const loadDoctors = async (signal) => {
    setErr(""); setLoadingDoctors(true);
    try {
      const resp = await api.listDoctors();
      if (signal?.aborted) return;
      setDoctors(normalizeDoctorsResponse(resp));
    } catch (e) {
      if (signal?.aborted) return;
      setDoctors([]); setErr(e.message);
    } finally {
      if (!signal?.aborted) setLoadingDoctors(false);
    }
  };

  const loadQueue = async () => {
    setQueueErr(""); setLoadingQueue(true);
    try {
      const data = await api.getQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (e) { setQueueErr(e.message); }
    finally { setLoadingQueue(false); }
  };

  const loadPastVisits = async () => {
    setLoadingPastVisits(true);
    try {
      const data = await api.listPastVisits(300);
      const rows = Array.isArray(data) ? data : [];
      setPastVisits(rows.map((v) => ({
        ...v,
        doctor_specialization: String(v?.doctor_specialization ?? v?.specialization ?? v?.doctor?.specialization ?? "").trim(),
      })));
    } catch (e) { setQueueErr(e.message); }
    finally { setLoadingPastVisits(false); }
  };

  const openEdit = (v) => { setEditingVisit(v); setEditPriority(v.priority || "URGENT"); setEditMaxWait(v.max_wait_minutes != null ? String(v.max_wait_minutes) : ""); };

  const saveEdit = async () => {
    if (!editingVisit?.id) return;
    const defaultMax = PRIORITIES.find((p) => p.value === editPriority)?.maxWait ?? 60;
    const maxWait = editMaxWait !== "" ? Number(editMaxWait) : defaultMax;
    if (!Number.isFinite(maxWait) || maxWait <= 0) { setQueueErr("Tempo máx. inválido."); return; }
    setSavingEdit(true); setQueueErr("");
    try {
      await api.setVisitPriority(editingVisit.id, { priority: editPriority, max_wait_minutes: maxWait });
      setEditingVisit(null); await loadQueue();
      showPopup("success", "Atualizado", "Prioridade da visita atualizada com sucesso.");
    } catch (e) { setQueueErr(e.message); }
    finally { setSavingEdit(false); }
  };

  const confirmCancelVisit = async () => {
    if (!cancelModal.visitId) return;
    const visitId = cancelModal.visitId;
    const reason = cancelModal.reason;
    setCancellingId(visitId); setQueueErr("");
    try {
      await api.cancelVisit(visitId, reason.trim() || null);
      await loadQueue();
      closeCancelModal();
      showPopup("success", "Visita cancelada", "A visita foi cancelada com sucesso.");
    } catch (e) { setQueueErr(e.message); }
    finally { setCancellingId(null); }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadDoctors(controller.signal);
    const interval = setInterval(() => { const ctrl = new AbortController(); loadDoctors(ctrl.signal); }, 30 * 60 * 1000);
    return () => { controller.abort(); clearInterval(interval); };
  }, []);

  useEffect(() => {
    loadQueue(); loadPastVisits();
    const interval = setInterval(() => { loadQueue(); loadPastVisits(); }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!patient?.id) { setPatientHistory([]); return; }
      try {
        const history = await api.getPatientHistory(patient.id);
        if (!cancelled) setPatientHistory(Array.isArray(history) ? history : []);
      } catch { if (!cancelled) setPatientHistory([]); }
    };
    run();
    return () => { cancelled = true; };
  }, [patient?.id]);

  useEffect(() => {
    if (activeView === "doctors") loadDoctors();
    if (activeView === "patients") loadPastVisits();
  }, [activeView]);

  useEffect(() => {
    if (err) showPopup("warning", "Atenção", err);
  }, [err]);

  useEffect(() => {
    if (queueErr) showPopup("warning", "Atenção", queueErr);
  }, [queueErr]);

  const searchPatient = async () => {
    setErr(""); setSearchLoading(true); setSearchResults([]); setPatient(null); setVisit(null); setAiSuggestion(null); setSelectedDoctorId("");
    try {
      if (searchMode === "CODE") {
        if (!code.trim()) { setErr("Informe o código clínico."); return; }
        const data = await api.getPatientByCode(code.trim());
        setPatient(data);
      } else {
        if (!nameQuery.trim() || nameQuery.trim().length < 2) { setErr("Informe pelo menos 2 letras no nome."); return; }
        const data = await api.searchPatients(nameQuery.trim());
        setSearchResults(Array.isArray(data) ? data : []);
      }
    } catch (e) { setErr(e.message); }
    finally { setSearchLoading(false); }
  };

  const createPatient = async (e) => {
    e.preventDefault(); setErr(""); setCreatingPatient(true);
    try {
      const created = await api.createPatient({ clinical_code: pClinicalCode.trim(), full_name: pFullName.trim(), sex: pSex, birth_date: pBirthDate, guardian_name: pGuardianName.trim(), guardian_phone: pGuardianPhone.trim() });
      setPatient(created); setSearchResults([]); setAiSuggestion(null); setVisit(null); setSelectedDoctorId("");
    } catch (e2) { setErr(e2.message); }
    finally { setCreatingPatient(false); }
  };

  const createVisit = async () => {
    if (!patient?.id) return;
    setErr(""); setCreatingVisit(true);
    try {
      const v = await api.createVisit(patient.id);
      setVisit(v); await loadQueue();
    } catch (e) { setErr(e.message); }
    finally { setCreatingVisit(false); }
  };

  const askAI = async () => {
    if (!triageFieldsOk) { setErr("Para usar IA, preencha TODOS os dados: Temperatura, SpO2, FC, FR, Peso e Queixa principal."); return; }
    setErr(""); setAiLoading(true); setAiSuggestion(null);
    try {
      const res = await api.aiTriageSuggest({ age_years: patientAgeYears, chief_complaint: chiefComplaint.trim(), clinical_notes: clinicalNotes.trim() || null, temperature: Number(temperature), heart_rate: Number(heartRate), respiratory_rate: Number(respRate), oxygen_saturation: Number(spo2), weight: Number(weight) });
      setAiSuggestion(res);
    } catch (e) { setErr(e.message); }
    finally { setAiLoading(false); }
  };

  const assignDoctor = async () => {
    if (!visit?.id) { setErr("Crie a visita antes de atribuir médico."); return; }
    if (!selectedDoctorId) { setErr("Selecione um médico disponível."); return; }
    setErr(""); setAssigning(true);
    try {
      const updated = await api.assignDoctor(visit.id, Number(selectedDoctorId));
      setVisit(updated || visit);
      showPopup("success", "Atribuição concluída", "Paciente atribuído ao médico com sucesso.");
      await loadDoctors(); await loadQueue();
    } catch (e) { setErr(e.message); }
    finally { setAssigning(false); }
  };

  const searchFromTopNav = async () => {
    const q = topNavSearch.trim();
    if (!q) {
      showPopup("warning", "Pesquisa vazia", "Escreva um nome para pesquisar.");
      return;
    }
    setSearchLoading(true);
    setErr("");
    try {
      const data = await api.searchPatients(q);
      setActiveView("newTriage");
      setSearchMode("NAME");
      setNameQuery(q);
      setSearchResults(Array.isArray(data) ? data : []);
      setPatient(null);
      setVisit(null);
      setAiSuggestion(null);
      setSelectedDoctorId("");
      setTriageStep(1);
      if (!Array.isArray(data) || data.length === 0) {
        showPopup("warning", "Sem resultados", "Nenhum paciente encontrado com esse nome.");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const saveTriage = async (e) => {
    e.preventDefault();
    if (!visit?.id) { setErr("Crie a visita (chegada) antes de registrar a triagem."); return; }
    if (!chiefComplaint.trim()) { setErr("Informe a queixa principal."); return; }
    const currentWeight = weight === "" ? null : Number(weight);
    if (currentWeight != null && Number.isFinite(currentWeight) && latestRecordedWeight != null && Number.isFinite(latestRecordedWeight) && latestRecordedWeight > 0) {
      const ratio = currentWeight / latestRecordedWeight;
      if (ratio < 0.7 || ratio > 1.5) { setErr(`Peso inconsistente com histórico recente (${latestRecordedWeight} kg). Revise antes de salvar triagem.`); return; }
    }
    setErr(""); setSavingTriage(true);
    try {
      await api.createTriage({ visit_id: visit.id, temperature: temperature === "" ? null : Number(temperature), heart_rate: heartRate === "" ? null : Number(heartRate), respiratory_rate: respRate === "" ? null : Number(respRate), oxygen_saturation: spo2 === "" ? null : Number(spo2), weight: weight === "" ? null : Number(weight), chief_complaint: chiefComplaint.trim(), clinical_notes: clinicalNotes.trim() || null });
      const maxWait = customMaxWait !== "" ? Number(customMaxWait) : selectedPriority?.maxWait;
      await api.setVisitPriority(visit.id, { priority, max_wait_minutes: maxWait });
      resetAll(); await loadQueue();
      showPopup("success", "Triagem concluída", "Triagem registrada com sucesso.");
    } catch (e2) { setErr(e2.message); }
    finally { setSavingTriage(false); }
  };

  const navItems = [
    { key: "home", label: "Início", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { key: "newTriage", label: "Nova Triagem", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> },
    { key: "queue", label: "Fila de Espera", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, badge: queue.length > 0 ? queue.length : null },
    { key: "doctors", label: "Disponibilidade", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { key: "patients", label: "Pacientes antigos", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  ];

  // Triage steps config
  const triageSteps = [
    { num: 1, label: "Paciente" },
    { num: 2, label: "Avaliação" },
    { num: 3, label: "Prioridade" },
  ];

  const getStepStatus = (stepNum) => {
    if (stepNum < triageStep) return "done";
    if (stepNum === triageStep) return "active";
    return "pending";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'DM Sans', sans-serif; }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
        }

        .sidebar { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); overflow: hidden; }
        .sidebar-open { width: 256px; }
        .sidebar-closed { width: 68px; }

        .nav-label { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .nav-label { opacity: 1; max-width: 200px; }
        .sidebar-closed .nav-label { opacity: 0; max-width: 0; }

        .logo-text { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .logo-text { opacity: 1; max-width: 200px; }
        .sidebar-closed .logo-text { opacity: 0; max-width: 0; }

        .user-info { transition: opacity 0.2s ease, max-height 0.3s ease; overflow: hidden; }
        .sidebar-open .user-info { opacity: 1; max-height: 80px; }
        .sidebar-closed .user-info { opacity: 0; max-height: 0; }

        .sidebar-closed .nav-badge { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; font-size: 10px; border-radius: 9999px; }
        .nav-badge-open { width: 20px; height: 20px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }

        .nav-tooltip { position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%); background: #111827; color: #fff; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s ease; z-index: 50; }
        .sidebar-closed .nav-item-wrap:hover .nav-tooltip { opacity: 1; }
        .sidebar-open .nav-tooltip { display: none; }

        /* Step wizard styles */
        .step-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 8px; border-radius: 2px; transition: background 0.3s; }
        .step-line.done { background: #22c55e; }

        .step-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; transition: all 0.3s; flex-shrink: 0; }
        .step-circle.pending { background: #f3f4f6; color: #9ca3af; border: 2px solid #e5e7eb; }
        .step-circle.active { background: #22c55e; color: white; border: 2px solid #22c55e; }
        .step-circle.done { background: #22c55e; color: white; border: 2px solid #22c55e; }

        /* Triage input styles */
        .triage-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 14px; color: #111827; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
        .triage-input::placeholder { color: #d1d5db; }
        .triage-input:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }

        .triage-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; letter-spacing: 0.01em; }
        .triage-hint { font-size: 11px; color: #9ca3af; margin-bottom: 6px; line-height: 1.4; }

        /* Priority card */
        .priority-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; background: #fff; display: flex; align-items: center; gap: 12px; }
        .priority-card:hover { border-color: #86efac; background: #fafafa; }
        .priority-card.selected-urgent { border-color: #ef4444; background: #fef2f2; }
        .priority-card.selected-less { border-color: #f97316; background: #fff7ed; }
        .priority-card.selected-non { border-color: #22c55e; background: #f0fdf4; }

        .priority-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .priority-radio.checked-urgent { border-color: #ef4444; background: #ef4444; }
        .priority-radio.checked-less { border-color: #f97316; background: #f97316; }
        .priority-radio.checked-non { border-color: #22c55e; background: #22c55e; }
        .priority-radio-dot { width: 6px; height: 6px; border-radius: 50%; background: white; }

        /* Search mode tabs */
        .search-tab { flex: 1; padding: 8px 12px; font-size: 13px; font-weight: 500; border-radius: 8px; transition: all 0.15s; border: none; cursor: pointer; }
        .search-tab.active { background: #22c55e; color: white; }
        .search-tab.inactive { background: transparent; color: #6b7280; }
        .search-tab.inactive:hover { background: #f3f4f6; }

        /* Patient result card */
        .patient-result-card { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; background: #fff; text-align: left; width: 100%; }
        .patient-result-card:hover { border-color: #22c55e; background: #f0fdf4; }

        /* Patient confirmed card */
        .patient-confirmed { background: linear-gradient(135deg, #ecfdf5 0%, #dcfce7 100%); border: 1.5px solid #86efac; border-radius: 12px; padding: 16px; }

        /* AI suggestion card */
        .ai-card { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #86efac; border-radius: 12px; padding: 14px; }
        .ai-badge { display: inline-flex; align-items: center; gap: 4px; background: #22c55e; color: white; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; margin-bottom: 8px; }

        /* Primary button */
        .btn-primary { background: #22c55e; color: white; border: none; border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; width: 100%; }
        .btn-primary:hover:not(:disabled) { background: #16a34a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,0.28); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }

        .btn-secondary { background: #f3f4f6; color: #374151; border: none; border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; width: 100%; }
        .btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
        .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-ghost { background: transparent; color: #16a34a; border: 1.5px solid #86efac; border-radius: 10px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .btn-ghost:hover:not(:disabled) { background: #f0fdf4; }
        .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Section divider */
        .section-divider { border: none; border-top: 1.5px dashed #e5e7eb; margin: 20px 0; }

        /* Card container */
        .form-card { background: white; border: 1px solid #f0f0f0; border-radius: 16px; padding: 28px; box-shadow: 0 1px 8px rgba(0,0,0,0.04); }

        /* Nav active */
        .nav-active { background: #22c55e !important; color: white !important; border-radius: 10px; }

        /* Chip/pill */
        .chip { display: inline-flex; align-items: center; padding: 5px 12px; border: 1.5px solid #e5e7eb; border-radius: 20px; font-size: 12px; font-weight: 500; color: #4b5563; cursor: pointer; transition: all 0.15s; background: white; }
        .chip:hover { border-color: #22c55e; color: #16a34a; background: #f0fdf4; }
        .chip.chip-selected { border-color: #22c55e; color: #16a34a; background: #ecfdf5; }

        /* Doctor select card */
        .doctor-card { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.15s; }
        .doctor-card:hover { border-color: #22c55e; }
        .doctor-card.selected { border-color: #22c55e; background: #ecfdf5; }
        .doc-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #4ade80); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0; }

        /* Step nav buttons */
        .step-nav { display: flex; gap: 10px; margin-top: 20px; }
        .btn-primary, .btn-secondary, .btn-ghost { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }

        /* Vital sign input group */
        .vital-group { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        /* Popups */
        .popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }
        .popup-card {
          width: min(460px, 100%);
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
          padding: 18px;
        }
        .popup-icon {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .popup-icon-warning { background: #fef3c7; color: #b45309; }
        .popup-icon-success { background: #dcfce7; color: #166534; }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar bg-white flex flex-col flex-shrink-0 ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-gray-700">
            {sidebarOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
          <div className="logo-text min-w-0">
            <div className="text-sm font-bold text-gray-900 leading-tight">Triagem</div>
            <div className="text-xs text-gray-400 font-medium">Painel Enfermagem</div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.key} className="nav-item-wrap relative">
                <button
                  onClick={() => setActiveView(item.key)}
                  className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-all flex items-center gap-3 relative rounded-xl ${activeView === item.key ? "nav-active" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
                >
                  {item.icon}
                  <span className="nav-label">{item.label}</span>
                  {item.badge && sidebarOpen && (
                    <span className="ml-auto nav-badge-open bg-green-500 text-white">{item.badge}</span>
                  )}
                  {item.badge && !sidebarOpen && (
                    <span className="nav-badge absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center">{item.badge}</span>
                  )}
                </button>
                <span className="nav-tooltip">{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="user-info mb-2 px-1" />
          <div className="nav-item-wrap relative">
            <button onClick={logout} className="w-full px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-3 rounded-xl">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="nav-label">Sair</span>
            </button>
            <span className="nav-tooltip">Sair</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "white",
          borderBottom: "1px solid #f0f0f0",
          height: "60px",
          display: "flex",
          alignItems: "center",
          paddingLeft: "24px",
          paddingRight: "24px",
          gap: "16px",
        }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                maxWidth: "360px",
                background: "#f9fafb",
                border: `1.5px solid ${topSearchFocus ? "#86efac" : "#f0f0f0"}`,
                borderRadius: "10px",
                padding: "8px 14px",
                transition: "border-color 0.15s",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Pesquisar paciente"
                value={topNavSearch}
                onChange={(e) => setTopNavSearch(e.target.value)}
                onFocus={() => setTopSearchFocus(true)}
                onBlur={() => setTopSearchFocus(false)}
                onKeyDown={(e) => e.key === "Enter" && searchFromTopNav()}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "13px",
                  color: "#374151",
                  width: "100%",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => showPopup("warning", "Em breve", "Chat interno disponível em breve.")}
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => showPopup("warning", "Notificações", "Sem novas notificações no momento.")}
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", position: "relative", transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{ position: "absolute", top: "5px", right: "5px", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", border: "1.5px solid white" }} />
            </button>

            <div style={{ marginLeft: "6px", fontSize: "13px", fontWeight: 600, color: "#374151", maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {me?.full_name || "Utilizador"}
            </div>
            <button style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #e5e7eb", overflow: "hidden", cursor: "pointer", marginLeft: "4px", padding: 0, background: "linear-gradient(135deg, #16a34a, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "white" }}>
                {me?.full_name?.trim()?.[0]?.toUpperCase() || "D"}
              </span>
            </button>
          </div>
        </div>
        <div className="p-8 max-w-5xl mx-auto">

          {/* Error */}
          {/* HOME VIEW */}
          {activeView === "home" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Painel</h1>
              <p className="text-gray-500 text-sm mb-8">Bem-vindo(a), {me?.full_name?.split(' ')[0] || 'Enfermeiro(a)'}</p>

              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total na Fila", value: queue.length, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>, bg: "#ecfdf5" },
                  { label: "Médicos Disponíveis", value: availableDoctors.length, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, bg: "#f0fdf4" },
                  { label: "Médicos Ocupados", value: busyDoctors.length, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, bg: "#fef2f2" },
                  { label: "Visita Ativa", value: visit ? "Sim" : "Não", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>, bg: "#ecfdf5" },
                ].map(({ label, value, icon, bg }) => (
                  <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>{icon}</div>
                    <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
                    <div className="text-xs font-medium text-gray-500">{label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setActiveView("newTriage")} className="p-5 rounded-xl border-2 border-dashed border-green-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4"/></svg>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">Iniciar Nova Triagem</div>
                    <div className="text-xs text-gray-500">Registrar paciente e iniciar avaliação</div>
                  </button>
                  <button onClick={() => setActiveView("queue")} className="p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all text-left group">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857"/></svg>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-1">Ver Fila de Espera</div>
                    <div className="text-xs text-gray-500">Gerenciar pacientes em espera</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NEW TRIAGE VIEW - Step Wizard */}
          {activeView === "newTriage" && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Nova Triagem</h1>
              <p className="text-sm text-gray-500 mb-8">Siga os passos abaixo para registrar a triagem</p>

              {/* Step Progress */}
              <div className="form-card mb-6">
                <div style={{ display: "flex", alignItems: "center" }}>
                  {triageSteps.map((step, idx) => (
                    <div key={step.num} style={{ display: "flex", alignItems: "center", flex: idx < triageSteps.length - 1 ? "1" : "0" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div className={`step-circle ${getStepStatus(step.num)}`}>
                          {getStepStatus(step.num) === "done" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : step.num}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: getStepStatus(step.num) === "pending" ? "#9ca3af" : "#16a34a", whiteSpace: "nowrap" }}>{step.label}</span>
                      </div>
                      {idx < triageSteps.length - 1 && (
                        <div className={`step-line ${getStepStatus(step.num) === "done" ? "done" : ""}`} style={{ marginBottom: "20px" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 1: Patient */}
              {triageStep === 1 && (
                <div className="form-card">
                  <h2 className="text-base font-semibold text-gray-900 mb-1">Localizar ou Cadastrar Paciente</h2>
                  <p className="text-xs text-gray-400 mb-5">Busque pelo código clínico ou nome do paciente</p>

                  {/* Search Mode Toggle */}
                  <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "10px", marginBottom: "16px", gap: "4px" }}>
                    <button onClick={() => setSearchMode("CODE")} className={`search-tab ${searchMode === "CODE" ? "active" : "inactive"}`}>Por Código</button>
                    <button onClick={() => setSearchMode("NAME")} className={`search-tab ${searchMode === "NAME" ? "active" : "inactive"}`}>Por Nome</button>
                  </div>

                  {searchMode === "CODE" ? (
                    <div className="mb-4">
                      <label className="triage-label">Código Clínico</label>
                      <div style={{ position: "relative" }}>
                        <input className="triage-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: P0001" style={{ paddingRight: "40px" }} onKeyDown={(e) => e.key === "Enter" && searchPatient()} />
                        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="triage-label">Nome do Paciente</label>
                      <div style={{ position: "relative" }}>
                        <input className="triage-input" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="Ex: João" style={{ paddingRight: "40px" }} onKeyDown={(e) => e.key === "Enter" && searchPatient()} />
                        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        </span>
                      </div>
                    </div>
                  )}

                  <button onClick={searchPatient} disabled={searchLoading} className="btn-primary" style={{ marginBottom: "16px" }}>
                    {searchLoading ? "Buscando..." : "Buscar Paciente"}
                  </button>

                  {/* Search results */}
                  {searchMode === "NAME" && searchResults.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div className="triage-label" style={{ marginBottom: "8px" }}>Resultados encontrados</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                        {searchResults.map((p) => (
                          <button key={p.id} onClick={() => { setPatient(p); setAiSuggestion(null); setVisit(null); setSelectedDoctorId(""); }} className="patient-result-card">
                            <div style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>{p.full_name}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{p.clinical_code}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patient found */}
                  {patient && (
                    <div className="patient-confirmed" style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>{patient.full_name}</div>
                          <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "500", marginTop: "2px" }}>{patient.clinical_code}</div>
                        </div>
                        <span style={{ background: "#22c55e", color: "white", fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px" }}>Encontrado</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#4b5563", marginBottom: "12px" }}>
                        <div>Idade: <strong>{patientAgeYears != null ? `${patientAgeYears} anos` : "-"}</strong></div>
                        <div>Sexo: <strong>{patient.sex}</strong></div>
                        <div>Nasc.: <strong>{patient.birth_date}</strong></div>
                        {latestRecordedWeight != null && <div>Último peso: <strong>{latestRecordedWeight} kg</strong></div>}
                        <div style={{ gridColumn: "1/-1" }}>Responsável: <strong>{patient.guardian_name}</strong></div>
                      </div>
                      <button onClick={createVisit} disabled={creatingVisit || !!visit} className="btn-primary" style={{ fontSize: "13px", padding: "9px 16px", borderRadius: "8px" }}>
                        {visit ? `? Visita #${visit.id} Criada` : creatingVisit ? "Criando..." : "Registrar Chegada"}
                      </button>
                    </div>
                  )}

                  {/* Divider */}
                  <hr className="section-divider" />
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cadastrar Novo Paciente</div>

                  <form onSubmit={createPatient} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label className="triage-label">Código Clínico</label>
                      <input className="triage-input" value={pClinicalCode} onChange={(e) => setPClinicalCode(e.target.value)} placeholder="P0002" required />
                    </div>
                    <div>
                      <label className="triage-label">Nome Completo</label>
                      <input className="triage-input" value={pFullName} onChange={(e) => setPFullName(e.target.value)} placeholder="João Pedro" required />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label className="triage-label">Sexo</label>
                        <select className="triage-input" value={pSex} onChange={(e) => setPSex(e.target.value)}>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                      </div>
                      <div>
                        <label className="triage-label">Data de Nascimento</label>
                        <input type="date" className="triage-input" value={pBirthDate} onChange={(e) => setPBirthDate(e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <label className="triage-label">Responsável</label>
                      <input className="triage-input" value={pGuardianName} onChange={(e) => setPGuardianName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="triage-label">Telefone do Responsável</label>
                      <input className="triage-input" value={pGuardianPhone} onChange={(e) => setPGuardianPhone(e.target.value)} placeholder="84 XXX XXXX" required />
                    </div>
                    <button disabled={creatingPatient} className="btn-secondary">
                      {creatingPatient ? "Cadastrando..." : "Cadastrar Paciente"}
                    </button>
                  </form>

                  <div className="step-nav">
                    <button onClick={() => setTriageStep(2)} disabled={!patient || !visit} className="btn-primary">
                      Próximo: Avaliação ?
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Triage Assessment */}
              {triageStep === 2 && (
                <div className="form-card">
                  {patient && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#ecfdf5", borderRadius: "10px", marginBottom: "20px" }}>
                      <div className="doc-avatar" style={{ width: "30px", height: "30px", fontSize: "12px" }}>{(patient.full_name || "P")[0]}</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{patient.full_name}</div>
                        <div style={{ fontSize: "11px", color: "#16a34a" }}>{patient.clinical_code} · Visita #{visit?.id}</div>
                      </div>
                    </div>
                  )}

                  <h2 className="text-base font-semibold text-gray-900 mb-1">Avaliação Clínica</h2>
                  <p className="text-xs text-gray-400 mb-5">Registe os sinais vitais e a queixa principal</p>

                  <form onSubmit={(e) => { e.preventDefault(); setTriageStep(3); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Vitals */}
                    <div>
                      <div className="triage-label" style={{ marginBottom: "10px", color: "#16a34a", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>Sinais Vitais</div>
                      <div className="vital-group">
                        <div>
                          <label className="triage-label">Temperatura (°C)</label>
                          <div className="triage-hint">Febre ou hipotermia</div>
                          <input className="triage-input" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="38.2" />
                        </div>
                        <div>
                          <label className="triage-label">SpO2 (%)</label>
                          <div className="triage-hint">Saturação de oxigênio</div>
                          <input className="triage-input" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="96" />
                        </div>
                        <div>
                          <label className="triage-label">Freq. Cardíaca (bpm)</label>
                          <div className="triage-hint">Batimentos por minuto</div>
                          <input className="triage-input" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="120" />
                        </div>
                        <div>
                          <label className="triage-label">Freq. Respiratória (rpm)</label>
                          <div className="triage-hint">Respirações por minuto</div>
                          <input className="triage-input" value={respRate} onChange={(e) => setRespRate(e.target.value)} placeholder="30" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="triage-label">Peso (kg)</label>
                      <div className="triage-hint">Para cálculo de dose e avaliação clínica</div>
                      <input className="triage-input" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="14.5" style={{ maxWidth: "200px" }} />
                    </div>

                    <hr className="section-divider" style={{ margin: "4px 0" }} />

                    <div>
                      <label className="triage-label">Queixa Principal *</label>
                      <div className="triage-hint">Descreva o motivo principal da visita</div>
                      {/* Quick complaint chips */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                        {["Febre", "Tosse", "Dificuldade respiratória", "Dor abdominal", "Vómitos", "Diarreia"].map(c => (
                          <button key={c} type="button" onClick={() => setChiefComplaint(prev => prev ? `${prev}, ${c}` : c)} className={`chip ${chiefComplaint.includes(c) ? "chip-selected" : ""}`}>{c}</button>
                        ))}
                      </div>
                      <textarea className="triage-input" rows="3" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} placeholder="Descreva em detalhes..." style={{ resize: "none" }} required />
                    </div>

                    <div>
                      <label className="triage-label">Notas Clínicas <span style={{ color: "#9ca3af", fontWeight: "400" }}>(opcional)</span></label>
                      <textarea className="triage-input" rows="2" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} placeholder="Observações adicionais..." style={{ resize: "none" }} />
                    </div>

                    <div className="step-nav">
                      <button type="button" onClick={() => setTriageStep(1)} className="btn-ghost" style={{ width: "auto", padding: "10px 20px" }}>? Voltar</button>
                      <button type="submit" disabled={!chiefComplaint.trim()} className="btn-primary">Próximo: Prioridade ?</button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 3: Priority & Doctor */}
              {triageStep === 3 && (
                <div className="form-card">
                  {patient && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#ecfdf5", borderRadius: "10px", marginBottom: "20px" }}>
                      <div className="doc-avatar" style={{ width: "30px", height: "30px", fontSize: "12px" }}>{(patient.full_name || "P")[0]}</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{patient.full_name}</div>
                        <div style={{ fontSize: "11px", color: "#16a34a" }}>{patient.clinical_code} · Visita #{visit?.id}</div>
                      </div>
                    </div>
                  )}

                  <h2 className="text-base font-semibold text-gray-900 mb-1">Classificação e Atribuição</h2>
                  <p className="text-xs text-gray-400 mb-6">Defina a prioridade e atribua um médico</p>

                  {/* Priority Cards */}
                  <div style={{ marginBottom: "20px" }}>
                    <label className="triage-label" style={{ marginBottom: "10px" }}>Prioridade da Triagem</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {PRIORITIES.map((p) => {
                        const isSelected = priority === p.value;
                        const selClass = isSelected ? (p.value === "URGENT" ? "selected-urgent" : p.value === "LESS_URGENT" ? "selected-less" : "selected-non") : "";
                        const radioClass = isSelected ? (p.value === "URGENT" ? "checked-urgent" : p.value === "LESS_URGENT" ? "checked-less" : "checked-non") : "";
                        return (
                          <div key={p.value} className={`priority-card ${selClass}`} onClick={() => setPriority(p.value)}>
                            <div className={`priority-radio ${radioClass}`}>
                              {isSelected && <div className="priority-radio-dot" />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600", fontSize: "13px", color: isSelected ? p.color : "#374151" }}>{p.label}</div>
                              <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>Espera máxima: {p.maxWait} minutos</div>
                            </div>
                            {isSelected && (
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom max wait */}
                  <div style={{ marginBottom: "20px" }}>
                    <label className="triage-label">Espera Máxima Personalizada (min) <span style={{ color: "#9ca3af", fontWeight: "400" }}>(opcional)</span></label>
                    <input className="triage-input" value={customMaxWait} onChange={(e) => setCustomMaxWait(e.target.value)} placeholder={`Padrão: ${selectedPriority?.maxWait ?? ""} min`} style={{ maxWidth: "200px" }} />
                  </div>

                  {/* AI Suggestion (last step only) */}
                  <div style={{ marginBottom: "20px" }}>
                    <button type="button" onClick={askAI} disabled={aiLoading || !triageFieldsOk} className="btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z"/><path d="M12 8v4l3 3"/></svg>
                      {aiLoading ? "IA Analisando..." : "Sugestão por IA"}
                    </button>

                    {aiSuggestion && (
                      <div className="ai-card" style={{ marginTop: "10px" }}>
                        <div className="ai-badge">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/></svg>
                          Sugestão IA
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>
                              {priorityLabel(aiSuggestion.suggested_priority)}
                            </div>
                            <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "2px", wordBreak: "break-word" }}>
                              Motivo: {aiShortReason || "Sem motivo detalhado"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPriority(aiSuggestion.suggested_priority)}
                            disabled={priority === aiSuggestion.suggested_priority}
                            className="btn-primary"
                            style={{ width: "auto", padding: "8px 14px", fontSize: "12px", flexShrink: 0 }}
                          >
                            {priority === aiSuggestion.suggested_priority ? "? Aplicada" : "Aplicar prioridade"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <hr className="section-divider" />

                  {/* Doctor Assignment */}
                  <div style={{ marginBottom: "20px" }}>
                    <label className="triage-label" style={{ marginBottom: "10px" }}>Atribuir Médico</label>
                    {availableDoctors.length === 0 ? (
                      <div style={{ padding: "16px", background: "#fafafa", border: "1.5px dashed #e5e7eb", borderRadius: "10px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                        Nenhum médico disponível no momento
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
                        {availableDoctors.map((d) => {
                          const isDocSelected = selectedDoctorId === String(d.id);
                          return (
                            <div key={d.id} className={`doctor-card ${isDocSelected ? "selected" : ""}`} onClick={() => !visit?.doctor_id && setSelectedDoctorId(String(d.id))}>
                              <div className="doc-avatar">{(d.full_name || d.username || "M")[0]}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{d.full_name || d.username || `Médico #${d.id}`}</div>
                                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>{d.specialization || "Clínica Geral"}</div>
                              </div>
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button onClick={assignDoctor} disabled={!visit?.id || !!visit?.doctor_id || assigning || !selectedDoctorId} className="btn-secondary" style={{ marginTop: "10px", fontSize: "13px" }}>
                      {visit?.doctor_id ? "? Médico já atribuído" : assigning ? "Atribuindo..." : "Confirmar Atribuição"}
                    </button>
                  </div>

                  <div className="step-nav">
                    <button type="button" onClick={() => setTriageStep(2)} className="btn-ghost" style={{ width: "auto", padding: "10px 20px" }}>? Voltar</button>
                    <button onClick={saveTriage} disabled={savingTriage || !visit?.id || !triageFieldsOk} className="btn-primary">
                      {savingTriage ? "Salvando..." : "Concluir Triagem ?"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAST PATIENTS VIEW */}
          {activeView === "patients" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Pacientes Antigos</h1>
                  <p className="text-sm text-gray-500">Histórico de visitas finalizadas</p>
                </div>
                <button onClick={loadPastVisits} disabled={loadingPastVisits} className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}>
                  {loadingPastVisits ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              {pastVisits.length === 0 ? (
                <div className="form-card" style={{ textAlign: "center", padding: "60px 40px" }}>
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <p className="text-gray-500 font-medium">Nenhum histórico encontrado</p>
                </div>
              ) : (
                <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="w-full">
                    <thead style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                      <tr>
                        {["Visita", "Paciente", "Código", "Queixa Principal", "Resumo da Consulta", "Médico", "Data", "PDF"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pastVisits.map((v, idx) => (
                        <tr
                          key={v.id}
                          onClick={() => openPastVisitModal(v)}
                          style={{ borderBottom: "1px solid #f9f9f9", background: idx % 2 === 0 ? "white" : "#fafafa", cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafafa"; }}
                        >
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "#16a34a", fontWeight: "600" }}>#{v.id}</td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "600", color: "#111827" }}>{v.full_name}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#6b7280" }}>{v.clinical_code}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151", maxWidth: "220px" }}>
                            <div title={v.chief_complaint || v.triage_chief_complaint || "-" } style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {v.chief_complaint || v.triage_chief_complaint || "-"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151", maxWidth: "280px" }}>
                            <div title={v.likely_diagnosis || v.clinical_reasoning || v.prescription_text || "-"} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>
                              {v.likely_diagnosis || "-"}
                            </div>
                            <div title={v.clinical_reasoning || v.prescription_text || "-"} style={{ marginTop: "2px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {v.clinical_reasoning || v.prescription_text || "-"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{(v.doctor_full_name || v.doctor_username || "-") + (v.doctor_specialization ? ` (${v.doctor_specialization})` : "")}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#6b7280" }}>{v.consultation_ended_at ? new Date(v.consultation_ended_at).toLocaleString() : v.arrival_time ? new Date(v.arrival_time).toLocaleString() : "-"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ width: "auto", padding: "7px 10px", fontSize: "12px" }}
                              disabled={pdfLoadingId === v.id}
                              onClick={(e) => { e.stopPropagation(); downloadVisitPdf(v); }}
                            >
                              {pdfLoadingId === v.id ? "Gerando..." : "Baixar PDF"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DOCTOR AVAILABILITY VIEW */}
          {activeView === "doctors" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Disponibilidade de Médicos</h1>
                  <p className="text-sm text-gray-500">{doctors.length} médico(s) registados</p>
                </div>
                <button onClick={() => loadDoctors()} disabled={loadingDoctors} className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}>
                  {loadingDoctors ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {[
                  { title: "Disponíveis", list: availableDoctors, color: "#22c55e", bg: "#f0fdf4" },
                  { title: "Ocupados", list: busyDoctors, color: "#ef4444", bg: "#fef2f2" },
                ].map(({ title, list, color, bg }) => (
                  <div key={title} className="form-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
                      <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>{title} ({list.length})</h2>
                    </div>
                    {list.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>Nenhum médico {title.toLowerCase()}</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {list.map((d) => (
                          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: bg, borderRadius: "10px", border: `1px solid ${color}20` }}>
                            <div className="doc-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>{(d.full_name || d.username || "M")[0]}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{d.full_name || d.username || `Médico #${d.id}`}</div>
                              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>{d.specialization || "Clínica Geral"}</div>
                              {d.current_visit_id && <div style={{ fontSize: "11px", color: "#9ca3af" }}>Consulta #{d.current_visit_id}</div>}
                            </div>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUEUE VIEW */}
          {activeView === "queue" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Fila de Espera</h1>
                  <p className="text-sm text-gray-500">{queue.length} paciente(s) na fila</p>
                </div>
                <button onClick={loadQueue} disabled={loadingQueue} className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}>
                  {loadingQueue ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              {queue.length === 0 ? (
                <div className="form-card" style={{ textAlign: "center", padding: "60px 40px" }}>
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <p className="text-gray-500 font-medium">Fila vazia</p>
                </div>
              ) : (
                <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="w-full">
                    <thead style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                      <tr>
                        {["ID", "Paciente", "Prioridade", "Status", "Espera", "Alerta", "Médico", "Ações"].map((h, i) => (
                          <th key={h} style={{ textAlign: i === 7 ? "right" : "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {urgentQueue.length > 0 && (
                        <tr><td colSpan="8" style={{ padding: "8px 16px", fontSize: "11px", fontWeight: "700", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", background: "#fff5f5" }}>Prioridade Urgente</td></tr>
                      )}
                      {urgentQueue.map((v) => {
                        const wait = v.wait_minutes ?? null;
                        const isCritical = wait != null && wait >= 180;
                        return (
                          <tr key={v.id} style={{ borderBottom: "1px solid #f9f9f9", background: isCritical ? "#fef2f2" : "#fff9f9" }}>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#ef4444", fontWeight: "600" }}>#{v.id}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{v.full_name}</div>
                              <div style={{ fontSize: "11px", color: "#9ca3af" }}>{v.clinical_code}</div>
                            </td>
                            <td style={{ padding: "12px 16px" }}><span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px", background: "#fef2f2", color: "#ef4444" }}>{PRIORITIES.find(p => p.value === v.priority)?.label || v.priority}</span></td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{statusLabel(v.status)}</td>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#111827", fontWeight: "600" }}>{wait != null ? `${wait}min` : "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{isCritical && <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px", background: "#ef4444", color: "white" }}>Crítico</span>}</td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{v.doctor_full_name || v.doctor_username || "-"}</td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                <button onClick={() => openEdit(v)} style={{ padding: "5px 10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Editar</button>
                                <button onClick={() => openCancelModal(v.id)} disabled={cancellingId === v.id} style={{ padding: "5px 10px", background: "#ef4444", color: "white", border: "none", borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer", opacity: cancellingId === v.id ? 0.5 : 1 }}>{cancellingId === v.id ? "..." : "Cancelar"}</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {nonUrgentQueue.length > 0 && (
                        <tr><td colSpan="8" style={{ padding: "8px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", background: "#fafafa" }}>Outras Prioridades</td></tr>
                      )}
                      {nonUrgentQueue.map((v) => {
                        const wait = v.wait_minutes ?? null;
                        const isCritical = wait != null && wait >= 180;
                        const pCfg = PRIORITIES.find(p => p.value === v.priority);
                        return (
                          <tr key={v.id} style={{ borderBottom: "1px solid #f9f9f9", background: isCritical ? "#fef2f2" : "white" }}>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#16a34a", fontWeight: "600" }}>#{v.id}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{v.full_name}</div>
                              <div style={{ fontSize: "11px", color: "#9ca3af" }}>{v.clinical_code}</div>
                            </td>
                            <td style={{ padding: "12px 16px" }}><span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px", background: pCfg?.bg || "#f3f4f6", color: pCfg?.color || "#374151" }}>{pCfg?.label || v.priority}</span></td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{statusLabel(v.status)}</td>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#111827", fontWeight: "600" }}>{wait != null ? `${wait}min` : "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{isCritical && <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px", background: "#ef4444", color: "white" }}>Crítico</span>}</td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{v.doctor_full_name || v.doctor_username || "-"}</td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                <button onClick={() => openEdit(v)} style={{ padding: "5px 10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Editar</button>
                                <button onClick={() => openCancelModal(v.id)} disabled={cancellingId === v.id} style={{ padding: "5px 10px", background: "#ef4444", color: "white", border: "none", borderRadius: "7px", fontSize: "12px", fontWeight: "600", cursor: "pointer", opacity: cancellingId === v.id ? 0.5 : 1 }}>{cancellingId === v.id ? "..." : "Cancelar"}</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {editingVisit && (
                <div className="form-card" style={{ marginTop: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>Editar Visita #{editingVisit.id}</h3>
                    <button onClick={() => setEditingVisit(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label className="triage-label">Prioridade</label>
                      <select className="triage-input" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="triage-label">Espera Máx. (min)</label>
                      <input className="triage-input" value={editMaxWait} onChange={(e) => setEditMaxWait(e.target.value)} placeholder={`${PRIORITIES.find((p) => p.value === editPriority)?.maxWait ?? ""}`} />
                    </div>
                  </div>
                  <button onClick={saveEdit} disabled={savingEdit} className="btn-primary" style={{ marginTop: "14px" }}>
                    {savingEdit ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {popup.open && (
        <div className="popup-overlay">
          <div className="popup-card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div className={`popup-icon ${popup.type === "success" ? "popup-icon-success" : "popup-icon-warning"}`}>
                {popup.type === "success" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>{popup.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#4b5563", lineHeight: 1.45 }}>{popup.message}</p>
              </div>
            </div>
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={closePopup} className="btn-primary" style={{ width: "auto", padding: "10px 18px" }}>
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {pastVisitModal.open && pastVisitModal.visit && (
        <div className="popup-overlay">
          <div className="popup-card" style={{ maxWidth: "760px", width: "95%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                Consulta #{pastVisitModal.visit.id}
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  disabled={pdfLoadingId === pastVisitModal.visit.id}
                  onClick={() => downloadVisitPdf(pastVisitModal.visit)}
                  className="btn-primary"
                  style={{ width: "auto", padding: "8px 12px" }}
                >
                              {pdfLoadingId === pastVisitModal.visit.id ? "Gerando..." : "Baixar PDF"}
                            </button>
                <button type="button" onClick={closePastVisitModal} className="btn-secondary" style={{ width: "auto", padding: "8px 12px" }}>
                  Fechar
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
              <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Paciente</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{pastVisitModal.visit.full_name || "-"}</div>
              </div>
              <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Médico</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>
                  {(pastVisitModal.visit.doctor_full_name || pastVisitModal.visit.doctor_username || "-") +
                    (pastVisitModal.visit.doctor_specialization ? ` (${pastVisitModal.visit.doctor_specialization})` : "")}
                </div>
              </div>
            </div>

            <div className="form-card" style={{ margin: 0, padding: "10px 12px", marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>Queixa Principal</div>
              <div style={{ fontSize: "13px", color: "#111827" }}>
                {pastVisitModal.visit.chief_complaint || pastVisitModal.visit.triage_chief_complaint || "-"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px", maxHeight: "52vh", overflowY: "auto", paddingRight: "2px" }}>
              <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Diagnóstico</div>
                <div style={{ fontSize: "13px", color: "#111827" }}>{pastVisitModal.visit.likely_diagnosis || "-"}</div>
              </div>
              <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Justificativa Clínica</div>
                <div style={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>{pastVisitModal.visit.clinical_reasoning || "-"}</div>
              </div>
              <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Prescrição</div>
                <div style={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>{pastVisitModal.visit.prescription_text || "-"}</div>
              </div>
              <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Destino e Retorno</div>
                <div style={{ fontSize: "13px", color: "#111827" }}>
                  Destino: {pastVisitModal.visit.disposition_plan || "-"}{pastVisitModal.visit.disposition_reason ? ` (${pastVisitModal.visit.disposition_reason})` : ""}
                </div>
                <div style={{ fontSize: "13px", color: "#111827", marginTop: "4px" }}>
                  Retorno: {pastVisitModal.visit.return_visit_date || "-"}{pastVisitModal.visit.return_visit_reason ? ` (${pastVisitModal.visit.return_visit_reason})` : ""}
                </div>
              </div>
              <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                <div style={{ fontSize: "11px", color: "#6b7280" }}>Exames / Laboratório</div>
                <div style={{ fontSize: "13px", color: "#111827" }}>Solicitado: {pastVisitModal.visit.lab_requested ? "Sim" : "Não"}</div>
                <div style={{ fontSize: "13px", color: "#111827" }}>Tipo: {pastVisitModal.visit.lab_exam_type || "-"}</div>
                <div style={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>Exames: {pastVisitModal.visit.lab_tests || "-"}</div>
                <div style={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>Resultado: {pastVisitModal.visit.lab_result_text || "-"}</div>
                <div style={{ fontSize: "13px", color: "#111827" }}>Estado: {pastVisitModal.visit.lab_result_status || "-"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {cancelModal.open && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>Cancelar visita</h3>
            <p style={{ margin: "6px 0 12px", fontSize: "13px", color: "#4b5563" }}>
              Tem certeza? Pode adicionar um motivo (opcional).
            </p>
            <textarea
              className="triage-input"
              rows="3"
              value={cancelModal.reason}
              onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Motivo do cancelamento (opcional)"
              style={{ resize: "none" }}
            />
            <div style={{ marginTop: "14px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={closeCancelModal} className="btn-secondary" style={{ width: "auto", padding: "10px 16px" }}>
                Fechar
              </button>
              <button
                type="button"
                onClick={confirmCancelVisit}
                disabled={cancellingId === cancelModal.visitId}
                style={{ width: "auto", padding: "10px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: cancellingId === cancelModal.visitId ? 0.55 : 1 }}
              >
                {cancellingId === cancelModal.visitId ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






