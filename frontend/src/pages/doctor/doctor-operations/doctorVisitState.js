import {
  buildTriageFallback,
  inferFollowUpRuleKey,
  makeEmptyPlanDraft,
  normalizeQuestions,
  planFromVisit,
} from "../doctor-helpers/doctorHelpers";

export const resetDoctorVisitWorkspace = (setters) => {
  setters.setErr("");
  setters.setLoadingDetails(true);
  setters.setSelectedVisit(setters.previewVisit || null);
  setters.setReevaluationContext(null);
  setters.setTriage(null);
  setters.setPatientDetails(null);
  setters.setPatientHistory([]);
  setters.setAiResult(null);
  setters.setAiSuggestionOpen(false);
  setters.setPlanDraft(makeEmptyPlanDraft());
  setters.setPlanAccepted(false);
  setters.setQuestionnaireQuestions([]);
  setters.setQuestionnaireAnswers({});
  setters.setQuestionnaireExtraNote("");
  setters.setQuestionnaireNotice("");
  setters.setUseAIQuestionnaire(false);
  setters.setRetakeVitals({
    temperature: "",
    heart_rate: "",
    respiratory_rate: "",
    oxygen_saturation: "",
    weight: "",
  });
  setters.setReturnVisitCount(1);
  setters.setReturnVisitDates([""]);
  setters.setFollowUpRuleKey("");
  setters.setFollowUpDiagnosisEvolution("");
  setters.setFollowUpPrescriptionDecision("");
  setters.setSelectedRoomCode("");
  setters.setLabOrderDraft({
    priority: "",
    clinicalReason: "",
    specialInstructions: "",
  });
  setters.setLabOrderConfirmed(false);
  setters.setSampleCollectionDraft({
    collectedNow: false,
    collectionTime: "",
    collectorName: "",
    sampleCondition: "ADEQUADA",
    notes: "",
  });
  setters.setSampleCollectionModalOpen(false);
  setters.setAutoOpenSampleCollectionModal(false);
  setters.setHighlightLabOrderCard(false);
  setters.setConsultFormStep(1);
};

export const applyDoctorVisitBundleState = ({
  visit,
  previewVisit,
  patient,
  history,
  triage,
  setters,
}) => {
  setters.setSelectedVisit({
    ...visit,
    is_lab_followup: !!previewVisit?.is_lab_followup,
    lab_followup_note: previewVisit?.lab_followup_note || "",
  });

  const fallback = buildTriageFallback(previewVisit) || buildTriageFallback(visit);
  if (fallback) setters.setTriage(fallback);

  setters.setPlanDraft(planFromVisit(visit));
  setters.setPlanAccepted(!!visit?.plan_accepted_at);

  const questions = normalizeQuestions(visit?.doctor_questionnaire_json?.questions);
  setters.setQuestionnaireQuestions(questions);
  setters.setUseAIQuestionnaire(questions.length > 0);

  setters.setQuestionnaireAnswers(
    visit?.doctor_questionnaire_json?.answers &&
      typeof visit.doctor_questionnaire_json.answers === "object"
      ? visit.doctor_questionnaire_json.answers
      : visit?.doctor_questionnaire_json && typeof visit.doctor_questionnaire_json === "object"
        ? visit.doctor_questionnaire_json
        : {}
  );

  setters.setQuestionnaireExtraNote(String(visit?.doctor_questionnaire_json?.extra_note || ""));

  const savedLabOrder = visit?.doctor_questionnaire_json?.lab_order || {};
  const savedSampleCollection = visit?.doctor_questionnaire_json?.sample_collection || {};
  const savedRetakeVitals = visit?.doctor_questionnaire_json?.retake_vitals || {};

  setters.setLabOrderDraft({
    priority: String(savedLabOrder?.priority || ""),
    clinicalReason: String(savedLabOrder?.clinicalReason || ""),
    specialInstructions: String(savedLabOrder?.specialInstructions || ""),
  });
  setters.setLabOrderConfirmed(!!savedLabOrder?.confirmed);

  setters.setSampleCollectionDraft({
    collectedNow: !!savedSampleCollection?.collectedNow,
    collectionTime: String(savedSampleCollection?.collectionTime || ""),
    collectorName: String(savedSampleCollection?.collectorName || ""),
    sampleCondition: String(savedSampleCollection?.sampleCondition || "ADEQUADA"),
    notes: String(savedSampleCollection?.notes || ""),
  });

  setters.setRetakeVitals({
    temperature: String(savedRetakeVitals?.temperature ?? ""),
    heart_rate: String(savedRetakeVitals?.heart_rate ?? ""),
    respiratory_rate: String(savedRetakeVitals?.respiratory_rate ?? ""),
    oxygen_saturation: String(savedRetakeVitals?.oxygen_saturation ?? ""),
    weight: String(savedRetakeVitals?.weight ?? ""),
  });

  const firstReturnDate = String(visit?.return_visit_date || "").slice(0, 10);
  setters.setReturnVisitCount(firstReturnDate ? 1 : 1);
  setters.setReturnVisitDates([firstReturnDate || ""]);
  setters.setFollowUpRuleKey(
    String(
      visit?.doctor_questionnaire_json?.follow_up_rule_key ||
        inferFollowUpRuleKey({ planDraft: planFromVisit(visit), selectedVisit: visit })
    )
  );
  setters.setFollowUpDiagnosisEvolution(
    String(visit?.doctor_questionnaire_json?.follow_up_diagnosis_evolution || "")
  );
  setters.setFollowUpPrescriptionDecision(
    String(visit?.doctor_questionnaire_json?.follow_up_prescription_decision || "")
  );
  setters.setSelectedRoomCode(String(visit?.inpatient_bed || ""));
  setters.setPatientDetails(patient || null);
  setters.setPatientHistory(Array.isArray(history) ? history : []);
  setters.setTriage(triage || fallback);
};

export const clearDoctorConsultationWorkspace = (setters) => {
  setters.setSelectedVisit(null);
  setters.setTriage(null);
  setters.setPatientDetails(null);
  setters.setPatientHistory([]);
  setters.setAiResult(null);
  setters.setAiSuggestionOpen(false);
  setters.setPlanDraft(makeEmptyPlanDraft());
  setters.setPlanAccepted(false);
  setters.setQuestionnaireQuestions([]);
  setters.setQuestionnaireAnswers({});
  setters.setQuestionnaireExtraNote("");
};
