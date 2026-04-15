const geminiService = require("../services/geminiService");

const normalizeList = (value) => (Array.isArray(value) ? value : []);
const clip = (value, max = 220) => {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return "";
  return s.length <= max ? s : `${s.slice(0, max - 3).trim()}...`;
};

const normalizePrescriptionPlan = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      medication: item?.medication || item?.item || "",
      dosage: item?.dosage || "",
      route: item?.route || "",
      frequency: item?.frequency || "",
      duration: item?.duration || "",
      instructions: item?.instructions || item?.note || "",
    }))
    .filter((p) => p.medication || p.instructions);
};

const clipEnum = (value, allowed = []) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  return allowed.includes(normalized) ? normalized : "";
};

const normalizeWhoReferences = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      title: clip(item?.title || "", 140),
      url: clip(item?.url || "", 240),
      summary: clip(item?.summary || "", 280),
    }))
    .filter((item) => item.url);
};

const normalizeDoctorResult = (result = {}) => {
  const prescription_plan = normalizePrescriptionPlan(
    result.prescription_plan || result.prescription_suggestions
  );

  return {
    red_flag: !!result.red_flag,
    summary: clip(result.summary, 260),
    likely_diagnosis: clip(result.likely_diagnosis || result.primary_diagnosis || "", 160),
    clinical_reasoning: clip(result.clinical_reasoning, 280),
    differential_diagnoses: normalizeList(result.differential_diagnoses).slice(0, 3),
    suggested_tests: normalizeList(result.suggested_tests).slice(0, 4),
    suggested_management: normalizeList(result.suggested_management).slice(0, 4),
    prescription_plan: prescription_plan.slice(0, 4),
    follow_up:
      result.follow_up && typeof result.follow_up === "object"
        ? result.follow_up
        : { when: "", instructions: "", return_if: "" },
    disposition:
      result.disposition && typeof result.disposition === "object"
        ? result.disposition
        : { plan: "", reason: "" },
    chronic_no_charge:
      result.chronic_no_charge && typeof result.chronic_no_charge === "object"
        ? result.chronic_no_charge
        : { suggested: false, reason: "" },
    questions_to_clarify: normalizeList(result.questions_to_clarify).slice(0, 3),
    doctor_feedback:
      result.doctor_feedback && typeof result.doctor_feedback === "object"
        ? {
            step1_comment: clip(result.doctor_feedback.step1_comment || "", 260),
            step2_rectification: clip(result.doctor_feedback.step2_rectification || "", 260),
            step3_alternatives: normalizeList(result.doctor_feedback.step3_alternatives).slice(
              0,
              4
            ),
          }
        : {
            step1_comment: "",
            step2_rectification: "",
            step3_alternatives: [],
          },
    doctor_plan_alignment:
      result.doctor_plan_alignment && typeof result.doctor_plan_alignment === "object"
        ? {
            status: clip(result.doctor_plan_alignment.status || "", 40),
            distance_percent: Number.isFinite(Number(result.doctor_plan_alignment.distance_percent))
              ? Math.max(0, Math.min(100, Number(result.doctor_plan_alignment.distance_percent)))
              : null,
            rationale: clip(result.doctor_plan_alignment.rationale || "", 220),
            supportive_suggestion: clip(
              result.doctor_plan_alignment.supportive_suggestion || "",
              220
            ),
          }
        : {
            status: "",
            distance_percent: null,
            rationale: "",
            supportive_suggestion: "",
          },
    clinical_evolution:
      result.clinical_evolution && typeof result.clinical_evolution === "object"
        ? {
            status: clip(result.clinical_evolution.status || "", 40),
            summary: clip(result.clinical_evolution.summary || "", 220),
            symptom_trend: clip(result.clinical_evolution.symptom_trend || "", 180),
            vital_trend: clip(result.clinical_evolution.vital_trend || "", 180),
            growth_trend: clip(result.clinical_evolution.growth_trend || "", 180),
            concerns: normalizeList(result.clinical_evolution.concerns).slice(0, 4),
          }
        : {
            status: "",
            summary: "",
            symptom_trend: "",
            vital_trend: "",
            growth_trend: "",
            concerns: [],
          },
    follow_up_support:
      result.follow_up_support && typeof result.follow_up_support === "object"
        ? {
            diagnosis_evolution: clipEnum(result.follow_up_support.diagnosis_evolution, [
              "IMPROVED",
              "UNCHANGED",
              "WORSENED",
              "RESOLVED",
            ]),
            current_diagnosis: clip(result.follow_up_support.current_diagnosis || "", 180),
            prescription_decision: clipEnum(result.follow_up_support.prescription_decision, [
              "CONTINUE",
              "STOP",
              "CHANGE",
              "ADD",
            ]),
            prescription_adjustment: clip(
              result.follow_up_support.prescription_adjustment || "",
              220
            ),
            final_decision: clipEnum(result.follow_up_support.final_decision, [
              "HOME",
              "RETURN_VISIT",
              "ADMIT_URGENT",
              "REFER_SPECIALIST",
              "LAB_ONLY",
            ]),
            rationale: clip(result.follow_up_support.rationale || "", 220),
          }
        : {
            diagnosis_evolution: "",
            current_diagnosis: "",
            prescription_decision: "",
            prescription_adjustment: "",
            final_decision: "",
            rationale: "",
          },
    confidence: Number.isFinite(Number(result.confidence)) ? Number(result.confidence) : 0.5,
  };
};

