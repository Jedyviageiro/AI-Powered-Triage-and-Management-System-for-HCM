import { useEffect } from "react";
import { api } from "../../../lib/api";
import { saveLocalNotificationReadMap } from "../nurse-helpers/nurseHelpers";
import { useClickOutside } from "../../../hooks/useClickOutside";

export function useNursePageEffects({
  forcedView,
  setActiveView,
  loadDoctors,
  loadQueue,
  loadPastVisits,
  loadNotifications,
  loadPreferences,
  loadShiftStatus,
  setNowTs,
  localNotificationReads,
  patient,
  setPatientHistory,
  activeView,
  notificationsPreviewOpen,
  notificationsPreviewRef,
  setNotificationsPreviewOpen,
  err,
  queueErr,
  showPopup,
  pastVisitModal,
  setPastVisitModal,
  bypassToER,
  hasDoctorAvailable,
  hasRoomAvailable,
  setHoldInWaitingLine,
}) {
  useClickOutside(
    notificationsPreviewRef,
    () => setNotificationsPreviewOpen(false),
    notificationsPreviewOpen
  );

  useEffect(() => {
    if (forcedView) {
      setActiveView(forcedView);
    }
  }, [forcedView, setActiveView]);

  useEffect(() => {
    const controller = new AbortController();
    loadDoctors(controller.signal);
    const interval = setInterval(
      () => {
        const ctrl = new AbortController();
        loadDoctors(ctrl.signal);
      },
      30 * 60 * 1000
    );
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [loadDoctors]);

  useEffect(() => {
    loadQueue();
    loadPastVisits();
    loadNotifications();
    loadPreferences();
    const interval = setInterval(
      () => {
        loadQueue();
        loadPastVisits();
        loadNotifications();
        loadPreferences();
      },
      30 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [loadNotifications, loadPastVisits, loadPreferences, loadQueue]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadQueue();
      loadShiftStatus();
      loadNotifications();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications, loadQueue, loadShiftStatus]);

  useEffect(() => {
    loadShiftStatus();
  }, [loadShiftStatus]);

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [setNowTs]);

  useEffect(() => {
    saveLocalNotificationReadMap(localNotificationReads);
  }, [localNotificationReads]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!patient?.id) {
        setPatientHistory([]);
        return;
      }
      try {
        const history = await api.getPatientHistory(patient.id);
        if (!cancelled) setPatientHistory(Array.isArray(history) ? history : []);
      } catch {
        if (!cancelled) setPatientHistory([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [patient?.id, setPatientHistory]);

  useEffect(() => {
    if (activeView === "doctors") loadDoctors();
    if (activeView === "patients") loadPastVisits();
    if (activeView === "notifications") loadNotifications();
    if (activeView === "preferences") loadPreferences();
    if (activeView === "roomsAvailable") {
      loadQueue();
      loadDoctors();
    }
    if (activeView === "destination") loadQueue();
  }, [activeView, loadDoctors, loadNotifications, loadPastVisits, loadPreferences, loadQueue]);

  useEffect(() => {
    if (err) showPopup("warning", "Atenção", err);
  }, [err, showPopup]);

  useEffect(() => {
    if (queueErr) showPopup("warning", "Atenção", queueErr);
  }, [queueErr, showPopup]);

  useEffect(() => {
    const patientId = Number(pastVisitModal?.visit?.patient_id);
    if (!pastVisitModal.open || !Number.isFinite(patientId) || patientId <= 0) return;
    let active = true;
    setPastVisitModal((prev) => ({ ...prev, detailLoading: true }));
    Promise.all([
      api.getPatientById(patientId).catch(() => null),
      api.getPatientHistory(patientId).catch(() => []),
    ])
      .then(([profile, history]) => {
        if (!active) return;
        setPastVisitModal((prev) => ({
          ...prev,
          detailLoading: false,
          patientProfile: profile || null,
          patientHistory: Array.isArray(history) ? history : [],
        }));
      })
      .catch(() => {
        if (!active) return;
        setPastVisitModal((prev) => ({ ...prev, detailLoading: false }));
      });
    return () => {
      active = false;
    };
  }, [pastVisitModal.open, pastVisitModal?.visit?.patient_id, setPastVisitModal]);

  useEffect(() => {
    if (!bypassToER && (!hasDoctorAvailable || !hasRoomAvailable)) {
      setHoldInWaitingLine(true);
    }
  }, [bypassToER, hasDoctorAvailable, hasRoomAvailable, setHoldInWaitingLine]);
}
