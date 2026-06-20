import { NurseShiftReportView } from "../nurse-shift-report/NurseShiftReport";
import { NurseDashboardView } from "../nurse-dashboard/NurseDashboard";
import { NurseNotificationsView } from "../nurse-configuracao/NurseNotifications";
import { NursePreferencesView } from "../nurse-configuracao/NursePreferences";
import { NurseDestinationView } from "../nurse-destination/NurseDestination";
import { NurseDoctorsView } from "../nurse-doctors/NurseDoctors";
import { NurseQueueView } from "../nurse-triage/NurseQueue";
import { NurseNewTriageView } from "../nurse-triage/NurseNewTriage";
import { NursePatientsInTriageView } from "../nurse-triage/NursePatientsInTriage";
import { NursePatientsView } from "../nurse-patients/NursePatients";
import { NurseQuickSearchView } from "../nurse-triage/NurseQuickSearch";
import { NurseRoomsAvailableView } from "../nurse-rooms/NurseRoomsAvailable";
import {
  PastVisitHistoryModal,
  VisitPdfTemplateModal,
} from "../nurse-patients/PastVisitHistoryModal";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";
import { HeaderBackButton } from "../../../components/shared/layout/HeaderControls.jsx";

export function NurseLayout(props) {
  const {
    me,
    preferences,
    navListRef,
    navItemRefs,
    sidebarOpen,
    setSidebarOpen,
    navSections,
    activeView,
    navIndicator,
    openView,
    notificationsPreviewRef,
    notificationsUnread,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    latestNotification,
    markNotificationRead,
    totalQueue,
    urgentCount,
    weeklyData,
    availableDoctors,
    busyDoctors,
    inTriageCount,
    recentQueueItems,
    openPastVisitModal,
    pdfLoadingId,
    downloadVisitPdf,
    pdfTemplateModal,
    openVisitPdfTemplateModal,
    closeVisitPdfTemplateModal,
    setVisitPdfTemplate,
    generateVisitPdfFromTemplate,
    queue,
    queueSummary,
    pastVisits,
    shiftStatus,
    loadingQueue,
    loadingPastVisits,
    loadDoctors,
    loadQueue,
    loadPastVisits,
    loadShiftStatus,
    destinationRows,
    inferHospitalStatus,
    formatRelativeUpdate,
    destinationSavingId,
    destinationPlacement,
    setDestinationPlacement,
    destinationNotes,
    setDestinationNotes,
    downloadDischargeSummaryPdf,
    registerAdmissionPlacement,
    updateDestinationStatus,
    filteredNotifications,
    loadingNotifications,
    loadNotifications,
    markAllNotificationsRead,
    loadingPreferences,
    savingPreferences,
    savePreferences,
    previewPreferences,
    onLogout: logout,
    triageSteps,
    getStepStatus,
    triageStep,
    setTriageStep,
    searchMode,
    setSearchMode,
    code,
    setCode,
    nameQuery,
    setNameQuery,
    searchPatient: searchPatientByMode,
    searchLoading,
    searchResults,
    setPatient,
    setAiSuggestion,
    setVisit,
    setSelectedDoctorId,
    setForceTriageForLabFollowup,
    patient,
    patientAgeYears,
    latestRecordedWeight,
    patientLabFollowup,
    visit,
    forceTriageForLabFollowup,
    createVisit: createVisitForCurrentPatient,
    creatingVisit,
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
    pAltPhone,
    setPAltPhone,
    pAddress,
    setPAddress,
    createPatient,
    creatingPatient,
    resetAll,
    skipTriageReturnEligible,
    GENERAL_STATE_OPTIONS,
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
    temperature,
    setTemperature,
    spo2,
    setSpo2,
    heartRate,
    setHeartRate,
    respRate,
    setRespRate,
    weight,
    setWeight,
    chiefComplaint,
    setChiefComplaint,
    clinicalNotes,
    setClinicalNotes,
    PRIORITIES,
    priority,
    setPriority,
    customMaxWait,
    setCustomMaxWait,
    selectedPriority,
    aiSuggestion,
    aiShortReason,
    aiLoading,
    priorityLabel,
    recommendedRoomLabel,
    bypassToER,
    hasRoomAvailable,
    assignableDoctors,
    doctorQueueEtaById,
    selectedDoctorId,
    assignDoctor,
    assigning,
    hasDoctorAvailable,
    erBypassRecommended,
    erBypassReasons,
    holdInWaitingLine,
    setHoldInWaitingLine,
    setBypassToER,
    saveTriage,
    savingTriage,
    roomInventory,
    doctors,
    patientByVisitId,
    triageQueueRows,
    triageUrgentQueue,
    triageNonUrgentQueue,
    urgentQueue,
    nonUrgentQueue,
    waitingQueueSections,
    getQueueRowBg,
    openPatientEditModal,
    removeVisitTriageFromQueue,
    isLabOrReturnQueueRow,
    getQueueActionMeta,
    statusLabelForVisit,
    topNavSearch,
    setTopNavSearch,
    searchFromTopNav,
    setActiveView,
    inferVitalStatus,
    loadingDoctors,
    setPatientEditModal,
    popup,
    closePopup,
    confirmPopup,
    closeConfirmPopup,
    confirmPopupAction,
    pastVisitModal,
    pastVisitProfileName,
    pastVisitProfileCode,
    pastVisitProfileDob,
    pastVisitProfileAge,
    pastVisitProfileGuardian,
    pastVisitProfilePhone,
    pastVisitProfileAddress,
    pastVisitProfilePhoto,
    pastVisitTimeline,
    setPastVisitModal,
    startPastVisitPatientEdit,
    savePastVisitPatientEdit,
    closePastVisitModal,
    patientEditModal,
    closePatientEditModal,
    savePatientEdit,
    saveQueueTriageEdit,
  } = props;
  const nurseFirstName = me?.full_name?.split(" ")?.[0] || "Ana";
  const todayLabel = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .formatToParts(new Date())
    .map((part) =>
      part.type === "weekday" || part.type === "month"
        ? `${part.value.charAt(0).toUpperCase()}${part.value.slice(1)}`
        : part.value
    )
    .join("");
  const compactNavLabelFor = (item) => {
    const key = String(item?.key || "");
    const label = String(item?.label || "").toLowerCase();
    if (key === "shiftReport") return null;
    if (key === "notifications") return "Notifica\u00e7\u00f5es";
    if (key === "patients") return "Pacientes Antigos";
    if (key === "doctors") return "M\u00e9dicos";
    if (key === "preferences") return "Configura\u00e7\u00f5es";
    if (label.includes("notifica")) return "Notifica\u00e7\u00f5es";
    if (label.includes("medicos") || label.includes("dicos")) return "M\u00e9dicos";
    if (label.includes("relat")) return null;
    if (label.includes("config")) return "Configura\u00e7\u00f5es";
    if (key === "notifications" || label.includes("notifica")) return "Notificações";
    if (key === "shiftReport" || label.includes("relat")) return null;
    if (key === "notifications" || label.includes("notifica")) return "NotificaÃ§Ãµes";
    if (key === "home" || label.includes("dashboard")) return "Dashboard";
    if (key === "newTriage" || label.includes("nova triagem") || label === "triagem") return "Triagem";
    if (key === "queue" || label.includes("fila")) return "Fila de Espera";
    if (key === "patientsInTriage" || label.includes("pacientes em triag")) return "Pacientes";
    if (key === "doctors" || label.includes("médicos") || label.includes("medicos")) return "Médicos";
    if (key === "roomsAvailable" || label.includes("quartos") || label.includes("consult")) return "Quartos";
    if (key === "shiftReport" || label.includes("relatório") || label.includes("relatorio")) return null;
    if (key === "preferences" || label.includes("config")) return "Configurações";
    return null;
  };
  const sidebarNavOrder = {
    home: 0,
    newTriage: 1,
    patientsInTriage: 2,
    queue: 3,
    doctors: 4,
    roomsAvailable: 5,
    patients: 6,
    notifications: 7,
    preferences: 8,
  };
  const sidebarNavItems = navSections
    .flatMap((section) => section.items || [])
    .filter(
      (item) =>
        item.key !== "logout" &&
        item.key !== "destination" &&
        item.key !== "shiftReport" &&
        compactNavLabelFor(item)
    )
    .sort((a, b) => (sidebarNavOrder[a.key] ?? 99) - (sidebarNavOrder[b.key] ?? 99));
  const sidebarIconFor = (key) => {
    const props = {
      className: "w-5 h-5 flex-shrink-0",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
    };
    switch (key) {
      case "home":
        return (
          <svg {...props}>
            <path d="m3 11 9-8 9 8" />
            <path d="M5 10v10h5v-6h4v6h5V10" />
          </svg>
        );
      case "newTriage":
        return (
          <svg {...props}>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
        );
      case "patientsInTriage":
      case "patients":
        return (
          <svg {...props}>
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20a6 6 0 0 1 12 0" />
            <path d="M16 11a3 3 0 1 0-1-5.83" />
            <path d="M18 20a5 5 0 0 0-4-4.9" />
          </svg>
        );
      case "queue":
        return (
          <svg {...props}>
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <path d="M9 4V3h6v1" />
            <path d="M9 12h6" />
            <path d="M12 9v6" />
          </svg>
        );
      case "doctors":
        return (
          <svg {...props}>
            <circle cx="12" cy="7" r="4" />
            <path d="M5 21a7 7 0 0 1 14 0" />
          </svg>
        );
      case "roomsAvailable":
        return (
          <svg {...props}>
            <path d="M4 8h16" />
            <path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
            <path d="M7 8v11" />
            <path d="M17 8v11" />
            <path d="M5 19h14" />
          </svg>
        );
      case "shiftReport":
        return (
          <svg {...props}>
            <path d="M7 3h7l5 5v13H7z" />
            <path d="M14 3v5h5" />
            <path d="M10 17v-4" />
            <path d="M13 17v-7" />
            <path d="M16 17v-2" />
          </svg>
        );
      case "preferences":
        return (
          <svg {...props}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      case "notifications":
        return (
          <svg {...props}>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        );
      default:
        return null;
    }
  };
  return (
    <div
      className={`triage-page flex h-screen ${
        Number(preferences?.font_scale_percent || 100) !== 100 ? "nurse-font-scaled" : ""
      }`}
      style={{
        "--nurse-page-bg": "#f7f8fa",
        background: "var(--nurse-page-bg)",
        "--nurse-font-scale": Number(preferences?.font_scale_percent || 100) === 105 ? 1.05 : 1,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { font-family: 'IBM Plex Sans', system-ui, sans-serif; box-sizing: border-box; }
        .triage-page button { border-radius: 8px !important; box-shadow: none !important; font-family: inherit; }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #165034;
          box-shadow: 0 0 0 3px rgba(22,80,52,0.12);
        }

        .sidebar { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); overflow: hidden; background: #ffffff; color: #101827; border-right: 1px solid #e7ebf0; box-shadow: none; }
        .sidebar-open { width: 190px; }
        .sidebar-closed { width: 76px; }
        .sidebar nav { overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(102,112,133,0.35) transparent; }
        .sidebar nav::-webkit-scrollbar { width: 8px; }
        .sidebar nav::-webkit-scrollbar-thumb { background: rgba(102,112,133,0.28); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        .sidebar button:focus { outline: none; }
        .sidebar-footer { flex: 0 0 auto; position: sticky; bottom: 0; background: #ffffff; z-index: 2; }
        .sidebar-closed nav { padding-left: 6px !important; padding-right: 6px !important; }
        .sidebar-closed .nav-item-wrap > button { justify-content: center; gap: 0 !important; padding-left: 8px !important; padding-right: 8px !important; }
        .sidebar-nav-btn { position: relative; border-radius: 8px !important; margin-left: 0; width: 100% !important; font-size: 12px !important; font-weight: 500; min-height: 36px !important; }
        .sidebar-nav-btn svg { width: 16px !important; height: 16px !important; }
        .sidebar-open .sidebar-nav-btn { padding-left: 13px !important; padding-right: 13px !important; }
        .nav-indicator { display: none; }
        .sidebar-closed .nav-indicator { left: -8px; }

        .nav-label { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .nav-label { opacity: 1; max-width: 132px; font-size: 12px; }
        .sidebar-closed .nav-label { opacity: 0; max-width: 0; }
        .logo-text { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .logo-text { opacity: 1; max-width: 200px; }
        .sidebar-closed .logo-text { opacity: 0; max-width: 0; }

        .sidebar-closed .nav-badge { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; font-size: 10px; border-radius: 9999px; }
        .nav-badge-open { width: 18px; height: 18px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
        .nav-tooltip { position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%); background: #111827; color: #fff; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s ease; z-index: 50; }
        .sidebar-closed .nav-item-wrap:hover .nav-tooltip { opacity: 1; }
        .sidebar-open .nav-tooltip { display: none; }

        .hcm-brand-mark { width: 52px; height: 52px; border-radius: 9px; overflow: hidden; flex: 0 0 auto; position: relative; background: #ffffff; }
        .hcm-brand-mark img { position: absolute; width: 78%; height: 78%; left: 50%; top: 50%; transform: translate(-50%, -50%); object-fit: contain; }
        .hcm-dashboard-header { position: sticky; top: 0; z-index: 100; background: var(--nurse-page-bg); border-bottom: 0; box-shadow: none; min-height: 104px; display: flex; align-items: center; }
        .hcm-dashboard-header__inner { max-width: 1240px; margin: 0 auto; width: 100%; padding: 28px 36px 14px; display: grid; grid-template-columns: minmax(300px, 1fr) 324px auto; align-items: center; gap: 30px; min-width: 0; }
        .hcm-dashboard-header__copy { min-width: 260px; }
        .hcm-dashboard-header__title { margin: 0; color: #101827; font-size: 25px !important; line-height: 1.1; font-weight: 800 !important; letter-spacing: 0 !important; }
        .hcm-dashboard-header__date { margin: 10px 0 0; color: #758096; font-size: 14px !important; line-height: 1.2; text-transform: none; }
        .hcm-dashboard-header__search { height: 43px; display: flex; align-items: center; gap: 12px; width: 324px; min-width: 0; max-width: 100%; background: #ffffff; border: 1px solid #dbe2ea; border-radius: 8px; padding: 0 13px; box-shadow: none; outline: none; }
        .hcm-dashboard-header__search input { font-size: 13px !important; color: #374151; }
        .hcm-dashboard-header__actions { display: flex; align-items: center; justify-content: flex-end; gap: 0; white-space: nowrap; }
        .hcm-dashboard-header__notification-wrap { position: relative; padding: 0 23px; border-right: 1px solid #edf0f4; display: flex; align-items: center; justify-content: center; }
        .hcm-dashboard-header__notification { width: 42px; height: 42px; padding: 0 !important; border: 0 !important; border-radius: 8px !important; background: #ffffff; color: #101827; position: relative; display: inline-grid !important; place-items: center !important; cursor: pointer; }
        .hcm-dashboard-header__notification svg { display: block; }
        .hcm-dashboard-header__badge { position: absolute; top: 2px; right: 2px; min-width: 17px; height: 17px; border-radius: 999px; background: #ff333d; border: 2px solid #fff; color: #fff; display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; font-size: 10px; font-weight: 800; }
        .hcm-dashboard-header__profile { margin-left: 24px; display: inline-flex; align-items: center; gap: 13px; border: 0 !important; background: transparent !important; padding: 0 !important; color: #101827; cursor: pointer; }
        .hcm-dashboard-header__avatar { width: 42px; height: 42px; border-radius: 50% !important; overflow: hidden; flex: 0 0 auto; background: linear-gradient(135deg, #0c3a24, #165034); display: grid; place-items: center; color: #fff; font-size: 13px; font-weight: 800; }
        .hcm-dashboard-header__avatar img { border-radius: 50%; display: block; }
        .triage-page .hcm-dashboard-header__notification-wrap { width: 74px !important; min-width: 74px !important; padding: 0 !important; border-left: 0 !important; border-right: 0 !important; position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        .triage-page .hcm-dashboard-header__notification-wrap::before,
        .triage-page .hcm-dashboard-header__notification-wrap::after { content: ""; position: absolute; top: 4px; bottom: 4px; width: 1px; background: #edf0f4; pointer-events: none; }
        .triage-page .hcm-dashboard-header__notification-wrap::before { left: 0; }
        .triage-page .hcm-dashboard-header__notification-wrap::after { right: 0; }
        .triage-page button.hcm-dashboard-header__notification { width: 42px !important; height: 42px !important; margin: 0 auto !important; padding: 0 !important; display: inline-grid !important; place-items: center !important; line-height: 0 !important; }
        .triage-page button.hcm-dashboard-header__notification svg { margin: 0 !important; transform: none !important; }
        .triage-page .hcm-dashboard-header__badge { top: 2px !important; right: 4px !important; }
        .triage-page button.hcm-dashboard-header__avatar,
        .triage-page .hcm-dashboard-header__avatar { width: 42px !important; height: 42px !important; min-width: 42px !important; border-radius: 9999px !important; overflow: hidden !important; padding: 0 !important; aspect-ratio: 1 / 1; }
        .triage-page button.hcm-dashboard-header__avatar img,
        .triage-page .hcm-dashboard-header__avatar img { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 9999px !important; display: block; }
        .hcm-dashboard-header__profile-text { display: grid; gap: 5px; line-height: 1; text-align: left; }
        .hcm-dashboard-header__profile-text strong { color: #101827; font-size: 13px; font-weight: 800; white-space: nowrap; }
        .hcm-dashboard-header__profile-text span { color: #69758a; font-size: 12px; font-weight: 500; white-space: nowrap; }
        .triage-page .hcm-dashboard-header + div { padding: 14px 36px 28px !important; }

        @media (max-width: 1180px) {
          .hcm-dashboard-header__inner { grid-template-columns: 1fr 300px; gap: 18px; padding: 28px 26px 14px; }
          .hcm-dashboard-header__actions { grid-column: 1 / -1; justify-content: flex-end; }
        }

        @media (max-width: 760px) {
          .hcm-dashboard-header__inner { grid-template-columns: 1fr; gap: 14px; padding: 22px 18px 14px; }
          .hcm-dashboard-header__search { width: 100%; }
          .hcm-dashboard-header__actions { justify-content: flex-start; flex-wrap: wrap; }
        }

        .step-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 8px; border-radius: 2px; transition: background 0.3s; }
        .step-line.done { background: var(--hcm-primary-green); }
        .step-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; transition: all 0.3s; flex-shrink: 0; }
        .step-circle.pending { background: #f3f4f6; color: #9ca3af; border: 2px solid #e5e7eb; }
        .step-circle.active { background: var(--hcm-primary-green); color: white; border: 2px solid var(--hcm-primary-green); }
        .step-circle.done { background: var(--hcm-primary-green); color: white; border: 2px solid var(--hcm-primary-green); }

        .triage-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 18px; font-size: 13px; color: #111827; background: #fff; transition: border-color 0.15s; box-shadow: none; }
        .triage-input::placeholder { color: #d1d5db; }
        .triage-input:focus { outline: none; border-color: #dcebe2; box-shadow: none; }
        .triage-label { font-size: 10px; font-weight: 700; color: #374151; margin-bottom: 4px; display: block; letter-spacing: 0.08em; text-transform: uppercase; }
        .triage-hint { font-size: 11px; color: #9ca3af; margin-bottom: 6px; line-height: 1.4; }
        .triage-page .general-state-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 0 !important; overflow: hidden; }
        .triage-page .general-state-option { border: none !important; border-right: 1px solid #e5e7eb !important; border-bottom: 1px solid #e5e7eb !important; border-radius: 0 !important; box-shadow: none !important; background: #fff; padding: 11px 12px; text-align: left; cursor: pointer; transition: background 0.15s; clip-path: inset(0 round 0); }
        .triage-page .general-state-option.active { background: #e7f1ec !important; border-radius: 0 !important; }
        .triage-page .general-state-option:hover,
        .triage-page .general-state-option:active,
        .triage-page .general-state-option:focus,
        .triage-page .general-state-option:focus-visible { outline: none; border-radius: 0 !important; box-shadow: none !important; }

        .priority-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.15s; background: #fff; display: flex; align-items: center; gap: 12px; }
        .priority-card:hover { border-color: #2d6f4e; background: #fafafa; }
        .priority-card.selected-urgent { border-color: #ef4444; background: #fef2f2; }
        .priority-card.selected-less { border-color: #f97316; background: #fff7ed; }
        .priority-card.selected-non { border-color: #165034; background: #edf5f0; }
        .priority-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .priority-radio.checked-urgent { border-color: #ef4444; background: #ef4444; }
        .priority-radio.checked-less { border-color: #f97316; background: #f97316; }
        .priority-radio.checked-non { border-color: #165034; background: #165034; }
        .priority-radio-dot { width: 6px; height: 6px; border-radius: 50%; background: white; }
        .patient-entry-slider { overflow: hidden; width: 100%; }
        .patient-entry-track { display: flex; width: 200%; align-items: flex-start; transition: transform 0.28s cubic-bezier(0.4,0,0.2,1); }
        .patient-entry-panel { width: 50%; flex: 0 0 50%; padding-right: 1px; transition: opacity 0.18s ease; }
        .patient-entry-panel.inactive { height: 0; overflow: hidden; opacity: 0; pointer-events: none; }
        .patient-entry-panel.active { height: auto; opacity: 1; }
        .triage-part-segment { position: relative; display: grid; grid-template-columns: 1fr 1fr; height: 46px; padding: 4px; background: #f3f4f6; border-radius: 999px; overflow: hidden; margin-bottom: 2px; }
        .triage-part-indicator { position: absolute; left: 4px; top: 4px; width: calc((100% - 8px) / 2); height: calc(100% - 8px); background: var(--hcm-primary-green); border-radius: 999px; transition: transform 0.24s cubic-bezier(0.4,0,0.2,1); z-index: 0; }
        .triage-part-tab { position: relative; z-index: 1; height: 38px; padding: 0 12px; border: none; border-radius: 999px !important; background: transparent !important; color: #6b7280; font-size: 12px; font-weight: 750; cursor: pointer; transition: color 0.16s; }
        .triage-part-tab.active { color: #fff; }
        .triage-part-slider { overflow: hidden; width: 100%; }
        .triage-part-track { display: flex; width: 200%; align-items: flex-start; transition: transform 0.3s cubic-bezier(0.4,0,0.2,1); }
        .triage-part-panel { width: 50%; flex: 0 0 50%; display: flex; flex-direction: column; gap: 18px; padding-right: 1px; transition: opacity 0.18s ease; }
        .triage-part-panel.inactive { height: 0; overflow: hidden; opacity: 0; pointer-events: none; }
        .triage-part-panel.active { height: auto; opacity: 1; }
        .triage-start-actions { display: grid; grid-template-columns: minmax(120px, 0.42fr) minmax(160px, 0.58fr); gap: 10px; align-items: center; }
        .triage-start-actions > button { width: 100% !important; margin: 0 !important; }
        .triage-start-actions-inline { margin: 0 0 16px; }
        .triage-start-actions-patient { margin-top: 12px; }
        .triage-start-actions-register { margin-top: 14px; }
        .patient-register-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
        .patient-register-cta { width: 100%; display: flex; align-items: center; gap: 12px; border: none !important; border-radius: 0 !important; background: transparent; color: #0c3a24; padding: 8px 2px 14px; margin: -2px 0 14px; text-align: left; cursor: pointer; box-shadow: none !important; }
        .patient-register-cta-icon { width: 36px; height: 36px; border-radius: 999px; background: var(--hcm-primary-green); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.16s, background 0.16s; }
        .patient-register-cta strong { display: block; font-size: 13px; font-weight: 750; color: #0f172a; line-height: 1.2; }
        .patient-register-cta span span { display: block; margin-top: 2px; font-size: 12px; font-weight: 600; color: #5f6f66; }
        .patient-register-cta:hover .patient-register-cta-icon { transform: translateX(2px); background: var(--hcm-primary-green-hover); }
        .patient-entry-back { width: auto !important; padding: 0 !important; margin: 0; white-space: nowrap; }
        .patient-entry-back .patient-register-cta-icon { width: 32px; height: 32px; }
        .patient-entry-back:hover .patient-register-cta-icon { transform: translateX(-2px); }
        .search-segment { position: relative; display: grid; grid-template-columns: 1fr 1fr; height: 52px; padding: 4px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
        .search-segment-indicator { position: absolute; left: 4px; top: 4px; width: calc((100% - 8px) / 2); height: calc(100% - 8px); background: var(--hcm-primary-green); border-radius: 999px; transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); z-index: 0; }
        .search-tab { position: relative; z-index: 1; height: 44px; padding: 0 12px; font-size: 13px; font-weight: 700; border-radius: 999px !important; transition: color 0.15s; border: none; cursor: pointer; background: transparent !important; }
        .search-tab.active { color: white; }
        .search-tab.inactive { color: #6b7280; }
        .search-tab.inactive:hover { color: #374151; }

        .patient-results-list { background: transparent; border-radius: 0 !important; }
        .patient-result-card { border: none !important; border-radius: 0 !important; padding: 12px 10px; cursor: pointer; transition: background 0.15s; text-align: left; width: 100%; justify-content: flex-start !important; box-shadow: none !important; }
        .patient-result-card:nth-child(odd) { background: #ffffff !important; }
        .patient-result-card:nth-child(even) { background: #f8fbf9 !important; }
        .patient-result-card:hover { background: #edf5f0 !important; }
        .patient-result-name { font-weight: 650; font-size: 14px; color: #111827; line-height: 1.25; }
        .patient-result-code { display: block; margin-top: 4px; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0; }
        .patient-confirmed { background: linear-gradient(135deg, #e7f1ec 0%, #dcebe2 100%); border: 1.5px solid #2d6f4e; border-radius: 12px; padding: 16px; }
        .ai-card { background: linear-gradient(135deg, #edf5f0 0%, #e7f1ec 100%); border: 1.5px solid #2d6f4e; border-radius: 12px; padding: 14px; }
        .ai-badge { display: inline-flex; align-items: center; gap: 4px; background: var(--hcm-primary-green); color: white; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; margin-bottom: 8px; }

        .btn-primary { background: var(--hcm-primary-green); color: white; border: 1px solid var(--hcm-primary-green); border-radius: 8px; padding: 0 16px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; width: 100%; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; box-shadow: none; }
        .btn-primary:hover:not(:disabled) { background: var(--hcm-primary-green-hover); border-color: var(--hcm-primary-green-hover); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-secondary { background: #ffffff; color: #374151; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 16px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; width: 100%; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; box-shadow: none; }
        .btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
        .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-ghost { background: #fff; color: #0c3a24; border: 1px solid #cfe0d6; border-radius: 999px; padding: 10px 20px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; }
        .btn-ghost:hover:not(:disabled) { background: #edf5f0; }
        .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

        .section-divider { border: none; border-top: 1.5px dashed #e5e7eb; margin: 20px 0; }
        .form-card { background: white; border: 1px solid #f0f0f0; border-radius: 14px; padding: 24px; box-shadow: 0 8px 22px rgba(12,58,36,0.06); }

        .nav-active { background: var(--hcm-primary-green-soft) !important; color: var(--hcm-primary-green) !important; margin-right: 0 !important; width: 100% !important; padding-left: 13px !important; border-radius: 8px !important; box-shadow: none !important; font-weight: 600 !important; }
        .sidebar .nav-item-wrap,
        .sidebar .nav-item-wrap > button { border-radius: 8px !important; }
        .sidebar-closed .nav-active { margin-left: 0 !important; margin-right: 0 !important; width: 100% !important; padding-left: 0 !important; justify-content: center !important; }
        .sidebar-nav-inactive { color: #66738b !important; }
        .sidebar-nav-inactive:hover { background: #f4f7f8 !important; color: var(--hcm-primary-green) !important; }
        .nav-item-btn:focus-visible { outline: none; }

        .chip { display: inline-flex; align-items: center; padding: 5px 12px; border: 1.5px solid #e5e7eb; border-radius: 20px; font-size: 12px; font-weight: 500; color: #4b5563; cursor: pointer; transition: all 0.15s; background: white; }
        .chip:hover { border-color: #165034; color: #0c3a24; background: #edf5f0; }
        .chip.chip-selected { border-color: #165034; color: #0c3a24; background: #e7f1ec; }

        .doctor-card { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.15s; }
        .doctor-card:hover { border-color: #165034; }
        .doctor-card.selected { border-color: #165034; background: #e7f1ec; }
        .doc-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #165034, #2d6f4e); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; flex-shrink: 0; }

        .step-nav { display: flex; gap: 10px; margin-top: 20px; }
        .vital-group { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .triage-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
        .triage-title-row h2 { margin-bottom: 0; }
        .triage-page .triage-manual-button { width: auto !important; min-height: 28px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 1px solid rgba(22,80,52,0.16) !important; border-radius: 9px !important; background: #e7f1ec !important; color: #0c3a24; font-size: 11px; font-weight: 750; cursor: pointer; }
        .triage-page .triage-manual-button:hover { background: #dcebe2 !important; }
        .triage-manual-overlay { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(15,23,42,0.46); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .triage-manual-overlay::before { content: ""; position: fixed; inset: 0; background: radial-gradient(circle at 50% 40%, rgba(231,241,236,0.22), transparent 42%); pointer-events: none; }
        .triage-manual-card { position: relative; width: min(520px, 100%); background: #fff; border: 1px solid #e4ece7; border-radius: 18px; box-shadow: 0 34px 90px rgba(15,23,42,0.28); padding: 22px; animation: popupIn 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .triage-manual-head { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start; padding-bottom: 16px; border-bottom: 1px solid #eef2f0; }
        .triage-manual-icon { width: 40px; height: 40px; border-radius: 12px; background: #e7f1ec; color: #0c3a24; display: inline-flex; align-items: center; justify-content: center; }
        .triage-manual-head h3 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; }
        .triage-manual-head p { margin: 3px 0 0; font-size: 12px; color: #64748b; line-height: 1.45; }
        .triage-page .triage-manual-close { width: 32px !important; height: 32px; min-height: 32px; padding: 0; border: none !important; border-radius: 999px !important; background: #f3f4f6 !important; color: #475569; font-size: 20px; line-height: 1; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
        .triage-manual-pages { overflow: hidden; width: 100%; }
        .triage-manual-track { display: flex; width: 200%; transition: transform 0.28s cubic-bezier(0.4,0,0.2,1); align-items: flex-start; }
        .triage-manual-page { width: 50%; flex: 0 0 50%; display: grid; gap: 10px; padding-top: 16px; padding-right: 1px; }
        .triage-manual-body { display: grid; gap: 10px; padding-top: 16px; }
        .triage-manual-item { display: grid; gap: 4px; padding: 12px 0; border-bottom: 1px solid #f1f5f3; }
        .triage-manual-item:last-child { border-bottom: 0; padding-bottom: 0; }
        .triage-manual-item strong { font-size: 12px; font-weight: 800; color: #0c3a24; text-transform: uppercase; letter-spacing: 0.04em; }
        .triage-manual-item span { font-size: 13px; color: #475569; line-height: 1.55; }
        .triage-thresholds { display: grid; gap: 10px; margin-top: 10px; padding: 12px; background: #f8fbf9; border: 1px solid #e4ece7; border-radius: 12px; }
        .triage-thresholds.compact { gap: 9px; padding: 11px; }
        .triage-threshold-row { display: grid; grid-template-columns: 110px 1fr; gap: 8px 12px; align-items: center; }
        .triage-threshold-row > span { font-size: 12px; font-weight: 750; color: #0f172a; }
        .triage-threshold-row small { grid-column: 2; margin-top: -4px; font-size: 11px; color: #64748b; line-height: 1.35; }
        .triage-threshold-line { height: 8px; display: grid; grid-template-columns: 0.8fr 1.4fr 0.8fr; overflow: hidden; border-radius: 999px; background: #e5e7eb; }
        .triage-threshold-line .zone { display: block; min-width: 0; }
        .triage-threshold-line .zone.low { background: #93c5fd; }
        .triage-threshold-line .zone.normal { background: #86d6a3; }
        .triage-threshold-line .zone.warn { background: #facc15; }
        .triage-threshold-line .zone.danger { background: #ef4444; }
        .triage-manual-route { display: grid; gap: 12px; padding: 14px; border: 1px solid #dcebe2; border-radius: 14px; background: linear-gradient(135deg, #f8fbf9 0%, #eef7f2 100%); }
        .triage-manual-route strong { display: block; font-size: 12px; font-weight: 850; color: #0c3a24; text-transform: uppercase; letter-spacing: 0.04em; }
        .triage-manual-route span { font-size: 13px; color: #475569; line-height: 1.5; }
        .triage-route-steps { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding-top: 14px; }
        .triage-route-steps::before { content: ""; position: absolute; left: 8%; right: 8%; top: 4px; height: 2px; background: linear-gradient(90deg, #86d6a3, #facc15, #ef4444); }
        .triage-route-steps span { position: relative; padding: 8px 9px; background: #fff; border: 1px solid #e4ece7; border-radius: 10px; color: #334155; font-size: 11px; font-weight: 750; text-align: center; }
        .triage-route-steps span::before { content: ""; position: absolute; top: -14px; left: 50%; width: 8px; height: 8px; transform: translateX(-50%); border-radius: 999px; background: #86d6a3; box-shadow: 0 0 0 3px #fff; }
        .triage-route-steps span:nth-child(2)::before { background: #facc15; }
        .triage-route-steps span.danger::before { background: #ef4444; }
        .triage-route-steps span.danger { border-color: #fecaca; color: #991b1b; background: #fff7f7; }
        .triage-manual-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 14px; margin-top: 12px; border-top: 1px solid #eef2f0; }
        .triage-manual-nav > span { font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 0.08em; }
        .triage-page .triage-manual-arrow { width: auto !important; min-height: 34px; display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; border: 1px solid #dcebe2 !important; border-radius: 10px !important; background: #f8fbf9 !important; color: #0c3a24; font-size: 12px; font-weight: 800; cursor: pointer; }
        .triage-page .triage-manual-arrow:hover { background: #edf5f0 !important; }

        .popup-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.38); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 18px; }
        .popup-card { width: min(390px, 100%); background: #fff; border: 1px solid #e4ece7; border-radius: 24px; box-shadow: 0 32px 80px rgba(15, 23, 42, 0.22); padding: 28px 24px 24px; animation: popupIn 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .popup-scroll { scrollbar-width: thin; scrollbar-color: rgba(156,163,175,0.75) rgba(0,0,0,0.03); }
        .popup-scroll::-webkit-scrollbar { width: 8px; }
        .popup-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.03); border-radius: 999px; }
        .popup-scroll::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.75); border-radius: 999px; }
        .popup-scroll::-webkit-scrollbar-thumb:hover { background: rgba(107,114,128,0.85); }
        .alert-popup-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.38); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 240; padding: 18px; }
        .alert-popup-card { width: min(390px, 100%); background: #fff; border: 1px solid #e4ece7; border-radius: 24px; box-shadow: 0 32px 80px rgba(15, 23, 42, 0.22); padding: 28px 24px 24px; text-align: center; animation: popupIn 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .alert-popup-handle { width: 36px; height: 4px; border-radius: 999px; background: #e2e8f0; margin: 0 auto 22px; }
        .alert-popup-head { padding: 0; border-bottom: 0; }
        .alert-popup-body { padding: 0; display: flex; flex-direction: column; align-items: center; gap: 0; }
        .alert-popup-footer { padding: 0; border-top: 0; display: flex; justify-content: center; align-items: center; gap: 8px; background: #fff; }
        .popup-icon { width: 64px; height: 64px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin: 0 auto 18px; }
        .popup-icon-warning { background: #fff1f2; color: #be123c; }
        .popup-icon-success { background: #e8f7ee; color: #0c3a24; }
        @keyframes popupIn { from { opacity: 0; transform: translateY(18px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

        /* ============================================================
           MODERNIZED DASHBOARD STYLES
        ============================================================ */
        .dash-hero-card {
          background: linear-gradient(135deg, #0c3a24 0%, #165034 55%, #1a6040 100%);
          border-radius: 20px;
          padding: 28px;
          color: white;
          position: relative;
          overflow: hidden;
        }
        .dash-hero-card::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
        }
        .dash-hero-card::after {
          content: '';
          position: absolute;
          bottom: -60px; right: 60px;
          width: 150px; height: 150px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }

        .dash-stat-card {
          background: white;
          border-radius: 18px;
          padding: 20px 22px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .dash-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.08);
        }

        .dash-chart-card {
          background: white;
          border-radius: 18px;
          padding: 22px 24px;
          border: 1px solid #f0f0f0;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .dash-section-title {
          font-size: 13px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 14px;
        }

        .queue-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f5f5f5;
          transition: background 0.15s;
          cursor: pointer;
          border-radius: 8px;
          padding-left: 8px;
          padding-right: 8px;
          margin: 0 -8px;
        }
        .queue-row:hover { background: #f9fafb; }
        .queue-row:last-child { border-bottom: none; }

        .status-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }

        .priority-pill {
          font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px;
        }

        .dash-donut-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .dash-donut-center {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .update-banner {
          background: #0c3a24;
          color: white;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }
        .update-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; flex-shrink: 0; margin-top: 5px; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .quick-action-btn {
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .quick-action-btn:hover {
          border-color: #165034;
          background: #f0f8f4;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22,80,52,0.1);
        }

        .trend-up { color: #22c55e; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
        .trend-down { color: #ef4444; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
        .trend-neutral { color: #9ca3af; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 3px; }

        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .dash-grid-2 {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .dash-grid-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dash-animate { animation: fadeInUp 0.4s ease forwards; }
        .dash-animate-delay-1 { animation-delay: 0.05s; opacity: 0; }
        .dash-animate-delay-2 { animation-delay: 0.1s; opacity: 0; }
        .dash-animate-delay-3 { animation-delay: 0.15s; opacity: 0; }
        .dash-animate-delay-4 { animation-delay: 0.2s; opacity: 0; }
        .dash-animate-delay-5 { animation-delay: 0.25s; opacity: 0; }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-line {
          border-radius: 8px;
          background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 40%, #eef2f7 60%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.25s linear infinite;
        }
        .nurse-font-scaled * {
          font-size: calc(100% * var(--nurse-font-scale)) !important;
          line-height: 1.4;
        }
      `}</style>

      {/* Sidebar */}
      <aside
        className={`sidebar flex flex-col flex-shrink-0 ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        data-tour="role-sidebar"
        style={{
          width: sidebarOpen ? 190 : 76,
          minWidth: sidebarOpen ? 190 : 76,
          maxWidth: sidebarOpen ? 190 : 76,
        }}
      >
        <div className="flex items-center gap-3" style={{ padding: "24px 16px 29px" }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hcm-brand-mark"
            style={{
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
            aria-label={sidebarOpen ? "Recolher menu" : "Abrir menu"}
          >
            <img src="/assets/system%27s%20logo%20v2.png" alt="" aria-hidden="true" />
          </button>
          <div className="logo-text min-w-0">
            <div className="font-extrabold leading-none" style={{ color: "#101827", fontSize: 23 }}>
              HCM
            </div>
            <div className="font-medium" style={{ color: "#152033", lineHeight: 1.22, marginTop: 6, fontSize: 13 }}>
              Hospital Central
              <br />
              de Maputo
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden" style={{ padding: "0 14px" }}>
          <div ref={navListRef} className="relative" style={{ display: "grid", gap: 8 }}>
            <span
              className="nav-indicator"
              style={{
                top: `${navIndicator?.top || 0}px`,
                height: `${navIndicator?.height || 0}px`,
                opacity: navIndicator?.opacity || 0,
              }}
            />
            {sidebarNavItems.map((item) => {
              const compactLabel = compactNavLabelFor(item);
              return (
                <div key={item.key} className="nav-item-wrap relative">
                  <button
                    ref={(el) => {
                      if (!navItemRefs?.current) return;
                      if (el) navItemRefs.current[item.key] = el;
                      else delete navItemRefs.current[item.key];
                    }}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                        return;
                      }
                      openView(item.key);
                    }}
                    data-tour={`nav-${item.key}`}
                    className={`sidebar-nav-btn nav-item-btn w-full text-left transition-all flex items-center relative focus:outline-none ${activeView === item.key ? "nav-active" : "sidebar-nav-inactive"}`}
                    style={{
                      borderRadius: 8,
                      padding: "0 13px",
                      minHeight: 36,
                      fontSize: 12,
                      gap: 12,
                    }}
                  >
                    {sidebarIconFor(item.key)}
                    <span className="nav-label">{compactLabel}</span>
                    {item.badge && sidebarOpen && (
                      <span className="ml-auto nav-badge-open text-white" style={{ background: "#ff333d" }}>
                        {item.badge}
                      </span>
                    )}
                    {item.badge && !sidebarOpen && (
                      <span
                        className="nav-badge absolute top-1 right-1 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center"
                        style={{ background: "#ff333d" }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                  <span className="nav-tooltip">{compactLabel}</span>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer" style={{ borderTop: "1px solid #eef2f5", padding: "14px", display: "grid", gap: 10 }}>
          <div className="nav-item-wrap relative">
            <button
              onClick={logout}
              className="sidebar-nav-btn w-full font-medium sidebar-nav-inactive transition-colors flex items-center"
              style={{ minHeight: 36, fontSize: 12, gap: 12, padding: "0 13px" }}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="nav-label">Sair</span>
            </button>
            <span className="nav-tooltip">Sair</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--nurse-page-bg)" }}>
        {/* Top Nav */}
        <header
          className="hcm-dashboard-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "var(--nurse-page-bg)",
            borderBottom: "0",
            boxShadow: "none",
            minHeight: "104px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            className="hcm-dashboard-header__inner"
            style={{
              maxWidth: 1240,
              margin: "0 auto",
              width: "100%",
              padding: "28px 36px 14px",
              display: "grid",
              gridTemplateColumns: "minmax(300px, 1fr) 324px auto",
              alignItems: "center",
              gap: 30,
              minWidth: 0,
            }}
          >
            {activeView === "home" || activeView === "dayStats" ? (
              <div className="hcm-dashboard-header__copy">
                <div
                  className="hcm-dashboard-header__title"
                  style={{
                    margin: 0,
                    color: "#101827",
                    fontSize: 25,
                    lineHeight: 1.1,
                    fontWeight: 800,
                  }}
                >
                  {activeView === "dayStats" ? "Estatísticas do Dia" : `Bom dia, ${nurseFirstName}`}
                </div>
                <p
                  className="hcm-dashboard-header__date"
                  style={{
                    margin: "8px 0 0",
                    color: "#758096",
                    fontSize: 14,
                    lineHeight: 1.2,
                    textTransform: "none",
                  }}
                >
                  {activeView === "dayStats" ? "Resumo operacional detalhado" : todayLabel}
                </p>
              </div>
            ) : (
              <HeaderBackButton onClick={() => openView("home")} />
            )}
            <div
              data-tour="top-search"
              className="hcm-dashboard-header__search"
              style={{
                width: 324,
                height: 43,
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: "1px solid #dbe2ea",
                borderRadius: 8,
                padding: "0 13px",
                background: "#fff",
                boxSizing: "border-box",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                placeholder="Pesquisar paciente..."
                value={topNavSearch}
                onChange={(e) => setTopNavSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchFromTopNav()}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  boxShadow: "none",
                  fontSize: "13px",
                  color: "#374151",
                  width: "100%",
                  padding: 0,
                  WebkitAppearance: "none",
                  appearance: "none",
                }}
              />
            </div>
            <div
              className="hcm-dashboard-header__actions"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 0,
                whiteSpace: "nowrap",
              }}
            >
              <div
                ref={notificationsPreviewRef}
                data-tour="notifications"
                className="hcm-dashboard-header__notification-wrap"
              >
                <button
                  type="button"
                  className="hcm-dashboard-header__notification"
                  onClick={() => {
                    setNotificationsPreviewOpen((prev) => !prev);
                    if (!notificationsPreviewOpen) loadNotifications();
                  }}
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "8px",
                    border: "none",
                    background: notificationsPreviewOpen ? "#e7f4ee" : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: notificationsPreviewOpen ? "#165034" : "#5f6f66",
                    position: "relative",
                    boxShadow: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e7f4ee";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notificationsPreviewOpen ? "#e7f4ee" : "#ffffff";
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {notificationsUnread > 0 && (
                    <span
                      className="hcm-dashboard-header__badge"
                      style={{
                        position: "absolute",
                        top: "1px",
                        right: "1px",
                        minWidth: "16px",
                        height: "16px",
                        borderRadius: "999px",
                        background: "#ff333d",
                        border: "2px solid white",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                      }}
                    >
                      {notificationsUnread > 99 ? "99+" : notificationsUnread}
                    </span>
                  )}
                </button>
                {notificationsPreviewOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "330px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "18px",
                      boxShadow: "none",
                      zIndex: 220,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                        Notificação mais recente
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsPreviewOpen(false);
                          setActiveView("notifications");
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#165034",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Ver todas
                      </button>
                    </div>
                    <div style={{ padding: "12px" }}>
                      {loadingNotifications ? (
                        <div className="skeleton-line" style={{ height: "16px", width: "100%" }} />
                      ) : latestNotification ? (
                        <div style={{ display: "grid", gap: "6px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>
                            {latestNotification.title || "Notificação"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.4 }}>
                            {latestNotification.message || "-"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "2px",
                            }}
                          >
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {latestNotification.created_at
                                ? new Date(latestNotification.created_at).toLocaleString("pt-PT")
                                : "-"}
                            </span>
                            {!latestNotification.read_at && (
                              <button
                                type="button"
                                onClick={() => markNotificationRead(latestNotification.id)}
                                className="btn-secondary"
                                style={{
                                  width: "auto",
                                  minHeight: "30px",
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                }}
                              >
                                Marcar lida
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                          Sem notificações recentes.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div
                className="hcm-dashboard-header__profile-text"
                style={{
                  marginLeft: "13px",
                  order: 3,
                  color: "#374151",
                  maxWidth: "180px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  lineHeight: 1,
                }}
              >
                <strong
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#101827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {me?.full_name || "Utilizador"}
                </strong>
                <small style={{ fontSize: "12px", color: "#69758a" }}>
                  {String(me?.role || "").toUpperCase() === "NURSE" ? "Enfermeira" : me?.role || "Utilizador"}
                </small>
              </div>
              <button
                className="hcm-dashboard-header__avatar"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  border: "2px solid #ffffff",
                  overflow: "hidden",
                  cursor: "pointer",
                  marginLeft: "24px",
                  padding: 0,
                  background: "linear-gradient(135deg, #0c3a24, #165034)",
                  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  order: 2,
                }}
              >
                {String(me?.profile_photo_url || "").trim() ? (
                  <img
                    src={me.profile_photo_url}
                    alt={me?.full_name || "Utilizador"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "white" }}>
                    {me?.full_name?.trim()?.[0]?.toUpperCase() || "D"}
                  </span>
                )}
              </button>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#667085"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ order: 4, marginLeft: 10, flexShrink: 0 }}
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </header>

        <div
          className="mx-auto"
          data-tour="role-content"
          style={{
            maxWidth: activeView === "patients" ? "none" : "1240px",
            width: "100%",
            padding: activeView === "patients" ? "14px 24px 24px" : "14px 36px 28px",
          }}
        >
          {/* ============================================================
              MODERNIZED HOME / DAY STATS VIEW
          ============================================================ */}
          {(activeView === "home" || activeView === "dayStats") && (
            <NurseDashboardView
              activeView={activeView}
              me={me}
              onRefresh={loadQueue}
              loadingQueue={loadingQueue}
              totalQueue={totalQueue}
              urgentCount={urgentCount}
              weeklyData={weeklyData}
              availableDoctors={availableDoctors}
              doctors={doctors}
              busyDoctors={busyDoctors}
              inTriageCount={inTriageCount}
              recentQueueItems={recentQueueItems}
              priorities={PRIORITIES}
              onOpenView={openView}
              queue={queue}
            />
          )}

          {activeView === "shiftReport" && (
            <div className="dash-animate dash-animate-delay-1">
              <NurseShiftReportView
                me={me}
                queue={queue}
                queueSummary={queueSummary}
                pastVisits={pastVisits}
                shiftStatus={shiftStatus}
                loadingQueue={loadingQueue}
                loadingPastVisits={loadingPastVisits}
                onRefresh={() => {
                  loadQueue();
                  loadPastVisits();
                  loadShiftStatus();
                }}
              />
            </div>
          )}

          {activeView === "destination" && (
            <NurseDestinationView
              destinationRows={destinationRows}
              loadQueue={loadQueue}
              loadingQueue={loadingQueue}
              inferHospitalStatus={inferHospitalStatus}
              formatRelativeUpdate={formatRelativeUpdate}
              destinationSavingId={destinationSavingId}
              destinationPlacement={destinationPlacement}
              setDestinationPlacement={setDestinationPlacement}
              destinationNotes={destinationNotes}
              setDestinationNotes={setDestinationNotes}
              pdfLoadingId={pdfLoadingId}
              downloadDischargeSummaryPdf={downloadDischargeSummaryPdf}
              registerAdmissionPlacement={registerAdmissionPlacement}
              updateDestinationStatus={updateDestinationStatus}
            />
          )}

          {activeView === "notifications" && (
            <NurseNotificationsView
              notifications={filteredNotifications}
              unreadCount={notificationsUnread}
              loading={loadingNotifications}
              onRefresh={loadNotifications}
              onMarkRead={markNotificationRead}
              onMarkAllRead={markAllNotificationsRead}
            />
          )}

          {activeView === "preferences" && (
            <NursePreferencesView
              me={me}
              shiftStatus={shiftStatus}
              onLogout={logout}
              preferences={preferences}
              loading={loadingPreferences}
              saving={savingPreferences}
              onSave={savePreferences}
              onPreview={previewPreferences}
            />
          )}

          {(activeView === "newTriage" || activeView === "quickSearch") &&
            (activeView === "quickSearch" ? (
              <NurseQuickSearchView
                triageSteps={triageSteps}
                getStepStatus={getStepStatus}
                triageStep={triageStep}
                setTriageStep={setTriageStep}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                code={code}
                setCode={setCode}
                nameQuery={nameQuery}
                setNameQuery={setNameQuery}
                searchPatient={searchPatientByMode}
                searchLoading={searchLoading}
                searchResults={searchResults}
                setPatient={setPatient}
                setAiSuggestion={setAiSuggestion}
                setVisit={setVisit}
                setSelectedDoctorId={setSelectedDoctorId}
                setForceTriageForLabFollowup={setForceTriageForLabFollowup}
                patient={patient}
                patientAgeYears={patientAgeYears}
                latestRecordedWeight={latestRecordedWeight}
                patientLabFollowup={patientLabFollowup}
                visit={visit}
                forceTriageForLabFollowup={forceTriageForLabFollowup}
                createVisit={createVisitForCurrentPatient}
                creatingVisit={creatingVisit}
                pClinicalCode={pClinicalCode}
                setPClinicalCode={setPClinicalCode}
                pFullName={pFullName}
                setPFullName={setPFullName}
                pSex={pSex}
                setPSex={setPSex}
                pBirthDate={pBirthDate}
                setPBirthDate={setPBirthDate}
                pGuardianName={pGuardianName}
                setPGuardianName={setPGuardianName}
                pGuardianPhone={pGuardianPhone}
                setPGuardianPhone={setPGuardianPhone}
                pAltPhone={pAltPhone}
                setPAltPhone={setPAltPhone}
                pAddress={pAddress}
                setPAddress={setPAddress}
                createPatient={createPatient}
                creatingPatient={creatingPatient}
                resetAll={resetAll}
                skipTriageReturnEligible={skipTriageReturnEligible}
                GENERAL_STATE_OPTIONS={GENERAL_STATE_OPTIONS}
                generalState={generalState}
                setGeneralState={setGeneralState}
                needsOxygen={needsOxygen}
                setNeedsOxygen={setNeedsOxygen}
                suspectedSevereDehydration={suspectedSevereDehydration}
                setSuspectedSevereDehydration={setSuspectedSevereDehydration}
                excessiveLethargy={excessiveLethargy}
                setExcessiveLethargy={setExcessiveLethargy}
                difficultyMaintainingSitting={difficultyMaintainingSitting}
                setDifficultyMaintainingSitting={setDifficultyMaintainingSitting}
                historySyncopeCollapse={historySyncopeCollapse}
                setHistorySyncopeCollapse={setHistorySyncopeCollapse}
                temperature={temperature}
                setTemperature={setTemperature}
                spo2={spo2}
                setSpo2={setSpo2}
                heartRate={heartRate}
                setHeartRate={setHeartRate}
                respRate={respRate}
                setRespRate={setRespRate}
                weight={weight}
                setWeight={setWeight}
                chiefComplaint={chiefComplaint}
                setChiefComplaint={setChiefComplaint}
                clinicalNotes={clinicalNotes}
                setClinicalNotes={setClinicalNotes}
                PRIORITIES={PRIORITIES}
                priority={priority}
                setPriority={setPriority}
                customMaxWait={customMaxWait}
                setCustomMaxWait={setCustomMaxWait}
                selectedPriority={selectedPriority}
                aiSuggestion={aiSuggestion}
                aiShortReason={aiShortReason}
                aiLoading={aiLoading}
                priorityLabel={priorityLabel}
                recommendedRoomLabel={recommendedRoomLabel}
                bypassToER={bypassToER}
                hasRoomAvailable={hasRoomAvailable}
                assignableDoctors={assignableDoctors}
                doctorQueueEtaById={doctorQueueEtaById}
                selectedDoctorId={selectedDoctorId}
                assignDoctor={assignDoctor}
                assigning={assigning}
                hasDoctorAvailable={hasDoctorAvailable}
                erBypassRecommended={erBypassRecommended}
                erBypassReasons={erBypassReasons}
                holdInWaitingLine={holdInWaitingLine}
                setHoldInWaitingLine={setHoldInWaitingLine}
                setBypassToER={setBypassToER}
                saveTriage={saveTriage}
                savingTriage={savingTriage}
              />
            ) : (
              <NurseNewTriageView
                triageSteps={triageSteps}
                getStepStatus={getStepStatus}
                triageStep={triageStep}
                setTriageStep={setTriageStep}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                code={code}
                setCode={setCode}
                nameQuery={nameQuery}
                setNameQuery={setNameQuery}
                searchPatient={searchPatientByMode}
                searchLoading={searchLoading}
                searchResults={searchResults}
                setPatient={setPatient}
                setAiSuggestion={setAiSuggestion}
                setVisit={setVisit}
                setSelectedDoctorId={setSelectedDoctorId}
                setForceTriageForLabFollowup={setForceTriageForLabFollowup}
                patient={patient}
                patientAgeYears={patientAgeYears}
                latestRecordedWeight={latestRecordedWeight}
                patientLabFollowup={patientLabFollowup}
                visit={visit}
                forceTriageForLabFollowup={forceTriageForLabFollowup}
                createVisit={createVisitForCurrentPatient}
                creatingVisit={creatingVisit}
                pClinicalCode={pClinicalCode}
                setPClinicalCode={setPClinicalCode}
                pFullName={pFullName}
                setPFullName={setPFullName}
                pSex={pSex}
                setPSex={setPSex}
                pBirthDate={pBirthDate}
                setPBirthDate={setPBirthDate}
                pGuardianName={pGuardianName}
                setPGuardianName={setPGuardianName}
                pGuardianPhone={pGuardianPhone}
                setPGuardianPhone={setPGuardianPhone}
                pAltPhone={pAltPhone}
                setPAltPhone={setPAltPhone}
                pAddress={pAddress}
                setPAddress={setPAddress}
                createPatient={createPatient}
                creatingPatient={creatingPatient}
                resetAll={resetAll}
                skipTriageReturnEligible={skipTriageReturnEligible}
                GENERAL_STATE_OPTIONS={GENERAL_STATE_OPTIONS}
                generalState={generalState}
                setGeneralState={setGeneralState}
                needsOxygen={needsOxygen}
                setNeedsOxygen={setNeedsOxygen}
                suspectedSevereDehydration={suspectedSevereDehydration}
                setSuspectedSevereDehydration={setSuspectedSevereDehydration}
                excessiveLethargy={excessiveLethargy}
                setExcessiveLethargy={setExcessiveLethargy}
                difficultyMaintainingSitting={difficultyMaintainingSitting}
                setDifficultyMaintainingSitting={setDifficultyMaintainingSitting}
                historySyncopeCollapse={historySyncopeCollapse}
                setHistorySyncopeCollapse={setHistorySyncopeCollapse}
                temperature={temperature}
                setTemperature={setTemperature}
                spo2={spo2}
                setSpo2={setSpo2}
                heartRate={heartRate}
                setHeartRate={setHeartRate}
                respRate={respRate}
                setRespRate={setRespRate}
                weight={weight}
                setWeight={setWeight}
                chiefComplaint={chiefComplaint}
                setChiefComplaint={setChiefComplaint}
                clinicalNotes={clinicalNotes}
                setClinicalNotes={setClinicalNotes}
                PRIORITIES={PRIORITIES}
                priority={priority}
                setPriority={setPriority}
                customMaxWait={customMaxWait}
                setCustomMaxWait={setCustomMaxWait}
                selectedPriority={selectedPriority}
                aiSuggestion={aiSuggestion}
                aiShortReason={aiShortReason}
                aiLoading={aiLoading}
                priorityLabel={priorityLabel}
                recommendedRoomLabel={recommendedRoomLabel}
                bypassToER={bypassToER}
                hasRoomAvailable={hasRoomAvailable}
                assignableDoctors={assignableDoctors}
                doctorQueueEtaById={doctorQueueEtaById}
                selectedDoctorId={selectedDoctorId}
                assignDoctor={assignDoctor}
                assigning={assigning}
                hasDoctorAvailable={hasDoctorAvailable}
                erBypassRecommended={erBypassRecommended}
                erBypassReasons={erBypassReasons}
                holdInWaitingLine={holdInWaitingLine}
                setHoldInWaitingLine={setHoldInWaitingLine}
                setBypassToER={setBypassToER}
                saveTriage={saveTriage}
                savingTriage={savingTriage}
              />
            ))}

          {activeView === "patients" && (
            <NursePatientsView
              pastVisits={pastVisits}
              loadingPastVisits={loadingPastVisits}
              loadPastVisits={loadPastVisits}
              inferHospitalStatus={inferHospitalStatus}
              inferVitalStatus={inferVitalStatus}
              openPastVisitModal={openPastVisitModal}
              pdfLoadingId={pdfLoadingId}
              downloadVisitPdf={downloadVisitPdf}
            />
          )}

          {activeView === "roomsAvailable" && (
            <NurseRoomsAvailableView
              loadQueue={loadQueue}
              loadingQueue={loadingQueue}
              queue={queue}
              roomInventory={roomInventory}
            />
          )}

          {/* DOCTOR AVAILABILITY VIEW */}
          {activeView === "doctors" && (
            <NurseDoctorsView
              doctors={doctors}
              loadDoctors={loadDoctors}
              loadingDoctors={loadingDoctors}
              availableDoctors={availableDoctors}
              busyDoctors={busyDoctors}
              patientByVisitId={patientByVisitId}
            />
          )}

          {/* QUEUE VIEW */}
          {(activeView === "queue" || activeView === "patientsInTriage") &&
            (activeView === "patientsInTriage" ? (
              <NursePatientsInTriageView
                inTriageCount={inTriageCount}
                queue={queue}
                loadingQueue={loadingQueue}
                loadQueue={loadQueue}
                triageQueueRows={triageQueueRows}
                triageUrgentQueue={triageUrgentQueue}
                triageNonUrgentQueue={triageNonUrgentQueue}
                urgentQueue={urgentQueue}
                nonUrgentQueue={nonUrgentQueue}
                waitingQueueSections={waitingQueueSections}
                getQueueRowBg={getQueueRowBg}
                openPatientEditModal={openPatientEditModal}
                removeVisitTriageFromQueue={removeVisitTriageFromQueue}
                isLabOrReturnQueueRow={isLabOrReturnQueueRow}
                getQueueActionMeta={getQueueActionMeta}
                PRIORITIES={PRIORITIES}
                statusLabelForVisit={statusLabelForVisit}
              />
            ) : (
              <NurseQueueView
                inTriageCount={inTriageCount}
                queue={queue}
                loadingQueue={loadingQueue}
                loadQueue={loadQueue}
                triageQueueRows={triageQueueRows}
                triageUrgentQueue={triageUrgentQueue}
                triageNonUrgentQueue={triageNonUrgentQueue}
                urgentQueue={urgentQueue}
                nonUrgentQueue={nonUrgentQueue}
                waitingQueueSections={waitingQueueSections}
                getQueueRowBg={getQueueRowBg}
                openPatientEditModal={openPatientEditModal}
                removeVisitTriageFromQueue={removeVisitTriageFromQueue}
                isLabOrReturnQueueRow={isLabOrReturnQueueRow}
                getQueueActionMeta={getQueueActionMeta}
                PRIORITIES={PRIORITIES}
                statusLabelForVisit={statusLabelForVisit}
              />
            ))}
        </div>
      </main>

      {/* Popups */}
      {popup.open && (
        <div className="alert-popup-overlay">
          <div className="alert-popup-card">
            <div className="alert-popup-handle" />
            <div className="alert-popup-body">
              <div
                className={`popup-icon ${popup.type === "success" ? "popup-icon-success" : "popup-icon-warning"}`}
              >
                {popup.type === "success" ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <div>
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {popup.title}
                </h3>
                <p
                  style={{
                    margin: "0 0 24px",
                    fontSize: 13,
                    color: "#64748b",
                    lineHeight: 1.65,
                    maxWidth: 280,
                  }}
                >
                  {popup.message}
                </p>
              </div>
            </div>
            <div className="alert-popup-footer">
              <button
                type="button"
                onClick={closePopup}
                className="btn-primary"
                style={{
                  width: "100%",
                  maxWidth: 280,
                  minHeight: 44,
                  padding: "11px 18px",
                  borderRadius: 14,
                }}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmPopup.open}
        title={confirmPopup.title}
        message={confirmPopup.message}
        confirmLabel={confirmPopup.confirmLabel}
        busy={confirmPopup.busy}
        onClose={closeConfirmPopup}
        onConfirm={confirmPopupAction}
      />

      <PastVisitHistoryModal
        modal={pastVisitModal}
        profileName={pastVisitProfileName}
        profileCode={pastVisitProfileCode}
        profileDob={pastVisitProfileDob}
        profileAge={pastVisitProfileAge}
        profileGuardian={pastVisitProfileGuardian}
        profilePhone={pastVisitProfilePhone}
        profileAddress={pastVisitProfileAddress}
        profilePhoto={pastVisitProfilePhoto}
        timeline={pastVisitTimeline}
        doctors={doctors}
        pdfLoadingId={pdfLoadingId}
        setPastVisitModal={setPastVisitModal}
        onStartEdit={startPastVisitPatientEdit}
        onSave={savePastVisitPatientEdit}
        onClose={closePastVisitModal}
        onDownloadPdf={(visitRow) => openVisitPdfTemplateModal(visitRow, pastVisitTimeline)}
      />

      <VisitPdfTemplateModal
        modal={pdfTemplateModal}
        pdfLoadingId={pdfLoadingId}
        onClose={closeVisitPdfTemplateModal}
        onSelectTemplate={setVisitPdfTemplate}
        onGenerate={generateVisitPdfFromTemplate}
      />

      {patientEditModal.open && (
        <div className="popup-overlay">
          <div
            className="popup-card"
            style={{
              maxWidth: "760px",
              width: "95%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                Editar Paciente{" "}
                {patientEditModal.visitId ? `(Visita #${patientEditModal.visitId})` : ""}
              </h3>
              <button
                type="button"
                onClick={closePatientEditModal}
                className="btn-secondary"
                style={{ width: "auto", padding: "8px 12px" }}
              >
                Fechar
              </button>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <button
                type="button"
                className={patientEditModal.page === "patient" ? "btn-primary" : "btn-secondary"}
                style={{ width: "auto", padding: "8px 12px" }}
                onClick={() => setPatientEditModal((prev) => ({ ...prev, page: "patient" }))}
              >
                Dados do Paciente
              </button>
              <button
                type="button"
                className={patientEditModal.page === "triage" ? "btn-primary" : "btn-secondary"}
                style={{ width: "auto", padding: "8px 12px" }}
                onClick={() => setPatientEditModal((prev) => ({ ...prev, page: "triage" }))}
              >
                Dados da Triagem
              </button>
            </div>
            <div style={{ overflowY: "auto", paddingRight: "2px", flex: 1 }}>
              {patientEditModal.page === "patient" && patientEditModal.loading ? (
                <div
                  className="form-card"
                  style={{ margin: 0, padding: "22px", textAlign: "center", color: "#6b7280" }}
                >
                  Carregando dados do paciente...
                </div>
              ) : patientEditModal.page === "patient" ? (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="triage-label">Código Clínico</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.clinical_code}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            clinical_code: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Nome Completo</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.full_name}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({ ...prev, full_name: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Sexo</label>
                      <select
                        className="triage-input"
                        value={patientEditModal.sex}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({ ...prev, sex: e.target.value }))
                        }
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                    <div>
                      <label className="triage-label">Data de Nascimento</label>
                      <input
                        type="date"
                        className="triage-input"
                        value={patientEditModal.birth_date}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({ ...prev, birth_date: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Acompanhante</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.guardian_name}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            guardian_name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Telefone do Acompanhante</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.guardian_phone}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            guardian_phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Contacto alternativo</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.alt_phone}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            alt_phone: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="triage-label">Morada</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.address}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={closePatientEditModal}
                      className="btn-secondary"
                      style={{ width: "auto", padding: "10px 16px" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={savePatientEdit}
                      disabled={patientEditModal.loading || patientEditModal.saving}
                      className="btn-primary"
                      style={{ width: "auto", padding: "10px 16px" }}
                    >
                      {patientEditModal.saving ? "Salvando..." : "Salvar Paciente"}
                    </button>
                  </div>
                </div>
              ) : patientEditModal.triageLoading ? (
                <div
                  className="form-card"
                  style={{ margin: 0, padding: "22px", textAlign: "center", color: "#6b7280" }}
                >
                  Carregando dados da triagem...
                </div>
              ) : (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="triage-label">Temperatura (°C)</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.triage_temperature}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_temperature: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">SpO2 (%)</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.triage_oxygen_saturation}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_oxygen_saturation: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Freq. Cardíaca (bpm)</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.triage_heart_rate}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_heart_rate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Freq. Respiratória (rpm)</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.triage_respiratory_rate}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_respiratory_rate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Peso (kg)</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.triage_weight}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_weight: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="triage-label">Estado Geral</label>
                      <select
                        className="triage-input"
                        value={patientEditModal.triage_general_state}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_general_state: e.target.value,
                          }))
                        }
                      >
                        <option value="">Não informado</option>
                        {GENERAL_STATE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="triage-label">Prioridade</label>
                      <select
                        className="triage-input"
                        value={patientEditModal.triage_priority}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_priority: e.target.value,
                          }))
                        }
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="triage-label">Espera Máx. (min)</label>
                      <input
                        className="triage-input"
                        value={patientEditModal.triage_max_wait_minutes}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_max_wait_minutes: e.target.value,
                          }))
                        }
                        placeholder={`${PRIORITIES.find((p) => p.value === patientEditModal.triage_priority)?.maxWait ?? ""}`}
                      />
                    </div>
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                        padding: "10px 12px",
                      }}
                    >
                      <label className="triage-label" style={{ marginBottom: "6px" }}>
                        Sinais Adicionais
                      </label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px 10px",
                          fontSize: "12px",
                          color: "#374151",
                        }}
                      >
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="checkbox"
                            checked={patientEditModal.triage_needs_oxygen}
                            onChange={(e) =>
                              setPatientEditModal((prev) => ({
                                ...prev,
                                triage_needs_oxygen: e.target.checked,
                              }))
                            }
                          />{" "}
                          Necessita de oxigénio
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="checkbox"
                            checked={patientEditModal.triage_suspected_severe_dehydration}
                            onChange={(e) =>
                              setPatientEditModal((prev) => ({
                                ...prev,
                                triage_suspected_severe_dehydration: e.target.checked,
                              }))
                            }
                          />{" "}
                          Desidratação grave
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="checkbox"
                            checked={patientEditModal.triage_excessive_lethargy}
                            onChange={(e) =>
                              setPatientEditModal((prev) => ({
                                ...prev,
                                triage_excessive_lethargy: e.target.checked,
                              }))
                            }
                          />{" "}
                          Letargia excessiva
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="checkbox"
                            checked={patientEditModal.triage_difficulty_maintaining_sitting}
                            onChange={(e) =>
                              setPatientEditModal((prev) => ({
                                ...prev,
                                triage_difficulty_maintaining_sitting: e.target.checked,
                              }))
                            }
                          />{" "}
                          Dificuldade para sentar
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="checkbox"
                            checked={patientEditModal.triage_history_syncope_collapse}
                            onChange={(e) =>
                              setPatientEditModal((prev) => ({
                                ...prev,
                                triage_history_syncope_collapse: e.target.checked,
                              }))
                            }
                          />{" "}
                          História de síncope/colapso
                        </label>
                      </div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="triage-label">Queixa Principal *</label>
                      <textarea
                        className="triage-input"
                        rows="3"
                        value={patientEditModal.triage_chief_complaint}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_chief_complaint: e.target.value,
                          }))
                        }
                        style={{ resize: "none" }}
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="triage-label">Notas Clínicas</label>
                      <textarea
                        className="triage-input"
                        rows="3"
                        value={patientEditModal.triage_clinical_notes}
                        onChange={(e) =>
                          setPatientEditModal((prev) => ({
                            ...prev,
                            triage_clinical_notes: e.target.value,
                          }))
                        }
                        style={{ resize: "none" }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      gap: "10px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={closePatientEditModal}
                      className="btn-secondary"
                      style={{ width: "auto", padding: "10px 16px" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveQueueTriageEdit}
                      disabled={patientEditModal.triageLoading || patientEditModal.triageSaving}
                      className="btn-primary"
                      style={{ width: "auto", padding: "10px 16px" }}
                    >
                      {patientEditModal.triageSaving ? "Salvando..." : "Salvar Triagem"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
