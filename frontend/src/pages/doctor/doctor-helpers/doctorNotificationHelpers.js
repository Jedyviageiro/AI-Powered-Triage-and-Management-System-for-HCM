export const dashboardPriorityMeta = {
  URGENT: { label: "Urgente", color: "#dc2626", bg: "#fef2f2", rank: 0 },
  LESS_URGENT: { label: "Pouco urgente", color: "#ea580c", bg: "#fff7ed", rank: 1 },
  NON_URGENT: { label: "Não urgente", color: "#0f766e", bg: "#f0fdfa", rank: 2 },
};

export const DEFAULT_PREFERENCES = {
  emergency_phone: "",
  font_size: "NORMAL",
  font_scale_percent: 100,
  notify_new_urgent: true,
  notify_wait_over_30: true,
  notify_critical_alerts: true,
  notify_shift_ending: true,
};

const LOCAL_DOCTOR_NOTIFICATION_READS_KEY = "doctor-local-notification-reads";

export const loadLocalDoctorNotificationReadMap = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_DOCTOR_NOTIFICATION_READS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveLocalDoctorNotificationReadMap = (value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_DOCTOR_NOTIFICATION_READS_KEY, JSON.stringify(value || {}));
  } catch {
    // Ignore storage failures; notifications still work for the current session.
  }
};

export const toSafeNotificationText = (value, fallback = "") => {
  const input = String(value ?? "").trim();
  if (!input) return fallback;

  let next = input;
  if (/[ÃƒÃ‚Ã¢]/.test(next)) {
    try {
      next = decodeURIComponent(escape(next));
    } catch {
      // Ignore decode errors and keep the original value.
    }
  }

  next = next
    .replace(/\uFFFD/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return next || fallback;
};

export const buildLiveDoctorNotifications = ({ queue, shiftStatus, nowTs, readMap }) => {
  const items = [];
  const now = Number.isFinite(Number(nowTs)) ? Number(nowTs) : Date.now();

  (Array.isArray(queue) ? queue : []).forEach((visit) => {
    const status = String(visit?.status || "").toUpperCase();
    if (status !== "WAITING_DOCTOR") return;

    const waitMinutes = Number(visit?.wait_minutes);
    const hasWait = Number.isFinite(waitMinutes);
    const patientName = String(visit?.full_name || "Paciente");
    const priority = String(visit?.priority || "").toUpperCase();
    const arrivalTs = new Date(visit?.arrival_time || now).getTime();
    const safeArrivalTs = Number.isFinite(arrivalTs) ? arrivalTs : now;
    let notification = null;

    if (hasWait && waitMinutes >= 180) {
      notification = {
        id: `local:doctor-critical-wait:${visit.id}`,
        title: "Espera crítica para avaliação médica",
        message: `${patientName} está em espera crítica (${waitMinutes} min) e requer revisão imediata.`,
        level: "CRITICAL",
        source: "QUEUE",
        visit_id: visit?.id ?? null,
        created_at: new Date(safeArrivalTs + 180 * 60 * 1000).toISOString(),
      };
    } else if (hasWait && waitMinutes >= 30) {
      notification = {
        id: `local:doctor-wait-over-30:${visit.id}`,
        title: "Paciente aguardando acima de 30 min",
        message: `${patientName} ultrapassou 30 min de espera (${waitMinutes} min).`,
        level: "WARNING",
        source: "QUEUE",
        visit_id: visit?.id ?? null,
        created_at: new Date(safeArrivalTs + 30 * 60 * 1000).toISOString(),
      };
    } else if (priority === "URGENT") {
      notification = {
        id: `local:doctor-urgent-patient:${visit.id}`,
        title: "Paciente urgente na fila médica",
        message: `${patientName} está marcado como urgente e aguarda atendimento prioritário.`,
        level: "INFO",
        source: "QUEUE",
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
      const id = `local:doctor-shift-ending:${shiftEndIso}`;
      items.push({
        id,
        title: "Turno perto do fim",
        message: `O turno termina em ${minutesLeft} min. Finalize os casos pendentes.`,
        level: "WARNING",
        source: "SHIFT",
        created_at: new Date(Math.max(now, shiftEndTs - 15 * 60 * 1000)).toISOString(),
        read_at: readMap?.[id] || null,
      });
    }
  }

  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const shouldShowNotificationByPreferences = (notification, preferences) => {
  const prefs = { ...DEFAULT_PREFERENCES, ...(preferences || {}) };
  const text = `${notification?.title || ""} ${notification?.message || ""}`.toLowerCase();
  const source = String(notification?.source || "").toLowerCase();
  const level = String(notification?.level || "").toUpperCase();

  const isCriticalAlert =
    level === "CRITICAL" || /critic|critico|revisao imediata|imediat/i.test(text);
  if (isCriticalAlert) return !!prefs.notify_critical_alerts;

  const isWaitOver30 = /espera|aguard/.test(text) && /(30|min|acima|ultrapass)/.test(text);
  if (isWaitOver30) return !!prefs.notify_wait_over_30;

  const isShiftEnding = /turno|shift/.test(text) && /(fim|termina|15|min)/.test(text);
  if (isShiftEnding) return !!prefs.notify_shift_ending;

  const isUrgentPatient = /urgent|urgente|prioritari/.test(text) || source === "queue";
  if (isUrgentPatient) return !!prefs.notify_new_urgent;

  return true;
};
