export const NURSE_VIEW_ROUTES = {
  home: "/triage/dashboard",
  newTriage: "/triage/new-triage",
  queue: "/triage/queue",
  patientsInTriage: "/triage/patients-in-triage",
  quickSearch: "/triage/quick-search",
  roomsAvailable: "/triage/rooms-available",
  destination: "/triage/destination",
  doctors: "/triage/doctors",
  patients: "/triage/patients",
  shiftReport: "/triage/shift-report",
  notifications: "/triage/notifications",
  preferences: "/triage/preferences",
};

export const PRIORITIES = [
  {
    value: "URGENT",
    label: "Urgente",
    maxWait: 60,
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fca5a5",
  },
  {
    value: "LESS_URGENT",
    label: "Pouco Urgente",
    maxWait: 120,
    color: "#f97316",
    bg: "#fff7ed",
    border: "#fdba74",
  },
  {
    value: "NON_URGENT",
    label: "Não Urgente",
    maxWait: 240,
    color: "#165034",
    bg: "#edf5f0",
    border: "#2d6f4e",
  },
];

export const GENERAL_STATE_OPTIONS = [
  { value: "ACTIVE_NORMAL", label: "Ativo / Normal", hint: "Anda, senta, brinca normalmente" },
  {
    value: "LETHARGIC_PREFERS_LYING",
    label: "Prefere ficar deitado / Letárgico",
    hint: "Cansado, mas responde",
  },
  {
    value: "IMMOBILIZED_BEDBOUND",
    label: "Precisa de estar deitado / Imobilizado",
    hint: "Não consegue sentar, muito fraco",
  },
  {
    value: "UNCONSCIOUS_UNRESPONSIVE",
    label: "Inconsciente / Não responde / Postura anormal",
    hint: "Estado crítico neurológico",
  },
];

export const DEFAULT_PREFERENCES = {
  emergency_phone: "",
  font_size: "NORMAL",
  font_scale_percent: 100,
  notify_new_urgent: true,
  notify_wait_over_30: true,
  notify_critical_alerts: true,
  notify_shift_ending: true,
};

export const LOCAL_NOTIFICATION_READS_KEY = "triage-nurse-local-notification-reads";

export const loadLocalNotificationReadMap = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_NOTIFICATION_READS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveLocalNotificationReadMap = (value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_NOTIFICATION_READS_KEY, JSON.stringify(value || {}));
  } catch {
    // Ignore storage failures; notifications still work for the current session.
  }
};

