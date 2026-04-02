import { useLayoutEffect, useRef, useState } from "react";
import {
  DEFAULT_PREFERENCES,
  createPastVisitModalState,
  loadLocalNotificationReadMap,
} from "../nurse-helpers/nurseHelpers";

export function useNursePageShellState() {
  const navListRef = useRef(null);
  const navItemRefs = useRef({});
  const notificationsPreviewRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("home");
  const [navIndicator, setNavIndicator] = useState({ top: 0, height: 0, opacity: 0 });

  const [searchMode, setSearchMode] = useState("CODE");
  const [code, setCode] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [topNavSearch, setTopNavSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [err, setErr] = useState("");
  const [patient, setPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);

  const [pClinicalCode, setPClinicalCode] = useState("");
  const [pFullName, setPFullName] = useState("");
  const [pSex, setPSex] = useState("M");
  const [pBirthDate, setPBirthDate] = useState("");
  const [pGuardianName, setPGuardianName] = useState("");
  const [pGuardianPhone, setPGuardianPhone] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);

  const [visit, setVisit] = useState(null);
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [forceTriageForLabFollowup, setForceTriageForLabFollowup] = useState(false);

  const [temperature, setTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respRate, setRespRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weight, setWeight] = useState("");
  const [generalState, setGeneralState] = useState("");
  const [needsOxygen, setNeedsOxygen] = useState(false);
  const [suspectedSevereDehydration, setSuspectedSevereDehydration] = useState(false);
  const [excessiveLethargy, setExcessiveLethargy] = useState(false);
  const [difficultyMaintainingSitting, setDifficultyMaintainingSitting] = useState(false);
  const [historySyncopeCollapse, setHistorySyncopeCollapse] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [priority, setPriority] = useState("URGENT");
  const [customMaxWait, setCustomMaxWait] = useState("");
  const [savingTriage, setSavingTriage] = useState(false);
  const [holdInWaitingLine, setHoldInWaitingLine] = useState(false);
  const [bypassToER, setBypassToER] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [queue, setQueue] = useState([]);
  const [queueSummary, setQueueSummary] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [shiftStatus, setShiftStatus] = useState(null);
  const [loadingShift, setLoadingShift] = useState(false);
  const [startingShift, setStartingShift] = useState(false);
  const [_extendingShift, _setExtendingShift] = useState(false);
  const [_stoppingShift, _setStoppingShift] = useState(false);
  const [shiftMenuOpen, setShiftMenuOpen] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [queueErr, setQueueErr] = useState("");
  const [pastVisits, setPastVisits] = useState([]);
  const [loadingPastVisits, setLoadingPastVisits] = useState(false);
  const [destinationNotes, setDestinationNotes] = useState({});
  const [destinationPlacement, setDestinationPlacement] = useState({});
  const [destinationSavingId, setDestinationSavingId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [localNotificationReads, setLocalNotificationReads] = useState(() =>
    loadLocalNotificationReadMap()
  );
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsPreviewOpen, setNotificationsPreviewOpen] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [roomSettings, setRoomSettings] = useState({
    urgent_room_total: 4,
    standard_room_total: 4,
    quick_room_total: 4,
    urgent_room_description: "Para casos criticos com necessidade de monitorizacao continua.",
    standard_room_description: "Para casos moderados sem necessidade de cuidados intensivos.",
    quick_room_description: "Para casos leves sem necessidade de monitorizacao ou acesso IV.",
    urgent_room_tags: ["monitor", "oxigenio", "iv"],
    standard_room_tags: ["consulta", "observacao", "avaliacao"],
    quick_room_tags: ["rapido", "leve", "sem-iv"],
    urgent_room_labels: [],
    standard_room_labels: [],
    quick_room_labels: [],
  });
  const [loadingRoomSettings, setLoadingRoomSettings] = useState(false);

  const [popup, setPopup] = useState({ open: false, type: "warning", title: "", message: "" });
  const [confirmPopup, setConfirmPopup] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirmar",
    onConfirm: null,
    busy: false,
  });
  const [pastVisitModal, setPastVisitModal] = useState(() => createPastVisitModalState());
  const [patientEditModal, setPatientEditModal] = useState({
    open: false,
    loading: false,
    saving: false,
    page: "patient",
    visitId: null,
    patientId: null,
    clinical_code: "",
    full_name: "",
    sex: "M",
    birth_date: "",
    guardian_name: "",
    guardian_phone: "",
    triageLoading: false,
    triageSaving: false,
    triageId: null,
    triage_temperature: "",
    triage_heart_rate: "",
    triage_respiratory_rate: "",
    triage_oxygen_saturation: "",
    triage_weight: "",
    triage_chief_complaint: "",
    triage_clinical_notes: "",
    triage_general_state: "",
    triage_needs_oxygen: false,
    triage_suspected_severe_dehydration: false,
    triage_excessive_lethargy: false,
    triage_difficulty_maintaining_sitting: false,
    triage_history_syncope_collapse: false,
    triage_priority: "URGENT",
    triage_max_wait_minutes: "",
  });
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [triageStep, setTriageStep] = useState(1);

  const showPopup = (type, title, message) => setPopup({ open: true, type, title, message });
  const closePopup = () => {
    setPopup({ open: false, type: "warning", title: "", message: "" });
    setErr("");
    setQueueErr("");
  };
  const openConfirmPopup = ({ title, message, confirmLabel = "Confirmar", onConfirm }) =>
    setConfirmPopup({ open: true, title, message, confirmLabel, onConfirm, busy: false });
  const closeConfirmPopup = () =>
    setConfirmPopup({
      open: false,
      title: "",
      message: "",
      confirmLabel: "Confirmar",
      onConfirm: null,
      busy: false,
    });
  const openPastVisitModal = (visitRow) =>
    setPastVisitModal(createPastVisitModalState(visitRow || null));
  const closePastVisitModal = () => setPastVisitModal(createPastVisitModalState());

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

  return {
    navListRef,
    navItemRefs,
    notificationsPreviewRef,
    sidebarOpen,
    setSidebarOpen,
    activeView,
    setActiveView,
    navIndicator,
    searchMode,
    setSearchMode,
    code,
    setCode,
    nameQuery,
    setNameQuery,
    topNavSearch,
    setTopNavSearch,
    searchResults,
    setSearchResults,
    searchLoading,
    setSearchLoading,
    err,
    setErr,
    patient,
    setPatient,
    patientHistory,
    setPatientHistory,
    pClinicalCode,
    setPClinicalCode,
    pFullName,
    setPFullName,
    pSex,
    setPSex,
    pBirthDate,
    setPBirthDate,
    pGuardianName,
    setPGuardianName,
    pGuardianPhone,
    setPGuardianPhone,
    creatingPatient,
    setCreatingPatient,
    visit,
    setVisit,
    creatingVisit,
    setCreatingVisit,
    forceTriageForLabFollowup,
    setForceTriageForLabFollowup,
    temperature,
    setTemperature,
    heartRate,
    setHeartRate,
    respRate,
    setRespRate,
    spo2,
    setSpo2,
    weight,
    setWeight,
    generalState,
    setGeneralState,
    needsOxygen,
    setNeedsOxygen,
    suspectedSevereDehydration,
    setSuspectedSevereDehydration,
    excessiveLethargy,
    setExcessiveLethargy,
    difficultyMaintainingSitting,
    setDifficultyMaintainingSitting,
    historySyncopeCollapse,
    setHistorySyncopeCollapse,
    chiefComplaint,
    setChiefComplaint,
    clinicalNotes,
    setClinicalNotes,
    priority,
    setPriority,
    customMaxWait,
    setCustomMaxWait,
    savingTriage,
    setSavingTriage,
    holdInWaitingLine,
    setHoldInWaitingLine,
    bypassToER,
    setBypassToER,
    aiLoading,
    setAiLoading,
    aiSuggestion,
    setAiSuggestion,
    doctors,
    setDoctors,
    loadingDoctors,
    setLoadingDoctors,
    selectedDoctorId,
    setSelectedDoctorId,
    assigning,
    setAssigning,
    queue,
    setQueue,
    queueSummary,
    setQueueSummary,
    loadingQueue,
    setLoadingQueue,
    shiftStatus,
    setShiftStatus,
    loadingShift,
    setLoadingShift,
    startingShift,
    setStartingShift,
    shiftMenuOpen,
    setShiftMenuOpen,
    nowTs,
    setNowTs,
    queueErr,
    setQueueErr,
    pastVisits,
    setPastVisits,
    loadingPastVisits,
    setLoadingPastVisits,
    destinationNotes,
    setDestinationNotes,
    destinationPlacement,
    setDestinationPlacement,
    destinationSavingId,
    setDestinationSavingId,
    notifications,
    setNotifications,
    localNotificationReads,
    setLocalNotificationReads,
    loadingNotifications,
    setLoadingNotifications,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    preferences,
    setPreferences,
    loadingPreferences,
    setLoadingPreferences,
    savingPreferences,
    setSavingPreferences,
    roomSettings,
    setRoomSettings,
    loadingRoomSettings,
    setLoadingRoomSettings,
    popup,
    setPopup,
    showPopup,
    closePopup,
    confirmPopup,
    setConfirmPopup,
    openConfirmPopup,
    closeConfirmPopup,
    pastVisitModal,
    setPastVisitModal,
    openPastVisitModal,
    closePastVisitModal,
    patientEditModal,
    setPatientEditModal,
    pdfLoadingId,
    setPdfLoadingId,
    triageStep,
    setTriageStep,
  };
}
