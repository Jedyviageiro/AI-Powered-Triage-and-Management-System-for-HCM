export const buildDoctorLabExamUpdate = ({
  planDraft,
  pendingLabVisits,
  labPendingRequests,
  queue,
  LAB_RETURN_COLLECTION_RULES,
  toISODate,
  estimateExamReadyMeta,
  countQueuedExamsOnSameMachine,
  findLabExamLabel,
}) => {
  const examKey = "MALARIA_RDT";
  const normalizedExamType = "MALARIA_RDT";
  const collectionRule = LAB_RETURN_COLLECTION_RULES[examKey] || null;
  const now = new Date();
  const suggestedDate = collectionRule
    ? (() => {
        const date = new Date(now);
        date.setDate(date.getDate() + Math.max(1, Number(collectionRule.offsetDays) || 1));
        return toISODate(date);
      })()
    : (() => {
        const { readyAt } = estimateExamReadyMeta({
          examType: normalizedExamType,
          requestedAt: now.toISOString(),
          pendingCount: Math.max(1, pendingLabVisits.length + 1),
          sameMachinePendingCount: countQueuedExamsOnSameMachine(normalizedExamType, labPendingRequests),
          hospitalTrafficCount: Math.max(
            0,
            (Array.isArray(queue) ? queue.length : 0) +
              (Array.isArray(labPendingRequests) ? labPendingRequests.length : 0)
          ),
        });
        return toISODate(readyAt);
      })();

  return {
    nextPlanDraft: {
      ...planDraft,
      lab_exam_type: normalizedExamType,
      lab_tests: examKey === "OUTRO" ? planDraft.lab_tests : "",
      return_visit_date: suggestedDate || planDraft.return_visit_date || "",
      return_visit_reason: collectionRule
        ? `Colheita de amostra para ${findLabExamLabel(normalizedExamType)}`
        : planDraft.return_visit_reason || "",
    },
    nextLabOrderDraft: {
      priority: "",
      clinicalReason: "",
      specialInstructions: "",
    },
    nextSampleCollectionDraft: {
      collectedNow: false,
      collectionTime: "",
      collectorName: "",
      sampleCondition: "ADEQUADA",
      notes: "",
    },
  };
};

export const validateAndBuildDoctorLabOrder = ({
  labOrderDraft,
  labRequestSupport = {},
}) => {
  const primarySupport = labRequestSupport?.primary || null;
  const requireClinicalReason = Boolean(labRequestSupport?.requireClinicalReason);

  if (!String(labOrderDraft.priority || "").trim()) {
    throw new Error("Defina a prioridade do exame.");
  }

  if (requireClinicalReason && !String(labOrderDraft.clinicalReason || "").trim() && !primarySupport) {
    throw new Error("Descreva o motivo clínico do exame.");
  }

  const resolvedClinicalReason =
    String(labOrderDraft.clinicalReason || "").trim() || primarySupport?.reasonTemplate || "";

  const summary = [
    "Exame solicitado: Teste Rapido de Malaria",
    `Prioridade: ${labOrderDraft.priority}`,
    resolvedClinicalReason
      ? `Motivo clínico: ${resolvedClinicalReason}`
      : "Motivo clínico: não informado",
    String(labOrderDraft.specialInstructions || "").trim()
      ? `Instruções especiais: ${labOrderDraft.specialInstructions}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    summary,
    resolvedClinicalReason,
  };
};

export const buildDoctorSampleCollectionReturn = ({
  planDraft,
  examKey,
  LAB_RETURN_COLLECTION_RULES,
  findLabExamLabel,
  toISODate,
}) => {
  const rule = LAB_RETURN_COLLECTION_RULES[String(examKey || "").toUpperCase()];
  if (!rule) return null;

  const examLabel = findLabExamLabel(examKey);
  const target = new Date();
  target.setDate(target.getDate() + Math.max(1, Number(rule.offsetDays) || 1));
  const suggestedDate = toISODate(target);
  const reasonText = `Colheita de amostra para ${examLabel}`;
  const instructions = `${rule.patientNotes} Motivo: ${reasonText}. Horário preferencial: ${rule.window}.`;

  return {
    returnVisitCount: 1,
    returnVisitDates: [suggestedDate],
    nextPlanDraft: {
      ...planDraft,
      disposition_plan: "RETURN_VISIT",
      disposition_reason: reasonText,
      return_visit_date: suggestedDate,
      return_visit_reason: reasonText,
      follow_up_when: `Manhã (${rule.window})`,
      follow_up_instructions: instructions,
      lab_requested: false,
      lab_sample_collected_at: "",
      lab_result_text: "",
      lab_result_status: "",
      lab_result_ready_at: "",
    },
  };
};

export const buildDoctorCancelledSampleCollection = ({ planDraft }) => ({
  ...planDraft,
  lab_requested: false,
  lab_exam_type: "",
  lab_tests: "",
  lab_sample_collected_at: "",
  lab_result_text: "",
  lab_result_status: "",
  lab_result_ready_at: "",
});
