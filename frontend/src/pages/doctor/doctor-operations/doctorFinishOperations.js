import { api } from "../../../lib/api";
import { stripQuestionnaireBlock } from "../doctor-helpers/doctorHelpers";

export const buildDoctorFinishPayload = ({
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
}) => {
  const questionnaireText = complaintQuestions
    .map((q) => {
      const answer = (questionnaireAnswers[q] || "").trim();
      return answer ? `- ${q}\n  Resposta: ${answer}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const baseReasoning = stripQuestionnaireBlock(planDraft.clinical_reasoning);
  const mergedReasoning =
    useAIQuestionnaire && questionnaireText
      ? [`Questionário clínico:\n${questionnaireText}`, baseReasoning].filter(Boolean).join("\n\n")
      : baseReasoning;

  const normalizedReturnDates = (Array.isArray(returnVisitDates) ? returnVisitDates : [])
    .map((date) => String(date || "").trim())
    .filter(Boolean);

  const normalizedFollowUpRuleKey = isClinicalReturnVisit ? resolvedFollowUpRuleKey : "";
  const normalizedFollowUpTime = isClinicalReturnVisit
    ? selectedFollowUpTime
    : planDraft.follow_up_when;
  const mergedReturnReason = isClinicalReturnVisit
    ? buildFollowUpReasonText(normalizedFollowUpRuleKey, planDraft.return_visit_reason)
    : String(planDraft.return_visit_reason || "").trim();
  const mergedFollowUpInstructions = isClinicalReturnVisit
    ? buildFollowUpInstructionsText({
        ruleKey: normalizedFollowUpRuleKey,
        date: normalizedReturnDates[0] || "",
        time: normalizedFollowUpTime,
        shiftWindow: followUpShiftWindow,
        currentInstructions: planDraft.follow_up_instructions,
      })
    : String(planDraft.follow_up_instructions || "").trim();

  return {
    ...planDraft,
    lab_result_ready_at: planDraft?.lab_requested
      ? planDraft.lab_result_ready_at || currentLabEtaPreview?.readyAtISO || null
      : planDraft.lab_result_ready_at,
    clinical_reasoning: mergedReasoning,
    follow_up_when: normalizedFollowUpTime,
    follow_up_instructions: mergedFollowUpInstructions,
    return_visit_date:
      planDraft.disposition_plan === "RETURN_VISIT"
        ? normalizedReturnDates[0] || ""
        : planDraft.return_visit_date,
    return_visit_reason: mergedReturnReason,
    inpatient_bed: selectedRoomCode || planDraft.inpatient_bed || "",
    doctor_questionnaire_json: {
      locale: "pt-MZ",
      source: useAIQuestionnaire ? "ai" : "manual",
      chief_complaint: triage?.chief_complaint || "",
      questions: useAIQuestionnaire ? complaintQuestions : [],
      answers: useAIQuestionnaire ? questionnaireAnswers : {},
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
      follow_up_rule_key: normalizedFollowUpRuleKey || null,
      follow_up_rule_label: followUpRuleMeta?.label || null,
      follow_up_scheduled_time: normalizedFollowUpTime || null,
      follow_up_shift_window: followUpShiftWindow || null,
      follow_up_rule_applied: isClinicalReturnVisit,
      follow_up_diagnosis_previous: previousDiagnosis || null,
      follow_up_diagnosis_evolution: followUpDiagnosisEvolution || null,
      follow_up_prescription_previous: previousPrescription || null,
      follow_up_prescription_decision: followUpPrescriptionDecision || null,
      return_visit_count: planDraft.disposition_plan === "RETURN_VISIT" ? returnVisitCount : 0,
      return_visit_dates:
        planDraft.disposition_plan === "RETURN_VISIT" ? normalizedReturnDates : [],
      assigned_room_code: selectedRoomCode || null,
      generated_at: new Date().toISOString(),
    },
    accepted: !!planAccepted,
  };
};

export const saveAndFinishDoctorConsultation = async ({ visitId, payload }) => {
  await api.saveVisitMedicalPlan(visitId, payload);
  return api.finishVisit(visitId);
};

export const getDoctorFinishOutcomeMeta = ({ finishResponse, etaLabel }) => {
  if (finishResponse?.hold_by_lab) {
    return {
      level: "warning",
      title: "Pedido enviado ao laboratório",
      message: `O pedido foi enviado ao técnico de laboratório.${etaLabel ? ` Previsão de retorno: ${etaLabel}.` : ""}`,
    };
  }

  if (finishResponse?.pending_lab_after_discharge) {
    return {
      level: "warning",
      title: "Pedido enviado ao laboratório",
      message: `A consulta foi finalizada e o pedido foi enviado ao laboratório.${etaLabel ? ` Previsão de retorno: ${etaLabel}.` : ""}`,
    };
  }

  return null;
};
