import { getToken, clearAuth } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const token = getToken();
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || 0);
  const timeoutId =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  let res;
  let data = {};
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    data = await res.json().catch(() => ({}));
  } catch (e) {
    if (timeoutId) clearTimeout(timeoutId);
    if (e?.name === "AbortError") {
      throw new Error("A operação demorou demasiado tempo. Tente novamente.");
    }
    throw e;
  }
  if (timeoutId) clearTimeout(timeoutId);

  // sessão expirada
  if (res.status === 401) {
    clearAuth();
    window.location.replace("/login");
    throw new Error(data?.error || "Sessão expirada");
  }

  if (!res.ok) {
    throw new Error(data?.error || "Erro na API");
  }

  return data;
}

export const api = {
  // ================= AUTH =================
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: { username, password },
    }),

  // ================= QUEUE =================
  getQueue: () => request("/queue"),

  // ================= USERS =================
  listUsers: () => request("/users"),

  createUser: ({ username, password, full_name, role, specialization }) =>
    request("/users", {
      method: "POST",
      body: { username, password, full_name, role, specialization },
    }),

  updateUser: (id, payload) =>
    request(`/users/${id}`, {
      method: "PATCH",
      body: payload,
    }),

  resetUserPassword: (id, newPassword) =>
    request(`/users/${id}/password`, {
      method: "PATCH",
      body: { newPassword },
    }),

  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: "DELETE",
    }),

  // ================= PATIENTS =================
  searchPatients: (name) =>
    request(`/patients/search?name=${encodeURIComponent(name)}`),

  getPatientByCode: (code) =>
    request(`/patients/code/${encodeURIComponent(code)}`),

  getPatientById: (id) => request(`/patients/${id}`),
  getPatientHistory: (id) => request(`/patients/${id}/history`),

  createPatient: (payload) =>
    request("/patients", { method: "POST", body: payload }),

  // ================= VISITS =================
  createVisit: (patient_id) =>
    request("/visits", { method: "POST", body: { patient_id } }),

  getVisitById: (id) => request(`/visits/${id}`),
  listPastVisits: (limit = 200) => request(`/visits/history?limit=${encodeURIComponent(limit)}`),
  getMyAgenda: () => request("/visits/my-agenda"),

  // prioridade definida pelo enfermeiro
  setVisitPriority: (visitId, payload) =>
    request(`/visits/${visitId}/priority`, {
      method: "PATCH",
      body: payload,
    }),

  // status genérico (evitar para iniciar consulta)
  setVisitStatus: (id, status) =>
    request(`/visits/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  // iniciar consulta (fluxo correto)
  startConsultation: (visitId) =>
    request(`/visits/${visitId}/start-consultation`, {
      method: "PATCH",
    }),

  // finalizar consulta
  finishVisit: (id) => request(`/visits/${id}/finish`, { method: "PATCH" }),

  saveVisitMedicalPlan: (visitId, payload) =>
    request(`/visits/${visitId}/medical-plan`, {
      method: "PATCH",
      body: payload,
    }),

  scheduleVisitReturn: (visitId, payload) =>
    request(`/visits/${visitId}/return-schedule`, {
      method: "PATCH",
      body: payload,
    }),

  // atribuir médico
  assignDoctorToVisit: (visitId, doctorId) =>
    request(`/visits/${visitId}/assign-doctor`, {
      method: "PATCH",
      body: { doctor_id: doctorId },
    }),

  // ================= TRIAGE =================
  createTriage: (payload) => request("/triages", { method: "POST", body: payload }),

  getTriageByVisitId: (visitId) => request(`/triages/visit/${visitId}`),

  // ================= AI =================
  aiTriageSuggest: (payload) => request("/ai/triage", { method: "POST", body: payload }),

  aiDoctorSuggest: (payload) =>
    request("/ai/doctor", { method: "POST", body: payload, timeoutMs: 60000 }),

  // ================= DOCTORS =================
  listDoctorsAvailability: async () => {
    const data = await request("/doctors/availability");

    // normalização universal
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.doctors)) return data.doctors;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  // Doctor online / disponibilidade
  doctorCheckin: () => request("/doctors/checkin", { method: "PATCH" }),
  doctorCheckout: () => request("/doctors/checkout", { method: "PATCH" }),
  doctorHeartbeat: () => request("/doctors/heartbeat", { method: "PATCH" }),
  doctorSetAvailability: (is_available) =>
    request("/doctors/availability", {
      method: "PATCH",
      body: { is_available: !!is_available },
    }),

  // aliases usados na UI
  listDoctors: () => api.listDoctorsAvailability(),
  assignDoctor: (visitId, doctorId) => api.assignDoctorToVisit(visitId, doctorId),

  cancelVisit: (visitId, reason) =>
  request(`/visits/${visitId}/cancel`, {
    method: "PATCH",
    body: { reason },
  }),

editVisitPriority: (visitId, payload) =>
  request(`/visits/${visitId}/edit-priority`, {
    method: "PATCH",
    body: payload, // { priority, max_wait_minutes }
  }),

};



