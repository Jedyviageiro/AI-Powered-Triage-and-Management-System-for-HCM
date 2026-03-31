import { api } from "../../../lib/api";

export const buildDoctorAiSuggestionPayload = ({
  ageYears,
  triage,
  selectedVisit,
  useAIQuestionnaire,
  complaintQuestions,
  questionnaireAnswers,
  questionnaireExtraNote,
  planDraft,
  previousConsultation,
  previousClinicalSnapshot,
  currentClinicalSnapshot,
  followUpComparisonRows,
  isClinicalReturnVisit,
  resolvedFollowUpRuleKey,
  followUpRuleMeta,
  selectedReturnDate,
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
}) => ({
  age_years: ageYears,
  chief_complaint: triage?.chief_complaint || "",
  clinical_notes: currentClinicalSnapshot?.clinical_notes || triage?.clinical_notes || "",
  temperature: currentClinicalSnapshot?.temperature ?? null,
  heart_rate: currentClinicalSnapshot?.heart_rate ?? null,
  respiratory_rate: currentClinicalSnapshot?.respiratory_rate ?? null,
  oxygen_saturation: currentClinicalSnapshot?.oxygen_saturation ?? null,
  weight: currentClinicalSnapshot?.weight ?? null,
  priority: selectedVisit?.priority ?? null,
  questionnaire_answers: useAIQuestionnaire
    ? complaintQuestions
        .map((q) => ({ question: q, answer: String(questionnaireAnswers[q] || "").trim() }))
        .filter((item) => item.answer)
    : [],
  questionnaire_extra_note: useAIQuestionnaire
    ? String(questionnaireExtraNote || "").trim() || null
    : null,
  doctor_likely_diagnosis: String(planDraft?.likely_diagnosis || "").trim() || null,
  doctor_clinical_reasoning: String(planDraft?.clinical_reasoning || "").trim() || null,
  doctor_prescription_text: String(planDraft?.prescription_text || "").trim() || null,
  follow_up_comparison_context: previousConsultation
    ? {
        is_scheduled_follow_up: true,
        previous_visit_id: previousConsultation?.id || previousConsultation?.visit_id || null,
        previous_visit_date: previousConsultation?.arrival_time || null,
        previous_chief_complaint: previousClinicalSnapshot?.chief_complaint || null,
        previous_notes: previousClinicalSnapshot?.clinical_notes || null,
        current_chief_complaint: currentClinicalSnapshot?.chief_complaint || null,
        current_notes: currentClinicalSnapshot?.clinical_notes || null,
        vital_growth_comparison: followUpComparisonRows.map((row) => ({
          metric: row.label,
          previous: row.previous,
          current: row.current,
          delta: row.delta,
          unit: row.unit,
        })),
      }
    : null,
  follow_up_context: isClinicalReturnVisit
    ? {
        should_schedule: true,
        rule_key: resolvedFollowUpRuleKey || null,
        rule_label: followUpRuleMeta?.label || null,
        rule_description: followUpRuleMeta?.description || null,
        scheduled_date: selectedReturnDate || null,
        scheduled_time: selectedFollowUpTime || null,
        doctor_shift_window: followUpShiftWindow || null,
        within_shift: selectedFollowUpTime ? followUpTimeWithinShift : null,
        previous_diagnosis: previousDiagnosis || null,
        current_diagnosis: String(planDraft?.likely_diagnosis || "").trim() || null,
        diagnosis_evolution: followUpDiagnosisEvolution || null,
        prescription_present: !!String(planDraft?.prescription_text || "").trim(),
        previous_prescription: previousPrescription || null,
        prescription_decision: followUpPrescriptionDecision || null,
        current_follow_up_reason: String(planDraft?.return_visit_reason || "").trim() || null,
      }
    : null,
  lab_request_context: planDraft?.lab_requested
    ? {
        exam_type: String(planDraft?.lab_exam_type || "").trim() || null,
        exam_details: String(planDraft?.lab_tests || "").trim() || null,
        requested_because: String(labOrderDraft?.clinicalReason || "").trim() || null,
        request_examples: labRequestSupport.examples,
        trigger_matches: labRequestSupport.matches.map((rule) => ({
          exam_type: rule.examType,
          trigger: rule.triggerLabel,
          example: rule.example,
        })),
        requested_at: planDraft?.lab_sample_collected_at || new Date().toISOString(),
        queue_pending_count: pendingLabVisits.length,
        lab_operation_window: "07:30-20:00",
        estimated_turnaround_minutes: currentLabEtaPreview?.etaMin ?? null,
        estimated_ready_at: currentLabEtaPreview?.readyAtISO ?? null,
      }
    : null,
});

