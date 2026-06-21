import DoctorConsultationDiagnosisStep from "./DoctorConsultationDiagnosisStep";
import DoctorConsultationFinishStep from "./DoctorConsultationFinishStep";
import DoctorConsultationOverviewStep from "./DoctorConsultationOverviewStep";
import DoctorConsultationPlanStep from "./DoctorConsultationPlanStep";
import DoctorConsultationQuestionnaireStep from "./DoctorConsultationQuestionnaireStep";
import DoctorConsultationStepFooter from "./DoctorConsultationStepFooter";

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e7e9ed",
  borderRadius: 13,
  overflow: "hidden",
};

const factIconStyle = {
  width: 30,
  height: 30,
  borderRadius: 8,
  flexShrink: 0,
  background: "#fff",
  border: "1px solid #cfe9dc",
  color: "#0c5a44",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 800,
};

function FactIcon({ type }) {
  return (
    <span style={factIconStyle}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {type === "flow" ? (
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 11h-6" />
            <path d="M19 8v6" />
          </>
        ) : type === "source" ? (
          <>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
          </>
        ) : type === "action" ? (
          <>
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M9 12h6" />
            <path d="M9 16h6" />
          </>
        ) : (
          <>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <path d="M4 22v-7" />
          </>
        )}
      </svg>
    </span>
  );
}

