import {
  HeaderBackButton,
  HeaderBellIcon,
} from "../../../components/shared/layout/HeaderControls.jsx";
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
import { DoctorNotificationsView } from "../doctor-configuracao/DoctorNotifications";
import { DoctorPreferencesView } from "../doctor-configuracao/DoctorPreferences";
import { DoctorPacientesView } from "../doctor-pacientes/DoctorPacientes";

export default function DoctorLayout(props) {
  const {
    notificationsPreviewRef,
    topNavSearch,
    setTopNavSearch,
    setTopSearchFocus,
    searchFromTopNav,
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
    highlightedLabResultVisitId,
    setHighlightedLabResultVisitId,
    openLabResultFromQueue,
    filteredQueue,
    activeAlertRows,
    formatPriorityPt,
    formatStatus,
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
    consultationMode,
    consultationModeMeta,
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
    finishChecklistItems,
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
    shouldShowSampleCollectionStage,
    sampleCollectionDraft,
    setSampleCollectionDraft,
    setSampleCollectionModalOpen,
    aiSuggestionOpen,
    aiResult,
    setAiSuggestionOpen,
  } = props;
  const doctorFirstName = me?.full_name?.split(" ")?.[0] || "Doutor";
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
  const profileInitials = (me?.full_name || me?.username || "M")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const profilePhotoUrl = String(
    me?.profile_photo_url || me?.photo_url || me?.avatar_url || me?.image_url || ""
  ).trim();

  return (
    <>
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--doctor-page-bg)" }}>
        <header className="hcm-dashboard-header">
          <div className="hcm-dashboard-header__inner">
            {activeView === "dashboard" ? (
              <div className="hcm-dashboard-header__copy">
                <div className="hcm-dashboard-header__title">
                  Bom dia, Dr. {doctorFirstName}
                </div>
                <p className="hcm-dashboard-header__date">{todayLabel}</p>
              </div>
            ) : (
              <div className="hcm-dashboard-header__copy">
                <HeaderBackButton onClick={() => openView("dashboard")} />
              </div>
            )}
            <label className="hcm-dashboard-header__search" aria-label="Pesquisar paciente">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8a94a6" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={topNavSearch}
                onChange={(e) => setTopNavSearch(e.target.value)}
                onFocus={() => setTopSearchFocus(true)}
                onBlur={() => setTopSearchFocus(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchFromTopNav();
                }}
                placeholder="Pesquisar paciente"
                style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "transparent" }}
              />
            </label>

            <div className="hcm-dashboard-header__actions">
              <div ref={notificationsPreviewRef} className="hcm-dashboard-header__notification-wrap">
                <button
                  type="button"
                  className="hcm-dashboard-header__notification"
                  onClick={() => {
                    setNotificationsPreviewOpen((prev) => !prev);
                    if (!notificationsPreviewOpen) loadNotifications();
                  }}
                  title="Notificacoes"
                  data-tour="notifications"
                  style={{
                    background: notificationsPreviewOpen ? "#edf7f2" : "#ffffff",
                    color: notificationsPreviewOpen ? "#0f5132" : "#526173",
                  }}
                >
                  <HeaderBellIcon />
                  {notificationsUnread ? (
                    <span className="hcm-dashboard-header__badge">
                      {notificationsUnread > 9 ? "9+" : notificationsUnread}
                    </span>
                  ) : null}
                </button>
                {notificationsPreviewOpen && (
                  <div className="doctor-notification-popover" role="status">
                    <div className="doctor-notification-popover__head">
                      <div>
                        <div className="doctor-notification-popover__title">
                          Notificações
                        </div>
                        <div className="doctor-notification-popover__meta">
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
                        className="doctor-notification-popover__link"
                      >
                        Ver todas
                      </button>
                    </div>
                    <div className="doctor-notification-popover__body">
                      {loadingNotifications ? (
                        <div className="skeleton-line" style={{ height: "16px", width: "100%" }} />
                      ) : latestNotification ? (
                        <div className="doctor-notification-popover__item">
                          <div className="doctor-notification-popover__item-title">
                            {latestNotification?.title || "Notificação"}
                          </div>
                          <div className="doctor-notification-popover__message">
                            {latestNotification?.message || "-"}
                          </div>
                        </div>
                      ) : (
                        <div className="doctor-notification-popover__empty">
                          Sem notificações recentes.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button type="button" className="hcm-dashboard-header__profile" title={me?.full_name || me?.username || "Medico(a)"}>
                <span className="hcm-dashboard-header__profile-text">
                  <strong>{me?.full_name || me?.username || "Medico(a)"}</strong>
                  <span>{me?.specialization || "Medico"}</span>
                </span>
                <span className="hcm-dashboard-header__avatar">
                  {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : profileInitials}
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="doctor-content-shell" data-tour="role-content">
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
                    attendPatientFromQueue(visit.id, visit);
                  }}
                  dashboardHourSeries={dashboardHourSeries}
                  dashboardPriorityRows={dashboardPriorityRows}
                  dashboardAlertPreview={dashboardAlertPreview}
                  myAssignedQueue={myAssignedQueue}
                  dashboardStatusRows={dashboardStatusRows}
                  pendingLabVisits={pendingLabVisits}
                  doctorLabWorklistRows={doctorLabWorklistRows}
                  agenda={agenda}
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
                  highlightedVisitId={highlightedLabResultVisitId}
                  onClearHighlight={() => setHighlightedLabResultVisitId(null)}
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
                    attendPatientFromQueue(visit.id, visit);
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
                    const preview =
                      previewVisit && Number(previewVisit.id) === Number(visitId)
                        ? previewVisit
                        : myAssignedQueue.find((v) => Number(v.id) === Number(visitId)) ||
                          filteredQueue.find((v) => Number(v.id) === Number(visitId)) ||
                          null;
                    attendPatientFromQueue(visitId, preview);
                  }}
                  onAttendVisit={attendPatientFromQueue}
                  onOpenLabResult={openLabResultFromQueue}
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
                    const preview =
                      previewVisit && Number(previewVisit.id) === Number(visitId)
                        ? previewVisit
                        : queueRowsForView.find((v) => Number(v.id) === Number(visitId)) ||
                          filteredQueue.find((v) => Number(v.id) === Number(visitId)) ||
                          null;
                    attendPatientFromQueue(visitId, preview);
                  }}
                  onAttendVisit={attendPatientFromQueue}
                  onOpenLabResult={openLabResultFromQueue}
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
                  consultationMode={consultationMode}
                  consultationModeMeta={consultationModeMeta}
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
                  finishChecklistItems={finishChecklistItems}
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
        onMarkDelivered={markPatientResultDelivered}
        markingDelivered={
          Boolean(labResultModal?.row?.id) &&
          Number(markingDeliveredVisitId) === Number(labResultModal.row.id)
        }
        onClose={() =>
          setLabResultModal({ open: false, row: null, loading: false, explanation: "", error: "" })
        }
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
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "#e2e8f0", margin: "0 auto 22px" }} />
            <div
              className={`popup-icon ${
                popup.type === "success" ? "popup-icon-success" : "popup-icon-warning"
              }`}
            >
              {popup.type === "success" ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {popup.title}
            </h3>
            <p style={{ margin: "0 auto 24px", fontSize: 13, color: "#64748b", lineHeight: 1.65, maxWidth: 290, whiteSpace: "pre-wrap" }}>
              {popup.message}
            </p>
            <button type="button" className="cf-btn-main" onClick={closePopup} style={{ width: "100%", minHeight: 44, borderRadius: 14 }}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