const fallbackQuestionsByComplaint = (chiefComplaint = "") => {
  const c = String(chiefComplaint || "").toLowerCase();
  const base = [
    "O que está a sentir agora?",
    "Quando os sintomas começaram?",
    "Tem dor? Onde e com que intensidade?",
    "Teve febre? Há quantos dias?",
  ];
  if (/(tosse|respira|falta de ar)/.test(c)) {
    return [...base, "Tem falta de ar ao falar ou caminhar?", "A tosse tem catarro ou sangue?"];
  }
  if (/(vomit|diarre|abd|barriga)/.test(c)) {
    return [...base, "Teve vómitos ou diarreia?", "Está a conseguir beber líquidos?"];
  }
  if (/(dor de cabeça|cefale|convuls)/.test(c)) {
    return [
      ...base,
      "Teve desmaio, convulsão ou rigidez no pescoço?",
      "A dor piora com luz ou barulho?",
    ];
  }
  return [...base, "Há outro sintoma importante que queira relatar?"];
};

const buildDoctorFallbackSuggestion = (body = {}) => {
  const complaint = clip(body?.chief_complaint || "", 140);
  const doctorDiagnosis = clip(body?.doctor_likely_diagnosis || "", 160);
  const doctorReasoning = clip(body?.doctor_clinical_reasoning || "", 220);
  const doctorPrescription = clip(body?.doctor_prescription_text || "", 220);

  return normalizeDoctorResult({
    summary:
      doctorDiagnosis ||
      complaint ||
      "Sem resposta da IA no momento; manter avaliacao clinica e conduta local.",
    likely_diagnosis: doctorDiagnosis,
    clinical_reasoning:
      doctorReasoning ||
      "A IA nao respondeu nesta tentativa. Considere os sinais vitais, a evolucao clinica e o exame objetivo para confirmar a conduta.",
    suggested_management: [
      "Reavaliar sinais vitais e estado geral.",
      "Confirmar se ha criterios de urgencia antes da alta.",
      "Seguir protocolo local e julgamento clinico.",
    ],
    questions_to_clarify: fallbackQuestionsByComplaint(body?.chief_complaint).slice(0, 5),
    prescription_plan: doctorPrescription
      ? [
          {
            medication: "",
            dosage: "",
            route: "",
            frequency: "",
            duration: "",
            instructions: doctorPrescription,
          },
        ]
      : [],
    confidence: 0.2,
  });
};

