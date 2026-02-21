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
    confidence: Number.isFinite(Number(result.confidence))
      ? Number(result.confidence)
      : 0.5,
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
    return [...base, "Teve desmaio, convulsão ou rigidez no pescoço?", "A dor piora com luz ou barulho?"];
  }
  return [...base, "Há outro sintoma importante que queira relatar?"];
};

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
      generate_questions_only,
    } = req.body;

    if (!chief_complaint) {
      return res.status(400).json({ error: "chief_complaint é obrigatório" });
    }

    const hasQuestionnaireAnswer =
      Array.isArray(questionnaire_answers) &&
      questionnaire_answers.some(
        (qa) =>
          String(qa?.question || "").trim() &&
          String(qa?.answer || "").trim()
      );
    const hasExtraNote = !!String(questionnaire_extra_note || "").trim();
    const isQuestionGenerationOnly = !!generate_questions_only;
    if (!isQuestionGenerationOnly && !hasQuestionnaireAnswer && !hasExtraNote) {
      return res.status(400).json({
        error:
          "Responda o questionário clínico (ou informe um dado extra) antes de solicitar a sugestão da IA.",
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
    };

    const result = isQuestionGenerationOnly
      ? await geminiService.doctorQuestionsSuggestion(payload)
      : await geminiService.doctorDiagnosisSuggestion(payload);

    return res.json({
      disclaimer:
        "Sugestão gerada por IA. Não substitui avaliação/decisão médica. Validar por protocolo local.",
      ...normalizeDoctorResult(result),
    });
  } catch (err) {
    const isQuestionGenerationOnly = !!req.body?.generate_questions_only;
    const rawMessage = String(err?.message || "");
    const isQuotaError =
      err?.status === 429 ||
      err?.code === 429 ||
      /quota|resource_exhausted|429/i.test(rawMessage);

    if (isQuotaError && isQuestionGenerationOnly) {
      return res.json({
        disclaimer:
          "IA indisponível no momento por limite de quota. A mostrar perguntas base para continuar a consulta.",
        ...normalizeDoctorResult({
          questions_to_clarify: fallbackQuestionsByComplaint(
            req.body?.chief_complaint
          ).slice(0, 5),
          confidence: 0.2,
        }),
      });
    }

    if (isQuotaError) {
      return res.status(429).json({
        error:
          "IA temporariamente indisponível por limite de quota. Tente novamente em alguns segundos.",
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