export const persistDoctorAiSuggestion = async ({
  visitId,
  planDraft,
  useAIQuestionnaire,
  triage,
  complaintQuestions,
  questionnaireAnswers,
  questionnaireExtraNote,
  res,
  labOrderDraft,
  labOrderConfirmed,
  shouldShowSampleCollectionStage,
  sampleCollectionDraft,
  retakeVitals,
  resolvedFollowUpRuleKey,
  followUpRuleMeta,
  selectedFollowUpTime,
  followUpShiftWindow,
  followUpComparisonRows,
  previousDiagnosis,
  followUpDiagnosisEvolution,
  previousPrescription,
  followUpPrescriptionDecision,
  selectedVisit,
}) =>
  api.saveVisitMedicalPlan(visitId, {
    ...planDraft,
    doctor_questionnaire_json: {
      locale: "pt-MZ",
      source: useAIQuestionnaire ? "ai" : "manual",
      chief_complaint: triage?.chief_complaint || "",
      questions: useAIQuestionnaire ? complaintQuestions : [],
      answers: useAIQuestionnaire ? questionnaireAnswers : {},
      extra_note: useAIQuestionnaire ? String(questionnaireExtraNote || "").trim() : "",
      retake_vitals: {
        temperature: String(retakeVitals?.temperature || "").trim() || null,
        heart_rate: String(retakeVitals?.heart_rate || "").trim() || null,
        respiratory_rate: String(retakeVitals?.respiratory_rate || "").trim() || null,
        oxygen_saturation: String(retakeVitals?.oxygen_saturation || "").trim() || null,
        weight: String(retakeVitals?.weight || "").trim() || null,
      },
      ai_suggestion: {
        generated_at: new Date().toISOString(),
        summary: res?.summary || "",
        likely_diagnosis: res?.likely_diagnosis || "",
        clinical_reasoning: res?.clinical_reasoning || "",
        differential_diagnoses: Array.isArray(res?.differential_diagnoses)
          ? res.differential_diagnoses
          : [],
      },
      lab_order: {
        ...labOrderDraft,
        confirmed: !!labOrderConfirmed,
        exam_type: String(planDraft?.lab_exam_type || "").trim() || null,
      },
      sample_collection: shouldShowSampleCollectionStage
        ? {
            ...sampleCollectionDraft,
            protocol_exam: String(planDraft?.lab_exam_type || "").trim() || null,
          }
        : null,
      follow_up_rule_key: resolvedFollowUpRuleKey || null,
      follow_up_rule_label: followUpRuleMeta?.label || null,
      follow_up_scheduled_time: selectedFollowUpTime || null,
      follow_up_shift_window: followUpShiftWindow || null,
      follow_up_comparison_rows: followUpComparisonRows,
      follow_up_diagnosis_previous: previousDiagnosis || null,
      follow_up_diagnosis_evolution: followUpDiagnosisEvolution || null,
      follow_up_prescription_previous: previousPrescription || null,
      follow_up_prescription_decision: followUpPrescriptionDecision || null,
    },
    accepted: !!selectedVisit?.plan_accepted_at,
  });

export const buildDoctorQuestionnairePayload = ({
  ageYears,
  chiefComplaint,
  triage,
  currentClinicalSnapshot,
  selectedVisit,
  planDraft,
  pendingLabVisits,
  currentLabEtaPreview,
}) => ({
  age_years: ageYears,
  chief_complaint: chiefComplaint,
  clinical_notes: currentClinicalSnapshot?.clinical_notes || triage?.clinical_notes || "",
  temperature: currentClinicalSnapshot?.temperature ?? null,
  heart_rate: currentClinicalSnapshot?.heart_rate ?? null,
  respiratory_rate: currentClinicalSnapshot?.respiratory_rate ?? null,
  oxygen_saturation: currentClinicalSnapshot?.oxygen_saturation ?? null,
  weight: currentClinicalSnapshot?.weight ?? null,
  priority: selectedVisit?.priority ?? null,
  lab_request_context: planDraft?.lab_requested
    ? {
        exam_type: String(planDraft?.lab_exam_type || "").trim() || null,
        exam_details: String(planDraft?.lab_tests || "").trim() || null,
        requested_at: planDraft?.lab_sample_collected_at || new Date().toISOString(),
        queue_pending_count: pendingLabVisits.length,
        lab_operation_window: "07:30-20:00",
        estimated_turnaround_minutes: currentLabEtaPreview?.etaMin ?? null,
        estimated_ready_at: currentLabEtaPreview?.readyAtISO ?? null,
      }
    : null,
  generate_questions_only: true,
});

