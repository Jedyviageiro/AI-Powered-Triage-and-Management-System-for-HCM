import { useCallback, useState } from "react";
import { api } from "../../../lib/api";
import {
  buildDoctorFinishPayload,
  getDoctorFinishOutcomeMeta,
  saveAndFinishDoctorConsultation,
} from "../doctor-operations/doctorFinishOperations";
import {
  explainDoctorLabResult,
  generateDoctorQuestionnaire,
  requestDoctorAiSuggestion,
} from "../doctor-operations/doctorAiOperations";
import {
  prepareDoctorQueueVisit,
  reopenDoctorFollowupVisit,
  resetDoctorFollowupToWaiting,
} from "../doctor-operations/doctorVisitOperations";
import {
  buildDoctorCancelledSampleCollection,
  buildDoctorLabExamUpdate,
  buildDoctorSampleCollectionReturn,
  validateAndBuildDoctorLabOrder,
} from "../doctor-operations/doctorLabPlanOperations";
import { clearDoctorConsultationWorkspace } from "../doctor-operations/doctorVisitState";

const buildDoctorPlanPersistencePayload = ({ planDraft, selectedVisit, overrides = {} }) => ({
  likely_diagnosis:
    overrides.likely_diagnosis ?? planDraft?.likely_diagnosis ?? selectedVisit?.likely_diagnosis ?? "",
  clinical_reasoning:
    overrides.clinical_reasoning ??
    planDraft?.clinical_reasoning ??
    selectedVisit?.clinical_reasoning ??
    "",
  prescription_text:
    overrides.prescription_text ??
    planDraft?.prescription_text ??
    selectedVisit?.prescription_text ??
    "",
  disposition_plan:
    overrides.disposition_plan ?? planDraft?.disposition_plan ?? selectedVisit?.disposition_plan ?? "",
  disposition_reason:
    overrides.disposition_reason ??
    planDraft?.disposition_reason ??
    selectedVisit?.disposition_reason ??
    "",
  follow_up_when:
    overrides.follow_up_when ?? planDraft?.follow_up_when ?? selectedVisit?.follow_up_when ?? "",
  follow_up_instructions:
    overrides.follow_up_instructions ??
    planDraft?.follow_up_instructions ??
    selectedVisit?.follow_up_instructions ??
    "",
  follow_up_return_if:
    overrides.follow_up_return_if ??
    planDraft?.follow_up_return_if ??
    selectedVisit?.follow_up_return_if ??
    "",
  no_charge_chronic:
    overrides.no_charge_chronic ??
    planDraft?.no_charge_chronic ??
    selectedVisit?.no_charge_chronic ??
    false,
  no_charge_reason:
    overrides.no_charge_reason ?? planDraft?.no_charge_reason ?? selectedVisit?.no_charge_reason ?? "",
  return_visit_date:
    overrides.return_visit_date ??
    planDraft?.return_visit_date ??
    selectedVisit?.return_visit_date ??
    "",
  return_visit_reason:
    overrides.return_visit_reason ??
    planDraft?.return_visit_reason ??
    selectedVisit?.return_visit_reason ??
    "",
  lab_requested:
    overrides.lab_requested ?? planDraft?.lab_requested ?? selectedVisit?.lab_requested ?? false,
  lab_exam_type:
    overrides.lab_exam_type ?? planDraft?.lab_exam_type ?? selectedVisit?.lab_exam_type ?? "",
  lab_sample_type:
    overrides.lab_sample_type ?? planDraft?.lab_sample_type ?? selectedVisit?.lab_sample_type ?? "",
  lab_tests: overrides.lab_tests ?? planDraft?.lab_tests ?? selectedVisit?.lab_tests ?? "",
  lab_sample_collected_at:
    overrides.lab_sample_collected_at ??
    planDraft?.lab_sample_collected_at ??
    selectedVisit?.lab_sample_collected_at ??
    "",
  lab_result_text:
    overrides.lab_result_text ?? planDraft?.lab_result_text ?? selectedVisit?.lab_result_text ?? "",
  lab_result_json:
    overrides.lab_result_json ?? planDraft?.lab_result_json ?? selectedVisit?.lab_result_json ?? null,
  lab_result_status:
    overrides.lab_result_status ??
    planDraft?.lab_result_status ??
    selectedVisit?.lab_result_status ??
    "",
  lab_result_ready_at:
    overrides.lab_result_ready_at ??
    planDraft?.lab_result_ready_at ??
    selectedVisit?.lab_result_ready_at ??
    "",
  hospital_status:
    overrides.hospital_status ?? planDraft?.hospital_status ?? selectedVisit?.hospital_status ?? "",
  vital_status:
    overrides.vital_status ?? planDraft?.vital_status ?? selectedVisit?.vital_status ?? "",
  is_bedridden:
    overrides.is_bedridden ?? planDraft?.is_bedridden ?? selectedVisit?.is_bedridden ?? false,
  inpatient_unit:
    overrides.inpatient_unit ?? planDraft?.inpatient_unit ?? selectedVisit?.inpatient_unit ?? "",
  inpatient_bed:
    overrides.inpatient_bed ?? planDraft?.inpatient_bed ?? selectedVisit?.inpatient_bed ?? "",
  discharged_at:
    overrides.discharged_at ?? planDraft?.discharged_at ?? selectedVisit?.discharged_at ?? "",
  death_note: overrides.death_note ?? selectedVisit?.death_note ?? "",
  doctor_questionnaire_json:
    overrides.doctor_questionnaire_json ??
    selectedVisit?.doctor_questionnaire_json ??
    null,
  accepted:
    overrides.accepted ??
    !!(planDraft?.accepted || selectedVisit?.plan_accepted_at || selectedVisit?.accepted),
});