const getInitials = (name) =>
  String(name || "P")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export default function DoctorConsultationFormView(props) {
  const {
    selectedVisit,
    patientDetails,
    priorityTheme,
    formatPriorityPt,
    formatStatus,
    consultationSteps,
    consultFormStep,
    setConsultFormStep,
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
    isFollowUpConsultation,
    consultationMode,
    consultationModeMeta,
    currentComplaintSummary,
    followUpGrowthSummary,
    previousDiagnosis,
    followUpDiagnosisEvolution,
    setFollowUpDiagnosisEvolution,
    ModernSelect,
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
    _cancelSampleCollectionRequest,
    setLabOrderConfirmed,
    selectedLabProtocol,
    LAB_EXAM_OPTIONS,
    _updateLabExamType,
    labOrderDraft,
    setLabOrderDraft,
    setPlanAccepted,
    LAB_ORDER_PRIORITY_OPTIONS,
    labRequestSupport,
    findLabExamLabel,
    currentLabEtaPreview,
    selectedLabCollectionRule,
    formatEtaPt,
    _autoScheduleSampleCollectionReturn,
    labOrderConfirmed,
    _confirmLabOrder,
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
    _updateReturnVisitDateByIndex,
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
  } = props;

  const visitReason = selectedVisit?.id ? getVisitReasonLabel(selectedVisit) : "";
  const previousVisitId =
    selectedVisit?.parent_visit_id ||
    selectedVisit?.parent_visit_id_resolved ||
    selectedVisit?.source_visit_id ||
    previousConsultation?.id ||
    previousConsultation?.visit_id ||
    "";
  const activeStepIndex = Math.max(
    0,
    consultationSteps.findIndex((step) => step.id === consultFormStep)
  );
  const activeStep = consultationSteps[activeStepIndex] || consultationSteps[0] || null;
  const activeStepKey = activeStep?.key || "overview";
  const patientName = selectedVisit?.full_name || patientDetails?.full_name || "Selecione um paciente";
  const flowItems = [
    ["Fluxo", consultationModeMeta?.flowLabel || consultationModeMeta?.title || "Consulta", "flow"],
    ["Origem", consultationModeMeta?.sourceLabel || "Fila clinica", "source"],
    ["Acao agora", consultationModeMeta?.primaryAction || "Avaliar paciente", "action"],
    ["Decisao final", consultationModeMeta?.nextDecision || "Definir destino", "decision"],
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'IBM Plex Sans', system-ui, sans-serif", paddingBottom: 88 }}>
      <div className="cf-wrap" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1180 }}>
        <section style={{ ...cardStyle, borderLeft: "4px solid #0f6e54" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "20px 22px 18px", flexWrap: "wrap" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                flexShrink: 0,
                background: "#eaf6f0",
                color: "#0c5a44",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {getInitials(patientName)}
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 5 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#161a23" }}>{patientName}</span>
                {selectedVisit?.id && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "4px 10px 4px 8px",
                      borderRadius: 20,
                      background: "#eaf6f0",
                      border: "1px solid #cfe9dc",
                      color: "#0c5a44",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
                    {formatPriorityPt(selectedVisit?.priority)}
                  </span>
                )}
                {selectedVisit?.id && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: "4px 10px 4px 8px",
                      borderRadius: 20,
                      background: "#eaf1fd",
                      color: "#1d54c0",
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1d54c0" }} />
                    {formatStatus(selectedVisit.status)}
                  </span>
                )}
              </div>
              {selectedVisit?.id && (
                <div style={{ fontSize: 12.5, color: "#9aa3b2", marginBottom: 10 }}>Visita #{selectedVisit.id}</div>
              )}
              {consultationModeMeta?.summary && (
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6c7689", lineHeight: 1.55, maxWidth: 640 }}>
                  {consultationModeMeta.summary}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    display: "inline-flex",
                    minHeight: 26,
                    alignItems: "center",
                    padding: "5px 10px",
                    borderRadius: 999,
                    border: "1px dashed #e7e9ed",
                    color: "#9aa3b2",
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  Motivo: {visitReason || "Sem motivo registado"}
                </span>
                {previousVisitId && consultationMode !== "NORMAL" && (
                  <span
                    style={{
                      display: "inline-flex",
                      minHeight: 26,
                      alignItems: "center",
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: "1px dashed #e7e9ed",
                      color: "#9aa3b2",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    Ligado a visita #{previousVisitId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "stretch", background: "#f6faf8", borderTop: "1px solid #eef0f3", padding: "14px 22px", flexWrap: "wrap" }}>
            {flowItems.map(([label, value, icon], index) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                  minWidth: 190,
                  padding: "2px 18px",
                  borderLeft: index === 0 ? "none" : "1px solid #eef0f3",
                }}
              >
                <FactIcon type={icon} />
                <span>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", color: "#9aa3b2", textTransform: "uppercase" }}>
                    {label}
                  </span>
                  <span style={{ display: "block", marginTop: 2, fontSize: 13, fontWeight: 700, color: "#161a23", lineHeight: 1.3 }}>
                    {value}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...cardStyle, display: "flex", alignItems: "center", padding: "16px 26px", overflowX: "auto" }}>
          <div className="flex w-full items-center">
            {consultationSteps.map((step, index) => {
              const done = index < activeStepIndex;
              const active = index === activeStepIndex;
              const isLast = index === consultationSteps.length - 1;
              return (
                <div key={step.id} className="flex min-w-fit flex-1 items-center">
                  <button type="button" onClick={() => setConsultFormStep(step.id)} className="flex items-center gap-2.5">
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] font-bold"
                      style={{
                        background: done ? "#eaf6f0" : active ? "#0f6e54" : "#eef0f3",
                        color: done ? "#0c5a44" : active ? "#fff" : "#9aa3b2",
                        border: done ? "1.5px solid #0f6e54" : "none",
                      }}
                    >
                      {done ? "✓" : step.id}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 600, color: active ? "#161a23" : "#9aa3b2", whiteSpace: "nowrap" }}>
                      {step.label}
                    </span>
                  </button>
                  {!isLast && <span className="mx-4 h-px min-w-6 flex-1 bg-[#e7e9ed]" />}
                </div>
              );
            })}
          </div>
        </section>

        {!selectedVisit?.id ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Selecione um paciente na lista para iniciar a consulta.</p>
          </div>
        ) : (
          <div ref={detailsPanelRef} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeStepKey === "overview" && (
              <DoctorConsultationOverviewStep
                patientDetails={patientDetails}
                selectedVisit={selectedVisit}
                calculateAgeYears={calculateAgeYears}
                formatStatus={formatStatus}
                getVisitReasonLabel={getVisitReasonLabel}
                triage={triage}
                previousConsultation={previousConsultation}
                formatLabDateTimeLabel={formatLabDateTimeLabel}
                followUpComparisonRows={followUpComparisonRows}
              />
            )}

            {activeStepKey === "questionnaire" && (
              <DoctorConsultationQuestionnaireStep
                questionnaireLoading={questionnaireLoading}
                triage={triage}
                hasGeneratedQuestionnaire={hasGeneratedQuestionnaire}
                generateQuestionnaireQuestions={generateQuestionnaireQuestions}
                questionnaireNotice={questionnaireNotice}
                useAIQuestionnaire={useAIQuestionnaire}
                complaintQuestions={complaintQuestions}
                questionnaireAnswers={questionnaireAnswers}
                updateQuestionAnswer={updateQuestionAnswer}
                questionnaireExtraNote={questionnaireExtraNote}
                setQuestionnaireExtraNote={setQuestionnaireExtraNote}
              />
            )}

            {activeStepKey === "diagnosis" && (
              <DoctorConsultationDiagnosisStep
                isFollowUpConsultation={isFollowUpConsultation}
                consultationMode={consultationMode}
                currentComplaintSummary={currentComplaintSummary}
                followUpGrowthSummary={followUpGrowthSummary}
                followUpComparisonRows={followUpComparisonRows}
                previousDiagnosis={previousDiagnosis}
                followUpDiagnosisEvolution={followUpDiagnosisEvolution}
                setFollowUpDiagnosisEvolution={setFollowUpDiagnosisEvolution}
                ModernSelect={ModernSelect}
                openModernSelect={openModernSelect}
                setOpenModernSelect={setOpenModernSelect}
                FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS={FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS}
                planDraft={planDraft}
                updatePlanField={updatePlanField}
              />
            )}

            {activeStepKey === "plan" && (
              <DoctorConsultationPlanStep
                isFollowUpConsultation={isFollowUpConsultation}
                consultationMode={consultationMode}
                previousPrescription={previousPrescription}
                followUpPrescriptionDecision={followUpPrescriptionDecision}
                setFollowUpPrescriptionDecision={setFollowUpPrescriptionDecision}
                ModernSelect={ModernSelect}
                openModernSelect={openModernSelect}
                setOpenModernSelect={setOpenModernSelect}
                FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS={FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS}
                planDraft={planDraft}
                updatePlanField={updatePlanField}
                labOrderCardRef={labOrderCardRef}
                highlightLabOrderCard={highlightLabOrderCard}
                _cancelSampleCollectionRequest={_cancelSampleCollectionRequest}
                setLabOrderConfirmed={setLabOrderConfirmed}
                selectedLabProtocol={selectedLabProtocol}
                LAB_EXAM_OPTIONS={LAB_EXAM_OPTIONS}
                _updateLabExamType={_updateLabExamType}
                labOrderDraft={labOrderDraft}
                setLabOrderDraft={setLabOrderDraft}
                setPlanAccepted={setPlanAccepted}
                LAB_ORDER_PRIORITY_OPTIONS={LAB_ORDER_PRIORITY_OPTIONS}
                labRequestSupport={labRequestSupport}
                findLabExamLabel={findLabExamLabel}
                currentLabEtaPreview={currentLabEtaPreview}
                selectedLabCollectionRule={selectedLabCollectionRule}
                formatEtaPt={formatEtaPt}
                _autoScheduleSampleCollectionReturn={_autoScheduleSampleCollectionReturn}
                labOrderConfirmed={labOrderConfirmed}
                _confirmLabOrder={_confirmLabOrder}
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
                _updateReturnVisitDateByIndex={_updateReturnVisitDateByIndex}
                followUpTimeWithinShift={followUpTimeWithinShift}
                FOLLOW_UP_RULE_OPTIONS={FOLLOW_UP_RULE_OPTIONS}
                followUpRuleMeta={followUpRuleMeta}
              />
            )}

            {activeStepKey === "finish" && (
              <DoctorConsultationFinishStep
                askDoctorAI={askDoctorAI}
                aiLoading={aiLoading}
                aiEnabled={aiEnabled}
                hasGeneratedAiSuggestion={hasGeneratedAiSuggestion}
                finishMissingFields={finishMissingFields}
                finishChecklistItems={finishChecklistItems}
                consultationSteps={consultationSteps}
                setConsultFormStep={setConsultFormStep}
                planAccepted={planAccepted}
                finishConsultation={finishConsultation}
                canFinishStrict={canFinishStrict}
                savingPlan={savingPlan}
              />
            )}

            <DoctorConsultationStepFooter
              consultFormStep={consultFormStep}
              consultationSteps={consultationSteps}
              setConsultFormStep={setConsultFormStep}
            />
          </div>
        )}
      </div>
    </div>
  );
}
