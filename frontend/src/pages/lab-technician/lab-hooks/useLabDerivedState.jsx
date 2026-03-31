import { useCallback, useMemo } from "react";
import { examLabel, EXAM_PROTOCOLS, getProtocolPresentation } from "../lab-helpers/labExamHelpers";

const getUrgencyMeta = (priority) => {
  const key = String(priority || "").toUpperCase();
  if (["URGENT", "HIGH"].includes(key)) {
    return {
      key,
      label: "Urgente",
      bg: "#FEF2F2",
      color: "#B91C1C",
      border: "#FECACA",
      accent: "#EF4444",
    };
  }
  if (["LESS_URGENT", "MEDIUM"].includes(key)) {
    return {
      key,
      label: "Pouco urgente",
      bg: "#FFF7ED",
      color: "#C2410C",
      border: "#FED7AA",
      accent: "#F97316",
    };
  }
  if (["NON_URGENT", "NOT_URGENT", "LOW"].includes(key)) {
    return {
      key,
      label: "Não urgente",
      bg: "#ECFDF5",
      color: "#047857",
      border: "#A7F3D0",
      accent: "#10B981",
    };
  }
  return {
    key,
    label: "Sem prioridade",
    bg: "#F3F4F6",
    color: "#6B7280",
    border: "#E5E7EB",
    accent: "#9CA3AF",
  };
};

const getRequestingDoctorName = (visit) =>
  String(
    visit?.doctor_full_name ||
      visit?.doctor_name ||
      visit?.doctor_username ||
      visit?.doctor?.full_name ||
      visit?.doctor?.username ||
      ""
  ).trim() || "-";

const normalizeLabVisit = (visit) => ({
  ...visit,
  requestingDoctorName: getRequestingDoctorName(visit),
  urgencyMeta: getUrgencyMeta(visit?.priority),
});

const navItems = [
  {
    key: "dashboard",
    label: "Inicio",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: "pending",
    label: "Pedidos Pendentes",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
      </svg>
    ),
  },
  {
    key: "insert",
    label: "Inserir Resultados",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    key: "ready",
    label: "Resultados Prontos",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  {
    key: "history",
    label: "Histórico do Dia",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M8 6.5h8" />
        <path d="M8 10.5h8" />
        <path d="M8 14.5h5" />
        <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      </svg>
    ),
  },
  {
    key: "notifications",
    label: "Notificações",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    key: "settings",
    label: "Configurações",
    icon: (
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09c0 .7.4 1.34 1.03 1.62h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.6 1.15-.33 1.75v.01c.25.63.86 1.04 1.54 1.04H21a2 2 0 1 1 0 4h-.09c-.68 0-1.29.41-1.54 1.04z" />
      </svg>
    ),
  },
];

