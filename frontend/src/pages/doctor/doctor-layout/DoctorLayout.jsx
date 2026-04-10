import AppNavbar from "../../../components/shared/layout/AppNavbar";
import DoctorAgenda from "../doctor-agenda/DoctorAgenda";
import { DoctorScheduledFollowupsView } from "../doctor-followups/DoctorScheduledFollowups";
import { DoctorWaitingQueueView } from "../doctor-waitingqueue/DoctorWaitingQueue";
import { PatientClinicalHistoryView } from "../doctor-pacientes/PatientClinicalHistory";
import LabWorklistView from "../doctor-exames/LabWorklistView";
import { DoctorDashboardView } from "../doctor-dashboard/DoctorDashboard";
import { PatientActiveAlertsView } from "../doctor-alertas/PatientActiveAlerts";
import DoctorAISuggestionModal from "../doctor-consultation/DoctorAISuggestionModal";
import DoctorConsultationFormView from "../doctor-consultation/DoctorConsultationFormView";
import DoctorModernSelect from "../doctor-consultation/DoctorModernSelect";
import PatientLabResultModal from "../doctor-exames/PatientLabResultModal";
import PatientSampleCollectionModal from "../doctor-exames/PatientSampleCollectionModal";
import { DoctorNotificationsView } from "../doctor-configuracao/DoctorNotifications";
import { DoctorPreferencesView } from "../doctor-configuracao/DoctorPreferences";
import { DoctorPacientesView } from "../doctor-pacientes/DoctorPacientes";

