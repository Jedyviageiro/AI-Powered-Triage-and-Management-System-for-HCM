import { useCallback, useEffect, useMemo } from "react";
import {
  compareSnapshots,
  extractFollowUpTimeValue,
  findFollowUpRuleMeta,
  getCurrentConsultationSnapshot,
  getVisitClinicalSnapshot,
  inferFollowUpRuleKey,
  isTimeWithinShiftWindow,
} from "../doctor-helpers/doctorHelpers";

export function useDoctorConsultationState({
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
  labOrderConfirmed,
  labOrderDraft,
  sampleCollectionDraft,
  setConsultFormStep,
  setPlanDraft,
  setPlanAccepted,
  setReturnVisitCount,
  setReturnVisitDates,
}) {
  const hasTriageForConsult = useMemo(
    () =>
      !!(
        triage?.chief_complaint ||
        selectedVisit?.chief_complaint ||
        selectedVisit?.triage_chief_complaint ||
        selectedVisit?.triage?.chief_complaint
      ),
    [selectedVisit, triage]
  );

  const canStartWithoutTriage = useMemo(() => {
    const motive = String(selectedVisit?.visit_motive || "").toUpperCase();
    return !!(
      selectedVisit?.is_lab_followup ||
      motive === "LAB_SAMPLE_COLLECTION" ||
      motive === "LAB_RESULTS" ||
      String(selectedVisit?.return_visit_reason || "").trim() ||
      String(selectedVisit?.visit_motive_other || "").trim()
    );
  }, [selectedVisit]);

  const previousConsultation = useMemo(
    () =>
      (Array.isArray(patientHistory) ? patientHistory : [])
        .filter((entry) => Number(entry?.id || entry?.visit_id) !== Number(selectedVisit?.id))
        .filter((entry) => String(entry?.status || "").toUpperCase() === "FINISHED")
        .sort(
          (a, b) =>
            new Date(
              b?.consultation_ended_at || b?.finished_at || b?.updated_at || b?.arrival_time || 0
            )
            - new Date(
              a?.consultation_ended_at || a?.finished_at || a?.updated_at || a?.arrival_time || 0
            )
        )[0] || null,
    [patientHistory, selectedVisit?.id]
  );

  const previousClinicalSnapshot = useMemo(
    () => getVisitClinicalSnapshot(previousConsultation),
    [previousConsultation]
  );
  const currentClinicalSnapshot = useMemo(
    () => getCurrentConsultationSnapshot({ triage, retakeVitals }),
    [retakeVitals, triage]
  );
  const followUpComparisonRows = useMemo(
    () => compareSnapshots(previousClinicalSnapshot, currentClinicalSnapshot),
    [currentClinicalSnapshot, previousClinicalSnapshot]
  );

  useEffect(() => {
    if (
      activeView !== "consultationForm" ||
      consultFormStep !== 4 ||
      !autoOpenSampleCollectionModal
    )
      return;
    if (shouldShowSampleCollectionStage) {
      safeSet(() => {
        setSampleCollectionModalOpen(true);
        setAutoOpenSampleCollectionModal(false);
      });
      return;
    }
    const hasExamConfigured = !!String(planDraft?.lab_exam_type || "").trim();
    if (
      !planDraft?.lab_requested ||
      !hasExamConfigured ||
      !!selectedLabCollectionRule ||
      !selectedLabProtocol ||
      !selectedLabProtocol.sameDayCollection
    ) {
      safeSet(() => setAutoOpenSampleCollectionModal(false));
    }
  }, [
    activeView,
    autoOpenSampleCollectionModal,
    consultFormStep,
    planDraft?.lab_exam_type,
    planDraft?.lab_requested,
    safeSet,
    selectedLabCollectionRule,
    selectedLabProtocol,
    setAutoOpenSampleCollectionModal,
    setSampleCollectionModalOpen,
    shouldShowSampleCollectionStage,
  ]);

  const selectedReturnDate = String(
    returnVisitDates?.[0] || planDraft.return_visit_date || ""
  ).slice(0, 10);
  const selectedFollowUpTime = extractFollowUpTimeValue(planDraft.follow_up_when);
  const followUpShiftWindow = shiftStatus?.shift_window || "";
  const isClinicalReturnVisit =
    planDraft.disposition_plan === "RETURN_VISIT" && !selectedLabCollectionRule;

  const isFollowUpConsultation = useMemo(
    () =>
      !!(
        selectedVisit?.is_lab_followup ||
        selectedVisit?.return_visit_date ||
        String(selectedVisit?.return_visit_reason || "").trim()
      ),
    [selectedVisit]
  );

  const previousDiagnosis = String(previousConsultation?.likely_diagnosis || "").trim();
  const previousPrescription = String(previousConsultation?.prescription_text || "").trim();
  const currentComplaintSummary = String(
    questionnaireExtraNote ||
      triage?.chief_complaint ||
      selectedVisit?.chief_complaint ||
      selectedVisit?.triage_chief_complaint ||
      ""
  ).trim();

  const followUpGrowthRow = useMemo(
    () => followUpComparisonRows.find((row) => row.key === "weight") || null,
    [followUpComparisonRows]
  );
  const followUpGrowthSummary = followUpGrowthRow
    ? `Antes: ${followUpGrowthRow.previous ?? "-"} ${followUpGrowthRow.unit || ""} · Agora: ${
        followUpGrowthRow.current ?? "-"
      } ${followUpGrowthRow.unit || ""}`
    : "Sem comparação de crescimento disponível.";

  const inferredFollowUpRuleKey = useMemo(
    () => inferFollowUpRuleKey({ planDraft, selectedVisit }),
    [planDraft, selectedVisit]
  );
  const resolvedFollowUpRuleKey = followUpRuleKey || inferredFollowUpRuleKey;
  const followUpRuleMeta = findFollowUpRuleMeta(resolvedFollowUpRuleKey);
  const followUpTimeWithinShift = isTimeWithinShiftWindow(
    selectedFollowUpTime,
    followUpShiftWindow
  );

  const canFinish =
    !!selectedVisit?.id &&
    (selectedVisit.status === "IN_CONSULTATION" || selectedVisit.status === "WAITING_DOCTOR");

  const finishMissingFields = useMemo(() => {
    if (!canFinish) return [];
    const missing = [];
    const answeredCount = complaintQuestions.filter((q) =>
      String(questionnaireAnswers[q] || "").trim()
    ).length;
    if (useAIQuestionnaire && answeredCount === 0 && !String(questionnaireExtraNote || "").trim()) {
      missing.push("questionário clínico");
    }
    if (!String(planDraft.likely_diagnosis || "").trim()) missing.push("diagnóstico provável");
    if (!String(planDraft.clinical_reasoning || "").trim()) missing.push("justificativa clínica");
    if (!String(planDraft.prescription_text || "").trim()) missing.push("prescrição");
    if (
      isFollowUpConsultation &&
      previousDiagnosis &&
      !String(followUpDiagnosisEvolution || "").trim()
    ) {
      missing.push("evolução do diagnóstico");
    }
    if (
      isFollowUpConsultation &&
      previousPrescription &&
      !String(followUpPrescriptionDecision || "").trim()
    ) {
      missing.push("decisão sobre a prescrição");
    }
    if (!String(planDraft.disposition_plan || "").trim()) missing.push("destino do paciente");
    if (
      planDraft.disposition_plan === "REFER_SPECIALIST" &&
      !String(planDraft.disposition_reason || "").trim()
    ) {
      missing.push("especialista/departamento de referência");
    }
    if (planDraft.disposition_plan === "RETURN_VISIT") {
      const hasAnyReturnDate = (Array.isArray(returnVisitDates) ? returnVisitDates : []).some((d) =>
        String(d || "").trim()
      );
      if (!hasAnyReturnDate) missing.push("data de retorno");
      if (isClinicalReturnVisit) {
        if (!resolvedFollowUpRuleKey) missing.push("critério clínico do retorno");
        if (!selectedFollowUpTime) missing.push("hora do retorno");
        if (selectedFollowUpTime && !followUpTimeWithinShift)
          missing.push("hora do retorno dentro do turno");
      }
    }
    if (!!planDraft.lab_requested && !String(planDraft.lab_exam_type || "").trim()) {
      missing.push("tipo de exame laboratorial");
    }
    if (
      !!planDraft.lab_requested &&
      String(planDraft.lab_exam_type || "").toUpperCase() === "OUTRO" &&
      !String(planDraft.lab_tests || "").trim()
    ) {
      missing.push("detalhe do exame (outro)");
    }
    if (!!planDraft.lab_requested && !labOrderConfirmed) missing.push("confirmar pedido de exame");
    if (!!planDraft.lab_requested && !String(labOrderDraft.priority || "").trim()) {
      missing.push("prioridade do exame");
    }
    if (shouldShowSampleCollectionStage) {
      if (!String(sampleCollectionDraft.collectionTime || "").trim())
        missing.push("hora da colheita");
    }
    return missing;
  }, [
    canFinish,
    complaintQuestions,
    followUpDiagnosisEvolution,
    followUpPrescriptionDecision,
    isClinicalReturnVisit,
    isFollowUpConsultation,
    labOrderConfirmed,
    labOrderDraft,
    planDraft,
    previousDiagnosis,
    previousPrescription,
    questionnaireAnswers,
    questionnaireExtraNote,
    resolvedFollowUpRuleKey,
    returnVisitDates,
    sampleCollectionDraft,
    selectedFollowUpTime,
    shouldShowSampleCollectionStage,
    followUpTimeWithinShift,
    useAIQuestionnaire,
  ]);

  const canFinishStrict = canFinish && finishMissingFields.length === 0;
  const consultationSteps = useMemo(
    () => [
      { id: 1, label: "Resumo" },
      { id: 2, label: "Questionário" },
      { id: 3, label: "Diagnóstico" },
      { id: 4, label: "Plano" },
      { id: 5, label: "Fecho" },
    ],
    []
  );

  useEffect(() => {
    if (consultFormStep > consultationSteps.length) {
      setConsultFormStep(consultationSteps.length);
    }
  }, [consultFormStep, consultationSteps.length, setConsultFormStep]);

  const updatePlanField = useCallback(
    (field, value) => {
      setPlanDraft((prev) => ({ ...prev, [field]: value }));
      setPlanAccepted(false);
    },
    [setPlanAccepted, setPlanDraft]
  );

  const updateReturnVisitCount = useCallback(
    (countValue) => {
      const count = Math.max(1, Number(countValue) || 1);
      setReturnVisitCount(count);
      setReturnVisitDates((prev) => {
        const base = Array.isArray(prev) ? [...prev] : [];
        while (base.length < count) base.push("");
        return base.slice(0, count);
      });
      setPlanAccepted(false);
    },
    [setPlanAccepted, setReturnVisitCount, setReturnVisitDates]
  );

  const updateReturnVisitDateByIndex = useCallback(
    (index, value) => {
      setReturnVisitDates((prev) => {
        const base = Array.isArray(prev) && prev.length > 0 ? [...prev] : [""];
        while (base.length <= index) base.push("");
        base[index] = value;
        return base;
      });
      if (index === 0) {
        setPlanDraft((prev) => ({ ...prev, return_visit_date: value }));
      }
      setPlanAccepted(false);
    },
    [setPlanAccepted, setPlanDraft, setReturnVisitDates]
  );

  const buildFinishPayloadArgs = useMemo(
    () => ({
      selectedLabProtocol,
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
      followUpGrowthRow,
      followUpGrowthSummary,
      inferredFollowUpRuleKey,
      resolvedFollowUpRuleKey,
      followUpRuleMeta,
      followUpTimeWithinShift,
      finishMissingFields,
      canFinishStrict,
      consultationSteps,
      updatePlanField,
      updateReturnVisitCount,
      updateReturnVisitDateByIndex,
    }),
    [
      canFinishStrict,
      canStartWithoutTriage,
      consultationSteps,
      currentClinicalSnapshot,
      currentComplaintSummary,
      finishMissingFields,
      followUpComparisonRows,
      followUpGrowthRow,
      followUpGrowthSummary,
      followUpRuleMeta,
      followUpShiftWindow,
      followUpTimeWithinShift,
      hasTriageForConsult,
      inferredFollowUpRuleKey,
      isClinicalReturnVisit,
      isFollowUpConsultation,
      previousClinicalSnapshot,
      previousConsultation,
      previousDiagnosis,
      previousPrescription,
      resolvedFollowUpRuleKey,
      selectedFollowUpTime,
      selectedLabProtocol,
      selectedReturnDate,
      updatePlanField,
      updateReturnVisitCount,
      updateReturnVisitDateByIndex,
    ]
  );

  return buildFinishPayloadArgs;
}
