import { api } from "../../../lib/api";

export const loadDoctorQueueData = async () => {
  const [queue, pendingLab, readyLab] = await Promise.all([
    api.getQueue("department"),
    api.listLabPending().catch(() => []),
    api.listLabReady(400).catch(() => []),
  ]);

  return {
    queue: Array.isArray(queue) ? queue : [],
    pendingLab: Array.isArray(pendingLab) ? pendingLab : [],
    readyLab: Array.isArray(readyLab) ? readyLab : [],
  };
};

export const loadDoctorAgendaData = async () => {
  const data = await api.getMyAgenda();

  return {
    assigned_today: Array.isArray(data?.assigned_today) ? data.assigned_today : [],
    returns_today: Array.isArray(data?.returns_today) ? data.returns_today : [],
  };
};

export const isDoctorShiftForbiddenError = (error) => {
  const msg = String(error?.message || "").toLowerCase();
  return /apenas enfermeiros|apenas m[eÃ©]dicos|forbidden|403|permiss/.test(msg);
};

export const loadDoctorShiftData = async () => {
  const data = await api.getDoctorShiftStatus();
  return data || null;
};

export const startDoctorShiftAction = async () => {
  const response = await api.startDoctorShift();
  const delay = Number.isFinite(Number(response?.delay_minutes))
    ? Number(response.delay_minutes)
    : 0;

  return {
    status: response?.status || null,
    delayMinutes: delay,
  };
};