export default function DoctorLayout(props) {
  const {
    shiftMenuRef,
    notificationsPreviewRef,
    topSearchFocus,
    topNavSearch,
    setTopNavSearch,
    setTopSearchFocus,
    searchFromTopNav,
    shiftMenuOpen,
    setShiftMenuOpen,
    loadingShift,
    shiftMenuBusy,
    shiftFeatureAvailable,
    shiftButtonMeta,
    shiftIcon,
    shiftStartDisabled,
    startShift,
    startingShift,
    notificationsUnread,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    loadNotifications,
    latestNotification,
    loadingNotifications,
    setActiveView,
    me,
    activeView,
    agenda,
    loadingAgenda,
    loadAgenda,
    loadQueue,
    canOpenConsultationForDate,
    openScheduledReevaluation,
    isHistoryView,
    historyQuery,
    setHistoryQuery,
    historySearchLoading,
    historySearchResults,
    historySuggestOpen,
    setHistorySuggestOpen,
    historySearchRef,
    historyModal,
    openHistoryPatient,
    closeHistoryModal,
    searchHistoryPatients,
    isLabView,
    pendingDoctorLabRows,
    readyDoctorLabRows,
    loadingQueue,
    notifyingPatientVisitId,
    markingDeliveredVisitId,
    openLabResult,
    openLabTrackingFlow,
    notifyPatientExamReady,
    markPatientResultDelivered,
    filteredQueue,
    activeAlertRows,
    formatPriorityPt,
    formatStatus,
    openVisit,
    filteredNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    shiftStatus,
    logout,
    preferences,
    loadingPreferences,
    savingPreferences,
    savePreferences,
    setPreferences,
    popup,
    closePopup,
    myAssignedQueue,
    selectedVisit,
    attendPatientFromQueue,
    createNewConsultationFromFollowup,
    queueRowsForView,
    consultFormStep,
    setConsultFormStep,
    patientDetails,
    priorityTheme,
    consultationSteps,
    detailsPanelRef,
    calculateAgeYears,
    getVisitReasonLabel,
    triage,
    previousConsultation,
    formatLabDateTimeLabel,
    followUpComparisonRows,
    questionnaireLoading,
    hasGeneratedQuestionnaire,
    generateQuestionnaireQuestions,
    questionnaireNotice,
    useAIQuestionnaire,
    complaintQuestions,
    questionnaireAnswers,
    updateQuestionAnswer,
    questionnaireExtraNote,
    setQuestionnaireExtraNote,
    retakeVitals,
    setRetakeVitals,
    isFollowUpConsultation,
    currentComplaintSummary,
    followUpGrowthSummary,
    previousDiagnosis,
    followUpDiagnosisEvolution,
    setFollowUpDiagnosisEvolution,
    openModernSelect,
    setOpenModernSelect,
    FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS,
    planDraft,
    updatePlanField,
    previousPrescription,
    followUpPrescriptionDecision,
    setFollowUpPrescriptionDecision,
    FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS,
    labOrderCardRef,
    highlightLabOrderCard,
    cancelSampleCollectionRequest,
    setLabOrderConfirmed,
    selectedLabProtocol,
    LAB_EXAM_OPTIONS,
    updateLabExamType,
    labOrderDraft,
    setLabOrderDraft,
    setPlanAccepted,
    LAB_ORDER_PRIORITY_OPTIONS,
    labRequestSupport,
    findLabExamLabel,
    currentLabEtaPreview,
    selectedLabCollectionRule,
    formatEtaPt,
    autoScheduleSampleCollectionReturn,
    labOrderConfirmed,
    confirmLabOrder,
    DISPOSITION_OPTIONS,
    setReturnVisitCount,
    setReturnVisitDates,
    setFollowUpRuleKey,
    extractFollowUpTimeValue,
    parseShiftWindow,
    followUpShiftWindow,
    setSelectedRoomCode,
    VITAL_STATUS_OPTIONS,
    isClinicalReturnVisit,
    resolvedFollowUpRuleKey,
    buildFollowUpReasonText,
    buildFollowUpInstructionsText,
    selectedReturnDate,
    selectedFollowUpTime,
    updateReturnVisitDateByIndex,
    followUpTimeWithinShift,
    FOLLOW_UP_RULE_OPTIONS,
    followUpRuleMeta,
    askDoctorAI,
    aiLoading,
    aiEnabled,
    hasGeneratedAiSuggestion,
    finishMissingFields,
    planAccepted,
    finishConsultation,
    canFinishStrict,
    savingPlan,
    activeAlertCount,
    waitingTopPriority,
    waitingCount,
    inConsultTopPriority,
    inConsultCount,
    agendaTodayCount,
    dashboardNextPatients,
    dashboardPriorityMeta,
    openView,
    dashboardHourSeries,
    dashboardPriorityRows,
    dashboardAlertPreview,
    dashboardStatusRows,
    pendingLabVisits,
    doctorLabWorklistRows,
    getLabProgressTheme,
    labResultModal,
    setLabResultModal,
    sampleCollectionModalOpen,
    shouldShowSampleCollectionStage,
    sampleCollectionDraft,
    setSampleCollectionDraft,
    setSampleCollectionModalOpen,
    aiSuggestionOpen,
    aiResult,
    setAiSuggestionOpen,
  } = props;

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <AppNavbar
          left={
            <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  maxWidth: "360px",
                  background: "#f9fafb",
                  border: `1px solid ${topSearchFocus ? "#86efac" : "#dbe5df"}`,
                  borderRadius: "999px",
                  padding: "9px 16px",
                  transition: "border-color 0.15s",
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
                  onFocus={() => setTopSearchFocus(true)}
                  onBlur={() => setTopSearchFocus(false)}
                  onKeyDown={(e) => e.key === "Enter" && searchFromTopNav()}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: "13px",
                    color: "#374151",
                    width: "100%",
                  }}
                />
              </div>
            </div>
          }
          right={
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}
              >
                <div ref={shiftMenuRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={() => setShiftMenuOpen((prev) => !prev)}
                    disabled={loadingShift || shiftMenuBusy || !shiftFeatureAvailable}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      border: `1px solid ${shiftButtonMeta.border}`,
                      background: shiftButtonMeta.background,
                      color: shiftButtonMeta.color,
                      fontWeight: "700",
                      cursor:
                        loadingShift || shiftMenuBusy || !shiftFeatureAvailable
                          ? "not-allowed"
                          : "pointer",
                      opacity: loadingShift || shiftMenuBusy || !shiftFeatureAvailable ? 0.7 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                    title="Abrir menu do turno"
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
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
                      </span>
                    </span>
                  </button>
                  {shiftMenuOpen && shiftFeatureAvailable && (
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
                        style={{
                          width: "100%",
                          textAlign: "left",
                          border: "none",
                          borderRadius: "999px",
                          background: "transparent",
                          padding: "8px 10px",
                          minHeight: "36px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#111827",
                          cursor: shiftStartDisabled ? "not-allowed" : "pointer",
                          opacity: shiftStartDisabled ? 0.5 : 1,
                        }}
                      >
                        {startingShift ? "A iniciar..." : "Iniciar Turno"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                    transition: "background 0.15s",
                  }}
                  title="Notificações"
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
                      width: "340px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "18px",
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
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                          Notificações
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {notificationsUnread > 0
                            ? `${notificationsUnread} por ler`
                            : "Tudo em dia"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsPreviewOpen(false);
                          openView("notifications");
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
                            {latestNotification?.title || "Notificação"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.4 }}>
                            {latestNotification?.message || "-"}
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
                  maxWidth: "220px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {me?.full_name || "Médico(a)"}
                {!!me?.specialization && ` · ${me.specialization}`}
              </div>
            </div>
          }
          style={{ padding: "0 24px" }}
        />

        <div className="p-8 max-w-6xl mx-auto">
          <div>
            {activeView === "dashboard" && (
              <div className="dash-animate dash-animate-delay-1">
                <DoctorDashboardView
                  me={me}
                  activeAlertCount={activeAlertCount}
                  filteredQueue={filteredQueue}
                  priorityTheme={priorityTheme}
                  waitingTopPriority={waitingTopPriority}
                  waitingCount={waitingCount}
                  inConsultTopPriority={inConsultTopPriority}
                  inConsultCount={inConsultCount}
                  agendaTodayCount={agendaTodayCount}
                  dashboardNextPatients={dashboardNextPatients}
                  dashboardPriorityMeta={dashboardPriorityMeta}
                  formatStatus={formatStatus}
                  onOpenView={openView}
                  onOpenConsultation={(visit) => {
                    setActiveView("consultationForm");
                    openVisit(visit.id, visit);
                  }}
                  dashboardHourSeries={dashboardHourSeries}
                  dashboardPriorityRows={dashboardPriorityRows}
                  dashboardAlertPreview={dashboardAlertPreview}
                  myAssignedQueue={myAssignedQueue}
                  dashboardStatusRows={dashboardStatusRows}
                  pendingLabVisits={pendingLabVisits}
                  doctorLabWorklistRows={doctorLabWorklistRows}
                  onOpenLabTracking={openLabTrackingFlow}
                  getLabProgressTheme={getLabProgressTheme}
                />
              </div>
            )}
            {props.isAgendaView && (
              <div className="dash-animate dash-animate-delay-1">
                <DoctorAgenda
                  assignedToday={agenda.assigned_today}
                  returnsToday={agenda.returns_today}
                  loading={loadingAgenda}
                  onRefresh={() => {
                    loadAgenda();
                    loadQueue();
                  }}
                  onOpenVisit={(visitId, meta) => {
                    if (!canOpenConsultationForDate(meta)) return;
                    openScheduledReevaluation(visitId, null, meta);
                  }}
                />
              </div>
            )}
            {activeView === "scheduledFollowups" && (
              <div className="dash-animate dash-animate-delay-1">
                <DoctorScheduledFollowupsView
                  returnsToday={agenda.returns_today}
                  loading={loadingAgenda}
                  onRefresh={() => {
                    loadAgenda();
                    loadQueue();
                  }}
                  onOpenVisit={(visitId, meta) => {
                    if (!canOpenConsultationForDate(meta)) return;
                    openScheduledReevaluation(visitId, null, meta);
                  }}
                />
              </div>
            )}
            {isHistoryView && (
              <div className="dash-animate dash-animate-delay-1">
                <PatientClinicalHistoryView
                  historyQuery={historyQuery}
                  setHistoryQuery={setHistoryQuery}
                  historySearchLoading={historySearchLoading}
                  historySearchResults={historySearchResults}
                  historySuggestOpen={historySuggestOpen}
                  setHistorySuggestOpen={setHistorySuggestOpen}
                  historySearchRef={historySearchRef}
                  historyModal={historyModal}
                  onOpenHistoryPatient={openHistoryPatient}
                  onCloseHistoryModal={closeHistoryModal}
                  onSearchHistoryPatients={searchHistoryPatients}
                />
              </div>
            )}
            {isLabView && (
              <div className="dash-animate dash-animate-delay-1">
                <LabWorklistView
                  pendingRows={pendingDoctorLabRows}
                  readyRows={readyDoctorLabRows}
                  loading={loadingQueue}
                  notifyingPatientVisitId={notifyingPatientVisitId}
                  markingDeliveredVisitId={markingDeliveredVisitId}
                  onRefresh={loadQueue}
                  onOpenLabResult={openLabResult}
                  onOpenLabTracking={openLabTrackingFlow}
                  onNotifyPatient={notifyPatientExamReady}
                  onMarkDelivered={markPatientResultDelivered}
                />
              </div>
            )}
            {activeView === "activeAlerts" && (
              <div className="dash-animate dash-animate-delay-1">
                <PatientActiveAlertsView
                  activeAlertRows={activeAlertRows}
                  filteredQueue={filteredQueue}
                  formatPriorityPt={formatPriorityPt}
                  formatStatus={formatStatus}
                  onOpenVisit={(visit) => {
                    setActiveView("consultationForm");
                    openVisit(visit.id, visit);
                  }}
                />
              </div>
            )}
            {activeView === "notifications" && (
              <div className="dash-animate dash-animate-delay-1">
                <DoctorNotificationsView
                  notifications={filteredNotifications}
                  unreadCount={notificationsUnread}
                  loading={loadingNotifications}
                  onRefresh={loadNotifications}
                  onMarkRead={markNotificationRead}
                  onMarkAllRead={markAllNotificationsRead}
                />
              </div>
            )}
            {activeView === "preferences" && (
              <div className="dash-animate dash-animate-delay-1">
                <DoctorPreferencesView
                  me={me}
                  shiftStatus={shiftStatus}
                  onLogout={logout}
                  preferences={preferences}
                  loading={loadingPreferences}
                  saving={savingPreferences}
                  onSave={savePreferences}
                  onPreview={(partial) =>
                    setPreferences((prev) => ({ ...prev, ...(partial || {}) }))
                  }
                />
              </div>
            )}
            {activeView === "myPatients" && (
              <div className="dash-animate dash-animate-delay-1">
                <DoctorPacientesView
                  queue={myAssignedQueue}
                  loading={loadingQueue}
                  onRefresh={loadQueue}
                  onOpenVisit={(visitId, previewVisit) => {
                    setActiveView("consultationForm");
                    const preview =
                      previewVisit && Number(previewVisit.id) === Number(visitId)
                        ? previewVisit
                        : myAssignedQueue.find((v) => Number(v.id) === Number(visitId)) ||
                          filteredQueue.find((v) => Number(v.id) === Number(visitId)) ||
                          null;
                    openVisit(visitId, preview);
                    setConsultFormStep(1);
                  }}
                  onAttendVisit={attendPatientFromQueue}
                  onCreateNewConsultation={createNewConsultationFromFollowup}
                  me={me}
                  selectedVisitId={selectedVisit?.id}
                />
              </div>
            )}
            {activeView === "waitingQueue" && (
              <div className="dash-animate dash-animate-delay-1">
                <DoctorWaitingQueueView
                  queue={queueRowsForView}
                  loading={loadingQueue}
                  onRefresh={loadQueue}
                  onOpenVisit={(visitId, previewVisit) => {
                    setActiveView("consultationForm");
                    const preview =
                      previewVisit && Number(previewVisit.id) === Number(visitId)
                        ? previewVisit
                        : queueRowsForView.find((v) => Number(v.id) === Number(visitId)) ||
                          filteredQueue.find((v) => Number(v.id) === Number(visitId)) ||
                          null;
                    openVisit(visitId, preview);
                    setConsultFormStep(1);
                  }}
                  onAttendVisit={attendPatientFromQueue}
                  onCreateNewConsultation={createNewConsultationFromFollowup}
                  me={me}
                  selectedVisitId={selectedVisit?.id}
                />
              </div>
            )}
            {activeView === "consultationForm" && (
              <div className="dash-animate dash-animate-delay-1">
                <DoctorConsultationFormView
                  setActiveView={setActiveView}
                  selectedVisit={selectedVisit}
                  patientDetails={patientDetails}
                  priorityTheme={priorityTheme}
                  formatPriorityPt={formatPriorityPt}
                  formatStatus={formatStatus}
                  consultationSteps={consultationSteps}
                  consultFormStep={consultFormStep}
                  setConsultFormStep={setConsultFormStep}
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
                  ModernSelect={DoctorModernSelect}
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
                  _cancelSampleCollectionRequest={cancelSampleCollectionRequest}
                  setLabOrderConfirmed={setLabOrderConfirmed}
                  selectedLabProtocol={selectedLabProtocol}
                  LAB_EXAM_OPTIONS={LAB_EXAM_OPTIONS}
                  _updateLabExamType={updateLabExamType}
                  labOrderDraft={labOrderDraft}
                  setLabOrderDraft={setLabOrderDraft}
                  setPlanAccepted={setPlanAccepted}
                  LAB_ORDER_PRIORITY_OPTIONS={LAB_ORDER_PRIORITY_OPTIONS}
                  labRequestSupport={labRequestSupport}
                  findLabExamLabel={findLabExamLabel}
                  currentLabEtaPreview={currentLabEtaPreview}
                  selectedLabCollectionRule={selectedLabCollectionRule}
                  formatEtaPt={formatEtaPt}
                  _autoScheduleSampleCollectionReturn={autoScheduleSampleCollectionReturn}
                  labOrderConfirmed={labOrderConfirmed}
                  _confirmLabOrder={confirmLabOrder}
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
                  _updateReturnVisitDateByIndex={updateReturnVisitDateByIndex}
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
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <PatientLabResultModal
        modal={labResultModal}
        onClose={() =>
          setLabResultModal({ open: false, row: null, loading: false, explanation: "", error: "" })
        }
      />

      <PatientSampleCollectionModal
        open={sampleCollectionModalOpen}
        shouldShow={shouldShowSampleCollectionStage}
        findLabExamLabel={findLabExamLabel}
        planDraft={planDraft}
        onClose={() => setSampleCollectionModalOpen(false)}
        selectedLabProtocol={selectedLabProtocol}
        sampleCollectionDraft={sampleCollectionDraft}
        setSampleCollectionDraft={setSampleCollectionDraft}
        openModernSelect={openModernSelect}
        setOpenModernSelect={setOpenModernSelect}
      />

      <DoctorAISuggestionModal
        open={aiSuggestionOpen}
        loading={aiLoading}
        aiResult={aiResult}
        onClose={() => setAiSuggestionOpen(false)}
      />

      {popup?.open && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                className={`popup-icon ${
                  popup.type === "success" ? "popup-icon-success" : "popup-icon-warning"
                }`}
              >
                {popup.type === "success" ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
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
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
                  {popup.title}
                </div>
                <div style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {popup.message}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" className="cf-btn-sec" onClick={closePopup}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
