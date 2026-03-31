import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUser } from "../../lib/auth";
import AppSidebar from "../../components/shared/layout/AppSidebar";
import {
  buildFollowUpInstructionsText,
  buildFollowUpReasonText,
  buildReevaluationContext,
  calculateAgeYears,
  DISPOSITION_OPTIONS,
  extractFollowUpTimeValue,
  fallbackComplaintQuestions,
  findLabExamLabel,
  FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS,
  FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS,
  FOLLOW_UP_RULE_OPTIONS,
  formatPriorityPt,
  formatStatus,
  getLabSampleTypeByExam,
  getVisitReasonLabel,
  HOSPITAL_STATUS_OPTIONS,
  LAB_EXAM_OPTIONS,
  LAB_ORDER_PRIORITY_OPTIONS,
  LAB_RETURN_COLLECTION_RULES,
  LAB_SAMPLE_PROTOCOLS,
  normalizeQuestions,
  parseShiftWindow,
  toISODate,
  VITAL_STATUS_OPTIONS,
} from "./doctor-helpers/doctorHelpers";
import {
  countQueuedExamsOnSameMachine,
  estimateExamReadyMeta,
  formatEtaPt,
  formatLabDateTimeLabel,
  getLabProgressTheme,
} from "./doctor-helpers/doctorLabHelpers";
import {
  dashboardPriorityMeta,
  DEFAULT_PREFERENCES,
} from "./doctor-helpers/doctorNotificationHelpers";

import { logoutDoctorSession } from "./doctor-operations/doctorSessionOperations";
import { DOCTOR_VIEW_ROUTES } from "./doctor-config/doctorNavigationConfig.jsx";
import { useDoctorNotificationsAndPreferences } from "./doctor-hooks/useDoctorNotificationsAndPreferences";
import { useDoctorHistorySearch } from "./doctor-hooks/useDoctorHistorySearch";
import { useDoctorQueueAndVisitState } from "./doctor-hooks/useDoctorQueueAndVisitState";
import { useDoctorDashboardState } from "./doctor-hooks/useDoctorDashboardState";
import { useDoctorConsultationState } from "./doctor-hooks/useDoctorConsultationState";
import { useDoctorConsultationActions } from "./doctor-hooks/useDoctorConsultationActions";
import { doctorPageStyles } from "./doctor-helpers/doctorPageStyles";
import DoctorPageContent from "./doctor-layout/DoctorLayout";
import { useDoctorPageShellState } from "./doctor-hooks/useDoctorPageShellState";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

