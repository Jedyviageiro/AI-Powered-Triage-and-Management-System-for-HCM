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
import { PastVisitHistoryModal } from "../nurse-patients/PastVisitHistoryModal";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";

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
    loadingShift,
    notificationsPreviewRef,
    shiftMenuBusy,
    shiftMenuOpen,
    setShiftMenuOpen,
    shiftButtonMeta,
    shiftIcon,
    shiftStartDisabled,
    startShift,
    startingShift,
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
  return (
    <div
      className={`triage-page flex h-screen bg-gray-50 ${
        Number(preferences?.font_scale_percent || 100) !== 100 ? "nurse-font-scaled" : ""
      }`}
      style={{
        "--nurse-font-scale": Number(preferences?.font_scale_percent || 100) === 105 ? 1.05 : 1,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { font-family: 'IBM Plex Sans', system-ui, sans-serif; box-sizing: border-box; }
        .triage-page button { border-radius: 999px !important; box-shadow: none !important; font-family: inherit; }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #165034;
          box-shadow: 0 0 0 3px rgba(22,80,52,0.12);
        }

        .sidebar { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); overflow: hidden; background: #0c3a24; color: #ffffff; }
        .sidebar-open { width: 256px; }
        .sidebar-closed { width: 76px; }
        .sidebar nav { overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(220,235,226,0.55) transparent; }
        .sidebar nav::-webkit-scrollbar { width: 8px; }
        .sidebar nav::-webkit-scrollbar-thumb { background: rgba(220,235,226,0.45); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        .sidebar button:focus { outline: none; }
        .sidebar-closed nav { padding-left: 8px !important; padding-right: 8px !important; }
        .sidebar-closed .nav-item-wrap > button { justify-content: center; gap: 0 !important; padding-left: 10px !important; padding-right: 10px !important; }
        .sidebar-nav-btn { position: relative; border-radius: 0 !important; margin-left: 0; width: 100% !important; font-size: 12px; font-weight: 500; }
        .sidebar-open .sidebar-nav-btn { padding-left: 20px !important; }
        .nav-indicator { position: absolute; left: 0; width: 3px; background: #7fe0a0; border-radius: 0; transition: top 0.22s cubic-bezier(0.4,0,0.2,1), height 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease; pointer-events: none; }

        .nav-label { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .nav-label { opacity: 1; max-width: 200px; }
        .sidebar-closed .nav-label { opacity: 0; max-width: 0; }
        .logo-text { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .logo-text { opacity: 1; max-width: 200px; }
        .sidebar-closed .logo-text { opacity: 0; max-width: 0; }

        .sidebar-closed .nav-badge { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; font-size: 10px; border-radius: 9999px; }
        .nav-badge-open { width: 20px; height: 20px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; }
        .nav-tooltip { position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%); background: #111827; color: #fff; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s ease; z-index: 50; }
        .sidebar-closed .nav-item-wrap:hover .nav-tooltip { opacity: 1; }
        .sidebar-open .nav-tooltip { display: none; }

        .step-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 8px; border-radius: 2px; transition: background 0.3s; }
        .step-line.done { background: #165034; }
        .step-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; transition: all 0.3s; flex-shrink: 0; }
        .step-circle.pending { background: #f3f4f6; color: #9ca3af; border: 2px solid #e5e7eb; }
        .step-circle.active { background: #165034; color: white; border: 2px solid #165034; }
        .step-circle.done { background: #165034; color: white; border: 2px solid #165034; }

        .triage-input { width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb; border-radius: 18px; font-size: 13px; color: #111827; background: #fff; transition: border-color 0.15s; }
        .triage-input::placeholder { color: #d1d5db; }
        .triage-input:focus { outline: none; border-color: #165034; }
        .triage-label { font-size: 10px; font-weight: 700; color: #374151; margin-bottom: 4px; display: block; letter-spacing: 0.08em; text-transform: uppercase; }
        .triage-hint { font-size: 11px; color: #9ca3af; margin-bottom: 6px; line-height: 1.4; }

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

        .search-tab { flex: 1; padding: 8px 12px; font-size: 13px; font-weight: 500; border-radius: 8px; transition: all 0.15s; border: none; cursor: pointer; }
        .search-tab.active { background: #165034; color: white; }
        .search-tab.inactive { background: transparent; color: #6b7280; }
        .search-tab.inactive:hover { background: #f3f4f6; }

        .patient-result-card { border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; background: #fff; text-align: left; width: 100%; }
        .patient-result-card:hover { border-color: #165034; background: #edf5f0; }
        .patient-confirmed { background: linear-gradient(135deg, #e7f1ec 0%, #dcebe2 100%); border: 1.5px solid #2d6f4e; border-radius: 12px; padding: 16px; }
        .ai-card { background: linear-gradient(135deg, #edf5f0 0%, #e7f1ec 100%); border: 1.5px solid #2d6f4e; border-radius: 12px; padding: 14px; }
        .ai-badge { display: inline-flex; align-items: center; gap: 4px; background: #165034; color: white; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 20px; margin-bottom: 8px; }

        .btn-primary { background: #165034; color: white; border: 1px solid #165034; border-radius: 999px; padding: 11px 20px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; }
        .btn-primary:hover:not(:disabled) { background: #0c3a24; border-color: #0c3a24; }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; border-radius: 999px; padding: 11px 20px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; width: 100%; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; }
        .btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
        .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-ghost { background: #fff; color: #0c3a24; border: 1px solid #cfe0d6; border-radius: 999px; padding: 10px 20px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, border-color 0.15s; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; line-height: 1.1; }
        .btn-ghost:hover:not(:disabled) { background: #edf5f0; }
        .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

        .section-divider { border: none; border-top: 1.5px dashed #e5e7eb; margin: 20px 0; }
        .form-card { background: white; border: 1px solid #f0f0f0; border-radius: 16px; padding: 28px; box-shadow: 0 1px 8px rgba(0,0,0,0.04); }

        .nav-active { background: rgba(134, 214, 163, 0.14) !important; color: #ffffff !important; margin-right: -12px !important; width: calc(100% + 12px) !important; padding-left: 20px !important; border-radius: 0 !important; box-shadow: none !important; }
        .sidebar .nav-item-wrap,
        .sidebar .nav-item-wrap > button { border-radius: 0 !important; }
        .sidebar-closed .nav-active { padding-left: 0 !important; justify-content: center !important; }
        .sidebar-nav-inactive { color: rgba(255,255,255,0.78) !important; }
        .sidebar-nav-inactive:hover { background: rgba(255,255,255,0.06) !important; color: #ffffff !important; }
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

        .popup-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.35); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 16px; }
        .popup-card { width: min(460px, 100%); background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18); padding: 18px; }
        .popup-scroll { scrollbar-width: thin; scrollbar-color: rgba(156,163,175,0.75) rgba(0,0,0,0.03); }
        .popup-scroll::-webkit-scrollbar { width: 8px; }
        .popup-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.03); border-radius: 999px; }
        .popup-scroll::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.75); border-radius: 999px; }
        .popup-scroll::-webkit-scrollbar-thumb:hover { background: rgba(107,114,128,0.85); }
        .alert-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 240; padding: 20px; }
        .alert-popup-card { width: 100%; max-width: 620px; background: #fff; border-radius: 20px; overflow: hidden; }
        .alert-popup-handle { width: 36px; height: 4px; border-radius: 2px; background: #e5e5ea; margin: 10px auto 0; }
        .alert-popup-head { padding: 16px 20px 14px; border-bottom: 0.5px solid rgba(0,0,0,.07); }
        .alert-popup-body { padding: 16px 20px; display: flex; align-items: flex-start; gap: 12px; }
        .alert-popup-footer { padding: 14px 20px; border-top: 0.5px solid rgba(0,0,0,.07); display: flex; justify-content: flex-end; align-items: center; gap: 8px; background: #fff; }
        .popup-icon { width: 36px; height: 36px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .popup-icon-warning { background: #fef3c7; color: #b45309; }
        .popup-icon-success { background: #dcebe2; color: #0c3a24; }

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
      >
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors text-white"
          >
            {sidebarOpen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <div className="logo-text min-w-0">
            <div className="text-sm font-bold text-white leading-tight">Triagem</div>
            <div className="text-xs font-medium" style={{ color: "#dcebe2" }}>
              Painel Enfermagem
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 pr-3 pl-0 overflow-y-auto overflow-x-hidden">
          <div ref={navListRef} className="space-y-4 relative">
            <span
              className="nav-indicator"
              style={{
                top: `${navIndicator?.top || 0}px`,
                height: `${navIndicator?.height || 0}px`,
                opacity: navIndicator?.opacity || 0,
              }}
            />
            {navSections.map((section) => (
              <div key={section.title}>
                {sidebarOpen && (
                  <div className="px-3 pb-1 text-[11px] uppercase tracking-[0.08em] font-semibold text-white/35">
                    {section.title}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items
                    .filter((item) => item.key !== "logout")
                    .map((item) => (
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
                          className={`sidebar-nav-btn nav-item-btn w-full text-left px-3 py-2.5 text-[12px] font-medium transition-all flex items-center gap-3 relative focus:outline-none ${activeView === item.key ? "nav-active" : "sidebar-nav-inactive"}`}
                          style={
                            activeView === item.key
                              ? { borderRadius: 0, paddingLeft: sidebarOpen ? 20 : 0 }
                              : undefined
                          }
                        >
                          {item.icon}
                          <span className="nav-label">{item.label}</span>
                          {item.badge && sidebarOpen && (
                            <span
                              className="ml-auto nav-badge-open text-white"
                              style={{ background: "#165034" }}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.badge && !sidebarOpen && (
                            <span
                              className="nav-badge absolute top-1 right-1 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center"
                              style={{ background: "#165034" }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                        <span className="nav-tooltip">{item.label}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-white/20">
          <div className="nav-item-wrap relative">
            <button
              onClick={logout}
              className="sidebar-nav-btn w-full px-3 py-2.5 text-[12px] font-medium sidebar-nav-inactive transition-colors flex items-center gap-3"
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
      <main className="flex-1 overflow-y-auto">
        {/* Top Nav */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            background: "white",
            borderBottom: "1px solid #f0f0f0",
            height: "60px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: "1160px",
              margin: "0 auto",
              width: "100%",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "280px",
                maxWidth: "100%",
                background: "#f9fafb",
                border: "1px solid #dbe5df",
                borderRadius: "999px",
                padding: "9px 16px",
                boxShadow: "none",
                outline: "none",
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
                placeholder="Pesquisar paciente"
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
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
              {String(me?.role || "").toUpperCase() === "NURSE" && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}
                >
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={() => setShiftMenuOpen((prev) => !prev)}
                      disabled={loadingShift || shiftMenuBusy}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "999px",
                        border: `1px solid ${shiftButtonMeta.border}`,
                        background: shiftButtonMeta.background,
                        color: shiftButtonMeta.color,
                        fontSize: "0",
                        fontWeight: "700",
                        cursor: loadingShift || shiftMenuBusy ? "not-allowed" : "pointer",
                        opacity: loadingShift || shiftMenuBusy ? 0.7 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        justifyContent: "space-between",
                        minWidth: "170px",
                      }}
                      title="Abrir menu do turno"
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          minWidth: 0,
                          fontSize: "12px",
                        }}
                      >
                        <span
                          style={{
                            width: "15px",
                            height: "15px",
                            lineHeight: 0,
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          aria-hidden="true"
                        >
                          {shiftIcon}
                        </span>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "999px",
                            background: shiftButtonMeta.dot,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            lineHeight: 1.1,
                            minWidth: 0,
                          }}
                        >
                          <span>{shiftButtonMeta.label}</span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              opacity: 0.82,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {shiftButtonMeta.detail}
                          </span>
                          {shiftButtonMeta.subdetail ? (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                opacity: 0.72,
                                whiteSpace: "nowrap",
                                marginTop: "2px",
                              }}
                            >
                              {shiftButtonMeta.subdetail}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ flexShrink: 0 }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {shiftMenuOpen && (
                      <div
                        onMouseDown={(event) => event.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          left: 0,
                          width: "100%",
                          background: "#ffffff",
                          border: "1px solid #dcebe2",
                          borderRadius: "12px",
                          boxShadow: "none",
                          padding: "6px",
                          zIndex: 220,
                        }}
                      >
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!shiftStartDisabled) void startShift();
                          }}
                          onClick={(event) => event.preventDefault()}
                          disabled={shiftStartDisabled}
                          className="btn-secondary"
                          style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            padding: "8px 10px",
                            minHeight: "36px",
                            fontSize: "12px",
                            background: "transparent",
                          }}
                        >
                          {startingShift ? "A iniciar..." : "Iniciar Turno"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={notificationsPreviewRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsPreviewOpen((prev) => !prev);
                    if (!notificationsPreviewOpen) loadNotifications();
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
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
                      style={{
                        position: "absolute",
                        top: "1px",
                        right: "1px",
                        minWidth: "16px",
                        height: "16px",
                        borderRadius: "999px",
                        background: "#ef4444",
                        border: "1.5px solid white",
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
                style={{
                  marginLeft: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  maxWidth: "180px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {me?.full_name || "Utilizador"}
              </div>
              <button
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "2px solid #e5e7eb",
                  overflow: "hidden",
                  cursor: "pointer",
                  marginLeft: "4px",
                  padding: 0,
                  background: "linear-gradient(135deg, #0c3a24, #165034)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
            </div>
          </div>
        </div>

        <div
          className="p-8 mx-auto"
          style={{ maxWidth: activeView === "patients" ? "none" : "64rem", width: "100%" }}
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
            <div className="alert-popup-head">
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#1c1c1e",
                  letterSpacing: "-.3px",
                }}
              >
                {popup.title}
              </div>
            </div>
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
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#636366", lineHeight: 1.5 }}>
                  {popup.message}
                </p>
              </div>
            </div>
            <div className="alert-popup-footer">
              <button
                type="button"
                onClick={closePopup}
                className="btn-primary"
                style={{ width: "auto", padding: "10px 18px", borderRadius: "999px" }}
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
        onDownloadPdf={downloadVisitPdf}
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