export function useLabDerivedState({
  me,
  activeView,
  search,
  pending,
  ready,
  historyToday,
  modalVisitId,
  notificationReadMap,
  setNotificationReadMap,
  setActiveView,
  setModalVisitId,
  setNotificationsPreviewOpen,
}) {
  const dashboardStats = useMemo(
    () => ({
      pending: pending.length,
      ready: ready.length,
      today: historyToday.length,
    }),
    [pending, ready, historyToday]
  );

  const allKnownVisits = useMemo(() => {
    const map = new Map();
    [...pending, ...ready, ...historyToday].forEach((rawVisit) => {
      const visit = normalizeLabVisit(rawVisit);
      const id = Number(visit?.id);
      if (Number.isFinite(id)) map.set(id, visit);
    });
    return Array.from(map.values());
  }, [pending, ready, historyToday]);

  const modalVisit = useMemo(
    () => allKnownVisits.find((visit) => Number(visit.id) === Number(modalVisitId)) || null,
    [allKnownVisits, modalVisitId]
  );

  const modalExamKey = String(modalVisit?.lab_exam_type || "").toUpperCase();
  const modalProtocol = useMemo(
    () => EXAM_PROTOCOLS[modalExamKey] || EXAM_PROTOCOLS.OUTRO,
    [modalExamKey]
  );
  const modalFields = useMemo(
    () => (modalProtocol?.sections || []).flatMap((section) => section.fields || []),
    [modalProtocol]
  );
  const modalPresentation = useMemo(
    () => getProtocolPresentation(modalExamKey, modalProtocol),
    [modalExamKey, modalProtocol]
  );

  const navSections = useMemo(
    () => [
      {
        title: "Painel",
        items: navItems.filter((item) => ["dashboard", "pending", "insert"].includes(item.key)),
      },
      {
        title: "Resultados",
        items: navItems.filter((item) => ["ready", "history"].includes(item.key)),
      },
      {
        title: "Sistema",
        items: navItems.filter((item) => ["notifications", "settings"].includes(item.key)),
      },
    ],
    []
  );

  const tableRows =
    activeView === "pending" ? pending : activeView === "ready" ? ready : historyToday;

  const filteredRows = useMemo(() => {
    const query = String(search || "")
      .trim()
      .toLowerCase();
    return tableRows
      .map(normalizeLabVisit)
      .filter(
      (visit) =>
        !query ||
        [
          visit.full_name,
          visit.clinical_code,
          visit.lab_exam_type,
          visit.lab_tests,
          visit.requestingDoctorName,
          visit.urgencyMeta?.label,
        ].some((field) =>
          String(field || "")
            .toLowerCase()
            .includes(query)
        )
      );
  }, [tableRows, search]);

  const filteredPending = useMemo(() => {
    const query = String(search || "")
      .trim()
      .toLowerCase();
    return pending
      .map(normalizeLabVisit)
      .filter(
      (visit) =>
        !query ||
        [
          visit.full_name,
          visit.clinical_code,
          visit.lab_exam_type,
          visit.lab_tests,
          visit.requestingDoctorName,
          visit.urgencyMeta?.label,
        ].some((field) =>
          String(field || "")
            .toLowerCase()
            .includes(query)
        )
      );
  }, [pending, search]);

  const notificationItems = useMemo(() => {
    const items = [];
    const nowIso = new Date().toISOString();
    pending.forEach((visit) => {
      items.push({
        id: `pending-${visit.id}`,
        title: "Pedido pendente no laboratório",
        message: `${visit.full_name || "Paciente"} aguarda processamento para ${examLabel(visit.lab_exam_type, visit.lab_tests)}.`,
        tone: { bg: "#fff7ed", color: "#c07700" },
        level: "WARNING",
        source: "LAB",
        created_at: visit.updated_at || visit.created_at || visit.arrival_time || nowIso,
        read_at: notificationReadMap[`pending-${visit.id}`] || null,
        action: "Abrir pedido",
        onClick: () => {
          setActiveView("insert");
          setModalVisitId(visit.id);
          setNotificationsPreviewOpen(false);
        },
      });
    });
    ready.forEach((visit) => {
      items.push({
        id: `ready-${visit.id}`,
        title: "Resultado pronto para revisão",
        message: `${visit.full_name || "Paciente"} tem resultado pronto em ${examLabel(visit.lab_exam_type, visit.lab_tests)}.`,
        tone: { bg: "#e8f5e9", color: "#1a7a3c" },
        level: "INFO",
        source: "LAB",
        created_at: visit.lab_result_ready_at || visit.updated_at || nowIso,
        read_at: notificationReadMap[`ready-${visit.id}`] || null,
        action: "Rever resultado",
        onClick: () => {
          setActiveView("ready");
          setModalVisitId(visit.id);
          setNotificationsPreviewOpen(false);
        },
      });
    });
    historyToday.slice(0, 10).forEach((visit) => {
      items.push({
        id: `history-${visit.id}`,
        title: "Exame processado hoje",
        message: `${visit.full_name || "Paciente"} foi processado hoje.`,
        tone: { bg: "#e3f2fd", color: "#0077cc" },
        level: "INFO",
        source: "LAB",
        created_at: visit.lab_result_ready_at || visit.updated_at || visit.arrival_time || nowIso,
        read_at: notificationReadMap[`history-${visit.id}`] || null,
        action: "Ver histórico",
        onClick: () => {
          setActiveView("history");
          setNotificationsPreviewOpen(false);
        },
      });
    });
    return items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [
    pending,
    ready,
    historyToday,
    notificationReadMap,
    setActiveView,
    setModalVisitId,
    setNotificationsPreviewOpen,
  ]);

  const filteredNotifications = useMemo(() => {
    const query = String(search || "")
      .trim()
      .toLowerCase();
    return notificationItems.filter(
      (item) => !query || `${item.title} ${item.message}`.toLowerCase().includes(query)
    );
  }, [notificationItems, search]);

  const notificationsUnread = notificationItems.filter((item) => !item.read_at).length;
  const latestNotification = notificationItems[0] || null;

  const initials =
    String(me?.full_name || "LT")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "LT";

  const markNotificationRead = useCallback(
    (id) => {
      if (!id) return;
      setNotificationReadMap((current) => ({
        ...current,
        [id]: current[id] || new Date().toISOString(),
      }));
    },
    [setNotificationReadMap]
  );

  const markAllNotificationsRead = useCallback(() => {
    const nowIso = new Date().toISOString();
    setNotificationReadMap((current) => {
      const next = { ...current };
      notificationItems.forEach((item) => {
        if (!next[item.id]) next[item.id] = nowIso;
      });
      return next;
    });
  }, [notificationItems, setNotificationReadMap]);

  const openNotificationsPage = useCallback(() => {
    markAllNotificationsRead();
    setNotificationsPreviewOpen(false);
    setActiveView("notifications");
  }, [markAllNotificationsRead, setActiveView, setNotificationsPreviewOpen]);

  return {
    dashboardStats,
    allKnownVisits,
    modalVisit,
    modalExamKey,
    modalProtocol,
    modalFields,
    modalPresentation,
    navSections,
    filteredRows,
    filteredPending,
    filteredNotifications,
    notificationsUnread,
    latestNotification,
    initials,
    markNotificationRead,
    markAllNotificationsRead,
    openNotificationsPage,
  };
}