export const persistGeneratedQuestionnaire = async ({
  visitId,
  planDraft,
  generatedQuestions,
  source,
  triage,
  questionnaireAnswers,
  questionnaireExtraNote,
  retakeVitals,
  labOrderDraft,
  labOrderConfirmed,
  shouldShowSampleCollectionStage,
  sampleCollectionDraft,
  selectedVisit,
}) =>
  api.saveVisitMedicalPlan(visitId, {
    ...planDraft,
    doctor_questionnaire_json: {
      locale: "pt-MZ",
      source,
      chief_complaint: triage?.chief_complaint || "",
      questions: generatedQuestions,
      answers: questionnaireAnswers || {},
      extra_note: String(questionnaireExtraNote || "").trim(),
      retake_vitals: {
        temperature: String(retakeVitals.temperature || "").trim() || null,
        heart_rate: String(retakeVitals.heart_rate || "").trim() || null,
        respiratory_rate: String(retakeVitals.respiratory_rate || "").trim() || null,
        oxygen_saturation: String(retakeVitals.oxygen_saturation || "").trim() || null,
        weight: String(retakeVitals.weight || "").trim() || null,
      },
      lab_order: {
        ...labOrderDraft,
        confirmed: !!labOrderConfirmed,
        exam_type: String(planDraft?.lab_exam_type || "").trim() || null,
      },
      sample_collection: shouldShowSampleCollectionStage
        ? {
            ...sampleCollectionDraft,
            protocol_exam: String(planDraft?.lab_exam_type || "").trim() || null,
          }
        : null,
      generated_at: new Date().toISOString(),
    },
    accepted: !!selectedVisit?.plan_accepted_at,
  });

export const requestDoctorAiSuggestion = async ({
  selectedVisit,
  hasGeneratedAiSuggestion,
  triage,
  complaintQuestions,
  questionnaireAnswers,
  useAIQuestionnaire,
  questionnaireExtraNote,
  retakeVitals,
  ageYears,
  patientDetails,
  planDraft,
  previousConsultation,
  previousClinicalSnapshot,
  currentClinicalSnapshot,
  followUpComparisonRows,
  isClinicalReturnVisit,
  resolvedFollowUpRuleKey,
  followUpRuleMeta,
  selectedReturnDate,
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
}) => {
  if (!selectedVisit?.id) throw new Error("Consulta inválida.");
  if (hasGeneratedAiSuggestion) {
    throw new Error("A sugestão da IA já foi gerada para esta consulta.");
  }
  if (selectedVisit.status !== "IN_CONSULTATION") {
    throw new Error("Inicie a consulta antes de usar a IA.");
  }
  if (!triage?.chief_complaint) {
    throw new Error("Não há dados de triagem suficientes para pedir sugestão da IA.");
  }
  const answeredCount = (Array.isArray(complaintQuestions) ? complaintQuestions : []).filter((q) =>
    String(questionnaireAnswers?.[q] || "").trim()
  ).length;
  if (useAIQuestionnaire && answeredCount === 0 && !String(questionnaireExtraNote || "").trim()) {
    throw new Error(
      "Responda o questionário (ou adicione informação extra) antes de pedir sugestão da IA."
    );
  }

  const res = await api.aiDoctorSuggest(
    buildDoctorAiSuggestionPayload({
      ageYears: ageYears ?? patientDetails?.birth_date,
      triage,
      selectedVisit,
      useAIQuestionnaire,
      complaintQuestions,
      questionnaireAnswers,
      questionnaireExtraNote,
      planDraft,
      previousConsultation,
      previousClinicalSnapshot,
      currentClinicalSnapshot,
      followUpComparisonRows,
      isClinicalReturnVisit,
      resolvedFollowUpRuleKey,
      followUpRuleMeta,
      selectedReturnDate,
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
    })
  );

  let persisted = null;
  try {
    persisted = await persistDoctorAiSuggestion({
      visitId: selectedVisit.id,
      planDraft,
      useAIQuestionnaire,
      triage,
      complaintQuestions,
      questionnaireAnswers,
      questionnaireExtraNote,
      res,
      labOrderDraft,
      labOrderConfirmed,
      shouldShowSampleCollectionStage,
      sampleCollectionDraft,
      retakeVitals,
      resolvedFollowUpRuleKey,
      followUpRuleMeta,
      selectedFollowUpTime,
      followUpShiftWindow,
      followUpComparisonRows,
      previousDiagnosis,
      followUpDiagnosisEvolution,
      previousPrescription,
      followUpPrescriptionDecision,
      selectedVisit,
    });
  } catch {
    persisted = null;
  }

  return { res, persisted };
};

