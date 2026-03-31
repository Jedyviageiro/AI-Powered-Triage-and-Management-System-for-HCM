import { useCallback, useEffect } from "react";
import {
  isDoctorShiftForbiddenError,
  loadDoctorAgendaData,
  loadDoctorQueueData,
  loadDoctorShiftData,
  startDoctorShiftAction,
} from "../doctor-operations/doctorOperations";
import {
  bootDoctorSession,
  stopDoctorIntervals,
} from "../doctor-operations/doctorSessionOperations";
import { loadDoctorVisitBundle } from "../doctor-operations/doctorVisitOperations";
import {
  applyDoctorVisitBundleState,
  resetDoctorVisitWorkspace,
} from "../doctor-operations/doctorVisitState";
import { useClickOutside } from "../../../hooks/useClickOutside";

export function useDoctorQueueAndVisitState({
  forcedView,
  setActiveView,
  mountedRef,
  intervalRef,
  heartbeatRef,
  shiftMenuRef,
  notificationsPreviewRef,
  labOrderCardRef,
  safeSet,
  showPopup,
  setErr,
  setNowTs,
  setShiftMenuOpen,
  setOpenModernSelect,
  setNotificationsPreviewOpen,
  activeView,
  consultFormStep,
  highlightLabOrderCard,
  setHighlightLabOrderCard,
  loadNotifications,
  loadPreferences,
  setLoadingQueue,
  setQueue,
  setLabPendingRequests,
  setLabReadyResults,
  setLoadingDetails,
  setSelectedVisit,
  setReevaluationContext,
  setTriage,
  setPatientDetails,
  setPatientHistory,
  setAiResult,
  setAiSuggestionOpen,
  setPlanDraft,
  setPlanAccepted,
  setQuestionnaireQuestions,
  setQuestionnaireAnswers,
  setQuestionnaireExtraNote,
  setQuestionnaireNotice,
  setUseAIQuestionnaire,
  setRetakeVitals,
  setReturnVisitCount,
  setReturnVisitDates,
  setFollowUpRuleKey,
  setFollowUpDiagnosisEvolution,
  setFollowUpPrescriptionDecision,
  setSelectedRoomCode,
  setLabOrderDraft,
  setLabOrderConfirmed,
  setSampleCollectionDraft,
  setSampleCollectionModalOpen,
  setAutoOpenSampleCollectionModal,
  setConsultFormStep,
  setLoadingAgenda,
  setAgenda,
  setLoadingShift,
  setShiftStatus,
  setShiftFeatureAvailable,
  shiftFeatureAvailable,
  setStartingShift,
}) {
  useClickOutside(
    notificationsPreviewRef,
    () => setNotificationsPreviewOpen(false),
    true
  );

  const stopIntervals = useCallback(
    () => stopDoctorIntervals(intervalRef, heartbeatRef),
    [heartbeatRef, intervalRef]
  );

  const loadQueue = useCallback(async () => {
    if (!mountedRef.current) return;
    safeSet(() => {
      setErr("");
      setLoadingQueue(true);
    });
    try {
      const { queue: nextQueue, pendingLab, readyLab } = await loadDoctorQueueData();
      safeSet(() => {
        setQueue(nextQueue);
        setLabPendingRequests(pendingLab);
        setLabReadyResults(readyLab);
      });
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setLoadingQueue(false));
    }
  }, [
    mountedRef,
    safeSet,
    setErr,
    setLabPendingRequests,
    setLabReadyResults,
    setLoadingQueue,
    setQueue,
  ]);

  const openVisit = useCallback(
    async (visitId, previewVisit = null) => {
      if (!mountedRef.current) return;
      safeSet(() => {
        resetDoctorVisitWorkspace({
          previewVisit,
          setErr,
          setLoadingDetails,
          setSelectedVisit,
          setReevaluationContext,
          setTriage,
          setPatientDetails,
          setPatientHistory,
          setAiResult,
          setAiSuggestionOpen,
          setPlanDraft,
          setPlanAccepted,
          setQuestionnaireQuestions,
          setQuestionnaireAnswers,
          setQuestionnaireExtraNote,
          setQuestionnaireNotice,
          setUseAIQuestionnaire,
          setRetakeVitals,
          setReturnVisitCount,
          setReturnVisitDates,
          setFollowUpRuleKey,
          setFollowUpDiagnosisEvolution,
          setFollowUpPrescriptionDecision,
          setSelectedRoomCode,
          setLabOrderDraft,
          setLabOrderConfirmed,
          setSampleCollectionDraft,
          setSampleCollectionModalOpen,
          setAutoOpenSampleCollectionModal,
          setHighlightLabOrderCard,
          setConsultFormStep,
        });
      });
      try {
        const bundle = await loadDoctorVisitBundle(visitId);
        safeSet(() => {
          applyDoctorVisitBundleState({
            ...bundle,
            previewVisit,
            setters: {
              setSelectedVisit,
              setTriage,
              setPlanDraft,
              setPlanAccepted,
              setQuestionnaireQuestions,
              setUseAIQuestionnaire,
              setQuestionnaireAnswers,
              setQuestionnaireExtraNote,
              setLabOrderDraft,
              setLabOrderConfirmed,
              setSampleCollectionDraft,
              setRetakeVitals,
              setReturnVisitCount,
              setReturnVisitDates,
              setFollowUpRuleKey,
              setFollowUpDiagnosisEvolution,
              setFollowUpPrescriptionDecision,
              setSelectedRoomCode,
              setPatientDetails,
              setPatientHistory,
            },
          });
        });
      } catch (e) {
        safeSet(() => setErr(e.message));
      } finally {
        safeSet(() => setLoadingDetails(false));
      }
    },
    [
      mountedRef,
      safeSet,
      setAiResult,
      setAiSuggestionOpen,
      setAutoOpenSampleCollectionModal,
      setConsultFormStep,
      setErr,
      setFollowUpDiagnosisEvolution,
      setFollowUpPrescriptionDecision,
      setFollowUpRuleKey,
      setHighlightLabOrderCard,
      setLabOrderConfirmed,
      setLabOrderDraft,
      setLoadingDetails,
      setPatientDetails,
      setPatientHistory,
      setPlanAccepted,
      setPlanDraft,
      setQuestionnaireAnswers,
      setQuestionnaireExtraNote,
      setQuestionnaireNotice,
      setQuestionnaireQuestions,
      setReevaluationContext,
      setRetakeVitals,
      setReturnVisitCount,
      setReturnVisitDates,
      setSampleCollectionDraft,
      setSampleCollectionModalOpen,
      setSelectedRoomCode,
      setSelectedVisit,
      setTriage,
      setUseAIQuestionnaire,
    ]
  );

  const loadAgenda = useCallback(async () => {
    if (!mountedRef.current) return;
    safeSet(() => setLoadingAgenda(true));
    try {
      const data = await loadDoctorAgendaData();
      safeSet(() => setAgenda(data));
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setLoadingAgenda(false));
    }
  }, [mountedRef, safeSet, setAgenda, setErr, setLoadingAgenda]);

  const loadShiftStatus = useCallback(async () => {
    setLoadingShift(true);
    try {
      const data = await loadDoctorShiftData();
      safeSet(() => {
        setShiftStatus(data || null);
        setShiftFeatureAvailable(true);
      });
    } catch (e) {
      if (isDoctorShiftForbiddenError(e)) {
        safeSet(() => {
          setShiftFeatureAvailable(false);
          setShiftStatus(null);
        });
      } else {
        safeSet(() => setErr(e.message));
      }
    } finally {
      safeSet(() => setLoadingShift(false));
    }
  }, [safeSet, setErr, setLoadingShift, setShiftFeatureAvailable, setShiftStatus]);

  const startShift = useCallback(async () => {
    if (!shiftFeatureAvailable) return;
    setShiftMenuOpen(false);
    setStartingShift(true);
    try {
      const { status, delayMinutes } = await startDoctorShiftAction();
      setShiftStatus(status);
      showPopup(
        "success",
        "Turno iniciado",
        delayMinutes > 0
          ? `Início registado com ${delayMinutes} minuto(s) de atraso.`
          : "Início registado sem atraso."
      );
    } catch (e) {
      if (isDoctorShiftForbiddenError(e)) {
        setShiftFeatureAvailable(false);
      } else {
        setErr(e.message);
        showPopup("warning", "Atenção", e.message || "Não foi possível iniciar o turno.");
      }
    } finally {
      setStartingShift(false);
    }
  }, [
    setErr,
    setShiftFeatureAvailable,
    setShiftMenuOpen,
    setShiftStatus,
    setStartingShift,
    shiftFeatureAvailable,
    showPopup,
  ]);

  const canOpenConsultationForDate = useCallback(
    (meta) => {
      if (meta?.return_visit_date || meta?.date) return true;
      const rawDate = meta?.return_visit_date || meta?.date || null;
      if (!rawDate) return true;
      const date = new Date(rawDate);
      if (Number.isNaN(date.getTime())) return true;
      date.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date.getTime() > today.getTime()) {
        setErr("Não é permitido abrir a consulta antes do dia agendado.");
        return false;
      }
      return true;
    },
    [setErr]
  );

  useEffect(() => {
    if (forcedView) {
      setActiveView(forcedView);
    }
  }, [forcedView, setActiveView]);

  useEffect(() => {
    mountedRef.current = true;
    bootDoctorSession({
      safeSet,
      setErr,
      loadQueue,
      loadAgenda,
      loadShiftStatus,
      loadNotifications,
      loadPreferences,
      intervalRef,
      heartbeatRef,
    });
    return () => {
      mountedRef.current = false;
      stopIntervals();
    };
  }, [
    heartbeatRef,
    intervalRef,
    loadAgenda,
    loadNotifications,
    loadPreferences,
    loadQueue,
    loadShiftStatus,
    mountedRef,
    safeSet,
    setErr,
    stopIntervals,
  ]);

  useEffect(() => {
    const timerId = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, [setNowTs]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      if (!shiftMenuRef.current) return;
      if (!shiftMenuRef.current.contains(event.target)) setShiftMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [setShiftMenuOpen, shiftMenuRef]);

  useEffect(() => {
    const onDocMouseDown = (event) => {
      const target = event?.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".modern-select-root")) setOpenModernSelect(null);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [setOpenModernSelect]);

  useEffect(() => {
    if (activeView !== "consultationForm" || consultFormStep !== 4 || !highlightLabOrderCard) {
      return undefined;
    }
    const scrollTimer = window.setTimeout(() => {
      labOrderCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    const clearTimer = window.setTimeout(() => {
      safeSet(() => setHighlightLabOrderCard(false));
    }, 1800);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [
    activeView,
    consultFormStep,
    highlightLabOrderCard,
    labOrderCardRef,
    safeSet,
    setHighlightLabOrderCard,
  ]);

  useEffect(() => {
    if (setErr) {
      // keep hook aligned with page-level popup behavior
    }
  }, [setErr]);

  return {
    stopIntervals,
    loadQueue,
    openVisit,
    loadAgenda,
    loadShiftStatus,
    startShift,
    canOpenConsultationForDate,
  };
}
