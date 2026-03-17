import DoctorConsultationDiagnosisStep from "./DoctorConsultationDiagnosisStep";
import DoctorConsultationFinishStep from "./DoctorConsultationFinishStep";
import DoctorConsultationOverviewStep from "./DoctorConsultationOverviewStep";
import DoctorConsultationPlanStep from "./DoctorConsultationPlanStep";
import DoctorConsultationQuestionnaireStep from "./DoctorConsultationQuestionnaireStep";
import DoctorConsultationStepFooter from "./DoctorConsultationStepFooter";

export default function DoctorConsultationFormView(props) {
  const {
    setActiveView,
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
    retakeVitals,
    setRetakeVitals,
    isFollowUpConsultation,
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
    planAccepted,
    finishConsultation,
    canFinishStrict,
    savingPlan,
  } = props;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <div className="cf-wrap" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
              Consulta Médica
            </h2>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              Formulário clínico · Preencha por fases
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView("waitingQueue")}
            className="cf-btn-sec"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Voltar
          </button>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg,#0c3a24 0%,#155030 55%,#1c7a4e 100%)",
            borderRadius: 18,
            padding: "18px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.14)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {(selectedVisit?.full_name || patientDetails?.full_name || "P")[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>
                  {selectedVisit?.full_name || patientDetails?.full_name || "Selecione um paciente"}
                </span>
                {selectedVisit?.id && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: priorityTheme(selectedVisit?.priority).chipBg,
                      border: `1px solid ${priorityTheme(selectedVisit?.priority).chipBorder}`,
                      color: priorityTheme(selectedVisit?.priority).text,
                    }}
                  >
                    {formatPriorityPt(selectedVisit?.priority)}
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {selectedVisit?.id && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    Visita #{selectedVisit.id}
                  </span>
                )}
                {selectedVisit?.id && (
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>·</span>
                )}
                {selectedVisit?.id && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    {formatStatus(selectedVisit.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="cf-card" style={{ padding: "14px 20px" }}>
          <div className="flex items-center gap-1 overflow-x-auto">
            {consultationSteps.map((s, idx) => {
              const done = consultFormStep > s.id;
              const active = consultFormStep === s.id;
              const isLast = idx === consultationSteps.length - 1;
              return (
                <div key={s.id} className="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setConsultFormStep(s.id)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{
                        background: done ? "#22c55e" : active ? "#0c3a24" : "#f3f4f6",
                        color: done || active ? "#fff" : "#9ca3af",
                      }}
                    >
                      {done ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        s.id
                      )}
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: active ? "#0c3a24" : done ? "#22a06b" : "#9ca3af" }}
                    >
                      {s.label}
                    </span>
                  </button>
                  {!isLast && (
                    <div
                      className="w-8 h-px mx-2 rounded-full"
                      style={{ background: done ? "#22c55e" : "#e5e7eb" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!selectedVisit?.id ? (
          <div className="cf-card" style={{ textAlign: "center", padding: 48 }}>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Selecione um paciente na lista para iniciar a consulta.
            </p>
          </div>
        ) : (
          <div ref={detailsPanelRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {consultFormStep === 1 && (
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

            {consultFormStep === 2 && (
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
                retakeVitals={retakeVitals}
                setRetakeVitals={setRetakeVitals}
              />
            )}

            {consultFormStep === 3 && (
              <DoctorConsultationDiagnosisStep
                isFollowUpConsultation={isFollowUpConsultation}
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

            {consultFormStep === 4 && (
              <DoctorConsultationPlanStep
                isFollowUpConsultation={isFollowUpConsultation}
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

            {consultFormStep === consultationSteps.length && (
              <DoctorConsultationFinishStep
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
