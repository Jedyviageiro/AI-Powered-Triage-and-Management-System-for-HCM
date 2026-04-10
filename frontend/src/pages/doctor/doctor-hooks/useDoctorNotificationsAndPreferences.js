import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import {
  buildLiveDoctorNotifications,
  loadLocalDoctorNotificationReadMap,
  saveLocalDoctorNotificationReadMap,
  shouldShowNotificationByPreferences,
  toSafeNotificationText,
} from "../doctor-helpers/doctorNotificationHelpers";
import {
  loadDoctorNotificationsData,
  loadDoctorPreferencesData,
  markAllDoctorNotificationsReadAction,
  markDoctorNotificationReadAction,
  saveDoctorPreferencesData,
} from "../doctor-operations/doctorSettingsOperations";

export function useDoctorNotificationsAndPreferences({
  DEFAULT_PREFERENCES,
  activeView,
  queue,
  shiftStatus,
  nowTs,
  selectedVisit,
  setSelectedVisit,
  setQueue,
  setLabReadyResults,
  setErr,
  showPopup,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsPreviewOpen, setNotificationsPreviewOpen] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [localNotificationReads, setLocalNotificationReads] = useState(() =>
    loadLocalDoctorNotificationReadMap()
  );
  const [notifyingPatientVisitId, setNotifyingPatientVisitId] = useState(null);
  const [markingDeliveredVisitId, setMarkingDeliveredVisitId] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const rows = await loadDoctorNotificationsData(200);
      setNotifications(rows);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingNotifications(false);
    }
  }, [setErr]);

  const markNotificationRead = useCallback(
    async (id) => {
      if (!id) return;
      if (String(id).startsWith("local:")) {
        const stampedAt = new Date().toISOString();
        setLocalNotificationReads((prev) => {
          if (prev?.[id]) return prev;
          return { ...(prev || {}), [id]: stampedAt };
        });
        return;
      }
      try {
        await markDoctorNotificationReadAction(id);
        await loadNotifications();
      } catch (e) {
        setErr(e.message);
      }
    },
    [loadNotifications, setErr]
  );

  const loadPreferences = useCallback(async () => {
    setLoadingPreferences(true);
    try {
      const data = await loadDoctorPreferencesData(DEFAULT_PREFERENCES);
      setPreferences(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingPreferences(false);
    }
  }, [DEFAULT_PREFERENCES, setErr]);

  const savePreferences = useCallback(
    async (payload) => {
      setSavingPreferences(true);
      try {
        const merged = await saveDoctorPreferencesData(payload, DEFAULT_PREFERENCES);
        setPreferences(merged);
        return merged;
      } finally {
        setSavingPreferences(false);
      }
    },
    [DEFAULT_PREFERENCES]
  );

  const doctorLiveNotifications = useMemo(
    () =>
      buildLiveDoctorNotifications({
        queue,
        shiftStatus,
        nowTs,
        readMap: localNotificationReads,
      }),
    [localNotificationReads, nowTs, queue, shiftStatus]
  );

  const filteredNotifications = useMemo(() => {
    const remoteNotifications = (Array.isArray(notifications) ? notifications : []).map(
      (notification) => ({
        ...notification,
        title: toSafeNotificationText(notification?.title, "Notificação"),
        message: toSafeNotificationText(notification?.message, ""),
      })
    );
    return [...remoteNotifications, ...doctorLiveNotifications]
      .filter((notification) => shouldShowNotificationByPreferences(notification, preferences))
      .sort(
        (a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
      );
  }, [doctorLiveNotifications, notifications, preferences]);

  const notificationsUnread = useMemo(
    () => filteredNotifications.filter((notification) => !notification?.read_at).length,
    [filteredNotifications]
  );

  const latestNotification = filteredNotifications[0] || null;

  const markAllNotificationsRead = useCallback(async () => {
    const unreadLocalIds = doctorLiveNotifications
      .filter((notification) => !notification?.read_at)
      .map((notification) => String(notification.id));
    if (unreadLocalIds.length > 0) {
      const stampedAt = new Date().toISOString();
      setLocalNotificationReads((prev) => {
        const next = { ...(prev || {}) };
        unreadLocalIds.forEach((id) => {
          next[id] = next[id] || stampedAt;
        });
        return next;
      });
    }
    try {
      if (notifications.some((notification) => !notification?.read_at)) {
        await markAllDoctorNotificationsReadAction();
        await loadNotifications();
      }
    } catch (e) {
      setErr(e.message);
    }
  }, [doctorLiveNotifications, loadNotifications, notifications, setErr]);

  const notifyPatientExamReady = useCallback(
    async (row) => {
      if (!row?.id || notifyingPatientVisitId === row.id) return;
      setNotifyingPatientVisitId(row.id);
      try {
        const updated = await api.notifyPatientLabReady(row.id);
        const deliveredBy = Array.isArray(updated?.notification_delivery?.successfulChannels)
          ? updated.notification_delivery.successfulChannels
          : [];
        setLabReadyResults((prev) =>
          (Array.isArray(prev) ? prev : []).map((item) =>
            Number(item?.id) === Number(row.id) ? { ...item, ...updated } : item
          )
        );
        setQueue((prev) =>
          (Array.isArray(prev) ? prev : []).map((item) =>
            Number(item?.id) === Number(row.id) ? { ...item, ...updated } : item
          )
        );
        if (Number(selectedVisit?.id) === Number(row.id)) {
          setSelectedVisit((prev) => (prev ? { ...prev, ...updated } : prev));
        }
        showPopup(
          "success",
          "Paciente avisado",
          deliveredBy.length > 0
            ? `Notificacao enviada por ${deliveredBy.join(" e ")}.`
            : "O sistema registou que o paciente ja foi avisado de que o exame esta pronto."
        );
      } catch (e) {
        const channelDetails = Array.isArray(e?.data?.channels)
          ? e.data.channels
              .map((channel) => {
                if (!channel) return null;
                const provider = String(channel.provider || "canal").toUpperCase();
                if (channel.ok) return `${provider}: enviado com sucesso`;
                if (channel.skipped) return `${provider}: nao configurado`;
                return `${provider}: ${channel.error || "falha no envio"}`;
              })
              .filter(Boolean)
              .join(" | ")
          : "";
        showPopup(
          "warning",
          "Atenção",
          channelDetails || e?.message || "Não foi possível registar o aviso ao paciente."
        );
      } finally {
        setNotifyingPatientVisitId(null);
      }
    },
    [
      notifyingPatientVisitId,
      selectedVisit?.id,
      setLabReadyResults,
      setQueue,
      setSelectedVisit,
      showPopup,
    ]
  );

  const markPatientResultDelivered = useCallback(
    async (row) => {
      if (!row?.id || markingDeliveredVisitId === row.id) return;
      setMarkingDeliveredVisitId(row.id);
      try {
        const updated = await api.markLabResultDelivered(row.id);
        setLabReadyResults((prev) =>
          (Array.isArray(prev) ? prev : []).map((item) =>
            Number(item?.id) === Number(row.id) ? { ...item, ...updated } : item
          )
        );
        setQueue((prev) =>
          (Array.isArray(prev) ? prev : []).map((item) =>
            Number(item?.id) === Number(row.id) ? { ...item, ...updated } : item
          )
        );
        if (Number(selectedVisit?.id) === Number(row.id)) {
          setSelectedVisit((prev) => (prev ? { ...prev, ...updated } : prev));
        }
        showPopup(
          "success",
          "Resultado entregue",
          "O sistema registou que o resultado laboratorial ja foi entregue ao paciente."
        );
      } catch (e) {
        showPopup(
          "warning",
          "Atencao",
          e?.message || "Nao foi possivel registar a entrega do resultado."
        );
      } finally {
        setMarkingDeliveredVisitId(null);
      }
    },
    [
      markingDeliveredVisitId,
      selectedVisit?.id,
      setLabReadyResults,
      setQueue,
      setSelectedVisit,
      showPopup,
    ]
  );

  useEffect(() => {
    saveLocalDoctorNotificationReadMap(localNotificationReads);
  }, [localNotificationReads]);

  useEffect(() => {
    if (activeView === "notifications") {
      loadNotifications();
    }
    if (activeView === "preferences") {
      loadPreferences();
    }
  }, [activeView, loadNotifications, loadPreferences]);

  return {
    notifications,
    loadingNotifications,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    preferences,
    setPreferences,
    loadingPreferences,
    savingPreferences,
    localNotificationReads,
    notifyingPatientVisitId,
    markingDeliveredVisitId,
    loadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    loadPreferences,
    savePreferences,
    notifyPatientExamReady,
    markPatientResultDelivered,
    filteredNotifications,
    notificationsUnread,
    latestNotification,
  };
}

