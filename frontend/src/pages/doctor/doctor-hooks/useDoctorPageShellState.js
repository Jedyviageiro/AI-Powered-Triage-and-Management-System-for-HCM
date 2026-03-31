import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { makeEmptyPlanDraft } from "../doctor-helpers/doctorHelpers";

export function useDoctorPageShellState(initialActiveView = "dashboard") {
  const navListRef = useRef(null);
  const navItemRefs = useRef({});
  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const mountedRef = useRef(true);
  const detailsPanelRef = useRef(null);
  const labOrderCardRef = useRef(null);
  const shiftMenuRef = useRef(null);
  const notificationsPreviewRef = useRef(null);
  const historySearchRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState(initialActiveView);
  const [navIndicator, setNavIndicator] = useState({ top: 0, height: 0, opacity: 0 });
  const [topNavSearch, setTopNavSearch] = useState("");
  const [topSearchFocus, setTopSearchFocus] = useState(false);
  const [consultFormStep, setConsultFormStep] = useState(1);
  const [shiftStatus, setShiftStatus] = useState(null);
  const [shiftFeatureAvailable, setShiftFeatureAvailable] = useState(true);
  const [loadingShift, setLoadingShift] = useState(false);
  const [shiftMenuOpen, setShiftMenuOpen] = useState(false);
  const [startingShift, setStartingShift] = useState(false);
  const [_stoppingShift, _setStoppingShift] = useState(false);
  const [_extendingShift, _setExtendingShift] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const [queue, setQueue] = useState([]);
  const [labPendingRequests, setLabPendingRequests] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [agenda, setAgenda] = useState({ assigned_today: [], returns_today: [] });
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [err, setErr] = useState("");

  const [selectedVisit, setSelectedVisit] = useState(null);
  const [_reevaluationContext, setReevaluationContext] = useState(null);
  const [triage, setTriage] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [_loadingDetails, setLoadingDetails] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiSuggestionOpen, setAiSuggestionOpen] = useState(false);
  const [planDraft, setPlanDraft] = useState(makeEmptyPlanDraft());
  const [planAccepted, setPlanAccepted] = useState(false);
  const [_popup, setPopup] = useState({
    open: false,
    type: "warning",
    title: "",
    message: "",
  });
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [useAIQuestionnaire, setUseAIQuestionnaire] = useState(false);
  const [questionnaireQuestions, setQuestionnaireQuestions] = useState([]);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [questionnaireExtraNote, setQuestionnaireExtraNote] = useState("");
  const [questionnaireNotice, setQuestionnaireNotice] = useState("");
  const [retakeVitals, setRetakeVitals] = useState({
    temperature: "",
    heart_rate: "",
    respiratory_rate: "",
    oxygen_saturation: "",
    weight: "",
  });
  const [returnVisitCount, setReturnVisitCount] = useState(1);
  const [returnVisitDates, setReturnVisitDates] = useState([""]);
  const [followUpRuleKey, setFollowUpRuleKey] = useState("");
  const [followUpDiagnosisEvolution, setFollowUpDiagnosisEvolution] = useState("");
  const [followUpPrescriptionDecision, setFollowUpPrescriptionDecision] = useState("");
  const [selectedRoomCode, setSelectedRoomCode] = useState("");
  const [labOrderDraft, setLabOrderDraft] = useState({
    priority: "",
    clinicalReason: "",
    specialInstructions: "",
  });
  const [labOrderConfirmed, setLabOrderConfirmed] = useState(false);
  const [sampleCollectionDraft, setSampleCollectionDraft] = useState({
    collectedNow: false,
    collectionTime: "",
    collectorName: "",
    sampleCondition: "ADEQUADA",
    notes: "",
  });
  const [sampleCollectionModalOpen, setSampleCollectionModalOpen] = useState(false);
  const [autoOpenSampleCollectionModal, setAutoOpenSampleCollectionModal] = useState(false);
  const [openModernSelect, setOpenModernSelect] = useState(null);
  const [highlightLabOrderCard, setHighlightLabOrderCard] = useState(false);
  const [labReadyResults, setLabReadyResults] = useState([]);
  const [labResultModal, setLabResultModal] = useState({
    open: false,
    row: null,
    loading: false,
    explanation: "",
    error: "",
  });

  useEffect(() => {
    setActiveView((current) => (current === initialActiveView ? current : initialActiveView));
  }, [initialActiveView]);

  useLayoutEffect(() => {
    const updateNavIndicator = () => {
      const navEl = navListRef.current;
      const activeEl = navItemRefs.current?.[activeView];
      if (!navEl || !activeEl) {
        setNavIndicator((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      const itemRect = activeEl.getBoundingClientRect();
      const navRect = navEl.getBoundingClientRect();
      setNavIndicator({
        top: itemRect.top - navRect.top,
        height: itemRect.height,
        opacity: 1,
      });
    };

    updateNavIndicator();
    window.addEventListener("resize", updateNavIndicator);
    return () => window.removeEventListener("resize", updateNavIndicator);
  }, [activeView, sidebarOpen]);

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const showPopup = useCallback(
    (type, title, message) => {
      safeSet(() => setPopup({ open: true, type, title, message }));
    },
    [safeSet]
  );

  const closePopup = useCallback(() => {
    safeSet(() => setPopup({ open: false, type: "warning", title: "", message: "" }));
  }, [safeSet]);

  return {
    navListRef,
    navItemRefs,
    intervalRef,
    heartbeatRef,
    mountedRef,
    detailsPanelRef,
    labOrderCardRef,
    shiftMenuRef,
    notificationsPreviewRef,
    historySearchRef,
    sidebarOpen,
    setSidebarOpen,
    activeView,
    setActiveView,
    navIndicator,
    topNavSearch,
    setTopNavSearch,
    topSearchFocus,
    setTopSearchFocus,
    consultFormStep,
    setConsultFormStep,
    shiftStatus,
    setShiftStatus,
    shiftFeatureAvailable,
    setShiftFeatureAvailable,
    loadingShift,
    setLoadingShift,
    shiftMenuOpen,
    setShiftMenuOpen,
    startingShift,
    setStartingShift,
    nowTs,
    setNowTs,
    queue,
    setQueue,
    labPendingRequests,
    setLabPendingRequests,
    loadingQueue,
    setLoadingQueue,
    agenda,
    setAgenda,
    loadingAgenda,
    setLoadingAgenda,
    err,
    setErr,
    selectedVisit,
    setSelectedVisit,
    setReevaluationContext,
    triage,
    setTriage,
    patientDetails,
    setPatientDetails,
    patientHistory,
    setPatientHistory,
    setLoadingDetails,
    aiLoading,
    setAiLoading,
    aiResult,
    setAiResult,
    aiSuggestionOpen,
    setAiSuggestionOpen,
    planDraft,
    setPlanDraft,
    planAccepted,
    setPlanAccepted,
    popup: _popup,
    closePopup,
    questionnaireLoading,
    setQuestionnaireLoading,
    useAIQuestionnaire,
    setUseAIQuestionnaire,
    questionnaireQuestions,
    setQuestionnaireQuestions,
    questionnaireAnswers,
    setQuestionnaireAnswers,
    questionnaireExtraNote,
    setQuestionnaireExtraNote,
    questionnaireNotice,
    setQuestionnaireNotice,
    retakeVitals,
    setRetakeVitals,
    returnVisitCount,
    setReturnVisitCount,
    returnVisitDates,
    setReturnVisitDates,
    followUpRuleKey,
    setFollowUpRuleKey,
    followUpDiagnosisEvolution,
    setFollowUpDiagnosisEvolution,
    followUpPrescriptionDecision,
    setFollowUpPrescriptionDecision,
    selectedRoomCode,
    setSelectedRoomCode,
    labOrderDraft,
    setLabOrderDraft,
    labOrderConfirmed,
    setLabOrderConfirmed,
    sampleCollectionDraft,
    setSampleCollectionDraft,
    sampleCollectionModalOpen,
    setSampleCollectionModalOpen,
    autoOpenSampleCollectionModal,
    setAutoOpenSampleCollectionModal,
    openModernSelect,
    setOpenModernSelect,
    highlightLabOrderCard,
    setHighlightLabOrderCard,
    labReadyResults,
    setLabReadyResults,
    labResultModal,
    setLabResultModal,
    safeSet,
    showPopup,
  };
}
