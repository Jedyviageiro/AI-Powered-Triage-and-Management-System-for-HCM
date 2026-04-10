import { useCallback, useMemo } from "react";
import { buildDoctorNavSections } from "../doctor-config/doctorNavigationConfig.jsx";
import {
  buildDoctorDashboardAlertPreview,
  buildDoctorDashboardHourSeries,
  buildDoctorDashboardNextPatients,
  buildDoctorDashboardPriorityRows,
  buildDoctorDashboardStatusRows,
  buildDoctorLabWorklistRows,
} from "../doctor-helpers/doctorDashboardSelectors";
import {
  fallbackComplaintQuestions,
  getShiftIcon,
  inferLabRequestSupport,
  isSameLocalDay,
  LAB_EXAM_OPTIONS,
  LAB_RETURN_COLLECTION_RULES,
  toSafeDate,
} from "../doctor-helpers/doctorHelpers";
import {
  countQueuedExamsOnSameMachine,
  estimateExamReadyMeta,
  formatEtaPt,
  formatLabDateTimeLabel,
  getLabWindowStart,
  moveToNextLabBusinessStart,
} from "../doctor-helpers/doctorLabHelpers";

export function useDoctorDashboardState({
  queue,
  labPendingRequests,
  labReadyResults,
  meId,
  triage,
  selectedVisit,
  questionnaireQuestions,
  planDraft,
  agenda,
  activeView,
  shiftStatus,
  nowTs,
  shiftFeatureAvailable,
  loadingShift,
  startingShift,
  notificationsUnread,
  dashboardPriorityMeta,
}) {
  const isLabReadyStatus = useCallback((value) => {
    const status = String(value || "").toUpperCase();
    return status === "READY" || status === "RESULTED" || status === "VERIFIED";
  }, []);

  const isPendingLabQueueHold = useCallback(
    (visit) => {
      const status = String(visit?.status || "").toUpperCase();
      const labRequested = !!visit?.lab_requested;
      const hasResult = !!String(visit?.lab_result_text || "").trim();
      const ready = isLabReadyStatus(visit?.lab_result_status);
      return status === "WAITING_DOCTOR" && labRequested && !hasResult && !ready;
    },
    [isLabReadyStatus]
  );

  const isLabWorkflowVisit = useCallback(
    (visit) => {
      const motive = String(visit?.visit_motive || "").toUpperCase();
      if (visit?.is_lab_followup) return true;
      if (motive === "LAB_SAMPLE_COLLECTION" || motive === "LAB_RESULTS") return true;
      return isPendingLabQueueHold(visit);
    },
    [isPendingLabQueueHold]
  );

  const filteredQueue = useMemo(() => {
    return (Array.isArray(queue) ? queue : []).filter((visit) => {
      const status = String(visit?.status || "").toUpperCase();
      if (!(status === "WAITING_DOCTOR" || status === "IN_CONSULTATION")) return false;
      return !isLabWorkflowVisit(visit);
    });
  }, [isLabWorkflowVisit, queue]);

  const waitingCount = useMemo(
    () => filteredQueue.filter((visit) => visit.status === "WAITING_DOCTOR").length,
    [filteredQueue]
  );
  const inConsultCount = useMemo(
    () => filteredQueue.filter((visit) => visit.status === "IN_CONSULTATION").length,
    [filteredQueue]
  );

  const priorityRank = useCallback((priority) => {
    const key = String(priority || "").toUpperCase();
    if (key === "URGENT") return 3;
    if (key === "LESS_URGENT") return 2;
    if (key === "NON_URGENT") return 1;
    return 0;
  }, []);

  const priorityTheme = useCallback((priority) => {
    const key = String(priority || "").toUpperCase();
    if (key === "URGENT") {
      return {
        accent: "#fca5a5",
        text: "#fee2e2",
        chipBg: "rgba(239,68,68,0.22)",
        chipBorder: "rgba(254,202,202,0.45)",
      };
    }
    if (key === "LESS_URGENT") {
      return {
        accent: "#fcd34d",
        text: "#fef3c7",
        chipBg: "rgba(245,158,11,0.24)",
        chipBorder: "rgba(253,230,138,0.45)",
      };
    }
    return {
      accent: "#86efac",
      text: "#dcfce7",
      chipBg: "rgba(34,197,94,0.24)",
      chipBorder: "rgba(134,239,172,0.45)",
    };
  }, []);

  const waitingTopPriority = useMemo(() => {
    const rows = filteredQueue.filter((visit) => visit.status === "WAITING_DOCTOR");
    if (rows.length === 0) return "NON_URGENT";
    return rows.reduce(
      (top, row) => (priorityRank(row.priority) > priorityRank(top) ? row.priority : top),
      rows[0]?.priority || "NON_URGENT"
    );
  }, [filteredQueue, priorityRank]);

  const inConsultTopPriority = useMemo(() => {
    const rows = filteredQueue.filter((visit) => visit.status === "IN_CONSULTATION");
    if (rows.length === 0) return "NON_URGENT";
    return rows.reduce(
      (top, row) => (priorityRank(row.priority) > priorityRank(top) ? row.priority : top),
      rows[0]?.priority || "NON_URGENT"
    );
  }, [filteredQueue, priorityRank]);

  const aiEnabled = useMemo(
    () =>
      !!selectedVisit?.id &&
      selectedVisit.status === "IN_CONSULTATION" &&
      !!triage?.chief_complaint,
    [selectedVisit, triage?.chief_complaint]
  );

  const complaintQuestions = useMemo(() => {
    if (questionnaireQuestions.length > 0) return questionnaireQuestions;
    if (selectedVisit?.status === "IN_CONSULTATION") return [];
    return fallbackComplaintQuestions(triage?.chief_complaint || "");
  }, [questionnaireQuestions, selectedVisit?.status, triage?.chief_complaint]);

  const pendingLabVisits = useMemo(() => {
    const rows = Array.isArray(labPendingRequests) ? labPendingRequests : [];
    return rows.filter((visit) => {
      const hasResult = !!String(visit?.lab_result_text || "").trim();
      const statusReady = isLabReadyStatus(visit?.lab_result_status);
      const isMine = Number(visit?.doctor_id) === Number(meId);
      return !!visit?.lab_requested && !hasResult && !statusReady && isMine;
    });
  }, [isLabReadyStatus, labPendingRequests, meId]);

  const doctorLabReadyResults = useMemo(() => {
    const rows = Array.isArray(labReadyResults) ? labReadyResults : [];
    return rows.filter((visit) => {
      const isMine = Number(visit?.doctor_id) === Number(meId);
      const hasResult = !!String(visit?.lab_result_text || "").trim();
      const statusReady = isLabReadyStatus(visit?.lab_result_status);
      return isMine && (hasResult || statusReady);
    });
  }, [isLabReadyStatus, labReadyResults, meId]);

  const doctorLabFollowupQueueRows = useMemo(
    () =>
      (Array.isArray(queue) ? queue : []).filter(
        (visit) => Number(visit?.doctor_id) === Number(meId) && isLabWorkflowVisit(visit)
      ),
    [isLabWorkflowVisit, meId, queue]
  );

  const doctorLabWorklistRows = useMemo(
    () =>
      buildDoctorLabWorklistRows({
        pendingLabVisits,
        doctorLabReadyResults,
        doctorLabFollowupQueueRows,
        isLabReadyStatus,
        queue,
        labPendingRequests,
        toSafeDate,
        estimateExamReadyMeta,
        countQueuedExamsOnSameMachine,
        formatLabDateTimeLabel,
        formatEtaPt,
      }),
    [
      doctorLabFollowupQueueRows,
      doctorLabReadyResults,
      isLabReadyStatus,
      labPendingRequests,
      pendingLabVisits,
      queue,
    ]
  );

  const pendingDoctorLabRows = useMemo(
    () => doctorLabWorklistRows.filter((row) => !row.is_ready),
    [doctorLabWorklistRows]
  );
  const readyDoctorLabRows = useMemo(
    () => doctorLabWorklistRows.filter((row) => row.is_ready),
    [doctorLabWorklistRows]
  );

  const currentLabEtaPreview = useMemo(() => {
    if (!planDraft?.lab_requested) return null;
    const examType = String(planDraft?.lab_exam_type || "").trim();
    if (!examType) return null;
    const examKey = String(examType || "").toUpperCase();
    const collectionRule = LAB_RETURN_COLLECTION_RULES[examKey] || null;
    const scheduledCollectionAt = collectionRule
      ? (() => {
          const nextBusinessStart = getLabWindowStart(new Date());
          nextBusinessStart.setDate(nextBusinessStart.getDate() + 1);
          const alignedDate = moveToNextLabBusinessStart(nextBusinessStart);
          return `${alignedDate.toISOString().slice(0, 10)}T${String(
            collectionRule.window || "07:30-10:00"
          ).slice(0, 5)}:00`;
        })()
      : null;
    const requestedAt = planDraft?.lab_sample_collected_at || new Date().toISOString();
    const hospitalTrafficCount = Math.max(
      0,
      (Array.isArray(queue) ? queue.length : 0) +
        (Array.isArray(labPendingRequests) ? labPendingRequests.length : 0)
    );
    const { etaMin, readyAt } = estimateExamReadyMeta({
      examType,
      requestedAt,
      pendingCount: Math.max(1, pendingLabVisits.length + 1),
      sampleCollectedAt: planDraft?.lab_sample_collected_at || null,
      scheduledCollectionAt,
      sameMachinePendingCount: countQueuedExamsOnSameMachine(examType, labPendingRequests),
      hospitalTrafficCount,
    });
    return {
      etaMin,
      readyAtISO: readyAt.toISOString(),
      readyAtLabel: formatLabDateTimeLabel(readyAt),
    };
  }, [
    labPendingRequests,
    pendingLabVisits.length,
    planDraft?.lab_exam_type,
    planDraft?.lab_requested,
    planDraft?.lab_sample_collected_at,
    queue,
  ]);

  const labRequestSupport = useMemo(
    () => inferLabRequestSupport({ triage, planDraft, selectedVisit }),
    [triage, planDraft, selectedVisit]
  );

  const selectedLabCollectionRule = useMemo(() => {
    const examKey = String(planDraft?.lab_exam_type || "").toUpperCase();
    if (!planDraft?.lab_requested || !examKey) return null;
    return LAB_RETURN_COLLECTION_RULES[examKey] || null;
  }, [planDraft?.lab_exam_type, planDraft?.lab_requested]);

  const hasGeneratedQuestionnaire = useMemo(
    () => questionnaireQuestions.filter(Boolean).length > 0,
    [questionnaireQuestions]
  );

  const hasGeneratedAiSuggestion = useMemo(() => {
    const ai = selectedVisit?.doctor_questionnaire_json?.ai_suggestion;
    if (!ai || typeof ai !== "object") return false;
    return !!(
      String(ai?.summary || "").trim() ||
      String(ai?.likely_diagnosis || "").trim() ||
      String(ai?.clinical_reasoning || "").trim() ||
      (Array.isArray(ai?.differential_diagnoses) && ai.differential_diagnoses.length > 0)
    );
  }, [selectedVisit?.doctor_questionnaire_json]);

  const agendaAssignedTodayCount = useMemo(() => {
    const rows = Array.isArray(agenda?.assigned_today) ? agenda.assigned_today : [];
    const today = new Date();
    return rows.filter((visit) => isSameLocalDay(visit?.arrival_time, today)).length;
  }, [agenda]);

  const agendaReturnsTodayCount = useMemo(() => {
    const rows = Array.isArray(agenda?.returns_today) ? agenda.returns_today : [];
    const today = new Date();
    return rows.filter((visit) => {
      if (String(visit?.status || "").toUpperCase() === "CANCELLED") return false;
      return isSameLocalDay(visit?.return_visit_date || visit?.date || visit?.arrival_time, today);
    }).length;
  }, [agenda]);

  const agendaTodayCount = agendaAssignedTodayCount + agendaReturnsTodayCount;
  const departmentQueue = useMemo(() => (Array.isArray(queue) ? queue : []), [queue]);
  const myAssignedQueue = useMemo(
    () => filteredQueue.filter((visit) => Number(visit?.doctor_id) === Number(meId)),
    [filteredQueue, meId]
  );
  const activeAlertRows = useMemo(
    () => filteredQueue.filter((visit) => String(visit?.priority || "").toUpperCase() === "URGENT"),
    [filteredQueue]
  );
  const activeAlertCount = activeAlertRows.length;
  const isHistoryView = activeView === "clinicalHistory";
  const isAgendaView = activeView === "agendaToday";
  const isLabView = activeView === "labOrdered";
  const queueRowsForView = activeView === "myPatients" ? myAssignedQueue : departmentQueue;

  const dashboardFocusQueue = myAssignedQueue.length > 0 ? myAssignedQueue : filteredQueue;
  const dashboardPriorityRows = useMemo(
    () => buildDoctorDashboardPriorityRows({ filteredQueue, dashboardPriorityMeta }),
    [filteredQueue, dashboardPriorityMeta]
  );
  const dashboardStatusRows = useMemo(
    () =>
      buildDoctorDashboardStatusRows({
        filteredQueueLength: filteredQueue.length,
        waitingCount,
        inConsultCount,
        activeAlertCount,
      }),
    [activeAlertCount, filteredQueue.length, inConsultCount, waitingCount]
  );
  const dashboardNextPatients = useMemo(
    () => buildDoctorDashboardNextPatients({ dashboardFocusQueue, dashboardPriorityMeta }),
    [dashboardFocusQueue, dashboardPriorityMeta]
  );
  const dashboardHourSeries = useMemo(
    () => buildDoctorDashboardHourSeries({ assignedToday: agenda?.assigned_today }),
    [agenda]
  );
  const dashboardAlertPreview = useMemo(
    () => buildDoctorDashboardAlertPreview({ activeAlertRows, formatStatus: (status) => status }),
    [activeAlertRows]
  );

  const shiftEndIso = shiftStatus?.extended_until || shiftStatus?.scheduled_end || null;
  const shiftRemainingMs = useMemo(() => {
    if (!shiftStatus?.clock_in_at || !shiftEndIso) return null;
    const endTs = new Date(shiftEndIso).getTime();
    if (!Number.isFinite(endTs)) return null;
    return Math.max(0, endTs - nowTs);
  }, [nowTs, shiftEndIso, shiftStatus?.clock_in_at]);

  const shiftRemainingLabel = useMemo(() => {
    if (shiftRemainingMs == null) return null;
    const totalSec = Math.floor(shiftRemainingMs / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [shiftRemainingMs]);

  const shiftIsActive = Boolean(shiftStatus?.is_on_shift);
  const shiftStartDisabled = loadingShift || startingShift || shiftIsActive;
  const shiftMenuBusy = startingShift;
  const shiftHasStartedToday = Boolean(shiftStatus?.has_started_today ?? shiftStatus?.clock_in_at);
  const shiftIcon = getShiftIcon(shiftStatus?.shift_type);

  const shiftButtonMeta = useMemo(() => {
    if (!shiftFeatureAvailable) {
      return {
        label: "Turno",
        detail: "Indisponivel",
        background: "#f3f4f6",
        border: "#e5e7eb",
        color: "#4b5563",
        dot: "#9ca3af",
      };
    }
    if (loadingShift) {
      return {
        label: "Turno",
        detail: "A carregar...",
        background: "#f3f4f6",
        border: "#e5e7eb",
        color: "#4b5563",
        dot: "#9ca3af",
      };
    }
    if (shiftIsActive) {
      return {
        label: "Em turno",
        detail: shiftRemainingLabel ? `Restam ${shiftRemainingLabel}` : "Ativo",
        background: "#ecfdf3",
        border: "#86efac",
        color: "#166534",
        dot: "#22c55e",
      };
    }
    if (!shiftHasStartedToday) {
      return {
        label: "Turno",
        detail: "Nao iniciado",
        background: "#f8fafc",
        border: "#d1d5db",
        color: "#475569",
        dot: "#94a3b8",
      };
    }
    return {
      label: "Turno",
      detail: "Encerrado",
      background: "#f8fafc",
      border: "#d1d5db",
      color: "#475569",
      dot: "#94a3b8",
    };
  }, [
    loadingShift,
    shiftFeatureAvailable,
    shiftHasStartedToday,
    shiftIsActive,
    shiftRemainingLabel,
  ]);

  const navSections = useMemo(
    () =>
      buildDoctorNavSections({
        myAssignedCount: myAssignedQueue.length,
        waitingCount,
        agendaTodayCount,
        agendaReturnsTodayCount,
        doctorLabWorklistCount: doctorLabWorklistRows.length,
        activeAlertCount,
        notificationsUnread,
      }),
    [
      activeAlertCount,
      agendaReturnsTodayCount,
      agendaTodayCount,
      doctorLabWorklistRows.length,
      myAssignedQueue.length,
      notificationsUnread,
      waitingCount,
    ]
  );

  const validViews = useMemo(
    () =>
      new Set([
        "dashboard",
        "myPatients",
        "waitingQueue",
        "clinicalHistory",
        "agendaToday",
        "scheduledFollowups",
        "labOrdered",
        "activeAlerts",
        "notifications",
        "preferences",
        "consultationForm",
      ]),
    []
  );

  return {
    isLabReadyStatus,
    isLabWorkflowVisit,
    filteredQueue,
    waitingCount,
    inConsultCount,
    priorityTheme,
    waitingTopPriority,
    inConsultTopPriority,
    aiEnabled,
    complaintQuestions,
    pendingLabVisits,
    doctorLabReadyResults,
    doctorLabFollowupQueueRows,
    doctorLabWorklistRows,
    pendingDoctorLabRows,
    readyDoctorLabRows,
    currentLabEtaPreview,
    labRequestSupport,
    selectedLabCollectionRule,
    hasGeneratedQuestionnaire,
    hasGeneratedAiSuggestion,
    agendaAssignedTodayCount,
    agendaReturnsTodayCount,
    agendaTodayCount,
    departmentQueue,
    myAssignedQueue,
    activeAlertRows,
    activeAlertCount,
    isHistoryView,
    isAgendaView,
    isLabView,
    queueRowsForView,
    validViews,
    dashboardPriorityRows,
    dashboardStatusRows,
    dashboardNextPatients,
    dashboardHourSeries,
    dashboardAlertPreview,
    shiftEndIso,
    shiftRemainingMs,
    shiftRemainingLabel,
    shiftIsActive,
    shiftStartDisabled,
    shiftMenuBusy,
    shiftHasStartedToday,
    shiftIcon,
    shiftButtonMeta,
    navSections,
  };
}
