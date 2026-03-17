import { api } from "../../../lib/api";

export const loadDoctorNotificationsData = async (limit = 200) => {
  const response = await api.listNotifications(limit);
  return Array.isArray(response?.notifications) ? response.notifications : [];
};

export const markDoctorNotificationReadAction = async (id) => {
  return api.markNotificationRead(id);
};

export const markAllDoctorNotificationsReadAction = async () => {
  return api.markAllNotificationsRead();
};

export const loadDoctorPreferencesData = async (defaultPreferences) => {
  const data = await api.getMyPreferences();
  return { ...(defaultPreferences || {}), ...(data || {}) };
};

export const saveDoctorPreferencesData = async (payload, defaultPreferences) => {
  const data = await api.updateMyPreferences(payload || {});
  return { ...(defaultPreferences || {}), ...(data || {}) };
};
