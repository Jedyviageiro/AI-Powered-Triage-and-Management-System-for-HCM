import { useMemo, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";
import ShiftReportView from "../components/nurse/ShiftReportView";
import NotificationListView from "../components/nurse/NotificationListView";
import PreferencesView from "../components/nurse/PreferencesView";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
const PRIORITIES = [
  { value: "URGENT", label: "Urgente", maxWait: 60, color: "#ef4444", bg: "#fef2f2", border: "#fca5a5" },
  { value: "LESS_URGENT", label: "Pouco Urgente", maxWait: 120, color: "#f97316", bg: "#fff7ed", border: "#fdba74" },
  { value: "NON_URGENT", label: "Não Urgente", maxWait: 240, color: "#165034", bg: "#edf5f0", border: "#2d6f4e" },
];

const DEFAULT_PREFERENCES = {
  emergency_phone: "",
  font_size: "NORMAL",
  font_scale_percent: 100,
  notify_new_urgent: true,
  notify_wait_over_30: true,
  notify_critical_alerts: true,
  notify_shift_ending: true,
};

const shouldShowNotificationByPreferences = (notification, preferences) => {
  const prefs = { ...DEFAULT_PREFERENCES, ...(preferences || {}) };
  const text = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
  const source = String(notification?.source || "").toLowerCase();
  const level = String(notification?.level || "").toUpperCase();

  const isCriticalAlert =
    level === "CRITICAL" ||
    /spo2|spo₂|febre|39\.5|hcm|cr[ií]tic|reanima|er\b|emerg/i.test(text);
  if (isCriticalAlert) return !!prefs.notify_critical_alerts;

  const isWaitOver30 =
    /espera|wait/.test(text) &&
    /(30|min|minutes|acima|over|>\s*30)/.test(text);
  if (isWaitOver30) return !!prefs.notify_wait_over_30;

  const isShiftEnding =
    /turno|shift/.test(text) &&
    /(fim|ending|15|min|aproxim|encerrar)/.test(text);
  if (isShiftEnding) return !!prefs.notify_shift_ending;

  const isUrgentPatient =
    /urgent|urgente|p1|p2|prioridade alta/.test(text) ||
    /triage|triagem/.test(source);
  if (isUrgentPatient) return !!prefs.notify_new_urgent;

  return true;
};

const ROOM_TYPES = [
  {
    key: "urgent_room",
    priority: "URGENT",
    title: "Sala de Observação - Urgente",
    shortTitle: "Sala de Observação",
    total: 4,
    indications: [
      "Infecção Respiratória grave (sibilância, SpO2 baixo, taquipneia)",
      "Diarreia + desidratação moderada-grave",
      "Erupções com sinais sistémicos (febre alta + letargia)",
    ],
    features: ["Monitor", "Oxigénio", "Nebulizador", "Acesso IV rápido", "Cama com grades"],
  },
  {
    key: "standard_room",
    priority: "LESS_URGENT",
    title: "Sala de Consulta Padrão - Pouco Urgente",
    shortTitle: "Sala de Consulta Padrão",
    total: 4,
    indications: [
      "Infecção Respiratória moderada (tosse + febre sem distress)",
      "Diarreia leve-moderada sem desidratação grave",
      "Doença da Pele moderada (erupção extensa + comichão intensa)",
    ],
    features: ["Cama/cadeira de exame", "Otoscópio", "Estetoscópio", "Balança", "Luz clínica"],
  },
  {
    key: "quick_room",
    priority: "NON_URGENT",
    title: "Quarto de Consulta Rápida - Não Urgente",
    shortTitle: "Quarto de Consulta Rápida",
    total: 4,
    indications: [
      "Doença da Pele leve (erupção localizada, só comichão)",
      "Diarreia leve sem desidratação",
      "Infecção Respiratória muito leve (coriza simples)",
    ],
    features: ["Cadeira/mesa simples", "Sem necessidade de monitor", "Sem necessidade de IV"],
  },
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

const parseNumberish = (v) => {
  if (v === "" || v == null) return null;
  const normalized = String(v).trim().replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const isValidNumber = (v, { min = -Infinity, max = Infinity } = {}) => {
  const n = parseNumberish(v);
  if (n == null) return false;
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

const inferHospitalStatus = (visit) => {
  const explicit = String(visit?.hospital_status || "").trim().toUpperCase();
  if (explicit === "IN_HOSPITAL") return "Internado";
  if (explicit === "BED_REST") return "Repouso / Acamado";
  if (explicit === "DISCHARGED") return "Alta";
  if (explicit === "TRANSFERRED") return "Transferido";
  if (explicit === "DECEASED") return "Óbito";

  const plan = String(visit?.disposition_plan || "").trim().toUpperCase();
  if (plan === "ADMIT_URGENT") return "Internado";
  if (plan === "BED_REST") return "Repouso / Acamado";
  if (plan === "HOME") return "Alta";
  if (plan === "RETURN_VISIT") return "Alta com Retorno";
  if (String(visit?.status || "").toUpperCase() === "CANCELLED") return "Atendimento Interrompido";
  return "Sem Registo";
};

const inferVitalStatus = (visit) => {
  const explicitVital = String(visit?.vital_status || "").trim().toUpperCase();
  if (explicitVital === "DECEASED") return "Óbito";
  if (explicitVital === "ALIVE") return "Vivo";
  if (visit?.is_deceased === true || visit?.deceased_at) return "Óbito";

  const text = [
    visit?.disposition_reason,
    visit?.clinical_reasoning,
    visit?.likely_diagnosis,
    visit?.prescription_text,
  ]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");

  if (/(óbito|obito|faleceu|deceased|death)/i.test(text)) return "Óbito";
  return "Vivo (sem registo de óbito)";
};

// Mini bar chart component for dashboard
function MiniBarChart({ data, color = "#165034", height = 60 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: `${height}px` }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i === data.length - 1 ? color : `${color}55`,
            borderRadius: "4px 4px 0 0",
            height: `${(v / max) * 100}%`,
            minHeight: "4px",
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// Donut chart SVG
function DonutChart({ segments, size = 120, stroke = 22 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const arcs = segments.reduce((acc, seg) => {
    const dash = (seg.value / total) * circ;
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].nextOffset : 0;
    acc.push({ seg, dash, offset: prevOffset, nextOffset: prevOffset + dash + 2 });
    return acc;
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      {arcs.map(({ seg, dash, offset }, i) => (
        <circle
          key={i}
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-offset}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

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
  const [holdInWaitingLine, setHoldInWaitingLine] = useState(false);
  const [bypassToER, setBypassToER] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [queue, setQueue] = useState([]);
  const [queueSummary, setQueueSummary] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [shiftStatus, setShiftStatus] = useState(null);
  const [loadingShift, setLoadingShift] = useState(false);
  const [startingShift, setStartingShift] = useState(false);
  const [extendingShift, setExtendingShift] = useState(false);
  const [stoppingShift, setStoppingShift] = useState(false);
  const [breakShiftLoading, setBreakShiftLoading] = useState(false);
  const [shiftMenuOpen, setShiftMenuOpen] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());
  const [queueErr, setQueueErr] = useState("");
  const [pastVisits, setPastVisits] = useState([]);
  const [loadingPastVisits, setLoadingPastVisits] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsPreviewOpen, setNotificationsPreviewOpen] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const [popup, setPopup] = useState({ open: false, type: "warning", title: "", message: "" });
  const [confirmPopup, setConfirmPopup] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirmar",
    onConfirm: null,
    busy: false,
  });
  const [pastVisitModal, setPastVisitModal] = useState({
    open: false,
    visit: null,
    editingPatient: false,
    patientLoading: false,
    patientSaving: false,
    patientForm: {
      patientId: null,
      clinical_code: "",
      full_name: "",
      sex: "M",
      birth_date: "",
      guardian_name: "",
      guardian_phone: "",
      triage_id: null,
      triage_temperature: null,
      triage_heart_rate: null,
      triage_respiratory_rate: null,
      triage_oxygen_saturation: null,
      triage_weight: null,
      triage_clinical_notes: "",
      chief_complaint: "",
      likely_diagnosis: "",
      clinical_reasoning: "",
      prescription_text: "",
      doctor_id: "",
      hospital_status: "",
    },
  });
  const [patientEditModal, setPatientEditModal] = useState({
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
    triage_priority: "URGENT",
    triage_max_wait_minutes: "",
  });
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [triageStep, setTriageStep] = useState(1);

  const selectedPriority = useMemo(() => PRIORITIES.find((p) => p.value === priority), [priority]);
  const availableDoctors = useMemo(() => doctors.filter((d) => d?.is_busy === false), [doctors]);
  const busyDoctors = useMemo(() => doctors.filter((d) => d?.is_busy === true), [doctors]);
  const urgentQueue = useMemo(() => queue.filter((v) => v?.priority === "URGENT"), [queue]);
  const nonUrgentQueue = useMemo(() => queue.filter((v) => v?.priority !== "URGENT"), [queue]);
  const patientByVisitId = useMemo(() => {
    const map = new Map();
    queue.forEach((v) => {
      map.set(Number(v?.id), {
        full_name: v?.full_name || "-",
        clinical_code: v?.clinical_code || "-",
      });
    });
    return map;
  }, [queue]);
  const patientAgeYears = useMemo(() => calculateAgeYears(patient?.birth_date), [patient?.birth_date]);
  const roomTypeByPriority = useMemo(
    () => ROOM_TYPES.reduce((acc, type) => ({ ...acc, [type.priority]: type }), {}),
    []
  );
  const filteredNotifications = useMemo(
    () => notifications.filter((n) => shouldShowNotificationByPreferences(n, preferences)),
    [notifications, preferences]
  );
  const notificationsUnread = useMemo(
    () => filteredNotifications.filter((n) => !n?.read_at).length,
    [filteredNotifications]
  );
  const latestNotification = useMemo(
    () => filteredNotifications[0] || null,
    [filteredNotifications]
  );
  const roomOccupancy = useMemo(() => {
    const byKey = ROOM_TYPES.reduce((acc, type) => ({ ...acc, [type.key]: 0 }), {});
    queue.forEach((v) => {
      if (!["WAITING_DOCTOR", "IN_CONSULTATION"].includes(v?.status)) return;
      const mappedType = roomTypeByPriority[v?.priority];
      if (mappedType) byKey[mappedType.key] += 1;
    });
    return byKey;
  }, [queue, roomTypeByPriority]);
  const roomInventory = useMemo(
    () =>
      ROOM_TYPES.map((type) => {
        const occupied = Math.min(type.total, Number(roomOccupancy[type.key] || 0));
        const rooms = Array.from({ length: type.total }, (_, idx) => {
          const available = idx >= occupied;
          return {
            roomNumber: idx + 1,
            label: `${type.shortTitle} ${idx + 1}`,
            status: available ? "available" : "occupied",
          };
        });
        return {
          ...type,
          occupied,
          available: Math.max(0, type.total - occupied),
          rooms,
        };
      }),
    [roomOccupancy]
  );
  const recommendedRoomType = useMemo(() => {
    if (bypassToER) return null;
    return roomTypeByPriority[priority] || null;
  }, [bypassToER, priority, roomTypeByPriority]);
  const recommendedRoomLabel = useMemo(() => {
    if (bypassToER) return "Sala de Reanimação / ER";
    if (availableDoctors.length === 0) return null;
    if (!recommendedRoomType) return null;
    const type = roomInventory.find((r) => r.key === recommendedRoomType.key);
    if (!type) return null;
    const firstAvailable = type.rooms.find((r) => r.status === "available");
    return firstAvailable?.label || null;
  }, [bypassToER, availableDoctors.length, recommendedRoomType, roomInventory]);
  const hasRoomAvailable = useMemo(() => {
    if (bypassToER) return true;
    return !!recommendedRoomLabel;
  }, [bypassToER, recommendedRoomLabel]);
  const hasDoctorAvailable = availableDoctors.length > 0;

  const latestRecordedWeight = useMemo(() => {
    if (!Array.isArray(patientHistory)) return null;
    for (const h of patientHistory) {
      if (h?.weight != null && Number.isFinite(Number(h.weight))) return Number(h.weight);
    }
    return null;
  }, [patientHistory]);

  const triageValidation = useMemo(() => {
    const hasChief = chiefComplaint.trim().length > 0;
    const okTemp = isValidNumber(temperature, { min: 25, max: 45 });
    const okSpo2 = isValidNumber(spo2, { min: 1, max: 100 });
    const okHR = isValidNumber(heartRate, { min: 20, max: 260 });
    const okRR = isValidNumber(respRate, { min: 5, max: 120 });
    const okWeight = isValidNumber(weight, { min: 0.5, max: 300 });
    return { hasChief, okTemp, okSpo2, okHR, okRR, okWeight };
  }, [chiefComplaint, temperature, spo2, heartRate, respRate, weight]);

  const triageFieldsOk = useMemo(
    () => triageValidation.hasChief && triageValidation.okTemp && triageValidation.okSpo2 && triageValidation.okHR && triageValidation.okRR && triageValidation.okWeight,
    [triageValidation]
  );

  const triageValidationErrors = useMemo(() => {
    const errors = [];
    if (!triageValidation.hasChief) errors.push("Queixa principal obrigatória.");
    if (!triageValidation.okTemp) errors.push("Temperatura inválida (25 a 45 °C).");
    if (!triageValidation.okSpo2) errors.push("SpO2 inválida (1 a 100%).");
    if (!triageValidation.okHR) errors.push("Frequência cardíaca inválida (20 a 260 bpm).");
    if (!triageValidation.okRR) errors.push("Frequência respiratória inválida (5 a 120 rpm).");
    if (!triageValidation.okWeight) errors.push("Peso inválido (0.5 a 300 kg).");
    return errors;
  }, [triageValidation]);

  const aiShortReason = useMemo(() => {
    if (!aiSuggestion) return "";
    if (Array.isArray(aiSuggestion?.reasons) && aiSuggestion.reasons.length > 0) {
      return aiSuggestion.reasons.map((r) => String(r || "").trim()).filter(Boolean).slice(0, 1).join("");
    }
    return String(aiSuggestion?.reason || aiSuggestion?.match_reason || aiSuggestion?.short_reason || "").trim();
  }, [aiSuggestion]);
  const getPastVisitRowBg = (idx) => (idx % 2 === 0 ? "#ffffff" : "#e8f3ed");
  const getQueueRowBg = (idx, { urgent = false, isCritical = false } = {}) => {
    if (isCritical) return idx % 2 === 0 ? "#fef2f2" : "#fddede";
    if (urgent) return idx % 2 === 0 ? "#fff9f9" : "#ffecec";
    return idx % 2 === 0 ? "#ffffff" : "#e8f3ed";
  };

  const logout = () => { clearAuth(); window.location.replace("/login"); };
  const showPopup = (type, title, message) => setPopup({ open: true, type, title, message });
  const closePopup = () => { setPopup({ open: false, type: "warning", title: "", message: "" }); setErr(""); setQueueErr(""); };
  const openConfirmPopup = ({ title, message, confirmLabel = "Confirmar", onConfirm }) =>
    setConfirmPopup({ open: true, title, message, confirmLabel, onConfirm, busy: false });
  const closeConfirmPopup = () =>
    setConfirmPopup({ open: false, title: "", message: "", confirmLabel: "Confirmar", onConfirm: null, busy: false });
  const confirmPopupAction = async () => {
    if (typeof confirmPopup.onConfirm !== "function") {
      closeConfirmPopup();
      return;
    }
    setConfirmPopup((prev) => ({ ...prev, busy: true }));
    try {
      await confirmPopup.onConfirm();
      closeConfirmPopup();
    } catch {
      setConfirmPopup((prev) => ({ ...prev, busy: false }));
    }
  };
  const openPastVisitModal = (visit) =>
    setPastVisitModal({
      open: true,
      visit: visit || null,
      editingPatient: false,
      patientLoading: false,
      patientSaving: false,
      patientForm: {
        patientId: null,
        clinical_code: "",
        full_name: "",
        sex: "M",
        birth_date: "",
        guardian_name: "",
        guardian_phone: "",
        triage_id: null,
        triage_temperature: null,
        triage_heart_rate: null,
        triage_respiratory_rate: null,
        triage_oxygen_saturation: null,
        triage_weight: null,
        triage_clinical_notes: "",
        chief_complaint: "",
        likely_diagnosis: "",
        clinical_reasoning: "",
        prescription_text: "",
        doctor_id: "",
        hospital_status: "",
      },
    });
  const closePastVisitModal = () =>
    setPastVisitModal({
      open: false,
      visit: null,
      editingPatient: false,
      patientLoading: false,
      patientSaving: false,
      patientForm: {
        patientId: null,
        clinical_code: "",
        full_name: "",
        sex: "M",
        birth_date: "",
        guardian_name: "",
        guardian_phone: "",
        triage_id: null,
        triage_temperature: null,
        triage_heart_rate: null,
        triage_respiratory_rate: null,
        triage_oxygen_saturation: null,
        triage_weight: null,
        triage_clinical_notes: "",
        chief_complaint: "",
        likely_diagnosis: "",
        clinical_reasoning: "",
        prescription_text: "",
        doctor_id: "",
        hospital_status: "",
      },
    });
  const closePatientEditModal = () =>
    setPatientEditModal({
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
      triage_priority: "URGENT",
      triage_max_wait_minutes: "",
    });

  const downloadVisitPdf = async (visit) => {
    if (!visit) return;
    setPdfLoadingId(visit.id);
    const generatedAt = new Date().toLocaleString("pt-PT");
    const visitDate = visit.consultation_ended_at
      ? new Date(visit.consultation_ended_at).toLocaleString("pt-PT")
      : visit.arrival_time ? new Date(visit.arrival_time).toLocaleString("pt-PT") : "-";
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-99999px;top:0;width:900px;background:#ffffff;z-index:-1;";
    container.innerHTML = `
      <article style="font-family:Poppins,'Segoe UI',Arial,sans-serif;color:#0f172a;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
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
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210, margin = 10;
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
  };

  const resetAll = () => {
    setErr(""); setSearchResults([]); setPatient(null); setVisit(null);
    setCode(""); setNameQuery(""); setPClinicalCode(""); setPFullName("");
    setPSex("M"); setPBirthDate(""); setPGuardianName(""); setPGuardianPhone("");
    setTemperature(""); setHeartRate(""); setRespRate(""); setSpo2(""); setWeight("");
    setChiefComplaint(""); setClinicalNotes(""); setPriority("URGENT");
    setCustomMaxWait(""); setAiSuggestion(null); setSelectedDoctorId(""); setTriageStep(1);
    setHoldInWaitingLine(false); setBypassToER(false);
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
    } finally { if (!signal?.aborted) setLoadingDoctors(false); }
  };

  const loadQueue = async () => {
    setQueueErr(""); setLoadingQueue(true);
    try {
      const [data, summary] = await Promise.all([
        api.getQueue(),
        api.getQueueSummary().catch(() => null),
      ]);
      setQueue(Array.isArray(data) ? data : []);
      if (summary && typeof summary === "object") setQueueSummary(summary);
    } catch (e) { setQueueErr(e.message); }
    finally { setLoadingQueue(false); }
  };

  const loadPastVisits = async () => {
    setLoadingPastVisits(true);
    try {
      const data = await api.listPastVisits(300);
      const rows = Array.isArray(data) ? data : [];
      setPastVisits(rows.map((v) => ({ ...v, doctor_specialization: String(v?.doctor_specialization ?? v?.specialization ?? v?.doctor?.specialization ?? "").trim() })));
    } catch (e) { setQueueErr(e.message); }
    finally { setLoadingPastVisits(false); }
  };

  const loadNotifications = async () => {
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
  };

  const markNotificationRead = async (id) => {
    if (!id) return;
    try {
      await api.markNotificationRead(id);
      await loadNotifications();
    } catch (e) {
      setQueueErr(e.message);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      await loadNotifications();
    } catch (e) {
      setQueueErr(e.message);
    }
  };

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
  }, []);

  const savePreferences = useCallback(async (payload) => {
    setSavingPreferences(true);
    try {
      const data = await api.updateMyPreferences(payload || {});
      const merged = { ...DEFAULT_PREFERENCES, ...(data || {}) };
      setPreferences(merged);
      return merged;
    } finally {
      setSavingPreferences(false);
    }
  }, []);
  const previewPreferences = useCallback((patch) => {
    setPreferences((prev) => ({ ...prev, ...(patch || {}) }));
  }, []);

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
  }, [me?.role]);

  const startShift = async () => {
    if (String(me?.role || "").toUpperCase() !== "NURSE") return;
    setShiftMenuOpen(false);
    setStartingShift(true);
    try {
      const res = await api.startNurseShift();
      setShiftStatus(res?.status || null);
      const delay = Number.isFinite(Number(res?.delay_minutes)) ? Number(res.delay_minutes) : 0;
      showPopup("success", "Turno iniciado", delay > 0 ? `Início registado com ${delay} minuto(s) de atraso.` : "Início registado sem atraso.");
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setStartingShift(false);
    }
  };

  const extendShift = async () => {
    if (String(me?.role || "").toUpperCase() !== "NURSE") return;
    setShiftMenuOpen(false);
    setExtendingShift(true);
    try {
      const res = await api.extendNurseShift(60);
      setShiftStatus(res?.status || null);
      showPopup("success", "Turno estendido", "Turno estendido em 60 minutos.");
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setExtendingShift(false);
    }
  };

  const stopShift = async () => {
    if (String(me?.role || "").toUpperCase() !== "NURSE") return;
    setShiftMenuOpen(false);
    openConfirmPopup({
      title: "Confirmar encerramento",
      message: "Tem certeza que deseja encerrar o turno agora?",
      confirmLabel: "Encerrar Turno",
      onConfirm: async () => {
        setStoppingShift(true);
        try {
          const res = await api.stopNurseShift();
          setShiftStatus(res?.status || null);
          showPopup("success", "Turno encerrado", "Turno encerrado com sucesso.");
        } catch (e) {
          setQueueErr(e.message);
          throw e;
        } finally {
          setStoppingShift(false);
        }
      },
    });
  };

  const toggleBreakShift = async () => {
    if (String(me?.role || "").toUpperCase() !== "NURSE") return;
    setShiftMenuOpen(false);
    const isOnBreak = Boolean(shiftStatus?.is_on_break);
    openConfirmPopup({
      title: isOnBreak ? "Confirmar retomada" : "Confirmar pausa",
      message: isOnBreak
        ? "Tem certeza que deseja retomar o turno agora?"
        : "Tem certeza que deseja iniciar pausa agora?",
      confirmLabel: isOnBreak ? "Retomar Turno" : "Iniciar Pausa",
      onConfirm: async () => {
        setBreakShiftLoading(true);
        try {
          const res = isOnBreak ? await api.resumeNurseShift() : await api.startNurseBreak();
          setShiftStatus(res?.status || null);
          showPopup(
            "success",
            isOnBreak ? "Turno retomado" : "Pausa iniciada",
            isOnBreak ? "Você retomou o turno com sucesso." : "Seu turno está em pausa."
          );
        } catch (e) {
          setQueueErr(e.message);
          throw e;
        } finally {
          setBreakShiftLoading(false);
        }
      },
    });
  };

  const openPatientEditModal = async (visitRow) => {
    const patientId = Number(visitRow?.patient_id);
    if (!Number.isFinite(patientId) || patientId <= 0) {
      setQueueErr("Não foi possível identificar o paciente desta visita.");
      return;
    }

    setPatientEditModal({
      open: true,
      loading: true,
      saving: false,
      page: "patient",
      visitId: visitRow?.id || null,
      patientId,
      clinical_code: "",
      full_name: "",
      sex: "M",
      birth_date: "",
      guardian_name: "",
      guardian_phone: "",
      triageLoading: true,
      triageSaving: false,
      triageId: null,
      triage_temperature: "",
      triage_heart_rate: "",
      triage_respiratory_rate: "",
      triage_oxygen_saturation: "",
      triage_weight: "",
      triage_chief_complaint: "",
      triage_clinical_notes: "",
      triage_priority: String(visitRow?.priority || "URGENT"),
      triage_max_wait_minutes: visitRow?.max_wait_minutes != null ? String(visitRow.max_wait_minutes) : "",
    });

    try {
      const [p, triageByVisit] = await Promise.all([
        api.getPatientById(patientId),
        visitRow?.id ? api.getTriageByVisitId(visitRow.id).catch(() => null) : Promise.resolve(null),
      ]);
      setPatientEditModal((prev) => ({
        ...prev,
        loading: false,
        triageLoading: false,
        clinical_code: String(p?.clinical_code || ""),
        full_name: String(p?.full_name || ""),
        sex: String(p?.sex || "M"),
        birth_date: String(p?.birth_date || "").slice(0, 10),
        guardian_name: String(p?.guardian_name || ""),
        guardian_phone: String(p?.guardian_phone || ""),
        triageId: triageByVisit?.id ?? null,
        triage_temperature: triageByVisit?.temperature != null ? String(triageByVisit.temperature) : "",
        triage_heart_rate: triageByVisit?.heart_rate != null ? String(triageByVisit.heart_rate) : "",
        triage_respiratory_rate: triageByVisit?.respiratory_rate != null ? String(triageByVisit.respiratory_rate) : "",
        triage_oxygen_saturation: triageByVisit?.oxygen_saturation != null ? String(triageByVisit.oxygen_saturation) : "",
        triage_weight: triageByVisit?.weight != null ? String(triageByVisit.weight) : "",
        triage_chief_complaint: String(triageByVisit?.chief_complaint || ""),
        triage_clinical_notes: String(triageByVisit?.clinical_notes || ""),
      }));
    } catch (e) {
      setPatientEditModal((prev) => ({ ...prev, loading: false, triageLoading: false }));
      setQueueErr(e.message);
    }
  };

  const savePatientEdit = async () => {
    const patientId = Number(patientEditModal?.patientId);
    if (!Number.isFinite(patientId) || patientId <= 0) return;

    const payload = {
      clinical_code: patientEditModal.clinical_code.trim(),
      full_name: patientEditModal.full_name.trim(),
      sex: patientEditModal.sex,
      birth_date: patientEditModal.birth_date,
      guardian_name: patientEditModal.guardian_name.trim(),
      guardian_phone: patientEditModal.guardian_phone.trim(),
    };

    if (!payload.clinical_code || !payload.full_name || !payload.sex || !payload.birth_date || !payload.guardian_name || !payload.guardian_phone) {
      setQueueErr("Preencha todos os campos do paciente.");
      return;
    }

    setPatientEditModal((prev) => ({ ...prev, saving: true }));
    setQueueErr("");
    try {
      const updated = await api.updatePatient(patientId, payload);
      if (Number(patient?.id) === patientId) setPatient(updated);
      await loadQueue();
      showPopup("success", "Paciente atualizado", "Dados do paciente atualizados com sucesso.");
      closePatientEditModal();
    } catch (e) {
      setQueueErr(e.message);
      setPatientEditModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const saveQueueTriageEdit = async () => {
    const visitId = Number(patientEditModal?.visitId);
    if (!Number.isFinite(visitId) || visitId <= 0) return;
    const chief = String(patientEditModal.triage_chief_complaint || "").trim();
    if (!chief) {
      setQueueErr("Queixa principal da triagem é obrigatória.");
      return;
    }

    const priorityValue = String(patientEditModal.triage_priority || "URGENT");
    const defaultMax = PRIORITIES.find((p) => p.value === priorityValue)?.maxWait ?? 60;
    const customMax = String(patientEditModal.triage_max_wait_minutes || "").trim();
    const maxWait = customMax === "" ? defaultMax : Number(customMax);
    if (!Number.isFinite(maxWait) || maxWait <= 0) {
      setQueueErr("Espera máxima inválida.");
      return;
    }

    setPatientEditModal((prev) => ({ ...prev, triageSaving: true }));
    setQueueErr("");
    try {
      if (patientEditModal.triageId) {
        await api.updateTriage(patientEditModal.triageId, {
          temperature: parseNumberish(patientEditModal.triage_temperature),
          heart_rate: parseNumberish(patientEditModal.triage_heart_rate),
          respiratory_rate: parseNumberish(patientEditModal.triage_respiratory_rate),
          oxygen_saturation: parseNumberish(patientEditModal.triage_oxygen_saturation),
          weight: parseNumberish(patientEditModal.triage_weight),
          chief_complaint: chief,
          clinical_notes: String(patientEditModal.triage_clinical_notes || "").trim() || null,
        });
      } else {
        const created = await api.createTriage({
          visit_id: visitId,
          temperature: parseNumberish(patientEditModal.triage_temperature),
          heart_rate: parseNumberish(patientEditModal.triage_heart_rate),
          respiratory_rate: parseNumberish(patientEditModal.triage_respiratory_rate),
          oxygen_saturation: parseNumberish(patientEditModal.triage_oxygen_saturation),
          weight: parseNumberish(patientEditModal.triage_weight),
          chief_complaint: chief,
          clinical_notes: String(patientEditModal.triage_clinical_notes || "").trim() || null,
        });
        setPatientEditModal((prev) => ({ ...prev, triageId: created?.id || prev.triageId }));
      }

      await api.setVisitPriority(visitId, { priority: priorityValue, max_wait_minutes: maxWait });
      await loadQueue();
      showPopup("success", "Triagem atualizada", "Informações da triagem atualizadas com sucesso.");
      closePatientEditModal();
    } catch (e) {
      setQueueErr(e.message);
      setPatientEditModal((prev) => ({ ...prev, triageSaving: false }));
    }
  };

  const startPastVisitPatientEdit = async () => {
    const patientId = Number(pastVisitModal?.visit?.patient_id);
    const visitId = Number(pastVisitModal?.visit?.id);
    if (!Number.isFinite(patientId) || patientId <= 0) {
      setQueueErr("Não foi possível identificar o paciente deste histórico.");
      return;
    }
    setPastVisitModal((prev) => ({ ...prev, editingPatient: true, patientLoading: true, patientSaving: false }));
    try {
      const [p, triage] = await Promise.all([
        api.getPatientById(patientId),
        Number.isFinite(visitId) && visitId > 0 ? api.getTriageByVisitId(visitId).catch(() => null) : Promise.resolve(null),
      ]);
      setPastVisitModal((prev) => ({
        ...prev,
        patientLoading: false,
        patientForm: {
          patientId,
          clinical_code: String(p?.clinical_code || ""),
          full_name: String(p?.full_name || ""),
          sex: String(p?.sex || "M"),
          birth_date: String(p?.birth_date || "").slice(0, 10),
          guardian_name: String(p?.guardian_name || ""),
          guardian_phone: String(p?.guardian_phone || ""),
          triage_id: triage?.id ?? null,
          triage_temperature: triage?.temperature ?? null,
          triage_heart_rate: triage?.heart_rate ?? null,
          triage_respiratory_rate: triage?.respiratory_rate ?? null,
          triage_oxygen_saturation: triage?.oxygen_saturation ?? null,
          triage_weight: triage?.weight ?? null,
          triage_clinical_notes: String(triage?.clinical_notes || ""),
          chief_complaint: String((triage?.chief_complaint || prev?.visit?.chief_complaint || prev?.visit?.triage_chief_complaint || "").trim()),
          likely_diagnosis: String(prev?.visit?.likely_diagnosis || ""),
          clinical_reasoning: String(prev?.visit?.clinical_reasoning || ""),
          prescription_text: String(prev?.visit?.prescription_text || ""),
          doctor_id: prev?.visit?.doctor_id != null ? String(prev.visit.doctor_id) : "",
          hospital_status: String(prev?.visit?.hospital_status || ""),
        },
      }));
    } catch (e) {
      setPastVisitModal((prev) => ({ ...prev, patientLoading: false }));
      setQueueErr(e.message);
    }
  };

  const savePastVisitPatientEdit = async () => {
    const patientId = Number(pastVisitModal?.patientForm?.patientId);
    const visitId = Number(pastVisitModal?.visit?.id);
    if (!Number.isFinite(patientId) || patientId <= 0) return;
    const payload = {
      clinical_code: String(pastVisitModal.patientForm.clinical_code || "").trim(),
      full_name: String(pastVisitModal.patientForm.full_name || "").trim(),
      sex: String(pastVisitModal.patientForm.sex || "M"),
      birth_date: String(pastVisitModal.patientForm.birth_date || ""),
      guardian_name: String(pastVisitModal.patientForm.guardian_name || "").trim(),
      guardian_phone: String(pastVisitModal.patientForm.guardian_phone || "").trim(),
    };
    if (!payload.clinical_code || !payload.full_name || !payload.sex || !payload.birth_date || !payload.guardian_name || !payload.guardian_phone) {
      setQueueErr("Preencha todos os campos do paciente.");
      return;
    }
    if (!Number.isFinite(visitId) || visitId <= 0) {
      setQueueErr("Visita antiga inválida.");
      return;
    }

    setPastVisitModal((prev) => ({ ...prev, patientSaving: true }));
    setQueueErr("");
    try {
      const updatedPatient = await api.updatePatient(patientId, payload);
      const chiefComplaint = String(pastVisitModal.patientForm.chief_complaint || "").trim();
      if (pastVisitModal.patientForm.triage_id && chiefComplaint) {
        await api.updateTriage(pastVisitModal.patientForm.triage_id, {
          temperature: pastVisitModal.patientForm.triage_temperature,
          heart_rate: pastVisitModal.patientForm.triage_heart_rate,
          respiratory_rate: pastVisitModal.patientForm.triage_respiratory_rate,
          oxygen_saturation: pastVisitModal.patientForm.triage_oxygen_saturation,
          weight: pastVisitModal.patientForm.triage_weight,
          chief_complaint: chiefComplaint,
          clinical_notes: String(pastVisitModal.patientForm.triage_clinical_notes || "").trim() || null,
        });
      }

      await api.updatePastVisitSummary(visitId, {
        likely_diagnosis: String(pastVisitModal.patientForm.likely_diagnosis || "").trim() || null,
        clinical_reasoning: String(pastVisitModal.patientForm.clinical_reasoning || "").trim() || null,
        prescription_text: String(pastVisitModal.patientForm.prescription_text || "").trim() || null,
        doctor_id: pastVisitModal.patientForm.doctor_id ? Number(pastVisitModal.patientForm.doctor_id) : null,
        hospital_status: String(pastVisitModal.patientForm.hospital_status || "").trim().toUpperCase() || null,
      });

      setPastVisits((prev) =>
        prev.map((v) => (Number(v?.id) === visitId
          ? {
              ...v,
              full_name: updatedPatient?.full_name || v.full_name,
              clinical_code: updatedPatient?.clinical_code || v.clinical_code,
              chief_complaint: chiefComplaint || v.chief_complaint,
              triage_chief_complaint: chiefComplaint || v.triage_chief_complaint,
              likely_diagnosis: String(pastVisitModal.patientForm.likely_diagnosis || "").trim() || v.likely_diagnosis,
              clinical_reasoning: String(pastVisitModal.patientForm.clinical_reasoning || "").trim() || v.clinical_reasoning,
              prescription_text: String(pastVisitModal.patientForm.prescription_text || "").trim() || v.prescription_text,
              doctor_id: pastVisitModal.patientForm.doctor_id ? Number(pastVisitModal.patientForm.doctor_id) : null,
              hospital_status: String(pastVisitModal.patientForm.hospital_status || "").trim().toUpperCase() || null,
            }
          : v))
      );
      closePastVisitModal();
      showPopup("success", "Dados atualizados", "Paciente e dados clínicos da visita foram atualizados com sucesso.");
    } catch (e) {
      closePastVisitModal();
      showPopup("warning", "Erro ao salvar", e.message || "Não foi possível atualizar os dados.");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadDoctors(controller.signal);
    const interval = setInterval(() => { const ctrl = new AbortController(); loadDoctors(ctrl.signal); }, 30 * 60 * 1000);
    return () => { controller.abort(); clearInterval(interval); };
  }, []);

  useEffect(() => {
    loadQueue(); loadPastVisits(); loadNotifications(); loadPreferences();
    const interval = setInterval(() => { loadQueue(); loadPastVisits(); loadNotifications(); loadPreferences(); }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPreferences]);

  useEffect(() => {
    loadShiftStatus();
  }, [loadShiftStatus]);

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
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
    if (activeView === "notifications") loadNotifications();
    if (activeView === "preferences") loadPreferences();
    if (activeView === "roomsAvailable") { loadQueue(); loadDoctors(); }
  }, [activeView, loadPreferences]);

  useEffect(() => { if (err) showPopup("warning", "Atenção", err); }, [err]);
  useEffect(() => { if (queueErr) showPopup("warning", "Atenção", queueErr); }, [queueErr]);
  useEffect(() => {
    if (!bypassToER && (!hasDoctorAvailable || !hasRoomAvailable)) {
      setHoldInWaitingLine(true);
    }
  }, [bypassToER, hasDoctorAvailable, hasRoomAvailable]);

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
    try { const v = await api.createVisit(patient.id); setVisit(v); await loadQueue(); }
    catch (e) { setErr(e.message); }
    finally { setCreatingVisit(false); }
  };

  const askAI = async () => {
    if (!triageFieldsOk) {
      showPopup("warning", "Dados incompletos para IA", triageValidationErrors.length > 0 ? triageValidationErrors.join("\n") : "Preencha todos os campos obrigatórios.");
      return;
    }
    setErr(""); setAiLoading(true); setAiSuggestion(null);
    try {
      const res = await api.aiTriageSuggest({ age_years: patientAgeYears, chief_complaint: chiefComplaint.trim(), clinical_notes: clinicalNotes.trim() || null, temperature: parseNumberish(temperature), heart_rate: parseNumberish(heartRate), respiratory_rate: parseNumberish(respRate), oxygen_saturation: parseNumberish(spo2), weight: parseNumberish(weight) });
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
    if (!q) { showPopup("warning", "Pesquisa vazia", "Escreva um nome para pesquisar."); return; }
    setSearchLoading(true); setErr("");
    try {
      const data = await api.searchPatients(q);
      setActiveView("newTriage"); setSearchMode("NAME"); setNameQuery(q);
      setSearchResults(Array.isArray(data) ? data : []);
      setPatient(null); setVisit(null); setAiSuggestion(null); setSelectedDoctorId(""); setTriageStep(1);
      if (!Array.isArray(data) || data.length === 0) showPopup("warning", "Sem resultados", "Nenhum paciente encontrado com esse nome.");
    } catch (e) { setErr(e.message); }
    finally { setSearchLoading(false); }
  };

  const saveTriage = async (e) => {
    e.preventDefault();
    if (!visit?.id) { setErr("Crie a visita (chegada) antes de registrar a triagem."); return; }
    if (!triageFieldsOk) { showPopup("warning", "Não é possível concluir a triagem", triageValidationErrors.join("\n") || "Revise os dados."); return; }
    const currentWeight = parseNumberish(weight);
    if (currentWeight != null && latestRecordedWeight != null) {
      const ratio = currentWeight / latestRecordedWeight;
      if (ratio < 0.7 || ratio > 1.5) { setErr(`Peso inconsistente com histórico recente (${latestRecordedWeight} kg).`); return; }
    }
    setErr(""); setSavingTriage(true);
    try {
      const flowNotes = [];
      if (bypassToER) flowNotes.push("Fluxo crítico: bypass para Sala de Reanimação / ER.");
      if (!bypassToER && recommendedRoomLabel) flowNotes.push(`Sala recomendada: ${recommendedRoomLabel}.`);
      if (holdInWaitingLine || (!bypassToER && (!hasDoctorAvailable || !hasRoomAvailable))) {
        flowNotes.push("Encaminhamento: manter em fila de espera até haver médico e sala disponíveis.");
      }
      const mergedClinicalNotes = [clinicalNotes.trim(), ...flowNotes].filter(Boolean).join("\n");
      let triageAlreadyExisted = false;
      try {
        await api.createTriage({
          visit_id: visit.id,
          temperature: parseNumberish(temperature),
          heart_rate: parseNumberish(heartRate),
          respiratory_rate: parseNumberish(respRate),
          oxygen_saturation: parseNumberish(spo2),
          weight: parseNumberish(weight),
          chief_complaint: chiefComplaint.trim(),
          clinical_notes: mergedClinicalNotes || null,
        });
      } catch (triageErr) {
        const msg = String(triageErr?.message || "");
        if (!/ja existe triagem/i.test(msg)) throw triageErr;
        triageAlreadyExisted = true;
      }
      const maxWait = customMaxWait !== "" ? Number(customMaxWait) : selectedPriority?.maxWait;
      await api.setVisitPriority(visit.id, { priority, max_wait_minutes: maxWait });
      if (selectedDoctorId) {
        await api.assignDoctor(visit.id, Number(selectedDoctorId));
      }

      const keepWaiting = !bypassToER && (holdInWaitingLine || !selectedDoctorId || !hasRoomAvailable);
      await loadDoctors();
      resetAll(); await loadQueue();
      if (bypassToER) {
        showPopup("success", "Triagem crítica concluída", "Paciente marcado como bypass para Sala de Reanimação / ER.");
      } else if (keepWaiting) {
        showPopup("success", "Triagem concluída", triageAlreadyExisted ? "Triagem já existia e foi finalizada com prioridade atualizada. Paciente permanece na fila." : "Triagem registrada. Paciente permanece na fila por indisponibilidade de sala/médico.");
      } else {
        showPopup("success", "Triagem concluída", triageAlreadyExisted ? `Triagem já existia e foi finalizada com sucesso. Sala sugerida: ${recommendedRoomLabel || "definir na admissão"}.` : `Triagem registrada com sucesso. Sala sugerida: ${recommendedRoomLabel || "definir na admissão"}.`);
      }
    } catch (e2) { setErr(e2.message); }
    finally { setSavingTriage(false); }
  };

  const inTriageCount = useMemo(() => queue.filter((v) => v?.status === "IN_TRIAGE").length, [queue]);

  const navSections = [
    {
      title: "Dashboard",
      items: [
        { key: "home", label: "Dashboard", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
      ],
    },
    {
      title: "Pacientes",
      items: [
        { key: "newTriage", label: "Nova Triagem", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> },
        { key: "queue", label: "Fila de Espera", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, badge: queue.length > 0 ? queue.length : null },
        { key: "patientsInTriage", label: "Pacientes em Triagem", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 00.707-.293l1.414-1.414A1 1 0 0112.414 3h1.172a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v12a2 2 0 01-2 2z" /></svg>, badge: inTriageCount > 0 ? inTriageCount : null },
        { key: "quickSearch", label: "Pesquisa Rápida", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" /></svg> },
      ],
    },
    {
      title: "Fluxo e Recurso",
      items: [
        { key: "roomsAvailable", label: "Quartos Disponíveis", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2m-2 0v12m-10 0V7m-2 12h14" /></svg> },
        { key: "doctors", label: "Médicos Disponíveis", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
      ],
    },
    {
      title: "Histórico e Relatórios",
      items: [
        { key: "patients", label: "Pacientes Antigos", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
        { key: "shiftReport", label: "Relatório do Turno", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2V7m3 10v-4m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
      ],
    },
    {
      title: "Configurações",
      items: [
        { key: "notifications", label: "Notificações", badge: notificationsUnread > 0 ? notificationsUnread : null, icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
        { key: "preferences", label: "Preferências", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.02a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.02a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.02a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
        { key: "logout", label: "Sair", icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>, onClick: logout },
      ],
    },
  ];

  const triageSteps = [{ num: 1, label: "Paciente" }, { num: 2, label: "Avaliação" }, { num: 3, label: "Prioridade" }];
  const getStepStatus = (stepNum) => stepNum < triageStep ? "done" : stepNum === triageStep ? "active" : "pending";

  // Dashboard chart data (mock weekly data for illustration)
  const totalQueue = Number.isFinite(Number(queueSummary?.total)) ? Number(queueSummary.total) : queue.length;
  const urgentCount = Number.isFinite(Number(queueSummary?.urgent)) ? Number(queueSummary.urgent) : urgentQueue.length;
  const weeklyData = [12, 19, 8, 24, 15, 30, totalQueue + 5];
  const shiftEndIso = shiftStatus?.extended_until || shiftStatus?.scheduled_end || null;
  const shiftRemainingMs = useMemo(() => {
    if (!shiftStatus?.clock_in_at || !shiftEndIso) return null;
    const endTs = new Date(shiftEndIso).getTime();
    if (!Number.isFinite(endTs)) return null;
    const breakStartedTs = shiftStatus?.break_started_at ? new Date(shiftStatus.break_started_at).getTime() : null;
    const referenceTs =
      shiftStatus?.is_on_break && Number.isFinite(breakStartedTs) ? breakStartedTs : nowTs;
    return Math.max(0, endTs - referenceTs);
  }, [shiftStatus?.clock_in_at, shiftStatus?.break_started_at, shiftStatus?.is_on_break, shiftEndIso, nowTs]);
  const shiftRemainingLabel = useMemo(() => {
    if (shiftRemainingMs == null) return null;
    const totalSec = Math.floor(shiftRemainingMs / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [shiftRemainingMs]);
  const shiftIsOnBreak = Boolean(shiftStatus?.is_on_break);
  const shiftIsActive = Boolean(shiftStatus?.is_on_shift || shiftIsOnBreak);
  const shiftStartDisabled = loadingShift || startingShift || shiftIsActive;
  const shiftCanExtend = shiftIsActive && !shiftIsOnBreak;
  const shiftBreakButtonLabel = shiftIsOnBreak ? "Retomar Turno" : "Iniciar Pausa";
  const shiftMenuBusy = startingShift || breakShiftLoading || stoppingShift || extendingShift;
  const shiftStateBadge = useMemo(() => {
    if (loadingShift) return { label: "A carregar turno...", bg: "#f3f4f6", border: "#e5e7eb", color: "#4b5563" };
    if (shiftIsOnBreak) return { label: "Em pausa", bg: "#fffbeb", border: "#fde68a", color: "#92400e" };
    if (shiftIsActive) return { label: "Turno ativo", bg: "#ecfdf3", border: "#86efac", color: "#166534" };
    return { label: "Turno encerrado", bg: "#f8fafc", border: "#d1d5db", color: "#475569" };
  }, [loadingShift, shiftIsOnBreak, shiftIsActive]);
  // Recent queue entries for transaction-style list
  const recentQueueItems = queue.slice(0, 6);

  return (
    <div
      className={`flex h-screen bg-gray-50 ${
        Number(preferences?.font_scale_percent || 100) !== 100 ? "nurse-font-scaled" : ""
      }`}
      style={{
        "--nurse-font-scale":
          Number(preferences?.font_scale_percent || 100) === 105 ? 1.05 : 1,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #165034;
          box-shadow: 0 0 0 3px rgba(22,80,52,0.12);
        }

        .sidebar { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); overflow: hidden; background: #0c3a24; color: #ffffff; }
        .sidebar-open { width: 256px; }
        .sidebar-closed { width: 76px; }
        .sidebar nav { overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(220,235,226,0.55) transparent; }
        .sidebar nav::-webkit-scrollbar { width: 8px; }
        .sidebar nav::-webkit-scrollbar-thumb { background: rgba(220,235,226,0.45); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        .sidebar button:focus { outline: none; }
        .sidebar-closed nav { padding-left: 8px !important; padding-right: 8px !important; }
        .sidebar-closed .nav-item-wrap > button { justify-content: center; gap: 0 !important; padding-left: 10px !important; padding-right: 10px !important; }

        .nav-label { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .nav-label { opacity: 1; max-width: 200px; }
        .sidebar-closed .nav-label { opacity: 0; max-width: 0; }
        .logo-text { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .logo-text { opacity: 1; max-width: 200px; }
        .sidebar-closed .logo-text { opacity: 0; max-width: 0; }

        .sidebar-closed .nav-badge { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; font-size: 10px; border-radius: 9999px; }
        .nav-badge-open { width: 20px; height: 20px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }
        .nav-tooltip { position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%); background: #111827; color: #fff; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s ease; z-index: 50; }
        .sidebar-closed .nav-item-wrap:hover .nav-tooltip { opacity: 1; }
        .sidebar-open .nav-tooltip { display: none; }

        .step-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 8px; border-radius: 2px; transition: background 0.3s; }
        .step-line.done { background: #165034; }
        .step-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; transition: all 0.3s; flex-shrink: 0; }
        .step-circle.pending { background: #f3f4f6; color: #9ca3af; border: 2px solid #e5e7eb; }
        .step-circle.active { background: #165034; color: white; border: 2px solid #165034; }
        .step-circle.done { background: #165034; color: white; border: 2px solid #165034; }

        .triage-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 14px; color: #111827; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; }
        .triage-input::placeholder { color: #d1d5db; }
        .triage-input:focus { outline: none; border-color: #165034; box-shadow: 0 0 0 3px rgba(22,80,52,0.12); }
        .triage-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; letter-spacing: 0.01em; }
        .triage-hint { font-size: 11px; color: #9ca3af; margin-bottom: 6px; line-height: 1.4; }

        .priority-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; background: #fff; display: flex; align-items: center; gap: 12px; }
        .priority-card:hover { border-color: #2d6f4e; background: #fafafa; }
        .priority-card.selected-urgent { border-color: #ef4444; background: #fef2f2; }
        .priority-card.selected-less { border-color: #f97316; background: #fff7ed; }
        .priority-card.selected-non { border-color: #165034; background: #edf5f0; }
        .priority-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .priority-radio.checked-urgent { border-color: #ef4444; background: #ef4444; }
        .priority-radio.checked-less { border-color: #f97316; background: #f97316; }
        .priority-radio.checked-non { border-color: #165034; background: #165034; }
        .priority-radio-dot { width: 6px; height: 6px; border-radius: 50%; background: white; }

        .search-tab { flex: 1; padding: 8px 12px; font-size: 13px; font-weight: 500; border-radius: 8px; transition: all 0.15s; border: none; cursor: pointer; }
        .search-tab.active { background: #165034; color: white; }
        .search-tab.inactive { background: transparent; color: #6b7280; }
        .search-tab.inactive:hover { background: #f3f4f6; }

        .patient-result-card { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; background: #fff; text-align: left; width: 100%; }
        .patient-result-card:hover { border-color: #165034; background: #edf5f0; }
        .patient-confirmed { background: linear-gradient(135deg, #e7f1ec 0%, #dcebe2 100%); border: 1.5px solid #2d6f4e; border-radius: 12px; padding: 16px; }
        .ai-card { background: linear-gradient(135deg, #edf5f0 0%, #e7f1ec 100%); border: 1.5px solid #2d6f4e; border-radius: 12px; padding: 14px; }
        .ai-badge { display: inline-flex; align-items: center; gap: 4px; background: #165034; color: white; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; margin-bottom: 8px; }

        .btn-primary { background: #165034; color: white; border: none; border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
        .btn-primary:hover:not(:disabled) { background: #0c3a24; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(22,80,52,0.28); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-secondary { background: #f3f4f6; color: #374151; border: none; border-radius: 10px; padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
        .btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
        .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #0c3a24; border: 1.5px solid #2d6f4e; border-radius: 10px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
        .btn-ghost:hover:not(:disabled) { background: #edf5f0; }
        .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

        .section-divider { border: none; border-top: 1.5px dashed #e5e7eb; margin: 20px 0; }
        .form-card { background: white; border: 1px solid #f0f0f0; border-radius: 16px; padding: 28px; box-shadow: 0 1px 8px rgba(0,0,0,0.04); }

        .nav-active { background: #165034 !important; color: #ffffff !important; border-radius: 10px; }
        .sidebar-nav-inactive { color: rgba(255,255,255,0.9) !important; }
        .sidebar-nav-inactive:hover { background: rgba(255,255,255,0.12) !important; color: #ffffff !important; }
        .nav-item-btn:focus-visible { outline: none; }

        .chip { display: inline-flex; align-items: center; padding: 5px 12px; border: 1.5px solid #e5e7eb; border-radius: 20px; font-size: 12px; font-weight: 500; color: #4b5563; cursor: pointer; transition: all 0.15s; background: white; }
        .chip:hover { border-color: #165034; color: #0c3a24; background: #edf5f0; }
        .chip.chip-selected { border-color: #165034; color: #0c3a24; background: #e7f1ec; }

        .doctor-card { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.15s; }
        .doctor-card:hover { border-color: #165034; }
        .doctor-card.selected { border-color: #165034; background: #e7f1ec; }
        .doc-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #165034, #2d6f4e); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0; }

        .step-nav { display: flex; gap: 10px; margin-top: 20px; }
        .vital-group { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .popup-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.35); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px; }
        .popup-card { width: min(460px, 100%); background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18); padding: 18px; }
        .popup-icon { width: 36px; height: 36px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .popup-icon-warning { background: #fef3c7; color: #b45309; }
        .popup-icon-success { background: #dcebe2; color: #0c3a24; }

        /* ============================================================
           MODERNIZED DASHBOARD STYLES
        ============================================================ */
        .dash-hero-card {
          background: linear-gradient(135deg, #0c3a24 0%, #165034 55%, #1a6040 100%);
          border-radius: 20px;
          padding: 28px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .dash-hero-card::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }
        .dash-hero-card::after {
          content: '';
          position: absolute;
          bottom: -60px; right: 60px;
          width: 150px; height: 150px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }

        .dash-stat-card {
          background: white;
          border-radius: 18px;
          padding: 20px 22px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .dash-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }

        .dash-chart-card {
          background: white;
          border-radius: 18px;
          padding: 22px 24px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .dash-section-title {
          font-size: 13px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 14px;
        }

        .queue-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f5f5f5;
          transition: background 0.15s;
          cursor: pointer;
          border-radius: 8px;
          padding-left: 8px;
          padding-right: 8px;
          margin: 0 -8px;
        }
        .queue-row:hover { background: #f9fafb; }
        .queue-row:last-child { border-bottom: none; }

        .status-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }

        .priority-pill {
          font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
        }

        .dash-donut-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .dash-donut-center {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .update-banner {
          background: #0c3a24;
          color: white;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }
        .update-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; flex-shrink: 0; margin-top: 5px; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .quick-action-btn {
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .quick-action-btn:hover {
          border-color: #165034;
          background: #f0f8f4;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22,80,52,0.1);
        }

        .trend-up { color: #22c55e; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
        .trend-down { color: #ef4444; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
        .trend-neutral { color: #9ca3af; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 3px; }

        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .dash-grid-2 {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .dash-grid-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-animate { animation: fadeInUp 0.4s ease forwards; }
        .dash-animate-delay-1 { animation-delay: 0.05s; opacity: 0; }
        .dash-animate-delay-2 { animation-delay: 0.1s; opacity: 0; }
        .dash-animate-delay-3 { animation-delay: 0.15s; opacity: 0; }
        .dash-animate-delay-4 { animation-delay: 0.2s; opacity: 0; }
        .dash-animate-delay-5 { animation-delay: 0.25s; opacity: 0; }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-line {
          border-radius: 8px;
          background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 40%, #eef2f7 60%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.25s linear infinite;
        }
        .nurse-font-scaled * {
          font-size: calc(100% * var(--nurse-font-scale)) !important;
          line-height: 1.4;
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar flex flex-col flex-shrink-0 ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-white">
            {sidebarOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
          <div className="logo-text min-w-0">
            <div className="text-sm font-bold text-white leading-tight">Triagem</div>
            <div className="text-xs font-medium" style={{ color: "#dcebe2" }}>Painel Enfermagem</div>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <div className="space-y-4">
            {navSections.map((section) => (
              <div key={section.title}>
                {sidebarOpen && (
                  <div className="px-3 pb-1 text-[11px] uppercase tracking-[0.08em] text-gray-400 font-semibold">{section.title}</div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.key} className="nav-item-wrap relative">
                      <button
                        onClick={() => { if (item.onClick) { item.onClick(); return; } setActiveView(item.key); }}
                        className={`nav-item-btn w-full text-left px-3 py-2.5 text-sm font-medium transition-all flex items-center gap-3 relative rounded-xl focus:outline-none ${activeView === item.key ? "nav-active" : "sidebar-nav-inactive"}`}
                      >
                        {item.icon}
                        <span className="nav-label">{item.label}</span>
                        {item.badge && sidebarOpen && <span className="ml-auto nav-badge-open text-white" style={{ background: "#165034" }}>{item.badge}</span>}
                        {item.badge && !sidebarOpen && <span className="nav-badge absolute top-1 right-1 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center" style={{ background: "#165034" }}>{item.badge}</span>}
                      </button>
                      <span className="nav-tooltip">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Nav */}
        <div style={{ position: "sticky", top: 0, zIndex: 100, background: "white", borderBottom: "1px solid #f0f0f0", height: "60px", display: "flex", alignItems: "center", paddingLeft: "24px", paddingRight: "24px", gap: "16px" }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", maxWidth: "360px", background: "#f9fafb", border: `1.5px solid ${topSearchFocus ? "#2d6f4e" : "#f0f0f0"}`, borderRadius: "10px", padding: "8px 14px", transition: "border-color 0.15s" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input placeholder="Pesquisar paciente" value={topNavSearch} onChange={(e) => setTopNavSearch(e.target.value)} onFocus={() => setTopSearchFocus(true)} onBlur={() => setTopSearchFocus(false)} onKeyDown={(e) => e.key === "Enter" && searchFromTopNav()} style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", color: "#374151", width: "100%" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            {String(me?.role || "").toUpperCase() === "NURSE" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}>
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${shiftStateBadge.border}`,
                    background: shiftStateBadge.bg,
                    color: shiftStateBadge.color,
                    fontSize: "11px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}
                  title="Estado atual do turno"
                >
                  {shiftStateBadge.label}
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShiftMenuOpen((prev) => !prev)}
                    disabled={loadingShift || shiftMenuBusy}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1px solid #2d6f4e",
                      background: "#ffffff",
                      color: "#0c3a24",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: loadingShift || shiftMenuBusy ? "not-allowed" : "pointer",
                      opacity: loadingShift || shiftMenuBusy ? 0.7 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    Ações do Turno
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {shiftMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        minWidth: "220px",
                        background: "#ffffff",
                        border: "1px solid #dcebe2",
                        borderRadius: "12px",
                        boxShadow: "0 12px 30px rgba(15,23,42,0.15)",
                        padding: "6px",
                        zIndex: 220,
                      }}
                    >
                      <button type="button" disabled={shiftStartDisabled} onClick={startShift} className="btn-secondary" style={{ width: "100%", justifyContent: "flex-start", padding: "8px 10px", minHeight: "36px", fontSize: "12px", background: "transparent" }}>
                        {startingShift ? "A iniciar..." : "Iniciar Turno"}
                      </button>
                      <button type="button" disabled={breakShiftLoading || !shiftIsActive} onClick={toggleBreakShift} className="btn-secondary" style={{ width: "100%", justifyContent: "flex-start", padding: "8px 10px", minHeight: "36px", fontSize: "12px", background: "transparent" }}>
                        {breakShiftLoading ? "A processar..." : shiftBreakButtonLabel}
                      </button>
                      <button type="button" disabled={extendingShift || !shiftCanExtend} onClick={extendShift} className="btn-secondary" style={{ width: "100%", justifyContent: "flex-start", padding: "8px 10px", minHeight: "36px", fontSize: "12px", background: "transparent" }}>
                        {extendingShift ? "A estender..." : "Estender +1h"}
                      </button>
                      <button type="button" disabled={stoppingShift || !shiftIsActive} onClick={stopShift} className="btn-secondary" style={{ width: "100%", justifyContent: "flex-start", padding: "8px 10px", minHeight: "36px", fontSize: "12px", background: "transparent", color: "#b91c1c" }}>
                        {stoppingShift ? "A encerrar..." : "Encerrar Turno"}
                      </button>
                    </div>
                  )}
                </div>
                {shiftRemainingLabel && shiftIsActive && (
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: "10px",
                      border: shiftIsOnBreak ? "1px solid #fde68a" : "1px solid #dcebe2",
                      background: shiftIsOnBreak ? "#fffbeb" : "#f8fafc",
                      color: shiftIsOnBreak ? "#854d0e" : "#0c3a24",
                      fontSize: "11px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                    }}
                    title="Tempo restante do turno"
                  >
                    {shiftIsOnBreak ? "Em pausa" : "Restante"}: {shiftRemainingLabel}
                  </div>
                )}
              </div>
            )}
            <button type="button" onClick={() => showPopup("warning", "Em breve", "Chat interno disponível em breve.")} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => {
                  setNotificationsPreviewOpen((prev) => !prev);
                  if (!notificationsPreviewOpen) loadNotifications();
                }}
                style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", position: "relative" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {notificationsUnread > 0 && (
                  <span style={{ position: "absolute", top: "1px", right: "1px", minWidth: "16px", height: "16px", borderRadius: "999px", background: "#ef4444", border: "1.5px solid white", color: "white", fontSize: "10px", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {notificationsUnread > 99 ? "99+" : notificationsUnread}
                  </span>
                )}
              </button>
              {notificationsPreviewOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "330px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", boxShadow: "0 12px 30px rgba(15,23,42,0.16)", zIndex: 220, overflow: "hidden" }}>
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>Notificação mais recente</div>
                    <button type="button" onClick={() => { setNotificationsPreviewOpen(false); setActiveView("notifications"); }} style={{ border: "none", background: "transparent", color: "#165034", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Ver todas</button>
                  </div>
                  <div style={{ padding: "12px" }}>
                    {loadingNotifications ? (
                      <div className="skeleton-line" style={{ height: "16px", width: "100%" }} />
                    ) : latestNotification ? (
                      <div style={{ display: "grid", gap: "6px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{latestNotification.title || "Notificação"}</div>
                        <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.4 }}>{latestNotification.message || "-"}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{latestNotification.created_at ? new Date(latestNotification.created_at).toLocaleString("pt-PT") : "-"}</span>
                          {!latestNotification.read_at && (
                            <button type="button" onClick={() => markNotificationRead(latestNotification.id)} className="btn-secondary" style={{ width: "auto", minHeight: "30px", padding: "6px 10px", fontSize: "12px" }}>
                              Marcar lida
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>Sem notificações recentes.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginLeft: "6px", fontSize: "13px", fontWeight: 600, color: "#374151", maxWidth: "180px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{me?.full_name || "Utilizador"}</div>
            <button style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #e5e7eb", overflow: "hidden", cursor: "pointer", marginLeft: "4px", padding: 0, background: "linear-gradient(135deg, #0c3a24, #165034)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "white" }}>{me?.full_name?.trim()?.[0]?.toUpperCase() || "D"}</span>
            </button>
          </div>
        </div>

        <div
          className="p-8 mx-auto"
          style={{ maxWidth: activeView === "patients" ? "none" : "64rem", width: "100%" }}
        >

          {/* ============================================================
              MODERNIZED HOME / DAY STATS VIEW
          ============================================================ */}
          {(activeView === "home" || activeView === "dayStats") && (
            <div>
              {/* Header */}
              <div style={{ marginBottom: "24px" }} className="dash-animate">
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div>
                    <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                      {activeView === "dayStats" ? "Estatísticas do Dia" : `Olá, ${me?.full_name?.split(' ')[0] || 'Enfermeiro(a)'}`}
                    </h1>
                    <p style={{ color: "#94a3b8", fontSize: "14px", margin: "4px 0 0", fontWeight: "400" }}>
                      {activeView === "dayStats" ? "Resumo operacional detalhado" : `${new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                    </p>
                  </div>
                  <button onClick={loadQueue} disabled={loadingQueue} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", fontWeight: "600", color: "#374151", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                    {loadingQueue ? "Atualizando..." : "Atualizar"}
                  </button>
                </div>
              </div>

              {/* Hero card + top 3 stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                {/* Hero card */}
                <div className="dash-hero-card dash-animate dash-animate-delay-1" style={{ gridRow: "1" }}>
                  <div className="update-dot" style={{ marginBottom: "10px" }} />
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    Hoje · {new Date().toLocaleDateString('pt-PT', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: "38px", fontWeight: "800", color: "white", lineHeight: "1", marginBottom: "4px", letterSpacing: "-0.02em" }}>
                    {totalQueue}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.85)", marginBottom: "12px" }}>
                    Pacientes na Fila
                  </div>
                  {urgentCount > 0 && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "20px", padding: "4px 10px", fontSize: "11px", fontWeight: "700", color: "#fca5a5" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
                      {urgentCount} urgente{urgentCount !== 1 ? "s" : ""}
                    </div>
                  )}
                  <div style={{ marginTop: "20px", position: "relative", zIndex: 1 }}>
                    <MiniBarChart data={weeklyData} color="#4ade80" height={52} />
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>Últimos 7 dias</div>
                  </div>
                </div>

                {/* Stats */}
                {[
                  {
                    label: "Médicos Disponíveis",
                    value: availableDoctors.length,
                    total: doctors.length,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#165034" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
                    iconBg: "#edf5f0",
                    trend: availableDoctors.length > 0 ? "up" : "neutral",
                    trendLabel: `de ${doctors.length} total`,
                    delay: "dash-animate-delay-2",
                  },
                  {
                    label: "Médicos Ocupados",
                    value: busyDoctors.length,
                    total: doctors.length,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                    iconBg: "#fef2f2",
                    trend: busyDoctors.length > 0 ? "down" : "up",
                    trendLabel: "em consulta",
                    delay: "dash-animate-delay-3",
                  },
                  {
                    label: "Em Triagem",
                    value: inTriageCount,
                    total: queue.length,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 00.707-.293l1.414-1.414A1 1 0 0112.414 3h1.172a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v12a2 2 0 01-2 2z"/></svg>,
                    iconBg: "#fff7ed",
                    trend: "neutral",
                    trendLabel: "a aguardar médico",
                    delay: "dash-animate-delay-4",
                  },
                ].map(({ label, value, icon, iconBg, trend, trendLabel, delay }) => (
                  <div key={label} className={`dash-stat-card dash-animate ${delay}`}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
                      <div className={trend === "up" ? "trend-up" : trend === "down" ? "trend-down" : "trend-neutral"}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
                      </div>
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", lineHeight: "1", marginBottom: "4px", letterSpacing: "-0.02em" }}>{value}</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "3px" }}>{label}</div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{trendLabel}</div>
                  </div>
                ))}
              </div>

              {/* Middle row: queue list + donut chart */}
              <div className="dash-grid-2">
                {/* Recent queue */}
                <div className={`dash-chart-card dash-animate dash-animate-delay-3`}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <div className="dash-section-title" style={{ margin: 0 }}>Fila Atual</div>
                    <button onClick={() => setActiveView("queue")} style={{ fontSize: "12px", fontWeight: "600", color: "#165034", background: "none", border: "none", cursor: "pointer" }}>Ver tudo →</button>
                  </div>

                  {recentQueueItems.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#d1d5db" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: "0 auto 8px" }}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500" }}>Fila vazia</p>
                    </div>
                  ) : (
                    <div>
                      {recentQueueItems.map((v) => {
                        const pCfg = PRIORITIES.find(p => p.value === v.priority);
                        const wait = v.wait_minutes ?? null;
                        const isCritical = wait != null && wait >= 180;
                        return (
                          <div key={v.id} className="queue-row" onClick={() => setActiveView("queue")}>
                            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: pCfg?.bg || "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px", fontWeight: "700", color: pCfg?.color || "#374151" }}>
                              {(v.full_name || "?")[0]}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.full_name || "-"}</div>
                              <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>{v.clinical_code || ""}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                              <span className="priority-pill" style={{ background: pCfg?.bg || "#f3f4f6", color: pCfg?.color || "#374151" }}>{pCfg?.label || v.priority}</span>
                              {wait != null && (
                                <span style={{ fontSize: "11px", color: isCritical ? "#ef4444" : "#9ca3af", fontWeight: isCritical ? "700" : "400" }}>{wait}min</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Donut + doctor breakdown */}
                <div className={`dash-chart-card dash-animate dash-animate-delay-4`}>
                  <div className="dash-section-title">Distribuição de Médicos</div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                    <div className="dash-donut-wrapper">
                      <DonutChart
                        segments={[
                          { value: availableDoctors.length || 0, color: "#165034" },
                          { value: busyDoctors.length || 0, color: "#ef4444" },
                          { value: Math.max(0, 0), color: "#e5e7eb" },
                        ].filter(s => s.value > 0).length === 0
                          ? [{ value: 1, color: "#e5e7eb" }]
                          : [
                            { value: availableDoctors.length, color: "#165034" },
                            { value: busyDoctors.length, color: "#ef4444" },
                          ]}
                        size={130}
                        stroke={20}
                      />
                      <div className="dash-donut-center">
                        <div style={{ fontSize: "26px", fontWeight: "800", color: "#0f172a", lineHeight: "1" }}>{doctors.length}</div>
                        <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600" }}>Total</div>
                      </div>
                    </div>

                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { label: "Disponíveis", value: availableDoctors.length, color: "#165034" },
                        { label: "Ocupados", value: busyDoctors.length, color: "#ef4444" },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: "12px", color: "#374151", fontWeight: "500" }}>{label}</div>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>{value}</div>
                          <div style={{ width: "60px", height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${doctors.length > 0 ? (value / doctors.length) * 100 : 0}%`, background: color, borderRadius: "99px", transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row: quick actions + priority breakdown */}
              <div className="dash-grid-bottom">
                {/* Quick Actions */}
                <div className={`dash-chart-card dash-animate dash-animate-delay-5`}>
                  <div className="dash-section-title">Ações Rápidas</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={() => setActiveView("newTriage")} className="quick-action-btn">
                      <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "#edf5f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#165034" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>Iniciar Nova Triagem</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>Registrar paciente e iniciar avaliação</div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </button>
                    <button onClick={() => setActiveView("queue")} className="quick-action-btn">
                      <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>Ver Fila de Espera</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>Gerir prioridades e atribuições</div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </button>
                    <button onClick={() => setActiveView("doctors")} className="quick-action-btn">
                      <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>Disponibilidade Médicos</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>Ver estado de cada médico</div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "#9ca3af" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Priority breakdown */}
                <div className={`dash-chart-card dash-animate dash-animate-delay-5`}>
                  <div className="dash-section-title">Distribuição por Prioridade</div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {PRIORITIES.map((p) => {
                      const count = queue.filter(v => v.priority === p.value).length;
                      const pct = totalQueue > 0 ? Math.round((count / totalQueue) * 100) : 0;
                      return (
                        <div key={p.value}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                              <span style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>{p.label}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "13px", fontWeight: "700", color: p.color }}>{count}</span>
                              <span style={{ fontSize: "11px", color: "#9ca3af" }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ height: "8px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${p.color}aa, ${p.color})`, borderRadius: "99px", transition: "width 0.8s ease" }} />
                          </div>
                        </div>
                      );
                    })}

                    {totalQueue === 0 && (
                      <div style={{ textAlign: "center", padding: "16px 0", color: "#9ca3af", fontSize: "13px" }}>
                        Nenhum paciente na fila
                      </div>
                    )}
                  </div>

                  {/* Update banner at bottom */}
                  <div style={{ marginTop: "20px", background: "linear-gradient(135deg, #0c3a24, #165034)", borderRadius: "12px", padding: "14px 16px", color: "white" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Triagem Pediátrica</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "white", marginBottom: "8px" }}>Sistema activo e a funcionar</div>
                    <button onClick={() => setActiveView("newTriage")} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "7px 14px", color: "white", fontSize: "12px", fontWeight: "700", cursor: "pointer", width: "100%", transition: "background 0.15s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}>
                      Iniciar Triagem →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "shiftReport" && (
            <div className="dash-animate dash-animate-delay-1">
              <ShiftReportView
                me={me}
                queue={queue}
                queueSummary={queueSummary}
                pastVisits={pastVisits}
                shiftStatus={shiftStatus}
                loadingQueue={loadingQueue}
                loadingPastVisits={loadingPastVisits}
                onRefresh={() => {
                  loadQueue();
                  loadPastVisits();
                  loadShiftStatus();
                }}
              />
            </div>
          )}

          {activeView === "notifications" && (
            <NotificationListView
              notifications={filteredNotifications}
              unreadCount={notificationsUnread}
              loading={loadingNotifications}
              onRefresh={loadNotifications}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
            />
          )}

          {activeView === "preferences" && (
            <PreferencesView
              key={`prefs-${JSON.stringify(preferences || {})}`}
              me={me}
              shiftStatus={shiftStatus}
              onLogout={logout}
              preferences={preferences}
              loading={loadingPreferences}
              saving={savingPreferences}
              onSave={savePreferences}
              onPreview={previewPreferences}
            />
          )}

          {/* NEW TRIAGE VIEW - Step Wizard */}
          {(activeView === "newTriage" || activeView === "quickSearch") && (
            <div className="dash-animate dash-animate-delay-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{activeView === "quickSearch" ? "Pesquisa Rápida" : "Nova Triagem"}</h1>
              <p className="text-sm text-gray-500 mb-8">{activeView === "quickSearch" ? "Busque rapidamente e inicie o atendimento." : "Siga os passos abaixo para registrar a triagem"}</p>

              <div className="form-card mb-6">
                <div style={{ display: "flex", alignItems: "center" }}>
                  {triageSteps.map((step, idx) => (
                    <div key={step.num} style={{ display: "flex", alignItems: "center", flex: idx < triageSteps.length - 1 ? "1" : "0" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                        <div className={`step-circle ${getStepStatus(step.num)}`}>
                          {getStepStatus(step.num) === "done" ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>) : step.num}
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: getStepStatus(step.num) === "pending" ? "#9ca3af" : "#0c3a24", whiteSpace: "nowrap" }}>{step.label}</span>
                      </div>
                      {idx < triageSteps.length - 1 && <div className={`step-line ${getStepStatus(step.num) === "done" ? "done" : ""}`} style={{ marginBottom: "20px" }} />}
                    </div>
                  ))}
                </div>
              </div>

              {triageStep === 1 && (
                <div className="form-card">
                  <h2 className="text-base font-semibold text-gray-900 mb-1">Localizar ou Cadastrar Paciente</h2>
                  <p className="text-xs text-gray-400 mb-5">Busque pelo código clínico ou nome do paciente</p>

                  <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "10px", marginBottom: "16px", gap: "4px" }}>
                    <button onClick={() => setSearchMode("CODE")} className={`search-tab ${searchMode === "CODE" ? "active" : "inactive"}`}>Por Código</button>
                    <button onClick={() => setSearchMode("NAME")} className={`search-tab ${searchMode === "NAME" ? "active" : "inactive"}`}>Por Nome</button>
                  </div>

                  {searchMode === "CODE" ? (
                    <div className="mb-4">
                      <label className="triage-label">Código Clínico</label>
                      <div style={{ position: "relative" }}>
                        <input className="triage-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: P0001" style={{ paddingRight: "40px" }} onKeyDown={(e) => e.key === "Enter" && searchPatient()} />
                        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="triage-label">Nome do Paciente</label>
                      <div style={{ position: "relative" }}>
                        <input className="triage-input" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="Ex: João" style={{ paddingRight: "40px" }} onKeyDown={(e) => e.key === "Enter" && searchPatient()} />
                        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
                      </div>
                    </div>
                  )}

                  <button onClick={searchPatient} disabled={searchLoading} className="btn-primary" style={{ marginBottom: "16px" }}>{searchLoading ? "Buscando..." : "Buscar Paciente"}</button>

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

                  {patient && (
                    <div className="patient-confirmed" style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>{patient.full_name}</div>
                          <div style={{ fontSize: "12px", color: "#0c3a24", fontWeight: "500", marginTop: "2px" }}>{patient.clinical_code}</div>
                        </div>
                        <span style={{ background: "#165034", color: "white", fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px" }}>Encontrado</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#4b5563", marginBottom: "12px" }}>
                        <div>Idade: <strong>{patientAgeYears != null ? `${patientAgeYears} anos` : "-"}</strong></div>
                        <div>Sexo: <strong>{patient.sex}</strong></div>
                        <div>Nasc.: <strong>{patient.birth_date}</strong></div>
                        {latestRecordedWeight != null && <div>Último peso: <strong>{latestRecordedWeight} kg</strong></div>}
                        <div style={{ gridColumn: "1/-1" }}>Responsável: <strong>{patient.guardian_name}</strong></div>
                      </div>
                      <button onClick={createVisit} disabled={creatingVisit || !!visit} className="btn-primary" style={{ fontSize: "13px", padding: "9px 16px", borderRadius: "8px" }}>
                        {visit ? `✓ Visita #${visit.id} Criada` : creatingVisit ? "Criando..." : "Registrar Chegada"}
                      </button>
                    </div>
                  )}

                  <hr className="section-divider" />
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cadastrar Novo Paciente</div>

                  <form onSubmit={createPatient} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div><label className="triage-label">Código Clínico</label><input className="triage-input" value={pClinicalCode} onChange={(e) => setPClinicalCode(e.target.value)} placeholder="P0002" required /></div>
                    <div><label className="triage-label">Nome Completo</label><input className="triage-input" value={pFullName} onChange={(e) => setPFullName(e.target.value)} placeholder="João Pedro" required /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div><label className="triage-label">Sexo</label><select className="triage-input" value={pSex} onChange={(e) => setPSex(e.target.value)}><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
                      <div><label className="triage-label">Data de Nascimento</label><input type="date" className="triage-input" value={pBirthDate} onChange={(e) => setPBirthDate(e.target.value)} required /></div>
                    </div>
                    <div><label className="triage-label">Responsável</label><input className="triage-input" value={pGuardianName} onChange={(e) => setPGuardianName(e.target.value)} required /></div>
                    <div><label className="triage-label">Telefone do Responsável</label><input className="triage-input" value={pGuardianPhone} onChange={(e) => setPGuardianPhone(e.target.value)} placeholder="84 XXX XXXX" required /></div>
                    <button disabled={creatingPatient} className="btn-secondary">{creatingPatient ? "Cadastrando..." : "Cadastrar Paciente"}</button>
                  </form>

                  <div className="step-nav">
                    <button onClick={() => setTriageStep(2)} disabled={!patient || !visit} className="btn-primary">Próximo: Avaliação →</button>
                  </div>
                </div>
              )}

              {triageStep === 2 && (
                <div className="form-card">
                  {patient && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#e7f1ec", borderRadius: "10px", marginBottom: "20px" }}>
                      <div className="doc-avatar" style={{ width: "30px", height: "30px", fontSize: "12px" }}>{(patient.full_name || "P")[0]}</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{patient.full_name}</div>
                        <div style={{ fontSize: "11px", color: "#0c3a24" }}>{patient.clinical_code} · Visita #{visit?.id}</div>
                      </div>
                    </div>
                  )}

                  <h2 className="text-base font-semibold text-gray-900 mb-1">Avaliação Clínica</h2>
                  <p className="text-xs text-gray-400 mb-5">Registe os sinais vitais e a queixa principal</p>

                  <form onSubmit={(e) => { e.preventDefault(); setTriageStep(3); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <div className="triage-label" style={{ marginBottom: "10px", color: "#0c3a24", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>Sinais Vitais</div>
                      <div className="vital-group">
                        <div><label className="triage-label">Temperatura (°C)</label><div className="triage-hint">Febre ou hipotermia</div><input className="triage-input" value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="38.2" /></div>
                        <div><label className="triage-label">SpO2 (%)</label><div className="triage-hint">Saturação de oxigênio</div><input className="triage-input" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="96" /></div>
                        <div><label className="triage-label">Freq. Cardíaca (bpm)</label><div className="triage-hint">Batimentos por minuto</div><input className="triage-input" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="120" /></div>
                        <div><label className="triage-label">Freq. Respiratória (rpm)</label><div className="triage-hint">Respirações por minuto</div><input className="triage-input" value={respRate} onChange={(e) => setRespRate(e.target.value)} placeholder="30" /></div>
                      </div>
                    </div>

                    <div><label className="triage-label">Peso (kg)</label><div className="triage-hint">Para cálculo de dose e avaliação clínica</div><input className="triage-input" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="14.5" style={{ maxWidth: "200px" }} /></div>

                    <hr className="section-divider" style={{ margin: "4px 0" }} />

                    <div>
                      <label className="triage-label">Queixa Principal *</label>
                      <div className="triage-hint">Descreva o motivo principal da visita</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                        {["Febre", "Tosse", "Dificuldade respiratória", "Dor abdominal", "Vómitos", "Diarreia"].map(c => (
                          <button key={c} type="button" onClick={() => setChiefComplaint(prev => prev ? `${prev}, ${c}` : c)} className={`chip ${chiefComplaint.includes(c) ? "chip-selected" : ""}`}>{c}</button>
                        ))}
                      </div>
                      <textarea className="triage-input" rows="3" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} placeholder="Descreva em detalhes..." style={{ resize: "none" }} required />
                    </div>

                    <div><label className="triage-label">Notas Clínicas <span style={{ color: "#9ca3af", fontWeight: "400" }}>(opcional)</span></label><textarea className="triage-input" rows="2" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} placeholder="Observações adicionais..." style={{ resize: "none" }} /></div>

                    <div className="step-nav">
                      <button type="button" onClick={() => setTriageStep(1)} className="btn-ghost" style={{ width: "auto", padding: "10px 20px" }}>← Voltar</button>
                      <button type="submit" disabled={!chiefComplaint.trim()} className="btn-primary">Próximo: Prioridade →</button>
                    </div>
                  </form>
                </div>
              )}

              {triageStep === 3 && (
                <div className="form-card">
                  {patient && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#e7f1ec", borderRadius: "10px", marginBottom: "20px" }}>
                      <div className="doc-avatar" style={{ width: "30px", height: "30px", fontSize: "12px" }}>{(patient.full_name || "P")[0]}</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{patient.full_name}</div>
                        <div style={{ fontSize: "11px", color: "#0c3a24" }}>{patient.clinical_code} · Visita #{visit?.id}</div>
                      </div>
                    </div>
                  )}

                  <h2 className="text-base font-semibold text-gray-900 mb-1">Classificação e Atribuição</h2>
                  <p className="text-xs text-gray-400 mb-6">Defina prioridade, sala e fluxo de encaminhamento</p>

                  <div style={{ marginBottom: "20px" }}>
                    <label className="triage-label" style={{ marginBottom: "10px" }}>Prioridade da Triagem</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {PRIORITIES.map((p) => {
                        const isSelected = priority === p.value;
                        const selClass = isSelected ? (p.value === "URGENT" ? "selected-urgent" : p.value === "LESS_URGENT" ? "selected-less" : "selected-non") : "";
                        const radioClass = isSelected ? (p.value === "URGENT" ? "checked-urgent" : p.value === "LESS_URGENT" ? "checked-less" : "checked-non") : "";
                        return (
                          <div key={p.value} className={`priority-card ${selClass}`} onClick={() => setPriority(p.value)}>
                            <div className={`priority-radio ${radioClass}`}>{isSelected && <div className="priority-radio-dot" />}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: "600", fontSize: "13px", color: isSelected ? p.color : "#374151" }}>{p.label}</div>
                              <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>Espera máxima: {p.maxWait} minutos</div>
                            </div>
                            {isSelected && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label className="triage-label">Espera Máxima Personalizada (min) <span style={{ color: "#9ca3af", fontWeight: "400" }}>(opcional)</span></label>
                    <input className="triage-input" value={customMaxWait} onChange={(e) => setCustomMaxWait(e.target.value)} placeholder={`Padrão: ${selectedPriority?.maxWait ?? ""} min`} style={{ maxWidth: "200px" }} />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <button type="button" onClick={askAI} disabled={aiLoading} className="btn-secondary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z"/><path d="M12 8v4l3 3"/></svg>
                      {aiLoading ? "IA Analisando..." : "Sugestão por IA"}
                    </button>
                    {aiSuggestion && (
                      <div className="ai-card" style={{ marginTop: "10px" }}>
                        <div className="ai-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/></svg>Sugestão IA</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>{priorityLabel(aiSuggestion.suggested_priority)}</div>
                            <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "2px", wordBreak: "break-word" }}>Motivo: {aiShortReason || "Sem motivo detalhado"}</div>
                          </div>
                          <button type="button" onClick={() => setPriority(aiSuggestion.suggested_priority)} disabled={priority === aiSuggestion.suggested_priority} className="btn-primary" style={{ width: "auto", padding: "8px 14px", fontSize: "12px", flexShrink: 0 }}>
                            {priority === aiSuggestion.suggested_priority ? "✓ Aplicada" : "Aplicar prioridade"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "18px", padding: "12px 14px", borderRadius: "10px", border: "1px solid #dcebe2", background: "#f8fafc" }}>
                    <label className="triage-label" style={{ marginBottom: "8px" }}>Sala Recomendada</label>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                      {recommendedRoomLabel || (bypassToER ? "Sala de Reanimação / ER" : "Sem sala disponível no momento")}
                    </div>
                    {!bypassToER && (
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                        Baseado na prioridade atual: {priorityLabel(priority)}
                      </div>
                    )}
                    {!hasRoomAvailable && !bypassToER && (
                      <div style={{ marginTop: "6px", fontSize: "11px", fontWeight: "700", color: "#b45309" }}>
                        Nenhuma sala disponível para esta prioridade agora.
                      </div>
                    )}
                  </div>

                  <hr className="section-divider" />

                  <div style={{ marginBottom: "20px" }}>
                    <label className="triage-label" style={{ marginBottom: "10px" }}>Atribuir Médico</label>
                    {availableDoctors.length === 0 ? (
                      <div style={{ padding: "16px", background: "#fafafa", border: "1.5px dashed #e5e7eb", borderRadius: "10px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>Nenhum médico disponível no momento</div>
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
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#165034", flexShrink: 0 }} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button onClick={assignDoctor} disabled={!visit?.id || !!visit?.doctor_id || assigning || !selectedDoctorId} className="btn-secondary" style={{ marginTop: "10px", fontSize: "13px" }}>
                      {visit?.doctor_id ? "✓ Médico já atribuído" : assigning ? "Atribuindo..." : "Confirmar Atribuição"}
                    </button>
                    {!hasDoctorAvailable && (
                      <div style={{ marginTop: "8px", fontSize: "11px", color: "#b45309", fontWeight: "700" }}>
                        Sem médico disponível agora. Pode manter em fila de espera.
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: "20px", display: "grid", gap: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#374151", fontWeight: "600", cursor: "pointer" }}>
                      <input type="checkbox" checked={holdInWaitingLine} onChange={(e) => setHoldInWaitingLine(e.target.checked)} />
                      Manter paciente na fila de espera quando não houver médico/sala disponível
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#374151", fontWeight: "600", cursor: "pointer" }}>
                      <input type="checkbox" checked={bypassToER} onChange={(e) => setBypassToER(e.target.checked)} />
                      Caso super severo: bypass imediato para Sala de Reanimação / ER
                    </label>
                    {bypassToER && (
                      <div style={{ fontSize: "11px", color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 10px", fontWeight: "700" }}>
                        Fluxo crítico ativo. O sistema regista bypass e não bloqueia por indisponibilidade de sala/médico.
                      </div>
                    )}
                  </div>

                  <div className="step-nav">
                    <button type="button" onClick={() => setTriageStep(2)} className="btn-ghost" style={{ width: "auto", padding: "10px 20px" }}>← Voltar</button>
                    <button onClick={saveTriage} disabled={savingTriage || !visit?.id} className="btn-primary">{savingTriage ? "Salvando..." : "Concluir Triagem ✓"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PAST PATIENTS VIEW */}
          {activeView === "patients" && (
            <div className="dash-animate dash-animate-delay-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Pacientes Antigos</h1>
                  <p className="text-sm text-gray-500">Histórico de visitas finalizadas</p>
                </div>
                <button onClick={loadPastVisits} disabled={loadingPastVisits} className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}>{loadingPastVisits ? "Atualizando..." : "Atualizar"}</button>
              </div>

              {loadingPastVisits && pastVisits.length === 0 ? (
                <div className="form-card" style={{ padding: "18px", display: "grid", gap: "10px" }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="skeleton-line" style={{ height: "18px", width: i % 2 === 0 ? "100%" : "85%" }} />
                  ))}
                </div>
              ) : pastVisits.length === 0 ? (
                <div className="form-card" style={{ textAlign: "center", padding: "60px 40px" }}>
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <p className="text-gray-500 font-medium">Nenhum histórico encontrado</p>
                </div>
              ) : (
                <div className="form-card" style={{ padding: 0, overflowX: "auto", overflowY: "hidden" }}>
                  <table className="w-full" style={{ minWidth: sidebarOpen ? "1360px" : "1480px" }}>
                    <thead style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                      <tr>
                        {["Visita", "Paciente", "Código", "Queixa Principal", "Resumo da Consulta", "Médico", "Estado Hospitalar", "Estado Vital", "Data", "PDF"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pastVisits.map((v, idx) => (
                        <tr key={v.id} onClick={() => openPastVisitModal(v)} style={{ borderBottom: "1px solid #f9f9f9", background: getPastVisitRowBg(idx), cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#edf5f0"; }} onMouseLeave={(e) => { e.currentTarget.style.background = getPastVisitRowBg(idx); }}>
                          <td style={{ padding: "12px 16px", fontSize: "13px", color: "#0c3a24", fontWeight: "600" }}>#{v.id}</td>
                          <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "600", color: "#111827" }}>{v.full_name}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#6b7280" }}>{v.clinical_code}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151", maxWidth: "220px" }}><div title={v.chief_complaint || v.triage_chief_complaint || "-"} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.chief_complaint || v.triage_chief_complaint || "-"}</div></td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151", maxWidth: "280px" }}><div title={v.likely_diagnosis || "-"} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>{v.likely_diagnosis || "-"}</div><div title={v.clinical_reasoning || v.prescription_text || "-"} style={{ marginTop: "2px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.clinical_reasoning || v.prescription_text || "-"}</div></td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{(v.doctor_full_name || v.doctor_username || "-") + (v.doctor_specialization ? ` (${v.doctor_specialization})` : "")}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151", fontWeight: 600 }}>{inferHospitalStatus(v)}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: inferVitalStatus(v) === "Óbito" ? "#b91c1c" : "#166534", fontWeight: 700 }}>{inferVitalStatus(v)}</td>
                          <td style={{ padding: "12px 16px", fontSize: "12px", color: "#6b7280" }}>{v.consultation_ended_at ? new Date(v.consultation_ended_at).toLocaleString() : v.arrival_time ? new Date(v.arrival_time).toLocaleString() : "-"}</td>
                          <td style={{ padding: "12px 16px" }}><button type="button" className="btn-secondary" style={{ width: "auto", padding: "7px 10px", fontSize: "12px" }} disabled={pdfLoadingId === v.id} onClick={(e) => { e.stopPropagation(); downloadVisitPdf(v); }}>{pdfLoadingId === v.id ? "Gerando..." : "Baixar PDF"}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ROOMS AVAILABILITY VIEW */}
          {activeView === "roomsAvailable" && (
            <div className="dash-animate dash-animate-delay-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Quartos Disponíveis</h1>
                  <p className="text-sm text-gray-500">Capacidade por tipo de sala e respetivo estado atual</p>
                </div>
                <button onClick={loadQueue} disabled={loadingQueue} className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}>{loadingQueue ? "Atualizando..." : "Atualizar"}</button>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                {loadingQueue && queue.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={`room-skeleton-${i}`} className="form-card" style={{ padding: "18px", display: "grid", gap: "10px" }}>
                      <div className="skeleton-line" style={{ height: "20px", width: "40%" }} />
                      <div className="skeleton-line" style={{ height: "14px", width: "55%" }} />
                      <div className="skeleton-line" style={{ height: "14px", width: "100%" }} />
                      <div className="skeleton-line" style={{ height: "14px", width: "92%" }} />
                    </div>
                  ))
                ) : roomInventory.map((type) => (
                  <div key={type.key} className="form-card" style={{ padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>{type.title}</h2>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                          {type.available} disponível(is) de {type.total}
                        </div>
                      </div>
                      <span style={{ borderRadius: "999px", padding: "5px 10px", fontSize: "11px", fontWeight: "700", background: type.available > 0 ? "#edf5f0" : "#fef2f2", color: type.available > 0 ? "#165034" : "#ef4444" }}>
                        {type.available > 0 ? "Com vaga" : "Sem vaga"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>Casos indicados</div>
                        <ul style={{ margin: 0, paddingLeft: "16px", color: "#4b5563", fontSize: "12px", lineHeight: 1.45 }}>
                          {type.indications.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>Características</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {type.features.map((f) => (
                            <span key={f} style={{ fontSize: "11px", border: "1px solid #dcebe2", color: "#165034", background: "#edf5f0", borderRadius: "999px", padding: "4px 8px", fontWeight: "600" }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "8px" }}>
                      {type.rooms.map((room) => (
                        <div key={room.label} style={{ border: `1px solid ${room.status === "available" ? "#bbf7d0" : "#fecaca"}`, background: room.status === "available" ? "#f0fdf4" : "#fff1f2", borderRadius: "10px", padding: "8px 10px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#111827" }}>{room.label}</div>
                          <div style={{ fontSize: "11px", color: room.status === "available" ? "#166534" : "#b91c1c", marginTop: "2px" }}>
                            {room.status === "available" ? "Disponível" : "Ocupado"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCTOR AVAILABILITY VIEW */}
          {activeView === "doctors" && (
            <div className="dash-animate dash-animate-delay-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">Disponibilidade de Médicos</h1>
                  <p className="text-sm text-gray-500">{doctors.length} médico(s) registados</p>
                </div>
                <button onClick={() => loadDoctors()} disabled={loadingDoctors} className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}>{loadingDoctors ? "Atualizando..." : "Atualizar"}</button>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {loadingDoctors && doctors.length === 0 ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={`doc-skeleton-${i}`} className="form-card" style={{ display: "grid", gap: "10px" }}>
                      <div className="skeleton-line" style={{ height: "18px", width: "55%" }} />
                      <div className="skeleton-line" style={{ height: "14px", width: "100%" }} />
                      <div className="skeleton-line" style={{ height: "14px", width: "92%" }} />
                      <div className="skeleton-line" style={{ height: "14px", width: "88%" }} />
                    </div>
                  ))
                ) : [{ title: "Disponíveis", list: availableDoctors, color: "#165034", bg: "#edf5f0" }, { title: "Ocupados", list: busyDoctors, color: "#ef4444", bg: "#fef2f2" }].map(({ title, list, color, bg }) => (
                  <div key={title} className="form-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
                      <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>{title} ({list.length})</h2>
                    </div>
                    {list.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>Nenhum médico {title.toLowerCase()}</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {list.map((d) => {
                          const activeVisit = d.current_visit_id ? patientByVisitId.get(Number(d.current_visit_id)) : null;
                          return (
                            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: bg, borderRadius: "10px", border: `1px solid ${color}20` }}>
                              <div className="doc-avatar" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>{(d.full_name || d.username || "M")[0]}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{d.full_name || d.username || `Médico #${d.id}`}</div>
                                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>{d.specialization || "Clínica Geral"}</div>
                                {d.current_visit_id && (
                                  <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                    Consulta #{d.current_visit_id}
                                    {activeVisit ? ` · Paciente: ${activeVisit.full_name} (${activeVisit.clinical_code})` : ""}
                                  </div>
                                )}
                              </div>
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUEUE VIEW */}
          {(activeView === "queue" || activeView === "patientsInTriage") && (
            <div className="dash-animate dash-animate-delay-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{activeView === "patientsInTriage" ? "Pacientes em Triagem" : "Fila de Espera"}</h1>
                  <p className="text-sm text-gray-500">{activeView === "patientsInTriage" ? `${inTriageCount} paciente(s) em triagem` : `${queue.length} paciente(s) na fila`}</p>
                </div>
                <button onClick={loadQueue} disabled={loadingQueue} className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}>{loadingQueue ? "Atualizando..." : "Atualizar"}</button>
              </div>

              {loadingQueue && queue.length === 0 ? (
                <div className="form-card" style={{ padding: "18px", display: "grid", gap: "10px" }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`queue-skeleton-${i}`} className="skeleton-line" style={{ height: "16px", width: i % 3 === 0 ? "100%" : "93%" }} />
                  ))}
                </div>
              ) : queue.length === 0 ? (
                <div className="form-card" style={{ textAlign: "center", padding: "60px 40px" }}>
                  <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" strokeWidth="1"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  <p className="text-gray-500 font-medium">Fila vazia</p>
                </div>
              ) : (
                <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="w-full">
                    <thead style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                      <tr>{["ID", "Paciente", "Prioridade", "Status", "Espera", "Alerta", "Médico"].map((h) => (<th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>))}</tr>
                    </thead>
                    <tbody>
                      {urgentQueue.length > 0 && <tr><td colSpan="7" style={{ padding: "8px 16px", fontSize: "11px", fontWeight: "700", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", background: "#fff5f5" }}>Prioridade Urgente</td></tr>}
                      {urgentQueue.map((v, idx) => {
                        const wait = v.wait_minutes ?? null;
                        const isCritical = wait != null && wait >= 180;
                        const rowBg = getQueueRowBg(idx, { urgent: true, isCritical });
                        return (
                          <tr key={v.id} onClick={() => openPatientEditModal(v)} style={{ borderBottom: "1px solid #f9f9f9", background: rowBg, cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#edf5f0"; }} onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#ef4444", fontWeight: "600" }}>#{v.id}</td>
                            <td style={{ padding: "12px 16px" }}><div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{v.full_name}</div><div style={{ fontSize: "11px", color: "#9ca3af" }}>{v.clinical_code}</div></td>
                            <td style={{ padding: "12px 16px" }}><span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px", background: "#fef2f2", color: "#ef4444" }}>{PRIORITIES.find(p => p.value === v.priority)?.label || v.priority}</span></td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{statusLabel(v.status)}</td>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#111827", fontWeight: "600" }}>{wait != null ? `${wait}min` : "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{isCritical && <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px", background: "#ef4444", color: "white" }}>Crítico</span>}</td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{v.doctor_full_name || v.doctor_username || "-"}</td>
                          </tr>
                        );
                      })}
                      {nonUrgentQueue.length > 0 && <tr><td colSpan="7" style={{ padding: "8px 16px", fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", background: "#fafafa" }}>Outras Prioridades</td></tr>}
                      {nonUrgentQueue.map((v, idx) => {
                        const wait = v.wait_minutes ?? null;
                        const isCritical = wait != null && wait >= 180;
                        const pCfg = PRIORITIES.find(p => p.value === v.priority);
                        const rowBg = getQueueRowBg(idx, { urgent: false, isCritical });
                        return (
                          <tr key={v.id} onClick={() => openPatientEditModal(v)} style={{ borderBottom: "1px solid #f9f9f9", background: rowBg, cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#edf5f0"; }} onMouseLeave={(e) => { e.currentTarget.style.background = rowBg; }}>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#0c3a24", fontWeight: "600" }}>#{v.id}</td>
                            <td style={{ padding: "12px 16px" }}><div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{v.full_name}</div><div style={{ fontSize: "11px", color: "#9ca3af" }}>{v.clinical_code}</div></td>
                            <td style={{ padding: "12px 16px" }}><span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px", background: pCfg?.bg || "#f3f4f6", color: pCfg?.color || "#374151" }}>{pCfg?.label || v.priority}</span></td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{statusLabel(v.status)}</td>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#111827", fontWeight: "600" }}>{wait != null ? `${wait}min` : "-"}</td>
                            <td style={{ padding: "12px 16px" }}>{isCritical && <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px", background: "#ef4444", color: "white" }}>Crítico</span>}</td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>{v.doctor_full_name || v.doctor_username || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Popups */}
      {popup.open && (
        <div className="popup-overlay">
          <div className="popup-card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div className={`popup-icon ${popup.type === "success" ? "popup-icon-success" : "popup-icon-warning"}`}>
                {popup.type === "success" ? (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>) : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>{popup.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#4b5563", lineHeight: 1.45 }}>{popup.message}</p>
              </div>
            </div>
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={closePopup} className="btn-primary" style={{ width: "auto", padding: "10px 18px" }}>Entendi</button>
            </div>
          </div>
        </div>
      )}

      {confirmPopup.open && (
        <div className="popup-overlay">
          <div className="popup-card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div className="popup-icon popup-icon-warning">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>{confirmPopup.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#4b5563", lineHeight: 1.45 }}>{confirmPopup.message}</p>
              </div>
            </div>
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button type="button" onClick={closeConfirmPopup} className="btn-secondary" style={{ width: "auto", padding: "10px 16px" }} disabled={confirmPopup.busy}>
                Cancelar
              </button>
              <button type="button" onClick={confirmPopupAction} className="btn-primary" style={{ width: "auto", padding: "10px 16px" }} disabled={confirmPopup.busy}>
                {confirmPopup.busy ? "A processar..." : confirmPopup.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {pastVisitModal.open && pastVisitModal.visit && (
        <div className="popup-overlay">
          <div className="popup-card" style={{ maxWidth: "760px", width: "95%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>Consulta #{pastVisitModal.visit.id}</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={startPastVisitPatientEdit} className="btn-secondary" style={{ width: "auto", padding: "8px 12px" }}>Editar Paciente</button>
                <button type="button" disabled={pdfLoadingId === pastVisitModal.visit.id} onClick={() => downloadVisitPdf(pastVisitModal.visit)} className="btn-primary" style={{ width: "auto", padding: "8px 12px" }}>{pdfLoadingId === pastVisitModal.visit.id ? "Gerando..." : "Baixar PDF"}</button>
                <button type="button" onClick={closePastVisitModal} className="btn-secondary" style={{ width: "auto", padding: "8px 12px" }}>Fechar</button>
              </div>
            </div>
            <div style={{ overflowY: "auto", paddingRight: "2px", flex: 1 }}>
              {pastVisitModal.patientLoading && pastVisitModal.editingPatient && (
                <div className="form-card" style={{ margin: "0 0 10px 0", padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                  Carregando dados do paciente...
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>Paciente</div>
                  {pastVisitModal.editingPatient && !pastVisitModal.patientLoading ? (
                    <div style={{ display: "grid", gap: "8px", marginTop: "6px" }}>
                      <input className="triage-input" value={pastVisitModal.patientForm.full_name} onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, full_name: e.target.value } }))} />
                      <input className="triage-input" value={pastVisitModal.patientForm.clinical_code} onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, clinical_code: e.target.value } }))} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <select className="triage-input" value={pastVisitModal.patientForm.sex} onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, sex: e.target.value } }))}><option value="M">Masculino</option><option value="F">Feminino</option></select>
                        <input type="date" className="triage-input" value={pastVisitModal.patientForm.birth_date} onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, birth_date: e.target.value } }))} />
                      </div>
                      <input className="triage-input" value={pastVisitModal.patientForm.guardian_name} onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, guardian_name: e.target.value } }))} placeholder="Responsável" />
                      <input className="triage-input" value={pastVisitModal.patientForm.guardian_phone} onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, guardian_phone: e.target.value } }))} placeholder="Telefone do responsável" />
                    </div>
                  ) : (
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{pastVisitModal.visit.full_name || "-"}</div>
                  )}
                </div>
                <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>Médico</div>
                  {pastVisitModal.editingPatient && !pastVisitModal.patientLoading ? (
                    <select
                      className="triage-input"
                      value={pastVisitModal.patientForm.doctor_id}
                      onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, doctor_id: e.target.value } }))}
                    >
                      <option value="">Sem médico</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {(d.full_name || d.username || `Médico #${d.id}`) + (d.specialization ? ` (${d.specialization})` : "")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{(pastVisitModal.visit.doctor_full_name || pastVisitModal.visit.doctor_username || "-") + (pastVisitModal.visit.doctor_specialization ? ` (${pastVisitModal.visit.doctor_specialization})` : "")}</div>
                  )}
                </div>
                <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>Estado Hospitalar</div>
                  {pastVisitModal.editingPatient && !pastVisitModal.patientLoading ? (
                    <select
                      className="triage-input"
                      value={pastVisitModal.patientForm.hospital_status}
                      onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, hospital_status: e.target.value } }))}
                    >
                      <option value="">Sem registo</option>
                      <option value="DISCHARGED">Alta</option>
                      <option value="IN_HOSPITAL">Internado</option>
                      <option value="BED_REST">Repouso / Acamado</option>
                      <option value="TRANSFERRED">Transferido</option>
                      <option value="DECEASED">Óbito</option>
                    </select>
                  ) : (
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{inferHospitalStatus(pastVisitModal.visit)}</div>
                  )}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>Queixa Principal</div>
                  {pastVisitModal.editingPatient && !pastVisitModal.patientLoading ? (
                    <textarea
                      className="triage-input"
                      rows="3"
                      value={pastVisitModal.patientForm.chief_complaint}
                      onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, chief_complaint: e.target.value } }))}
                      style={{ resize: "none" }}
                    />
                  ) : (
                    <div style={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>{pastVisitModal.visit.chief_complaint || pastVisitModal.visit.triage_chief_complaint || "-"}</div>
                  )}
                </div>
                <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>Diagnóstico</div>
                  {pastVisitModal.editingPatient && !pastVisitModal.patientLoading ? (
                    <textarea
                      className="triage-input"
                      rows="3"
                      value={pastVisitModal.patientForm.likely_diagnosis}
                      onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, likely_diagnosis: e.target.value } }))}
                      style={{ resize: "none" }}
                    />
                  ) : (
                    <div style={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>{pastVisitModal.visit.likely_diagnosis || "-"}</div>
                  )}
                </div>
                <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>Justificativa Clínica</div>
                  {pastVisitModal.editingPatient && !pastVisitModal.patientLoading ? (
                    <textarea
                      className="triage-input"
                      rows="4"
                      value={pastVisitModal.patientForm.clinical_reasoning}
                      onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, clinical_reasoning: e.target.value } }))}
                      style={{ resize: "none" }}
                    />
                  ) : (
                    <div style={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>{pastVisitModal.visit.clinical_reasoning || "-"}</div>
                  )}
                </div>
                <div className="form-card" style={{ margin: 0, padding: "10px 12px" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>Prescrição</div>
                  {pastVisitModal.editingPatient && !pastVisitModal.patientLoading ? (
                    <textarea
                      className="triage-input"
                      rows="4"
                      value={pastVisitModal.patientForm.prescription_text}
                      onChange={(e) => setPastVisitModal((prev) => ({ ...prev, patientForm: { ...prev.patientForm, prescription_text: e.target.value } }))}
                      style={{ resize: "none" }}
                    />
                  ) : (
                    <div style={{ fontSize: "13px", color: "#111827", whiteSpace: "pre-wrap" }}>{pastVisitModal.visit.prescription_text || "-"}</div>
                  )}
                </div>
              </div>
              {pastVisitModal.editingPatient && !pastVisitModal.patientLoading && (
                <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button type="button" className="btn-secondary" style={{ width: "auto", padding: "8px 12px" }} onClick={() => setPastVisitModal((prev) => ({ ...prev, editingPatient: false }))}>Cancelar</button>
                  <button type="button" className="btn-primary" style={{ width: "auto", padding: "8px 12px" }} disabled={pastVisitModal.patientSaving} onClick={savePastVisitPatientEdit}>{pastVisitModal.patientSaving ? "Salvando..." : "Salvar Paciente"}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {patientEditModal.open && (
        <div className="popup-overlay">
          <div className="popup-card" style={{ maxWidth: "760px", width: "95%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                Editar Paciente {patientEditModal.visitId ? `(Visita #${patientEditModal.visitId})` : ""}
              </h3>
              <button type="button" onClick={closePatientEditModal} className="btn-secondary" style={{ width: "auto", padding: "8px 12px" }}>Fechar</button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <button type="button" className={patientEditModal.page === "patient" ? "btn-primary" : "btn-secondary"} style={{ width: "auto", padding: "8px 12px" }} onClick={() => setPatientEditModal((prev) => ({ ...prev, page: "patient" }))}>Dados do Paciente</button>
              <button type="button" className={patientEditModal.page === "triage" ? "btn-primary" : "btn-secondary"} style={{ width: "auto", padding: "8px 12px" }} onClick={() => setPatientEditModal((prev) => ({ ...prev, page: "triage" }))}>Dados da Triagem</button>
            </div>
            <div style={{ overflowY: "auto", paddingRight: "2px", flex: 1 }}>

            {patientEditModal.page === "patient" && patientEditModal.loading ? (
              <div className="form-card" style={{ margin: 0, padding: "22px", textAlign: "center", color: "#6b7280" }}>
                Carregando dados do paciente...
              </div>
            ) : patientEditModal.page === "patient" ? (
              <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="triage-label">Código Clínico</label>
                  <input
                    className="triage-input"
                    value={patientEditModal.clinical_code}
                    onChange={(e) => setPatientEditModal((prev) => ({ ...prev, clinical_code: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="triage-label">Nome Completo</label>
                  <input
                    className="triage-input"
                    value={patientEditModal.full_name}
                    onChange={(e) => setPatientEditModal((prev) => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="triage-label">Sexo</label>
                  <select
                    className="triage-input"
                    value={patientEditModal.sex}
                    onChange={(e) => setPatientEditModal((prev) => ({ ...prev, sex: e.target.value }))}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                <div>
                  <label className="triage-label">Data de Nascimento</label>
                  <input
                    type="date"
                    className="triage-input"
                    value={patientEditModal.birth_date}
                    onChange={(e) => setPatientEditModal((prev) => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="triage-label">Responsável</label>
                  <input
                    className="triage-input"
                    value={patientEditModal.guardian_name}
                    onChange={(e) => setPatientEditModal((prev) => ({ ...prev, guardian_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="triage-label">Telefone do Responsável</label>
                  <input
                    className="triage-input"
                    value={patientEditModal.guardian_phone}
                    onChange={(e) => setPatientEditModal((prev) => ({ ...prev, guardian_phone: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ marginTop: "14px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={closePatientEditModal} className="btn-secondary" style={{ width: "auto", padding: "10px 16px" }}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={savePatientEdit}
                  disabled={patientEditModal.loading || patientEditModal.saving}
                  className="btn-primary"
                  style={{ width: "auto", padding: "10px 16px" }}
                >
                  {patientEditModal.saving ? "Salvando..." : "Salvar Paciente"}
                </button>
              </div>
              </div>
            ) : patientEditModal.triageLoading ? (
              <div className="form-card" style={{ margin: 0, padding: "22px", textAlign: "center", color: "#6b7280" }}>
                Carregando dados da triagem...
              </div>
            ) : (
              <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div><label className="triage-label">Temperatura (°C)</label><input className="triage-input" value={patientEditModal.triage_temperature} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_temperature: e.target.value }))} /></div>
                <div><label className="triage-label">SpO2 (%)</label><input className="triage-input" value={patientEditModal.triage_oxygen_saturation} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_oxygen_saturation: e.target.value }))} /></div>
                <div><label className="triage-label">Freq. Cardíaca (bpm)</label><input className="triage-input" value={patientEditModal.triage_heart_rate} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_heart_rate: e.target.value }))} /></div>
                <div><label className="triage-label">Freq. Respiratória (rpm)</label><input className="triage-input" value={patientEditModal.triage_respiratory_rate} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_respiratory_rate: e.target.value }))} /></div>
                <div><label className="triage-label">Peso (kg)</label><input className="triage-input" value={patientEditModal.triage_weight} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_weight: e.target.value }))} /></div>
                <div><label className="triage-label">Prioridade</label><select className="triage-input" value={patientEditModal.triage_priority} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_priority: e.target.value }))}>{PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                <div><label className="triage-label">Espera Máx. (min)</label><input className="triage-input" value={patientEditModal.triage_max_wait_minutes} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_max_wait_minutes: e.target.value }))} placeholder={`${PRIORITIES.find((p) => p.value === patientEditModal.triage_priority)?.maxWait ?? ""}`} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label className="triage-label">Queixa Principal *</label><textarea className="triage-input" rows="3" value={patientEditModal.triage_chief_complaint} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_chief_complaint: e.target.value }))} style={{ resize: "none" }} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label className="triage-label">Notas Clínicas</label><textarea className="triage-input" rows="3" value={patientEditModal.triage_clinical_notes} onChange={(e) => setPatientEditModal((prev) => ({ ...prev, triage_clinical_notes: e.target.value }))} style={{ resize: "none" }} /></div>
              </div>
              <div style={{ marginTop: "14px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={closePatientEditModal} className="btn-secondary" style={{ width: "auto", padding: "10px 16px" }}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveQueueTriageEdit}
                  disabled={patientEditModal.triageLoading || patientEditModal.triageSaving}
                  className="btn-primary"
                  style={{ width: "auto", padding: "10px 16px" }}
                >
                  {patientEditModal.triageSaving ? "Salvando..." : "Salvar Triagem"}
                </button>
              </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}




