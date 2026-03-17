import React from "react";

export const DOCTOR_VIEW_ROUTES = {
  dashboard: "/doctor/dashboard",
  myPatients: "/doctor/my-patients",
  waitingQueue: "/doctor/waiting-queue",
  clinicalHistory: "/doctor/clinical-history",
  agendaToday: "/doctor/agenda-today",
  scheduledFollowups: "/doctor/scheduled-followups",
  labOrdered: "/doctor/lab-ordered",
  activeAlerts: "/doctor/active-alerts",
  notifications: "/doctor/notifications",
  preferences: "/doctor/preferences",
  consultationForm: "/doctor/consultation-form",
};

export const dashboardPriorityMeta = {
  URGENT: { label: "Urgente", color: "#dc2626", bg: "#fef2f2", rank: 0 },
  LESS_URGENT: { label: "Pouco urgente", color: "#ea580c", bg: "#fff7ed", rank: 1 },
  NON_URGENT: { label: "Nao urgente", color: "#0f766e", bg: "#f0fdfa", rank: 2 },
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

export function buildDoctorNavSections({
  myAssignedCount,
  waitingCount,
  agendaTodayCount,
  agendaReturnsTodayCount,
  doctorLabWorklistCount,
  activeAlertCount,
  notificationsUnread,
}) {
  return [
    {
      title: "Dashboard",
      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Pacientes",
      items: [
        {
          key: "myPatients",
          label: "Meus Pacientes",
          badge: myAssignedCount > 0 ? myAssignedCount : null,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          key: "waitingQueue",
          label: "Fila de Espera",
          badge: waitingCount > 0 ? waitingCount : null,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          key: "clinicalHistory",
          label: "Historico Clinico",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M3 3v18h18" />
              <path d="M8 14l3-3 2 2 4-4" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Agenda",
      items: [
        {
          key: "agendaToday",
          label: "Minha Agenda",
          badge: agendaTodayCount > 0 ? agendaTodayCount : null,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          ),
        },
        {
          key: "scheduledFollowups",
          label: "Consultas Marcadas",
          badge: agendaReturnsTodayCount > 0 ? agendaReturnsTodayCount : null,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Exames E Resultados",
      items: [
        {
          key: "labOrdered",
          label: "Exames Solicitados",
          badge: doctorLabWorklistCount > 0 ? doctorLabWorklistCount : null,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M10 2v7l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V2" />
              <line x1="8" y1="2" x2="16" y2="2" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Alertas e Urgencias",
      items: [
        {
          key: "activeAlerts",
          label: "Alertas Ativos",
          badge: activeAlertCount > 0 ? activeAlertCount : null,
          alertBadge: true,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "Configuracoes",
      items: [
        {
          key: "notifications",
          label: "Notificacoes",
          badge: notificationsUnread > 0 ? notificationsUnread : null,
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          ),
        },
        {
          key: "preferences",
          label: "Preferencias",
          icon: (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82L4.21 7.2a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          ),
        },
      ],
    },
  ];
}