export default function DoctorPage({ forcedView = "dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const me = getUser();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const resolvedView =
    Object.entries(DOCTOR_VIEW_ROUTES).find(([, path]) => path === location.pathname)?.[0] ||
    forcedView;
  const {
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
  } = useDoctorPageShellState(resolvedView);

  const {
    loadingNotifications,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    preferences,
    setPreferences,
    loadingPreferences,
    savingPreferences,
    notifyingPatientVisitId,
    loadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    loadPreferences,
    savePreferences,
    notifyPatientExamReady,
    filteredNotifications,
    notificationsUnread,
    latestNotification,
  } = useDoctorNotificationsAndPreferences({
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
  });

  const {
    historyQuery,
    setHistoryQuery,
    historySearchLoading,
    historySearchResults,
    historySuggestOpen,
    setHistorySuggestOpen,
    historyModal,
    searchHistoryPatients,
    openHistoryPatient,
    closeHistoryModal,
  } = useDoctorHistorySearch({
    activeView,
    historySearchRef,
    setErr,
  });

  const { loadQueue, openVisit, loadAgenda, startShift, canOpenConsultationForDate } =
    useDoctorQueueAndVisitState({
      forcedView: resolvedView,
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
    });

  const {
    filteredQueue,
    waitingCount,
    inConsultCount,
    priorityTheme,
    waitingTopPriority,
    inConsultTopPriority,
    aiEnabled,
    complaintQuestions,
    pendingLabVisits,
    doctorLabWorklistRows,
    pendingDoctorLabRows,
    readyDoctorLabRows,
    currentLabEtaPreview,
    labRequestSupport,
    selectedLabCollectionRule,
    hasGeneratedQuestionnaire,
    hasGeneratedAiSuggestion,
    agendaTodayCount,
    myAssignedQueue,
    activeAlertRows,
    activeAlertCount,
    isHistoryView,
    isAgendaView,
    isLabView,
    queueRowsForView,
    dashboardPriorityRows,
    dashboardStatusRows,
    dashboardNextPatients,
    dashboardHourSeries,
    dashboardAlertPreview,
    shiftStartDisabled,
    shiftMenuBusy,
    shiftIcon,
    shiftButtonMeta,
    navSections,
  } = useDoctorDashboardState({
    queue,
    labPendingRequests,
    labReadyResults,
    meId: me?.id,
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
  });

  const selectedLabProtocol = useMemo(() => {
    const key = String(planDraft?.lab_exam_type || "").toUpperCase();
    if (!key) return null;
    return LAB_SAMPLE_PROTOCOLS[key] || null;
  }, [planDraft?.lab_exam_type]);

  const shouldShowSampleCollectionStage =
    !!planDraft?.lab_requested &&
    !!labOrderConfirmed &&
    !!selectedLabProtocol &&
    selectedLabProtocol.sameDayCollection &&
    !selectedLabCollectionRule;

  const {
    previousConsultation,
    previousClinicalSnapshot,
    currentClinicalSnapshot,
    followUpComparisonRows,
    hasTriageForConsult,
    canStartWithoutTriage,
    selectedReturnDate,
    selectedFollowUpTime,
    followUpShiftWindow,
    isClinicalReturnVisit,
    isFollowUpConsultation,
    previousDiagnosis,
    previousPrescription,
    currentComplaintSummary,
    followUpGrowthSummary,
    resolvedFollowUpRuleKey,
    followUpRuleMeta,
    followUpTimeWithinShift,
    finishMissingFields,
    canFinishStrict,
    consultationSteps,
    updatePlanField,
    updateReturnVisitDateByIndex,
  } = useDoctorConsultationState({
    triage,
    selectedVisit,
    patientHistory,
    retakeVitals,
    activeView,
    consultFormStep,
    autoOpenSampleCollectionModal,
    selectedLabProtocol,
    shouldShowSampleCollectionStage,
    safeSet,
    setSampleCollectionModalOpen,
    setAutoOpenSampleCollectionModal,
    planDraft,
    selectedLabCollectionRule,
    useAIQuestionnaire,
    complaintQuestions,
    questionnaireAnswers,
    questionnaireExtraNote,
    followUpDiagnosisEvolution,
    followUpPrescriptionDecision,
    returnVisitDates,
    followUpRuleKey,
    shiftStatus,
    selectedRoomCode,
    labOrderConfirmed,
    labOrderDraft,
    sampleCollectionDraft,
    setConsultFormStep,
    setPlanDraft,
    setPlanAccepted,
    setReturnVisitCount,
    setReturnVisitDates,
  });

  const {
    savingPlan,
    searchFromTopNav,
    finishConsultation,
    askDoctorAI,
    attendPatientFromQueue,
    openLabTrackingFlow,
    createNewConsultationFromFollowup,
    openScheduledReevaluation,
    updateLabExamType,
    confirmLabOrder,
    autoScheduleSampleCollectionReturn,
    cancelSampleCollectionRequest,
    updateQuestionAnswer,
    generateQuestionnaireQuestions,
    openLabResult,
  } = useDoctorConsultationActions({
    me,
    queue,
    safeSet,
    showPopup,
    loadQueue,
    openVisit,
    selectedVisit,
    setSelectedVisit,
    setErr,
    hasTriageForConsult,
    canStartWithoutTriage,
    formatStatus,
    topNavSearch,
    setActiveView,
    detailsPanelRef,
    currentLabEtaPreview,
    finishMissingFields,
    planDraft,
    useAIQuestionnaire,
    complaintQuestions,
    questionnaireAnswers,
    questionnaireExtraNote,
    returnVisitDates,
    isClinicalReturnVisit,
    resolvedFollowUpRuleKey,
    selectedFollowUpTime,
    buildFollowUpReasonText,
    buildFollowUpInstructionsText,
    followUpShiftWindow,
    selectedRoomCode,
    triage,
    retakeVitals,
    labOrderDraft,
    labOrderConfirmed,
    shouldShowSampleCollectionStage,
    sampleCollectionDraft,
    followUpDiagnosisEvolution,
    previousDiagnosis,
    previousPrescription,
    followUpPrescriptionDecision,
    returnVisitCount,
    planAccepted,
    followUpRuleMeta,
    setQueue,
    setLabPendingRequests,
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
    setAiLoading,
    hasGeneratedAiSuggestion,
    patientDetails,
    previousConsultation,
    previousClinicalSnapshot,
    currentClinicalSnapshot,
    followUpComparisonRows,
    isFollowUpConsultation,
    labRequestSupport,
    pendingLabVisits,
    setFollowUpDiagnosisEvolution,
    updatePlanField,
    setFollowUpPrescriptionDecision,
    queueRowsForView,
    filteredQueue,
    setConsultFormStep,
    setHighlightLabOrderCard,
    setAutoOpenSampleCollectionModal,
    setReevaluationContext,
    buildReevaluationContext,
    setLabOrderConfirmed,
    setLabOrderDraft,
    setSampleCollectionDraft,
    setSampleCollectionModalOpen,
    labPendingRequests,
    LAB_RETURN_COLLECTION_RULES,
    toISODate,
    estimateExamReadyMeta,
    countQueuedExamsOnSameMachine,
    findLabExamLabel,
    selectedLabProtocol,
    selectedLabCollectionRule,
    getLabSampleTypeByExam,
    setLabResultModal,
    normalizeQuestions,
    fallbackComplaintQuestions,
    setQuestionnaireLoading,
    setQuestionnaireNotice,
    setUseAIQuestionnaire,
    setReturnVisitCount,
    setReturnVisitDates,
    hasGeneratedQuestionnaire,
    calculateAgeYears,
    selectedReturnDate,
  });

  const openView = useCallback(
    (viewKey) => {
      const path = DOCTOR_VIEW_ROUTES[viewKey];
      if (path && location.pathname !== path) {
        navigate(path);
        return;
      }
      setActiveView(viewKey);
    },
    [location.pathname, navigate, setActiveView]
  );

  const performLogout = async () => {
    await logoutDoctorSession({ intervalRef, heartbeatRef });
  };

  const logout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutBusy(true);
    try {
      await performLogout();
    } finally {
      setLogoutBusy(false);
    }
  };

  useEffect(() => {
    if (err) showPopup("warning", "Atenção", err);
  }, [err, showPopup]);

  return (
    <div
      className={`doctor-page flex h-screen bg-gray-50 ${
        Number(preferences?.font_scale_percent || 100) !== 100 ? "doctor-font-scaled" : ""
      }`}
      style={{
        "--doctor-font-scale": Number(preferences?.font_scale_percent || 100) === 105 ? 1.05 : 1,
      }}
    >
      <style>{doctorPageStyles}</style>

      <AppSidebar
        open={sidebarOpen}
        title="Painel Medico"
        sections={navSections}
        activeKey={activeView}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        onSelect={openView}
        navListRef={navListRef}
        navItemRefs={navItemRefs}
        navIndicator={navIndicator}
        footerActionLabel="Sair"
        onFooterAction={logout}
      />

      <DoctorPageContent
        shiftMenuRef={shiftMenuRef}
        notificationsPreviewRef={notificationsPreviewRef}
        topSearchFocus={topSearchFocus}
        topNavSearch={topNavSearch}
        setTopNavSearch={setTopNavSearch}
        setTopSearchFocus={setTopSearchFocus}
        searchFromTopNav={searchFromTopNav}
        shiftMenuOpen={shiftMenuOpen}
        setShiftMenuOpen={setShiftMenuOpen}
        loadingShift={loadingShift}
        shiftMenuBusy={shiftMenuBusy}
        shiftFeatureAvailable={shiftFeatureAvailable}
        shiftButtonMeta={shiftButtonMeta}
        shiftIcon={shiftIcon}
        shiftStartDisabled={shiftStartDisabled}
        startShift={startShift}
        startingShift={startingShift}
        notificationsUnread={notificationsUnread}
        notificationsPreviewOpen={notificationsPreviewOpen}
        setNotificationsPreviewOpen={setNotificationsPreviewOpen}
        loadNotifications={loadNotifications}
        latestNotification={latestNotification}
        loadingNotifications={loadingNotifications}
        setActiveView={setActiveView}
        me={me}
        activeView={activeView}
        agenda={agenda}
        loadingAgenda={loadingAgenda}
        loadAgenda={loadAgenda}
        loadQueue={loadQueue}
        canOpenConsultationForDate={canOpenConsultationForDate}
        openScheduledReevaluation={openScheduledReevaluation}
        isAgendaView={isAgendaView}
        isHistoryView={isHistoryView}
        historyQuery={historyQuery}
        setHistoryQuery={setHistoryQuery}
        historySearchLoading={historySearchLoading}
        historySearchResults={historySearchResults}
        historySuggestOpen={historySuggestOpen}
        setHistorySuggestOpen={setHistorySuggestOpen}
        historySearchRef={historySearchRef}
        historyModal={historyModal}
        openHistoryPatient={openHistoryPatient}
        closeHistoryModal={closeHistoryModal}
        searchHistoryPatients={searchHistoryPatients}
        isLabView={isLabView}
        pendingDoctorLabRows={pendingDoctorLabRows}
        readyDoctorLabRows={readyDoctorLabRows}
        loadingQueue={loadingQueue}
        notifyingPatientVisitId={notifyingPatientVisitId}
        openLabResult={openLabResult}
        openLabTrackingFlow={openLabTrackingFlow}
        notifyPatientExamReady={notifyPatientExamReady}
        filteredQueue={filteredQueue}
        activeAlertRows={activeAlertRows}
        formatPriorityPt={formatPriorityPt}
        formatStatus={formatStatus}
        openVisit={openVisit}
        filteredNotifications={filteredNotifications}
        markNotificationRead={markNotificationRead}
        markAllNotificationsRead={markAllNotificationsRead}
        shiftStatus={shiftStatus}
        logout={logout}
        preferences={preferences}
        loadingPreferences={loadingPreferences}
        savingPreferences={savingPreferences}
        savePreferences={savePreferences}
        setPreferences={setPreferences}
        myAssignedQueue={myAssignedQueue}
        selectedVisit={selectedVisit}
        attendPatientFromQueue={attendPatientFromQueue}
        createNewConsultationFromFollowup={createNewConsultationFromFollowup}
        queueRowsForView={queueRowsForView}
        consultFormStep={consultFormStep}
        setConsultFormStep={setConsultFormStep}
        patientDetails={patientDetails}
        priorityTheme={priorityTheme}
        consultationSteps={consultationSteps}
        detailsPanelRef={detailsPanelRef}
        calculateAgeYears={calculateAgeYears}
        getVisitReasonLabel={getVisitReasonLabel}
        triage={triage}
        previousConsultation={previousConsultation}
        formatLabDateTimeLabel={formatLabDateTimeLabel}
        followUpComparisonRows={followUpComparisonRows}
        questionnaireLoading={questionnaireLoading}
        hasGeneratedQuestionnaire={hasGeneratedQuestionnaire}
        generateQuestionnaireQuestions={generateQuestionnaireQuestions}
        questionnaireNotice={questionnaireNotice}
        useAIQuestionnaire={useAIQuestionnaire}
        complaintQuestions={complaintQuestions}
        questionnaireAnswers={questionnaireAnswers}
        updateQuestionAnswer={updateQuestionAnswer}
        questionnaireExtraNote={questionnaireExtraNote}
        setQuestionnaireExtraNote={setQuestionnaireExtraNote}
        retakeVitals={retakeVitals}
        setRetakeVitals={setRetakeVitals}
        isFollowUpConsultation={isFollowUpConsultation}
        currentComplaintSummary={currentComplaintSummary}
        followUpGrowthSummary={followUpGrowthSummary}
        previousDiagnosis={previousDiagnosis}
        followUpDiagnosisEvolution={followUpDiagnosisEvolution}
        setFollowUpDiagnosisEvolution={setFollowUpDiagnosisEvolution}
        openModernSelect={openModernSelect}
        setOpenModernSelect={setOpenModernSelect}
        FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS={FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS}
        planDraft={planDraft}
        updatePlanField={updatePlanField}
        previousPrescription={previousPrescription}
        followUpPrescriptionDecision={followUpPrescriptionDecision}
        setFollowUpPrescriptionDecision={setFollowUpPrescriptionDecision}
        FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS={FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS}
        labOrderCardRef={labOrderCardRef}
        highlightLabOrderCard={highlightLabOrderCard}
        cancelSampleCollectionRequest={cancelSampleCollectionRequest}
        setLabOrderConfirmed={setLabOrderConfirmed}
        selectedLabProtocol={selectedLabProtocol}
        LAB_EXAM_OPTIONS={LAB_EXAM_OPTIONS}
        updateLabExamType={updateLabExamType}
        labOrderDraft={labOrderDraft}
        setLabOrderDraft={setLabOrderDraft}
        setPlanAccepted={setPlanAccepted}
        LAB_ORDER_PRIORITY_OPTIONS={LAB_ORDER_PRIORITY_OPTIONS}
        labRequestSupport={labRequestSupport}
        findLabExamLabel={findLabExamLabel}
        currentLabEtaPreview={currentLabEtaPreview}
        selectedLabCollectionRule={selectedLabCollectionRule}
        formatEtaPt={formatEtaPt}
        autoScheduleSampleCollectionReturn={autoScheduleSampleCollectionReturn}
        labOrderConfirmed={labOrderConfirmed}
        confirmLabOrder={confirmLabOrder}
        DISPOSITION_OPTIONS={DISPOSITION_OPTIONS}
        setReturnVisitCount={setReturnVisitCount}
        setReturnVisitDates={setReturnVisitDates}
        setFollowUpRuleKey={setFollowUpRuleKey}
        extractFollowUpTimeValue={extractFollowUpTimeValue}
        parseShiftWindow={parseShiftWindow}
        followUpShiftWindow={followUpShiftWindow}
        setSelectedRoomCode={setSelectedRoomCode}
        VITAL_STATUS_OPTIONS={VITAL_STATUS_OPTIONS}
        isClinicalReturnVisit={isClinicalReturnVisit}
        resolvedFollowUpRuleKey={resolvedFollowUpRuleKey}
        buildFollowUpReasonText={buildFollowUpReasonText}
        buildFollowUpInstructionsText={buildFollowUpInstructionsText}
        selectedReturnDate={selectedReturnDate}
        selectedFollowUpTime={selectedFollowUpTime}
        updateReturnVisitDateByIndex={updateReturnVisitDateByIndex}
        followUpTimeWithinShift={followUpTimeWithinShift}
        FOLLOW_UP_RULE_OPTIONS={FOLLOW_UP_RULE_OPTIONS}
        followUpRuleMeta={followUpRuleMeta}
        askDoctorAI={askDoctorAI}
        aiLoading={aiLoading}
        aiEnabled={aiEnabled}
        hasGeneratedAiSuggestion={hasGeneratedAiSuggestion}
        finishMissingFields={finishMissingFields}
        planAccepted={planAccepted}
        finishConsultation={finishConsultation}
        canFinishStrict={canFinishStrict}
        savingPlan={savingPlan}
        activeAlertCount={activeAlertCount}
        waitingTopPriority={waitingTopPriority}
        waitingCount={waitingCount}
        inConsultTopPriority={inConsultTopPriority}
        inConsultCount={inConsultCount}
        agendaTodayCount={agendaTodayCount}
        dashboardNextPatients={dashboardNextPatients}
        dashboardPriorityMeta={dashboardPriorityMeta}
        openView={openView}
        dashboardHourSeries={dashboardHourSeries}
        dashboardPriorityRows={dashboardPriorityRows}
        dashboardAlertPreview={dashboardAlertPreview}
        dashboardStatusRows={dashboardStatusRows}
        pendingLabVisits={pendingLabVisits}
        doctorLabWorklistRows={doctorLabWorklistRows}
        getLabProgressTheme={getLabProgressTheme}
        labResultModal={labResultModal}
        setLabResultModal={setLabResultModal}
        sampleCollectionModalOpen={sampleCollectionModalOpen}
        shouldShowSampleCollectionStage={shouldShowSampleCollectionStage}
        sampleCollectionDraft={sampleCollectionDraft}
        setSampleCollectionDraft={setSampleCollectionDraft}
        setSampleCollectionModalOpen={setSampleCollectionModalOpen}
        aiSuggestionOpen={aiSuggestionOpen}
        aiResult={aiResult}
        setAiSuggestionOpen={setAiSuggestionOpen}
      />

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Confirmar logout"
        message="Tem a certeza de que deseja terminar a sessão e voltar ao ecrã de login?"
        confirmLabel="Terminar sessão"
        busy={logoutBusy}
        onClose={() => {
          if (!logoutBusy) setLogoutConfirmOpen(false);
        }}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