export const buildLiveNurseNotifications = ({ queue, shiftStatus, nowTs, readMap }) => {
  const items = [];
  const now = Number.isFinite(Number(nowTs)) ? Number(nowTs) : Date.now();
  const activeStatuses = new Set(["WAITING", "IN_TRIAGE", "WAITING_DOCTOR"]);

  (Array.isArray(queue) ? queue : []).forEach((visit) => {
    const status = String(visit?.status || "").toUpperCase();
    if (!activeStatuses.has(status)) return;

    const waitMinutes = Number(visit?.wait_minutes);
    const hasWait = Number.isFinite(waitMinutes);
    const patientName = String(visit?.full_name || "Paciente");
    const priority = String(visit?.priority || "").toUpperCase();
    const arrivalTs = new Date(visit?.arrival_time || now).getTime();
    const safeArrivalTs = Number.isFinite(arrivalTs) ? arrivalTs : now;
    let notification = null;

    if (hasWait && waitMinutes >= 180) {
      notification = {
        id: `local:critical-wait:${visit.id}`,
        title: "Alerta crítico de espera",
        message: `${patientName} está em espera crítica (${waitMinutes} min) e precisa de reavaliação imediata.`,
        level: "CRITICAL",
        source: "TRIAGE",
        visit_id: visit?.id ?? null,
        created_at: new Date(safeArrivalTs + 180 * 60 * 1000).toISOString(),
      };
    } else if (hasWait && waitMinutes >= 30) {
      notification = {
        id: `local:wait-over-30:${visit.id}`,
        title: "Espera acima de 30 min",
        message: `${patientName} ultrapassou 30 min de espera (${waitMinutes} min). Verifique a fila.`,
        level: "WARNING",
        source: "TRIAGE",
        visit_id: visit?.id ?? null,
        created_at: new Date(safeArrivalTs + 30 * 60 * 1000).toISOString(),
      };
    } else if (priority === "URGENT") {
      notification = {
        id: `local:urgent-patient:${visit.id}`,
        title: "Novo paciente urgente na fila",
        message: `${patientName} está marcado como urgente e requer acompanhamento prioritário.`,
        level: "INFO",
        source: "TRIAGE",
        visit_id: visit?.id ?? null,
        created_at: new Date(safeArrivalTs).toISOString(),
      };
    }

    if (notification) {
      items.push({
        ...notification,
        read_at: readMap?.[notification.id] || null,
      });
    }
  });

  const shiftEndIso = shiftStatus?.extended_until || shiftStatus?.scheduled_end || null;
  const shiftEndTs = shiftEndIso ? new Date(shiftEndIso).getTime() : NaN;
  const shiftIsActive = Boolean(shiftStatus?.is_on_shift);
  if (shiftIsActive && Number.isFinite(shiftEndTs)) {
    const minutesLeft = Math.max(0, Math.floor((shiftEndTs - now) / 60000));
    if (minutesLeft <= 15) {
      const id = `local:shift-ending:${shiftEndIso}`;
      items.push({
        id,
        title: "Turno perto do fim",
        message: `O turno termina em ${minutesLeft} min. Organize a transição e os casos pendentes.`,
        level: "WARNING",
        source: "SHIFT",
        created_at: new Date(Math.max(now, shiftEndTs - 15 * 60 * 1000)).toISOString(),
        read_at: readMap?.[id] || null,
      });
    }
  }

  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const getShiftIcon = (shiftType) => {
  const type = String(shiftType || "").toUpperCase();
  const commonProps = {
    width: 15,
    height: 15,
    viewBox: "0 0 30 30",
    "aria-hidden": "true",
  };
  if (type === "MORNING" || type === "AFTERNOON") {
    return (
      <svg {...commonProps}>
        <path
          fill="#fbbf24"
          d="M 14.984375 0.98632812 A 1.0001 1.0001 0 0 0 14 2 L 14 5 A 1.0001 1.0001 0 1 0 16 5 L 16 2 A 1.0001 1.0001 0 0 0 14.984375 0.98632812 z M 5.796875 4.7988281 A 1.0001 1.0001 0 0 0 5.1015625 6.515625 L 7.2226562 8.6367188 A 1.0001 1.0001 0 1 0 8.6367188 7.2226562 L 6.515625 5.1015625 A 1.0001 1.0001 0 0 0 5.796875 4.7988281 z M 24.171875 4.7988281 A 1.0001 1.0001 0 0 0 23.484375 5.1015625 L 21.363281 7.2226562 A 1.0001 1.0001 0 1 0 22.777344 8.6367188 L 24.898438 6.515625 A 1.0001 1.0001 0 0 0 24.171875 4.7988281 z M 15 8 A 7 7 0 0 0 8 15 A 7 7 0 0 0 15 22 A 7 7 0 0 0 22 15 A 7 7 0 0 0 15 8 z M 2 14 A 1.0001 1.0001 0 1 0 2 16 L 5 16 A 1.0001 1.0001 0 1 0 5 14 L 2 14 z M 25 14 A 1.0001 1.0001 0 1 0 25 16 L 28 16 A 1.0001 1.0001 0 1 0 28 14 L 25 14 z M 7.9101562 21.060547 A 1.0001 1.0001 0 0 0 7.2226562 21.363281 L 5.1015625 23.484375 A 1.0001 1.0001 0 1 0 6.515625 24.898438 L 8.6367188 22.777344 A 1.0001 1.0001 0 0 0 7.9101562 21.060547 z M 22.060547 21.060547 A 1.0001 1.0001 0 0 0 21.363281 22.777344 L 23.484375 24.898438 A 1.0001 1.0001 0 1 0 24.898438 23.484375 L 22.777344 21.363281 A 1.0001 1.0001 0 0 0 22.060547 21.060547 z M 14.984375 23.986328 A 1.0001 1.0001 0 0 0 14 25 L 14 28 A 1.0001 1.0001 0 1 0 16 28 L 16 25 A 1.0001 1.0001 0 0 0 14.984375 23.986328 z"
        />
      </svg>
    );
  }
  if (type === "NIGHT") {
    return (
      <svg {...commonProps}>
        <path
          fill="#1e3a8a"
          d="M21.86 15.23A1 1 0 0 0 20.6 14a8 8 0 0 1-10.57-10.6A1 1 0 0 0 8.78 2.14a11 11 0 1 0 13.08 13.09Z"
        />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <path
        fill="currentColor"
        d="M15 7a1 1 0 0 0-1 1v7.59l-2.3 2.3a1 1 0 1 0 1.42 1.42l2.59-2.6A1 1 0 0 0 16 16V8a1 1 0 0 0-1-1Zm0-5a13 13 0 1 0 13 13A13 13 0 0 0 15 2Z"
      />
    </svg>
  );
};

export const shouldShowNotificationByPreferences = (notification, preferences) => {
  const prefs = { ...DEFAULT_PREFERENCES, ...(preferences || {}) };
  const text = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
  const source = String(notification?.source || "").toLowerCase();
  const level = String(notification?.level || "").toUpperCase();

  const isCriticalAlert =
    level === "CRITICAL" || /spo2|spo2|febre|39\.5|hcm|cr[ií]tic|reanima|er\b|emerg/i.test(text);
  if (isCriticalAlert) return !!prefs.notify_critical_alerts;

  const isWaitOver30 = /espera|wait/.test(text) && /(30|min|minutes|acima|over|>\s*30)/.test(text);
  if (isWaitOver30) return !!prefs.notify_wait_over_30;

  const isShiftEnding =
    /turno|shift/.test(text) && /(fim|ending|15|min|aproxim|encerrar)/.test(text);
  if (isShiftEnding) return !!prefs.notify_shift_ending;

  const isUrgentPatient =
    /urgent|urgente|p1|p2|prioridade alta/.test(text) || /triage|triagem/.test(source);
  if (isUrgentPatient) return !!prefs.notify_new_urgent;

  return true;
};

export const ROOM_TYPES = [
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

export const priorityLabel = (value) =>
  PRIORITIES.find((p) => p.value === value)?.label || "Não classificado";

export function normalizeDoctorsResponse(resp) {
  const raw = Array.isArray(resp)
    ? resp
    : resp && Array.isArray(resp.doctors)
      ? resp.doctors
      : resp && Array.isArray(resp.data)
        ? resp.data
        : [];
  return raw.map((d) => ({
    ...d,
    specialization: String(
      d?.specialization ?? d?.doctor_specialization ?? d?.especializacao ?? ""
    ).trim(),
  }));
}

export const statusLabel = (s) => {
  if (s === "WAITING") return "Aguardando Triagem";
  if (s === "IN_TRIAGE") return "Em Triagem";
  if (s === "WAITING_DOCTOR") return "Aguardando Médico";
  if (s === "IN_CONSULTATION") return "Em Consulta";
  if (s === "FINISHED") return "Finalizado";
  if (s === "CANCELLED") return "Cancelado";
  return s || "-";
};

export const statusLabelForVisit = (visit) => {
  const isLabFollowup = !!visit?.is_lab_followup;
  if (isLabFollowup) {
    return "Retorno Laboratorial";
  }
  const motive = String(visit?.visit_motive || "").toUpperCase();
  if (motive === "LAB_SAMPLE_COLLECTION" || motive === "LAB_RESULTS") return "Retorno Laboratorial";
  if (String(visit?.return_visit_reason || "").trim()) return "Retorno para Consulta";
  return statusLabel(visit?.status);
};

export const isLabOrReturnQueueRow = (visit) => {
  const motive = String(visit?.visit_motive || "").toUpperCase();
  if (visit?.is_lab_followup) return true;
  if (motive === "LAB_SAMPLE_COLLECTION" || motive === "LAB_RESULTS") return true;
  return !!String(visit?.return_visit_reason || "").trim();
};

export const getQueueActionMeta = (visit) => {
  const status = String(visit?.status || "").toUpperCase();
  const isLabOrReturn = isLabOrReturnQueueRow(visit);
  if (status === "IN_CONSULTATION") {
    return {
      disabled: true,
      label: isLabOrReturn ? "Em atendimento" : "Remover Triagem",
      title: "Paciente já está em consulta.",
    };
  }
  if (isLabOrReturn) {
    return {
      disabled: false,
      label: "Remover da Fila",
      title: "Remover retorno/exame da fila atual",
    };
  }
  return {
    disabled: false,
    label: "Remover Triagem",
    title: "Remover triagem",
  };
};

export const parseNumberish = (v) => {
  if (v === "" || v == null) return null;
  const normalized = String(v).trim().replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

export const isValidNumber = (v, { min = -Infinity, max = Infinity } = {}) => {
  const n = parseNumberish(v);
  if (n == null) return false;
  return Number.isFinite(n) && n >= min && n <= max;
};

export const calculateAgeYears = (birthDate) => {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return null;
  const now = new Date();
  const hadBirthdayThisYear = now >= new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  return Math.max(0, now.getFullYear() - bd.getFullYear() - (hadBirthdayThisYear ? 0 : 1));
};

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const formatRelativeUpdate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 1) return "Agora mesmo";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
};

export const inferHospitalStatus = (visit) => {
  const explicit = String(visit?.hospital_status || "")
    .trim()
    .toUpperCase();
  if (explicit === "IN_HOSPITAL") return "Internado";
  if (explicit === "BED_REST") return "Repouso / Acamado";
  if (explicit === "DISCHARGED") return "Alta";
  if (explicit === "TRANSFERRED") return "Transferido";
  if (explicit === "DECEASED") return "Óbito";

  const plan = String(visit?.disposition_plan || "")
    .trim()
    .toUpperCase();
  if (plan === "ADMIT_URGENT") return "Internado";
  if (plan === "BED_REST") return "Repouso / Acamado";
  if (plan === "HOME") return "Alta";
  if (plan === "RETURN_VISIT") return "Alta com Retorno";
  if (String(visit?.status || "").toUpperCase() === "CANCELLED") return "Atendimento Interrompido";
  return "Sem Registo";
};

export const inferVitalStatus = (visit) => {
  const explicitVital = String(visit?.vital_status || "")
    .trim()
    .toUpperCase();
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

export const createEmptyPastVisitForm = () => ({
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
  triage_general_state: "",
  triage_needs_oxygen: false,
  triage_suspected_severe_dehydration: false,
  triage_excessive_lethargy: false,
  triage_difficulty_maintaining_sitting: false,
  triage_history_syncope_collapse: false,
  chief_complaint: "",
  likely_diagnosis: "",
  clinical_reasoning: "",
  prescription_text: "",
  doctor_id: "",
  hospital_status: "",
});

export const createPastVisitModalState = (visit = null) => ({
  open: !!visit,
  visit: visit || null,
  page: "profile",
  detailLoading: !!visit,
  patientProfile: visit
    ? {
        id: visit.patient_id ?? null,
        full_name: visit.full_name || "",
        clinical_code: visit.clinical_code || "",
        birth_date: visit.birth_date || "",
        guardian_name: visit.guardian_name || "",
        guardian_phone: visit.guardian_phone || "",
        profile_photo_url: visit.profile_photo_url || null,
        photo_url: visit.photo_url || null,
        avatar_url: visit.avatar_url || null,
      }
    : null,
  patientHistory: [],
  editingPatient: false,
  patientLoading: false,
  patientSaving: false,
  patientForm: createEmptyPastVisitForm(),
});