export function useDoctorConsultationActions(args) {
  const {
    me,
    queue,
    safeSet,
    showPopup,
    loadQueue,
    openVisit,
    selectedVisit,
    setSelectedVisit,
    setErr,
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
    followUpTimeWithinShift,
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
  } = args;

  const [savingPlan, setSavingPlan] = useState(false);

  const searchFromTopNav = useCallback(async () => {
    const q = topNavSearch.trim();
    if (!q) {
      safeSet(() => setErr("Escreva um nome para pesquisar."));
      return;
    }
    safeSet(() => {
      setErr("");
      setSavingPlan(true);
    });
    try {
      const patients = await api.searchPatients(q);
      const list = Array.isArray(patients) ? patients : [];
      if (list.length === 0) {
        safeSet(() => setErr("Nenhum paciente encontrado com esse nome."));
        return;
      }
      const first = list[0];
      const row = (Array.isArray(queue) ? queue : []).find(
        (visit) => Number(visit?.patient_id) === Number(first?.id)
      );
      if (!row?.id) {
        safeSet(() => setErr("Paciente encontrado, mas sem visita ativa na fila."));
        return;
      }
      safeSet(() => setActiveView("consultationForm"));
      await openVisit(row.id, row);
      setTimeout(() => {
        detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setSavingPlan(false));
    }
  }, [detailsPanelRef, openVisit, queue, safeSet, setActiveView, setErr, topNavSearch]);

  const finishConsultation = useCallback(async () => {
    if (!selectedVisit?.id) return;
    const finishedVisitId = Number(selectedVisit.id);
    const etaDate = currentLabEtaPreview?.readyAtISO
      ? new Date(currentLabEtaPreview.readyAtISO)
      : null;
    const etaLabel =
      etaDate && !Number.isNaN(etaDate.getTime())
        ? etaDate.toLocaleString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;
    if (selectedVisit?.status === "WAITING_DOCTOR") {
      try {
        const started = await api.startConsultation(selectedVisit.id);
        safeSet(() => setSelectedVisit(started || selectedVisit));
      } catch (e) {
        safeSet(() =>
          setErr(e.message || "Não foi possível iniciar a consulta antes de finalizar.")
        );
        return;
      }
    }
    if (finishMissingFields.length > 0) {
      safeSet(() =>
        setErr(`Não é possível finalizar a consulta. Falta: ${finishMissingFields.join(", ")}.`)
      );
      return;
    }

    safeSet(() => setErr(""));
    try {
      const payload = buildDoctorFinishPayload({
        planDraft,
        currentLabEtaPreview,
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
      });
      const finishResponse = await saveAndFinishDoctorConsultation({
        visitId: selectedVisit.id,
        payload,
      });
      safeSet(() => {
        setQueue((prev) =>
          (Array.isArray(prev) ? prev : []).filter((visit) => Number(visit?.id) !== finishedVisitId)
        );
        setLabPendingRequests((prev) =>
          (Array.isArray(prev) ? prev : []).filter((visit) => Number(visit?.id) !== finishedVisitId)
        );
        clearDoctorConsultationWorkspace({
          setSelectedVisit,
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
        });
        const outcomeMeta = getDoctorFinishOutcomeMeta({ finishResponse, etaLabel });
        if (outcomeMeta) showPopup(outcomeMeta.level, outcomeMeta.title, outcomeMeta.message);
      });
      await loadQueue();
    } catch (e) {
      safeSet(() => setErr(e.message));
    }
  }, [
    buildFollowUpInstructionsText,
    buildFollowUpReasonText,
    complaintQuestions,
    currentLabEtaPreview,
    finishMissingFields,
    followUpDiagnosisEvolution,
    followUpPrescriptionDecision,
    followUpRuleMeta,
    followUpShiftWindow,
    isClinicalReturnVisit,
    labOrderConfirmed,
    labOrderDraft,
    loadQueue,
    planAccepted,
    planDraft,
    previousDiagnosis,
    previousPrescription,
    questionnaireAnswers,
    questionnaireExtraNote,
    resolvedFollowUpRuleKey,
    retakeVitals,
    returnVisitCount,
    returnVisitDates,
    safeSet,
    sampleCollectionDraft,
    selectedFollowUpTime,
    selectedRoomCode,
    selectedVisit,
    setAiResult,
    setAiSuggestionOpen,
    setErr,
    setLabPendingRequests,
    setPatientDetails,
    setPatientHistory,
    setPlanAccepted,
    setPlanDraft,
    setQuestionnaireAnswers,
    setQuestionnaireExtraNote,
    setQuestionnaireQuestions,
    setQueue,
    setSelectedVisit,
    setTriage,
    shouldShowSampleCollectionStage,
    showPopup,
    triage,
    useAIQuestionnaire,
  ]);

  const askDoctorAI = useCallback(async () => {
    if (!selectedVisit?.id) return;
    safeSet(() => {
      setErr("");
      setAiLoading(true);
      setAiResult(null);
      setAiSuggestionOpen(true);
    });
    try {
      const { res, persisted } = await requestDoctorAiSuggestion({
        selectedVisit,
        hasGeneratedAiSuggestion,
        triage,
        complaintQuestions,
        questionnaireAnswers,
        useAIQuestionnaire,
        questionnaireExtraNote,
        retakeVitals,
        ageYears: args.calculateAgeYears(patientDetails?.birth_date),
        planDraft,
        previousConsultation,
        previousClinicalSnapshot,
        currentClinicalSnapshot,
        followUpComparisonRows,
        isClinicalReturnVisit,
        resolvedFollowUpRuleKey,
        followUpRuleMeta,
        selectedReturnDate: args.selectedReturnDate,
        selectedFollowUpTime,
        followUpShiftWindow,
        followUpTimeWithinShift,
        previousDiagnosis,
        followUpDiagnosisEvolution,
        previousPrescription,
        followUpPrescriptionDecision,
        labOrderDraft,
        labRequestSupport,
        pendingLabVisits,
        currentLabEtaPreview,
        labOrderConfirmed,
        shouldShowSampleCollectionStage,
        sampleCollectionDraft,
      });
      safeSet(() => {
        setAiResult(res);
        if (isFollowUpConsultation) {
          const suggestedEvolution = String(
            res?.follow_up_support?.diagnosis_evolution || ""
          ).trim();
          const suggestedCurrentDiagnosis = String(
            res?.follow_up_support?.current_diagnosis || ""
          ).trim();
          const suggestedPrescriptionDecision = String(
            res?.follow_up_support?.prescription_decision || ""
          ).trim();
          const suggestedFinalDecision = String(
            res?.follow_up_support?.final_decision || ""
          ).trim();

          if (suggestedEvolution && !followUpDiagnosisEvolution) {
            setFollowUpDiagnosisEvolution(suggestedEvolution);
          }
          if (suggestedCurrentDiagnosis && !String(planDraft?.likely_diagnosis || "").trim()) {
            updatePlanField("likely_diagnosis", suggestedCurrentDiagnosis);
          }
          if (suggestedPrescriptionDecision && !followUpPrescriptionDecision) {
            setFollowUpPrescriptionDecision(suggestedPrescriptionDecision);
          }
          if (
            suggestedFinalDecision &&
            suggestedFinalDecision !== "LAB_ONLY" &&
            !String(planDraft?.disposition_plan || "").trim()
          ) {
            updatePlanField("disposition_plan", suggestedFinalDecision);
          }
        }
        if (persisted) setSelectedVisit(persisted);
      });
    } catch (e) {
      safeSet(() => setErr(e.message));
      safeSet(() => setAiSuggestionOpen(false));
    } finally {
      safeSet(() => setAiLoading(false));
    }
  }, [
    args,
    complaintQuestions,
    currentClinicalSnapshot,
    currentLabEtaPreview,
    followUpComparisonRows,
    followUpDiagnosisEvolution,
    followUpPrescriptionDecision,
    followUpRuleMeta,
    followUpShiftWindow,
    followUpTimeWithinShift,
    hasGeneratedAiSuggestion,
    isClinicalReturnVisit,
    isFollowUpConsultation,
    labOrderConfirmed,
    labOrderDraft,
    labRequestSupport,
    patientDetails?.birth_date,
    pendingLabVisits,
    planDraft,
    previousClinicalSnapshot,
    previousConsultation,
    previousDiagnosis,
    previousPrescription,
    questionnaireAnswers,
    questionnaireExtraNote,
    resolvedFollowUpRuleKey,
    safeSet,
    sampleCollectionDraft,
    selectedFollowUpTime,
    selectedVisit,
    setAiLoading,
    setAiResult,
    setAiSuggestionOpen,
    setErr,
    setFollowUpDiagnosisEvolution,
    setFollowUpPrescriptionDecision,
    setSelectedVisit,
    shouldShowSampleCollectionStage,
    triage,
    updatePlanField,
    useAIQuestionnaire,
  ]);

  const attendPatientFromQueue = useCallback(
    async (visitId, previewVisit = null) => {
      if (!visitId) return;
      const row =
        (previewVisit && Number(previewVisit.id) === Number(visitId) ? previewVisit : null) ||
        queueRowsForView.find((visit) => Number(visit.id) === Number(visitId)) ||
        filteredQueue.find((visit) => Number(visit.id) === Number(visitId)) ||
        null;
      if (!row) {
        const message = "Paciente ainda não está pronto para atendimento médico.";
        safeSet(() => setErr(message));
        showPopup("warning", "Atenção", message);
        return;
      }
      try {
        await prepareDoctorQueueVisit({ visitId, row, meId: me?.id, loadQueue });
      } catch (e) {
        safeSet(() => setErr(e.message));
        showPopup(
          e.message?.includes("atribu") ? "warning" : "error",
          e.message?.includes("atribu") ? "Atenção" : "Erro",
          e.message || "Não foi possível iniciar a consulta."
        );
        return;
      }
      safeSet(() => setActiveView("consultationForm"));
      const refreshedPreview =
        (Array.isArray(queue) ? queue : []).find(
          (visit) => Number(visit?.id) === Number(visitId)
        ) || row;
      await openVisit(visitId, refreshedPreview);
      safeSet(() => setConsultFormStep(1));
      setTimeout(() => {
        detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    },
    [
      detailsPanelRef,
      filteredQueue,
      loadQueue,
      me?.id,
      openVisit,
      queue,
      queueRowsForView,
      safeSet,
      setActiveView,
      setConsultFormStep,
      setErr,
      showPopup,
    ]
  );

  const openLabTrackingFlow = useCallback(
    async (row) => {
      if (!row?.id) return;
      safeSet(() => setActiveView("consultationForm"));
      await openVisit(row.id, row);
      const shouldAutoOpenCollection = String(row?.workflow_label || "").toUpperCase() === "COLETA";
      safeSet(() => {
        setConsultFormStep(4);
        setHighlightLabOrderCard(true);
        setAutoOpenSampleCollectionModal(shouldAutoOpenCollection);
      });
      setTimeout(() => {
        detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    },
    [
      detailsPanelRef,
      openVisit,
      safeSet,
      setActiveView,
      setAutoOpenSampleCollectionModal,
      setConsultFormStep,
      setHighlightLabOrderCard,
    ]
  );

  const createNewConsultationFromFollowup = useCallback(
    async (row) => {
      if (!row?.id) return;
      try {
        await resetDoctorFollowupToWaiting(row.id);
        showPopup(
          "success",
          "Nova consulta criada",
          "Paciente devolvido ao fluxo normal de triagem."
        );
        await loadQueue();
      } catch (e) {
        showPopup("warning", "Atenção", e?.message || "Não foi possível criar nova consulta.");
      }
    },
    [loadQueue, showPopup]
  );

  const openScheduledReevaluation = useCallback(
    async (visitId, previewVisit = null, meta = null) => {
      if (!visitId) return;
      const sourceMeta = meta || previewVisit || null;
      let preview =
        previewVisit && Number(previewVisit?.id) === Number(visitId)
          ? previewVisit
          : queueRowsForView.find((visit) => Number(visit?.id) === Number(visitId)) ||
            filteredQueue.find((visit) => Number(visit?.id) === Number(visitId)) ||
            sourceMeta;
      safeSet(() => {
        setErr("");
        setActiveView("consultationForm");
      });
      try {
        preview = await reopenDoctorFollowupVisit({ visitId, preview, sourceMeta, loadQueue });
      } catch (e) {
        safeSet(() => setErr(e.message || "Não foi possível preparar a reavaliação."));
      }
      await openVisit(visitId, {
        ...(preview || sourceMeta || {}),
        is_followup_visit: true,
      });
      safeSet(() => {
        setReevaluationContext(buildReevaluationContext(sourceMeta || preview));
        setConsultFormStep(1);
      });
      setTimeout(() => {
        detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    },
    [
      buildReevaluationContext,
      detailsPanelRef,
      filteredQueue,
      loadQueue,
      openVisit,
      queueRowsForView,
      safeSet,
      setActiveView,
      setConsultFormStep,
      setErr,
      setReevaluationContext,
    ]
  );

  const updateLabExamType = useCallback(
    (examType) => {
      const { nextPlanDraft, nextLabOrderDraft, nextSampleCollectionDraft } =
        buildDoctorLabExamUpdate({
          examType,
          planDraft,
          pendingLabVisits,
          labPendingRequests,
          queue,
          LAB_RETURN_COLLECTION_RULES,
          toISODate,
          estimateExamReadyMeta,
          countQueuedExamsOnSameMachine,
          findLabExamLabel,
        });
      setPlanDraft(nextPlanDraft);
      setLabOrderConfirmed(false);
      setLabOrderDraft(nextLabOrderDraft);
      setSampleCollectionDraft(nextSampleCollectionDraft);
      setSampleCollectionModalOpen(false);
      setPlanAccepted(false);
    },
    [
      LAB_RETURN_COLLECTION_RULES,
      countQueuedExamsOnSameMachine,
      estimateExamReadyMeta,
      findLabExamLabel,
      labPendingRequests,
      pendingLabVisits,
      planDraft,
      queue,
      setLabOrderConfirmed,
      setLabOrderDraft,
      setPlanAccepted,
      setPlanDraft,
      setSampleCollectionDraft,
      setSampleCollectionModalOpen,
      toISODate,
    ]
  );

  const confirmLabOrder = useCallback(() => {
    try {
      const { summary, resolvedClinicalReason } = validateAndBuildDoctorLabOrder({
        planDraft,
        labOrderDraft,
        labRequestSupport,
      });
      const nextPlanDraft = { ...planDraft, lab_tests: summary, lab_requested: true };
      setPlanDraft(nextPlanDraft);
      setLabOrderDraft((prev) => ({ ...prev, clinicalReason: resolvedClinicalReason }));
      setLabOrderConfirmed(true);
      if (selectedVisit?.id) {
        api
          .saveVisitMedicalPlan(
            selectedVisit.id,
            buildDoctorPlanPersistencePayload({
              planDraft: nextPlanDraft,
              selectedVisit,
              overrides: {
                lab_requested: true,
                lab_tests: summary,
              },
            })
          )
          .catch((error) => {
            setErr(error?.message || "Nao foi possivel enviar o pedido ao laboratorio.");
          });
      }
      if (selectedLabProtocol?.sameDayCollection && !selectedLabCollectionRule) {
        setSampleCollectionModalOpen(true);
      }
      setErr("");
    } catch (e) {
      setErr(e.message);
    }
  }, [
    labOrderDraft,
    labRequestSupport,
    planDraft,
    selectedLabCollectionRule,
    selectedLabProtocol,
    setErr,
    setLabOrderConfirmed,
    setLabOrderDraft,
    setPlanDraft,
    setSampleCollectionModalOpen,
  ]);

  const autoScheduleSampleCollectionReturn = useCallback(() => {
    const result = buildDoctorSampleCollectionReturn({
      planDraft,
      examKey: String(planDraft?.lab_exam_type || "").toUpperCase(),
      LAB_RETURN_COLLECTION_RULES,
      findLabExamLabel,
      toISODate,
    });
    if (!result) return;
    setReturnVisitCount(result.returnVisitCount);
    setReturnVisitDates(result.returnVisitDates);
    setPlanDraft(result.nextPlanDraft);
    setLabOrderConfirmed(false);
    setSampleCollectionModalOpen(false);
    setPlanAccepted(false);
  }, [
    LAB_RETURN_COLLECTION_RULES,
    findLabExamLabel,
    planDraft,
    setLabOrderConfirmed,
    setPlanAccepted,
    setPlanDraft,
    setReturnVisitCount,
    setReturnVisitDates,
    setSampleCollectionModalOpen,
    toISODate,
  ]);

  const cancelSampleCollectionRequest = useCallback(() => {
    const nextPlanDraft = buildDoctorCancelledSampleCollection({ planDraft });
    setPlanDraft(nextPlanDraft);
    setLabOrderConfirmed(false);
    setSampleCollectionModalOpen(false);
    setPlanAccepted(false);
    if (selectedVisit?.id) {
      api
        .saveVisitMedicalPlan(
          selectedVisit.id,
          buildDoctorPlanPersistencePayload({
            planDraft: nextPlanDraft,
            selectedVisit,
            overrides: {
              lab_requested: false,
              lab_exam_type: "",
              lab_tests: "",
              lab_sample_collected_at: "",
              lab_result_text: "",
              lab_result_status: "",
              lab_result_ready_at: "",
              lab_result_json: null,
            },
          })
        )
        .catch(() => {});
    }
  }, [planDraft, selectedVisit, setLabOrderConfirmed, setPlanAccepted, setPlanDraft, setSampleCollectionModalOpen, setErr]);

  const updateQuestionAnswer = useCallback(
    (question, answer) => {
      setQuestionnaireAnswers((prev) => ({ ...(prev || {}), [question]: answer }));
      setPlanAccepted(false);
    },
    [setPlanAccepted, setQuestionnaireAnswers]
  );

  const generateQuestionnaireQuestions = useCallback(async () => {
    if (!selectedVisit?.id) return;
    setQuestionnaireLoading(true);
    setQuestionnaireNotice("");
    try {
      const result = await generateDoctorQuestionnaire({
        selectedVisit,
        hasGeneratedQuestionnaire: args.hasGeneratedQuestionnaire,
        triage,
        ageYears: args.calculateAgeYears(patientDetails?.birth_date),
        planDraft,
        pendingLabVisits,
        currentLabEtaPreview,
        questionnaireAnswers,
        questionnaireExtraNote,
        retakeVitals,
        currentClinicalSnapshot,
        labOrderDraft,
        labOrderConfirmed,
        shouldShowSampleCollectionStage,
        sampleCollectionDraft,
        fallbackComplaintQuestions,
        normalizeQuestions,
      });
      if (result?.generatedQuestions) {
        setQuestionnaireQuestions(result.generatedQuestions);
        setUseAIQuestionnaire(true);
      }
      if (result?.notice) {
        const persistedFailed =
          result.generatedQuestions && !result.persisted && result.source !== "existing";
        setQuestionnaireNotice(
          persistedFailed
            ? `${result.notice} (não foi possível guardar no servidor agora)`
            : result.notice
        );
      }
      if (result?.persisted) setSelectedVisit(result.persisted);
    } catch (e) {
      setErr(e.message);
    } finally {
      setQuestionnaireLoading(false);
    }
  }, [
    args,
    currentLabEtaPreview,
    fallbackComplaintQuestions,
    labOrderConfirmed,
    labOrderDraft,
    normalizeQuestions,
    patientDetails?.birth_date,
    pendingLabVisits,
    planDraft,
    questionnaireAnswers,
    questionnaireExtraNote,
    retakeVitals,
    sampleCollectionDraft,
    selectedVisit,
    setErr,
    setQuestionnaireLoading,
    setQuestionnaireNotice,
    setQuestionnaireQuestions,
    setSelectedVisit,
    setUseAIQuestionnaire,
    shouldShowSampleCollectionStage,
    triage,
  ]);

  const openLabResult = useCallback(
    async (row) => {
      if (!row?.id) return;
      setLabResultModal({
        open: true,
        row,
        loading: true,
        explanation: "",
        error: "",
      });
      try {
        const explanation = await explainDoctorLabResult({ row, getLabSampleTypeByExam });
        setLabResultModal((prev) => ({
          ...prev,
          loading: false,
          explanation,
          error: "",
        }));
      } catch {
        setLabResultModal((prev) => ({
          ...prev,
          loading: false,
          explanation: "",
          error: "Não foi possível gerar explicação da IA para este resultado agora.",
        }));
      }
    },
    [getLabSampleTypeByExam, setLabResultModal]
  );

  return {
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
  };
}