const buildLabExplanationFallback = (body = {}) => ({
  summary: "Explicacao indisponivel no momento.",
  lab_explanation:
    "A IA nao conseguiu interpretar este resultado agora. Reveja o texto do exame, correlacione com o quadro clinico e siga o protocolo local.",
  key_findings: [],
  cautions: ["Validar manualmente os achados laboratoriais antes da decisao clinica."],
  suggested_next_steps: ["Repetir a tentativa mais tarde ou interpretar manualmente o resultado."],
});

const doctorAssistAI = async (req, res) => {
  try {
    const {
      age_years,
      chief_complaint,
      clinical_notes,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      priority,
      questionnaire_answers,
      questionnaire_extra_note,
      doctor_likely_diagnosis,
      doctor_clinical_reasoning,
      doctor_prescription_text,
      follow_up_comparison_context,
      follow_up_context,
      lab_request_context,
      generate_questions_only,
      explain_lab_result_only,
      lab_exam_type,
      lab_sample_type,
      lab_result_text,
      lab_result_json,
    } = req.body;

    const isLabExplanationOnly = !!explain_lab_result_only;
    if (!isLabExplanationOnly && !chief_complaint) {
      return res.status(400).json({ error: "chief_complaint é obrigatório" });
    }
    if (isLabExplanationOnly && !String(lab_result_text || "").trim()) {
      return res
        .status(400)
        .json({ error: "lab_result_text é obrigatório para explicação de exame" });
    }

    const hasQuestionnaireAnswer =
      Array.isArray(questionnaire_answers) &&
      questionnaire_answers.some(
        (qa) => String(qa?.question || "").trim() && String(qa?.answer || "").trim()
      );
    const hasExtraNote = !!String(questionnaire_extra_note || "").trim();
    const hasDoctorContext =
      !!String(doctor_likely_diagnosis || "").trim() ||
      !!String(doctor_clinical_reasoning || "").trim() ||
      !!String(doctor_prescription_text || "").trim();
    const isQuestionGenerationOnly = !!generate_questions_only;
    if (isLabExplanationOnly) {
      const labResult = await geminiService.labResultExplanationSuggestion({
        chief_complaint,
        clinical_notes,
        priority,
        doctor_likely_diagnosis,
        doctor_clinical_reasoning,
        doctor_prescription_text,
        lab_exam_type,
        lab_sample_type,
        lab_result_text,
        lab_result_json,
      });
      return res.json({
        disclaimer:
          "Explicação gerada por IA. Não substitui decisão médica. Validar por protocolo local.",
        summary: clip(labResult?.summary || "", 260),
        lab_explanation: clip(labResult?.explanation || "", 1200),
        key_findings: normalizeList(labResult?.key_findings).slice(0, 6),
        cautions: normalizeList(labResult?.cautions).slice(0, 6),
        suggested_next_steps: normalizeList(labResult?.suggested_next_steps).slice(0, 6),
      });
    }
    if (
      !isQuestionGenerationOnly &&
      !hasQuestionnaireAnswer &&
      !hasExtraNote &&
      !hasDoctorContext
    ) {
      return res.status(400).json({
        error:
          "Informe dados clínicos (questionário, nota extra ou plano médico) antes de solicitar a sugestão da IA.",
      });
    }

    const payload = {
      age_years,
      chief_complaint,
      clinical_notes,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      priority,
      questionnaire_answers,
      questionnaire_extra_note,
      doctor_likely_diagnosis,
      doctor_clinical_reasoning,
      doctor_prescription_text,
      follow_up_comparison_context,
      follow_up_context,
      lab_request_context,
    };

    const result = isQuestionGenerationOnly
      ? await geminiService.doctorQuestionsSuggestion(payload)
      : await geminiService.doctorDiagnosisSuggestion(payload);
    const normalizedResult = normalizeDoctorResult(result);

    return res.json({
      disclaimer:
        "Sugestão gerada por IA. Não substitui avaliação/decisão médica. Validar por protocolo local.",
      who_references: normalizeWhoReferences(result?.who_references).slice(0, 3),
      who_grounding_used: !!result?.who_grounding_used,
      ...normalizedResult,
    });
  } catch (err) {
    const isQuestionGenerationOnly = !!req.body?.generate_questions_only;
    const rawMessage = String(err?.message || "");
    const isQuotaError =
      err?.status === 429 || err?.code === 429 || /quota|resource_exhausted|429/i.test(rawMessage);

    if (isQuotaError && isQuestionGenerationOnly) {
      return res.json({
        disclaimer:
          "IA indisponível no momento por limite de quota. A mostrar perguntas base para continuar a consulta.",
        ...normalizeDoctorResult({
          questions_to_clarify: fallbackQuestionsByComplaint(req.body?.chief_complaint).slice(0, 5),
          confidence: 0.2,
        }),
      });
    }

    if (isQuotaError) {
      const isLabExplanationOnly = !!req.body?.explain_lab_result_only;
      if (isLabExplanationOnly) {
        return res.json({
          disclaimer:
            "A IA atingiu o limite de quota nesta tentativa. A mostrar uma orientacao de contingencia.",
          ...buildLabExplanationFallback(req.body),
        });
      }

      if (!isQuestionGenerationOnly) {
        return res.json({
          disclaimer:
            "A IA atingiu o limite de quota nesta tentativa. A mostrar uma sugestao de contingencia com base nos dados ja registados.",
          who_references: [],
          who_grounding_used: false,
          ...buildDoctorFallbackSuggestion(req.body),
        });
      }

      return res.status(429).json({
        error:
          "IA temporariamente indisponível por limite de quota. Tente novamente em alguns segundos.",
      });
    }

    if (geminiService.isTemporarilyUnavailableAiError?.(err) && isQuestionGenerationOnly) {
      return res.json({
        disclaimer:
          "IA temporariamente indisponível por alta procura. A mostrar perguntas base para continuar a consulta.",
        ...normalizeDoctorResult({
          questions_to_clarify: fallbackQuestionsByComplaint(req.body?.chief_complaint).slice(0, 5),
          confidence: 0.2,
        }),
      });
    }

    if (geminiService.isTemporarilyUnavailableAiError?.(err)) {
      const isLabExplanationOnly = !!req.body?.explain_lab_result_only;
      if (isLabExplanationOnly) {
        return res.json({
          disclaimer:
            "A IA esta temporariamente indisponivel por alta procura. A mostrar uma orientacao de contingencia.",
          ...buildLabExplanationFallback(req.body),
        });
      }

      return res.json({
        disclaimer:
          "A IA esta temporariamente indisponivel por alta procura. A mostrar uma sugestao de contingencia com base nos dados ja registados.",
        who_references: [],
        who_grounding_used: false,
        ...buildDoctorFallbackSuggestion(req.body),
      });
    }

    if (geminiService.isRetryableAiError?.(err)) {
      const isLabExplanationOnly = !!req.body?.explain_lab_result_only;
      if (isLabExplanationOnly) {
        return res.json({
          disclaimer:
            "A IA esta temporariamente indisponivel por falha de ligacao. A mostrar uma orientacao de contingencia.",
          ...buildLabExplanationFallback(req.body),
        });
      }

      return res.json({
        disclaimer:
          "A IA esta temporariamente indisponivel devido a uma falha de ligacao. A mostrar uma sugestao de contingencia com base nos dados ja registados.",
        who_references: [],
        who_grounding_used: false,
        ...buildDoctorFallbackSuggestion(req.body),
      });
    }

    console.error("AI DOCTOR ERROR:", err);
    return res.status(500).json({
      error: "Erro ao gerar sugestão de diagnóstico por IA",
      debug: { message: err.message },
    });
  }
};

module.exports = { doctorAssistAI };
