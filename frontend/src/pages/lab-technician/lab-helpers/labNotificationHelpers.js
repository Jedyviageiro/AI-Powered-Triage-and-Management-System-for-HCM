export const toSafeNotificationText = (value, fallback = "") => {
  const input = String(value ?? "").trim();
  if (!input) return fallback;

  let next = input;
  if (/[ÃƒÃ‚Ã¢]/.test(next)) {
    try {
      next = decodeURIComponent(escape(next));
    } catch {
      // Keep the original text if re-decoding fails.
    }
  }

  next = next
    .replace(/\uFFFD/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return next || fallback;
};

const LOCAL_LAB_NOTIFICATION_READS_KEY = "lab-local-notification-reads";

export const loadLocalLabNotificationReadMap = () => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_LAB_NOTIFICATION_READS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const saveLocalLabNotificationReadMap = (value) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_LAB_NOTIFICATION_READS_KEY, JSON.stringify(value || {}));
  } catch {
    // Ignore storage failures; notifications still work in-session.
  }
};