export const generateDoctorQuestionnaire = async ({
  selectedVisit,
  hasGeneratedQuestionnaire,
  triage,
  ageYears,
  patientDetails,
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
}) => {
  if (!selectedVisit?.id) throw new Error("Consulta inválida.");
  if (hasGeneratedQuestionnaire) {
    return {
      generatedQuestions: null,
      source: "existing",
      notice: "Perguntas já foram geradas para esta consulta e ficaram salvas.",
      persisted: null,
    };
  }

  const chiefComplaint = String(triage?.chief_complaint || "").trim();
  if (!chiefComplaint) {
    throw new Error("Não há queixa principal da triagem para gerar perguntas.");
  }

  try {
    const res = await api.aiDoctorSuggest(
      buildDoctorQuestionnairePayload({
        ageYears: ageYears ?? patientDetails?.birth_date,
        chiefComplaint,
        triage,
        currentClinicalSnapshot,
        selectedVisit,
        planDraft,
        pendingLabVisits,
        currentLabEtaPreview,
      })
    );
    const generated = normalizeQuestions(
      res?.questions_to_clarify || res?.questions || res?.questionnaire_questions || []
    );
    const finalQuestions =
      generated.length > 0 ? generated : fallbackComplaintQuestions(chiefComplaint);
    const source = generated.length > 0 ? "ai" : "fallback";
    const notice =
      generated.length > 0 ? "Perguntas geradas por IA." : "Perguntas padrão carregadas.";

    let persisted = null;
    try {
      persisted = await persistGeneratedQuestionnaire({
        visitId: selectedVisit.id,
        planDraft,
        generatedQuestions: finalQuestions,
        source,
        triage,
        questionnaireAnswers,
        questionnaireExtraNote,
        retakeVitals,
        labOrderDraft,
        labOrderConfirmed,
        shouldShowSampleCollectionStage,
        sampleCollectionDraft,
        selectedVisit,
      });
    } catch {
      persisted = null;
    }

    return { generatedQuestions: finalQuestions, source, notice, persisted };
  } catch {
    return {
      generatedQuestions: fallbackComplaintQuestions(chiefComplaint),
      source: "fallback",
      notice: "Perguntas padrão carregadas.",
      persisted: null,
    };
  }
};

export const explainDoctorLabResult = async ({ row, getLabSampleTypeByExam }) => {
  if (!row?.id) throw new Error("Resultado inválido.");

  const [visit, triageData] = await Promise.all([
    api.getVisitById(row.id).catch(() => null),
    api.getTriageByVisitId(row.id).catch(() => null),
  ]);

  const complaint = String(
    triageData?.chief_complaint ||
      visit?.chief_complaint ||
      visit?.triage_chief_complaint ||
      row?.lab_exam_type ||
      "Revisão de resultado laboratorial"
  ).trim();

  const ai = await api.aiDoctorSuggest({
    explain_lab_result_only: true,
    lab_exam_type: String(row?.lab_exam_type || row?.lab_tests || "").trim() || null,
    lab_sample_type:
      String(row?.lab_sample_type || "").trim() ||
      getLabSampleTypeByExam(row?.lab_exam_type || row?.lab_tests) ||
      null,
    lab_result_text: String(row?.lab_result_text || "").trim(),
    lab_result_json: row?.lab_result_json || null,
    chief_complaint: complaint,
    clinical_notes:
      String(triageData?.clinical_notes || visit?.clinical_notes || "").trim() || null,
    priority: visit?.priority ?? row?.priority ?? null,
    doctor_likely_diagnosis: String(visit?.likely_diagnosis || "").trim() || null,
    doctor_clinical_reasoning: String(visit?.clinical_reasoning || "").trim() || null,
    doctor_prescription_text: String(visit?.prescription_text || "").trim() || null,
  });

  return (
    [
      String(ai?.summary || "").trim(),
      String(ai?.lab_explanation || "").trim(),
      Array.isArray(ai?.key_findings) && ai.key_findings.length
        ? `Achados-chave: ${ai.key_findings.join("; ")}`
        : "",
      Array.isArray(ai?.cautions) && ai.cautions.length ? `Alertas: ${ai.cautions.join("; ")}` : "",
      Array.isArray(ai?.suggested_next_steps) && ai.suggested_next_steps.length
        ? `Próximos passos sugeridos: ${ai.suggested_next_steps.join("; ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n") || "IA sem comentários adicionais para este resultado."
  );
};
