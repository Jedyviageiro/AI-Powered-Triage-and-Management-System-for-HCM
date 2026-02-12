import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Erro na API");
  }

  return data;
}

export const api = {
  // AUTH
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: { username, password },
    }),

  // QUEUE
  getQueue: () => request("/queue"),

  // USERS (ADMIN)
  listUsers: () => request("/users"),

  createUser: ({ username, password, full_name, role }) =>
    request("/users", {
      method: "POST",
      body: { username, password, full_name, role },
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

      // PATIENTS
  searchPatients: (name) => request(`/patients/search?name=${encodeURIComponent(name)}`),
  getPatientByCode: (code) => request(`/patients/code/${encodeURIComponent(code)}`),
  createPatient: (payload) =>
    request("/patients", { method: "POST", body: payload }),

  // VISITS
  createVisit: (patient_id) =>
    request("/visits", { method: "POST", body: { patient_id } }),

  // TRIAGE
  createTriage: (payload) =>
    request("/triages", { method: "POST", body: payload }),

  // SET PRIORITY
  setVisitPriority: (visitId, payload) =>
    request(`/visits/${visitId}/priority`, { method: "PATCH", body: payload }),

    // VISIT (DOCTOR)
  getVisitById: (id) => request(`/visits/${id}`),
  setVisitStatus: (id, status) =>
    request(`/visits/${id}/status`, { method: "PATCH", body: { status } }),
  finishVisit: (id) =>
    request(`/visits/${id}/finish`, { method: "PATCH" }),

  // TRIAGE (ver triagem por visita)
  getTriageByVisitId: (visitId) => request(`/triages/visit/${visitId}`),


};
